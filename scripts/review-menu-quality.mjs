import fs from 'node:fs/promises';
import { loadCatalogs } from '../js/data/catalogs.js';
import { createNutritionService, ACTIVITY_FACTORS } from '../js/domain/nutrition.js';
import { createMenuPlanner } from '../js/domain/menu-planner.js';
import { preparationFamily } from '../js/domain/menu-generator.js';
import { mainMealSimilarity } from '../js/domain/menu-quality.js';
import { createInventoryUnitService } from '../js/domain/inventory-units.js';

const types = ['desayuno', 'media', 'comida', 'tarde', 'cena'];
const oldFetch = globalThis.fetch;
let catalog;
try {
  globalThis.fetch = async url => ({ok: true, json: async () => JSON.parse(await fs.readFile(url, 'utf8'))});
  catalog = await loadCatalogs({slotTypes: types, recoveryTags: ['calcium', 'vitamin_d', 'vitamin_c']});
} finally { globalThis.fetch = oldFetch; }
const nutrition = createNutritionService({getFood: () => catalog.foods, getFoodMeta: () => catalog.foodMeta, getEffectiveWeight: p => p.weight});
const units = createInventoryUnitService({getFood: () => catalog.foods, getFoodMeta: () => catalog.foodMeta, roundAmount: n => Math.round(n * 100) / 100});
const planner = createMenuPlanner({getRecipes: () => catalog.recipes, nutrition, toStockAmount: units.recipeToStockAmount});
const goals = ['maintain', 'fat_loss', 'muscle_gain', 'recomp'];
const shapes = [{sex: 'female', age: 60, height: 150, weight: 45}, {sex: 'male', age: 30, height: 195, weight: 115}];
const profile = {injury: false, autoPortions: true, followWeight: false, activity: 'sedentary', goal: 'maintain'};
const baseDay = types.map(type => catalog.recipes.find(recipe => recipe.type === type));
const structural = {bocadillo_pavo: 'bread', bocadillo_pavo_peq: 'bread', mini_pavo_tomate: 'bread', fajitas_pollo: 'tortilla', wrap_pavo: 'tortilla', tortitas_atun: 'oats'};
const result = {catalogVersion: catalog.catalogVersion, scaled: {days: 0, structuralChecks: 0, structuralChanges: 0, nonfinite: 0, examples: []}, weeks: {cycles: 0, complete: 0, repeatedBase: 0, adjacentMainRepeats: 0, meanMainSimilarity: 0, meanIngredients: 0, meanPreparations: 0, maxNewFamilies: 0, examples: []}};
result.portionImpact = [];
for (const [recipeId, foodId] of Object.entries(structural)) {
  const current = {...profile, ...shapes[0], goal: 'fat_loss'};
  const recipe = catalog.recipeById[recipeId], day = baseDay.map(base => base.type === recipe.type ? recipe : base);
  // Paired comparison of the SAME day with only the new ingredient policy disabled.
  const previousDay = day.map(item => ({...item, ingredients: item.ingredients.map(({keepBaseAmount, ...ingredient}) => ingredient)}));
  const before = nutrition.evaluateRecipePortions(previousDay, 0, current);
  const after = nutrition.evaluateRecipePortions(day, 0, current);
  const slot = types.indexOf(recipe.type);
  result.portionImpact.push({recipeId, foodId, syntheticProfile: current, beforeQuantity: before.portions[slot][foodId], afterQuantity: after.portions[slot][foodId],
    beforeDay: before.total, afterDay: after.total, deltaDay: Object.fromEntries(Object.keys(before.total).map(key => [key, after.total[key] - before.total[key]]))});
}
for (const goal of goals) for (const shape of shapes) for (const activity of Object.keys(ACTIVITY_FACTORS)) for (const session of [0, 600]) {
  const current = {...profile, ...shape, goal, activity};
  for (const recipe of catalog.recipes) {
    const day = baseDay.map(base => base.type === recipe.type ? recipe : base);
    const portions = nutrition.portionsForRecipes(day, session, current);
    result.scaled.days++;
    for (const usage of portions) if (Object.values(usage).some(amount => !Number.isFinite(amount) || amount <= 0)) result.scaled.nonfinite++;
    const foodId = structural[recipe.id];
    if (foodId) {
      result.scaled.structuralChecks++;
      const before = recipe.ingredients.find(item => item.id === foodId).rest, after = portions[types.indexOf(recipe.type)][foodId];
      if (before !== after) {
        result.scaled.structuralChanges++;
        if (result.scaled.examples.length < 6) result.scaled.examples.push({recipeId: recipe.id, foodId, base: before, adjusted: after, profile: current, session});
      }
    }
  }
}
const rng = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
for (const goal of goals) for (const shape of shapes) for (const seed of [11, 29]) for (const stocked of [false, true]) {
  const request = {start: '2026-11-02', asOf: '2026-11-02', profile: {...profile, ...shape, goal}, profileConfirmed: true,
    stock: stocked ? Object.fromEntries(['rice', 'chicken', 'tomato', 'skyr', 'bread', 'eggs'].map(id => [id, 1000])) : {}, rng: rng(seed)};
  let previous;
  for (const start of ['2026-11-02', '2026-11-23']) {
    const plan = planner.generate({...request, start, previousMenus: previous});
    result.weeks.cycles++;
    if (!plan.complete) continue;
    result.weeks.complete++;
    if (JSON.stringify(plan.menus[0]) === JSON.stringify(plan.menus[1]) && JSON.stringify(plan.menus[0]) === JSON.stringify(plan.menus[2])) result.weeks.repeatedBase++;
    const week = plan.menus[0].map(day => day.map(id => catalog.recipeById[id]));
    result.weeks.meanMainSimilarity += week.reduce((sum, day) => sum + mainMealSimilarity(day), 0) / 7;
    result.weeks.meanIngredients += new Set(week.flat().flatMap(recipe => recipe.ingredients.map(item => item.id))).size;
    result.weeks.meanPreparations += new Set(week.flat().map(preparationFamily)).size;
    for (let d = 1; d < 7; d++) for (const slot of [2, 4]) if (preparationFamily(week[d][slot]) === preparationFamily(week[d - 1][slot])) result.weeks.adjacentMainRepeats++;
    result.weeks.maxNewFamilies = Math.max(result.weeks.maxNewFamilies, plan.analysis.summary.newPreparations || 0);
    if (!previous && seed === 11 && !stocked) result.weeks.examples.push({goal, weight: shape.weight, menus: plan.menus[0], ingredients: new Set(week.flat().flatMap(recipe => recipe.ingredients.map(item => item.id))).size});
    previous = plan.menus;
  }
}
for (const key of ['meanMainSimilarity', 'meanIngredients', 'meanPreparations']) result.weeks[key] /= Math.max(1, result.weeks.complete);
const outputIndex = process.argv.indexOf('--output');
if (outputIndex >= 0) await fs.writeFile(process.argv[outputIndex + 1], JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({...result, weeks: {...result.weeks, examples: undefined}}, null, 2));
