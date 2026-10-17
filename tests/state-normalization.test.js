import test from 'node:test';
import assert from 'node:assert/strict';
import { createStateNormalizer } from '../js/persistence/state-normalization.js';
import { createInventoryUnitService } from '../js/domain/inventory-units.js';
import { normalizeLegacyDeduction } from '../js/domain/inventory-balance.js';
import { dateFromISO, isoDate } from '../js/domain/dates.js';

const foods = {
  apple: { unit: 'ud', recipeUnit: 'ud', approximateEdibleWeight_g_per_unit: 180 },
  rice: { unit: 'g', recipeUnit: 'g' },
};
const legacyFoods = { apple: ['Manzana', 'ud'], rice: ['Arroz', 'g'] };
const roundAmount = (value) => Math.round(Number(value || 0) * 100) / 100;
const inventoryUnits = createInventoryUnitService({
  getFoodMeta: () => foods,
  getFood: () => legacyFoods,
  roundAmount,
});

function createNormalizer() {
  return createStateNormalizer({
    emptyState: () => ({ v: 10, start: '2026-10-13', profile: {}, done: {}, stock: {}, movements: [] }),
    getFood: () => legacyFoods,
    inventoryUnits,
    normalizeLegacyDeduction,
    dateFromISO,
    isoDate,
    today: () => dateFromISO('2026-10-17'),
    activityById: { walk: { met: 3 } },
    sanitizeProfile: (profile) => ({ ...profile }),
    validMenuSnapshot: () => false,
    isUuid: () => false,
    cloneMenus: (menus) => menus.map((week) => week.map((day) => day.slice())),
    roundAmount,
  });
}

function baseState(v) {
  return { v, start: '2026-10-13', done: {}, stock: {} };
}

test('local state normalizer accepts exactly v5-v10 and returns the current v10 shape', () => {
  const { cleanState } = createNormalizer();
  for (const version of [5, 6, 7, 8, 9, 10]) {
    assert.equal(cleanState(baseState(version)).v, 10);
  }
  for (const version of [4, 11]) assert.equal(cleanState(baseState(version)), null);
});

test('v5 local state converts gram-based produce usage and stock into recipe and pantry units', () => {
  const { cleanState } = createNormalizer();
  const raw = baseState(5);
  raw.stock = { apple: 360 };
  raw.done = { '2026-10-13#0': { rid: 'apple_recipe', usage: { apple: 180 } } };

  const migrated = cleanState(raw);

  assert.equal(migrated.done['2026-10-13#0'].usage.apple, 1);
  assert.equal(migrated.done['2026-10-13#0'].shortfall.apple, 1);
  assert.equal(migrated.stock.apple, 2);
  assert.equal(migrated.movements[0].kind, 'opening');
});

test('v8 migration removes legacy shortfall from deducted stock and floors old negative balances', () => {
  const { cleanState } = createNormalizer();
  const v8 = baseState(8);
  v8.done = { '2026-10-13#0': { usage: { rice: 5 }, deducted: { rice: 5 }, shortfall: { rice: 2 } } };
  const migratedV8 = cleanState(v8);
  assert.equal(migratedV8.done['2026-10-13#0'].deducted.rice, 3);

  const v8Stock = baseState(8);
  v8Stock.movements = [{ operationId: 'meal:rice', foodId: 'rice', quantity: -4, kind: 'meal' }];
  const migratedV8Stock = cleanState(v8Stock);
  assert.equal(migratedV8Stock.stock.rice, undefined);

  const legacyStock = baseState(8);
  legacyStock.movements = [{ operationId: 'legacy:rice', foodId: 'rice', quantity: -4, kind: 'adjustment' }];
  const migratedLegacyStock = cleanState(legacyStock);
  assert.equal(migratedLegacyStock.stock.rice, undefined);
  assert.equal(migratedLegacyStock.movements.some((movement) => movement.operationId === 'v9-stock-floor:rice'), true);
});

test('normalization keeps current movement history idempotent and rebuilds nonnegative stock', () => {
  const { cleanState } = createNormalizer();
  const raw = baseState(10);
  raw.movements = [
    { operationId: 'purchase:1', foodId: 'rice', quantity: 10, kind: 'purchase' },
    { operationId: 'meal:1', foodId: 'rice', quantity: -12, kind: 'meal' },
    { operationId: 'meal:1', foodId: 'rice', quantity: -12, kind: 'meal' },
    { operationId: 'unknown', foodId: 'missing', quantity: 50, kind: 'purchase' },
  ];
  const migrated = cleanState(raw);
  assert.equal(migrated.movements.length, 2);
  assert.equal(migrated.stock.rice, undefined);
});
