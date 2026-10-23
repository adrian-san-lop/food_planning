import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloudStateMapper } from '../js/persistence/cloud-state-mapper.js';
import { addDays, dateFromISO, dateDiff, isoDate, today } from '../js/domain/dates.js';
import { initialPlanningState, planningRows } from '../js/persistence/planning-state.js';
import { confirmFirstPlan, confirmSetupProfile } from '../js/domain/onboarding.js';
import { createProfileDraft } from '../js/domain/profile.js';

const menus = Array.from({ length: 3 }, () => Array.from({ length: 7 }, () => Array(5).fill('recipe')));

function createMapper(overrides = {}) {
  return createCloudStateMapper({
    getUserId: () => 'test-user',
    getFood: () => ({ apple: ['Manzana', 'ud'], rice: ['Arroz', 'g'] }),
    getRecipes: () => ({ recipe: { type: 'desayuno', ingredients: [] } }),
    getCatalogVersion: () => 'catalog-test',
    archivedCyclesByUser: new Map(),
    addDays,
    dateFromISO,
    dateDiff,
    isoDate,
    today: () => dateFromISO('2026-10-17'),
    validMenuSnapshot: () => true,
    cloneMenus: (value) => value.map((week) => week.map((day) => day.slice())),
    fixedMenus: menus,
    isUuid: () => false,
    emptyState: () => ({
      profile: {}, done: {}, reversedDone: {}, movements: [], stock: {}, purchases: [],
      weights: [], activitySessions: [], legacyStrengthDays: {}, archives: [], cart: {},
      cartExtras: [], deletedWeightDates: [], deletedActivitySessionIds: [],
    }),
    cleanState: (state) => state,
    rebuildStock: (state) => { state.stock = { apple: 1 }; },
    defaultProfile: () => ({ sex: 'manual' }),
    sanitizeProfile: (profile) => profile,
    foodStockUnit: (id) => id === 'apple' ? 'ud' : 'g',
    foodRecipeUnit: (id) => id === 'apple' ? 'ud' : 'g',
    storedRecipeToCurrentAmount: (_id, amount) => Number(amount),
    commercialPack: () => ({ size: 1 }),
    ...overrides,
  });
}

test('a confirmed first cycle serializes one active instance and stable meal IDs across synchronization retries',async()=>{
  const state={...initialPlanningState('guided'),profile:null,profileConfirmed:false,noActiveCycle:true,start:'2026-10-23'};
  state.setupDraft.profile=createProfileDraft({sex:'female',age:35,height:165,weight:65,activity:'sedentary',goal:'maintain'});
  const plan={start:state.start,menus,catalogVersion:'catalog-test',generatedAt:'2026-10-23T10:00:00Z',recoveryFocus:false};
  const first=confirmFirstPlan(confirmSetupProfile(state),plan,{todayISO:state.start,confirmedAt:'2026-10-23T11:00:00Z',
    cycleId:'11111111-1111-4111-8111-111111111111',inspect:()=>({complete:true})});
  const mapper=createMapper({isUuid:value=>value==='11111111-1111-4111-8111-111111111111'});
  const one=await mapper.buildCloudSnapshot(first),retry=await mapper.buildCloudSnapshot(JSON.parse(JSON.stringify(first)));
  assert.equal(one.cycles.length,1);assert.equal(one.cycles[0].status,'active');assert.equal(one.cycles[0].id,first.activeCycleId);
  assert.equal(one.planned_meals.length,105);assert.deepEqual(one.cycles,retry.cycles);assert.deepEqual(one.planned_meals,retry.planned_meals);
  assert.equal(one.profile.sex,'female');assert.equal(one.profile.profile_confirmed,true);
  assert.equal(one.setup_mode,'guided');assert.deepEqual(one.movements,[]);
});

test('current cloud reads still reject an initialized account missing its profile instead of inventing one', () => {
  assert.throws(() => createMapper().stateFromCloud({ profile: null }), /no contiene su perfil/);
});

test('guided snapshots do not serialize an example profile or install the fixed initial menu',async()=>{
  const source={...initialPlanningState('guided'),profile:{sex:'manual',age:30},profileConfirmed:false,noActiveCycle:true,start:'2026-10-23'};
  source.setupDraft.profile.height=172;
  source.planningPreferences.recipePreferences={recipe:'normal',other_recipe:'favorite'};
  const result=await createMapper().buildCloudSnapshot(source);
  assert.equal(result.profile,null);assert.equal(result.cycles.length,0);assert.equal(result.planned_meals.length,0);
  assert.equal(result.setup_draft.height_cm,172);assert.equal(result.setup_draft.age,null);
  assert.equal(result.planning_contract,1);assert.equal(result.recipe_preferences.length,2);
});

test('guided account without confirmed profile restores its partial draft and preferences from relational rows',()=>{
  const planning=initialPlanningState('guided');planning.setupDraft.profile.weight=72;
  planning.planningPreferences.recipePreferences={recipe:'do_not_propose'};
  planning.planningPreferences.weekdayTimeLimits.cena=25;
  const r=planningRows(planning);
  const data={planningSupported:true,profile:null,settings:{setup_mode:'guided'},setupDraft:r.setup_draft,
    recipePreferences:r.recipe_preferences,menuPreferences:r.menu_preferences,
    cycles:[],plannedMeals:[],prep:[],ingredients:[],movements:[],completions:[],weights:[],activities:[],training:[],shoppingSessions:[],shoppingItems:[]};
  const restored=createMapper().stateFromCloud(data);
  assert.equal(restored.profile,null);assert.equal(restored.profileConfirmed,false);assert.equal(restored.noActiveCycle,true);
  assert.deepEqual(restored.setupDraft,planning.setupDraft);assert.deepEqual(restored.planningPreferences,planning.planningPreferences);
  assert.throws(()=>createMapper().stateFromCloud({...data,settings:{setup_mode:'legacy'}}),/no contiene su perfil/);
});

test('cloud mapper keeps the relational snapshot contract and shopping unit fields', async () => {
  const mapper = createMapper();
  const snapshot = await mapper.buildCloudSnapshot({
    noActiveCycle: true,
    start: '2026-10-13',
    profile: { sex: 'manual', age: 30, height: 170, weight: 70, activity: 'low', goal: 'maintain', injury: false, autoPortions: true, followWeight: true, manualRmr: 1600 },
    profileConfirmed: true,
    activeMenus: menus,
    cart: { 'current:apple': { count: 2, size: 1, checked: true } },
    cartExtras: [{ id: 'rice', count: 1, size: 500 }],
  });

  assert.deepEqual(snapshot.cycles, []);
  assert.equal(snapshot.profile.profile_confirmed, true);
  assert.equal(snapshot.shopping.items.length, 2);
  assert.equal(snapshot.shopping.items[0].unit, 'ud');
  assert.equal(snapshot.shopping.items[0].is_checked, true);
  assert.equal(snapshot.shopping.items[1].unit, 'g');
  assert.equal(snapshot.shopping.ends_on, '2026-11-02');
});

test('cloud mapper includes the injected fixed menu on first sync for a new account', async () => {
  const mapper = createMapper();
  const snapshot = await mapper.buildCloudSnapshot({
    noActiveCycle: false,
    start: '2026-10-13',
    activeMenus: null,
    profile: { sex: 'manual', age: 30, height: 170, weight: 70, activity: 'low', goal: 'maintain', injury: false, autoPortions: true, followWeight: true, manualRmr: 1600 },
    cart: {},
    cartExtras: [],
  });

  assert.equal(snapshot.cycles.length, 1);
  assert.equal(snapshot.cycles[0].status, 'active');
  assert.equal(snapshot.planned_meals.length, 105);
  assert.ok(snapshot.planned_meals.every((meal) => meal.recipe_id === 'recipe'));
});

test('cloud mapper reconstructs account data without changing the relational row contract', () => {
  const mapper = createMapper();
  const state = mapper.stateFromCloud({
    profile: { sex: 'manual', age: 30, height_cm: 170, reference_weight_kg: 70, activity_level: 'low', goal: 'maintain', profile_confirmed: true },
    cycles: [], plannedMeals: [], prep: [], ingredients: [], movements: [], shortfalls: [],
    completions: [], weights: [], activities: [], training: [], shoppingSessions: [], shoppingItems: [],
    settings: {},
  });
  assert.equal(state.noActiveCycle, true);
  assert.equal(state.profileConfirmed, true);
  assert.deepEqual(state.stock, { apple: 1 });
});

test('cloud mapper restores an active cycle, a completed meal and its ingredient snapshot', () => {
  const mapper = createMapper();
  const cycleId = 'cycle-active';
  const plannedMeals = [];
  for (let offset = 0; offset < 21; offset += 1) {
    for (let slot = 0; slot < 5; slot += 1) {
      plannedMeals.push({
        id: `meal-${offset}-${slot}`,
        cycle_id: cycleId,
        meal_date: isoDate(addDays(dateFromISO('2026-10-13'), offset)),
        slot,
        recipe_id: 'recipe',
        is_locked: false,
      });
    }
  }
  const completedMeal = plannedMeals[0];
  const state = mapper.stateFromCloud({
    profile: { sex: 'manual', age: 30, height_cm: 170, reference_weight_kg: 70, activity_level: 'low', goal: 'maintain', profile_confirmed: true },
    cycles: [{ id: cycleId, start_date: '2026-10-13', status: 'active', catalog_version: 'catalog-test' }],
    plannedMeals,
    prep: [],
    ingredients: [{ completion_id: 'completion-1', food_id: 'apple', quantity: 1, recipe_unit: 'ud' }],
    movements: [{ id: 'movement-1', operation_id: 'meal-op:apple', food_id: 'apple', quantity: -1, shortfall_quantity: 0.4, movement_kind: 'meal', source_completion_id: 'completion-1', created_at: '2026-10-17T10:00:00.000Z' }],
    shortfalls: [{ completion_id: 'completion-1', food_id: 'apple', quantity: 0.4, unit: 'ud' }],
    completions: [{ id: 'completion-1', planned_meal_id: completedMeal.id, recipe_id_snapshot: 'recipe', operation_id: 'meal-op', completed_at: '2026-10-17T10:00:00.000Z' }],
    weights: [], activities: [], training: [], shoppingSessions: [], shoppingItems: [], settings: {},
  });
  assert.equal(state.noActiveCycle, false);
  assert.equal(state.start, '2026-10-13');
  assert.equal(state.done['2026-10-13#0'].usage.apple, 1);
  assert.equal(state.done['2026-10-13#0'].deducted.apple, 0.6);
  assert.equal(Object.hasOwn(state.done['2026-10-13#0'], 'shortfall'), false);
});

test('cloud mapper keeps zero-quantity meal markers without creating shortfall records', async () => {
  const mapper = createMapper();
  const snapshot = await mapper.buildCloudSnapshot({
    noActiveCycle: false,
    start: '2026-10-13',
    activeMenus: menus,
    profile: { sex: 'manual', age: 30, height: 170, weight: 70, activity: 'low', goal: 'maintain', injury: false, autoPortions: true, followWeight: true, manualRmr: 1600 },
    done: { '2026-10-13#0': { rid: 'recipe', usage: { apple: 1 }, shortfall: { apple: 1 }, operationId: 'meal-op', completedAt: '2026-10-13T08:00:00.000Z' } },
    movements: [{ operationId: 'meal-op:apple', foodId: 'apple', quantity: 0, kind: 'meal', sourceId: '2026-10-13#0', createdAt: '2026-10-13T08:00:00.000Z' }],
    stock: {}, cart: {}, cartExtras: [],
  });
  assert.equal(snapshot.movements.length, 1);
  assert.equal(snapshot.movements[0].movement_kind, 'meal');
  assert.equal(snapshot.movements[0].quantity, 0);
  assert.equal(snapshot.movements[0].completion_operation_id, 'meal-op');
  assert.equal(Object.hasOwn(snapshot.completions[0], 'shortfalls'), false);
});
