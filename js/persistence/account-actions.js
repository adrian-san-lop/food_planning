const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const changedRows = (base, next, key) => {
  const known = new Map((base || []).map(row => [key(row), row]));
  return (next || []).filter(row => !same(known.get(key(row)), row));
};
const fields = (base, next) => Object.fromEntries(Object.entries(next || {}).filter(([key, value]) => !same(base?.[key], value)));

/** A transient, scoped command. Omitting a resource never means deleting it. */
export function createAccountAction(base = {}, next = {}) {
  const action = { contract: 2 };
  for (const key of ['profile', 'setup_draft', 'menu_preferences']) {
    const patch = fields(base[key], next[key]);
    if (Object.keys(patch).length) action[key] = patch;
  }
  for (const key of ['setup_mode', 'planning_contract']) if (!same(base[key], next[key])) action[key] = next[key];
  for (const [key, identity] of [
    ['cycles', row => row.id], ['planned_meals', row => row.id],
    ['prep_tasks', row => `${row.cycle_id}:${row.week_index}:${row.task_key}`],
    ['recipe_preferences', row => row.recipe_id], ['completions', row => row.operation_id],
    ['movements', row => row.operation_id], ['weights', row => row.measured_on],
    ['activity_sessions', row => row.client_id],
    ['plan_recipes', row => `${row.cycle_id}:${row.recipe_id}`],
    ['plan_ingredients', row => `${row.cycle_id}:${row.recipe_id}:${row.ingredient_index}`],
    ['meal_portions', row => `${row.planned_meal_id}:${row.food_id}`],
    ['day_targets', row => `${row.cycle_id}:${row.meal_date}`],
  ]) {
    const rows = changedRows(base[key], next[key], identity);
    if (rows.length) action[key] = rows;
  }
  // A changed cycle is an atomic 105-slot aggregate, even when one slot changes.
  const cycleIds = new Set([...(action.cycles || []).map(row => row.id), ...(action.planned_meals || []).map(row => row.cycle_id)]);
  if (cycleIds.size) {
    action.cycles = (next.cycles || []).filter(row => cycleIds.has(row.id));
    action.planned_meals = (next.planned_meals || []).filter(row => cycleIds.has(row.cycle_id));
  }
  const retired = (base.cycles || []).filter(row => ['active','scheduled','draft'].includes(row.status) && !(next.cycles || []).some(nextRow => nextRow.id === row.id));
  if (retired.length) action.retired_cycles = retired.map(row => ({id:row.id,status:row.status === 'active' ? 'archived' : 'superseded'}));
  for (const [key, identity] of [['plan_ingredients',row => `${row.cycle_id}:${row.recipe_id}`], ['meal_portions',row => row.planned_meal_id]]) {
    const groups = rows => {const map = new Map();for(const row of rows || []){const id=identity(row);if(!map.has(id))map.set(id,[]);map.get(id).push(row)}return map};
    const before=groups(base[key]),after=groups(next[key]);
    const keys=new Set([...after.keys()].filter(id=>!same(before.get(id),after.get(id))));
    if(keys.size)action[key]=(next[key]||[]).filter(row=>keys.has(identity(row)));
  }
  for (const key of ['deleted_weight_dates', 'deleted_activity_ids']) if (next[key]?.length) action[key] = next[key];
  if (next.shopping) {
    const upsert = changedRows(base.shopping?.items, next.shopping.items, row => row.item_key);
    const keys = new Set((next.shopping.items || []).map(row => row.item_key));
    const remove = (base.shopping?.items || []).filter(row => !keys.has(row.item_key)).map(row => row.item_key);
    if (upsert.length || remove.length || !base.shopping) action.shopping = {
      id: next.shopping.id, starts_on: next.shopping.starts_on, ends_on: next.shopping.ends_on, upsert, remove,
    };
  }
  return action;
}

export const accountActionIsEmpty = action => Object.keys(action).every(key => key === 'contract');
