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
  assert.equal(foodDoc.catalogVersion, '0.9.1');
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

test('catalog IDs reject markup before values reach HTML attributes', () => {
  const unsafeFoodDoc = structuredClone(foodDoc);
  unsafeFoodDoc.foods[0].id = 'food" onmouseover="alert(1)';

  assert.throws(
    () => validateCatalogDocuments(unsafeFoodDoc, recipeDoc, { slotTypes, recoveryTags }),
    /alimento con campos incompletos/,
  );
});
