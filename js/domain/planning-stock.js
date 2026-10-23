import { addDays, dateFromISO, isoDate } from './dates.js?v=20261015-european-date';
import { validMenuCycle } from './menu-generator.js?v=20261023-common-generator';

/** Project only uncompleted meals from the reference date up to cycle start.
 * evaluateDay receives fixed completed usages and actual reference-day activity.
 * Future days always have zero activity. No stock, snapshot or ledger is mutated.
 */
export function projectPlanningStock({ stock = {}, start, asOf, currentCycle = null, recipes, evaluateDay, toStockAmount, activityKcalToday = 0 }) {
  const startDate = dateFromISO(start), reference = dateFromISO(asOf);
  if (!startDate || !reference) throw new TypeError('Revisa las fechas para calcular la despensa prevista.');
  const projected = {};
  for (const [id, amount] of Object.entries(stock)) {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) throw new TypeError('Hay una cantidad de despensa no válida.');
    projected[id] = Math.max(0, amount);
  }
  const result = { stock: projected, pendingMeals: 0, dates: [] };
  if (!currentCycle || startDate <= reference) return result;
  const currentStart = dateFromISO(currentCycle.start);
  if (!currentStart || !validMenuCycle(currentCycle.menus, recipes, true)) {
    throw new TypeError('El ciclo actual no permite calcular una previsión de despensa válida.');
  }
  if (!Number.isFinite(activityKcalToday) || activityKcalToday < 0) throw new TypeError('La actividad registrada no es válida.');
  const byId = new Map(recipes.map(recipe => [recipe.id, recipe]));
  for (let offset = 0; offset < 21; offset++) {
    const date = addDays(currentStart, offset);
    if (date < reference || date >= startDate) continue;
    const day = currentCycle.menus[Math.floor(offset / 7)][offset % 7].map(id => byId.get(id));
    const dateISO = isoDate(date);
    const completed = day.map((_, slot) => currentCycle.done?.[`${dateISO}#${slot}`] || null);
    if (completed.every(Boolean)) continue;
    const fixedUsages = completed.map(record => record?.usage || null);
    const estimate = evaluateDay(day, dateISO === asOf ? activityKcalToday : 0, fixedUsages);
    result.dates.push(dateISO);
    day.forEach((_, slot) => {
      if (completed[slot]) return;
      result.pendingMeals++;
      for (const [id, amount] of Object.entries(estimate.portions[slot])) {
        const needed = toStockAmount(id, amount);
        if (!Number.isFinite(needed) || needed < 0) throw new TypeError('No se puede convertir un consumo previsto a despensa.');
        projected[id] = Math.max(0, (projected[id] || 0) - needed);
      }
    });
  }
  return result;
}
