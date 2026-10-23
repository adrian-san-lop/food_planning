// Selection only: no persistence, dates, inventory movements or portion formulas.
export const MENU_SLOT_TYPES = ['desayuno', 'media', 'comida', 'tarde', 'cena'];
export const REPERTOIRE_TARGETS = [3, 2, 4, 2, 4];

export function preparationFamily(recipe) {
  return JSON.stringify([...new Set(recipe.ingredients.map(item => item.id))].sort());
}

export function validMenuCycle(menus, recipes, allowSnackSwap = false) {
  const byId = new Map(recipes.map(recipe => [recipe.id, recipe]));
  return Array.isArray(menus) && menus.length === 3 && Array.from(menus).every(week =>
    Array.isArray(week) && week.length === 7 && Array.from(week).every(day =>
      Array.isArray(day) && day.length === 5 && Array.from(day).every((id, slot) => {
        const type = byId.get(id)?.type;
        return type === MENU_SLOT_TYPES[slot] || (allowSnackSwap &&
          [1, 3].includes(slot) && ['media', 'tarde'].includes(type));
      })));
}

export function summarizeMenu(menus, recipes, previousMenus = null) {
  const byId = new Map(recipes.map(recipe => [recipe.id, recipe]));
  const hasPrevious = validMenuCycle(previousMenus, recipes, true);
  const ids = new Set(menus.flat(2));
  const families = new Set([...ids].map(id => preparationFamily(byId.get(id))));
  const old = new Set(hasPrevious ? previousMenus.flat(2).map(id => preparationFamily(byId.get(id))) : []);
  return {
    preparations: families.size,
    recipeVariants: ids.size,
    portionVariants: ids.size - families.size,
    newPreparations: hasPrevious ? [...families].filter(key => !old.has(key)).length : null,
    weeklyExceptions: menus.slice(1).reduce((sum, week) => sum + week.reduce((n, day, d) =>
      n + day.filter((id, s) => id !== menus[0][d][s]).length, 0), 0),
  };
}

export function nutritionDeviation(total, target) {
  return Math.abs(total.k - target.calories) / Math.max(target.calories, 1)
    + .55 * Math.abs(total.p - target.protein) / Math.max(target.protein, 1)
    + .25 * Math.abs(total.c - target.carb) / Math.max(target.carb, 1)
    + .2 * Math.abs(total.f - target.fat) / Math.max(target.fat, 1);
}

/** Runtime recipes use {id, type, ingredients:[{id, rest}]}; evaluateDay must use
 * the existing portion service at zero forecast activity. RNG is injectable.
 * Numerical scores/tolerances below are soft tuning, not nutrition guarantees.
 */
export function generateMenuCycle({
  recipes, previousMenus = null, draft = null, stock = {}, evaluateDay, target,
  toStockAmount, recipePreference = () => 0, dayPreference = () => 0,
  isEligible = () => true,
  rng = Math.random,
}) {
  const byId = new Map(recipes.map(recipe => [recipe.id, recipe]));
  const family = new Map(recipes.map(recipe => [recipe.id, preparationFamily(recipe)]));
  const hasPrevious = validMenuCycle(previousMenus, recipes, true);
  const oldIds = hasPrevious ? previousMenus.flat(2) : [];
  const oldFamilies = new Set(oldIds.map(id => family.get(id)));
  const frequency = new Map();
  oldIds.forEach(id => frequency.set(family.get(id), (frequency.get(family.get(id)) || 0) + 1));
  const locked = Array.from({length: 3}, (_, w) => Array.from({length: 7}, (_, d) =>
    MENU_SLOT_TYPES.map((type, s) => {
      const lock = Boolean(draft?.locked?.[w]?.[d]?.[s]);
      if (lock && byId.get(draft?.menus?.[w]?.[d]?.[s])?.type !== type) {
        throw new Error('Hay una comida bloqueada que ya no es compatible con el catálogo.');
      }
      return lock;
    })));
  const lockedIds = locked.flatMap((week, w) => week.flatMap((day, d) =>
    day.flatMap((value, s) => value ? [draft.menus[w][d][s]] : [])));
  // An excluded manual choice in week 1 must not become an automatic choice
  // in weeks 2 and 3. All explicit locks still override the common base.
  const baseLocks = locked[0].map((day, d) => day.map((value, s) => value && (
    isEligible(byId.get(draft.menus[0][d][s]), d, s) || locked.every(week => week[d][s]))));
  const groups = MENU_SLOT_TYPES.map(type => {
    const map = new Map();
    recipes.filter(recipe => recipe.type === type).forEach(recipe => {
      const key = family.get(recipe.id);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(recipe);
    });
    if (!map.size) throw new Error('No hay suficientes recetas compatibles para completar el menú.');
    return map;
  });
  const ingredientSet = list => new Set(list.flatMap(recipe => recipe.ingredients.map(item => item.id)));
  const overlap = (recipe, ingredients) => recipe.ingredients.filter(item => ingredients.has(item.id)).length / Math.max(1, recipe.ingredients.length);
  const stockScore = (recipe, projected) => recipe.ingredients.reduce((sum, item) => sum +
    Math.min(1, Math.max(0, Number(projected[item.id]) || 0) /
      Math.max(.01, toStockAmount(item.id, item.rest))), 0) / Math.max(1, recipe.ingredients.length);
  const shared = new Set();
  const pools = groups.map((group, slot) => {
    const selected = new Set(lockedIds.filter(id => byId.get(id).type === MENU_SLOT_TYPES[slot]).map(id => family.get(id)));
    const usable = [...group.keys()].filter(key => group.get(key).some(recipe =>
      Array.from({length: 7}, (_, d) => d).some(d => isEligible(recipe, d, slot))));
    const eligible = usable.filter(key => !hasPrevious || oldFamilies.has(key));
    const available = eligible.length ? eligible : usable;
    while (selected.size < REPERTOIRE_TARGETS[slot] && available.some(key => !selected.has(key))) {
      const ranked = available.filter(key => !selected.has(key)).map(key => ({key, score:
        Math.log1p(frequency.get(key) || 0) * .6 + Math.max(...group.get(key).map(recipe =>
          stockScore(recipe, stock) + overlap(recipe, shared) * .7 + recipePreference(recipe) * .35)) + rng() * .4,
      })).sort((a, b) => b.score - a.score);
      selected.add(ranked[0].key);
      group.get(ranked[0].key)[0].ingredients.forEach(item => shared.add(item.id));
    }
    return [...selected].flatMap(key => group.get(key));
  });
  const cache = new Map();
  const evaluate = day => {
    const key = JSON.stringify(day.map(recipe => recipe.id));
    if (!cache.has(key)) {
      const estimate = evaluateDay(day);
      cache.set(key, {...estimate, deviation: nutritionDeviation(estimate.total, target)});
    }
    return cache.get(key);
  };
  const week = [], projected = {...stock}, seenIngredients = new Set();
  const counts = MENU_SLOT_TYPES.map(() => new Map());
  for (let d = 0; d < 7; d++) {
    const ranked = pools.map((pool, s) => {
      let candidates = baseLocks[d][s] ? [byId.get(draft.menus[0][d][s])]
        : pool.filter(recipe => isEligible(recipe, d, s));
      if (!candidates.length) candidates = [...groups[s].values()].flat().filter(recipe => isEligible(recipe, d, s));
      if (!candidates.length) throw new Error('No hay recetas automáticas compatibles para una posición del menú.');
      return candidates.map(recipe => {
        const key = family.get(recipe.id), count = counts[s].get(key) || 0;
        const recent = [2, 4].includes(s)
          ? (family.get(week[d - 1]?.[s]?.id) === key ? .9 : family.get(week[d - 2]?.[s]?.id) === key ? .3 : 0) : 0;
        return {recipe, score: (count ? -.15 * count : 1.2) - recent
          + stockScore(recipe, projected) * .6 + overlap(recipe, seenIngredients) * .35
          + recipePreference(recipe) * .35 + rng() * .2};
      }).sort((a, b) => b.score - a.score);
    });
    let best;
    for (let attempt = 0; attempt < 28; attempt++) {
      const day = ranked.map((options, s) => baseLocks[d][s] ? byId.get(draft.menus[0][d][s])
        : options[attempt === 0 ? 0 : Math.floor(rng() * options.length)].recipe);
      const score = day.reduce((sum, recipe, s) => sum + (ranked[s].find(item => item.recipe.id === recipe.id)?.score || 0), 0)
        + dayPreference(day) - evaluate(day).deviation * 8;
      if (!best || score > best.score) best = {day, score};
    }
    // Relax repertoire size only for a material improvement with existing portions.
    // Familiar alternatives remain eligible; no blanket bonus for unseen recipes.
    for (let s = 0; s < 5; s++) {
      if (baseLocks[d][s]) continue;
      let chosen = best.day, deviation = evaluate(chosen).deviation;
      const initialDeviation = deviation;
      const alternatives = [...groups[s].entries()].filter(([key]) => !hasPrevious || oldFamilies.has(key))
        .flatMap(([, items]) => items).filter(recipe => isEligible(recipe, d, s));
      for (const recipe of alternatives) {
        const candidate = best.day.map((current, slot) => slot === s ? recipe : current);
        const error = evaluate(candidate).deviation;
        if (error + .20 < initialDeviation && error < deviation) { chosen = candidate; deviation = error; }
      }
      best.day = chosen;
    }
    week.push(best.day);
    const portions = evaluate(best.day).portions;
    best.day.forEach((recipe, s) => {
      const key = family.get(recipe.id);
      counts[s].set(key, (counts[s].get(key) || 0) + 1);
      recipe.ingredients.forEach(item => seenIngredients.add(item.id));
      for (const [id, amount] of Object.entries(portions[s])) {
        projected[id] = Math.max(0, (Number(projected[id]) || 0) - toStockAmount(id, amount));
      }
    });
  }

  if (hasPrevious) {
    const novel = new Set([...week.flat().map(recipe => family.get(recipe.id)), ...lockedIds.map(id => family.get(id))].filter(key => !oldFamilies.has(key)));
    const noveltyTarget = 2 + Math.floor(rng() * 2);
    // A replacement is considered once per family across the WHOLE cycle.
    // Locks already introducing families use this budget; manual choices always win.
    while (novel.size < noveltyTarget) {
      let best;
      const ingredients = ingredientSet(week.flat());
      for (let s = 0; s < 5; s++) {
        const replaceable = new Set(week.filter((_, d) => !baseLocks[d][s]).map(day => family.get(day[s].id)).filter(key => oldFamilies.has(key)));
        for (const [newKey, variants] of groups[s]) {
          if (oldFamilies.has(newKey) || novel.has(newKey)) continue;
          for (const oldKey of replaceable) {
            const changes = [];
            let difference = 0, worst = 0, preference = 0;
            week.forEach((day, d) => {
              if (baseLocks[d][s] || family.get(day[s].id) !== oldKey) return;
              const candidates = variants.filter(recipe => isEligible(recipe, d, s)).map(recipe => {
                const next = day.map((current, slot) => slot === s ? recipe : current);
                return {day: next, deviation: evaluate(next).deviation};
              }).sort((a, b) => a.deviation - b.deviation);
              if (!candidates.length) return;
              const chosen = candidates[0], delta = chosen.deviation - evaluate(day).deviation;
              difference += delta; worst = Math.max(worst, delta);
              preference += overlap(chosen.day[s], ingredients) * .35 + stockScore(chosen.day[s], stock) * .6
                + recipePreference(chosen.day[s]) * .35 + dayPreference(chosen.day) - dayPreference(day);
              changes.push({d, day: chosen.day});
            });
            if (!changes.length || difference / changes.length > .08 || worst > .18) continue;
            const score = (preference - difference * 8) / changes.length + rng() * .15;
            if (!best || score > best.score) best = {changes, score, newKey};
          }
        }
      }
      if (!best) break;
      best.changes.forEach(change => { week[change.d] = change.day; });
      novel.add(best.newKey);
    }
  }
  const menus = Array.from({length: 3}, (_, w) => week.map((day, d) => day.map((recipe, s) =>
    locked[w][d][s] ? draft.menus[w][d][s] : recipe.id)));
  return {menus, locked};
}
