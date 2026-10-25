import { ACTIVITY_FACTORS, normalizeActivityLevel } from './nutrition.js?v=20261018-activity-levels';

// Compatibility values for the current v5-v11 runtime, never a new user's draft.
export const DEFAULT_PROFILE = Object.freeze({
  sex: 'manual', age: 30, height: 170, weight: 70, activity: 'sedentary',
  goal: 'maintain', injury: false, autoPortions: true, followWeight: false, manualRmr: 1600,
});

export const PROFILE_LIMITS = Object.freeze({
  age: Object.freeze([18, 95]),
  height: Object.freeze([125, 220]),
  weight: Object.freeze([35, 250]),
  manualRmr: Object.freeze([800, 3500]),
});

export const PROFILE_SEX_OPTIONS = Object.freeze(['male', 'female', 'manual']);
export const PROFILE_GOALS = Object.freeze(['maintain', 'recomp', 'fat_loss', 'muscle_gain']);
export const PROFILE_DRAFT_FIELDS = Object.freeze(Object.keys(DEFAULT_PROFILE));
const ABOUT_FIELDS = ['sex', 'age', 'height', 'weight', 'manualRmr'];
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function requiresManualRestingEnergy(sex) {
  return sex === 'manual';
}

export function defaultProfile() {
  return { ...DEFAULT_PROFILE };
}

/** Preserve the existing compatibility behavior, including clamping legacy data. */
export function sanitizeProfile(raw) {
  const profile = { ...defaultProfile(), ...(record(raw) || Array.isArray(raw) ? raw : {}) };
  delete profile.trainingBonus;
  if (!PROFILE_SEX_OPTIONS.includes(profile.sex)) profile.sex = 'male';
  profile.activity = normalizeActivityLevel(profile.activity);
  if (!PROFILE_GOALS.includes(profile.goal)) profile.goal = 'maintain';
  for (const [field, [min, max]] of Object.entries(PROFILE_LIMITS)) {
    const value = Number(profile[field]);
    profile[field] = Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : DEFAULT_PROFILE[field];
  }
  profile.injury = profile.injury === true;
  profile.autoPortions = profile.autoPortions !== false;
  profile.followWeight = profile.followWeight !== false;
  return profile;
}

function draftNumber(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/** Typed, nullable form values. Out-of-range numbers stay visible for validation. */
export function createProfileDraft(raw = {}) {
  const input = record(raw) ? raw : {};
  const profile = {
    sex: PROFILE_SEX_OPTIONS.includes(input.sex) ? input.sex : null,
    age: draftNumber(input.age),
    height: draftNumber(input.height),
    weight: draftNumber(input.weight),
    activity: Object.hasOwn(ACTIVITY_FACTORS, input.activity) ? input.activity : null,
    goal: PROFILE_GOALS.includes(input.goal) ? input.goal : null,
    manualRmr: draftNumber(input.manualRmr),
  };
  for (const field of ['injury', 'autoPortions', 'followWeight']) {
    profile[field] = input[field] === undefined ? DEFAULT_PROFILE[field]
      : typeof input[field] === 'boolean' ? input[field] : null;
  }
  return profile;
}

/** Strict confirmation validation. It must not use sanitizeProfile's fallbacks. */
export function validateProfileDraft(raw) {
  const profile = record(raw) ? raw : {};
  const errors = {};
  for (const [field, choices] of [
    ['sex', PROFILE_SEX_OPTIONS], ['activity', Object.keys(ACTIVITY_FACTORS)], ['goal', PROFILE_GOALS],
  ]) {
    if (profile[field] == null) errors[field] = 'required';
    else if (!choices.includes(profile[field])) errors[field] = 'invalid_choice';
  }
  for (const [field, [min, max]] of Object.entries(PROFILE_LIMITS)) {
    const value = profile[field];
    if (field === 'manualRmr' && !requiresManualRestingEnergy(profile.sex) && value == null) continue;
    if (value == null) errors[field] = 'required';
    else if (typeof value !== 'number' || !Number.isFinite(value)) errors[field] = 'invalid_number';
    else if (value < min || value > max) errors[field] = 'out_of_range';
    else if (['age', 'manualRmr'].includes(field) && !Number.isInteger(value)) errors[field] = 'integer_required';
  }
  for (const field of ['injury', 'autoPortions', 'followWeight']) {
    if (typeof profile[field] !== 'boolean') errors[field] = 'boolean_required';
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    aboutComplete: !ABOUT_FIELDS.some(field => Object.hasOwn(errors, field)),
    goalComplete: !Object.keys(errors).some(field => !ABOUT_FIELDS.includes(field)),
  };
}
