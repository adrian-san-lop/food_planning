import { applyPlanningPreferencesPatch } from '../domain/planning-preferences.js?v=20261022-planner-foundations';
import { planningPreferencesMarkup, markedRecipesMarkup, timeLimitsPatch } from './planning-preferences.js?v=20261023-weekly-review';

/** View/editor boundary only. The injected save uses the existing account sync. */
export function createPlanningPreferencesController({ document, getState, getRecipes, isAvailable, save, notify, onChange }) {
  let opener = null, original = null;
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
    notify('Preferencias actualizadas · se aplicarán al generar o cambiar platos');
    return true;
  }
  function setRecipe(recipeId, preference) {
    if (!getRecipes().some(recipe => recipe.id === recipeId)) return;
    try {
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
  return { open, close: () => dialog.close(), setRecipe, submit };
}
