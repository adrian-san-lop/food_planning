import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecipeProposalViews } from '../js/ui/recipe-proposal-views.js';

const limits = { name: 120, ingredient: 160, step: 500, items: 30 };
const escapeHTML = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const escapeAttribute = escapeHTML;

function setup(overrides = {}) {
  const state = {
    recipeProposalDraft: { mealType: 'desayuno', name: '', ingredients: [''], steps: [''] },
    recipeProposalSubmitting: false,
    menukiAdmin: false,
    proposalInbox: [],
    proposalInboxLoaded: false,
    proposalInboxLoading: false,
    proposalInboxBusy: false,
    proposalExporting: false,
    proposalInboxError: '',
    proposalEditingId: null,
    proposalEditingDraft: null,
    ...overrides,
  };
  return {
    state,
    views: createRecipeProposalViews({ getState: () => state, limits, escapeHTML, escapeAttribute, formatDateTime: () => '17 oct 2026' }),
  };
}

test('recipe proposal form uses current draft, limits and escapes user input', () => {
  const { views } = setup({ recipeProposalDraft: { mealType: 'comida', name: '<script>', ingredients: ['<img>'], steps: ['<b>'] } });
  const html = views.proposalView();
  assert.match(html, /value="&lt;script&gt;"/);
  assert.match(html, /&lt;img&gt;/);
  assert.match(html, /&lt;b&gt;/);
  assert.match(html, /data-action="proposal-add-ingredient"/);
  assert.match(html, /maxlength="160"/);
});

test('admin proposal view hides data when the account is not an admin', () => {
  const { views } = setup({ proposalInbox: [{ recipe_name: 'Private proposal' }] });
  assert.match(views.adminView(), /Sin acceso/);
  assert.doesNotMatch(views.adminView(), /Private proposal/);
});

test('admin proposal view renders escaped shared data and editing controls', () => {
  const proposal = { id: 'id-1', meal_type: 'snack', recipe_name: '<script>', created_at: '2026-10-17T10:00:00Z', ingredients: ['<img>'], steps: ['<b>'] };
  const { views } = setup({ menukiAdmin: true, proposalInbox: [proposal], proposalInboxLoaded: true });
  const html = views.adminView();
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;img&gt;/);
  assert.match(html, /&lt;b&gt;/);
  assert.match(html, /data-action="admin-edit-proposal"/);
  assert.match(html, /Descargar JSON para Codex/);
});

test('admin edit form reads its latest draft and disables controls while saving', () => {
  const proposal = { id: 'id-1', meal_type: 'comida', recipe_name: 'Pasta', created_at: '2026-10-17T10:00:00Z', ingredients: ['Arroz'], steps: ['Cocer'] };
  const { views } = setup({
    menukiAdmin: true,
    proposalInboxBusy: true,
    proposalInbox: [proposal],
    proposalEditingId: 'id-1',
    proposalEditingDraft: { mealType: 'comida', name: 'Nombre editado', ingredients: ['Pavo'], steps: ['Dorar'] },
  });
  const html = views.adminView();
  assert.match(html, /value="Nombre editado"/);
  assert.match(html, /value="Pavo"/);
  assert.match(html, /disabled/);
  assert.match(html, /Guardando…/);
});
