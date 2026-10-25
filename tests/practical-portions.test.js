import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { loadCatalogs } from '../js/data/catalogs.js';
import { createNutritionService, ACTIVITY_FACTORS } from '../js/domain/nutrition.js';
import { portionOnGrid, scalePortion } from '../js/domain/recipe-portions.js';
import { createInventoryUnitService } from '../js/domain/inventory-units.js';
import { createInventoryLedger } from '../js/domain/inventory-ledger.js';
import { consumeAvailableStock } from '../js/domain/inventory-balance.js';
import { dateFromISO, dateDiff, isoDate } from '../js/domain/dates.js';

const types = ['desayuno', 'media', 'comida', 'tarde', 'cena'];
const originalFetch = globalThis.fetch;
let catalog;
try {
  globalThis.fetch = async url => ({ ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) });
  catalog = await loadCatalogs({ slotTypes: types, recoveryTags: ['calcium', 'vitamin_d', 'vitamin_c'] });
} finally { globalThis.fetch = originalFetch; }
const nutrition = createNutritionService({ getFood: () => catalog.foods, getFoodMeta: () => catalog.foodMeta, getEffectiveWeight: p => p.weight });
const roundAmount = n => Math.round(n * 100) / 100;
const units = createInventoryUnitService({ getFoodMeta: () => catalog.foodMeta, getFood: () => catalog.foods, roundAmount });
const profile = { sex: 'male', age: 30, height: 180, weight: 80, activity: 'sedentary', goal: 'maintain',
  injury: false, autoPortions: true, followWeight: false, manualRmr: 1600 };
const baseDay = types.map(type => catalog.recipes.find(recipe => recipe.type === type));

test('all catalog recipes retain practical amounts across four goals, six movement levels and small/large profiles', () => {
  const before = JSON.stringify(catalog);
  for (const goal of ['maintain', 'fat_loss', 'muscle_gain', 'recomp']) {
    for (const activity of Object.keys(ACTIVITY_FACTORS)) {
      for (const shape of [
        { sex: 'female', age: 18, height: 150, weight: 45 },
        { sex: 'male', age: 45, height: 195, weight: 115 },
      ]) {
        const current = { ...profile, ...shape, goal, activity };
        for (const recipe of catalog.recipes) {
          const day = baseDay.map(base => base.type === recipe.type ? recipe : base);
          const portions = nutrition.portionsForRecipes(day, 0, current);
          day.forEach((meal, slot) => {
            const usage = portions[slot];
            assert.deepEqual(Object.keys(usage).sort(), meal.ingredients.map(item => item.id).sort());
            for (const item of meal.ingredients) {
              const amount = usage[item.id], rule = catalog.foodMeta[item.id].portion;
              assert.ok(Number.isFinite(amount) && amount > 0, `${recipe.id}/${item.id}`);
              if (rule && rule.group !== 'fixed') {
                assert.ok(amount >= rule.min && amount <= rule.max, `${recipe.id}/${item.id}/${amount}`);
                assert.ok(portionOnGrid(amount, rule), `${recipe.id}/${item.id}/${amount}`);
              } else assert.equal(amount, item.rest, `${recipe.id}/${item.id}`);
            }
          });
        }
      }
    }
  }
  assert.equal(JSON.stringify(catalog), before);
});

test('catalog ceilings apply even under extreme targets and all rule boundaries round correctly', () => {
  const day = ['yogur_platano', 'pera_nueces_ligero', baseDay[2].id, 'yogur_nueces', 'tortilla_atun']
    .map(id => catalog.recipeById[id]);
  const result = nutrition.evaluateRecipePortions(day, 10000, { ...profile, weight: 250, manualRmr: 3500, sex: 'manual', activity: 'very_intense' });
  assert.ok(result.difference.calories < 0);
  for (const rule of Object.values(catalog.foodMeta).map(food => food.portion).filter(rule => rule && rule.group !== 'fixed')) {
    assert.equal(scalePortion(rule.max, 100, rule), rule.max);
    assert.equal(scalePortion(rule.min, 0, rule), rule.min);
  }
  for (const usage of result.portions) {
    if (usage.skyr) assert.ok(usage.skyr <= 300);
    if (usage.bread) assert.ok(Number.isInteger(usage.bread) && usage.bread <= 2);
    if (usage.walnuts) assert.ok(usage.walnuts <= 30);
  }
});

test('disabled adjustment and completed historical quantities remain unchanged, including sub-gram condiments', () => {
  const gulas = catalog.recipes.find(recipe => recipe.ingredients.some(item => item.id === 'cayenne'));
  const recipes = [gulas, ...baseDay.slice(1)];
  const plain = nutrition.portionsForRecipes(recipes, 1000, { ...profile, autoPortions: false });
  recipes.forEach((recipe, slot) => assert.deepEqual(plain[slot], Object.fromEntries(recipe.ingredients.map(item => [item.id, item.rest]))));
  assert.equal(plain[0].cayenne, 0.5);
  const old = Object.freeze({ bread: 3.25, eggs: 1.25, oliveoil: 0.7, cayenne: 0.5 });
  const adjusted = nutrition.portionsForRecipes(recipes, 5000, profile, undefined, [old]);
  assert.deepEqual(adjusted[0], old);
  assert.equal(adjusted[0].cayenne, 0.5);
});

const source = await readFile(new URL('../js/main.js', import.meta.url), 'utf8');
function extract(start, end) {
  const from = source.indexOf(`function ${start}(`), to = source.indexOf(`function ${end}(`);
  assert.ok(from >= 0 && to > from, `Missing test boundary: ${start}/${end}`);
  return source.slice(from, to);
}

function app(stock) {
  const state = { start: '2026-10-22', profile: { ...profile }, done: {}, stock: { ...stock }, movements: [], noActiveCycle: false };
  const ids = ['tostada_aguacate_huevo', ...baseDay.slice(1).map(recipe => recipe.id)];
  const menus = Array.from({ length: 3 }, () => Array.from({ length: 7 }, () => ids.slice()));
  const key = (week, day, slot) => `${week}-${day}-${slot}`;
  let operation = 0;
  const ledger = createInventoryLedger({ getState: () => state, hasFood: id => !!catalog.foods[id], roundAmount, newOperationId: () => `move:${++operation}` });
  const context = vm.createContext({
    state, MENUS: menus, REC: catalog.recipeById, FOOD: catalog.foods, CATALOG: catalog.catalog, visibleWeek: 0,
    mealKey: key, mealAt: (day, slot, week) => catalog.recipeById[menus[week][day][slot]],
    done: (day, slot, week) => !!state.done[key(week, day, slot)], mealIsFuture: () => false,
    dateISOAt: () => state.start, activityEnergyForDate: () => 0,
    portionsForRecipes: (recipes, activity = 0, current = state.profile, weight, fixed) => nutrition.portionsForRecipes(recipes, activity, current, weight, fixed),
    recipeToStockAmount: units.recipeToStockAmount, consumeAvailableStock, roundAmount,
    applyMovement: ledger.applyMovement, newOperationId: () => `meal:${++operation}`,
    save: () => {}, afterCloudSave:()=>{},showToast: () => {}, plannedDays: () => state.noActiveCycle ? [] : [dateFromISO(state.start)],
    dateFromISO, dateDiff, isoDate,
    shoppingCycle: () => ({ kind: 'current', start: state.start, menus }),
  });
  vm.runInContext(extract('planPortions', 'activitySessionsForDate')
    + extract('plannedNeeds', 'rangeDates')
    + extract('toggleMeal', 'openActivityDialog')
    + extract('reverseSavedMeal', 'archiveActiveCycle'), context);
  return { context, state };
}

test('real shopping and meal handlers use the same practical quantities with partial pantry and idempotent reversals', () => {
  const initial = { bread: 25, avocado: 0.1 };
  const { context, state } = app(initial);
  const before = structuredClone(context.planPortions(0, 0));
  const fullNeeds = {};
  for (const usage of before) for (const [id, amount] of Object.entries(usage)) {
    fullNeeds[id] = (fullNeeds[id] || 0) + units.recipeToStockAmount(id, amount);
  }
  assert.deepEqual(structuredClone(context.plannedNeeds(1).res), fullNeeds);
  const shopping = context.shoppingModel(1, 'current');
  assert.equal(shopping.rows.find(row => row.id === 'bread').missing, fullNeeds.bread - initial.bread);
  assert.equal(units.recipeToStockAmount('bread', before[0].bread), before[0].bread * 25);
  const avocado = catalog.foodMeta.avocado;
  assert.equal(units.recipeToStockAmount('avocado', before[0].avocado), before[0].avocado / avocado.approximateEdibleWeight_g_per_unit);

  context.toggleMeal(0, 0, 0);
  const saved = state.done['0-0-0'];
  assert.deepEqual(structuredClone(saved.usage), before[0]);
  assert.equal(saved.deducted.bread, 25);
  assert.equal(saved.deducted.avocado, 0.1);
  assert.ok(Object.values(state.stock).every(balance => balance >= 0));
  const expectedRemaining = {};
  const remaining = context.planPortions(0, 0);
  for (const usage of remaining.slice(1)) for (const [id, amount] of Object.entries(usage)) {
    expectedRemaining[id] = (expectedRemaining[id] || 0) + units.recipeToStockAmount(id, amount);
  }
  assert.deepEqual(structuredClone(context.plannedNeeds(1).res), expectedRemaining);
  assert.equal(context.plannedNeeds(1).remaining, 4);
  assert.equal(Object.hasOwn(saved, 'shortfall'), false);
  context.toggleMeal(0, 0, 0);
  assert.deepEqual(state.stock, initial);
  assert.equal(context.reverseSavedMeal('0-0-0', saved), false);
  assert.deepEqual(state.stock, initial);
});

test('real completion with empty pantry keeps full usage and shopping counts only pending meals', () => {
  const { context, state } = app({});
  context.toggleMeal(0, 0, 0);
  const saved = state.done['0-0-0'];
  assert.ok(saved.usage.bread > 0);
  assert.ok(Object.values(saved.deducted).every(amount => amount === 0));
  assert.deepEqual(state.stock, {});
  assert.equal(context.shoppingModel(1, 'current').remaining, 4);
  assert.deepEqual(structuredClone(context.planPortions(0, 0)[0]), structuredClone(saved.usage));
});

test('shopping does not report an empty complete list when the saved cycle cannot be used',()=>{
  const {context,state}=app({rice:250});
  state.noActiveCycle=true;
  state.cloudPlanIssue={status:'active',start:state.start,filled:104,reason:'incomplete',missingRecipeIds:[]};
  const shopping=context.shoppingModel(1,'current');
  assert.equal(shopping.planUnavailable,true);
  assert.equal(shopping.remaining,0);
  assert.deepEqual(structuredClone(shopping.rows),[]);
});
