const MADRID_TIME_ZONE = 'Europe/Madrid';
const DAY_MS = 24 * 60 * 60 * 1000;

const madridDateFormatter = new Intl.DateTimeFormat('en-CA', {
  calendar: 'gregory',
  numberingSystem: 'latn',
  timeZone: MADRID_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function makeCivilDate(year, month, day) {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date;
}

/**
 * Returns the Europe/Madrid calendar date for an instant as YYYY-MM-DD.
 *
 * Menuki stores calendar dates as strings. Date objects returned by
 * dateFromISO/today are UTC-midnight carriers for those dates, not instants.
 */
export function madridISODate(instant = new Date()) {
  const date = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(date.getTime())) throw new RangeError('La fecha no es válida.');
  const parts = Object.fromEntries(
    madridDateFormatter.formatToParts(date).map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function dateFromISO(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = makeCivilDate(year, month, day);
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) return null;
  return date;
}

export function isoDate(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export function today(instant = new Date()) {
  return dateFromISO(madridISODate(instant));
}

export function monday(date) {
  const dayOffset = (date.getUTCDay() + 6) % 7;
  const result = makeCivilDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  result.setUTCDate(result.getUTCDate() - dayOffset);
  return result;
}

export function addDays(date, amount) {
  const result = makeCivilDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  result.setUTCDate(result.getUTCDate() + amount);
  return result;
}

export function dateDiff(start, end) {
  const startDate = makeCivilDate(start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate());
  const endDate = makeCivilDate(end.getUTCFullYear(), end.getUTCMonth() + 1, end.getUTCDate());
  return Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS);
}

export function civilDayOfMonth(date) {
  return date.getUTCDate();
}

export function formatDate(date, options = {}) {
  const civilDate = makeCivilDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  return civilDate.toLocaleDateString('es-ES', { ...options, timeZone: MADRID_TIME_ZONE });
}

export function formatMadridDateTime(value, options = { dateStyle: 'medium', timeStyle: 'short' }) {
  const instant = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(instant.getTime())) return null;
  return instant.toLocaleString('es-ES', { ...options, timeZone: MADRID_TIME_ZONE });
}
