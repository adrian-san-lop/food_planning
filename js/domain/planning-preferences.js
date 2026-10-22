export const RECIPE_PREFERENCE = Object.freeze({
  NORMAL: 'normal', FAVORITE: 'favorite', DO_NOT_PROPOSE: 'do_not_propose',
});
export const WEEKDAY_TIME_SLOTS = Object.freeze(['comida', 'cena']);
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const preferenceValues = Object.values(RECIPE_PREFERENCE);
const validRecipeId = id => /^[a-z][a-zA-Z0-9_]*$/.test(id);

export function createPlanningPreferences() {
  return { recipePreferences: {}, weekdayTimeLimits: { comida: null, cena: null } };
}

export function validatePlanningPreferences(value) {
  const errors = {};
  if (!record(value)) return { valid: false, errors: { preferences: 'invalid_object' } };
  for (const key of Object.keys(value)) {
    if (!['recipePreferences', 'weekdayTimeLimits'].includes(key)) errors[key] = 'unknown_field';
  }
  if (!record(value.recipePreferences)) errors.recipePreferences = 'invalid_object';
  else for (const [id, preference] of Object.entries(value.recipePreferences)) {
    if (!validRecipeId(id)) errors[`recipePreferences.${id}`] = 'invalid_recipe_id';
    else if (!preferenceValues.includes(preference)) errors[`recipePreferences.${id}`] = 'invalid_choice';
  }
  if (!record(value.weekdayTimeLimits)) errors.weekdayTimeLimits = 'invalid_object';
  else {
    for (const slot of Object.keys(value.weekdayTimeLimits)) {
      if (!WEEKDAY_TIME_SLOTS.includes(slot)) errors[`weekdayTimeLimits.${slot}`] = 'unknown_slot';
    }
    for (const slot of WEEKDAY_TIME_SLOTS) {
      const minutes = value.weekdayTimeLimits[slot];
      // null explicitly means no limit; zero/undefined must not silently clear it.
      if (minutes !== null && (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440)) {
        errors[`weekdayTimeLimits.${slot}`] = 'invalid_minutes';
      }
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

function requireValid(value) {
  const result = validatePlanningPreferences(value);
  if (!result.valid) throw new TypeError(`Preferencias no válidas: ${Object.keys(result.errors).join(', ')}`);
}

/** Omitted fields preserve existing values; explicit normal/null reset one value. */
export function applyPlanningPreferencesPatch(current, patch) {
  requireValid(current);
  if (patch !== undefined && !record(patch)) throw new TypeError('El cambio de preferencias no es válido.');
  const changes = patch ?? {};
  for (const key of Object.keys(changes)) {
    if (!['recipePreferences', 'weekdayTimeLimits'].includes(key) || !record(changes[key])) {
      throw new TypeError(`El cambio de preferencias no es válido: ${key}`);
    }
  }
  const next = {
    recipePreferences: { ...current.recipePreferences, ...changes.recipePreferences },
    weekdayTimeLimits: { ...current.weekdayTimeLimits, ...changes.weekdayTimeLimits },
  };
  requireValid(next);
  // Keep explicit normal entries: omission from an older client is not a reset.
  return next;
}
