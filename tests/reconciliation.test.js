import test from 'node:test';
import assert from 'node:assert/strict';
import { createReconciliationBase, reconcileStates } from '../js/domain/state-reconciliation.js';

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
