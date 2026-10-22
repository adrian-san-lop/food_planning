import test from 'node:test';
import assert from 'node:assert/strict';
import { readJson, nutrientKeys, recipeNutrition, undocumentedCondiments, calculateImpact } from '../scripts/catalog-audit.mjs';
import { loadCatalogs } from '../js/data/catalogs.js';
import { createNutritionService } from '../js/domain/nutrition.js';

const audit = new URL('../docs/audits/catalog-quality/results/', import.meta.url);
const [baseline, changes, sources, plan, foodDoc, recipeDoc] = await Promise.all([
  readJson(new URL('source-data/baseline-catalogs.json', audit)),
  readJson(new URL('source-data/catalog-changes.json', audit)),
  readJson(new URL('source-data/usda-records.json', audit)),
  readJson(new URL('source-data/source-plan.json', audit)),
  readJson(new URL('../data/foods.json', import.meta.url)),
  readJson(new URL('../data/recipes.json', import.meta.url)),
]);

async function currentRuntimeCatalogs() {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => ({ ok: true, json: async () => readJson(url) });
    return await loadCatalogs({ slotTypes: ['desayuno', 'media', 'comida', 'tarde', 'cena'], recoveryTags: ['calcium', 'vitamin_d', 'vitamin_c'] });
  } finally { globalThis.fetch = originalFetch; }
}

test('audit corrections preserve all IDs, units, weights, quantities and other contracts', () => {
  assert.deepEqual(foodDoc.foods.map((f) => f.id), baseline.foods.foods.map((f) => f.id));
  assert.deepEqual(recipeDoc.recipes.map((r) => r.id), baseline.recipes.recipes.map((r) => r.id));
  for (const [index, food] of foodDoc.foods.entries()) {
    const change = changes.foods.find((item) => item.food_id === food.id);
    const expected = structuredClone(baseline.foods.foods[index]);
    if (change) {
      expected.nutrition = change.after;
      expected.nutritionSource = change.after_source;
      if (change.after_name) expected.name = change.after_name;
    }
    // Portion policies are additive product metadata introduced after this audit.
    const { portion, ...auditedFood } = food;
    assert.deepEqual(auditedFood, expected, food.id);
  }
  for (const [index, recipe] of recipeDoc.recipes.entries()) {
    const change = changes.recipes.find((item) => item.recipe_id === recipe.id);
    const expected = structuredClone(baseline.recipes.recipes[index]);
    if (change) {
      expected.steps = change.after_steps;
      expected.tip = change.after_tip;
      if (change.after_name) expected.name = change.after_name;
      if (change.after_description) expected.description = change.after_description;
    }
    assert.deepEqual(recipe, expected, recipe.id);
  }
});

test('every corrected nutrient equals its reviewed primary record, with no brand or basis substitution', () => {
  assert.deepEqual(Object.keys(plan), foodDoc.foods.map((f) => f.id));
  for (const food of foodDoc.foods) {
    const entry = plan[food.id];
    if (entry.decision !== 'correct') continue;
    const record = sources.records[entry.fdc_id];
    assert.equal(entry.comparison, 'equivalent_generic');
    assert.equal(food.nutrition.basis, entry.catalog_basis || record.basis);
    assert.ok(['SR Legacy', 'Foundation'].includes(record.type));
    assert.match(food.nutritionSource, new RegExp(`FDC ${entry.fdc_id}`));
    for (const key of entry.fields) {
      let expected = record.nutrients[key].amount * (entry.reference_factor || 1);
      if (entry.round_decimals !== undefined) expected = Number(expected.toFixed(entry.round_decimals));
      assert.equal(food.nutrition[key], expected, `${food.id}/${key}`);
    }
  }
});

test('every quantified oil and soy sauce has an explicit destination in recipe steps', () => {
  for (const recipe of recipeDoc.recipes) assert.deepEqual(undocumentedCondiments(recipe), [], recipe.id);
  const synthetic = { ingredients: [{ foodId: 'oliveoil' }, { foodId: 'soySauce' }], steps: ['Saltea las verduras.'] };
  assert.deepEqual(undocumentedCondiments(synthetic), ['oliveoil', 'soySauce']);
  synthetic.steps.push('Usa el aceite y la salsa de soja indicados.');
  assert.deepEqual(undocumentedCondiments(synthetic), []);
});

test('retained source-supported values are explicit decimal roundings, not tolerance matches', () => {
  for (const food of foodDoc.foods) {
    const entry = plan[food.id];
    if (entry.decision !== 'reference_supported') continue;
    const record = sources.records[entry.fdc_id];
    assert.equal(food.nutrition.basis, record.basis, food.id);
    for (const key of nutrientKeys) {
      const current = food.nutrition[key];
      const decimals = String(current).split('.')[1]?.length || 0;
      const multiplier = 10 ** decimals;
      const rounded = Math.round((record.nutrients[key].amount + Number.EPSILON) * multiplier) / multiplier;
      assert.equal(current, rounded, `${food.id}/${key}`);
    }
  }
});

test('all recipe totals independently agree with the actual catalog loader and runtime nutrition', async () => {
  const runtime = await currentRuntimeCatalogs();
  const service = createNutritionService({ getFood: () => runtime.foods });
  for (const recipe of recipeDoc.recipes) {
    const expected = recipeNutrition(recipe, foodDoc.foods);
    const usage = Object.fromEntries(runtime.recipeById[recipe.id].ingredients.map((item) => [item.id, item.rest]));
    const actual = service.getMacro(usage);
    for (const [index, key] of nutrientKeys.entries()) {
      assert.ok(Math.abs(expected[key] - actual[['k', 'p', 'c', 'f'][index]]) < 1e-9, `${recipe.id}/${key}`);
    }
  }
});

test('recipe arithmetic respects edible piece weight, per-unit food and base servings', () => {
  const foods = [
    { id: 'slice', recipeUnit: 'ud', approximateEdibleWeight_g_per_unit: 25, nutrition: { basis: 'per_100g', kcal: 200, protein_g: 8, carbohydrates_g: 40, fat_g: 2 } },
    { id: 'egg', recipeUnit: 'ud', nutrition: { basis: 'per_unit', kcal: 72, protein_g: 6, carbohydrates_g: 0, fat_g: 5 } },
  ];
  const recipe = { baseServings: 2, ingredients: [{ foodId: 'slice', amount: 2, unit: 'ud' }, { foodId: 'egg', amount: 2, unit: 'ud' }] };
  assert.deepEqual(recipeNutrition(recipe, foods), { kcal: 122, protein_g: 8, carbohydrates_g: 10, fat_g: 5.5 });
  recipe.ingredients.push(recipe.ingredients[0]);
  assert.throws(() => recipeNutrition(recipe, foods), /Invalid ingredient/);
});

test('the complete before/after impact artifact is current', async () => {
  assert.deepEqual(await calculateImpact(), await readJson(new URL('recipe-impact.json', audit)));
  assert.deepEqual(await calculateImpact('source-data/l3-state.json'), await readJson(new URL('recipe-impact-l4.json', audit)));
});

test('the L egg convention uses a source-backed edible estimate while preserving unit measurement', () => {
  const egg = foodDoc.foods.find((food) => food.id === 'eggs');
  assert.equal(egg.name, 'Huevos L');
  assert.equal(egg.unit, 'ud');
  assert.equal(egg.recipeUnit, 'ud');
  assert.equal(egg.nutrition.basis, 'per_unit');
  assert.equal(plan.eggs.reference_factor, 0.6);
  assert.match(egg.nutritionSource, /60 g comestibles/);
  assert.equal(egg.nutrition.kcal, 85.8);
});

test('eight similar recipes retain quantities and nutrition while descriptions distinguish their portions', async () => {
  const previous = await readJson(new URL('source-data/l3-state.json', audit));
  const groups = new Map();
  let checked = 0;
  for (const recipe of recipeDoc.recipes) {
    const signature = recipe.ingredients.map((item) => item.foodId).sort().join('|');
    const group = groups.get(signature) || [];
    group.push(recipe);
    groups.set(signature, group);
  }
  for (const [signature, group] of groups) {
    if (group.length < 2) continue;
    assert.equal(new Set(group.map((recipe) => recipe.description)).size, group.length, signature);
    for (const recipe of group) {
      const old = previous.recipes.recipes.find((item) => item.id === recipe.id);
      assert.deepEqual(recipe.ingredients, old.ingredients, recipe.id);
      assert.equal(recipe.baseServings, old.baseServings, recipe.id);
      assert.deepEqual(recipeNutrition(recipe, foodDoc.foods), recipeNutrition(old, previous.foods.foods), recipe.id);
      const describedAmounts = recipe.description.match(/\d+(?:[.,]\d+)?/g).map((value) => Number(value.replace(',', '.')));
      assert.deepEqual(describedAmounts, recipe.ingredients.map((item) => item.amount), recipe.id);
      checked++;
    }
  }
  assert.equal(checked, 8);
});

test('one raw USDA record supplies all four L egg values and exactly 16 recipe deltas', async () => {
  const record = sources.records['171287'];
  assert.equal(record.description, 'Egg, whole, raw, fresh');
  assert.equal(record.basis, 'per_100g');
  assert.deepEqual(nutrientKeys.map((key) => record.nutrients[key].amount), [143, 12.56, 0.72, 9.51]);
  assert.deepEqual(nutrientKeys.map((key) => record.nutrients[key].nutrient_id), [1008, 1003, 1005, 1004]);
  assert.deepEqual(nutrientKeys.map((key) => record.nutrients[key].unit), ['kcal', 'g', 'g', 'g']);
  const previous = await readJson(new URL('source-data/l3-state.json', audit));
  const oldEgg = previous.foods.foods.find((food) => food.id === 'eggs');
  const egg = foodDoc.foods.find((food) => food.id === 'eggs');
  assert.deepEqual(nutrientKeys.map((key) => egg.nutrition[key]), [85.8, 7.54, 0.43, 5.71]);
  const impact = await calculateImpact('source-data/l3-state.json');
  let affected = 0;
  for (const recipe of recipeDoc.recipes) {
    const amount = recipe.ingredients.find((item) => item.foodId === 'eggs')?.amount || 0;
    const row = impact.find((item) => item.recipe_id === recipe.id);
    for (const key of nutrientKeys) {
      const expected = amount / recipe.baseServings * (egg.nutrition[key] - oldEgg.nutrition[key]);
      assert.ok(Math.abs(row.delta[key] - expected) < 1e-9, `${recipe.id}/${key}`);
    }
    if (amount) affected++;
  }
  assert.equal(affected, 16);
});

test('quantified oil, cayenne, soy sauce and vinegar all contribute through runtime nutrition', async () => {
  const runtime = await currentRuntimeCatalogs();
  const service = createNutritionService({ getFood: () => runtime.foods });
  for (const id of ['oliveoil', 'cayenne', 'soySauce', 'vinegar']) {
    const food = foodDoc.foods.find((item) => item.id === id);
    const recipes = recipeDoc.recipes.filter((recipe) => recipe.ingredients.some((item) => item.foodId === id));
    assert.ok(recipes.length, id);
    for (const recipe of recipes) {
      const ingredient = recipe.ingredients.find((item) => item.foodId === id);
      const factor = ingredient.amount / recipe.baseServings / 100;
      const contribution = service.getMacro({ [id]: ingredient.amount / recipe.baseServings });
      assert.ok(contribution.k > 0, `${recipe.id}/${id}`);
      for (const [index, key] of nutrientKeys.entries()) {
        assert.equal(contribution[['k', 'p', 'c', 'f'][index]], food.nutrition[key] * factor, `${recipe.id}/${id}/${key}`);
      }
    }
  }
});

test('saved meal quantities remain intact while their displayed macros use the current food table', async () => {
  const runtime = await currentRuntimeCatalogs();
  const service = createNutritionService({ getFood: () => runtime.foods });
  const saved = { rid: 'huevos_pan_kiwi', usage: { eggs: 2 }, deducted: { eggs: 2 }, operationId: 'closure-fixture' };
  const before = structuredClone(saved);
  Object.freeze(saved.usage);
  const macros = service.getMacro(saved.usage);
  assert.deepEqual(saved, before);
  assert.deepEqual(macros, { k: 171.6, p: 15.08, c: 0.86, f: 11.42 });
  assert.notEqual(macros.k, 144); // Old 72 kcal/unit is not snapshotted by the current format.
});
