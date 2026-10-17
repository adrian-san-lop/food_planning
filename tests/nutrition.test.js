import test from 'node:test';
import assert from 'node:assert/strict';
import { createNutritionService } from '../js/domain/nutrition.js';

const foods = {
  chicken: ['Pollo', 'g', 165, 31, 0, 3.6],
  rice: ['Arroz', 'g', 130, 2.7, 28, 0.3],
  bread: ['Pan', 'ud', 70, 2, 12, 1],
  oliveoil: ['Aceite', 'g', 884, 0, 0, 100],
};
const profile = { sex: 'manual', manualRmr: 1600, height: 170, age: 30, weight: 70, activity: 'low', goal: 'maintain', injury: false, autoPortions: true };

function service() {
  return createNutritionService({ getFood: () => foods, getEffectiveWeight: (value) => value.weight });
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
