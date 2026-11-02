import test from 'node:test';
import assert from 'node:assert/strict';
import { createReconciliationBase, reconcileStates } from '../js/domain/state-reconciliation.js';
import { initialPlanningState } from '../js/persistence/planning-state.js';

function state(overrides = {}) {
  return {
    profile: { goal: 'maintain', weight: 70 },
    profileConfirmed: true,
    noActiveCycle: false,
    activeCycleId: 'cycle-1',
    start: '2026-10-13',
    activeMenus: [[['a']]],
    done: {},
    reversedDone: {},
    stock: {},
    movements: [],
    weights: [],
    activitySessions: [],
    cart: {},
    cartExtras: [],
    archives: [],
    ...overrides,
  };
}

test('planning reconciliation merges independent recipes, limits and partial profile draft fields',()=>{
  const base=state(initialPlanningState()),local=structuredClone(base),remote=structuredClone(base);
  local.planningPreferences.recipePreferences.a='favorite';remote.planningPreferences.recipePreferences.b='do_not_propose';
  local.planningPreferences.weekdayTimeLimits.comida=30;remote.planningPreferences.weekdayTimeLimits.cena=20;
  local.setupDraft.profile.age=35;remote.setupDraft.profile.weight=75;
  const merged=reconcileStates(createReconciliationBase(base),local,remote);
  assert.deepEqual(merged.planningPreferences.recipePreferences,{a:'favorite',b:'do_not_propose'});
  assert.deepEqual(merged.planningPreferences.weekdayTimeLimits,{comida:30,cena:20});
  assert.equal(merged.setupDraft.profile.age,35);assert.equal(merged.setupDraft.profile.weight,75);
});

test('guided accounts without a profile reconcile partial drafts while keeping profile null',()=>{
  const base=state({...initialPlanningState('guided'),profile:null,profileConfirmed:false,noActiveCycle:true});
  const local=structuredClone(base),remote=structuredClone(base);
  local.setupDraft.profile.age=40;remote.setupDraft.profile.weight=80;
  const merged=reconcileStates(createReconciliationBase(base),local,remote);
  assert.equal(merged.profile,null);assert.equal(merged.profileConfirmed,false);
  assert.equal(merged.setupDraft.profile.age,40);assert.equal(merged.setupDraft.profile.weight,80);
});

test('normal and null resets survive reconciliation, simultaneous changes use the accepted remote revision',()=>{
  const base=state(initialPlanningState());base.planningPreferences.recipePreferences.a='favorite';base.planningPreferences.weekdayTimeLimits.cena=30;
  const local=structuredClone(base),remote=structuredClone(base);
  local.planningPreferences.recipePreferences.a='normal';local.planningPreferences.weekdayTimeLimits.cena=null;
  let merged=reconcileStates(createReconciliationBase(base),local,remote);
  assert.equal(merged.planningPreferences.recipePreferences.a,'normal');assert.equal(merged.planningPreferences.weekdayTimeLimits.cena,null);
  remote.planningPreferences.recipePreferences.a='do_not_propose';remote.planningPreferences.weekdayTimeLimits.cena=20;
  merged=reconcileStates(createReconciliationBase(base),local,remote);
  assert.equal(merged.planningPreferences.recipePreferences.a,'do_not_propose');assert.equal(merged.planningPreferences.weekdayTimeLimits.cena,20);
});

test('an older reconciliation base/client omitting planning fields cannot clear them',()=>{
  const base=state(),old=state(),remote=state(initialPlanningState());remote.planningPreferences.recipePreferences.a='favorite';
  assert.deepEqual(reconcileStates(createReconciliationBase(base),old,remote).planningPreferences,remote.planningPreferences);
  const established=createReconciliationBase(remote);
  assert.deepEqual(reconcileStates(established,old,remote).planningPreferences,remote.planningPreferences);
});

test('three-way reconciliation preserves independent local and remote profile edits', () => {
  const base = state();
  const local = state({ profile: { goal: 'fat_loss', weight: 70 } });
  const remote = state({ profile: { goal: 'maintain', weight: 72 } });
  const merged = reconcileStates(createReconciliationBase(base), local, remote);
  assert.deepEqual(merged.profile, { goal: 'fat_loss', weight: 72 });
});

test('three-way reconciliation takes Supabase latest accepted value for a simultaneous edit', () => {
  const base = state();
  const local = state({ profile: { goal: 'fat_loss', weight: 72 } });
  const remote = state({ profile: { goal: 'muscle_gain', weight: 73 } });
  const merged = reconcileStates(createReconciliationBase(base), local, remote);
  assert.equal(merged.profile.goal, 'muscle_gain');
  assert.equal(merged.profile.weight, 73);
});
