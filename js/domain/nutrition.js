import { scaleBreadSlices } from './recipe-portions.js';

const PROTEIN_PORTIONS = new Set(['skyr', 'greek', 'cheese', 'chicken', 'turkey', 'turkeySlice', 'hake', 'cod', 'salmon', 'trout', 'shrimp', 'tuna', 'sardines', 'mackerel', 'gulas', 'tofuFirm', 'tempeh', 'edamame', 'soyProteinTextured', 'porkTenderloin', 'beefSirloin', 'turkeyMince', 'cottageCheese']);
const CARB_PORTIONS = new Set(['granola', 'oats', 'bread', 'rice', 'pasta', 'tortilla', 'quinoa', 'couscous', 'noodles', 'potato', 'sweetpotato', 'raisins', 'cornCanned']);
const FAT_PORTIONS = new Set(['oliveoil', 'walnuts', 'almonds', 'peanuts', 'avocado', 'chiaSeeds', 'pumpkinSeeds', 'tahini']);
export const ACTIVITY_FACTORS = {
  very_sedentary: 1.10,
  sedentary: 1.20,
  light: 1.37,
  moderate: 1.55,
  intense: 1.72,
  very_intense: 1.90,
};

const LEGACY_ACTIVITY_LEVELS = { very_low: 'sedentary', low: 'light', medium: 'light', high: 'moderate' };

export function normalizeActivityLevel(activity) {
  const normalized = LEGACY_ACTIVITY_LEVELS[activity] || activity;
  return Object.hasOwn(ACTIVITY_FACTORS, normalized) ? normalized : 'sedentary';
}

const limit = (value, min, max) => Math.max(min, Math.min(max, value));

export function createNutritionService({ getFood, getEffectiveWeight, roundBreadSlices = scaleBreadSlices }) {
  function nutritionProfile(profile, overrideWeight) {
    const weight = overrideWeight ?? getEffectiveWeight(profile);
    const rmr = profile.sex === 'manual'
      ? profile.manualRmr
      : 10 * weight + 6.25 * profile.height - 5 * profile.age + (profile.sex === 'male' ? 5 : -161);
    const maintenance = rmr * ACTIVITY_FACTORS[normalizeActivityLevel(profile.activity)];
    return { weight, rmr, maintenance };
  }

  function nutritionTarget(activityKcal = 0, profile, overrideWeight) {
    const data = nutritionProfile(profile, overrideWeight);
    const weight = data.weight;
    const goals = { maintain: 1, recomp: profile.injury ? 1 : 0.97, fat_loss: profile.injury ? 0.95 : 0.88, muscle_gain: profile.injury ? 1.02 : 1.07 };
    const factors = { maintain: 1.8, recomp: 2.0, fat_loss: 2.0, muscle_gain: 1.9 };
    const fatFactors = { maintain: 0.85, recomp: 0.85, fat_loss: 0.8, muscle_gain: 0.9 };
    const desiredKcal = data.maintenance * goals[profile.goal];
    const baseCalories = Math.round(Math.max(data.rmr * 1.10, desiredKcal) / 10) * 10;
    const addedActivityKcal = Math.max(0, Number(activityKcal) || 0);
    const calories = Math.round((baseCalories + addedActivityKcal) / 10) * 10;
    const protein = Math.round(weight * factors[profile.goal]);
    const fat = Math.round(weight * fatFactors[profile.goal]);
    const carb = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
    return { ...data, calories, baseCalories, activityKcal: addedActivityKcal, protein, fat, carb, maintain: data.maintenance, injuryLimited: profile.injury && ['recomp', 'fat_loss', 'muscle_gain'].includes(profile.goal) };
  }

  function getMacro(usage) {
    const macros = { k: 0, p: 0, c: 0, f: 0 };
    for (const [id, amount] of Object.entries(usage)) {
      const food = getFood()[id];
      if (!food) continue;
      const quantity = food[1] === 'ud' ? amount : amount / 100;
      macros.k += food[2] * quantity;
      macros.p += food[3] * quantity;
      macros.c += food[4] * quantity;
      macros.f += food[5] * quantity;
    }
    return macros;
  }

  function scaleIngredient(amount, id, factor) {
    if (id === 'bread') return roundBreadSlices(amount, factor);
    const raw = amount * factor;
    const roundTo = getFood()[id]?.[1] === 'ud' ? 0.25 : id === 'oliveoil' ? 1 : (id === 'potato' || id === 'sweetpotato' ? 10 : 5);
    return Math.max(roundTo, Math.round(raw / roundTo) * roundTo);
  }

  function portionsForRecipes(recipes, activityKcal = 0, profile, previewWeight, fixedUsages = []) {
    const portions = recipes.map((recipe, index) => fixedUsages[index]
      ? Object.entries(fixedUsages[index]).map(([id, amount]) => ({ id, amount: Number(amount) || 0, fixed: true }))
      : recipe.ingredients.map((ingredient) => ({ id: ingredient.id, amount: ingredient.rest, fixed: false })));
    if (!profile.autoPortions) return portions.map((items) => Object.fromEntries(items.map((item) => [item.id, item.amount])));

    const target = nutritionTarget(activityKcal, profile, previewWeight);
    const macro = (items) => items.reduce((out, item) => {
      const food = getFood()[item.id];
      const quantity = food[1] === 'ud' ? item.amount : item.amount / 100;
      out.k += food[2] * quantity;
      out.p += food[3] * quantity;
      out.f += food[5] * quantity;
      return out;
    }, { k: 0, p: 0, f: 0 });
    const all = portions.flat();
    const fixed = all.filter((item) => item.fixed);
    const adjustable = all.filter((item) => !item.fixed);
    const fixedProtein = macro([...fixed, ...adjustable.filter((item) => !PROTEIN_PORTIONS.has(item.id))]).p;
    const variableProtein = macro(adjustable.filter((item) => PROTEIN_PORTIONS.has(item.id))).p;
    const proteinMultiplier = limit(variableProtein > 0 ? (target.protein - fixedProtein) / variableProtein : 1, 0.60, 1.65);
    for (const item of adjustable) if (PROTEIN_PORTIONS.has(item.id)) item.amount = scaleIngredient(item.amount, item.id, proteinMultiplier);
    const fixedFat = macro([...fixed, ...adjustable.filter((item) => !FAT_PORTIONS.has(item.id))]).f;
    const variableFat = macro(adjustable.filter((item) => FAT_PORTIONS.has(item.id))).f;
    const fatMultiplier = limit(variableFat > 0 ? (target.fat - fixedFat) / variableFat : 1, 0.65, 1.55);
    for (const item of adjustable) if (FAT_PORTIONS.has(item.id)) item.amount = scaleIngredient(item.amount, item.id, fatMultiplier);
    const after = macro(all);
    const carbKcal = macro(adjustable.filter((item) => CARB_PORTIONS.has(item.id))).k;
    const carbMultiplier = limit(carbKcal > 0 ? 1 + (target.calories - after.k) / carbKcal : 1, 0.52, 1.90);
    for (const item of adjustable) if (CARB_PORTIONS.has(item.id)) item.amount = scaleIngredient(item.amount, item.id, carbMultiplier);
    return portions.map((items) => {
      const result = {};
      for (const item of items) result[item.id] = (result[item.id] || 0) + item.amount;
      return result;
    });
  }

  return { nutritionProfile, nutritionTarget, getMacro, scaleIngredient, portionsForRecipes };
}
