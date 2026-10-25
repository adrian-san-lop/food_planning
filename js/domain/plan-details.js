import { createNutritionService } from './nutrition.js?v=20261022-practical-portions';
import { addDays, dateFromISO, isoDate } from './dates.js?v=20261015-european-date';

export const PLAN_CALCULATION_VERSION = '2026-10-25.1';
const copy = value => JSON.parse(JSON.stringify(value));

/** Materialize a plan only on an explicit edit. Reading it never regenerates it. */
export function materializePlan({ start, menus, profile, weights = [], activities = [], done = {}, previous, catalog, asOf }) {
  if (!profile || !dateFromISO(start)) return null;
  const ids = [...new Set(menus.flat(2))];
  const recipes = {}, foods = {}, foodMeta = {}, purchase = {};
  for (const id of ids) {
    const recipe = previous?.recipes?.[id] || catalog.recipeById[id];
    if (!recipe) return null;
    recipes[id] = copy(recipe);
    for (const ingredient of recipe.ingredients) {
      const foodId = ingredient.id;
      const food = previous?.foods?.[foodId] || catalog.foods[foodId];
      if (!food) return null;
      foods[foodId] = copy(food);
      foodMeta[foodId] = copy(previous?.foodMeta?.[foodId] || catalog.foodMeta[foodId] || {});
      purchase[foodId] = copy(previous?.catalog?.[foodId] || catalog.catalog[foodId] || ['merc', 'Otros', 1]);
    }
  }
  const recent = weights.filter(row => row.date <= asOf).sort((a,b) => b.date.localeCompare(a.date)).slice(0,3);
  const weight = profile.followWeight && recent.length ? Math.round(recent.reduce((sum,row) => sum + Number(row.kg),0) / recent.length * 10) / 10 : profile.weight;
  const nutrition = createNutritionService({ getFood: () => foods, getFoodMeta: () => foodMeta, getEffectiveWeight: () => weight });
  const result = { calculationVersion: PLAN_CALCULATION_VERSION, recipes, foods, foodMeta, catalog: purchase, portions: {}, targets: {}, signatures: {}, events: {}, versions: {} };
  for (let offset=0; offset<21; offset++) {
    const date = isoDate(addDays(dateFromISO(start), offset)), dayIds = menus[Math.floor(offset/7)][offset%7];
    const fixed = dayIds.map((_,slot) => done[date+'#'+slot]?.usage || null);
    const activity = Math.round(activities.filter(row => row.date === date).reduce((sum,row) => sum + Math.max(0,Number(row.met)-1)*weight*Number(row.durationMinutes)/60,0));
    const signature = JSON.stringify([dayIds,profile,weight,activity,fixed]);
    const event=JSON.stringify([dayIds,activities.filter(row=>row.date===date),fixed]);
    const oldDay = dayIds.every((_,slot) => previous?.portions?.[date+'#'+slot]);
    // Historical quantities and targets remain fixed. Completed quantities always win.
    const reuse = oldDay && ((date < asOf && previous.events?.[date] === event) || previous.signatures?.[date] === signature);
    const portions = reuse ? dayIds.map((_,slot) => previous.portions[date+'#'+slot])
      : nutrition.portionsForRecipes(dayIds.map(id => recipes[id]),activity,profile,weight,fixed);
    for (let slot=0; slot<5; slot++) result.portions[date+'#'+slot] = copy(fixed[slot] || portions[slot]);
    result.targets[date] = copy(reuse && previous.targets?.[date] || nutrition.nutritionTarget(activity,profile,weight));
    result.events[date]=event;result.versions[date]=reuse?(previous.versions?.[date]||previous.calculationVersion):PLAN_CALCULATION_VERSION;
    result.signatures[date] = reuse ? previous.signatures?.[date] || signature : signature;
  }
  return result;
}

/** Validate persisted recipe snapshots before letting them enter runtime models. */
export function cleanPlanDetails(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.calculationVersion !== 'string') return null;
  const recipes = Object.entries(raw.recipes || {}), foods = Object.entries(raw.foods || {});
  if (!recipes.length || recipes.length > 105 || foods.length > 500) return null;
  const idPattern = /^[a-z][a-zA-Z0-9_]*$/;
  if (foods.some(([id,row]) => !idPattern.test(id) || !Array.isArray(row) || row.length !== 6 || typeof row[0] !== 'string'
    || !['g','ml','ud'].includes(row[1]) || row.slice(2,6).length !== 4 || row.slice(2,6).some(n => !Number.isFinite(n) || n < 0))) return null;
  if (recipes.some(([id,row]) => !idPattern.test(id) || row.id !== id || typeof row.name !== 'string'
    || !['desayuno','media','comida','tarde','cena'].includes(row.type) || !Array.isArray(row.steps)
    || row.steps.some(step => typeof step !== 'string') || !Array.isArray(row.ingredients)
    || row.ingredients.some(item => !raw.foods[item.id] || !Number.isFinite(item.rest) || item.rest <= 0))) return null;
  if(Object.keys(raw.portions||{}).length!==105||Object.keys(raw.targets||{}).length!==21)return null;
  for(const [date,target] of Object.entries(raw.targets||{}))if(!dateFromISO(date)||['calories','protein','carb','fat'].some(key=>!Number.isFinite(target?.[key])||target[key]<0))return null;
  for (const [key,usage] of Object.entries(raw.portions || {})) {
    if (!/^\d{4}-\d{2}-\d{2}#[0-4]$/.test(key) || !dateFromISO(key.slice(0,10)) || !raw.targets[key.slice(0,10)] || !usage || typeof usage !== 'object'
      || Object.entries(usage).some(([id,amount]) => !raw.foods[id] || !Number.isFinite(amount) || amount < 0)) return null;
  }
  return copy(raw);
}

export function detailsFromRows(data, cycleId) {
  const rows = (data.planRecipes || []).filter(row => row.cycle_id === cycleId);
  if (!rows.length) return null;
  const details = { calculationVersion: PLAN_CALCULATION_VERSION, recipes: {}, foods: {}, foodMeta: {}, catalog: {}, portions: {}, targets: {}, signatures: {}, events: {}, versions: {} };
  for (const row of rows) details.recipes[row.recipe_id] = { id: row.recipe_id, name: row.name, type: row.meal_type, time: Number(row.time_minutes), intro: row.description || '', tip: row.tip || '', steps: row.steps, ingredients: [] };
  for (const row of (data.planIngredients || []).filter(row => row.cycle_id === cycleId).sort((a,b) => a.ingredient_index-b.ingredient_index)) {
    const recipe = details.recipes[row.recipe_id]; if (!recipe) continue;
    recipe.ingredients.push({id:row.food_id,rest:Number(row.base_quantity)});
    details.foods[row.food_id] = row.food_snapshot.food;
    details.foodMeta[row.food_id] = row.food_snapshot.meta;
    details.catalog[row.food_id] = row.food_snapshot.purchase;
  }
  const meals = new Map(data.plannedMeals.filter(row => row.cycle_id === cycleId).map(row => [row.id,row]));
  for (const row of data.mealPortions || []) {
    const meal = meals.get(row.planned_meal_id); if (!meal) continue;
    const key = meal.meal_date+'#'+meal.slot;
    (details.portions[key] ||= {})[row.food_id] = Number(row.quantity);
  }
  for (const row of (data.dayTargets || []).filter(row => row.cycle_id === cycleId)) {
    details.targets[row.meal_date] = row.target;
    details.signatures[row.meal_date] = row.input_signature;
    details.events[row.meal_date] = row.event_signature;details.versions[row.meal_date]=row.calculation_version;
    details.calculationVersion = row.calculation_version;
  }
  return cleanPlanDetails(details);
}

export function savedPlanDay(plan, week, day, overrideIds) {
  const details=plan?.details;
  if(!details||!dateFromISO(plan.start))return null;
  const date=isoDate(addDays(dateFromISO(plan.start),week*7+day)),ids=overrideIds||plan.menus?.[week]?.[day];
  try{if(JSON.stringify(JSON.parse(details.signatures[date])[0])!==JSON.stringify(ids))return null}catch{return null}
  const portions=Array.from({length:5},(_,slot)=>details.portions[date+'#'+slot]);
  return portions.every(Boolean)?{portions,target:details.targets[date],foods:details.foods}:null;
}
