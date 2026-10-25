import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { createMenuPlanner } from '../js/domain/menu-planner.js';
import { createNutritionService } from '../js/domain/nutrition.js';
import { loadCatalogs } from '../js/data/catalogs.js';
import { createInventoryUnitService } from '../js/domain/inventory-units.js';
import { dateFromISO, isoDate, addDays } from '../js/domain/dates.js';
import { confirmFirstPlan } from '../js/domain/onboarding.js';
import { initialPlanningState } from '../js/persistence/planning-state.js';

const source = await readFile(new URL('../js/main.js', import.meta.url), 'utf8');
const wiring = source.match(/^const menuPlanner=createMenuPlanner[^\n]+/m)?.[0];
const functions = source.slice(source.indexOf('function nextCycleStart('), source.indexOf('function persistPlannerDraft('));
const saving = source.slice(source.indexOf('function savePlannerProposal('), source.indexOf('function activateScheduledCycleIfDue('));
assert.ok(wiring && functions);
let catalog;
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async url => ({ok: true, json: async () => JSON.parse(await readFile(url, 'utf8'))});
  catalog = await loadCatalogs({slotTypes: ['desayuno', 'media', 'comida', 'tarde', 'cena'], recoveryTags: ['calcium', 'vitamin_d', 'vitamin_c']});
} finally {globalThis.fetch = originalFetch;}
const nutritionService = createNutritionService({getFood: () => catalog.foods, getFoodMeta: () => catalog.foodMeta, getEffectiveWeight: p => p.weight});
const units = createInventoryUnitService({getFood: () => catalog.foods, getFoodMeta: () => catalog.foodMeta});
const profile = {sex: 'manual', age: 30, height: 170, weight: 70, activity: 'sedentary', goal: 'maintain', manualRmr: 1600,
  injury: false, autoPortions: true, followWeight: false};
const menus = Array.from({length: 3}, () => Array.from({length: 7}, () => ['desayuno', 'media', 'comida', 'tarde', 'cena'].map(type => catalog.recipes.find(recipe => recipe.type === type).id)));
function seededRandom(seed) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }

function harness() {
  const state = {start: '2026-10-22', noActiveCycle: false, profile: {...profile}, profileConfirmed: true,
    stock: {bread: 1000}, done: {}, movements: [], plannerDraft: null};
  const feedback = [];
  const context = vm.createContext({state, MENUS: menus, RECIPES: catalog.recipes, catalogVersion: catalog.catalogVersion,
    createMenuPlanner, nutritionService, recipeToStockAmount: units.recipeToStockAmount,
    recoveryRecipeScore: () => 0, recoveryDayScore: () => 0,
    validMenuSnapshot: () => true, cloneMenus: value => structuredClone(value), showToast: message => feedback.push(message),
    today: () => dateFromISO('2026-10-23'), dateFromISO, isoDate, addDays, activityEnergyForDate: () => 0});
  vm.runInContext(wiring + functions + saving, context);
  return {context, state, feedback};
}

test('the actual app adapter uses the common service, retains chosen dates and persists only the existing plan contract', () => {
  const {context, state} = harness(), before = JSON.stringify(state);
  const first = context.buildCycleProposal(null);
  assert.equal(first.start, '2026-11-12');
  assert.equal(first.menus.flat(2).length, 105);
  assert.equal(first.confirmedAt, null);
  assert.deepEqual(Object.keys(first).sort(), ['start','menus','locked','catalogVersion','recoveryFocus','generatedAt','confirmedAt'].sort());
  assert.equal(JSON.stringify(state), before);
  const retained = context.buildCycleProposal({...first, start: '2026-11-20'});
  assert.equal(retained.start, '2026-11-20');
  state.noActiveCycle = true;
  assert.equal(context.buildCycleProposal(null).start, '2026-10-23');
});

test('the actual app adapter cannot generate from an unconfirmed example profile or mutate an active plan', () => {
  const {context, state, feedback} = harness();
  state.profileConfirmed = false;
  const before = JSON.stringify(state);
  assert.throws(() => context.buildCycleProposal(null), /Confirma un perfil/);
  context.plannerProposal = {start: '2026-11-12', menus};
  assert.doesNotThrow(() => context.savePlannerProposal());
  assert.match(feedback[0], /Confirma un perfil/);
  assert.equal(JSON.stringify(state), before);
});

test('the actual renewal adapter supplies persisted exclusions without replacing the active menu',()=>{
  const {context,state}=harness();
  const excluded=catalog.recipes.find(recipe=>recipe.type==='desayuno').id;
  state.planningPreferences={recipePreferences:{[excluded]:'do_not_propose'},weekdayTimeLimits:{comida:null,cena:null}};
  const before=JSON.stringify(state);
  const proposal=context.buildCycleProposal(null);
  assert.equal(proposal.menus.flat(2).includes(excluded),false);
  assert.equal(JSON.stringify(state),before);
});

test('changing the goal replans only pending meals and preserves completed and past menu positions',()=>{
  const {context,state}=harness();state.activeMenus=structuredClone(menus);
  state.done={'2026-10-23#0':{rid:menus[0][1][0],usage:{bread:2},completedAt:'2026-10-23T08:00:00Z'}};
  const before=structuredClone(menus),replacement=structuredClone(menus),planner=vm.runInContext('menuPlanner',context);
  let received;
  replacement.forEach((week,w)=>week.forEach((day,d)=>day.forEach((id,slot)=>{
    const date=isoDate(addDays(dateFromISO(state.start),w*7+d));
    if(date<'2026-10-23'||(date==='2026-10-23'&&slot===0))return;
    const type=catalog.recipeById[id].type,alternative=catalog.recipes.find(recipe=>recipe.type===type&&recipe.id!==id);
    if(alternative)replacement[w][d][slot]=alternative.id;
  })));
  planner.generate=request=>{received=request;return {complete:true,menus:replacement}};
  const result=context.adaptActiveMenuForGoalChange({...profile,goal:'muscle_gain'});
  assert.equal(result.adapted,true);assert.ok(result.changed>0);
  assert.equal(received.profile.goal,'muscle_gain');assert.equal(received.previousMenus,null);
  assert.ok(received.draft.locked[0][0].every(Boolean));
  assert.equal(received.draft.locked[0][1][0],true);assert.equal(received.draft.locked[0][1][1],false);
  assert.deepEqual(state.activeMenus[0][0],before[0][0]);assert.equal(state.activeMenus[0][1][0],before[0][1][0]);
  assert.deepEqual(state.done['2026-10-23#0'],{rid:before[0][1][0],usage:{bread:2},completedAt:'2026-10-23T08:00:00Z'});
  assert.deepEqual(state.activeMenus,replacement);assert.equal(state.activeMenuCatalogVersion,catalog.catalogVersion);
});

test('the real catalog generator selects pending recipes against the newly saved goal',()=>{
  const {context,state}=harness();state.activeMenus=structuredClone(menus);
  state.done={'2026-10-23#0':{rid:menus[0][1][0],usage:{bread:2},completedAt:'2026-10-23T08:00:00Z'}};
  const before=structuredClone(state.activeMenus),planner=vm.runInContext('menuPlanner',context),generate=planner.generate;
  planner.generate=request=>generate({...request,rng:seededRandom(49)});
  const result=context.adaptActiveMenuForGoalChange({...profile,goal:'muscle_gain'});
  assert.equal(result.adapted,true);assert.ok(result.changed>0);
  assert.deepEqual(state.activeMenus[0][0],before[0][0]);
  assert.equal(state.activeMenus[0][1][0],before[0][1][0]);
  assert.deepEqual(state.done['2026-10-23#0'].usage,{bread:2});
});

test('a goal change keeps the active menu if no complete replacement can be generated',()=>{
  const {context,state}=harness();state.activeMenus=structuredClone(menus);
  const before=structuredClone(state.activeMenus),planner=vm.runInContext('menuPlanner',context);
  planner.generate=()=>({complete:false,menus:structuredClone(menus)});
  const result=context.adaptActiveMenuForGoalChange({...profile,goal:'fat_loss'});
  assert.equal(result.adapted,false);assert.equal(result.changed,0);assert.equal(result.reason,'incomplete');
  assert.deepEqual(state.activeMenus,before);assert.deepEqual(context.MENUS,before);
});

test('the actual first-menu adapter uses the chosen date and routes confirmation into one active generated cycle',()=>{
  const {context,state}=harness();Object.assign(state,initialPlanningState('guided'),{noActiveCycle:true,activeMenus:null,activeMenuConfirmedAt:null});
  state.setupDraft.profile=structuredClone(state.profile);
  const plan=context.buildCycleProposal(null,'2026-11-06');
  assert.equal(plan.start,'2026-11-06');assert.equal(plan.menus.flat(2).length,105);
  context.plannerProposal=plan;context.plannerIntent='first';let confirmations=0;
  const planner=vm.runInContext('menuPlanner',context);
  context.onboardingController={complete(value){
    const next=confirmFirstPlan(state,value,{todayISO:'2026-10-23',confirmedAt:'2026-10-23T11:00:00Z',
      cycleId:'11111111-1111-4111-8111-111111111111',inspect:proposal=>planner.inspect(context.plannerRequest(proposal.start),proposal)});
    if(!next)return false;Object.assign(state,next);confirmations++;return true;
  }};
  context.savePlannerProposal();context.savePlannerProposal();
  assert.equal(confirmations,1);assert.equal(state.noActiveCycle,false);assert.equal(state.start,'2026-11-06');
  assert.equal(state.nextMenu,null);assert.equal(JSON.stringify(state.activeMenus),JSON.stringify(plan.menus));assert.deepEqual(state.movements,[]);
});

test('incomplete proposals are reviewable but never overwrite the last complete synced draft',()=>{
  const {context,state}=harness();
  state.planningPreferences={recipePreferences:{},weekdayTimeLimits:{comida:1,cena:1}};
  const pending=context.buildCycleProposal(null);assert.equal(pending.menus.flat(2).some(id=>id===null),true);
  state.plannerDraft={keep:'last complete draft'};let writes=0;
  context.save=()=>writes++;context.cloneMenus=structuredClone;
  context.plannerProposal=pending;
  context.validMenuSnapshot=menus=>menus.flat(2).every(Boolean);
  vm.runInContext(source.slice(source.indexOf('function persistPlannerDraft('),source.indexOf('function plannerCounts(')),context);
  assert.equal(context.persistPlannerDraft(),false);assert.equal(writes,0);assert.deepEqual(state.plannerDraft,{keep:'last complete draft'});
});
