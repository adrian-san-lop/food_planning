import { addDays, dateDiff, dateFromISO, isoDate, monday } from './dates.js?v=20261013-ux-repair';

/** Calendar-week counts; future dates and invalid completion keys never count. */
export function weeklyMealSummary(completions, currentDate) {
  const current = isoDate(currentDate);
  const start = monday(currentDate);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = isoDate(addDays(start, index));
    return { date, count: 0, isToday: date === current, isFuture: date > current };
  });
  const byDate = new Map(days.map(day => [day.date, day]));
  for (const [key, completion] of Object.entries(completions || {})) {
    if (!completion || !/^\d{4}-\d{2}-\d{2}#[0-4]$/.test(key)) continue;
    const day = byDate.get(key.slice(0, 10));
    if (day && !day.isFuture) day.count++;
  }
  return {
    days,
    total: days.reduce((sum, day) => sum + day.count, 0),
    activeDays: days.filter(day => day.count > 0).length,
  };
}

/** Position in the active 21-day cycle, using civil dates rather than instants. */
export function dashboardCycleSummary(startsOn, currentDate, hasActiveCycle = true) {
  const start = dateFromISO(startsOn);
  if (!hasActiveCycle || !start) return { status: 'missing' };
  const end = addDays(start, 20);
  const offset = dateDiff(start, currentDate);
  return {
    status: offset < 0 ? 'upcoming' : offset > 20 ? 'finished' : 'active',
    start,
    end,
    day: offset >= 0 && offset <= 20 ? offset + 1 : null,
  };
}
