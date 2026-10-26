import { applyPlanningPreferencesPatch } from '../domain/planning-preferences.js?v=20261022-planner-foundations';
import { planningPreferencesMarkup, markedRecipesMarkup, timeLimitsPatch } from './planning-preferences.js?v=20261026-favorites';
import { escapeHTML as h, escapeAttribute as a } from './html.js?v=20261013-ux-repair';

/** View/editor boundary only. The injected save uses the existing account sync. */
export function createPlanningPreferencesController({ document, getState, getRecipes, isAvailable, save, notify, onChange, savedFeedback = notify }) {
  let opener = null, original = null, menuOpener = null;
  const dialog = document.getElementById('planningPreferencesDialog');
  dialog.addEventListener('close', () => {
    const target = opener?.isConnected ? opener : document.querySelector('[data-review-focus="preferences"]')
      || document.querySelector('[data-action="planning-preferences-open"]');
    target?.focus({preventScroll:true}); opener = null;
  });
  function open(button) {
    opener = button;
    original = {...getState().planningPreferences.weekdayTimeLimits};
    document.getElementById('planningPreferencesContent').innerHTML = planningPreferencesMarkup(getState().planningPreferences,getRecipes(),isAvailable());
    if (!dialog.open) dialog.showModal();
  }
  function commit(patch) {
    if (!isAvailable()) { notify('No se pueden guardar preferencias en tu cuenta ahora.'); return false; }
    const state = getState(), next = applyPlanningPreferencesPatch(state.planningPreferences,patch);
    if (JSON.stringify(next) === JSON.stringify(state.planningPreferences)) return true;
    state.planningPreferences = next;
    save(); onChange();
    savedFeedback('Preferencias actualizadas · se aplicarán al generar otra propuesta');
    return true;
  }
  function setRecipe(recipeId, preference) {
    if (!getRecipes().some(recipe => recipe.id === recipeId)) { notify('Esta receta guardada ya no está disponible para nuevos menús.'); return; }
    try {
      closeRecipeMenu(true);
      if (!commit({recipePreferences:{[recipeId]:preference}})) return;
      const marked = document.getElementById('planningMarkedRecipes');
      if (dialog.open && marked) {
        const focused = marked.contains(document.activeElement);
        marked.innerHTML = markedRecipesMarkup(getState().planningPreferences,getRecipes(),isAvailable());
        if (focused) (marked.querySelector('button') || document.getElementById('planningPreferencesTitle'))?.focus({preventScroll:true});
      }
    } catch (error) { notify(error.message); }
  }
  function submit(form) {
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form));
    try { if (commit(timeLimitsPatch(values,original))) dialog.close(); }
    catch (error) { notify(error.message); }
  }
  function closeRecipeMenu(restoreFocus = false) {
    const menu = document.getElementById('recipePreferenceMenu'), previous = menuOpener;
    menuOpener = null;
    if (menu) menu.hidden = true;
    previous?.setAttribute('aria-expanded', 'false');
    if (restoreFocus && previous?.isConnected) previous.focus({preventScroll:true});
  }
  function openRecipeMenu(button) {
    if (menuOpener === button) { closeRecipeMenu(true); return; }
    closeRecipeMenu();
    const recipe = getRecipes().find(item => item.id === button.dataset.recipe);
    if (!recipe || !isAvailable()) { notify('Ahora no se pueden guardar preferencias para esta receta.'); return; }
    const excluded = getState().planningPreferences.recipePreferences[recipe.id] === 'do_not_propose';
    const menu = document.getElementById('recipePreferenceMenu');
    (button.closest('dialog[open]') || document.body).append(menu);
    menu.innerHTML = `<p role="none">${h(recipe.name)}</p><button type="button" role="menuitem" data-action="recipe-preference" data-recipe="${a(recipe.id)}" data-preference="${excluded ? 'normal' : 'do_not_propose'}">${excluded ? 'Volver a permitir' : 'No proponer automáticamente'}</button><small role="none">${excluded ? 'Volverá a entrar en la selección de futuros menús.' : 'Tus menús guardados se conservan.'}</small>`;
    menuOpener = button;button.setAttribute('aria-expanded','true');menu.hidden = false;
    const rect = button.getBoundingClientRect(), bounds = menu.getBoundingClientRect(), win = document.defaultView;
    const x = Math.max(8, Math.min(rect.right - bounds.width, win.innerWidth - bounds.width - 8));
    const below = rect.bottom + 6, y = below + bounds.height <= win.innerHeight - 8 ? below : Math.max(8, rect.top - bounds.height - 6);
    menu.style.setProperty('--preference-menu-x', `${x}px`);menu.style.setProperty('--preference-menu-y', `${y}px`);
    menu.querySelector('[role="menuitem"]').focus({preventScroll:true});
  }
  document.addEventListener('click', event => {
    const menu = document.getElementById('recipePreferenceMenu');
    if (menuOpener && !menu?.contains(event.target) && !menuOpener.contains(event.target)) closeRecipeMenu();
  }, true);
  document.addEventListener('keydown', event => {
    if (!menuOpener && event.key === 'ArrowDown' && event.target.dataset?.action === 'recipe-preference-more') { event.preventDefault();openRecipeMenu(event.target);return; }
    if (!menuOpener) return;
    const menu = document.getElementById('recipePreferenceMenu');
    if (event.key === 'Escape') { event.preventDefault();event.stopImmediatePropagation();closeRecipeMenu(true); }
    else if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) { event.preventDefault();menu.querySelector('[role="menuitem"]').focus(); }
    else if (event.key === 'Tab') {
      event.preventDefault();const previous = menuOpener;closeRecipeMenu(true);
      const scope = previous.closest('dialog[open]') || document;
      const controls = [...scope.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter(node => node.getClientRects().length && !node.closest('[hidden],[inert]'));
      const index = controls.indexOf(previous), direction = event.shiftKey ? -1 : 1;
      controls[(index + direction + controls.length) % controls.length]?.focus();
    }
  }, true);
  document.addEventListener('scroll', event => { if (menuOpener && !document.getElementById('recipePreferenceMenu')?.contains(event.target)) closeRecipeMenu(); }, true);
  document.addEventListener('close', event => { if (menuOpener && event.target.contains(menuOpener)) closeRecipeMenu(); }, true);
  document.defaultView?.addEventListener('resize', () => closeRecipeMenu());
  return { open, close: () => dialog.close(), setRecipe, submit, openRecipeMenu, closeRecipeMenu };
}
