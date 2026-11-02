import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { accountSetupProgress, confirmSetupProfile, confirmFirstPlan } from '../js/domain/onboarding.js';
import { createProfileDraft } from '../js/domain/profile.js';
import { initialPlanningState, initializeAccountState } from '../js/persistence/planning-state.js';
import { createOnboardingController } from '../js/ui/onboarding-controller.js';
import { onboardingMarkup } from '../js/ui/onboarding-view.js';
import { createReconciliationBase, reconcileStates } from '../js/domain/state-reconciliation.js';

const profile = createProfileDraft({sex:'male',age:30,height:180,weight:80,activity:'light',goal:'maintain'});
const base = () => ({...initialPlanningState('guided'),profile:null,profileConfirmed:false,noActiveCycle:true,
  activeMenus:null,activeCycleId:null,activeMenuConfirmedAt:null,nextMenu:null,plannerDraft:null,archives:[],stock:{rice:100},done:{},movements:[]});
const ready = () => confirmSetupProfile({...base(),setupDraft:{...base().setupDraft,profile:structuredClone(profile)}});
const menu = () => ({start:'2026-10-23',menus:Array.from({length:3},()=>Array.from({length:7},()=>['a','b','c','d','e'])),
  catalogVersion:'0.10.0',generatedAt:'2026-10-23T10:00:00Z',recoveryFocus:false});
const confirmation = {todayISO:'2026-10-23',confirmedAt:'2026-10-23T10:30:00Z',cycleId:'11111111-1111-4111-8111-111111111111',inspect:()=>({complete:true})};

test('a fresh guided account cannot use sample values or an unconfirmed profile to generate its first cycle',()=>{
  const state=base();assert.equal(accountSetupProgress(state).step,'about');
  assert.throws(()=>confirmSetupProfile(state),/Completa/);
  assert.throws(()=>confirmFirstPlan(state,menu(),confirmation),/Confirma/);
  assert.equal(state.profile,null);assert.equal(state.activeMenus,null);
});

test('an existing guided account with an unusable saved cycle still opens the app',()=>{
  const state={...ready(),noActiveCycle:true,activeMenus:null,activeMenuConfirmedAt:null,
    cloudPlanIssue:{status:'active',start:'2026-10-23',filled:104,reason:'incomplete',missingRecipeIds:[]}};
  assert.equal(accountSetupProgress(state).destination,'app');
  assert.equal(accountSetupProgress(state).needsProfileReview,false);
});

test('one explicit first-plan confirmation is immutable, keeps stock and cannot create another cycle on double click',()=>{
  const state=ready(), before=structuredClone(state), plan=menu();
  const next=confirmFirstPlan(state,plan,confirmation);
  assert.deepEqual(state,before);assert.equal(next.activeCycleId,confirmation.cycleId);
  assert.equal(next.activeMenuConfirmedAt,confirmation.confirmedAt);assert.equal(next.activeMenus.flat(2).length,105);
  assert.equal(next.noActiveCycle,false);assert.equal(next.nextMenu,null);assert.equal(next.plannerDraft,null);
  assert.deepEqual(next.stock,state.stock);assert.deepEqual(next.movements,[]);
  assert.equal(confirmFirstPlan(next,plan,confirmation),null);
  plan.menus[0][0][0]='changed';assert.equal(next.activeMenus[0][0][0],'a');
});

test('incomplete or past proposals cannot activate a plan, while a chosen future start is retained',()=>{
  const state=ready(),before=structuredClone(state);
  assert.throws(()=>confirmFirstPlan(state,menu(),{...confirmation,inspect:()=>({complete:false})}),/pendientes/);
  assert.throws(()=>confirmFirstPlan(state,{...menu(),start:'2026-10-22'},confirmation),/fecha posterior/);
  assert.deepEqual(state,before);
  const next=confirmFirstPlan(state,{...menu(),start:'2026-11-04'},confirmation);
  assert.equal(next.start,'2026-11-04');assert.equal(accountSetupProgress(next).destination,'app');
});

test('resumption derives steps from validated facts and confirmed/archived cycles never repeat first use',()=>{
  const partial=base();partial.setupDraft.profile={...profile,goal:null,activity:null};
  assert.equal(accountSetupProgress(partial).step,'goal');
  const confirmed=ready();assert.equal(accountSetupProgress(confirmed).step,'preferences');
  confirmed.setupDraft.preferencesReviewed=true;assert.equal(accountSetupProgress(confirmed).step,'menu');
  confirmed.archives=[{confirmedAt:'2026-09-01T10:00:00Z'}];assert.equal(accountSetupProgress(confirmed).destination,'app');
  const legacy={...base(),setupMode:'legacy',noActiveCycle:false,profile};
  assert.equal(accountSetupProgress(legacy).destination,'app');assert.equal(accountSetupProgress(legacy).needsProfileReview,true);
});

test('simultaneous first confirmations adopt the remotely accepted cycle rather than creating a second local instance',()=>{
  const baseState=ready(), local=confirmFirstPlan(baseState,menu(),confirmation);
  const remote=confirmFirstPlan(baseState,{...menu(),start:'2026-11-04'},
    {...confirmation,cycleId:'22222222-2222-4222-8222-222222222222'});
  const merged=reconcileStates(createReconciliationBase(baseState),local,remote);
  assert.equal(merged.activeCycleId,remote.activeCycleId);assert.equal(merged.start,remote.start);
  assert.deepEqual(merged.activeMenus,remote.activeMenus);assert.equal(merged.noActiveCycle,false);
  assert.equal(confirmFirstPlan(merged,menu(),confirmation),null);
});

function controllerHarness(initial=base(),available=true) {
  let state=initial;
  const calls={save:0,started:0,review:[]},form={dataset:{step:'about'},values:{},elements:{sex:{value:''}},reportValidity:()=>true};
  const manualInput={},manualField={hidden:true,querySelector:()=>manualInput},error={};
  const root={html:'',contains:()=>false,querySelectorAll:()=>[],set innerHTML(value){this.html=value;form.dataset.step=value.match(/data-step="([^"]+)"/)[1];form.elements.sex.value=state.setupDraft.profile.sex||'';},get innerHTML(){return this.html}};
  const document={activeElement:null,getElementById:id=>({setupContent:root,setupForm:form,setupManualField:manualField,setupError:error,setupTitle:{focus(){}}}[id])};
  const controller=createOnboardingController({document,getState:()=>state,setState:next=>{state=next},authenticated:()=>true,
    available:()=>available,save:()=>calls.save++,todayISO:()=>confirmation.todayISO,nowISO:()=>confirmation.confirmedAt,newCycleId:()=>confirmation.cycleId,
    inspect:confirmation.inspect,activityLevels:[],goals:{maintain:'Mantener peso'},onReview:start=>calls.review.push(start),onStarted:()=>calls.started++});
  controller.render();
  return {controller,calls,form,root,error,manualField,get state(){return state}};
}
function withFormData(action) {
  const Original=globalThis.FormData;
  globalThis.FormData=class {constructor(form){this.values=form.values}get(key){return this.values[key]??null}has(key){return Object.hasOwn(this.values,key)}};
  try {action();} finally {globalThis.FormData=Original;}
}

test('guided controls preserve valid partial fields and reject out-of-range text without synchronizing it',()=>withFormData(()=>{
  const app=controllerHarness();app.form.values={sex:'male',age:'12',height:'180',weight:'80'};
  app.controller.capture(app.form);
  assert.equal(app.state.setupDraft.profile.age,null);assert.equal(app.state.setupDraft.profile.height,180);
  assert.equal(app.state.profile,null);assert.equal(app.state.profileConfirmed,false);
  app.controller.submit(app.form);assert.match(app.error.textContent,/datos necesarios/);
  app.form.values.age='30';app.controller.submit(app.form);assert.equal(app.form.dataset.step,'goal');
  app.form.values={goal:'maintain',activity:'light',autoPortions:'on'};
  app.controller.submit(app.form);assert.equal(app.form.dataset.step,'preferences');assert.equal(app.state.profileConfirmed,true);
  assert.equal(app.state.activeMenus,null);assert.equal(app.state.profile.manualRmr,null);
}));

test('optional preferences can be skipped, manual resting energy stays required, and back preserves saved progress',()=>withFormData(()=>{
  const app=controllerHarness(ready());assert.equal(app.form.dataset.step,'preferences');
  app.form.values={comida:'30',cena:''};app.controller.capture(app.form);app.controller.skip();
  assert.equal(app.form.dataset.step,'menu');assert.equal(app.state.planningPreferences.weekdayTimeLimits.comida,30);
  app.form.values={startDate:'2026-11-01'};app.controller.submit(app.form);assert.deepEqual(app.calls.review,['2026-11-01']);
  app.controller.back();assert.equal(app.form.dataset.step,'preferences');assert.equal(app.state.setupDraft.startDate,'2026-11-01');
  const manual=controllerHarness();manual.form.values={sex:'manual',age:'30',height:'170',weight:'70',manualRmr:''};
  manual.controller.submit(manual.form);assert.equal(manual.form.dataset.step,'about');assert.equal(manual.state.profile,null);
}));

test('unavailable planning disables only first-use controls and cannot confirm or save invented data',()=>withFormData(()=>{
  const app=controllerHarness(base(),false);assert.match(app.root.html,/No podemos|no podemos/);
  app.form.values={sex:'male',age:'30',height:'180',weight:'80'};app.controller.capture(app.form);app.controller.submit(app.form);
  assert.equal(app.calls.save,0);assert.equal(app.controller.complete(menu()),false);assert.equal(app.state.profile,null);
}));

test('starting from the guided controller saves one instance; reloading the working copy opens the app',()=>{
  const app=controllerHarness(ready());assert.equal(app.controller.complete(menu()),true);
  assert.equal(app.calls.save,1);assert.equal(app.calls.started,1);
  assert.equal(app.controller.complete(menu()),false);assert.equal(app.calls.save,1);
  const restored=JSON.parse(JSON.stringify(app.state));assert.equal(accountSetupProgress(restored).destination,'app');
});

test('setup markup has empty required personal fields, descriptions and optional preferences without fabricated defaults',()=>{
  const args={draft:base().setupDraft,preferences:base().planningPreferences,goals:{maintain:'Mantener peso'},
    activityLevels:[['sedentary','Sedentario · ×1,20','Trabajo sentado.']],start:'2026-10-23',todayISO:'2026-10-23',available:true};
  const first=onboardingMarkup({...args,step:'about'});assert.match(first,/Paso 1 de 4/);assert.match(first,/name="age"[^>]+value=""/);
  assert.doesNotMatch(first,/value="30"|value="70"/);
  assert.match(onboardingMarkup({...args,step:'goal'}),/Trabajo sentado/);
  assert.match(onboardingMarkup({...args,step:'preferences'}),/Configurar más adelante/);
  assert.match(onboardingMarkup({...args,step:'menu'}),/Preparar mi menú/);
});

const main=await readFile(new URL('../js/main.js',import.meta.url),'utf8');
const initialization=main.slice(main.indexOf('async function initializeCloudState('),main.indexOf('function hasMeaningfulLocalState('));
test('the cycle notice explains that account data loaded and offers a new cycle without a review prompt',()=>{
  const start=main.indexOf('function renderCycleSetupNotice('),end=main.indexOf('\nfunction mealCard(',start),root={hidden:true,innerHTML:''};
  assert.ok(start>=0&&end>start);
  const context=vm.createContext({state:{noActiveCycle:true,cloudPlanIssue:{status:'active'}},cycleSetupDateDraft:'',
    document:{getElementById:()=>root},ic:()=>'',escapeAttribute:value=>String(value)});
  vm.runInContext(main.slice(start,end),context);context.renderCycleSetupNotice();
  assert.match(root.innerHTML,/El menú guardado no está disponible/);
  assert.match(root.innerHTML,/se han cargado desde Supabase/);
  assert.match(root.innerHTML,/Actualizar aplicación/);assert.doesNotMatch(root.innerHTML,/Crear ciclo nuevo/);
  assert.doesNotMatch(root.innerHTML,/revisar/i);
});
test('the actual signup adapter initializes guided drafts without a sample profile or fixed menu, and gates unsupported schemas',async()=>{
  for(const available of [true,false]) {
    let writes=0;
    const context=vm.createContext({state:null,currentUserId:'user-a',authSessionUserId:'user-a',KEY:'key',cloudRevision:0,planningPersistenceAvailable:false,cloudReady:false,
      localStorage:{getItem:()=>null},load:()=>({...base(),setupMode:'legacy',profile:{age:30},noActiveCycle:false}),initializeAccountState,
      supabaseTransport:{planningAvailable:async()=>available,readOne:async()=>null},hasMeaningfulLocalState:()=>false,
      isoDate:value=>value,today:()=>confirmation.todayISO,cloudStatus(){},syncCloudNow:async()=>{writes++;return true}});
    vm.runInContext(initialization,context);await context.initializeCloudState({id:'user-a'});
    assert.equal(context.state.setupMode,'guided');assert.equal(context.state.profile,null);assert.equal(context.state.noActiveCycle,true);
    assert.equal(context.state.activeMenus,null);assert.equal(writes,available?1:0);
  }
});
