import { createPlanningPreferences, validatePlanningPreferences } from '../domain/planning-preferences.js?v=20261022-planner-foundations';
import { createSetupDraft, validateSetupDraft } from '../domain/onboarding.js?v=20261023-planning-persistence';

export const PLANNING_CONTRACT_VERSION = 1;

export function initialPlanningState(mode = 'legacy') {
  return { setupMode: mode, setupDraft: createSetupDraft(), planningPreferences: createPlanningPreferences() };
}

/** Legacy installations gain empty preferences without changing their profile or menu. */
export function readPlanningState(source) {
  const defaults = initialPlanningState();
  const result = {
    setupMode: source.setupMode === undefined ? defaults.setupMode : source.setupMode,
    setupDraft: source.setupDraft === undefined ? defaults.setupDraft : source.setupDraft,
    planningPreferences: source.planningPreferences === undefined ? defaults.planningPreferences : source.planningPreferences,
  };
  if (!['legacy', 'guided'].includes(result.setupMode)
      || !validateSetupDraft(result.setupDraft).valid
      || !validatePlanningPreferences(result.planningPreferences).valid) {
    throw new TypeError('La configuración del menú guardada no es válida. La copia local se conserva.');
  }
  return structuredClone(result);
}

/** The guided UI will opt in in package 6. Existing local accounts always keep
 * their current data; a new guided account has neither a sample profile nor plan. */
export function initializeAccountState({ localState, hasLocalCopy, guidedSetup = false, todayISO }) {
  if (hasLocalCopy || !guidedSetup) return localState;
  return { ...localState, ...initialPlanningState('guided'), profile: null,
    profileConfirmed: false, noActiveCycle: true, activeCycleId: null,
    activeMenus: null, activeMenuCatalogVersion: null, activeMenuGeneratedAt: null,
    activeMenuConfirmedAt: null, activeMenuRecoveryFocus: false,
    start: todayISO, nextMenu: null, plannerDraft: null };
}

export function hasPlanningChanges(source) {
  const value = readPlanningState(source);
  return JSON.stringify(value) !== JSON.stringify(initialPlanningState());
}

export function planningRows(source) {
  const { setupMode, setupDraft, planningPreferences } = readPlanningState(source);
  const p = setupDraft.profile;
  return {
    planning_contract: PLANNING_CONTRACT_VERSION,
    setup_mode: setupMode,
    setup_draft: {
      draft_version: setupDraft.v, sex: p.sex, age: p.age, height_cm: p.height,
      reference_weight_kg: p.weight, activity_level: p.activity, goal: p.goal,
      manual_rmr_kcal: p.manualRmr, injury_recovery: p.injury, auto_portions: p.autoPortions,
      follow_weight: p.followWeight, preferences_reviewed: setupDraft.preferencesReviewed,
      start_date: setupDraft.startDate,
    },
    menu_preferences: {
      weekday_lunch_max_minutes: planningPreferences.weekdayTimeLimits.comida,
      weekday_dinner_max_minutes: planningPreferences.weekdayTimeLimits.cena,
    },
    // Explicit normal rows are reset markers. Omission is never a deletion.
    recipe_preferences: Object.entries(planningPreferences.recipePreferences)
      .map(([recipe_id, preference]) => ({ recipe_id, preference })),
  };
}

export function planningStateFromRows(data) {
  const value = initialPlanningState(data.settings?.setup_mode ?? 'legacy');
  const row = data.setupDraft;
  if (row) value.setupDraft = {
    v: row.draft_version,
    profile: {
      sex: row.sex, age: row.age, height: row.height_cm == null ? null : Number(row.height_cm),
      weight: row.reference_weight_kg == null ? null : Number(row.reference_weight_kg),
      activity: row.activity_level, goal: row.goal, manualRmr: row.manual_rmr_kcal,
      injury: row.injury_recovery, autoPortions: row.auto_portions, followWeight: row.follow_weight,
    },
    preferencesReviewed: row.preferences_reviewed, startDate: row.start_date,
  };
  const limits = data.menuPreferences;
  if (limits) value.planningPreferences.weekdayTimeLimits = {
    comida: limits.weekday_lunch_max_minutes, cena: limits.weekday_dinner_max_minutes,
  };
  for (const preference of data.recipePreferences ?? []) {
    value.planningPreferences.recipePreferences[preference.recipe_id] = preference.preference;
  }
  return readPlanningState(value);
}
