import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createStateNormalizer } from '../js/persistence/state-normalization.js';
import { dateFromISO, isoDate } from '../js/domain/dates.js';

// Exercise the actual entry-point wiring and opening handler, not an already
// opened editor. DOM/persistence boundaries stay isolated from any account.
const main = await readFile(new URL('../js/main.js', import.meta.url), 'utf8');
const wiring = main.match(/^const \{[^\n]+\}=createStateNormalizer\([^\n]+\);/m)?.[0];
const opening = main.slice(main.indexOf('function openPlannerDialog(){'), main.indexOf('function regeneratePlannerProposal(){'));
assert.ok(wiring && opening, 'Planner entry point must be present');
const slots = ['desayuno', 'media', 'comida', 'tarde', 'cena'];
const cloneMenus = menus => menus.map(week => week.map(day => day.slice()));
function plan() {
  const menus = Array.from({length: 3}, () => Array.from({length: 7}, () => slots.slice()));
  const locked = menus.map(week => week.map(day => day.map(() => false)));
  locked[2][6][4] = true;
  return {start: '2026-11-03', menus, locked, catalogVersion: '0.9.3', recoveryFocus: true,
    generatedAt: '2026-10-21T12:00:00Z', confirmedAt: null};
}
function harness({draft = null, confirmed = null, expired = false} = {}) {
  const calls = {generated: 0, persisted: 0, rendered: 0, opened: 0, closed: 0, feedback: []};
  const dialog = {open: false, showModal() { this.open = true; calls.opened++; }};
  const state = {start: '2026-10-13', plannerDraft: draft};
  const context = vm.createContext({
    createStateNormalizer, state, plannerProposal: null,
    emptyState: () => ({}), getFood: () => ({}), FOOD: {}, inventoryUnitService: {},
    normalizeLegacyDeduction: () => 0, dateFromISO, isoDate,
    today: () => dateFromISO('2026-10-21'), ACTIVITY_BY_ID: {},
    sanitizeProfile: value => value, isUuid: () => false, cloneMenus, roundAmount: Number,
    validMenuSnapshot: menus => Array.isArray(menus) && menus.length === 3 && menus.every(week =>
      week.length === 7 && week.every(day => day.length === 5 && day.every((id, slot) => id === slots[slot]))),
    confirmedNextMenu: () => confirmed,
    cycleHasEnded: () => expired,
    buildCycleProposal: () => { calls.generated++; return plan(); },
    showToast: message => { calls.feedback.push(message); },
    persistPlannerDraft: () => { calls.persisted++; },
    renderPlannerReview: () => { calls.rendered++; },
    document: {getElementById: id => {
      if (id === 'plannerDialog') return dialog;
      if (id === 'cycleRenewalDialog') return {close: () => { calls.closed++; }};
      throw new Error(`Unexpected dialog: ${id}`);
    }},
  });
  vm.runInContext(wiring + '\n' + opening, context);
  return {context, state, calls, dialog, open: () => vm.runInContext('openPlannerDialog()', context)};
}

test('Continuar revisión opens the saved draft with all 105 meals and locks, without regeneration or writes', () => {
  const draft = plan(), before = structuredClone(draft), app = harness({draft});
  app.open();
  assert.equal(app.dialog.open, true);
  assert.equal(app.calls.rendered, 1);
  assert.equal(app.calls.generated, 0);
  assert.equal(app.calls.persisted, 0);
  assert.equal(app.context.plannerProposal.menus.flat(2).length, 105);
  assert.equal(app.context.plannerProposal.locked[2][6][4], true);
  assert.deepEqual(app.context.plannerProposal.menus, draft.menus);
  app.context.plannerProposal.menus[0][0][0] = 'edited';
  assert.deepEqual(draft, before);
});

test('Revisar menú guardado opens the confirmed plan and repeated opening does not call showModal twice', () => {
  const confirmed = {...plan(), confirmedAt: '2026-10-21T13:00:00Z'}, app = harness({confirmed});
  app.open(); app.open();
  assert.equal(app.calls.opened, 1);
  assert.equal(app.context.plannerProposal.confirmedAt, confirmed.confirmedAt);
  assert.equal(app.calls.generated, 0);
  assert.equal(app.calls.persisted, 0);
});

test('Preparar próximo menú generates and opens a proposal when there is no draft', () => {
  const app = harness();
  app.open();
  assert.equal(app.dialog.open, true);
  assert.equal(app.calls.generated, 1);
  assert.equal(app.calls.persisted, 1);
});

test('an expired draft opens with a new proposed date without changing its saved source', () => {
  const draft = {...plan(), start: '2026-09-01', confirmedAt: '2026-08-31T12:00:00Z'};
  const app = harness({draft, expired: true});
  app.open();
  assert.equal(app.context.plannerProposal.start, '2026-10-21');
  assert.equal(app.context.plannerProposal.confirmedAt, null);
  assert.equal(draft.start, '2026-09-01');
  assert.equal(app.calls.generated, 0);
  assert.equal(app.calls.persisted, 1);
  assert.equal(app.dialog.open, true);
});

test('generation errors stay inside planner feedback and never persist or open a broken proposal', () => {
  const app = harness();
  app.context.buildCycleProposal = () => { throw new TypeError('Confirma un perfil válido en Mi perfil'); };
  assert.doesNotThrow(app.open);
  assert.equal(app.calls.opened, 0);
  assert.equal(app.calls.persisted, 0);
  assert.equal(app.calls.rendered, 0);
  assert.deepEqual(app.calls.feedback, ['Confirma un perfil válido en Mi perfil']);
});
