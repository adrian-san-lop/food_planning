import test from 'node:test';
import assert from 'node:assert/strict';
import { createProfileDraft, defaultProfile, requiresManualRestingEnergy, sanitizeProfile, validateProfileDraft } from '../js/domain/profile.js';

test('new profile drafts contain no example personal data and do not share mutable values', () => {
  const draft = createProfileDraft();
  for (const field of ['sex', 'age', 'height', 'weight', 'activity', 'goal', 'manualRmr']) {
    assert.equal(draft[field], null);
  }
  assert.equal(validateProfileDraft(draft).valid, false);
  draft.weight = 82;
  assert.equal(createProfileDraft().weight, null);
  assert.equal(defaultProfile().weight, 70);
});

test('typed draft values preserve invalid ranges for correction instead of silently clamping them', () => {
  const input = { age: '12', height: '180.5', weight: ' ', manualRmr: 'not a number', injury: 'yes' };
  const before = structuredClone(input);
  const draft = createProfileDraft(input);
  assert.equal(draft.age, 12);
  assert.equal(draft.height, 180.5);
  assert.equal(draft.weight, null);
  assert.equal(draft.manualRmr, null);
  const validation = validateProfileDraft(draft);
  assert.equal(validation.errors.age, 'out_of_range');
  assert.equal(validation.errors.weight, 'required');
  assert.equal(validation.errors.injury, 'boolean_required');
  assert.deepEqual(input, before);
});

test('strict profile confirmation validates numeric types, integer fields, choices and manual resting energy', () => {
  const valid = createProfileDraft({ sex: 'female', age: 30, height: 165, weight: 60, activity: 'light', goal: 'maintain' });
  assert.equal(validateProfileDraft(valid).valid, true);
  assert.equal(validateProfileDraft({ ...valid, sex: 'manual' }).errors.manualRmr, 'required');
  assert.equal(validateProfileDraft({ ...valid, sex: 'manual', manualRmr: 1500 }).valid, true);
  for (const [field, value, error] of [
    ['age', 30.5, 'integer_required'], ['weight', '60', 'invalid_number'],
    ['height', Infinity, 'invalid_number'], ['activity', 'unknown', 'invalid_choice'],
    ['goal', null, 'required'], ['manualRmr', 1500.5, 'integer_required'],
  ]) {
    const input = { ...valid, [field]: value };
    assert.equal(validateProfileDraft(input).errors[field], error);
    assert.equal(input[field], value);
  }
});

test('manual resting energy is required only when its equation is selected', () => {
  const formulaProfile = createProfileDraft({ sex: 'female', age: 30, height: 165, weight: 60,
    activity: 'light', goal: 'maintain', manualRmr: null });
  assert.equal(requiresManualRestingEnergy(formulaProfile.sex), false);
  assert.equal(validateProfileDraft(formulaProfile).valid, true);
  const manualProfile = { ...formulaProfile, sex: 'manual' };
  assert.equal(requiresManualRestingEnergy(manualProfile.sex), true);
  assert.equal(validateProfileDraft(manualProfile).errors.manualRmr, 'required');
});

test('legacy profile conversion keeps existing movement mappings, fallbacks and boolean semantics', () => {
  const original = { sex: 'unknown', age: '100', height: 100, weight: 'invalid', activity: 'medium',
    goal: 'unknown', manualRmr: 5000, injury: 1, autoPortions: false, followWeight: undefined, trainingBonus: 100 };
  const profile = sanitizeProfile(original);
  assert.deepEqual(profile, { sex: 'male', age: 95, height: 125, weight: 70, activity: 'light',
    goal: 'maintain', injury: false, autoPortions: false, followWeight: true, manualRmr: 3500 });
  assert.equal(original.trainingBonus, 100);
  for (const [previous, next] of [['very_low', 'sedentary'], ['low', 'light'], ['medium', 'light'], ['high', 'moderate']]) {
    assert.equal(sanitizeProfile({ activity: previous }).activity, next);
  }
  const defaults = defaultProfile();
  defaults.weight = 85;
  assert.equal(sanitizeProfile(null).weight, 70);
});
