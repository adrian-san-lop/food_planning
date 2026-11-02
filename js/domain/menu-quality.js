// Culinary comparison for selection, not a nutrition standard or an exclusion.
const seasonings = new Set(['oliveoil', 'soySauce', 'garlic', 'cayenne', 'vinegar']);

export function mainMealSimilarity(day) {
  const mains = day.filter(recipe => ['comida', 'cena'].includes(recipe?.type));
  if (mains.length !== 2) return 0;
  const sets = mains.map(recipe => new Set(recipe.ingredients.map(item => item.id).filter(id => !seasonings.has(id))));
  const union = new Set([...sets[0], ...sets[1]]);
  return union.size ? [...sets[0]].filter(id => sets[1].has(id)).length / union.size : 0;
}

export function adjacentMainRepeats(week) {
  let repeats = 0;
  for (let day = 1; day < week.length; day++) for (const slot of [2, 4]) {
    if (samePreparation(week[day]?.[slot], week[day - 1]?.[slot])) repeats++;
  }
  return repeats;
}

function samePreparation(a, b) {
  const signature = recipe => JSON.stringify([...new Set(recipe.ingredients.map(item => item.id))].sort());
  return Boolean(a && b && signature(a) === signature(b));
}

/** Reorder compatible complete days only: keep repertoire, ingredients and locks. */
export function spaceWeekMains(week, {canMove = () => true, isEligible = () => true} = {}) {
  const result = week.map(day => day.slice());
  const cost = candidate => adjacentMainRepeats(candidate) * 3 + [2, 4].reduce((sum, slot) =>
    sum + (samePreparation(candidate[0]?.[slot], candidate.at(-1)?.[slot]) ? 2 : 0), 0);
  for (let pass = 0; pass < 7; pass++) {
    let best, bestCost = cost(result);
    for (let a = 0; a < result.length; a++) for (let b = a + 1; b < result.length; b++) {
      if (!canMove(a) || !canMove(b)
        || !result[a].every((recipe, slot) => isEligible(recipe, b, slot))
        || !result[b].every((recipe, slot) => isEligible(recipe, a, slot))) continue;
      const candidate = result.slice(); [candidate[a], candidate[b]] = [candidate[b], candidate[a]];
      const score = cost(candidate);
      if (score < bestCost) { best = [a, b]; bestCost = score; }
    }
    if (!best) break;
    const [a, b] = best; [result[a], result[b]] = [result[b], result[a]];
  }
  return result;
}
