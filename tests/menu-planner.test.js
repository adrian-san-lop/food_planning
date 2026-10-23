import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createMenuPlanner, WEEK_CANDIDATES } from '../js/domain/menu-planner.js';
import { createPlanningPreferences } from '../js/domain/planning-preferences.js';
import { MENU_SLOT_TYPES, preparationFamily } from '../js/domain/menu-generator.js';
import { loadCatalogs } from '../js/data/catalogs.js';
import { createNutritionService } from '../js/domain/nutrition.js';
import { createInventoryUnitService } from '../js/domain/inventory-units.js';
import { addDays, dateFromISO } from '../js/domain/dates.js';

function random(seed = 42) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
const profile = { sex: 'male', age: 30, height: 180, weight: 80, activity: 'sedentary', goal: 'maintain',
  injury: false, autoPortions: true, followWeight: false, manualRmr: 1600 };
const target = { calories: 2000, protein: 100, carb: 250, fat: 60 };
const energy = [400, 200, 600, 200, 600];
const synthetic = MENU_SLOT_TYPES.flatMap((type, slot) => Array.from({length: 8}, (_, i) => ({
  id: `${type}_${i}`, type, time: i < 2 ? 10 : 30, energy: energy[slot], ingredients: [{id: `food_${slot}_${i}`, rest: 100}],
})));
function fixture(recipes = synthetic) {
  const macros = Object.fromEntries(recipes.map(recipe => [recipe.ingredients[0].id, {k: recipe.energy, p: 20, c: 50, f: 12}]));
  const getMacro = usage => Object.entries(usage).reduce((sum, [id, amount]) => {
    for (const key of Object.keys(sum)) sum[key] += macros[id][key] * amount / 100;
    return sum;
  }, {k: 0, p: 0, c: 0, f: 0});
  const nutrition = {
    getMacro, nutritionTarget: () => ({ ...target }),
    evaluateRecipePortions(day, activity, current, weight, fixed = []) {
      assert.equal(activity, 0, 'A proposed menu must not forecast exercise.');
      const portions = day.map((recipe, slot) => fixed[slot] || Object.fromEntries(recipe.ingredients.map(item => [item.id, item.rest])));
      const total = portions.reduce((sum, usage) => {
        const macro = getMacro(usage);
        for (const key of Object.keys(sum)) sum[key] += macro[key];
        return sum;
      }, {k: 0, p: 0, c: 0, f: 0});
      return { portions, total, target, difference: {calories: total.k - 2000, protein: total.p - 100, carb: total.c - 250, fat: total.f - 60} };
    },
  };
  return { nutrition, planner: createMenuPlanner({ getRecipes: () => recipes, nutrition, toStockAmount: (_, amount) => amount }) };
}
const request = overrides => ({ start: '2026-10-23', asOf: '2026-10-23', profile: {...profile}, profileConfirmed: true, rng: random(), ...overrides });
const repeat = day => Array.from({length: 3}, () => Array.from({length: 7}, () => day.slice()));
const unlocked = () => repeat([false, false, false, false, false]);

test('the common entry generates first plans and renewals with explicit dates and compares three full cycles', () => {
  const {planner} = fixture(), input = request({stock: {food_0_0: 150}}), before = JSON.stringify(input);
  const first = planner.generate(input);
  assert.equal(first.complete, true);
  assert.equal(first.menus.flat(2).length, 105);
  assert.deepEqual(first.menus[0], first.menus[2]);
  assert.equal(first.start, input.start);
  assert.equal(first.analysis.days.length, 21);
  assert.equal(first.analysis.candidates.length, WEEK_CANDIDATES);
  assert.equal(first.analysis.score, Math.min(...first.analysis.candidates.map(candidate => candidate.score)));
  assert.equal(first.analysis.days[0].date, '2026-10-23');
  assert.equal(first.analysis.days.at(-1).date, '2026-11-12');
  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(planner.generate(request({stock: input.stock})), first);
  const next = planner.generate(request({start: '2026-11-13', previousMenus: first.menus}));
  assert.equal(next.complete, true);
  assert.ok(next.analysis.summary.newPreparations <= 3);
  assert.ok(next.analysis.summary.preparations - next.analysis.summary.newPreparations > next.analysis.summary.preparations / 2);
});

test('invalid or unconfirmed profiles, dates, preferences and malformed locks fail without fallback data', () => {
  const {planner} = fixture();
  for (const changes of [{profileConfirmed: false}, {profileConfirmed: 'true'}, {profile: {...profile, weight: 0}},
    {start: '2026-02-30'}, {asOf: ''}, {preferences: null}, {preferences: {...createPlanningPreferences(), weekdayTimeLimits: {comida: 0, cena: null}}},
    {draft: {locked: repeat([true, false, false, false, 'true'])}}]) {
    const input = request(changes), before = JSON.stringify(input);
    assert.throws(() => planner.generate(input), TypeError);
    assert.equal(JSON.stringify(input), before);
  }
  const sparse = repeat(MENU_SLOT_TYPES.map(type => `${type}_0`));
  delete sparse[0][0][0];
  assert.equal(planner.inspect(request(), {menus: sparse}).complete, false);
  assert.ok(planner.inspect(request(), {start: '2026-10-24', menus: repeat(MENU_SLOT_TYPES.map(type => `${type}_0`))})
    .issues.some(issue => issue.code === 'start_mismatch'));
});

test('favorites bias the optional repertoire while normal recipes stay eligible', () => {
  const {planner} = fixture();
  let ordinary = 0, favored = 0;
  const preferences = createPlanningPreferences(); preferences.recipePreferences.desayuno_7 = 'favorite';
  for (let seed = 1; seed <= 8; seed++) {
    ordinary += Number(planner.generate(request({rng: random(seed)})).menus.flat(2).includes('desayuno_7'));
    const menus = planner.generate(request({preferences, rng: random(seed)})).menus;
    favored += Number(menus.flat(2).includes('desayuno_7'));
    assert.ok(new Set(menus.flat(2)).size > 5);
  }
  assert.ok(favored > ordinary, `${favored} vs ${ordinary}`);
});

test('the same planner retains qualitative recovery preferences supplied by the app', () => {
  const {nutrition} = fixture();
  const planner = createMenuPlanner({getRecipes: () => synthetic, nutrition, toStockAmount: (_, amount) => amount,
    recipePreference: (recipe, current) => current.injury && recipe.id.endsWith('_7') ? 3 : 0,
    dayPreference: (day, current) => current.injury ? day.filter(recipe => recipe.id.endsWith('_7')).length : 0});
  const result = planner.generate(request({profile: {...profile, injury: true}}));
  assert.equal(result.complete, true);
  assert.ok(result.analysis.metrics.preference > 0);
  assert.equal(planner.generate(request()).analysis.metrics.preference, 0);
});

test('No proponer beats stock and history, while an excluded lock never spreads into automatic positions', () => {
  const {planner} = fixture(), preferences = createPlanningPreferences();
  preferences.recipePreferences.desayuno_0 = 'do_not_propose';
  const previousMenus = repeat(MENU_SLOT_TYPES.map(type => `${type}_0`));
  const input = request({preferences, previousMenus, stock: {food_0_0: 100000}});
  assert.equal(planner.generate(input).menus.flat(2).includes('desayuno_0'), false);
  const draft = {menus: structuredClone(previousMenus), locked: unlocked()};
  draft.locked[0][0][0] = true;
  draft.locked[2][4][0] = true;
  const before = JSON.stringify({draft, preferences, previousMenus});
  const result = planner.generate(request({...input, draft, rng: random(8)}));
  assert.equal(result.complete, true);
  assert.equal(result.menus.flat(2).filter(id => id === 'desayuno_0').length, 2);
  assert.equal(result.warnings.filter(warning => warning.code === 'not_proposed' && warning.manual).length, 2);
  assert.equal(JSON.stringify({draft, preferences, previousMenus}), before);
});

test('weekday limits follow the chosen start date and unknown recipe times never pass an active limit', () => {
  const recipes = structuredClone(synthetic);
  recipes.find(recipe => recipe.id === 'comida_7').time = undefined;
  const {planner} = fixture(recipes), preferences = createPlanningPreferences();
  preferences.weekdayTimeLimits = {comida: 10, cena: 10};
  const result = planner.generate(request({preferences}));
  assert.equal(result.complete, true);
  result.menus.forEach((week, w) => week.forEach((day, d) => {
    const weekday = addDays(dateFromISO('2026-10-23'), w * 7 + d).getUTCDay();
    if ([0, 6].includes(weekday)) return;
    for (const slot of [2, 4]) assert.equal(recipes.find(recipe => recipe.id === day[slot]).time, 10);
  }));
  const onlySlow = synthetic.filter(recipe => recipe.id.endsWith('_7'));
  const unavailable = fixture(onlySlow).planner.generate(request({preferences}));
  assert.equal(unavailable.complete, false);
  assert.equal(unavailable.analysis, null);
  for (const weekend of [1, 2]) assert.equal(unavailable.menus[0][weekend][2], 'comida_7');
  assert.equal(unavailable.menus[0][0][2], null); // Friday, not Monday.
  assert.equal(unavailable.issues.filter(issue => issue.slot === 2).length, 15);
  assert.ok(unavailable.issues.some(issue => issue.conditions.includes('time_limit') && issue.timeLimit === 10));
  const onlyUnknown = onlySlow.map(recipe => ['comida', 'cena'].includes(recipe.type) ? {...recipe, time: undefined} : recipe);
  const unknown = fixture(onlyUnknown).planner.generate(request({preferences}));
  assert.equal(unknown.complete, false);
  assert.ok(unknown.issues.some(issue => issue.conditions.includes('unknown_time')));
});

test('infeasible preferences return explicit unconfirmable positions and keep manual choices intact', () => {
  const {planner} = fixture(), preferences = createPlanningPreferences();
  for (const recipe of synthetic.filter(recipe => recipe.type === 'desayuno')) preferences.recipePreferences[recipe.id] = 'do_not_propose';
  const draft = {menus: repeat(MENU_SLOT_TYPES.map(type => `${type}_0`)), locked: unlocked()};
  draft.locked[1][3][0] = true;
  const input = request({preferences, draft}), result = planner.generate(input);
  assert.equal(result.complete, false);
  assert.equal(result.menus[1][3][0], 'desayuno_0');
  assert.equal(result.issues.length, 20);
  assert.ok(result.issues.every(issue => issue.conditions.includes('not_proposed')));
  assert.equal(planner.inspect(input, result).complete, false);
  assert.throws(() => planner.evaluate(input, result), /incompleto/);
  draft.menus[1][3][0] = 'removed_recipe';
  const invalid = planner.generate(request({preferences, draft}));
  assert.equal(invalid.menus[1][3][0], 'removed_recipe');
  assert.ok(invalid.issues.some(issue => issue.code === 'invalid_lock'));
});

test('hard exclusions can require more renewal than the soft novelty budget without silently reusing excluded recipes', () => {
  const {planner} = fixture(), preferences = createPlanningPreferences();
  const ids = MENU_SLOT_TYPES.map(type => `${type}_0`);
  ids.forEach(id => { preferences.recipePreferences[id] = 'do_not_propose'; });
  const result = planner.generate(request({preferences, previousMenus: repeat(ids)}));
  assert.equal(result.complete, true);
  assert.ok(result.menus.flat(2).every(id => !ids.includes(id)));
  assert.ok(result.analysis.summary.newPreparations > 3);
  assert.ok(result.warnings.some(warning => warning.code === 'expanded_renewal'));
});

test('a fully manual cycle is retained even when every recipe is excluded from automatic proposals', () => {
  const {planner} = fixture(), preferences = createPlanningPreferences();
  synthetic.forEach(recipe => { preferences.recipePreferences[recipe.id] = 'do_not_propose'; });
  const draft = {menus: repeat(MENU_SLOT_TYPES.map(type => `${type}_3`)), locked: repeat([true, true, true, true, true])};
  const result = planner.generate(request({preferences, draft}));
  assert.equal(result.complete, true);
  assert.deepEqual(result.menus, draft.menus);
  assert.deepEqual(result.locked, draft.locked);
  assert.equal(result.warnings.length, 105);
});

test('weekly evaluation penalizes disproportionate snacks using actual portions without changing nutrient targets', () => {
  const unbalanced = [400, 600, 200, 600, 200];
  const recipes = MENU_SLOT_TYPES.flatMap((type, slot) => [energy, unbalanced].map((values, index) => ({
    id: `${type}_${index}`, type, energy: values[slot], time: 20, ingredients: [{id: `f_${slot}_${index}`, rest: 100}],
  })));
  const {planner} = fixture(recipes), input = request();
  const balanced = planner.evaluate(input, {menus: repeat(MENU_SLOT_TYPES.map(type => `${type}_0`))});
  const bad = planner.evaluate(input, {menus: repeat(MENU_SLOT_TYPES.map(type => `${type}_1`))});
  assert.equal(balanced.metrics.nutrition, bad.metrics.nutrition);
  assert.equal(balanced.metrics.distribution, 0);
  assert.ok(bad.metrics.distribution > 0 && bad.score > balanced.score);
  assert.equal(balanced.days[0].target.calories, 2000);
});

test('unknown preference IDs are reported without changing the stored preference or inventing activity', () => {
  const {planner} = fixture(), preferences = createPlanningPreferences();
  preferences.recipePreferences.removed_recipe = 'do_not_propose';
  const result = planner.generate(request({preferences, activityKcalToday: 2000}));
  assert.equal(result.complete, true);
  assert.deepEqual(result.warnings, [{code: 'unknown_preference_recipe', recipeId: 'removed_recipe'}]);
  assert.equal(result.analysis.days[0].target.calories, 2000);
  assert.equal(preferences.recipePreferences.removed_recipe, 'do_not_propose');
});

test('candidate selection uses stock projected at start rather than stock already needed by pending meals', () => {
  const {planner} = fixture();
  const currentCycle = {start: '2026-10-23', menus: repeat(MENU_SLOT_TYPES.map(type => `${type}_0`)), done: {}};
  const forecast = planner.generate(request({start: '2026-10-24', currentCycle, stock: {food_0_0: 100}}));
  assert.equal(forecast.analysis.projection.pendingMeals, 5);
  assert.equal(forecast.analysis.projection.stock.food_0_0, 0);
  const empty = planner.generate(request({start: '2026-10-24', stock: forecast.analysis.projection.stock}));
  assert.deepEqual(forecast.menus, empty.menus);
  assert.deepEqual(forecast.analysis.metrics, empty.analysis.metrics);
});

let catalog;
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async url => ({ok: true, json: async () => JSON.parse(await readFile(url, 'utf8'))});
  catalog = await loadCatalogs({slotTypes: MENU_SLOT_TYPES, recoveryTags: ['calcium', 'vitamin_d', 'vitamin_c']});
} finally { globalThis.fetch = originalFetch; }
const nutrition = createNutritionService({getFood: () => catalog.foods, getFoodMeta: () => catalog.foodMeta, getEffectiveWeight: p => p.weight});
const units = createInventoryUnitService({getFood: () => catalog.foods, getFoodMeta: () => catalog.foodMeta, roundAmount: n => Math.round(n * 100) / 100});
const realPlanner = createMenuPlanner({getRecipes: () => catalog.recipes, nutrition, toStockAmount: units.recipeToStockAmount});

for (const goal of ['maintain', 'fat_loss', 'muscle_gain', 'recomp']) {
  test(`common real-catalog planning preserves practical quantities and familiarity for ${goal}`, () => {
    const preferences = createPlanningPreferences();
    preferences.weekdayTimeLimits = {comida: 20, cena: 20};
    const current = {...profile, goal, injury: goal === 'recomp'};
    const input = request({profile: current, preferences}), before = JSON.stringify({catalog, input});
    const first = realPlanner.generate(input);
    const renewed = realPlanner.generate(request({...input, start: '2026-11-13', previousMenus: first.menus, rng: random(15)}));
    for (const result of [first, renewed]) {
      assert.equal(result.complete, true);
      assert.deepEqual(result.menus[0], result.menus[2]);
      assert.ok(result.analysis.candidates.every(candidate => candidate.score >= result.analysis.score));
      result.menus.flat().forEach(ids => {
        const day = ids.map(id => catalog.recipeById[id]);
        const usages = nutrition.portionsForRecipes(day, 0, current);
        usages.forEach(usage => Object.entries(usage).forEach(([id, amount]) => {
          const rule = catalog.foodMeta[id].portion;
          if (rule && rule.group !== 'fixed') assert.ok(amount >= rule.min && amount <= rule.max);
          assert.ok(Number.isFinite(units.recipeToStockAmount(id, amount)));
        }));
      });
    }
    assert.ok(renewed.analysis.summary.newPreparations <= 3);
    assert.equal(JSON.stringify({catalog, input}), before);
    assert.equal(first.analysis.days[0].target.calories, nutrition.nutritionTarget(0, current).calories);
  });
}
