import { hasPlanningChanges, planningStateFromRows } from './planning-state.js?v=20261023-planning-persistence';

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
  let capabilityUser = null;
  let capabilities = null;
  let accountContract = 1;
  function requireAccount(user) {
    if (getUserId() !== user) throw Object.assign(new Error('La sesión ha cambiado; se descartó la respuesta anterior.'), { code: 'ACCOUNT_CHANGED' });
  }

  function resetCapabilities() { capabilityUser = null; capabilities = null; accountContract = 1; }

  async function planningAvailable({ refresh = false } = {}) {
    const user = getUserId();
    if (!refresh && capabilityUser === user && capabilities !== null) return capabilities;
    const { data, error } = await getClient().rpc('menuki_state_capabilities');
    requireAccount(user);
    // Only an absent capability RPC denotes the old schema. Permissions/network
    // errors and failures in existing/new tables must remain visible.
    if (error && !['PGRST202', '42883'].includes(error.code)) throw error;
    capabilities = !error && data?.planning_contract === 1;
    accountContract = !error && data?.account_contract === 2 ? 2 : 1;
    capabilityUser = user;
    return capabilities;
  }
  async function readRows(table) {
    const rows = [], user = getUserId();
    for (let from = 0; ; from += 1000) {
      const { data, error } = await getClient()
        .from(table)
        .select('*')
        .eq('user_id', user)
        .range(from, from + 999);
      requireAccount(user);
      if (error) throw error;
      rows.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    return rows;
  }

  async function readOne(table, userId = getUserId()) {
    const user = getUserId();
    const { data, error } = await getClient()
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    requireAccount(user);
    if (error) throw error;
    return data;
  }

  async function fetchSnapshot(attempt = 0) {
    const user = getUserId();
    const planningSupported = await planningAvailable();
    if (accountContract === 2) {
      const { data, error } = await getClient().rpc('get_menuki_state');
      requireAccount(user);
      if (error) throw error;
      if (!data || data.accountContract !== 2) throw new Error('Supabase no devolvió un estado de cuenta válido.');
      return data;
    }
    const settings = await readOne('user_settings');
    const [profile, ...rows] = await Promise.all([
      readOne('profiles'),
      ...TABLES.map((table) => readRows(table)),
    ]);
    const [cycles, plannedMeals, completions, ingredients, movements, weights, activities, training, prep, shoppingSessions, shoppingItems] = rows;
    const planning = planningSupported ? await Promise.all([
      readOne('profile_setup_drafts'), readOne('menu_preferences'), readRows('recipe_preferences'),
    ]) : [null, null, []];
    const [setupDraft, menuPreferences, recipePreferences] = planning;
    // Individual PostgREST reads are separate transactions. Never acknowledge a
    // mixture of old menu/profile data and preferences from a newer revision.
    const after = await readOne('user_settings');
    requireAccount(user);
    if (Number(settings?.sync_revision || 0) !== Number(after?.sync_revision || 0)
        || settings?.state_initialized_at !== after?.state_initialized_at) {
      if (attempt < 2) return fetchSnapshot(attempt + 1);
      throw Object.assign(new Error('La cuenta está recibiendo cambios desde otro dispositivo. Vuelve a intentarlo.'), { code: 'CLOUD_SNAPSHOT_BUSY' });
    }
    return { settings, profile, cycles, plannedMeals, completions, ingredients, movements, weights, activities, training, prep, shoppingSessions, shoppingItems,
      planningSupported, setupDraft, menuPreferences, recipePreferences };
  }

  async function submitAction(action, expectedRevision, operationId) {
    const user = getUserId();
    const result = await getClient().rpc('apply_menuki_action', {
      p_action: action, p_expected_revision: expectedRevision, p_operation_id: operationId,
    });
    requireAccount(user);
    return result;
  }

  async function submitSnapshot(rpcName, snapshot, expectedRevision) {
    const user = getUserId();
    let payload = snapshot;
    if (!await planningAvailable({ refresh: capabilities === false })) {
      // The current UI can use the legacy writer until the migration is applied.
      // Never acknowledge preferences/progress that the old RPC would ignore.
      const defaults = { setupMode: snapshot.setup_mode };
      if (snapshot.setup_draft || snapshot.menu_preferences || snapshot.recipe_preferences) {
        Object.assign(defaults, planningStateFromRows({ settings: { setup_mode: snapshot.setup_mode },
          setupDraft: snapshot.setup_draft, menuPreferences: snapshot.menu_preferences, recipePreferences: snapshot.recipe_preferences }));
      }
      if (hasPlanningChanges(defaults)) throw Object.assign(new Error('El guardado de preferencias y configuración requiere aplicar la migración de planificación en Supabase. El resto de la cuenta sigue disponible.'), { code: 'PLANNING_SCHEMA_REQUIRED' });
      const { planning_contract, setup_mode, setup_draft, menu_preferences, recipe_preferences, ...legacy } = snapshot;
      payload = legacy;
    }
    requireAccount(user);
    const result = await getClient().rpc(rpcName, {
      p_snapshot: payload,
      p_expected_revision: expectedRevision,
    });
    requireAccount(user);
    return result;
  }

  return { readRows, readOne, fetchSnapshot, submitSnapshot, submitAction, planningAvailable, resetCapabilities, stateContract: () => accountContract };
}
