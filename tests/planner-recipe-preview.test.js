import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { escapeHTML, escapeAttribute } from '../js/ui/html.js';

const source = await readFile(new URL('../js/main.js', import.meta.url), 'utf8');
const preview = source.slice(source.indexOf('function showPlannerRecipe('), source.indexOf('function togglePlannerLock('));
const renderer = source.slice(source.indexOf('function showRecipe('), source.indexOf('function toggleMeal('));
function harness() {
  const recipes = Object.fromEntries(['a', 'b', 'c', 'd', 'e', 'alternative'].map(id => [id, {
    id, name: `Receta ${id}`, type: 'comida', time: 20, intro: 'Descripción', tip: '',
    steps: ['Preparar <ingredientes>', 'Cocinar'], ingredients: [{id: 'rice', rest: 75}],
  }]));
  const proposal = {menus: Array.from({length: 3}, () => Array.from({length: 7}, () => ['a', 'b', 'c', 'd', 'e'])),
    locked: Array.from({length: 3}, () => Array.from({length: 7}, () => Array(5).fill(false)))};
  proposal.menus[2][5][2] = 'alternative';
  const state = {done: {}, stock: {rice: 500}}, calls = [];
  const content = {scrollTop: 0}, more = {open: false};
  const root = {dataset: {}, innerHTML: '', contains: () => false, querySelector: selector => selector === '.recipe-more' ? more : content};
  const dialog = {open: false, showModal() { this.open = true; }};
  const context = vm.createContext({
    plannerProposal: proposal, modalCtx: null, REC: recipes, visibleWeek: 0, state,
    document: {getElementById: id => id === 'recipeDialog' ? dialog : root},
    portionsForRecipes: (day, activity) => { calls.push({ids: day.map(recipe => recipe.id), activity}); return day.map((_, s) => ({rice: 100 + s})); },
    recipeUsage: () => ({rice: 999}), mealUsage: () => ({rice: 75}),
    recipeIngredients: (_recipe, usage) => `<p>${usage.rice} g de arroz</p>`,
    getMacro: usage => ({k: usage.rice, p: 10, c: 20, f: 5}),
    escapeHTML, escapeAttribute, nformat: String, ic: () => '',
    mealKey: () => 'active', dateISOAt: () => '2026-10-21',
    activitySessionsForDate: () => [], isoDate: () => '2026-10-21', today: () => new Date(),
    formatDate: () => '21 oct', dateFromISO: value => new Date(value), done: () => false,
  });
  vm.runInContext(preview + renderer, context);
  return {context, root, dialog, proposal, state, calls};
}

test('planner recipe preview reads the selected proposal day and adjusted portions without changing meals, locks or stock', () => {
  const app = harness(), before = structuredClone({proposal: app.proposal, state: app.state});
  const button = {dataset: {week: '2', day: '5', slot: '2'}};
  app.context.showPlannerRecipe(button);
  assert.equal(app.dialog.open, true);
  assert.equal(app.context.modalCtx.id, 'alternative');
  assert.equal(app.context.modalCtx.opener, button);
  assert.deepEqual(app.calls, [{ids: ['a', 'b', 'alternative', 'd', 'e'], activity: 0}]);
  assert.match(app.root.innerHTML, /102 g de arroz/);
  assert.match(app.root.innerHTML, /Preparar &lt;ingredientes&gt;/);
  assert.match(app.root.innerHTML, /Volver a la revisión/);
  assert.doesNotMatch(app.root.innerHTML, /toggle-meal|999 g/);
  assert.deepEqual({proposal: app.proposal, state: app.state}, before);
});

test('ordinary recipe dialogs still distinguish catalog base quantities from active-day registration', () => {
  const app = harness();
  app.context.showRecipe('a');
  assert.match(app.root.innerHTML, /75 g de arroz/);
  assert.match(app.root.innerHTML, /Cerrar receta/);
  assert.doesNotMatch(app.root.innerHTML, /toggle-meal/);
  app.context.showRecipe('a', 0, 0, 0);
  assert.match(app.root.innerHTML, /999 g de arroz/);
  assert.match(app.root.innerHTML, /data-action="toggle-meal"/);
});

test('missing proposal or stale positions do not open a recipe dialog', () => {
  const app = harness();
  app.context.showPlannerRecipe({dataset: {week: '8', day: '0', slot: '0'}});
  app.context.plannerProposal = null;
  app.context.showPlannerRecipe({dataset: {week: '0', day: '0', slot: '0'}});
  assert.equal(app.dialog.open, false);
  assert.equal(app.calls.length, 0);
});
