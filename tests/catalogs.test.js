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
});

test('catalog IDs reject markup before values reach HTML attributes', () => {
  const unsafeFoodDoc = structuredClone(foodDoc);
  unsafeFoodDoc.foods[0].id = 'food" onmouseover="alert(1)';

  assert.throws(
    () => validateCatalogDocuments(unsafeFoodDoc, recipeDoc, { slotTypes, recoveryTags }),
    /alimento con campos incompletos/,
  );
});
