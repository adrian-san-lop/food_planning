import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { createAccountAction, accountActionIsEmpty } from '../js/persistence/account-actions.js';
import { materializePlan, cleanPlanDetails } from '../js/domain/plan-details.js';
import { createSupabaseTransport } from '../js/persistence/supabase-transport.js';
import { reconcileStates } from '../js/domain/state-reconciliation.js';
import { loadCatalogs } from '../js/data/catalogs.js';

const main=await readFile(new URL('../js/main.js',import.meta.url),'utf8');
let catalog;const fetchOriginal=globalThis.fetch;
try{globalThis.fetch=async url=>({ok:true,json:async()=>JSON.parse(await readFile(url,'utf8'))});catalog=await loadCatalogs({slotTypes:['desayuno','media','comida','tarde','cena'],recoveryTags:['calcium','vitamin_d','vitamin_c']})}finally{globalThis.fetch=fetchOriginal}
const profile={sex:'male',age:30,height:180,weight:80,activity:'sedentary',goal:'maintain',manualRmr:null,injury:false,autoPortions:true,followWeight:false};
const menus=Array.from({length:3},()=>Array.from({length:7},()=>['yogur_platano','tostada_queso','arroz_pollo','yogur_nueces','merluza_patatas']));
const request={start:'2026-10-23',menus,profile,catalog,asOf:'2026-10-25'};

test('a saved menu keeps recipes, food values and amounts after the published catalog changes',()=>{
 const first=materializePlan(request),changed=structuredClone(catalog);
 changed.recipeById={};changed.foods={};
 const next=materializePlan({...request,catalog:changed,previous:first});
 assert.deepEqual(next.recipes,first.recipes);assert.deepEqual(next.foods,first.foods);assert.deepEqual(next.portions,first.portions);
 assert.ok(cleanPlanDetails(first));assert.equal(Object.keys(first.portions).length,105);
 assert.equal(cleanPlanDetails({...first,portions:{}}),null);
});

test('an explicit goal change updates future targets while keeping past and completed quantities',()=>{
 const first=materializePlan(request),usage=first.portions['2026-10-25#0'];
 const next=materializePlan({...request,previous:first,profile:{...profile,goal:'muscle_gain'},done:{'2026-10-25#0':{usage}}});
 assert.deepEqual(next.portions['2026-10-23#0'],first.portions['2026-10-23#0']);
 assert.deepEqual(next.portions['2026-10-25#0'],usage);
 assert.notEqual(next.targets['2026-10-26'].calories,first.targets['2026-10-26'].calories);
});

test('recorded activity changes only its date and keeps the completed portion fixed',()=>{
 const first=materializePlan(request),usage=first.portions['2026-10-24#0'];
 const next=materializePlan({...request,previous:first,activities:[{id:'one',date:'2026-10-24',met:6,durationMinutes:60}],done:{'2026-10-24#0':{usage}}});
 assert.equal(next.targets['2026-10-24'].activityKcal,400);assert.deepEqual(next.portions['2026-10-24#0'],usage);
 assert.deepEqual(next.portions['2026-10-26#2'],first.portions['2026-10-26#2']);
});

test('scoped actions send only changed profile fields and preserve resources omitted by the caller',()=>{
 const base={profile:{age:30,goal:'maintain'},cycles:[{id:'one',status:'active'}],planned_meals:[]};
 const action=createAccountAction(base,{...base,profile:{age:31,goal:'maintain'}});
 assert.deepEqual(action,{contract:2,profile:{age:31}});assert.ok(accountActionIsEmpty(createAccountAction(base,base)));
});

test('changing ingredient sets sends complete replacement portions for only the affected meal',()=>{
 const base={meal_portions:[{planned_meal_id:'one',food_id:'rice',quantity:80},{planned_meal_id:'one',food_id:'oil',quantity:5},{planned_meal_id:'two',food_id:'rice',quantity:90}]};
 const next={meal_portions:base.meal_portions.filter(row=>row.food_id!=='oil')};
 assert.deepEqual(createAccountAction(base,next).meal_portions,[{planned_meal_id:'one',food_id:'rice',quantity:80}]);
});

test('contract 2 reads one RPC snapshot and never falls back to a mix of table requests',async()=>{
 const calls=[];const transport=createSupabaseTransport({getUserId:()=> 'one',getClient:()=>({rpc:async name=>{
  calls.push(name);return name==='menuki_state_capabilities'?{data:{planning_contract:1,account_contract:2}}:{data:{accountContract:2,settings:{sync_revision:7},cycles:[]}};
 },from(){throw Error('No separate table reads allowed')}})});
 assert.equal((await transport.fetchSnapshot()).settings.sync_revision,7);assert.deepEqual(calls,['menuki_state_capabilities','get_menuki_state']);
});

function syncHarness(){
 const base={profile:{age:30,height:180},noActiveCycle:true,resetCloudPending:false,movements:[],weights:[],activitySessions:[],done:{},stock:{}};
 const calls={accepted:0,render:0,toasts:[],metadata:0,schedule:0};let meta={baseState:structuredClone(base)};
 const ctx=vm.createContext({state:{...structuredClone(base),profile:{age:31}},currentUserId:'a',authSessionUserId:'a',supabaseClient:{},cloudReady:true,cloudRevision:1,
  cloudSyncInFlight:false,cloudSyncPending:false,cloudSyncTimer:null,pendingAccountRequest:null,pendingSaveFeedback:'Perfil guardado',
  clearTimeout(){},cloudStatus(){},installPlanCatalog(){},materializeCurrentPlans(){},createAccountAction,accountActionIsEmpty,reconcileStates,
  emptyState:()=>structuredClone(base),readCloudMeta:()=>meta,cleanState:value=>value,newCycleInstanceId:()=> 'operation-1',
  buildCloudSnapshot:async value=>({profile:value.profile,weights:(value.weights||[]).map(row=>({measured_on:row.date,weight_kg:row.kg})),cycles:[],planned_meals:[],completions:[],movements:[]}),
  supabaseTransport:{submitAction:async()=>({data:{settings:{sync_revision:2},state:{...base,profile:{age:31}}}})},
  stateFromCloud:data=>structuredClone(data.state),cloneMenus:value=>value,FIXED_MENUS:[],stateFingerprint:async value=>JSON.stringify(value),
  cloudMetaSnapshot:()=>({}),writeCloudMeta:(_r,_f,_s,state)=>{meta={baseState:state};calls.metadata++},localStorage:{setItem(){}},cloudMetaKey:()=> 'meta',
  cloudSyncedStatus(){calls.accepted++},renderCloudUpdates(){calls.render++},showToast:message=>calls.toasts.push(message),scheduleCloudSync(){calls.schedule++},console:{error(){}},
 });
 ctx.reconcileCloudState=async remote=>{ctx.state=reconcileStates(meta.baseState,ctx.state,remote.state);meta={baseState:structuredClone(remote.state)};ctx.cloudRevision=remote.settings.sync_revision};
 vm.runInContext(main.slice(main.indexOf('async function syncAccountAction('),main.indexOf('async function syncCloudNow(')),ctx);
 return {ctx,calls,sync:()=>ctx.syncAccountAction()};
}

test('the real save coordinator says saved only after the server acknowledges',async()=>{
 const app=syncHarness();let release,started;
 const pending=new Promise(resolve=>{release=resolve}),entered=new Promise(resolve=>{started=resolve});
 app.ctx.supabaseTransport.submitAction=()=>{started();return pending};
 const saving=app.sync();await entered;assert.deepEqual(app.calls.toasts,[]);assert.equal(app.calls.accepted,0);
 release({data:{settings:{sync_revision:2},state:{profile:{age:31},noActiveCycle:true}}});assert.equal(await saving,true);
 assert.deepEqual(app.calls.toasts,['Perfil guardado']);assert.equal(app.ctx.cloudRevision,2);
});

test('a network failure keeps the same operation for a safe retry without claiming success',async()=>{
 const app=syncHarness(),requests=[];let count=0;
 app.ctx.supabaseTransport.submitAction=async(action,rev,id)=>{requests.push({action,rev,id});return ++count===1?{error:{code:'NETWORK'}}:{data:{settings:{sync_revision:2},state:{profile:{age:31},noActiveCycle:true}}}};
 assert.equal(await app.sync(),false);assert.equal(app.calls.accepted,0);assert.deepEqual(app.calls.toasts,[]);
 assert.equal(await app.sync(),true);assert.deepEqual(requests[0],requests[1]);assert.equal(app.calls.accepted,1);
});

test('responses from a previous account cannot replace the next account or its metadata',async()=>{
 const app=syncHarness();let release,started;
 const pending=new Promise(resolve=>{release=resolve}),entered=new Promise(resolve=>{started=resolve});app.ctx.supabaseTransport.submitAction=()=>{started();return pending};
 const saving=app.sync();await entered;app.ctx.currentUserId='b';app.ctx.authSessionUserId='b';app.ctx.state={owner:'b'};
 release({data:{state:{profile:{age:31}},settings:{sync_revision:2}}});assert.equal(await saving,false);
 assert.equal(app.ctx.state.owner,'b');assert.equal(app.calls.metadata,0);assert.deepEqual(app.calls.toasts,[]);
});

test('cold opening a contract-2 account reads Supabase even if the old browser copy is corrupt',async()=>{
 const ctx=vm.createContext({currentUserId:'a',authSessionUserId:'a',cloudReady:false,accountStateContract:1,
  cloudStatus(){},supabaseTransport:{planningAvailable:async()=>true,stateContract:()=>2},
  fetchCloudSnapshot:async()=>({settings:{state_initialized_at:'yes'},state:{profile:{age:42}}}),
  adoptCloudState:async remote=>{ctx.state=remote.state},cloudMetaKey:()=> 'meta',
  localStorage:{getItem:()=> 'corrupt browser bytes',setItem(){}},load(){throw Error('Must not use browser state as account')},cloudSyncedStatus(){},
 });
 vm.runInContext(main.slice(main.indexOf('async function initializeCloudState('),main.indexOf('function hasMeaningfulLocalState(')),ctx);
 await ctx.initializeCloudState({id:'a'});assert.equal(ctx.state.profile.age,42);
});

test('the in-memory canonical base includes the ledger and tracking rows without persisting account data',()=>{
 const state={profile:{age:30},weights:[{date:'2026-10-25',kg:80}],movements:[{operationId:'one',foodId:'rice',quantity:10}],activitySessions:[]};
 const ctx=vm.createContext({accountStateContract:2,sessionCloudMeta:null,readCloudMeta:()=>null,persistent:true,
  localStorage:{setItem(){throw Error('No personal data should be persisted')}},createReconciliationBase(){throw Error('Old reduced base must not be used')}});
 vm.runInContext(main.slice(main.indexOf('function writeCloudMeta('),main.indexOf('function reduceCloudSnapshot(')),ctx);
 ctx.writeCloudMeta(7,'fingerprint',null,state,true);assert.equal(ctx.persistent,true);
 assert.equal(JSON.stringify(ctx.sessionCloudMeta.baseState),JSON.stringify(state));
});

test('a tracking edit made during a save remains pending and is sent as a scoped follow-up',async()=>{
 const app=syncHarness();let release,started;
 const pending=new Promise(resolve=>{release=resolve}),entered=new Promise(resolve=>{started=resolve});
 app.ctx.supabaseTransport.submitAction=()=>{started();return pending};
 const saving=app.sync();await entered;app.ctx.state.weights=[{date:'2026-10-25',kg:82}];
 release({data:{settings:{sync_revision:2},state:{profile:{age:31},noActiveCycle:true,weights:[],activitySessions:[],movements:[],done:{},stock:{}}}});
 assert.equal(await saving,true);assert.equal(app.ctx.state.weights[0].kg,82);assert.equal(app.calls.schedule,1);
 let sent;app.ctx.supabaseTransport.submitAction=async action=>{sent=action;return {data:{settings:{sync_revision:3},state:structuredClone(app.ctx.state)}}};
 assert.equal(await app.sync(),true);assert.equal(sent.profile,undefined);assert.equal(sent.weights[0].weight_kg,82);
});

test('a stale same-field edit adopts the accepted remote value without another write or a copy-choice prompt',async()=>{
 const app=syncHarness();let writes=0;
 app.ctx.supabaseTransport.submitAction=async()=>{writes++;return {error:{code:'PT409'}}};
 app.ctx.fetchCloudSnapshot=async()=>({settings:{sync_revision:2},state:{profile:{age:32,height:180},noActiveCycle:true,movements:[],weights:[],activitySessions:[],done:{},stock:{}}});
 assert.equal(await app.sync(),true);assert.equal(writes,1);assert.equal(app.ctx.state.profile.age,32);assert.equal(app.calls.render,1);
});

test('independent edits are rebased as only the still-pending fields',async()=>{
 const app=syncHarness();app.ctx.state.profile.height=185;const sent=[];
 app.ctx.fetchCloudSnapshot=async()=>({settings:{sync_revision:2},state:{profile:{age:32,height:180},noActiveCycle:true,movements:[],weights:[],activitySessions:[],done:{},stock:{}}});
 app.ctx.supabaseTransport.submitAction=async action=>{sent.push(action);return sent.length===1?{error:{code:'PT409'}}:{data:{settings:{sync_revision:3},state:{profile:{age:32,height:185},noActiveCycle:true}}}};
 assert.equal(await app.sync(),true);assert.equal(sent.length,2);assert.equal(sent[1].profile.age,undefined);assert.equal(sent[1].profile.height,185);
});

test('remote refresh preserves a real in-progress profile draft and replaces a merely outdated form',()=>{
 for(const dirty of [false,true]){
  let form={dataset:{userDraft:String(dirty)},elements:[{name:'age',type:'number',value:'99'}],contains:()=>false};
  const ctx=vm.createContext({document:{activeElement:null,getElementById:id=>id==='profileForm'?form:{open:false}},
   render(){form={dataset:{userDraft:'false'},elements:[{name:'age',type:'number',value:'42'}]}},updateProfilePreview(){},renderPlannerReview(){},renderRecipeModal(){}});
  vm.runInContext(main.slice(main.indexOf('function renderCloudUpdates('),main.indexOf('async function refreshCloudState(')),ctx);ctx.renderCloudUpdates();
  assert.equal(form.elements[0].value,dirty?'99':'42');
 }
});
