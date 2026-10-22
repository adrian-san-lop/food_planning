import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIVITY_FACTORS, createNutritionService, normalizeActivityLevel } from '../js/domain/nutrition.js';

const foods = {
  chicken: ['Pollo', 'g', 165, 31, 0, 3.6],
  rice: ['Arroz', 'g', 130, 2.7, 28, 0.3],
  bread: ['Pan', 'ud', 70, 2, 12, 1],
  oliveoil: ['Aceite', 'g', 884, 0, 0, 100],
};
const profile = { sex: 'manual', manualRmr: 1600, height: 170, age: 30, weight: 70, activity: 'sedentary', goal: 'maintain', injury: false, autoPortions: true };
const foodMeta = {
  chicken: { portion: { group: 'protein', min: 75, max: 250, step: 25 } },
  rice: { portion: { group: 'carb', min: 30, max: 120, step: 10 } },
  bread: { portion: { group: 'carb', min: 1, max: 2, step: 1 } },
  oliveoil: { portion: { group: 'fat', min: 2, max: 15, step: 1 } },
};

function service() {
  return createNutritionService({ getFood: () => foods, getFoodMeta: () => foodMeta, getEffectiveWeight: (value) => value.weight });
}

test('nutrition targets add only same-day net activity to the baseline', () => {
  const nutrition = service();
  const baseline = nutrition.nutritionTarget(0, profile);
  const withActivity = nutrition.nutritionTarget(300, profile);
  assert.equal(baseline.calories, baseline.baseCalories);
  assert.equal(withActivity.calories, baseline.calories + 300);
  assert.equal(withActivity.protein, baseline.protein);
  assert.equal(withActivity.fat, baseline.fat);
});

test('resting energy uses the current Mifflin equation and all six movement factors', () => {
  const nutrition = service();
  const male = { ...profile, sex: 'male', age: 30, height: 180, weight: 80 };
  const female = { ...profile, sex: 'female', age: 30, height: 165, weight: 60 };
  assert.equal(nutrition.nutritionProfile(male).rmr, 1780);
  assert.equal(nutrition.nutritionProfile(female).rmr, 1320.25);
  assert.deepEqual(ACTIVITY_FACTORS, {
    very_sedentary: 1.10,
    sedentary: 1.20,
    light: 1.37,
    moderate: 1.55,
    intense: 1.72,
    very_intense: 1.90,
  });
  for (const [activity, factor] of Object.entries(ACTIVITY_FACTORS)) {
    assert.equal(nutrition.nutritionProfile({ ...male, activity }).maintenance, 1780 * factor);
  }
});

test('manually entered resting energy remains the basis for movement multipliers', () => {
  const nutrition = service();
  const result = nutrition.nutritionProfile({ ...profile, manualRmr: 1600, activity: 'very_intense' });
  assert.equal(result.rmr, 1600);
  assert.equal(result.maintenance, 1600 * 1.90);
});

test('legacy movement selections map to the nearest new multiplier', () => {
  assert.equal(normalizeActivityLevel('very_low'), 'sedentary');
  assert.equal(normalizeActivityLevel('low'), 'light');
  assert.equal(normalizeActivityLevel('medium'), 'light');
  assert.equal(normalizeActivityLevel('high'), 'moderate');
  assert.equal(normalizeActivityLevel('unknown'), 'sedentary');
});

test('recipe macro calculation uses catalog units and portions keep bread as whole slices', () => {
  const nutrition = service();
  const recipe = { ingredients: [
    { id: 'chicken', rest: 150 },
    { id: 'rice', rest: 100 },
    { id: 'bread', rest: 2.5 },
    { id: 'oliveoil', rest: 5 },
  ] };
  const macro = nutrition.getMacro({ chicken: 100, rice: 100, bread: 2, oliveoil: 5 });
  assert.equal(macro.k, 165 + 130 + 140 + 44.2);
  const [portions] = nutrition.portionsForRecipes([recipe], 0, profile);
  assert.equal(Number.isInteger(portions.bread), true);
  assert.ok(portions.bread <= 2);
});

test('disabled automatic portions preserve catalog recipe quantities', () => {
  const nutrition = service();
  const recipe = { ingredients: [{ id: 'bread', rest: 2 }, { id: 'rice', rest: 75 }] };
  assert.deepEqual(nutrition.portionsForRecipes([recipe], 0, { ...profile, autoPortions: false }), [{ bread: 2, rice: 75 }]);
});

test('activity increases carbohydrate portions within limits without changing protein or fat portions', () => {
  const nutrition = service();
  const recipes = Array.from({ length: 5 }, () => ({ ingredients: [{ id: 'chicken', rest: 150 }, { id: 'rice', rest: 100 }, { id: 'oliveoil', rest: 5 }] }));
  const base = nutrition.portionsForRecipes(recipes, 0, profile)[0];
  const session = nutrition.portionsForRecipes(recipes, 800, profile)[0];
  assert.equal(session.chicken, base.chicken);
  assert.equal(session.oliveoil, base.oliveoil);
  assert.ok(session.rice > base.rice && session.rice <= 120);
  assert.deepEqual(nutrition.portionsForRecipes(recipes, 0, profile)[0], base);
});

test('unreachable targets expose the real difference without breaking food bounds or completed snapshots', () => {
  const nutrition = service();
  const recipes = [{ ingredients: [{ id: 'bread', rest: 2 }] },
    { ingredients: [{ id: 'rice', rest: 100 }, { id: 'chicken', rest: 150 }] }];
  const fixed = Object.freeze({ bread: 3.25 }); // Historical snapshots must never be rounded again.
  const result = nutrition.evaluateRecipePortions(recipes, 5000, profile, undefined, [fixed]);
  assert.deepEqual(result.portions[0], fixed);
  assert.ok(result.portions[1].rice <= 120);
  assert.ok(result.portions[1].chicken <= 250);
  assert.ok(result.difference.calories < -4000);
  assert.equal(result.difference.calories, result.total.k - result.target.calories);
  const allFixed = nutrition.evaluateRecipePortions(recipes, 1000, profile, undefined, [fixed, { rice: 145, chicken: 260 }]);
  assert.deepEqual(allFixed.portions, [fixed, { rice: 145, chicken: 260 }]);
});

test('unclassified foods retain their base quantities and repeated ingredients share one per-meal limit', () => {
  const nutrition = service();
  const recipes = [{ ingredients: [{ id: 'rice', rest: 70 }, { id: 'rice', rest: 70 }] }];
  assert.deepEqual(nutrition.portionsForRecipes(recipes, 0, { ...profile, autoPortions: false }), [{ rice: 140 }]);
  assert.ok(nutrition.portionsForRecipes(recipes, 5000, profile)[0].rice <= 120);
  const withoutPolicy = createNutritionService({ getFood: () => foods, getEffectiveWeight: value => value.weight });
  assert.deepEqual(withoutPolicy.portionsForRecipes(recipes, 5000, profile), [{ rice: 140 }]);
});
