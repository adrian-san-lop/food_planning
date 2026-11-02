import test from 'node:test';
import assert from 'node:assert/strict';
import { createStateNormalizer } from '../js/persistence/state-normalization.js';
import { createInventoryUnitService } from '../js/domain/inventory-units.js';
import { normalizeLegacyDeduction } from '../js/domain/inventory-balance.js';
import { dateFromISO, isoDate } from '../js/domain/dates.js';
import { sanitizeProfile } from '../js/domain/profile.js';
import { initialPlanningState } from '../js/persistence/planning-state.js';

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
    emptyState: () => ({ v: 12, start: '2026-10-13', profile: {}, done: {}, stock: {}, movements: [] }),
    getFood: () => legacyFoods,
    inventoryUnits,
    normalizeLegacyDeduction,
    dateFromISO,
    isoDate,
    today: () => dateFromISO('2026-10-17'),
    activityById: { walk: { met: 3 } },
    sanitizeProfile,
    validMenuSnapshot: () => false,
    isUuid: () => false,
    cloneMenus: (menus) => menus.map((week) => week.map((day) => day.slice())),
    roundAmount,
  });
}

function baseState(v) {
  return { v, start: '2026-10-13', done: {}, stock: {} };
}

test('v11 to v12 migration adds empty planning fields without changing menus, history or confirmation', () => {
  const raw = {...baseState(11), profileConfirmed: true, noActiveCycle: true};
  const result = createNormalizer().cleanState(raw);
  assert.equal(result.v,12);
  assert.deepEqual(result.planningPreferences,initialPlanningState().planningPreferences);
  assert.equal(result.setupMode,'legacy'); assert.equal(result.profileConfirmed,true);
  assert.equal(result.noActiveCycle,true); assert.deepEqual(result.done,{});
});

test('v12 preserves partial setup, explicit preference resets and validates invalid persisted planning data', () => {
  const raw = {...baseState(12),...initialPlanningState('guided'),profile:null,noActiveCycle:true};
  raw.setupDraft.profile.age=34;
  raw.planningPreferences.recipePreferences={recipe_one:'normal',recipe_two:'do_not_propose'};
  const normalized=createNormalizer().cleanState(raw);
  assert.equal(normalized.profile,null);assert.equal(normalized.setupDraft.profile.age,34);
  assert.deepEqual(normalized.planningPreferences,raw.planningPreferences);
  const bad=structuredClone(raw);bad.planningPreferences.weekdayTimeLimits.cena=0;
  assert.equal(createNormalizer().cleanState(bad),null);
  bad.planningPreferences=null;assert.equal(createNormalizer().cleanState(bad),null);
});

test('v12 browser working copies preserve a sanitized cloud menu issue without dropping account state', () => {
  const raw={...baseState(12),...initialPlanningState('legacy'),profile:{sex:'manual',age:30,height:170,weight:70,activity:'sedentary',goal:'maintain'},
    noActiveCycle:true,cloudPlanIssue:{status:'active',start:'2026-10-13',filled:104,reason:'incomplete',missingRecipeIds:['bad id','recipe_old','recipe_old']}};
  const normalized=createNormalizer().cleanState(raw);
  assert.deepEqual(normalized.cloudPlanIssue,{status:'active',start:'2026-10-13',filled:104,reason:'incomplete',missingRecipeIds:['recipe_old']});
  const invalid={...raw,cloudPlanIssue:{status:'active',start:'2026-10-13',filled:105,reason:'unexpected',missingRecipeIds:[]}};
  assert.equal(createNormalizer().cleanState(invalid).cloudPlanIssue,null);
});

test('local state normalizer accepts exactly v5-v12 and returns the current v12 shape', () => {
  const { cleanState } = createNormalizer();
  for (const version of [5, 6, 7, 8, 9, 10, 11, 12]) {
    assert.equal(cleanState(baseState(version)).v, 12);
  }
  for (const version of [4, 13]) assert.equal(cleanState(baseState(version)), null);
});

test('v5-v11 states keep real profile values and confirmation through the extracted compatibility service', () => {
  const { cleanState } = createNormalizer();
  for (const version of [5, 6, 7, 8, 9, 10, 11, 12]) {
    const raw = { ...baseState(version), noActiveCycle: true, profileConfirmed: true,
      profile: { sex: 'female', age: 42, height: 168, weight: 65, activity: 'high', goal: 'recomp',
        manualRmr: 1500, autoPortions: false, followWeight: true, injury: true } };
    const before = structuredClone(raw);
    const normalized = cleanState(raw);
    assert.deepEqual(normalized.profile, { ...raw.profile, activity: 'moderate' });
    assert.equal(normalized.profileConfirmed, true);
    assert.equal(normalized.noActiveCycle, true);
    assert.equal(normalized.v, 12);
    assert.deepEqual(raw, before);
  }
});

test('v5 local state converts gram-based produce usage and stock into recipe and pantry units', () => {
  const { cleanState } = createNormalizer();
  const raw = baseState(5);
  raw.stock = { apple: 360 };
  raw.done = { '2026-10-13#0': { rid: 'apple_recipe', usage: { apple: 180 } } };

  const migrated = cleanState(raw);

  assert.equal(migrated.done['2026-10-13#0'].usage.apple, 1);
  assert.equal(Object.hasOwn(migrated.done['2026-10-13#0'], 'shortfall'), false);
  assert.equal(migrated.stock.apple, 2);
  assert.equal(migrated.movements[0].kind, 'opening');
});

test('v10 recipe portions already stored in pieces stay unchanged in v11', () => {
  const { cleanState } = createNormalizer();
  const v10 = baseState(10);
  v10.done = { '2026-10-13#0': { usage: { apple: 1 }, deducted: { apple: 1 } } };

  const migrated = cleanState(v10);

  assert.equal(migrated.done['2026-10-13#0'].usage.apple, 1);
  assert.equal(migrated.done['2026-10-13#0'].deducted.apple, 1);
});

test('v8 migration removes legacy shortfall from deducted stock and floors old negative balances', () => {
  const { cleanState } = createNormalizer();
  const v8 = baseState(8);
  v8.done = { '2026-10-13#0': { usage: { rice: 5 }, deducted: { rice: 5 }, shortfall: { rice: 2 } } };
  const migratedV8 = cleanState(v8);
  assert.equal(migratedV8.done['2026-10-13#0'].deducted.rice, 3);
  assert.equal(Object.hasOwn(migratedV8.done['2026-10-13#0'], 'shortfall'), false);

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
  const raw = baseState(11);
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
