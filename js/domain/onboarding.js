import { dateFromISO } from './dates.js?v=20261015-european-date';
import { createProfileDraft, PROFILE_DRAFT_FIELDS, validateProfileDraft } from './profile.js?v=20261022-planner-foundations';

export const SETUP_DRAFT_VERSION = 1;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const personalFields = ['sex', 'age', 'height', 'weight', 'activity', 'goal', 'manualRmr'];

export function createSetupDraft() {
  return { v: SETUP_DRAFT_VERSION, profile: createProfileDraft(), preferencesReviewed: false, startDate: null };
}

/** Partial values are allowed; invalid values and unknown versions are not. */
export function validateSetupDraft(draft) {
  if (!record(draft)) return { valid: false, errors: { draft: 'invalid_object' } };
  const errors = {};
  for (const field of Object.keys(draft)) {
    if (!['v', 'profile', 'preferencesReviewed', 'startDate'].includes(field)) errors[field] = 'unknown_field';
  }
  if (draft.v !== SETUP_DRAFT_VERSION) errors.v = 'unsupported_version';
  if (!record(draft.profile)) errors.profile = 'invalid_object';
  else {
    for (const field of PROFILE_DRAFT_FIELDS) {
      if (!Object.hasOwn(draft.profile, field)) errors[`profile.${field}`] = 'missing_field';
    }
    for (const field of Object.keys(draft.profile)) {
      if (!PROFILE_DRAFT_FIELDS.includes(field)) errors[`profile.${field}`] = 'unknown_field';
    }
    const profileErrors = validateProfileDraft(draft.profile).errors;
    for (const [field, error] of Object.entries(profileErrors)) {
      if (error !== 'required' || !personalFields.includes(field)) errors[`profile.${field}`] = error;
    }
  }
  if (typeof draft.preferencesReviewed !== 'boolean') errors.preferencesReviewed = 'boolean_required';
  if (draft.startDate !== null && (typeof draft.startDate !== 'string' || !dateFromISO(draft.startDate))) {
    errors.startDate = 'invalid_date';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Facts must come from an authenticated account snapshot, not a local tutorial
 * flag. This model is not connected to the current v11 startup yet.
 * Legacy plans can establish prior use only in explicit legacy mode.
 */
export function getSetupProgress({
  authenticated = false, mode = 'guided', profile = null, profileConfirmed = false,
  draft = createSetupDraft(), hasConfirmedPlan = false, hasLegacyPlan = false,
} = {}) {
  if (authenticated !== true) return {
    stage: 'account_required', destination: 'auth', step: null,
    profileReady: false, canGenerateMenu: false, needsProfileReview: false,
  };
  if (!['guided', 'legacy'].includes(mode)) throw new TypeError('El modo de configuración no es válido.');
  if (!validateSetupDraft(draft).valid) throw new TypeError('El borrador de configuración no es válido.');

  const profileCheck = validateProfileDraft(profile);
  const profileReady = profileConfirmed === true && profileCheck.valid;
  if (!profileReady) {
    // Do not use an unconfirmed example profile to prefill the guided steps.
    const review = mode === 'legacy' || profileConfirmed === true ? profile : draft.profile;
    const aboutComplete = validateProfileDraft(review).aboutComplete;
    const missing = profile == null && !personalFields.some(field => draft.profile[field] != null);
    return {
      stage: missing ? 'profile_missing' : 'profile_incomplete',
      destination: mode === 'legacy' ? 'app' : 'setup',
      step: aboutComplete ? 'goal' : 'about',
      profileReady: false, canGenerateMenu: false, needsProfileReview: true,
    };
  }

  const establishedPlan = hasConfirmedPlan === true || (mode === 'legacy' && hasLegacyPlan === true);
  return {
    stage: establishedPlan ? 'ready' : 'plan_pending',
    destination: establishedPlan ? 'app' : 'setup',
    step: establishedPlan ? null : draft.preferencesReviewed ? 'menu' : 'preferences',
    profileReady: true, canGenerateMenu: true, needsProfileReview: false,
  };
}
