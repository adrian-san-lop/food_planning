import { addDays, dateDiff, dateFromISO, today } from './dates.js?v=20261015-european-date';

export function cycleHasEnded(start, now = today()) {
  const first = dateFromISO(start);
  return !!first && addDays(first, 20) < now;
}

export function confirmedCycleIsAvailable(plan, now = today()) {
  return !!plan?.confirmedAt && Number.isFinite(Date.parse(plan.confirmedAt)) && !!dateFromISO(plan.start) && !cycleHasEnded(plan.start, now);
}

export function canBuyNextCycle(plan, now = today()) {
  if (!confirmedCycleIsAvailable(plan, now)) return false;
  const days = dateDiff(now, dateFromISO(plan.start));
  return days >= 1 && days <= 3;
}

export function shoppingDates(start, horizon = '7', now = today()) {
  const first = dateFromISO(start);
  if (!first) return [];
  const last = addDays(first, 20), begin = first > now ? first : now;
  const count = { '3': 3, '7': 7, '14': 14, all: 21 }[horizon] || 7;
  const dates = [];
  for (let offset = 0; offset < count; offset++) {
    const date = addDays(begin, offset);
    if (date > last) break;
    dates.push(date);
  }
  return dates;
}

export function nextCycleCartScope(plan) {
  return 'next-' + plan.start + '-' + Date.parse(plan.confirmedAt);
}
