import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateCatalogDocuments } from '../js/data/catalogs.js';

const slotTypes = ['desayuno', 'media', 'comida', 'tarde', 'cena'];
const recoveryTags = ['calcium', 'vitamin_d', 'vitamin_c'];
const [foodDoc, recipeDoc] = await Promise.all([
  readFile(new URL('../data/foods.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/recipes.json', import.meta.url), 'utf8').then(JSON.parse),
]);

test('the canonical JSON catalogs pass their runtime contract', () => {
  const catalogs = validateCatalogDocuments(foodDoc, recipeDoc, { slotTypes, recoveryTags });
  assert.equal(Object.keys(catalogs.foods).length, foodDoc.foods.length);
  assert.equal(catalogs.recipes.length, recipeDoc.recipes.length);
  assert.equal(foodDoc.catalogVersion, '0.10.0');
  assert.equal(recipeDoc.catalogVersion, foodDoc.catalogVersion);
  assert.equal(foodDoc.foods.find((food) => food.id === 'kiwi').recipeUnit, 'ud');
  const bread = foodDoc.foods.find((food) => food.id === 'bread');
  assert.equal(bread.recipeUnit, 'ud');
  assert.equal(bread.approximateEdibleWeight_g_per_unit, 25);
  assert.equal(bread.recipeUnitLabel, 'rebanada');
  assert.equal(bread.recipeUnitLabelPlural, 'rebanadas');
  for (const recipe of recipeDoc.recipes) {
    for (const ingredient of recipe.ingredients.filter((item) => item.foodId === 'kiwi')) {
      assert.equal(ingredient.amount, 1);
      assert.equal(ingredient.unit, 'ud');
    }
    for (const ingredient of recipe.ingredients.filter((item) => item.foodId === 'bread')) {
      assert.ok(Number.isInteger(ingredient.amount));
      assert.ok(ingredient.amount <= 2);
      assert.equal(ingredient.unit, 'ud');
    }
  }
});

test('catalog validation rejects malformed portion policies and impractical recipe units', () => {
  const missing = structuredClone(foodDoc);
  delete missing.foods.find(food => food.id === 'bread').portion;
  assert.throws(() => validateCatalogDocuments(missing, recipeDoc, { slotTypes, recoveryTags }), /ración/);
  for (const rule of [null, { group: 'protein', min: 100, max: 50, step: 25 },
    { group: 'protein', min: 50, max: 300, step: 0 },
    { group: 'protein', min: 50, max: 300, step: 25, hidden: true },
    { group: 'unknown', min: 50, max: 300, step: 25 }]) {
    const invalid = structuredClone(foodDoc);
    invalid.foods[0].portion = rule;
    assert.throws(() => validateCatalogDocuments(invalid, recipeDoc, { slotTypes, recoveryTags }), /ración/);
  }
  for (const [id, rule] of [
    ['bread', { group: 'carb', min: 1, max: 3, step: 1 }],
    ['bread', { group: 'carb', min: 0.5, max: 2, step: 0.5 }],
    ['eggs', { group: 'fixed', min: 0.5, max: 3, step: 0.5 }],
    ['kiwi', { group: 'fixed', min: 0.25, max: 2, step: 0.25 }],
  ]) {
    const invalid = structuredClone(foodDoc);
    invalid.foods.find(food => food.id === id).portion = rule;
    assert.throws(() => validateCatalogDocuments(invalid, recipeDoc, { slotTypes, recoveryTags }), /ración/);
  }
});

test('catalog portion bounds apply per serving and to total ingredient usage per meal', () => {
  for (const [id, amount] of [['bread', 2.5], ['apple', 0.75], ['eggs', 1.5], ['rice', 200]]) {
    const invalid = structuredClone(recipeDoc);
    const recipe = invalid.recipes.find(recipe => recipe.ingredients.some(item => item.foodId === id));
    recipe.ingredients.find(item => item.foodId === id).amount = amount;
    assert.throws(() => validateCatalogDocuments(foodDoc, invalid, { slotTypes, recoveryTags }), /ración/);
  }
  const multiServing = structuredClone(recipeDoc);
  multiServing.recipes[0].baseServings = 2;
  multiServing.recipes[0].ingredients.forEach(item => { item.amount *= 2; });
  assert.doesNotThrow(() => validateCatalogDocuments(foodDoc, multiServing, { slotTypes, recoveryTags }));
  const duplicate = structuredClone(recipeDoc);
  const recipe = duplicate.recipes.find(recipe => recipe.ingredients.some(item => item.foodId === 'bread' && item.amount === 2));
  recipe.ingredients.push({ foodId: 'bread', amount: 1, unit: 'ud' });
  assert.throws(() => validateCatalogDocuments(foodDoc, duplicate, { slotTypes, recoveryTags }), /ración/);
});

test('catalog IDs reject markup before values reach HTML attributes', () => {
  const unsafeFoodDoc = structuredClone(foodDoc);
  unsafeFoodDoc.foods[0].id = 'food" onmouseover="alert(1)';

  assert.throws(
    () => validateCatalogDocuments(unsafeFoodDoc, recipeDoc, { slotTypes, recoveryTags }),
    /alimento con campos incompletos/,
  );
});
