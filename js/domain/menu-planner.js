import { addDays, dateFromISO, isoDate } from './dates.js?v=20261015-european-date';
import { validateProfileDraft } from './profile.js?v=20261022-planner-foundations';
import { createPlanningPreferences, validatePlanningPreferences } from './planning-preferences.js?v=20261022-planner-foundations';
import { generateMenuCycle, MENU_SLOT_TYPES, nutritionDeviation, preparationFamily, summarizeMenu } from './menu-generator.js?v=20261023-common-generator';
import { projectPlanningStock } from './planning-stock.js?v=20261023-common-generator';

// Search weights, not accepted calorie tolerances or clinical thresholds.
export const WEEK_CANDIDATES = 3;
const mean = values => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
const locksFor = draft => Array.from({length: 3}, (_, w) => Array.from({length: 7}, (_, d) =>
  MENU_SLOT_TYPES.map((_, s) => {
    const value = draft?.locked?.[w]?.[d]?.[s];
    if (value !== undefined && typeof value !== 'boolean') throw new TypeError('Hay un bloqueo de menú no válido.');
    return value === true;
  })));

function eligibility(recipe, day, startDate, preferences) {
  if (preferences.recipePreferences[recipe.id] === 'do_not_propose') return 'not_proposed';
  const weekday = addDays(startDate, day).getUTCDay();
  const limit = weekday !== 0 && weekday !== 6 ? preferences.weekdayTimeLimits[recipe.type] : null;
  if (limit != null) {
    if (typeof recipe.time !== 'number' || !Number.isFinite(recipe.time) || recipe.time < 0) return 'unknown_time';
    if (recipe.time > limit) return 'time_limit';
  }
  return null;
}

/** Common entry for first plans and renewals. Domain only; no storage or Auth.
 * Profile confirmation is supplied by the account adapter; server enforcement
 * belongs to the persistence package. Preferences default to optional/empty.
 */
export function createMenuPlanner({ getRecipes, nutrition, toStockAmount, recipePreference = () => 0, dayPreference = () => 0 }) {
  const recipeBias = (recipe, profile, preferences) => recipePreference(recipe, profile)
    + (preferences.recipePreferences[recipe.id] === 'favorite' ? 2 : 0);
  function context(request) {
    const startDate = dateFromISO(request.start);
    if (!startDate || !dateFromISO(request.asOf)) throw new TypeError('Elige una fecha de inicio válida.');
    if (request.profileConfirmed !== true || !validateProfileDraft(request.profile).valid) {
      throw new TypeError('Confirma un perfil válido en Mi perfil antes de generar o confirmar un menú.');
    }
    const preferences = request.preferences === undefined ? createPlanningPreferences() : request.preferences;
    if (!validatePlanningPreferences(preferences).valid) throw new TypeError('Revisa las preferencias del menú.');
    const recipes = getRecipes(), byId = new Map(recipes.map(recipe => [recipe.id, recipe]));
    return { startDate, preferences, recipes, byId };
  }

  function inspect(request, plan) {
    const { startDate, preferences, recipes, byId } = context(request);
    const locked = locksFor(plan), issues = [], warnings = [];
    if (plan?.start !== undefined && plan.start !== request.start) issues.push({ code: 'start_mismatch' });
    for (const id of Object.keys(preferences.recipePreferences)) {
      if (!byId.has(id)) warnings.push({ code: 'unknown_preference_recipe', recipeId: id });
    }
    const validShape = Array.isArray(plan?.menus) && plan.menus.length === 3
      && Array.from(plan.menus).every(week => Array.isArray(week) && week.length === 7 && Array.from(week).every(day => Array.isArray(day) && day.length === 5));
    if (!validShape) return { complete: false, issues: [{ code: 'invalid_shape' }], warnings };
    plan.menus.forEach((week, w) => week.forEach((day, d) => Array.from(day).forEach((id, slot) => {
      const recipe = byId.get(id), position = { week: w, day: d, slot, recipeId: id };
      if (!recipe || recipe.type !== MENU_SLOT_TYPES[slot]) {
        const candidates = recipes.filter(item => item.type === MENU_SLOT_TYPES[slot]);
        const conditions = candidates.length ? candidates.map(item => eligibility(item, d, startDate, preferences)).filter(Boolean) : ['missing_meal_type'];
        const weekday = addDays(startDate, d).getUTCDay();
        issues.push({ ...position, code: locked[w][d][slot] ? 'invalid_lock' : id == null ? 'no_automatic_candidate' : 'missing_recipe',
          conditions: [...new Set(conditions)], timeLimit: [0, 6].includes(weekday) ? null : preferences.weekdayTimeLimits[MENU_SLOT_TYPES[slot]] ?? null });
        return;
      }
      const reason = eligibility(recipe, d, startDate, preferences);
      if (reason) (locked[w][d][slot] ? warnings : issues).push({ ...position, code: reason, manual: locked[w][d][slot] });
    })));
    return { complete: issues.length === 0, issues, warnings };
  }

  function evaluate(request, plan, stock = {}) {
    const { recipes, byId, startDate, preferences } = context(request);
    if (!inspect(request, plan).complete) throw new TypeError('No se puede evaluar un menú incompleto o incompatible.');
    const target = nutrition.nutritionTarget(0, request.profile, request.previewWeight);
    const days = [], ingredients = new Set(), needed = {};
    let adjacent = 0, knownMinutes = 0, unknownTimes = 0;
    plan.menus.forEach((week, w) => week.forEach((ids, d) => {
      const day = ids.map(id => byId.get(id));
      const result = nutrition.evaluateRecipePortions(day, 0, request.profile, request.previewWeight);
      const meals = result.portions.map(usage => nutrition.getMacro(usage));
      const mainEnergy = Math.min(meals[2].k, meals[4].k);
      const distribution = (Math.max(0, meals[1].k - mainEnergy) + Math.max(0, meals[3].k - mainEnergy)) / Math.max(1, target.calories);
      for (const slot of [2, 4]) {
        const previous = days.at(-1)?.ids[slot];
        if (previous && preparationFamily(byId.get(previous)) === preparationFamily(day[slot])) adjacent++;
        const time = day[slot].time;
        if (typeof time === 'number' && Number.isFinite(time) && time >= 0) knownMinutes += time;
        else unknownTimes++;
      }
      day.forEach(recipe => {
        recipe.ingredients.forEach(item => ingredients.add(item.id));
      });
      result.portions.forEach(usage => Object.entries(usage).forEach(([id, amount]) => {
        needed[id] = (needed[id] || 0) + toStockAmount(id, amount);
      }));
      days.push({ date: isoDate(addDays(startDate, w * 7 + d)), ids: ids.slice(), total: result.total, target, difference: result.difference,
        deviation: nutritionDeviation(result.total, target), distribution,
        preference: day.reduce((sum, recipe) => sum + recipeBias(recipe, request.profile, preferences) * .35, 0) + dayPreference(day, request.profile) });
    }));
    const coverage = mean(Object.entries(needed).map(([id, amount]) => Math.min(1, Math.max(0, stock[id] || 0) / Math.max(.01, amount))));
    const metrics = {
      nutrition: mean(days.map(day => day.deviation)), distribution: mean(days.map(day => day.distribution)),
      repetition: adjacent / 40, preparation: knownMinutes / (42 * 60) + unknownTimes / 42,
      knownPreparationMinutes: knownMinutes, unknownTimes, ingredients: ingredients.size, coverage,
      preference: mean(days.map(day => day.preference)),
    };
    const score = metrics.nutrition * 8 + metrics.distribution * 2 + metrics.repetition * .2
      + metrics.preparation * .15 + metrics.ingredients / 90 * .1 - metrics.coverage * .15 - metrics.preference * .15;
    return { score, metrics, days, summary: summarizeMenu(plan.menus, recipes, request.previousMenus),
      weeks: Array.from({length: 3}, (_, week) => ({ week, meanDeviation: mean(days.slice(week * 7, week * 7 + 7).map(day => day.deviation)) })) };
  }

  function generate(request) {
    const { startDate, preferences, recipes } = context(request);
    const locked = locksFor(request.draft);
    const available = Array.from({length: 7}, (_, d) => MENU_SLOT_TYPES.map(type =>
      recipes.filter(recipe => recipe.type === type && !eligibility(recipe, d, startDate, preferences))));
    // Retain every manual choice even when the remaining automatic selection
    // is impossible. Null positions are explicit, reviewable and unconfirmable.
    const partial = { menus: locked.map((week, w) => week.map((day, d) => day.map((lock, s) => {
      const id = request.draft?.menus?.[w]?.[d]?.[s];
      return lock ? id ?? null : available[d][s].find(recipe => recipe.id === id)?.id ?? available[d][s][0]?.id ?? null;
    }))), locked };
    const checked = inspect(request, partial);
    if (!checked.complete) return { ...partial, ...checked, start: request.start, analysis: null };

    const projection = projectPlanningStock({ stock: request.stock, start: request.start, asOf: request.asOf, currentCycle: request.currentCycle,
      recipes, toStockAmount, activityKcalToday: request.activityKcalToday ?? 0,
      evaluateDay: (day, activity, fixed) => nutrition.evaluateRecipePortions(day, activity, request.profile, request.previewWeight, fixed) });
    const candidates = [];
    for (let attempt = 0; attempt < WEEK_CANDIDATES; attempt++) {
      const plan = generateMenuCycle({ recipes, previousMenus: request.previousMenus, draft: request.draft, stock: projection.stock,
        evaluateDay: day => nutrition.evaluateRecipePortions(day, 0, request.profile, request.previewWeight),
        target: nutrition.nutritionTarget(0, request.profile, request.previewWeight), toStockAmount,
        isEligible: (recipe, d) => !eligibility(recipe, d, startDate, preferences),
        recipePreference: recipe => recipeBias(recipe, request.profile, preferences),
        dayPreference: day => dayPreference(day, request.profile), rng: request.rng });
      const analysis = evaluate(request, plan, projection.stock);
      candidates.push({ ...plan, analysis, index: attempt });
    }
    candidates.sort((a, b) => a.analysis.score - b.analysis.score || a.index - b.index);
    const best = candidates[0], inspection = inspect(request, best);
    if (best.analysis.summary.newPreparations > 3) inspection.warnings.push({
      code: 'expanded_renewal', newPreparations: best.analysis.summary.newPreparations,
    });
    return { menus: best.menus, locked: best.locked, start: request.start, ...inspection,
      analysis: { ...best.analysis, selectedCandidate: best.index, projection,
        candidates: candidates.map(candidate => ({ index: candidate.index, score: candidate.analysis.score, metrics: candidate.analysis.metrics })) } };
  }

  return { generate, inspect, evaluate };
}
