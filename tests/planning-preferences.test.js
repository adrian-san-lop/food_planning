import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPlanningPreferencesPatch, createPlanningPreferences, validatePlanningPreferences } from '../js/domain/planning-preferences.js';

test('planning preferences are optional and start without recipe exclusions or time limits', () => {
  const preferences = createPlanningPreferences();
  assert.equal(validatePlanningPreferences(preferences).valid, true);
  assert.deepEqual(preferences, { recipePreferences: {}, weekdayTimeLimits: { comida: null, cena: null } });
  preferences.recipePreferences.toast = 'favorite';
  assert.deepEqual(createPlanningPreferences().recipePreferences, {});
});

test('omitted preferences from an older client preserve exclusions and existing time limits', () => {
  const preferences = { recipePreferences: { toast: 'do_not_propose' }, weekdayTimeLimits: { comida: 25, cena: 15 } };
  const before = structuredClone(preferences);
  for (const patch of [undefined, {}, { recipePreferences: {} }, { weekdayTimeLimits: {} }]) {
    const next = applyPlanningPreferencesPatch(preferences, patch);
    assert.deepEqual(next, before);
    assert.notEqual(next.recipePreferences, preferences.recipePreferences);
    assert.notEqual(next.weekdayTimeLimits, preferences.weekdayTimeLimits);
  }
  assert.deepEqual(preferences, before);
});

test('explicit normal resets one recipe and survives a round trip without clearing other choices', () => {
  const current = { recipePreferences: { toast: 'do_not_propose', oats: 'favorite' }, weekdayTimeLimits: { comida: 25, cena: 15 } };
  const next = applyPlanningPreferencesPatch(current, { recipePreferences: { toast: 'normal' } });
  assert.deepEqual(JSON.parse(JSON.stringify(next)).recipePreferences, { toast: 'normal', oats: 'favorite' });
  assert.equal(current.recipePreferences.toast, 'do_not_propose');
});

test('time limit patches affect only the selected meal and null is an explicit removal', () => {
  const current = { recipePreferences: {}, weekdayTimeLimits: { comida: 25, cena: 15 } };
  const changed = applyPlanningPreferencesPatch(current, { weekdayTimeLimits: { comida: 40 } });
  const cleared = applyPlanningPreferencesPatch(changed, { weekdayTimeLimits: { cena: null } });
  assert.deepEqual(changed.weekdayTimeLimits, { comida: 40, cena: 15 });
  assert.deepEqual(cleared.weekdayTimeLimits, { comida: 40, cena: null });
  for (const minutes of [undefined, 0, -5, 2.5, '30', Infinity, 1441]) {
    assert.throws(() => applyPlanningPreferencesPatch(current, { weekdayTimeLimits: { comida: minutes } }), TypeError);
  }
});

test('invalid preference patches fail instead of falling back to normal or losing an exclusion', () => {
  const current = applyPlanningPreferencesPatch(createPlanningPreferences(), { recipePreferences: { toast: 'do_not_propose' } });
  for (const patch of [null, [], { recipePreferences: null }, { recipePreferences: { toast: 'unknown' } },
    { weekdayTimeLimits: { desayuno: 15 } }, { unknown: {} }, JSON.parse('{"recipePreferences":{"__proto__":"favorite"}}')]) {
    assert.throws(() => applyPlanningPreferencesPatch(current, patch), TypeError);
    assert.equal(current.recipePreferences.toast, 'do_not_propose');
  }
});
