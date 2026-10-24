import { escapeHTML as h, escapeAttribute as a } from './html.js?v=20261013-ux-repair';
import { createPlanningPreferences } from '../domain/planning-preferences.js?v=20261022-planner-foundations';

export const PREFERENCE_LABELS = { normal: 'Normal', favorite: 'Favorita', do_not_propose: 'No proponer' };

export function recipePreferenceControls(recipeId, preferences = createPlanningPreferences(), available = true) {
  const current = preferences.recipePreferences[recipeId] ?? 'normal';
  return '<div class="recipe-preference"><span>En próximos menús</span><div class="recipe-preference-options" role="group" aria-label="Preferencia de esta receta">'
    + Object.entries(PREFERENCE_LABELS).map(([value, label]) => `<button type="button" class="btn recipe-preference-button" data-action="recipe-preference" data-recipe="${a(recipeId)}" data-preference="${value}" aria-pressed="${current === value}" ${available ? '' : 'disabled'}>${value === 'favorite' ? '<span aria-hidden="true">☆</span> ' : ''}${label}</button>`).join('')
    + '</div><small>Favorita le da prioridad; No proponer la retira de la selección automática. Tus menús guardados se conservan.</small></div>';
}

export function markedRecipesMarkup(preferences, recipes, available = true) {
  const marked = recipes.filter(recipe => ['favorite','do_not_propose'].includes(preferences.recipePreferences[recipe.id]));
  return marked.length ? '<ul class="marked-recipes">' + marked.map(recipe => `<li><span><strong>${h(recipe.name)}</strong><small>${PREFERENCE_LABELS[preferences.recipePreferences[recipe.id]]}</small></span><button type="button" class="btn" data-action="recipe-preference" data-recipe="${a(recipe.id)}" data-preference="normal" ${available ? '' : 'disabled'} aria-label="Volver a Normal: ${a(recipe.name)}">Volver a Normal</button></li>`).join('') + '</ul>'
    : '<p class="muted">Todavía no has marcado recetas. Puedes hacerlo desde cualquier ficha del recetario o del menú.</p>';
}

export function planningPreferencesMarkup(preferences, recipes, available) {
  const input = (slot, label) => `<label>${label}<span class="planning-time-input"><input type="number" name="${slot}" min="1" max="1440" step="1" inputmode="numeric" value="${preferences.weekdayTimeLimits[slot] ?? ''}" placeholder="Sin límite" ${available ? '' : 'disabled'}><span>minutos</span></span><small>Déjalo vacío para cocinar sin un tiempo máximo.</small></label>`;
  return `<header class="preferences-dialog-heading"><h2 id="planningPreferencesTitle" tabindex="-1">Preferencias del menú</h2><button type="button" class="btn" data-action="planning-preferences-close">Cerrar</button></header><div class="preferences-dialog-body"><p>Elige lo que te resulte práctico. No es necesario completar la despensa ni marcar recetas para generar un menú.</p>${available ? '' : '<p class="planner-profile-warning" role="status">Ahora no podemos guardar preferencias en tu cuenta. Puedes seguir usando Menuki y volver a abrir la cuenta para reintentarlo.</p>'}<form id="planningPreferencesForm"><fieldset ${available ? '' : 'disabled'}><legend>Tiempo para cocinar de lunes a viernes</legend><p>Se utiliza el tiempo indicado en cada receta. Los fines de semana no tienen este límite.</p><div class="planning-time-fields">${input('comida','Comida')}${input('cena','Cena')}</div></fieldset><p class="planning-preferences-note">Los cambios se aplican al generar o pulsar «Generar otra propuesta». El menú actual y los borradores no se sustituyen automáticamente.</p><div class="dialog-actions"><button type="button" class="btn" data-action="planning-preferences-close">Cancelar</button><button type="submit" class="btn btn-primary" ${available ? '' : 'disabled'}>Guardar preferencias</button></div></form><section aria-labelledby="markedRecipesTitle"><h3 id="markedRecipesTitle">Tus recetas marcadas</h3><div id="planningMarkedRecipes">${markedRecipesMarkup(preferences, recipes, available)}</div></section></div>`;
}

/** Only changed limits are patched, so an open form cannot clear independent changes. */
export function timeLimitsPatch(values, original) {
  const weekdayTimeLimits = {};
  for (const slot of ['comida', 'cena']) {
    const raw = String(values[slot] ?? '').trim(), minutes = raw === '' ? null : Number(raw);
    if (minutes !== null && (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440)) throw new TypeError('Indica minutos enteros entre 1 y 1440, o deja el campo vacío.');
    if (minutes !== original[slot]) weekdayTimeLimits[slot] = minutes;
  }
  return { weekdayTimeLimits };
}
