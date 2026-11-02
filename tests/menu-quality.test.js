import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mainMealSimilarity, adjacentMainRepeats, spaceWeekMains } from '../js/domain/menu-quality.js';
import { loadCatalogs, validateCatalogDocuments } from '../js/data/catalogs.js';
import { createNutritionService, ACTIVITY_FACTORS } from '../js/domain/nutrition.js';
import { materializePlan, cleanPlanDetails } from '../js/domain/plan-details.js';
import { createMenuPlanner } from '../js/domain/menu-planner.js';

const types = ['desayuno', 'media', 'comida', 'tarde', 'cena'];
const read = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const foodDoc = await read('../data/foods.json'), recipeDoc = await read('../data/recipes.json');
const options = {slotTypes: types, recoveryTags: ['calcium', 'vitamin_d', 'vitamin_c']};
let catalog; const oldFetch = globalThis.fetch;
try {
  globalThis.fetch = async url => ({ok: true, json: async () => JSON.parse(await readFile(url, 'utf8'))});
  catalog = await loadCatalogs(options);
} finally { globalThis.fetch = oldFetch; }
const policies = {bocadillo_pavo: 'bread', bocadillo_pavo_peq: 'bread', mini_pavo_tomate: 'bread', fajitas_pollo: 'tortilla', wrap_pavo: 'tortilla', tortitas_atun: 'oats'};
const nutrition = createNutritionService({getFood: () => catalog.foods, getFoodMeta: () => catalog.foodMeta, getEffectiveWeight: p => p.weight});
const baseDay = types.map(type => catalog.recipes.find(recipe => recipe.type === type));
const profile = {sex: 'female', age: 60, height: 150, weight: 45, activity: 'sedentary', goal: 'fat_loss', autoPortions: true, injury: false, followWeight: false};

test('structural policies are explicit, limited to six reviewed recipes and strictly validated', () => {
  const actual = Object.fromEntries(recipeDoc.recipes.filter(recipe => recipe.ingredients.some(item => item.keepBaseAmount))
    .map(recipe => [recipe.id, recipe.ingredients.filter(item => item.keepBaseAmount).map(item => item.foodId)]));
  assert.deepEqual(actual, Object.fromEntries(Object.entries(policies).map(([id, food]) => [id, [food]])));
  for (const value of [false, 'true', 1, null]) {
    const broken = structuredClone(recipeDoc); broken.recipes[0].ingredients[0].keepBaseAmount = value;
    assert.throws(() => validateCatalogDocuments(foodDoc, broken, options), /incompatible/);
  }
});

test('all four goals and activity levels preserve sandwich covers, wrap covers and the egg-bound batter', () => {
  for (const goal of ['maintain', 'fat_loss', 'muscle_gain', 'recomp']) for (const activity of Object.keys(ACTIVITY_FACTORS)) {
    for (const weight of [45, 115]) for (const session of [0, 1200]) {
      const current = {...profile, goal, activity, weight};
      for (const [id, foodId] of Object.entries(policies)) {
        const recipe = catalog.recipeById[id], day = baseDay.map(item => item.type === recipe.type ? recipe : item);
        const usage = nutrition.portionsForRecipes(day, session, current)[types.indexOf(recipe.type)];
        assert.equal(usage[foodId], recipe.ingredients.find(item => item.id === foodId).rest, id);
      }
    }
  }
  const side = catalog.recipeById.tortilla_atun;
  const sideDay = baseDay.map(item => item.type === side.type ? side : item);
  assert.equal(nutrition.portionsForRecipes(sideDay, 0, profile)[4].bread, 1, 'ordinary bread accompaniments still scale');
});

test('completed amounts override culinary policy and disabling automatic portions keeps the entire base recipe', () => {
  const recipe = catalog.recipeById.bocadillo_pavo, day = baseDay.map(item => item.type === recipe.type ? recipe : item);
  const saved = Object.freeze({bread: 1, turkeySlice: 41.5, tomato: 80});
  assert.deepEqual(nutrition.portionsForRecipes(day, 3000, profile, undefined, [null, saved])[1], saved);
  const plain = nutrition.portionsForRecipes(day, 0, {...profile, autoPortions: false});
  day.forEach((item, slot) => assert.deepEqual(plain[slot], Object.fromEntries(item.ingredients.map(ingredient => [ingredient.id, ingredient.rest]))));
  assert.equal(nutrition.nutritionTarget(600, profile).protein, nutrition.nutritionTarget(0, profile).protein);
  assert.equal(nutrition.nutritionTarget(600, profile).fat, nutrition.nutritionTarget(0, profile).fat);
});

const recipe = (type, main) => ({id: type + main, type, ingredients: [{id: main, rest: 100}, {id: 'oliveoil', rest: 5}]});
const day = main => types.map(type => recipe(type, type === 'comida' || type === 'cena' ? main : type));
test('main-meal comparison ignores shared seasoning, not recipe origin or name', () => {
  const similar = day('chicken'); assert.equal(mainMealSimilarity(similar), 1);
  const different = day('chicken'); different[4] = recipe('cena', 'salmon');
  assert.equal(mainMealSimilarity(different), 0);
  assert.equal(mainMealSimilarity([recipe('media', 'chicken')]), 0);
});

test('the common planner prefers less similar mains when nutritional totals and preparation times are equal', () => {
  const common = day('chicken').map(item => ({...item, time: 20}));
  const alternate = {...recipe('cena', 'salmon'), time: 20};
  const recipes = [...common, alternate];
  const target = {calories: 2000, protein: 100, carb: 250, fat: 60};
  const service = createMenuPlanner({getRecipes: () => recipes, toStockAmount: (_, amount) => amount,
    nutrition: {nutritionTarget: () => target, getMacro: () => ({k: 400, p: 20, c: 50, f: 12}),
      evaluateRecipePortions: items => ({portions: items.map(item => Object.fromEntries(item.ingredients.map(i => [i.id, i.rest]))),
        total: {k: 2000, p: 100, c: 250, f: 60}, difference: {calories: 0, protein: 0, carb: 0, fat: 0}})}});
  const request = {start: '2026-11-02', asOf: '2026-11-02', profileConfirmed: true, profile};
  const plan = ids => ({start: request.start, menus: Array.from({length: 3}, () => Array.from({length: 7}, () => ids.slice()))});
  const same = service.evaluate(request, plan(common.map(item => item.id)));
  const varied = service.evaluate(request, plan(common.map(item => item.type === 'cena' ? alternate.id : item.id)));
  assert.equal(same.metrics.nutrition, varied.metrics.nutrition);
  assert.equal(same.metrics.mainMealSimilarity, 1); assert.equal(varied.metrics.mainMealSimilarity, 0);
  assert.ok(varied.score < same.score);
});

test('spacing complete days improves repetition without adding ingredients or changing recipe selections', () => {
  const week = ['a', 'a', 'a', 'b', 'b', 'c', 'c'].map(day), before = structuredClone(week);
  const next = spaceWeekMains(week);
  assert.ok(adjacentMainRepeats(next) < adjacentMainRepeats(week));
  assert.deepEqual(next.map(items => items.map(item => item.id).join('|')).sort(), week.map(items => items.map(item => item.id).join('|')).sort());
  assert.deepEqual(week, before);
  assert.notEqual(next[0], week[0]);
});

test('spacing respects locks in any week, weekday eligibility and unavoidable repetition', () => {
  const week = ['a', 'a', 'b', 'b', 'c', 'c', 'd'].map(day);
  const next = spaceWeekMains(week, {canMove: index => index !== 1 && index !== 5,
    isEligible: (recipe, index) => index === 0 ? recipe.id === week[0][types.indexOf(recipe.type)].id : true});
  assert.deepEqual(next[0], week[0]); assert.deepEqual(next[1], week[1]); assert.deepEqual(next[5], week[5]);
  assert.deepEqual(spaceWeekMains(week, {canMove: () => false}), week);
  const unavoidable = Array.from({length: 7}, () => day('same'));
  assert.deepEqual(spaceWeekMains(unavoidable), unavoidable);
});

test('saved plan quantities remain readable and unchanged after culinary policy is introduced', () => {
  const menus = Array.from({length: 3}, () => Array.from({length: 7}, () => baseDay.map(item => item.type === 'media' ? 'bocadillo_pavo' : item.id)));
  const input = {start: '2026-11-02', asOf: '2026-11-02', menus, profile, catalog};
  const saved = materializePlan(input);
  saved.portions['2026-11-02#1'].bread = 1;
  const copy = structuredClone(saved);
  const reread = materializePlan({...input, previous: saved});
  assert.deepEqual(reread.portions, copy.portions);
  assert.deepEqual(saved, copy);
  assert.ok(cleanPlanDetails(reread));
  const broken = structuredClone(reread); broken.recipes.bocadillo_pavo.ingredients[0].keepBaseAmount = 'true';
  assert.equal(cleanPlanDetails(broken), null);
});
