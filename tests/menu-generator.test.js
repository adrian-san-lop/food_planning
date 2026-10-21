import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generateMenuCycle, preparationFamily, summarizeMenu, MENU_SLOT_TYPES, REPERTOIRE_TARGETS } from '../js/domain/menu-generator.js';
import { loadCatalogs } from '../js/data/catalogs.js';
import { createNutritionService } from '../js/domain/nutrition.js';
import { createInventoryUnitService } from '../js/domain/inventory-units.js';

function random(seed = 42) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
const repeat = week => Array.from({length: 3}, () => week.map(day => day.slice()));
const locks = () => Array.from({length: 3}, () => Array.from({length: 7}, () => Array(5).fill(false)));
const target = {calories: 2000, protein: 120, carb: 250, fat: 60};
const synthetic = MENU_SLOT_TYPES.flatMap((type, s) => Array.from({length: 8}, (_, i) => ({
  id: `${type}-${i}`, type, ingredients: [{id: `food-${s}-${i}`, rest: 100}, {id: 'shared', rest: 10}],
})));
const evaluateDay = day => ({total: {k: 2000, p: 120, c: 250, f: 60}, portions: day.map(recipe => Object.fromEntries(recipe.ingredients.map(item => [item.id, item.rest])))});
const baseOptions = {recipes: synthetic, evaluateDay, target, toStockAmount: (_, amount) => amount};

test('generator produces 105 compatible meals, a reduced repertoire and three independent copies of the base week', () => {
  const result = generateMenuCycle({...baseOptions, rng: random()});
  assert.equal(result.menus.flat(2).length, 105);
  assert.deepEqual(result.menus[0], result.menus[1]);
  assert.deepEqual(result.menus[0], result.menus[2]);
  result.menus.flat().forEach(day => day.forEach((id, s) => assert.ok(id.startsWith(MENU_SLOT_TYPES[s]))));
  for (let s = 0; s < 5; s++) {
    assert.equal(new Set(result.menus[0].map(day => day[s])).size, REPERTOIRE_TARGETS[s]);
  }
  for (const s of [2, 4]) {
    assert.ok(result.menus[0].every((day, d, week) => d === 0 || day[s] !== week[d - 1][s]));
  }
  const original = result.menus[2][0][0];
  result.menus[1][0][0] = 'manual';
  assert.equal(result.menus[0][0][0], original);
  assert.equal(result.menus[2][0][0], original);
});

test('family identity ignores amounts, ingredient order, duplicates, recipe IDs and meal type', () => {
  const a = synthetic[0], b = {...a, id: 'variant', type: 'tarde', ingredients: [{id: 'shared', rest: 40}, {id: 'food-0-0', rest: 200}, {id: 'shared', rest: 5}]};
  assert.equal(preparationFamily(a), preparationFamily(b));
  const previous = generateMenuCycle({...baseOptions, rng: random()}).menus;
  const id = previous[0][0][0], original = synthetic.find(recipe => recipe.id === id);
  const variant = {...original, id: 'variant', ingredients: original.ingredients.map(item => ({...item, rest: item.rest * 2}))};
  const menus = structuredClone(previous); menus[1][0][0] = variant.id;
  const summary = summarizeMenu(menus, [...synthetic, variant], previous);
  assert.equal(summary.newPreparations, 0);
  assert.equal(summary.portionVariants, 1);
  assert.equal(summary.weeklyExceptions, 1);
});

test('successive cycles introduce only two or three new families and retain the majority', () => {
  let previous = generateMenuCycle({...baseOptions, rng: random(1)}).menus;
  for (let seed = 2; seed < 12; seed++) {
    const next = generateMenuCycle({...baseOptions, previousMenus: previous, rng: random(seed)}).menus;
    const summary = summarizeMenu(next, synthetic, previous);
    assert.ok(summary.newPreparations >= 2 && summary.newPreparations <= 3, JSON.stringify(summary));
    assert.ok(summary.preparations - summary.newPreparations > summary.preparations / 2);
    assert.deepEqual(next[0], next[2]);
    previous = next;
  }
});

test('conflicting locks across weeks and repertoires above the target are all preserved without input mutations', () => {
  const previous = generateMenuCycle({...baseOptions, rng: random()}).menus;
  const draft = {menus: structuredClone(previous), locked: locks()};
  for (let d = 0; d < 7; d++) {
    for (let w = 0; w < 3; w++) {
      draft.menus[w][d][0] = `desayuno-${(d + w) % 8}`;
      draft.locked[w][d][0] = true;
    }
  }
  draft.locked[2][3][4] = true;
  const stock = {'shared': 15}, before = structuredClone({draft, previous, stock, recipes: synthetic});
  const next = generateMenuCycle({...baseOptions, previousMenus: previous, draft, stock, rng: random()});
  draft.locked.forEach((week, w) => week.forEach((day, d) => day.forEach((lock, s) => {
    if (lock) assert.equal(next.menus[w][d][s], draft.menus[w][d][s]);
  })));
  assert.deepEqual(next.locked, draft.locked);
  assert.deepEqual({draft, previous, stock, recipes: synthetic}, before);
  assert.notEqual(next.locked, draft.locked);
});

test('fully locked proposals stay identical, and bad locks or missing meal types fail explicitly', () => {
  const previous = generateMenuCycle({...baseOptions, rng: random()});
  const draft = {...previous, locked: previous.locked.map(week => week.map(day => day.map(() => true)))};
  assert.deepEqual(generateMenuCycle({...baseOptions, draft, previousMenus: previous.menus, rng: random()}).menus, previous.menus);
  draft.menus[0][0][0] = 'removed';
  assert.throws(() => generateMenuCycle({...baseOptions, draft}), /bloqueada/);
  assert.throws(() => generateMenuCycle({...baseOptions, recipes: synthetic.filter(recipe => recipe.type !== 'cena')}), /compatibles/);
});

test('no alternatives means no forced novelty; unsuitable alternatives are rejected', () => {
  const recipes = synthetic.filter(recipe => recipe.id.endsWith('-0'));
  const previous = repeat(Array.from({length: 7}, () => recipes.map(recipe => recipe.id)));
  const next = generateMenuCycle({...baseOptions, recipes, previousMenus: previous, rng: random()});
  assert.deepEqual(next.menus, previous);
  const unsuitable = day => {
    const result = evaluateDay(day);
    if (day.some(recipe => !recipe.id.endsWith('-0'))) result.total.k = 10000;
    return result;
  };
  const rejected = generateMenuCycle({...baseOptions, previousMenus: previous, evaluateDay: unsuitable, rng: random()});
  assert.equal(summarizeMenu(rejected.menus, synthetic, previous).newPreparations, 0);
});

test('empty pantry and invalid previous cycles work, RNG reproduces the full result', () => {
  const options = {...baseOptions, stock: {}, previousMenus: [[['missing']]]};
  const first = generateMenuCycle({...options, rng: random(77)});
  assert.deepEqual(first, generateMenuCycle({...options, rng: random(77)}));
  assert.equal(summarizeMenu(first.menus, synthetic, options.previousMenus).newPreparations, null);
});

test('stock and qualitative recovery preferences influence selection without filtering other candidates', () => {
  const stock = Object.fromEntries(MENU_SLOT_TYPES.map((_, s) => [`food-${s}-7`, 10000]));
  const stocked = generateMenuCycle({...baseOptions, stock, rng: random(12)});
  for (const type of MENU_SLOT_TYPES) assert.ok(stocked.menus.flat(2).includes(`${type}-7`));
  let dayCalls = 0;
  const recovery = generateMenuCycle({...baseOptions, rng: random(12),
    recipePreference: recipe => recipe.id.endsWith('-7') ? 3 : 0,
    dayPreference: day => { dayCalls++; return day.filter(recipe => recipe.id.endsWith('-7')).length; },
  });
  assert.ok(dayCalls > 0);
  for (const type of MENU_SLOT_TYPES) assert.ok(recovery.menus.flat(2).includes(`${type}-7`));
  assert.ok(new Set(recovery.menus.flat(2)).size > 5);
});

const originalFetch = globalThis.fetch;
let catalog;
try {
  globalThis.fetch = async url => ({ok: true, json: async () => JSON.parse(await readFile(url, 'utf8'))});
  catalog = await loadCatalogs({slotTypes: MENU_SLOT_TYPES, recoveryTags: ['calcium', 'vitamin_d', 'vitamin_c']});
} finally {
  globalThis.fetch = originalFetch;
}
const nutrition = createNutritionService({getFood: () => catalog.foods, getEffectiveWeight: profile => profile.weight});
const units = createInventoryUnitService({getFoodMeta: () => catalog.foodMeta, getFood: () => catalog.foods, roundAmount: n => Math.round(n * 100) / 100});
const profile = {sex: 'male', age: 30, height: 180, weight: 80, activity: 'sedentary', injury: false, autoPortions: true};
function realOptions(goal, autoPortions = true) {
  const current = {...profile, goal, autoPortions};
  return {
    recipes: catalog.recipes, stock: {}, target: nutrition.nutritionTarget(0, current),
    toStockAmount: units.recipeToStockAmount,
    evaluateDay: day => {
      const portions = nutrition.portionsForRecipes(day, 0, current);
      const total = portions.map(usage => nutrition.getMacro(usage)).reduce((sum, macro) =>
        Object.fromEntries(Object.keys(sum).map(key => [key, sum[key] + macro[key]])), {k: 0, p: 0, c: 0, f: 0});
      return {portions, total};
    },
  };
}

for (const goal of ['maintain', 'fat_loss', 'muscle_gain', 'recomp']) {
  test(`real catalog uses current portion/target service for ${goal}, including stock conversions`, () => {
    const options = realOptions(goal), snapshot = JSON.stringify(catalog);
    let evaluations = 0;
    const result = generateMenuCycle({...options, rng: random(), evaluateDay: day => { evaluations++; return options.evaluateDay(day); }});
    assert.ok(evaluations >= 7);
    assert.equal(result.menus.flat(2).length, 105);
    assert.deepEqual(result.menus[0], result.menus[2]);
    const shopping = result.menus.map(week => week.reduce((total, ids) => {
      const recipes = ids.map(id => catalog.recipeById[id]);
      recipes.forEach((recipe, s) => assert.equal(recipe.type, MENU_SLOT_TYPES[s]));
      options.evaluateDay(recipes).portions.forEach(usage => {
        for (const [id, amount] of Object.entries(usage)) {
          assert.ok(amount > 0 && Number.isFinite(amount));
          if (id === 'bread') assert.ok(Number.isInteger(amount) && amount <= 2);
          total[id] = (total[id] || 0) + units.recipeToStockAmount(id, amount);
        }
      });
      return total;
    }, {}));
    assert.deepEqual(shopping[0], shopping[1]);
    assert.deepEqual(shopping[0], shopping[2]);
    assert.equal(JSON.stringify(catalog), snapshot);
    assert.deepEqual(options.stock, {});
  });
  test(`real catalog renewal keeps familiarity and at most three new families for ${goal}`, () => {
    const options = realOptions(goal);
    let previous = generateMenuCycle({...options, rng: random(30)}).menus;
    for (const seed of [31, 32, 33]) {
      const next = generateMenuCycle({...options, previousMenus: previous, rng: random(seed)}).menus;
      const summary = summarizeMenu(next, catalog.recipes, previous);
      assert.ok(summary.newPreparations >= 2 && summary.newPreparations <= 3, JSON.stringify(summary));
      assert.ok(summary.preparations - summary.newPreparations > summary.preparations / 2);
      assert.deepEqual(next[0], next[1]);
      assert.deepEqual(next[0], next[2]);
      previous = next;
    }
  });
}

test('disabled portion adjustment and completed snapshots retain the existing nutrition behavior', () => {
  const options = realOptions('maintain', false);
  const result = generateMenuCycle({...options, rng: random()});
  const day = result.menus[0][0].map(id => catalog.recipeById[id]);
  const portions = options.evaluateDay(day).portions;
  day.forEach((recipe, s) => recipe.ingredients.forEach(item => assert.equal(portions[s][item.id], item.rest)));
  const snapshot = structuredClone(portions[0]);
  const adjusted = nutrition.portionsForRecipes(day, 400, {...profile, goal: 'maintain'}, undefined, [snapshot]);
  assert.deepEqual(adjusted[0], snapshot);
});
