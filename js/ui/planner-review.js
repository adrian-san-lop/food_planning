import { addDays, dateFromISO } from '../domain/dates.js?v=20261015-european-date';
import { proposalAlternatives } from '../domain/menu-review.js?v=20261023-weekly-review';
import { escapeHTML as h, escapeAttribute as a } from './html.js?v=20261013-ux-repair';
import { PREFERENCE_LABELS } from './planning-preferences.js?v=20261023-weekly-review';

const SLOTS = ['Desayuno', 'Media mañana', 'Comida', 'Merienda', 'Cena'];
const number = value => Math.round(value).toLocaleString('es-ES');
const time = recipe => Number.isFinite(recipe.time) ? `${recipe.time} min` : 'Tiempo sin indicar';
const at = (item, w, d, s) => item.week === w && item.day === d && item.slot === s;
const coordinates = (w,d,s) => `data-week="${w}" data-day="${d}" data-slot="${s}"`;

function conditionText(issue) {
  if (issue.code === 'not_proposed') return 'Marcada como No proponer.';
  if (issue.code === 'time_limit') return 'Supera tu tiempo máximo entre semana.';
  if (issue.code === 'unknown_time') return 'No tiene un tiempo indicado para comprobar tu límite.';
  if (issue.code === 'no_automatic_candidate') return issue.timeLimit != null
    ? `No hay recetas automáticas compatibles con tus preferencias y el máximo de ${issue.timeLimit} minutos.`
    : 'No hay recetas automáticas compatibles con tus preferencias.';
  return 'Elige una receta disponible para completar esta comida.';
}

export function createPlannerReviewView({ getRecipes, portionsForRecipes, getMacro, getTarget, formatDate }) {
  function markup(model) {
    const { proposal: plan, week, scope, preferences, inspection, summary, profile } = model;
    const recipes = getRecipes(), byId = new Map(recipes.map(recipe => [recipe.id, recipe]));
    const start = dateFromISO(plan.start), filled = plan.menus.flat(2).filter(id => byId.has(id)).length;
    const badges = summary ? `<span>${summary.preparations} preparaciones</span>${summary.weeklyExceptions ? `<span>${summary.weeklyExceptions} excepciones entre semanas</span>` : ''}` : `<span>${filled} de 105 comidas elegidas</span>`;
    const notice = model.preferencesChanged ? '<p class="planner-profile-warning" role="status">Esta propuesta se conserva como estaba. Para aplicar tus preferencias o ajustes actuales, pulsa «Cambiar platos». Se mantienen los bloqueos.</p>' : '';
    const incomplete = inspection.complete ? '' : `<div class="planner-profile-warning" role="status"><span><strong>Revisa ${inspection.issues.length} comidas antes de confirmar.</strong> Puedes cambiar tus preferencias o elegir una receta manualmente. ${filled < 105 ? (model.hasSavedDraft ? 'Completa los huecos para conservar este nuevo borrador; el último borrador completo sigue guardado.' : 'Completa los huecos para conservar este nuevo borrador.') : ''}</span><button type="button" class="btn" data-action="planning-preferences-open">Revisar preferencias</button></div>`;
    const current = plan.menus[week].map((ids, day) => {
      const date = addDays(start,week*7+day), dayRecipes = ids.map(id => byId.get(id));
      const portions = dayRecipes.every(Boolean) ? portionsForRecipes(dayRecipes,0) : null;
      const total = portions?.reduce((sum,usage) => sum+getMacro(usage).k,0), target = getTarget().calories;
      const energy = portions ? `<span>${number(total)} kcal estimadas · objetivo ${number(target)} · diferencia ${total-target >= 0 ? '+' : '−'}${number(Math.abs(total-target))} kcal</span>` : '<span>Las raciones se calcularán al completar el día.</span>';
      const meals = ids.map((id,slot) => {
        const recipe = byId.get(id), lock = plan.locked[week][day][slot], pos = `${week}-${day}-${slot}`, attrs = coordinates(week,day,slot);
        const issue = inspection.issues.find(item => at(item,week,day,slot));
        const warnings = inspection.warnings.filter(item => at(item,week,day,slot));
        const preference = preferences.recipePreferences[id] ?? 'normal';
        const marker = preference === 'normal' ? '' : `<span class="recipe-preference-badge">${PREFERENCE_LABELS[preference]}</span>`;
        const details = recipe ? `<button type="button" class="planner-recipe-title" data-action="planner-recipe" ${attrs} data-review-focus="recipe-${pos}" aria-haspopup="dialog" aria-controls="recipeDialog">${h(recipe.name)}</button><span class="planner-meal-meta">${h(time(recipe))}${portions ? ` · ${number(getMacro(portions[slot]).k)} kcal aprox.` : ''}</span>${marker}` : '<strong>Elige un plato</strong>';
        const suggested = proposalAlternatives({plan,week,day,slot,recipes,preferences});
        const candidates = suggested.length ? '<p>Sugeridas para esta comida</p><div class="planner-suggestions">'+suggested.map(item=>`<div class="planner-suggestion"><button type="button" class="btn" data-action="planner-swap" data-recipe="${a(item.id)}" ${attrs} data-review-focus="suggest-${pos}-${a(item.id)}">${h(item.name)} <small>${h(time(item))}</small></button><button type="button" class="btn btn-quiet" data-action="planner-recipe" data-recipe="${a(item.id)}" ${attrs} data-review-focus="preview-${pos}-${a(item.id)}" aria-label="Ver receta: ${a(item.name)}">Ver receta</button></div>`).join('')+'</div>' : '<p>No hay alternativas automáticas con tus preferencias actuales. Puedes hacer una elección manual.</p>';
        const options = recipes.filter(item=>item.type===['desayuno','media','comida','tarde','cena'][slot]).map(item=>`<option value="${a(item.id)}">${h(item.name)} · ${h(time(item))}${preferences.recipePreferences[item.id] === 'do_not_propose' ? ' · No proponer' : ''}</option>`).join('');
        const change = `<details class="planner-choices" data-review-choice="${pos}"><summary data-review-focus="change-${pos}">Cambiar plato</summary><div>${candidates}<label>Elegir manualmente del catálogo completo<select data-change="proposal-recipe" ${attrs} data-review-focus="catalog-${pos}"><option value="">Seleccionar receta…</option>${options}</select></label><small>Las elecciones manuales quedan bloqueadas. Si no cumplen tus preferencias, verás la excepción.</small></div></details>`;
        const reason = issue ? `<p class="planner-meal-issue">${h(conditionText(issue))}</p>` : '';
        const manual = warnings.map(item=>`<p class="planner-meal-warning">Elección manual: ${h(conditionText(item))}</p>`).join('');
        return `<div class="planner-meal${issue ? ' planner-meal--issue' : ''}" data-review-meal="${pos}"><span class="planner-slot">${SLOTS[slot]}</span><div class="planner-meal-info">${details}${reason}${manual}</div><button type="button" class="btn planner-lock" data-action="planner-lock" ${attrs} data-review-focus="lock-${pos}" aria-pressed="${lock}" ${recipe ? '' : 'disabled'}>${lock ? 'Bloqueada' : 'Bloquear'}</button>${change}</div>`;
      }).join('');
      return `<section class="planner-day"><header class="planner-day-heading"><h3>${h(formatDate(date,{weekday:'long',day:'numeric',month:'short'}))}</h3>${energy}</header>${meals}</section>`;
    }).join('');
    const tabs = [0,1,2].map(w=>`<button type="button" class="btn" data-action="planner-week" data-week="${w}" data-review-focus="week-${w}" aria-pressed="${week===w}" aria-controls="plannerWeekContent">Semana ${w+1}${w===0 ? ' · base' : ''}</button>`).join('');
    const labels = {maintain:'Mantener peso',recomp:'Perder grasa y mantener músculo',fat_loss:'Reducir grasa',muscle_gain:'Ganar masa muscular'};
    return `<div class="planner-content"><header class="planner-review-header"><div class="planner-intro"><div class="eyebrow">TU SEMANA BASE · REPETIDA TRES VECES</div><h2 id="plannerReviewTitle">Revisa tu próximo menú</h2></div><div class="planner-actions"><button type="button" class="btn" data-action="planner-regenerate" data-review-focus="regenerate" title="Renueva únicamente las comidas desbloqueadas">Cambiar platos</button><button type="button" class="btn btn-primary" data-action="planner-save" data-review-focus="save" ${inspection.complete ? '' : 'disabled'}>Confirmar menú</button></div></header><div class="planner-review-body"><div class="planner-cycle-meta"><span>Empieza ${h(formatDate(start,{day:'numeric',month:'long',year:'numeric'}))}</span><span>21 días · 105 comidas</span><span>${h(labels[profile.goal] || '')}</span></div><p class="planner-quick-tip">Una semana familiar, repetida tres veces. Ajusta los platos que necesites.</p><div class="planner-tools"><button type="button" class="btn" data-action="planning-preferences-open" data-review-focus="preferences">Preferencias del menú</button><details class="planner-help"><summary>Cómo se prepara</summary><div class="planner-help-content"><p>Una semana familiar se repite tres veces, con pocas preparaciones nuevas entre ciclos si encajan. Se comparan propuestas con raciones prácticas, sin forzar calorías exactas. La despensa orienta la selección, aunque no hayas anotado todo lo que tienes. La recuperación ósea ${plan.recoveryFocus ? 'favorece ingredientes etiquetados como fuentes de calcio y vitaminas D y C; no mide micronutrientes' : 'está desactivada'}. Las sesiones de actividad se añaden después de realizarlas, solo a su fecha.</p>${model.recoveryCoverage ? `<p>Presencia de ingredientes etiquetados en las recetas: calcio ${model.recoveryCoverage.calcium}/21 días · vitamina D ${model.recoveryCoverage.vitamin_d}/21 · vitamina C ${model.recoveryCoverage.vitamin_c}/21. No indica cantidades ni objetivos de micronutrientes.</p>` : ''}<p>Si cambias tus preferencias, los menús guardados se conservan: pulsa «Cambiar platos» para aplicarlas. Esta acción mantiene todas las comidas bloqueadas. Tus favoritas tienen prioridad; No proponer excluye la elección automática. Los tiempos de comida y cena entre semana usan el catálogo. Una elección manual puede ser una excepción y queda señalada.</p></div></details></div><div class="planner-summary">${badges}</div>${notice}${incomplete}<div class="planner-week-toolbar"><div class="planner-week-tabs" role="group" aria-label="Semana de la propuesta">${tabs}</div><fieldset class="planner-edit-scope"><legend>Al cambiar un plato</legend><label><input type="radio" name="planner-scope" value="cycle" data-change="planner-scope" ${scope==='cycle' ? 'checked' : ''}> Las tres semanas</label><label><input type="radio" name="planner-scope" value="meal" data-change="planner-scope" ${scope==='meal' ? 'checked' : ''}> Solo esta comida</label><small>Los bloqueos de otras semanas se conservan.</small></fieldset></div><p class="planner-change-status" role="status" aria-live="polite">${h(model.changeMessage || '')}</p><div id="plannerWeekContent" aria-label="Semana ${week+1}">${current}</div></div></div>`;
  }

  function render(root, model, { resetScroll = false, closeChoices = false } = {}) {
    const body = root.querySelector('.planner-review-body'), scroll = resetScroll ? 0 : body?.scrollTop || 0;
    const active = root.ownerDocument.activeElement;
    const focus = root.contains(active) ? active?.dataset.reviewFocus : null;
    const choices = closeChoices ? [] : [...root.querySelectorAll('.planner-choices[open]')].map(node=>node.dataset.reviewChoice);
    const helpOpen = root.querySelector('.planner-help')?.open;
    root.innerHTML = markup(model);
    root.querySelector('.planner-review-body').scrollTop = scroll;
    root.querySelector('.planner-help').open = !!helpOpen;
    for (const choice of choices) root.querySelector(`[data-review-choice="${choice}"]`).open = true;
    if (focus) {
      const target = (!closeChoices || !active.dataset.day ? root.querySelector(`[data-review-focus="${focus}"]`) : null)
        || root.querySelector(`[data-review-focus="change-${active.dataset.week}-${active.dataset.day}-${active.dataset.slot}"]`);
      target?.focus({preventScroll:true});
    }
  }
  return { markup, render };
}
