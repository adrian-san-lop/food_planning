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
    rice: { unit: 'g', recipeUnit: 'g' },
  };
  const legacyFoods = { broccoli: [], rice: [] };
  const units = createInventoryUnitService({
    getFoodMeta: () => food,
    getFood: () => legacyFoods,
    roundAmount: (value) => Math.round(value * 100) / 100,
  });

  assert.equal(units.recipeToStockAmount('broccoli', 250), 0.625);
  assert.equal(units.stockToRecipeAmount('broccoli', 0.5), 200);
  assert.deepEqual(units.normalizeQuantityMap({ broccoli: '400', unknown: 9, rice: 'nope' }, (id, amount) => amount), { broccoli: 400 });
});
