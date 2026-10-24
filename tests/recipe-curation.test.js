import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { loadCatalogs } from '../js/data/catalogs.js';
import { createMenuPlanner } from '../js/domain/menu-planner.js';
import { MENU_SLOT_TYPES, validMenuCycle } from '../js/domain/menu-generator.js';
import { createNutritionService } from '../js/domain/nutrition.js';
import { createInventoryUnitService } from '../js/domain/inventory-units.js';
import { recipeNutrition, nutrientKeys } from '../scripts/catalog-audit.mjs';

const removedIds = ['hamburguesa_pavo'];
const retainedIds = ['fajitas_pollo', 'sardinas_tostas', 'wrap_pavo', 'tortitas_atun', 'tostada_tofu_revuelto',
  'tostada_tempeh_tomate', 'media_tostada_tahini_manzana', 'media_edamame_soja', 'comida_bowl_tofu_edamame',
  'tarde_apio_tahini', 'tarde_tostada_tahini_pasass', 'tarde_tempeh_edamame', 'cena_wok_tempeh_edamame'];
const read = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const doc = await read('../data/recipes.json');
const baseline = await read('../docs/audits/catalog-quality/results/source-data/baseline-catalogs.json');
const culinary = await read('../docs/audits/recipe-culinary-changes.json');
let catalog;
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async url => ({ok: true, json: async () => JSON.parse(await readFile(url, 'utf8'))});
  catalog = await loadCatalogs({slotTypes: MENU_SLOT_TYPES, recoveryTags: ['calcium', 'vitamin_d', 'vitamin_c']});
} finally { globalThis.fetch = originalFetch; }

test('culinary curation deletes only the rejected sandwich and keeps coherent recipes regardless of origin or format', () => {
  assert.equal(doc.recipes.length, 111);
  const ids = new Set(doc.recipes.map(recipe => recipe.id));
  assert.deepEqual(baseline.recipes.recipes.filter(recipe => !ids.has(recipe.id)).map(recipe => recipe.id).sort(), [...removedIds].sort());
  for (const id of removedIds) assert.equal(catalog.recipeById[id], undefined, id);
  for (const id of retainedIds) assert.ok(catalog.recipeById[id], id);
  for (const recipe of doc.recipes) assert.equal(Object.hasOwn(recipe, 'retiredReason'), false);
  assert.equal(doc.recipes.reduce((sum, recipe) => sum + recipe.ingredients.length, 0), 537);
});

const nutrition = createNutritionService({getFood: () => catalog.foods, getFoodMeta: () => catalog.foodMeta, getEffectiveWeight: p => p.weight});
const units = createInventoryUnitService({getFood: () => catalog.foods, getFoodMeta: () => catalog.foodMeta,
  roundAmount: value => Math.round(Number(value || 0) * 100) / 100});
const planner = createMenuPlanner({getRecipes: () => catalog.recipes, nutrition, toStockAmount: units.recipeToStockAmount});
for (const goal of ['maintain', 'fat_loss', 'muscle_gain', 'recomp']) {
  test(`the reduced catalog produces complete menus for ${goal}, including after an obsolete test cycle`, () => {
    let seed = 41;
    const input = {start: '2026-10-23', asOf: '2026-10-23', profileConfirmed: true,
      profile: {sex: 'manual', age: 30, height: 170, weight: 70, activity: 'sedentary', goal, manualRmr: 1600,
        autoPortions: true, injury: false, followWeight: false}, stock: {},
      previousMenus: Array.from({length: 3}, () => Array.from({length: 7}, () =>
        ['yogur_platano', 'bocadillo_pavo', 'hamburguesa_pavo', 'yogur_fruta', 'tortitas_atun'])),
      rng: () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296)};
    const previous = structuredClone(input.previousMenus);
    const plan = planner.generate(input);
    assert.equal(plan.complete, true);
    assert.equal(validMenuCycle(plan.menus, catalog.recipes), true);
    assert.equal(plan.menus.flat(2).length, 105);
    assert.ok(plan.menus.flat(2).every(id => !removedIds.includes(id)));
    assert.ok(plan.analysis.days.every(day => Object.values(day.total).every(Number.isFinite)));
    assert.deepEqual(input.previousMenus, previous);
  });
}

test('the fixed template has no dangling recipe references after physical deletion', async () => {
  const source = await readFile(new URL('../js/main.js', import.meta.url), 'utf8');
  const template = source.slice(source.indexOf('const WEEK_1='), source.indexOf('let MENUS=FIXED_MENUS;'));
  const menus = vm.runInNewContext(template + '\nFIXED_MENUS');
  assert.equal(validMenuCycle(menus, catalog.recipes, true), true);
  for (const id of removedIds) assert.ok(!menus.flat(2).includes(id));
  for (const id of ['fajitas_pollo', 'sardinas_tostas', 'wrap_pavo', 'tortitas_atun']) assert.ok(menus.flat(2).includes(id));
});


test('culinary clarification is traceable and preserves every recovered ingredient, quantity, unit and nutrient', () => {
  assert.equal(culinary.reviewed.length, 11);
  assert.equal(culinary.reviewed.filter(row => row.decision === 'recover').length, 10);
  assert.equal(culinary.edits.length, 7);
  for (const row of culinary.reviewed.filter(row => row.decision === 'recover')) {
    const recipe = doc.recipes.find(recipe => recipe.id === row.id);
    const old = baseline.recipes.recipes.find(recipe => recipe.id === row.id);
    assert.deepEqual(recipe.ingredients, old.ingredients, row.id);
    assert.equal(recipe.baseServings, old.baseServings, row.id);
    assert.equal(recipe.mealType, old.mealType, row.id);
    assert.equal(recipe.timeMinutes, old.timeMinutes, row.id);
  }
  for (const edit of culinary.edits) {
    const recipe = doc.recipes.find(recipe => recipe.id === edit.id);
    assert.deepEqual(Object.keys(edit.before).sort(), Object.keys(edit.after).sort());
    for (const [key, value] of Object.entries(edit.after)) {
      assert.ok(['name', 'steps', 'tip', 'description'].includes(key));
      assert.deepEqual(recipe[key], value, edit.id + '/' + key);
    }
  }
  assert.match(doc.recipes.find(recipe => recipe.id === 'tostada_tofu_revuelto').name, /huevo/);
  const patties = doc.recipes.find(recipe => recipe.id === 'tortitas_atun').steps.join(' ');
  assert.match(patties, /mitad del aceite/);
  assert.match(patties, /otra mitad/);
});

test('the base-recipe review covers every current recipe once and preserves stage-by-stage editorial evidence', () => {
  const review = culinary.baseRecipeReview;
  assert.equal(review.reviewed.length, doc.recipes.length);
  assert.equal(new Set(review.reviewed.map(row => row.id)).size, doc.recipes.length);
  assert.deepEqual(review.reviewed.map(row => row.id), doc.recipes.map(recipe => recipe.id));
  assert.equal(new Set(review.edits.map(row => row.id)).size, review.edits.length);
  assert.equal(review.edits.length, 52);
  for (const row of review.reviewed) {
    const recipe = doc.recipes.find(recipe => recipe.id === row.id);
    assert.equal(row.mealType, recipe.mealType);
    assert.equal(row.status, review.edits.some(edit => edit.id === row.id) ? 'improved' : 'reviewed_unchanged');
    assert.ok(row.reason.length);
  }
  for (const edit of review.edits) {
    const recipe = doc.recipes.find(recipe => recipe.id === edit.id);
    assert.deepEqual(Object.keys(edit.before).sort(), Object.keys(edit.after).sort());
    for (const [key, value] of Object.entries(edit.after)) {
      assert.ok(['name', 'steps', 'tip', 'description'].includes(key));
      assert.notDeepEqual(edit.before[key], value, edit.id + '/' + key);
      assert.deepEqual(recipe[key], value, edit.id + '/' + key);
    }
  }
});

test('base-recipe improvements leave all four nutritional totals unchanged for all 111 preparations', async () => {
  const foodDoc = await read('../data/foods.json');
  const delta = Object.fromEntries(nutrientKeys.map(key => [key, 0]));
  for (const recipe of doc.recipes) {
    const old = baseline.recipes.recipes.find(row => row.id === recipe.id);
    assert.deepEqual(recipe.ingredients, old.ingredients, recipe.id);
    const current = recipeNutrition(recipe, foodDoc.foods);
    const before = recipeNutrition(old, foodDoc.foods);
    for (const key of nutrientKeys) {
      assert.equal(current[key], before[key], recipe.id + '/' + key);
      delta[key] += current[key] - before[key];
    }
  }
  assert.deepEqual(culinary.baseRecipeReview.nutritionImpact, {recipes: 111, changed: 0, delta});
});

test('recipe directions no longer confuse sliced bread, unspecified sauce or fixed calendar days', () => {
  for (const recipe of doc.recipes) {
    assert.doesNotMatch(recipe.tip, /nuevo desayuno del jueves|adobo que el jueves|sustituye el anterior/);
  }
  for (const id of ['bocadillo_pavo', 'bocadillo_pavo_peq', 'mini_pavo_tomate']) {
    const recipe = doc.recipes.find(row => row.id === id);
    assert.match(recipe.name, /Sándwich/);
    assert.equal(recipe.ingredients.find(item => item.foodId === 'bread').amount, 2);
    assert.doesNotMatch(recipe.steps.join(' '), /Abre el pan|panecillo/);
  }
  assert.doesNotMatch(doc.recipes.find(row => row.id === 'mandarina_almendras').steps.join(' '), /una o dos/);
  assert.doesNotMatch(doc.recipes.find(row => row.id === 'media_cottage_zanahoria').steps.join(' '), /media zanahoria/);
  assert.doesNotMatch(doc.recipes.find(row => row.id === 'comida_solomillo_coliflor_arroz').steps.join(' '), /unas gotas/);
  assert.doesNotMatch(doc.recipes.find(row => row.id === 'alubias_huevo').name, /templada/);
  assert.match(doc.recipes.find(row => row.id === 'tortilla_atun').steps.join(' '), /resto del aceite/);
});
