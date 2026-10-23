import { MENU_SLOT_TYPES } from './menu-generator.js?v=20261023-common-generator';
import { recipePlanningIssue } from './menu-planner.js?v=20261023-weekly-review';
import { createPlanningPreferences } from './planning-preferences.js?v=20261022-planner-foundations';
import { addDays, dateFromISO } from './dates.js?v=20261015-european-date';

function position({ week, day, slot }) {
  if (![week, day, slot].every(Number.isInteger) || week < 0 || week > 2
      || day < 0 || day > 6 || slot < 0 || slot > 4) throw new TypeError('La posición del menú no es válida.');
}

/** An explicit choice replaces its own lock; all other locked positions survive. */
export function changeProposalRecipe(plan, choice, recipes) {
  position(choice);
  const { week, day, slot, recipeId, scope = 'cycle' } = choice;
  if (!['cycle', 'meal'].includes(scope)) throw new TypeError('El alcance del cambio no es válido.');
  const recipe = recipes.find(item => item.id === recipeId);
  if (!recipe || recipe.type !== MENU_SLOT_TYPES[slot]) throw new TypeError('Elige una receta de este tipo de comida.');
  const next = structuredClone(plan), changed = [], preserved = [];
  for (const target of scope === 'cycle' ? [0, 1, 2] : [week]) {
    if (target !== week && next.locked[target][day][slot]) {
      preserved.push({ week: target, day, slot }); continue;
    }
    next.menus[target][day][slot] = recipeId;
    next.locked[target][day][slot] = true;
    changed.push({ week: target, day, slot });
  }
  next.confirmedAt = null;
  return { plan: next, changed, preserved };
}

/** A few compatible choices; the full catalog remains available as manual choices. */
export function proposalAlternatives({ plan, week, day, slot, recipes, preferences = createPlanningPreferences(), limit = 3 }) {
  position({ week, day, slot });
  const start = dateFromISO(plan.start);
  if (!start) throw new TypeError('La fecha de inicio no es válida.');
  const current = plan.menus[week][day][slot];
  const byId = new Map(recipes.map(recipe => [recipe.id, recipe]));
  const shared = new Set(plan.menus[week][day].flatMap(id => byId.get(id)?.ingredients.map(item => item.id) ?? []));
  const date = addDays(start, week * 7 + day);
  const score = recipe => (preferences.recipePreferences[recipe.id] === 'favorite' ? 3 : 0)
    + recipe.ingredients.filter(item => shared.has(item.id)).length / Math.max(1, recipe.ingredients.length);
  return recipes.filter(recipe => recipe.type === MENU_SLOT_TYPES[slot] && recipe.id !== current
      && !recipePlanningIssue(recipe, date, preferences))
    .sort((a, b) => score(b) - score(a) || (a.time ?? Infinity) - (b.time ?? Infinity) || a.id.localeCompare(b.id))
    .slice(0, limit);
}
