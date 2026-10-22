// Keep this export for previous nutrition modules still cached by a browser.
export function scaleBreadSlices(amount, factor, maxSlices = 2) {
  const scaled = Math.max(1, Math.round((Number(amount) || 0) * (Number(factor) || 0)));
  return Math.min(maxSlices, scaled);
}

const GROUPS = ['fixed', 'protein', 'carb', 'fat'];
const onGrid = (value, step) => Math.abs(value / step - Math.round(value / step)) < 1e-8;

/** Catalog policy in recipe units, per food and per meal; not a nutrient target. */
export function validPortionRule(rule) {
  return rule !== null && typeof rule === 'object' && !Array.isArray(rule)
    && Object.keys(rule).length === 4
    && GROUPS.includes(rule.group)
    && ['min', 'max', 'step'].every(key => typeof rule[key] === 'number' && Number.isFinite(rule[key]) && rule[key] > 0)
    && rule.min <= rule.max
    && onGrid(rule.min, rule.step) && onGrid(rule.max, rule.step);
}

export function portionOnGrid(amount, rule) {
  return onGrid(amount, rule.step);
}

export function scalePortion(amount, factor, rule) {
  if (!validPortionRule(rule)) throw new TypeError('La regla de ración no es válida.');
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(factor) || factor < 0) {
    throw new TypeError('La cantidad y el factor de ración no son válidos.');
  }
  if (rule.group === 'fixed') return amount;
  const bounded = Math.max(rule.min, Math.min(rule.max, amount * factor));
  const snapped = Math.round(bounded / rule.step) * rule.step;
  return Math.max(rule.min, Math.min(rule.max, Number(snapped.toPrecision(12))));
}
