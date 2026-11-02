import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const nutrientKeys = ['kcal', 'protein_g', 'carbohydrates_g', 'fat_g'];
const results = new URL('../docs/audits/catalog-quality/results/', import.meta.url);
export const readJson = async (url) => JSON.parse(await readFile(url, 'utf8'));

// Independent arithmetic on the canonical measurement basis, per base serving.
export function recipeNutrition(recipe, foods) {
  const byId = new Map(foods.map((food) => [food.id, food]));
  const totals = Object.fromEntries(nutrientKeys.map((key) => [key, 0]));
  const seen = new Set();
  if (!(recipe.baseServings > 0)) throw new Error('Invalid baseServings');
  for (const ingredient of recipe.ingredients) {
    const food = byId.get(ingredient.foodId);
    if (!food || ingredient.unit !== food.recipeUnit || seen.has(food.id)) throw new Error(`Invalid ingredient ${ingredient.foodId}`);
    seen.add(food.id);
    if (!Number.isFinite(ingredient.amount) || ingredient.amount <= 0) throw new Error('Invalid ingredient amount');
    let factor = ingredient.amount / recipe.baseServings;
    if (food.nutrition.basis !== 'per_unit') {
      if (ingredient.unit === 'ud') {
        if (!(food.approximateEdibleWeight_g_per_unit > 0)) throw new Error('Missing edible weight');
        factor *= food.approximateEdibleWeight_g_per_unit;
      }
      factor /= 100;
    }
    for (const key of nutrientKeys) totals[key] += factor * food.nutrition[key];
  }
  return totals;
}

// A targeted documentary guard, not a claim that every step is culinarily sound.
export function undocumentedCondiments(recipe) {
  const text = recipe.steps.join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return recipe.ingredients.filter((item) =>
    (item.foodId === 'oliveoil' && !/aceite|aove/.test(text))
    || (item.foodId === 'soySauce' && !/salsa de soja/.test(text)))
    .map((item) => item.foodId);
}

export async function calculateImpact(baselineFile = 'source-data/baseline-catalogs.json') {
  const [baseline, foodDoc, recipeDoc] = await Promise.all([
    readJson(new URL(baselineFile, results)),
    readJson(new URL('../data/foods.json', import.meta.url)),
    readJson(new URL('../data/recipes.json', import.meta.url)),
  ]);
  const oldRecipes = new Map(baseline.recipes.recipes.map((recipe) => [recipe.id, recipe]));
  return recipeDoc.recipes.map((recipe) => {
    const before = recipeNutrition(oldRecipes.get(recipe.id), baseline.foods.foods);
    const after = recipeNutrition(recipe, foodDoc.foods);
    const delta = Object.fromEntries(nutrientKeys.map((key) => [key, after[key] - before[key]]));
    return { recipe_id: recipe.id, name: recipe.name, basis: 'per_base_serving', before, after, delta };
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sinceL3 = process.argv.includes('--since-l3');
  const impact = await calculateImpact(sinceL3 ? 'source-data/l3-state.json' : undefined);
  const output = new URL(sinceL3 ? 'recipe-impact-l4.json' : 'recipe-impact.json', results);
  if (process.argv.includes('--write')) {
    await writeFile(output, JSON.stringify(impact, null, 2) + '\n');
  } else {
    // Prior reports retain deleted recipes as historical audit evidence.
    const currentIds = new Set(impact.map(row => row.recipe_id));
    const saved = (await readJson(output)).filter(row => currentIds.has(row.recipe_id));
    // Keep historical labels intact; compare IDs, bases and every nutritional value.
    const numerical = rows => rows.map(({name, ...row}) => row);
    if (JSON.stringify(numerical(saved)) !== JSON.stringify(numerical(impact))) throw new Error('Impact report is stale; run with --write after reviewing changes');
  }
  const affected = impact.filter((row) => nutrientKeys.some((key) => Math.abs(row.delta[key]) > 1e-9));
  console.log(`${impact.length} recipes recalculated; ${affected.length} with nutritional changes. ${process.argv.includes('--write') ? 'Report written.' : 'Report current.'}`);
}
