import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  dateDiff,
  dateFromISO,
  isoDate,
  madridISODate,
  monday,
} from '../js/domain/dates.js';
import { createInventoryUnitService } from '../js/domain/inventory-units.js';
import { consumeAvailableStock, normalizeLegacyDeduction, projectAvailableStock } from '../js/domain/inventory-balance.js';

test('Madrid civil date remains correct across the spring clock change', () => {
  assert.equal(madridISODate('2026-03-29T00:59:59Z'), '2026-03-29');
  assert.equal(madridISODate('2026-03-29T01:00:00Z'), '2026-03-29');
  assert.equal(isoDate(addDays(dateFromISO('2026-03-28'), 1)), '2026-03-29');
  assert.equal(dateDiff(dateFromISO('2026-03-28'), dateFromISO('2026-03-30')), 2);
});

test('Madrid civil date remains correct across the autumn clock change', () => {
  assert.equal(madridISODate('2026-10-25T00:30:00Z'), '2026-10-25');
  assert.equal(madridISODate('2026-10-25T01:30:00Z'), '2026-10-25');
  assert.equal(isoDate(addDays(dateFromISO('2026-10-24'), 1)), '2026-10-25');
  assert.equal(isoDate(addDays(dateFromISO('2026-10-25'), 1)), '2026-10-26');
});

test('civil date helpers validate dates and find the Monday of their week', () => {
  assert.equal(dateFromISO('2026-02-30'), null);
  assert.equal(isoDate(monday(dateFromISO('2026-10-14'))), '2026-10-12');
});

test('inventory conversions follow the JSON food metadata', () => {
  const food = {
    broccoli: { unit: 'ud', recipeUnit: 'g', approximateEdibleWeight_g_per_unit: 400 },
    apple: { unit: 'ud', recipeUnit: 'ud', approximateEdibleWeight_g_per_unit: 170 },
    bread: { unit: 'g', recipeUnit: 'ud', approximateEdibleWeight_g_per_unit: 25 },
    rice: { unit: 'g', recipeUnit: 'g' },
  };
  const legacyFoods = { broccoli: [], apple: [], bread: [], rice: [] };
  const units = createInventoryUnitService({
    getFoodMeta: () => food,
    getFood: () => legacyFoods,
    roundAmount: (value) => Math.round(value * 100) / 100,
  });

  assert.equal(units.recipeToStockAmount('broccoli', 250), 0.625);
  assert.equal(units.stockToRecipeAmount('broccoli', 0.5), 200);
  assert.equal(units.recipeToStockAmount('bread', 1.5), 37.5);
  assert.equal(units.stockToRecipeAmount('bread', 50), 2);
  assert.equal(units.storedRecipeToCurrentAmount('apple', 85, 'g'), 0.5);
  assert.equal(units.storedRecipeToCurrentAmount('bread', 40, 'g'), 1.6);
  assert.equal(units.recipeToStockAmount('apple', 1), 1);
  assert.deepEqual(units.convertLegacyPack('apple', 2, 170), { count: 2, size: 1 });
  assert.deepEqual(units.normalizeQuantityMap({ broccoli: '400', unknown: 9, rice: 'nope' }, (id, amount) => amount), { broccoli: 400 });
});

test('inventory consumption floors the pantry at zero and records only the missing amount separately', () => {
  const round = (value) => Math.round(value * 100) / 100;
  assert.deepEqual(consumeAvailableStock(500, 700, round), { deducted: 500, shortfall: 200, balance: 0 });
  assert.deepEqual(consumeAvailableStock(0, 700, round), { deducted: 0, shortfall: 700, balance: 0 });
  assert.deepEqual(consumeAvailableStock(500, 300, round), { deducted: 300, shortfall: 0, balance: 200 });
});

test('projected pantry balances never go below zero and legacy meal reversals restore actual deduction', () => {
  const round = (value) => Math.round(value * 100) / 100;
  assert.equal(projectAvailableStock(500, 700, round), 0);
  assert.equal(projectAvailableStock(500, 300, round), 200);
  assert.deepEqual(normalizeLegacyDeduction({ rice: 700, apple: 0.8 }, { rice: 200, apple: 0.3 }, round), { rice: 500, apple: 0.5 });
});
