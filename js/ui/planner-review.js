import { addDays, dateFromISO } from '../domain/dates.js?v=20261015-european-date';
import { proposalAlternatives } from '../domain/menu-review.js?v=20261023-weekly-review';
import { escapeHTML as h, escapeAttribute as a } from './html.js?v=20261013-ux-repair';
import { PREFERENCE_LABELS } from './planning-preferences.js?v=20261024-planner-workspace';

const SLOTS = ['Desayuno', 'Media mañana', 'Comida', 'Merienda', 'Cena'];
const TYPES = ['desayuno', 'media', 'comida', 'tarde', 'cena'];
const SLOT_ICONS = ['sun', 'coffee', 'utensils', 'apple', 'moon'];
const GOALS = { maintain: 'Mantener peso', recomp: 'Recomposición', fat_loss: 'Reducir grasa', muscle_gain: 'Ganar músculo' };
const number = value => Math.round(value).toLocaleString('es-ES');
const time = recipe => Number.isFinite(recipe.time) ? `${recipe.time} min` : 'Tiempo sin indicar';
const at = (item, w, d, s) => item.week === w && item.day === d && item.slot === s;
const coordinates = (w, d, s) => `data-week="${w}" data-day="${d}" data-slot="${s}"`;
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-ES');
const lockIcon = '<span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg></span>';

function conditionText(issue) {
  if (issue.code === 'not_proposed') return 'Marcada como No proponer.';
  if (issue.code === 'time_limit') return 'Supera tu tiempo máximo entre semana.';
  if (issue.code === 'unknown_time') return 'No tiene un tiempo indicado para comprobar tu límite.';
  if (issue.code === 'no_automatic_candidate') return issue.timeLimit != null
    ? `No hay recetas compatibles con tus preferencias y el máximo de ${issue.timeLimit} min.`
    : 'No hay recetas automáticas compatibles con tus preferencias.';
  return 'Elige un plato para completar esta comida.';
}

export function createPlannerReviewView({ getRecipes, portionsForRecipes, getMacro, getTarget, formatDate, icon = () => '' }) {
  function markup(model) {
    const { proposal: plan, week, preferences, inspection, summary, profile } = model;
    const day = Math.max(0, Math.min(6, model.day ?? 0));
    const recipes = getRecipes(), byId = new Map(recipes.map(recipe => [recipe.id, recipe]));
    const start = dateFromISO(plan.start), date = addDays(start, week * 7 + day);
    const ids = plan.menus[week][day], dayRecipes = ids.map(id => byId.get(id));
    const portions = dayRecipes.every(Boolean) ? portionsForRecipes(dayRecipes, 0) : null;
    const total = portions?.reduce((sum, usage) => sum + getMacro(usage).k, 0), target = getTarget().calories;
    const conserved = plan.locked.flat(2).filter(Boolean).length;
    const exceptions = summary?.weeklyExceptions ?? 0;
    const tabs = [0, 1, 2].map(w => {
      const issues = inspection.issues.filter(issue => issue.week === w).length;
      const different = w > 0 && plan.menus[w].some((meals, d) => meals.some((id, s) => id !== plan.menus[0][d][s]));
      return `<button type="button" class="btn" data-action="planner-week" data-week="${w}" data-review-focus="week-${w}" aria-pressed="${week === w}" aria-controls="plannerWeekContent">Semana ${w + 1}${w === 0 ? ' · base' : ''}${issues ? `<span class="planner-attention" aria-label="${issues} comidas por revisar">${issues}</span>` : different ? '<span class="planner-exception-dot" role="img" aria-label="Con cambios respecto a la base"></span>' : ''}</button>`;
    }).join('');
    const days = plan.menus[week].map((meals, d) => {
      const currentDate = addDays(start, week * 7 + d), issues = inspection.issues.filter(issue => issue.week === week && issue.day === d).length;
      const label = formatDate(currentDate, { weekday: 'long', day: 'numeric', month: 'long' });
      return `<button type="button" class="planner-day-button" data-action="planner-day" data-day="${d}" data-review-focus="day-${d}" aria-label="${a(label)}${issues ? `, ${issues} comidas por revisar` : ''}" aria-pressed="${d === day}" aria-controls="plannerWeekContent"><span>${h(formatDate(currentDate, { weekday: 'short' }).replace('.', ''))}</span><strong>${currentDate.getDate()}</strong>${issues ? `<span class="planner-attention" aria-hidden="true">${issues}</span>` : ''}</button>`;
    }).join('');
    const meals = ids.map((id, slot) => {
      const recipe = byId.get(id), lock = plan.locked[week][day][slot], pos = `${week}-${day}-${slot}`, attrs = coordinates(week, day, slot);
      const issue = inspection.issues.find(item => at(item, week, day, slot));
      const warnings = inspection.warnings.filter(item => at(item, week, day, slot));
      const preference = preferences.recipePreferences[id] ?? 'normal';
      const different = week > 0 && id !== plan.menus[0][day][slot];
      const details = recipe ? `<button type="button" class="planner-recipe-title" data-action="planner-recipe" ${attrs} data-review-focus="recipe-${pos}" aria-haspopup="dialog" aria-controls="recipeDialog" aria-label="Ver receta: ${a(recipe.name)}">${h(recipe.name)}${icon('book')}</button><span class="planner-meal-meta">${h(time(recipe))}${portions ? ` · ${number(getMacro(portions[slot]).k)} kcal` : ''}${different ? ' · Distinta de la base' : ''}${preference !== 'normal' ? ` · ${PREFERENCE_LABELS[preference]}` : ''}</span>` : '<strong>Elige un plato</strong>';
      return `<div class="planner-meal${issue ? ' planner-meal--issue' : ''}" data-review-meal="${pos}"><span class="planner-slot">${icon(SLOT_ICONS[slot])}<span>${SLOTS[slot]}</span></span><div class="planner-meal-info">${details}${issue ? `<p class="planner-meal-issue">${h(conditionText(issue))}</p>` : ''}${warnings.map(item => `<p class="planner-meal-warning">Elección manual: ${h(conditionText(item))}</p>`).join('')}</div><div class="planner-meal-actions"><button type="button" class="btn" data-action="planner-choices-open" ${attrs} data-review-focus="change-${pos}" aria-haspopup="dialog" aria-controls="plannerChoiceDialog" aria-label="Cambiar ${a(SLOTS[slot].toLocaleLowerCase('es-ES'))}: ${a(recipe?.name || 'plato pendiente')}">Cambiar</button><button type="button" class="btn planner-lock" data-action="planner-lock" ${attrs} data-review-focus="lock-${pos}" aria-pressed="${lock}" aria-label="Conservar ${a(recipe?.name || 'plato pendiente')}" title="${lock ? 'Se mantendrá al generar otra propuesta. Pulsa para liberarlo.' : 'Mantener este plato al generar otra propuesta.'}" ${recipe ? '' : 'disabled'}>${lockIcon}<span>${lock ? 'Conservado' : 'Conservar'}</span></button></div></div>`;
    }).join('');
    const firstIssue = inspection.issues[0];
    const incomplete = inspection.complete ? '' : `<div class="planner-profile-warning" role="status"><span><strong>${inspection.issues.length} comidas por revisar.</strong> Completa o cambia los platos señalados para confirmar.${model.hasSavedDraft ? ' Tu borrador completo anterior sigue guardado.' : ''}</span><button type="button" class="btn" data-action="planner-issue" ${firstIssue ? coordinates(firstIssue.week, firstIssue.day, firstIssue.slot) : ''}>Ir a pendientes</button></div>`;
    const notice = model.preferencesChanged ? '<div class="planner-profile-warning" role="status"><span>Has cambiado tus ajustes. Usa <strong>Generar otra propuesta</strong> para aplicarlos; se mantienen los platos conservados.</span></div>' : '';
    const favoriteCount = Object.values(preferences.recipePreferences).filter(value => value === 'favorite').length;
    const excludedCount = Object.values(preferences.recipePreferences).filter(value => value === 'do_not_propose').length;
    const limits = preferences.weekdayTimeLimits;
    const energy = portions ? `<strong>${number(total)} <small>kcal</small></strong><span>Objetivo: ${number(target)} kcal</span>` : '<span>Se calculará al completar el día.</span>';
    const help = `<h3>Tu propuesta</h3><p>${summary?.preparations ?? "—"} preparaciones · ${conserved} comidas conservadas · ${exceptions} diferencias entre semanas.</p><p>Tiempo entre semana: comida ${limits.comida == null ? "sin límite" : `${limits.comida} min`}; cena ${limits.cena == null ? "sin límite" : `${limits.cena} min`}. Favoritas: ${favoriteCount}; No proponer: ${excludedCount}.</p><h3>Tu semana base</h3><p>Se repite durante tres semanas. Puedes revisar las tres y crear excepciones. Al cambiar un plato, elige si afecta a esta comida o también a las otras semanas. Sus platos conservados se respetan.</p><h3>Conservar y renovar</h3><p>Una elección manual queda conservada. «Generar otra propuesta» renueva solo los platos no conservados y aplica tus preferencias actuales. El menú activo y sus consumos no cambian.</p><h3>Cantidades orientativas</h3><p>Se usan raciones prácticas y el objetivo base, sin prever sesiones. La actividad se registra después de realizarla y ajusta solo esa fecha.</p>${portions ? `<p>Para el día seleccionado: ${number(total)} kcal estimadas frente a ${number(target)} kcal de objetivo; diferencia ${total - target >= 0 ? '+' : '−'}${number(Math.abs(total - target))} kcal. No es una medición clínica ni se fuerzan raciones para cerrar una cifra exacta.</p>` : ''}<h3>Despensa y recuperación</h3><p>La despensa orienta la selección, aunque esté incompleta. ${plan.recoveryFocus ? 'La recuperación ósea favorece ingredientes etiquetados como fuentes de calcio y vitaminas D y C; no mide micronutrientes ni constituye un tratamiento.' : 'La recuperación ósea está desactivada en esta propuesta.'}</p>${model.recoveryCoverage ? `<p>Presencia de ingredientes etiquetados: calcio ${model.recoveryCoverage.calcium}/21 días; vitamina D ${model.recoveryCoverage.vitamin_d}/21; vitamina C ${model.recoveryCoverage.vitamin_c}/21. No indica cantidades ni objetivos de ingesta.</p>` : ''}`;
    return `<div class="planner-content"><header class="planner-review-header"><div class="planner-intro"><div class="eyebrow">${model.firstPlan ? 'TU PRIMER CICLO' : 'PRÓXIMO CICLO'}</div><h2 id="plannerReviewTitle">${model.firstPlan ? 'Tu primer menú' : 'Tu próximo menú'}</h2><p>${h(formatDate(start, { day: 'numeric', month: 'short' }))} – ${h(formatDate(addDays(start, 20), { day: 'numeric', month: 'short', year: 'numeric' }))}<span> · 21 días</span></p></div><div class="planner-actions"><button type="button" class="btn btn-primary" data-action="planner-save" data-review-focus="save" ${inspection.complete ? '' : 'disabled'} ${inspection.complete ? '' : 'aria-describedby="plannerPendingReason"'}>${model.firstPlan ? 'Empezar mi plan' : 'Confirmar menú'}</button></div></header><div class="planner-review-body"><main class="planner-workspace" aria-label="Revisión del menú"><div class="planner-navigation"><div class="planner-week-toolbar"><div class="planner-week-tabs" role="group" aria-label="Semana de la propuesta">${tabs}</div><span class="planner-repeat-note">Tu semana base se repite tres veces</span></div><nav class="planner-day-tabs" aria-label="Día de la semana">${days}</nav></div><div class="planner-notices">${notice}${incomplete}<span id="plannerPendingReason" class="planner-pending-reason">${inspection.complete ? '' : 'Revisa las comidas pendientes antes de confirmar.'}</span><p class="planner-change-status" role="status" aria-live="polite">${h(model.changeMessage || '')}</p></div><section class="planner-day" id="plannerWeekContent" aria-labelledby="plannerDayHeading"><header class="planner-day-heading"><h3 id="plannerDayHeading">${h(formatDate(date, { weekday: 'long', day: 'numeric', month: 'short' }))}</h3><span>Cantidades estimadas</span></header><div class="planner-meals">${meals}</div></section></main><aside class="planner-plan-summary" aria-labelledby="plannerPlanHeading"><div class="planner-summary-heading"><h3 id="plannerPlanHeading">Tu plan</h3><button type="button" class="btn planner-help-button" data-action="planner-help-open" data-review-focus="help" aria-label="Cómo se prepara este menú" aria-haspopup="dialog" aria-controls="plannerHelpDialog">${icon('info')}</button></div><div class="planner-plan-tags"><span>${h(GOALS[profile.goal] || 'Tu objetivo')}</span>${plan.recoveryFocus ? `<span class="planner-recovery-tag">${icon('bone')}Recuperación activa</span>` : ''}</div><div class="planner-preferences-summary"><strong>Tiempo entre semana</strong><span>Comida <b>${limits.comida == null ? 'Sin límite' : `${limits.comida} min`}</b></span><span>Cena <b>${limits.cena == null ? 'Sin límite' : `${limits.cena} min`}</b></span><span>Favoritas <b>${favoriteCount}</b></span><span>No proponer <b>${excludedCount}</b></span><button type="button" class="btn" data-action="planning-preferences-open" data-review-focus="preferences">Editar preferencias</button></div><div class="planner-overview-counts"><span><strong>${summary?.preparations ?? '—'}</strong> preparaciones</span><span><strong>${conserved}</strong> comidas conservadas</span>${exceptions ? `<span><strong>${exceptions}</strong> diferencias entre semanas</span>` : ''}</div><div class="planner-energy"><span>Energía del día seleccionado</span>${energy}</div><div class="planner-renew"><button type="button" class="btn" data-action="planner-regenerate" data-review-focus="regenerate" title="Renueva únicamente los platos no conservados">${icon('reset')}Generar otra propuesta</button><small>Se mantienen tus platos conservados.</small></div></aside></div><template id="plannerHelpTemplate">${help}</template></div>`;
  }

  function render(root, model, { resetScroll = false } = {}) {
    const scrolls = [...root.querySelectorAll('.planner-review-body,.planner-day,.planner-plan-summary')].map(node => resetScroll ? 0 : node.scrollTop);
    const active = root.ownerDocument.activeElement, focus = root.contains(active) ? active?.dataset.reviewFocus : null;
    root.innerHTML = markup(model);
    [...root.querySelectorAll('.planner-review-body,.planner-day,.planner-plan-summary')].forEach((node, i) => { node.scrollTop = scrolls[i] || 0; });
    if (focus) root.querySelector(`[data-review-focus="${focus}"]`)?.focus({ preventScroll: true });
  }

  function filterChoices(root, query) {
    const search = normalize(query.trim()), results = [...root.querySelectorAll('[data-planner-search]')];
    let count = 0;
    for (const node of results) { node.hidden = !normalize(node.dataset.plannerSearch).includes(search); if (!node.hidden) count++; }
    root.querySelector('.planner-recommended').hidden = !!search;
    const catalog = root.querySelector('.planner-catalog');
    if (search) catalog.open = true;
    root.querySelector('.planner-catalog-empty').hidden = count > 0;
    root.querySelector('.planner-search-status').textContent = `${count} ${count === 1 ? 'receta disponible' : 'recetas disponibles'}`;
  }

  function renderChoices(root, model, choice, { reset = false } = {}) {
    const { week, day, slot } = choice, attrs = coordinates(week, day, slot), pos = `${week}-${day}-${slot}`;
    const recipes = getRecipes(), current = recipes.find(recipe => recipe.id === model.proposal.menus[week][day][slot]);
    const date = addDays(dateFromISO(model.proposal.start), week * 7 + day);
    const query = reset ? '' : root.querySelector('#plannerRecipeSearch')?.value || '';
    const active = root.ownerDocument.activeElement, focus = root.contains(active) ? active?.dataset.reviewFocus : null;
    const selection = active?.id === 'plannerRecipeSearch' ? [active.selectionStart, active.selectionEnd] : null;
    const scroll = reset ? 0 : root.querySelector('.planner-choice-body')?.scrollTop || 0;
    const catalogOpen = !reset && root.querySelector('.planner-catalog')?.open;
    const option = (recipe, suggested = false) => `<article class="planner-candidate" ${suggested ? '' : `data-planner-search="${a(recipe.name)}"`}><div><h3>${h(recipe.name)}</h3><span>${h(time(recipe))}${model.preferences.recipePreferences[recipe.id] === 'do_not_propose' ? ' · No proponer' : ''}${recipe.id === current?.id ? ' · Plato actual' : ''}</span></div><div class="planner-candidate-actions"><button type="button" class="btn" data-action="planner-recipe" data-recipe="${a(recipe.id)}" ${attrs} data-review-focus="preview-${pos}-${suggested ? 'suggest-' : ''}${a(recipe.id)}" aria-label="Ver receta: ${a(recipe.name)}" aria-haspopup="dialog" aria-controls="recipeDialog">Ver receta</button><button type="button" class="btn btn-subtle" data-action="planner-swap" data-recipe="${a(recipe.id)}" ${attrs} data-review-focus="choose-${pos}-${suggested ? 'suggest-' : ''}${a(recipe.id)}" aria-label="Elegir: ${a(recipe.name)}">Elegir</button></div></article>`;
    const suggestions = proposalAlternatives({ plan: model.proposal, week, day, slot, recipes, preferences: model.preferences });
    const catalog = recipes.filter(recipe => recipe.type === TYPES[slot]);
    root.innerHTML = `<header class="planner-choice-heading"><div><span>${h(SLOTS[slot])} · ${h(formatDate(date, { weekday: 'short', day: 'numeric', month: 'short' }))}</span><h2 id="plannerChoiceTitle">Elige otro plato</h2></div><button type="button" class="btn" data-action="planner-choices-close">Volver al menú</button></header><div class="planner-choice-body"><p class="planner-current-recipe">Ahora: <strong>${h(current?.name || 'Sin elegir')}</strong></p><fieldset class="planner-edit-scope"><legend>Aplicar el cambio a</legend><label><input type="radio" name="planner-scope" value="cycle" data-change="planner-scope" data-review-focus="scope-cycle" ${model.scope === 'cycle' ? 'checked' : ''}> También a las otras semanas</label><label><input type="radio" name="planner-scope" value="meal" data-change="planner-scope" data-review-focus="scope-meal" ${model.scope === 'meal' ? 'checked' : ''}> Solo esta comida</label><small>Se respetan los platos conservados de otras semanas.</small></fieldset><label class="planner-recipe-search" for="plannerRecipeSearch">Buscar en el recetario<input id="plannerRecipeSearch" type="search" placeholder="Nombre del plato…" value="${a(query)}" data-review-focus="catalog-search" autocomplete="off"></label><section class="planner-recommended" aria-label="Alternativas recomendadas"><h3>Recomendadas para ti</h3>${suggestions.length ? suggestions.map(recipe => option(recipe, true)).join('') : '<p>No hay sugerencias compatibles. Revisa tus preferencias o elige en el recetario.</p>'}</section><details class="planner-catalog" ${catalogOpen ? 'open' : ''}><summary>Ver todo el recetario de ${SLOTS[slot].toLocaleLowerCase('es-ES')}</summary><p class="planner-search-status" role="status" aria-live="polite"></p><div class="planner-catalog-results">${catalog.map(recipe => option(recipe)).join('')}</div><p class="planner-catalog-empty" hidden>No hay platos con ese nombre. Prueba otra búsqueda.</p></details><p class="planner-choice-note">El plato elegido queda conservado. Si no cumple tus preferencias, se señalará como excepción manual.</p></div>`;
    filterChoices(root, query);
    root.querySelector('.planner-choice-body').scrollTop = scroll;
    if (focus) {
      const target = root.querySelector(`[data-review-focus="${focus}"]`);
      target?.focus({ preventScroll: true });
      if (selection && target?.type === 'search') target.setSelectionRange(...selection);
    }
  }

  return { markup, render, renderChoices, filterChoices };
}
