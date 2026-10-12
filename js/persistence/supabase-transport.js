const TABLES = [
  'plan_cycles',
  'planned_meals',
  'meal_completions',
  'meal_completion_ingredients',
  'inventory_movements',
  'weight_logs',
  'activity_sessions',
  'training_logs',
  'prep_tasks',
  'shopping_sessions',
  'shopping_session_items',
];

export function createSupabaseTransport({ getClient, getUserId }) {
  async function readRows(table) {
    const rows = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await getClient()
        .from(table)
        .select('*')
        .eq('user_id', getUserId())
        .range(from, from + 999);
      if (error) throw error;
      rows.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    return rows;
  }

  async function readOne(table, userId = getUserId()) {
    const { data, error } = await getClient()
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function fetchSnapshot() {
    const [settings, profile, ...rows] = await Promise.all([
      readOne('user_settings'),
      readOne('profiles'),
      ...TABLES.map((table) => readRows(table)),
    ]);
    const [cycles, plannedMeals, completions, ingredients, movements, weights, activities, training, prep, shoppingSessions, shoppingItems] = rows;
    return { settings, profile, cycles, plannedMeals, completions, ingredients, movements, weights, activities, training, prep, shoppingSessions, shoppingItems };
  }

  function submitSnapshot(rpcName, snapshot, expectedRevision) {
    return getClient().rpc(rpcName, {
      p_snapshot: snapshot,
      p_expected_revision: expectedRevision,
    });
  }

  return { readRows, readOne, fetchSnapshot, submitSnapshot };
}
