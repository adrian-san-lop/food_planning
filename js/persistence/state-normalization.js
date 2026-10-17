const CURRENT_STATE_VERSION = 10;
const SUPPORTED_STATE_VERSIONS = [5, 6, 7, 8, 9, 10];
const RECIPE_GRAMS_TO_PIECES = new Set(['banana', 'apple', 'kiwi', 'mandarin', 'orange', 'pear', 'seasonFruit', 'bread']);

/**
 * Builds the normalizer for Menuki's browser working copy. Conversion rules are
 * injected so this module can be tested against the real v5-v10 migration path.
 */
export function createStateNormalizer({
  emptyState,
  getFood,
  inventoryUnits,
  normalizeLegacyDeduction,
  dateFromISO,
  isoDate,
  today,
  activityById,
  sanitizeProfile,
  validMenuSnapshot,
  isUuid,
  cloneMenus,
  roundAmount,
}) {
  const {
    foodStockUnit,
    foodPieceWeight,
    recipeToStockAmount,
    stockToRecipeAmount,
    storedRecipeToCurrentAmount,
    normalizeQuantityMap,
    convertLegacyPack,
  } = inventoryUnits;

  function safeWeightList(input) {
    return Array.isArray(input)
      ? input.filter((weight) => dateFromISO(weight.date)
        && Number.isFinite(Number(weight.kg))
        && Number(weight.kg) >= 30
        && Number(weight.kg) <= 250)
        .slice(-1500)
        .map((weight) => ({ date: weight.date, kg: Number(weight.kg) }))
      : [];
  }

  function safeActivitySessions(input) {
    if (!Array.isArray(input)) return [];
    const seen = new Set();
    return input.filter((session) => {
      if (!session || typeof session.id !== 'string' || !session.id || seen.has(session.id)
        || !dateFromISO(session.date) || session.date > isoDate(today())
        || typeof session.activityId !== 'string' || !session.activityId) return false;
      const duration = Number(session.durationMinutes);
      const met = Number(session.met);
      if (!Number.isInteger(duration) || duration < 1 || duration > 600
        || (Number.isFinite(met) && (met < 1 || met > 20))) return false;
      seen.add(session.id);
      return true;
    }).slice(-2000).map((session) => ({
      id: session.id,
      date: session.date,
      activityId: session.activityId,
      met: Number.isFinite(Number(session.met)) ? Number(session.met) : (activityById[session.activityId]?.met || 1),
      durationMinutes: Number(session.durationMinutes),
      createdAt: typeof session.createdAt === 'string' ? session.createdAt : new Date().toISOString(),
    }));
  }

  function legacyV5StockAmount(id, value) {
    const amount = Number(value) || 0;
    return foodStockUnit(id) === 'ud' && foodPieceWeight(id) > 0
      ? amount / foodPieceWeight(id)
      : amount;
  }

  function legacyRecipeAmountToCurrent(id, value, sourceVersion) {
    let amount = Number(value) || 0;
    if (sourceVersion >= 6 && sourceVersion < 8) {
      if (RECIPE_GRAMS_TO_PIECES.has(id)) amount = foodStockUnit(id) === 'ud' ? amount * foodPieceWeight(id) : amount;
      else amount = stockToRecipeAmount(id, amount);
    }
    return sourceVersion < CURRENT_STATE_VERSION && RECIPE_GRAMS_TO_PIECES.has(id)
      ? storedRecipeToCurrentAmount(id, amount, 'g')
      : amount;
  }

  function normalizeDoneEntries(entries, sourceVersion) {
    const out = {};
    for (const [key, entry] of Object.entries(entries || {})) {
      if (!entry || typeof entry !== 'object') continue;
      const oldUsage = entry.usage && typeof entry.usage === 'object' ? entry.usage : {};
      const usage = normalizeQuantityMap(oldUsage, (id, value) => legacyRecipeAmountToCurrent(id, value, sourceVersion));
      const hasDeducted = entry.deducted && typeof entry.deducted === 'object';
      const deductedSource = hasDeducted ? entry.deducted : (sourceVersion === 5 ? {} : sourceVersion >= 8 ? usage : oldUsage);
      const convertDeducted = sourceVersion === 5 || (!hasDeducted && sourceVersion >= 8)
        ? recipeToStockAmount
        : (id, value) => value;
      const deducted = normalizeQuantityMap(deductedSource, convertDeducted);
      const shortfall = sourceVersion === 5
        ? Object.fromEntries(Object.entries(usage)
          .map(([id, value]) => [id, roundAmount(Math.max(0, recipeToStockAmount(id, value) - Number(deducted[id] || 0)))])
          .filter(([, value]) => value > 0.001))
        : normalizeQuantityMap(entry.shortfall, (id, value) => value);
      const actualDeducted = sourceVersion === 8
        ? normalizeLegacyDeduction(deducted, shortfall, roundAmount)
        : deducted;
      out[key] = {
        ...entry,
        operationId: entry.operationId || `v${sourceVersion}-meal:${key}`,
        usage,
        deducted: actualDeducted,
        shortfall,
        ...(sourceVersion < 8 ? { legacySnapshot: true } : {}),
      };
    }
    return out;
  }

  function normalizeReversedDoneEntries(entries, sourceVersion) {
    const out = {};
    for (const [key, entry] of Object.entries(entries || {})) {
      if (!entry || typeof entry !== 'object') continue;
      const mealKey = typeof entry.mealKey === 'string' ? entry.mealKey : key;
      if (!/^\d{4}-\d{2}-\d{2}#[0-4]$/.test(mealKey)) continue;
      const normalized = normalizeDoneEntries({ [mealKey]: entry }, sourceVersion)[mealKey];
      if (!normalized) continue;
      const operationId = String(entry.operationId || key);
      out[operationId] = { ...normalized, mealKey, operationId };
    }
    return Object.fromEntries(Object.entries(out).slice(-3000));
  }

  function rebuildStock(target) {
    const totals = {};
    for (const movement of target.movements || []) {
      if (!getFood()[movement.foodId]) continue;
      totals[movement.foodId] = (totals[movement.foodId] || 0) + Number(movement.quantity || 0);
    }
    target.stock = {};
    for (const [id, value] of Object.entries(totals)) {
      const amount = roundAmount(Math.max(0, value));
      if (amount > 0.001) target.stock[id] = amount;
    }
  }

  function ensureLegacyStockFloor(target) {
    const totals = {};
    for (const movement of target.movements || []) {
      if (!getFood()[movement.foodId]) continue;
      totals[movement.foodId] = (totals[movement.foodId] || 0) + Number(movement.quantity || 0);
    }
    for (const [id, value] of Object.entries(totals)) {
      if (value >= -0.001) continue;
      const operationId = `v9-stock-floor:${id}`;
      if (target.movements.some((movement) => movement.operationId === operationId)) continue;
      target.movements.push({
        operationId,
        foodId: id,
        quantity: roundAmount(-value),
        kind: 'adjustment',
        createdAt: new Date().toISOString(),
        note: 'Regularización del saldo mínimo al actualizar a v9',
      });
    }
  }

  function emptyLocks() {
    return Array.from({ length: 3 }, () => Array.from({ length: 7 }, () => Array(5).fill(false)));
  }

  function cleanCyclePlan(raw) {
    if (!raw || typeof raw !== 'object' || !dateFromISO(raw.start)
      || !validMenuSnapshot(raw.menus) || typeof raw.catalogVersion !== 'string') return null;
    const locked = emptyLocks();
    if (Array.isArray(raw.locked) && raw.locked.length === 3) {
      for (let week = 0; week < 3; week++) {
        for (let day = 0; day < 7; day++) {
          for (let slot = 0; slot < 5; slot++) locked[week][day][slot] = !!raw.locked?.[week]?.[day]?.[slot];
        }
      }
    }
    return {
      start: raw.start,
      menus: cloneMenus(raw.menus),
      locked,
      catalogVersion: raw.catalogVersion,
      recoveryFocus: raw.recoveryFocus === true,
      generatedAt: typeof raw.generatedAt === 'string' ? raw.generatedAt : new Date().toISOString(),
      confirmedAt: typeof raw.confirmedAt === 'string' ? raw.confirmedAt : null,
    };
  }

  function cleanState(obj) {
    if (!obj || typeof obj !== 'object') return null;
    if (!SUPPORTED_STATE_VERSIONS.includes(obj.v) || !dateFromISO(obj.start)
      || !obj.done || typeof obj.done !== 'object' || !obj.stock || typeof obj.stock !== 'object'
      || Object.keys(obj.done).length > 3000) return null;
    const state = emptyState();
    state.profile = sanitizeProfile(obj.profile);
    state.profileConfirmed = obj.profileConfirmed === true;
    state.start = obj.start;
    state.noActiveCycle = obj.noActiveCycle === true;
    state.activeCycleId = isUuid(obj.activeCycleId) ? obj.activeCycleId : null;
    const fromV5 = obj.v === 5;
    state.done = normalizeDoneEntries(obj.done, obj.v);
    state.reversedDone = normalizeReversedDoneEntries(obj.reversedDone, obj.v);
    state.legacyStrengthDays = obj.legacyStrengthDays && typeof obj.legacyStrengthDays === 'object'
      ? obj.legacyStrengthDays
      : (obj.strength && typeof obj.strength === 'object' ? obj.strength : {});
    state.activitySessions = safeActivitySessions(obj.activitySessions);
    state.deletedActivitySessionIds = Array.isArray(obj.deletedActivitySessionIds)
      ? [...new Set(obj.deletedActivitySessionIds.filter((id) => typeof id === 'string'))].slice(-2000)
      : [];
    state.cart = obj.cart && typeof obj.cart === 'object' ? { ...obj.cart } : {};
    state.cartExtras = Array.isArray(obj.cartExtras)
      ? obj.cartExtras.filter((item) => item && getFood()[item.id] && Number.isFinite(+item.count) && Number.isFinite(+item.size))
        .slice(-100)
        .map((item) => ({ ...item, ...(fromV5 ? convertLegacyPack(item.id, item.count, item.size) : { count: +item.count, size: +item.size }) }))
      : [];
    if (fromV5) {
      for (const [key, choice] of Object.entries(state.cart)) {
        const id = key.split(':').at(-1);
        if (foodPieceWeight(id) > 0 && choice && Number.isFinite(+choice.count) && Number.isFinite(+choice.size)) {
          Object.assign(choice, convertLegacyPack(id, choice.count, choice.size));
        }
      }
      state.movements = Object.entries(getFood()).flatMap(([id]) => {
        const amount = Number(obj.stock[id] || 0);
        if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) return [];
        const quantity = roundAmount(legacyV5StockAmount(id, amount));
        return quantity > 0 ? [{
          operationId: `v5-opening:${id}`,
          foodId: id,
          quantity,
          kind: 'opening',
          createdAt: new Date().toISOString(),
          note: 'Saldo existente al actualizar desde v5',
        }] : [];
      });
    } else {
      const seen = new Set();
      state.movements = Array.isArray(obj.movements)
        ? obj.movements.filter((movement) => {
          if (!movement || !getFood()[movement.foodId] || typeof movement.operationId !== 'string'
            || !movement.operationId || seen.has(movement.operationId)
            || !Number.isFinite(Number(movement.quantity)) || Math.abs(Number(movement.quantity)) > 1000000) return false;
          seen.add(movement.operationId);
          return true;
        }).map((movement) => ({ ...movement, quantity: roundAmount(movement.quantity) }))
        : [];
    }
    if (obj.v < 9) ensureLegacyStockFloor(state);
    state.weights = safeWeightList(obj.weights);
    state.deletedWeightDates = Array.isArray(obj.deletedWeightDates)
      ? [...new Set(obj.deletedWeightDates.filter(dateFromISO))].slice(-1500)
      : [];
    state.resetCloudPending = obj.resetCloudPending === true;
    state.purchases = Array.isArray(obj.purchases)
      ? obj.purchases.slice(-2500)
        .filter((purchase) => purchase && getFood()[purchase.id] && Number.isFinite(Number(purchase.amount)) && Number(purchase.amount) > 0)
        .map((purchase) => ({ ...purchase, amount: fromV5 ? roundAmount(legacyV5StockAmount(purchase.id, +purchase.amount)) : +purchase.amount }))
      : [];
    state.prep = obj.prep && typeof obj.prep === 'object' ? obj.prep : {};
    state.archives = Array.isArray(obj.archives)
      ? obj.archives.slice(-6).map((archive) => archive && typeof archive === 'object'
        ? ({ ...archive, cycleId: isUuid(archive.cycleId) ? archive.cycleId : null,
          done: archive.done && typeof archive.done === 'object' ? normalizeDoneEntries(archive.done, obj.v) : {},
          reversedDone: normalizeReversedDoneEntries(archive.reversedDone, obj.v) })
        : archive)
      : [];
    state.activeMenus = validMenuSnapshot(obj.activeMenus, true) ? cloneMenus(obj.activeMenus) : null;
    state.activeMenuCatalogVersion = state.activeMenus && typeof obj.activeMenuCatalogVersion === 'string' ? obj.activeMenuCatalogVersion : null;
    state.activeMenuGeneratedAt = typeof obj.activeMenuGeneratedAt === 'string' ? obj.activeMenuGeneratedAt : null;
    state.activeMenuConfirmedAt = typeof obj.activeMenuConfirmedAt === 'string' ? obj.activeMenuConfirmedAt : null;
    state.activeMenuRecoveryFocus = obj.activeMenuRecoveryFocus === true;
    state.nextMenu = cleanCyclePlan(obj.nextMenu);
    state.plannerDraft = cleanCyclePlan(obj.plannerDraft);
    state.lastBackupAt = typeof obj.lastBackupAt === 'string' ? obj.lastBackupAt : null;
    rebuildStock(state);
    return state;
  }

  return { cleanState, normalizeDoneEntries, normalizeReversedDoneEntries, rebuildStock };
}

export { CURRENT_STATE_VERSION, SUPPORTED_STATE_VERSIONS };
