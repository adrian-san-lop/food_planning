import { accountSetupProgress, confirmSetupProfile, confirmFirstPlan, validateSetupDraft } from '../domain/onboarding.js?v=20261025-cloud-account-load';
import { createProfileDraft, validateProfileDraft } from '../domain/profile.js?v=20261022-planner-foundations';
import { applyPlanningPreferencesPatch } from '../domain/planning-preferences.js?v=20261022-planner-foundations';
import { dateFromISO } from '../domain/dates.js?v=20261015-european-date';
import { onboardingMarkup, SETUP_STEPS } from './onboarding-view.js?v=20261023-guided-setup';

/** UI orchestration; account state, sync and the common planner are injected. */
export function createOnboardingController({ document, getState, setState, authenticated, available,
  save, todayISO, nowISO, newCycleId, inspect, activityLevels, goals, onReview, onStarted }) {
  const root = document.getElementById('setupContent');
  let step = null, signature = '', error = '', previouslyConfirmed = false, reviewed = false;
  const progress = () => accountSetupProgress(getState(), authenticated());
  const required = () => getState()?.setupMode === 'guided' && progress().destination === 'setup';
  const modelSignature = () => JSON.stringify([step, getState().setupDraft, getState().profile,
    getState().profileConfirmed, getState().planningPreferences, getState().plannerDraft, available(), error]);
  function reset() { step = null; signature = ''; error = ''; previouslyConfirmed = false; reviewed = false; }
  function render({ force = false, focusTitle = false } = {}) {
    const firstRender = !signature;
    const state = getState(), status = progress();
    if (!step || (!previouslyConfirmed && state.profileConfirmed)
      || (!status.profileReady && SETUP_STEPS.indexOf(step) > 1)
      || (!reviewed && state.setupDraft.preferencesReviewed && step === 'preferences')) step = status.step;
    previouslyConfirmed = state.profileConfirmed; reviewed = state.setupDraft.preferencesReviewed;
    const nextSignature = modelSignature();
    if (!force && signature === nextSignature) return;
    const active = root.contains(document.activeElement) ? document.activeElement : null;
    const name = active?.name, value = active?.type === 'radio' ? active.value : null;
    root.innerHTML = onboardingMarkup({ step, draft: state.setupDraft, preferences: state.planningPreferences,
      profileConfirmed: state.profileConfirmed, activityLevels, goals, start: state.setupDraft.startDate || todayISO(),
      todayISO: todayISO(), plan: state.plannerDraft, available: available(), error });
    updateManualField(); signature = modelSignature();
    if (focusTitle || firstRender) document.getElementById('setupTitle').focus();
    else if (name) [...root.querySelectorAll('[name]')].find(input => input.name === name && (value === null || input.value === value))?.focus({preventScroll:true});
  }
  function updateManualField() {
    const form = document.getElementById('setupForm');
    if (form?.dataset.step !== 'about') return;
    const manual = form.elements.sex.value === 'manual', container = document.getElementById('setupManualField');
    container.hidden = !manual;
    const input = container.querySelector('input'); input.disabled = !manual || !available(); input.required = manual;
  }
  function rawProfile(form) {
    const data = new FormData(form), old = getState().setupDraft.profile;
    const values = step === 'about' ? { sex: data.get('sex'), age: data.get('age'), height: data.get('height'),
      weight: data.get('weight'), manualRmr: data.get('sex') === 'manual' ? data.get('manualRmr') : null }
      : { goal: data.get('goal'), activity: data.get('activity'), injury: data.has('injury'), autoPortions: data.has('autoPortions') };
    return createProfileDraft({ ...old, ...values });
  }
  function replace(next) { setState(next); save(); signature = modelSignature(); }
  function capture(form) {
    if (!available() || !required()) return;
    let state = getState(), draft = structuredClone(state.setupDraft);
    if (step === 'about' || step === 'goal') {
      const raw = rawProfile(form), fields = step === 'about'
        ? ['sex','age','height','weight','manualRmr'] : ['goal','activity','injury','autoPortions'];
      for (const field of fields) {
        const candidate = { ...draft, profile: { ...draft.profile, [field]: raw[field] } };
        if (validateSetupDraft(candidate).valid) draft = candidate;
      }
    } else if (step === 'preferences') {
      const values = new FormData(form);
      for (const slot of ['comida','cena']) {
        const raw = String(values.get(slot) ?? '').trim(), value = raw === '' ? null : Number(raw);
        try { state = { ...state, planningPreferences: applyPlanningPreferencesPatch(state.planningPreferences,
          { weekdayTimeLimits: { [slot]: value } }) }; } catch { /* Invalid form text stays visible for correction. */ }
      }
    } else if (step === 'menu') {
      const date = String(new FormData(form).get('startDate') || '');
      if (dateFromISO(date) && date >= todayISO()) draft.startDate = date;
    }
    const next = { ...state, setupDraft: draft };
    if (JSON.stringify(next) !== JSON.stringify(getState())) replace(next);
    updateManualField();
  }
  function showError(message) {
    error = message;
    const node = document.getElementById('setupError'); node.textContent = message; node.hidden = false;
    signature = modelSignature();
  }
  function move(next) { step = next; error = ''; render({force:true,focusTitle:true}); }
  function submit(form) {
    if (!required() || !available()) return;
    capture(form);
    if (!form.reportValidity()) { showError('Revisa los campos indicados para continuar.'); return; }
    try {
      if (step === 'about' || step === 'goal') {
        const raw = rawProfile(form), validation = validateProfileDraft(raw);
        if (!(step === 'about' ? validation.aboutComplete : validation.valid)) {
          showError('Completa los datos necesarios para este paso.'); return;
        }
        const next = { ...getState(), setupDraft: { ...getState().setupDraft, profile: raw } };
        replace(step === 'goal' ? confirmSetupProfile(next) : next);
        // Recording the transition here prevents render treating our own confirmation as a remote jump.
        previouslyConfirmed = getState().profileConfirmed;
        move(step === 'about' ? 'goal' : 'preferences');
      } else if (step === 'preferences') skip();
      else {
        const start = String(new FormData(form).get('startDate') || '');
        if (!dateFromISO(start) || start < todayISO()) throw new TypeError('Elige hoy o una fecha posterior para empezar.');
        onReview(start);
      }
    } catch (failure) { showError(failure.message); }
  }
  function back() {
    const form = document.getElementById('setupForm'); if (form) capture(form);
    move(SETUP_STEPS[Math.max(0,SETUP_STEPS.indexOf(step)-1)]);
  }
  function skip() {
    if (!available() || !required() || !progress().profileReady) return;
    replace({ ...getState(), setupDraft: { ...getState().setupDraft, preferencesReviewed: true } });
    reviewed = true; move('menu');
  }
  function complete(plan) {
    if (!required() || !available()) return false;
    const next = confirmFirstPlan(getState(), plan, { todayISO: todayISO(), confirmedAt: nowISO(), cycleId: newCycleId(), inspect });
    if (!next) return false;
    replace(next); reset(); onStarted(); return true;
  }
  return { required, reset, render, capture, submit, back, skip, complete };
}
