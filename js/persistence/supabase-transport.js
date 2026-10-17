const TABLES = [
  'plan_cycles',
  'planned_meals',
  'meal_completions',
  'meal_completion_ingredients',
  'meal_completion_shortfalls',
  'inventory_movements',
  'weight_logs',
  'activity_sessions',
  'training_logs',
  'prep_tasks',
  'shopping_sessions',
  'shopping_session_items',
];

export function createSupabaseTransport({ getClient, getUserId }) {
  let shortfallsAvailable = null;

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

  function isMissingShortfallsTable(error) {
    return error?.code === 'PGRST205'
      || error?.code === '42P01'
      || /could not find the table ['"]?public\.meal_completion_shortfalls['"]? in the schema cache/i.test(error?.message || '');
  }

  async function readOptionalShortfalls() {
    try {
      const rows = await readRows('meal_completion_shortfalls');
      shortfallsAvailable = true;
      return rows;
    } catch (error) {
      if (!isMissingShortfallsTable(error)) throw error;
      shortfallsAvailable = false;
      return [];
    }
  }

  async function probeShortfalls() {
    await readOptionalShortfalls();
    return shortfallsAvailable;
  }

  async function fetchSnapshot() {
    const [settings, profile, shortfalls, ...rows] = await Promise.all([
      readOne('user_settings'),
      readOne('profiles'),
      readOptionalShortfalls(),
      ...TABLES.filter((table) => table !== 'meal_completion_shortfalls').map((table) => readRows(table)),
    ]);
    const [cycles, plannedMeals, completions, ingredients, movements, weights, activities, training, prep, shoppingSessions, shoppingItems] = rows;
    return { settings, profile, cycles, plannedMeals, completions, ingredients, shortfalls, shortfallsAvailable, movements, weights, activities, training, prep, shoppingSessions, shoppingItems };
  }

  function submitSnapshot(rpcName, snapshot, expectedRevision) {
    return getClient().rpc(rpcName, {
      p_snapshot: snapshot,
      p_expected_revision: expectedRevision,
    });
  }

  return { readRows, readOne, fetchSnapshot, probeShortfalls, supportsShortfalls: () => shortfallsAvailable, submitSnapshot };
}
