const MISSING = Symbol('missing');

function clone(value) {
  if (value === MISSING) return MISSING;
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function same(left, right) {
  if (left === MISSING || right === MISSING) return left === right;
  return JSON.stringify(left) === JSON.stringify(right);
}

function valueAt(source, key) {
  return Object.prototype.hasOwnProperty.call(source || {}, key) ? source[key] : MISSING;
}

function mergeValue(base, local, remote) {
  if (same(local, remote)) return clone(local);
  if (same(local, base)) return clone(remote);
  if (same(remote, base)) return clone(local);

  if ([base, local, remote].every((value) => value === MISSING || (value && typeof value === 'object' && !Array.isArray(value)))) {
    const result = {};
    const keys = new Set([
      ...Object.keys(base === MISSING ? {} : base),
      ...Object.keys(local === MISSING ? {} : local),
      ...Object.keys(remote === MISSING ? {} : remote),
    ]);
    for (const key of keys) {
      const merged = mergeValue(
        valueAt(base === MISSING ? {} : base, key),
        valueAt(local === MISSING ? {} : local, key),
        valueAt(remote === MISSING ? {} : remote, key),
      );
      if (merged !== MISSING && merged !== undefined) result[key] = merged;
    }
    return result;
  }

  // Supabase has the newer accepted revision when both devices changed one value.
  return clone(remote);
}

function rowsByKey(rows, key) {
  return new Map((rows || []).filter((row) => row && row[key] != null).map((row) => [String(row[key]), row]));
}

function mergeRowsByKey(baseRows, localRows, remoteRows, key) {
  const base = rowsByKey(baseRows, key);
  const local = rowsByKey(localRows, key);
  const remote = rowsByKey(remoteRows, key);
  const keys = new Set([...base.keys(), ...local.keys(), ...remote.keys()]);
  const merged = [];

  for (const id of keys) {
    const row = mergeValue(base.has(id) ? base.get(id) : MISSING, local.has(id) ? local.get(id) : MISSING, remote.has(id) ? remote.get(id) : MISSING);
    if (row !== MISSING && row !== undefined) merged.push(row);
  }
  return merged;
}

function mergeIndexed(base, local, remote) {
  if (![base, local, remote].every(Array.isArray)) return mergeValue(base, local, remote);
  const length = Math.max(base.length, local.length, remote.length);
  const result = [];
  for (let index = 0; index < length; index += 1) {
    const baseValue = index < base.length ? base[index] : MISSING;
    const localValue = index < local.length ? local[index] : MISSING;
    const remoteValue = index < remote.length ? remote[index] : MISSING;
    const value = [baseValue, localValue, remoteValue].every(Array.isArray)
      ? mergeIndexed(baseValue, localValue, remoteValue)
      : mergeValue(baseValue, localValue, remoteValue);
    if (value !== MISSING && value !== undefined) result[index] = value;
  }
  return result;
}

function mergePlan(base, local, remote) {
  if (same(local, remote)) return clone(local);
  if (same(local, base)) return clone(remote);
  if (same(remote, base)) return clone(local);
  if (![base, local, remote].every((plan) => plan && typeof plan === 'object' && !Array.isArray(plan))) return clone(remote);

  const stableFields = ['active', 'cycleId', 'start', 'catalogVersion', 'generatedAt'];
  if (!stableFields.every((field) => same(base[field], local[field]) && same(base[field], remote[field]))) return clone(remote);

  const merged = mergeValue(base, local, remote);
  if (Array.isArray(base.menus) && Array.isArray(local.menus) && Array.isArray(remote.menus)) {
    merged.menus = mergeIndexed(base.menus, local.menus, remote.menus);
  }
  if (Array.isArray(base.locked) && Array.isArray(local.locked) && Array.isArray(remote.locked)) {
    merged.locked = mergeIndexed(base.locked, local.locked, remote.locked);
  }
  return merged;
}

function mergeCartExtras(baseRows, localRows, remoteRows) {
  const totals = (rows) => {
    const result = new Map();
    for (const row of rows || []) {
      if (!row?.id || !Number.isFinite(Number(row.size))) continue;
      const scope = row.scope || 'current';
      const key = `${scope}|${row.id}|${Number(row.size)}`;
      const current = result.get(key) || { id: row.id, size: Number(row.size), count: 0, ...(scope === 'current' ? {} : { scope }) };
      current.count += Math.max(0, Number(row.count) || 0);
      result.set(key, current);
    }
    return result;
  };
  const base = totals(baseRows), local = totals(localRows), remote = totals(remoteRows);
  const keys = new Set([...base.keys(), ...local.keys(), ...remote.keys()]);
  const merged = [];
  for (const key of keys) {
    const baseCount = base.get(key)?.count || 0;
    const localCount = local.get(key)?.count || 0;
    const remoteCount = remote.get(key)?.count || 0;
    let count;
    if (localCount === remoteCount) count = localCount;
    else if (localCount === baseCount) count = remoteCount;
    else if (remoteCount === baseCount) count = localCount;
    else if (localCount > baseCount && remoteCount > baseCount) count = baseCount + (localCount - baseCount) + (remoteCount - baseCount);
    else count = remoteCount;
    const source = remote.get(key) || local.get(key) || base.get(key);
    if (source && count > 0) merged.push({ ...source, count });
  }
  return merged;
}

function mergeActivitySessions(baseIds, localRows, remoteRows, remoteIds, deletedIds) {
  const knownAtBase = new Set(baseIds || []);
  const presentRemotely = new Set(remoteIds || []);
  const deletedLocally = new Set(deletedIds || []);
  const merged = new Map();

  for (const session of remoteRows || []) if (session?.id && !deletedLocally.has(session.id)) merged.set(session.id, session);
  for (const session of localRows || []) {
    if (!session?.id || deletedLocally.has(session.id)) continue;
    if (knownAtBase.has(session.id) && !presentRemotely.has(session.id)) continue;
    if (!merged.has(session.id)) merged.set(session.id, session);
  }

  const rows = [...merged.values()]
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.createdAt).localeCompare(String(b.createdAt)))
    .slice(-2000);
  const rowsById = new Set(rows.map((row) => row.id));
  return {
    rows,
    deletedIds: [...deletedLocally].filter((id) => presentRemotely.has(id) && !rowsById.has(id)).slice(-2000),
  };
}

function mergeWeights(baseValues, localRows, remoteRows, deletedDates) {
  const base = new Map(Object.entries(baseValues || {}).map(([date, kg]) => [date, { date, kg: Number(kg) }]));
  const local = rowsByKey(localRows, 'date');
  const remote = rowsByKey(remoteRows, 'date');
  const deletedLocally = new Set(deletedDates || []);
  for (const date of deletedLocally) local.delete(date);

  const keys = new Set([...base.keys(), ...local.keys(), ...remote.keys()]);
  const merged = new Map();
  for (const date of keys) {
    const row = mergeValue(base.has(date) ? base.get(date) : MISSING, local.has(date) ? local.get(date) : MISSING, remote.has(date) ? remote.get(date) : MISSING);
    if (row !== MISSING && row !== undefined) merged.set(date, row);
  }

  const pendingDeletes = [...deletedLocally].filter((date) => remote.has(date) && !merged.has(date)).slice(-1500);
  return { rows: [...merged.values()].sort((a, b) => a.date.localeCompare(b.date)), deletedDates: pendingDeletes };
}

function mergeArchives(baseRows, localRows, remoteRows) {
  const signature = (cycle) => [cycle?.start, cycle?.catalogVersion, JSON.stringify(cycle?.menus || [])].join('|');
  const allRows = [...(baseRows || []), ...(localRows || []), ...(remoteRows || [])].filter(Boolean);
  const idsBySignature = new Map();
  for (const row of allRows) {
    if (!row.cycleId) continue;
    const key = signature(row);
    if (!idsBySignature.has(key)) idsBySignature.set(key, new Set());
    idsBySignature.get(key).add(row.cycleId);
  }
  const toMap = (rows) => new Map((rows || []).filter(Boolean).map((row) => {
    const knownIds = idsBySignature.get(signature(row));
    const normalized = !row.cycleId && knownIds?.size === 1 ? { ...row, cycleId: [...knownIds][0] } : row;
    return [normalized.cycleId ? `id:${normalized.cycleId}` : `legacy:${signature(normalized)}`, normalized];
  }));
  const base = toMap(baseRows);
  const local = toMap(localRows);
  const remote = toMap(remoteRows);
  const keys = new Set([...base.keys(), ...local.keys(), ...remote.keys()]);
  return [...keys]
    .map((key) => mergeValue(base.has(key) ? base.get(key) : MISSING, local.has(key) ? local.get(key) : MISSING, remote.has(key) ? remote.get(key) : MISSING))
    .filter((row) => row !== MISSING && row !== undefined)
    .sort((a, b) => String(a.archivedAt || a.start).localeCompare(String(b.archivedAt || b.start)))
    .slice(-6);
}

function mergeableState(state = {}) {
  return {
    profile: Object.hasOwn(state, 'profile') ? state.profile : {},
    profileConfirmed: state.profileConfirmed === true,
    noActiveCycle: state.noActiveCycle === true,
    activeCycleId: state.activeCycleId || null,
    start: state.start,
    activeMenus: state.activeMenus || null,
    activeMenuCatalogVersion: state.activeMenuCatalogVersion || null,
    activeMenuGeneratedAt: state.activeMenuGeneratedAt || null,
    activeMenuConfirmedAt: state.activeMenuConfirmedAt || null,
    activeMenuRecoveryFocus: state.activeMenuRecoveryFocus === true,
    activePlanDetails: state.activePlanDetails || null,
    unavailablePlanRows: state.unavailablePlanRows || null,
    cloudPlanIssue: state.cloudPlanIssue || null,
    done: state.done || {},
    reversedDone: state.reversedDone || {},
    legacyStrengthDays: state.legacyStrengthDays || {},
    prep: state.prep || {},
    archives: state.archives || [],
    nextMenu: state.nextMenu || null,
    plannerDraft: state.plannerDraft || null,
    cart: state.cart || {},
    cartExtras: state.cartExtras || [],
    lastBackupAt: state.lastBackupAt || null,
    // Keep omission distinguishable from an explicit normal/null reset. Old
    // reconciliation bases have no knowledge of these values.
    ...Object.fromEntries(['setupMode', 'setupDraft', 'planningPreferences']
      .filter(key => Object.hasOwn(state, key)).map(key => [key, state[key]])),
  };
}

export function createReconciliationBase(state) {
  return mergeableState(state);
}

function canonicalCompletions(state) {
  const completed = new Map();
  const add = (sourceId, entry) => {
    if (!entry?.operationId || !sourceId) return;
    const key = String(sourceId);
    if (!completed.has(key)) completed.set(key, new Set());
    completed.get(key).add(String(entry.operationId));
  };
  const collect = entries => {
    for (const [sourceId, entry] of Object.entries(entries || {})) {
      add(sourceId, entry);
    }
  };
  const collectReversed = entries => {
    for (const entry of Object.values(entries || {})) add(entry?.mealKey, entry);
  };
  for (const archive of state.archives || []) {
    collect(archive?.done);
    collectReversed(archive?.reversedDone);
  }
  collectReversed(state.reversedDone);
  collect(state.done);
  return completed;
}

export function reconcileStates(baseState, localState, remoteState, options = {}) {
  const base = mergeableState(baseState);
  const local = mergeableState(localState);
  const remote = mergeableState(remoteState);
  const result = JSON.parse(JSON.stringify(remoteState));
  const activePlan = mergePlan(
    { active: !base.noActiveCycle, cycleId: base.activeCycleId, start: base.start, catalogVersion: base.activeMenuCatalogVersion, generatedAt: base.activeMenuGeneratedAt, confirmedAt: base.activeMenuConfirmedAt, details:base.activePlanDetails,recoveryFocus: base.activeMenuRecoveryFocus, menus: base.activeMenus, reversedDone: base.reversedDone },
    { active: !local.noActiveCycle, cycleId: local.activeCycleId, start: local.start, catalogVersion: local.activeMenuCatalogVersion, generatedAt: local.activeMenuGeneratedAt, confirmedAt: local.activeMenuConfirmedAt, details:local.activePlanDetails,recoveryFocus: local.activeMenuRecoveryFocus, menus: local.activeMenus, reversedDone: local.reversedDone },
    { active: !remote.noActiveCycle, cycleId: remote.activeCycleId, start: remote.start, catalogVersion: remote.activeMenuCatalogVersion, generatedAt: remote.activeMenuGeneratedAt, confirmedAt: remote.activeMenuConfirmedAt, details:remote.activePlanDetails,recoveryFocus: remote.activeMenuRecoveryFocus, menus: remote.activeMenus, reversedDone: remote.reversedDone },
  );
  result.start = activePlan?.start ?? remote.start;
  result.activeCycleId = activePlan?.cycleId ?? null;
  result.activePlanDetails = activePlan?.details || null;
  result.activeMenus = activePlan?.menus ?? null;
  result.activeMenuCatalogVersion = activePlan?.catalogVersion ?? null;
  result.activeMenuGeneratedAt = activePlan?.generatedAt ?? null;
  result.activeMenuConfirmedAt = activePlan?.confirmedAt ?? null;
  result.activeMenuRecoveryFocus = activePlan?.recoveryFocus === true;
  result.cloudPlanIssue = mergeValue(base.cloudPlanIssue, local.cloudPlanIssue, remote.cloudPlanIssue);
  result.reversedDone = activePlan?.reversedDone || {};
  result.profile = mergeValue(base.profile, local.profile, remote.profile);
  result.profileConfirmed = mergeValue(base.profileConfirmed, local.profileConfirmed, remote.profileConfirmed);
  for (const key of ['setupMode', 'setupDraft', 'planningPreferences']) {
    const baseline = valueAt(base, key), localValue = valueAt(local, key), remoteValue = valueAt(remote, key);
    const value = mergeValue(baseline, localValue === MISSING ? baseline : localValue,
      remoteValue === MISSING ? baseline : remoteValue);
    if (value !== MISSING && value !== undefined) result[key] = value;
  }
  // Cycle existence must follow the same winning value as its date and menu.
  // Merging this flag separately can produce an active plan marked as missing
  // (or vice versa), which may submit a snapshot without the selected cycle.
  result.noActiveCycle = activePlan?.active !== true;
  result.done = mergeValue(base.done, local.done, remote.done);
  result.legacyStrengthDays = mergeValue(base.legacyStrengthDays, local.legacyStrengthDays, remote.legacyStrengthDays);
  result.prep = mergeValue(base.prep, local.prep, remote.prep);
  result.archives = mergeArchives(base.archives, local.archives, remote.archives);
  result.nextMenu = mergePlan(base.nextMenu, local.nextMenu, remote.nextMenu);
  result.plannerDraft = mergePlan(base.plannerDraft, local.plannerDraft, remote.plannerDraft);
  result.cart = mergeValue(base.cart, local.cart, remote.cart);
  result.cartExtras = mergeCartExtras(base.cartExtras, local.cartExtras, remote.cartExtras);
  result.lastBackupAt = mergeValue(base.lastBackupAt, local.lastBackupAt, remote.lastBackupAt);

  const winningCompletions = canonicalCompletions(result);
  result.movements = mergeRowsByKey([], localState.movements, remoteState.movements, 'operationId')
    .filter((move) => {
      if (!move?.sourceId) return true;
      const winners = winningCompletions.get(move.sourceId);
      if (!winners?.size) return true;
      const operationId = String(move.operationId || '');
      const rootOperationId = operationId.startsWith('revert:')
        ? operationId.slice(7).replace(new RegExp(`:${move.foodId}$`), '')
        : operationId.replace(new RegExp(`:${move.foodId}$`), '');
      return winners.has(rootOperationId);
    })
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  const activity = mergeActivitySessions(options.baseActivityIds, localState.activitySessions, remoteState.activitySessions, options.remoteActivityIds, localState.deletedActivitySessionIds);
  result.activitySessions = activity.rows;
  result.deletedActivitySessionIds = activity.deletedIds;

  const weights = mergeWeights(options.baseWeightValues, localState.weights, remoteState.weights, localState.deletedWeightDates);
  result.weights = weights.rows;
  result.deletedWeightDates = weights.deletedDates;
  result.purchases = result.movements.filter((move) => move.kind === 'purchase' && Number(move.quantity) > 0)
    .slice(-2500)
    .map((move) => ({ id: move.foodId, amount: Number(move.quantity), date: move.createdAt, operationId: move.operationId }));
  result.stock = {};
  result.resetCloudPending = localState.resetCloudPending === true;
  return result;
}
