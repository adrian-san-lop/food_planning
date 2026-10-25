import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const main=await readFile(new URL('../js/main.js',import.meta.url),'utf8');
const syncSource=main.slice(main.indexOf('async function syncCloudNow('),main.indexOf('function newOperationId('));
const refreshSource=main.slice(main.indexOf('async function refreshCloudState('),main.indexOf("document.addEventListener('visibilitychange'"));
function harness() {
  const calls={render:0,schedule:0,saved:0,accepted:0,errors:0,metadata:0};
  const context=vm.createContext({state:{profile:null,noActiveCycle:true,resetCloudPending:false,deletedWeightDates:[],deletedActivitySessionIds:[]},
    accountStateContract:1,pendingSaveFeedback:null,currentUserId:'user-a',authSessionUserId:'user-a',supabaseClient:{},cloudReady:true,cloudRevision:0,
    cloudSyncInFlight:false,cloudSyncPending:false,cloudSyncTimer:null,cloudSyncLastError:null,
    clearTimeout(){},cloudStatus(){},cloudSyncedStatus(){calls.accepted++},cloudErrorForUser:e=>e.message,
    readCloudMeta:()=>({}),stateFingerprint:async value=>JSON.stringify(value),
    buildCloudSnapshot:async value=>({cycles:value.noActiveCycle?[]:[{id:'cycle-one',status:'active'}],movements:[],completions:[]}),
    reduceCloudSnapshot:value=>value,supabaseTransport:{submitSnapshot:async()=>({data:1})},
    fetchCloudSnapshot:async()=>({settings:{sync_revision:1},state:{profile:{age:30},noActiveCycle:false,activeCycleId:'cycle-one'}}),
    stateFromCloud:remote=>remote.state,cloneMenus:value=>value,FIXED_MENUS:[],
    cloudMetaSnapshot:()=>({}),writeCloudMeta(){calls.metadata++},saveLocalOnly(){calls.saved++},scheduleCloudSync(){calls.schedule++},
    renderCloudUpdates(){calls.render++},document:{getElementById:()=>({})},console:{error(){calls.errors++}}});
  context.reconcileCloudState=async remote=>{context.state=structuredClone(remote.state)};
  vm.runInContext(syncSource,context);
  Object.assign(context,{cloudRefreshInFlight:false,lastCloudRefreshAt:0});vm.runInContext(refreshSource,context);
  return {context,calls,sync:()=>context.syncCloudNow(true)};
}

test('a stale-write rebase refreshes the visible setup/plan after the new revision is accepted',async()=>{
  const app=harness();let requests=0;
  app.context.supabaseTransport.submitSnapshot=async()=>++requests===1?{error:{code:'PT409'}}:{data:2};
  assert.equal(await app.sync(),true);assert.equal(requests,2);
  assert.equal(app.context.state.activeCycleId,'cycle-one');assert.equal(app.calls.render,1);
});

test('an ordinary acknowledgement leaves an actively edited form in place',async()=>{
  const app=harness();assert.equal(await app.sync(),true);assert.equal(app.calls.render,0);assert.equal(app.calls.accepted,1);
});

test('an old account response cannot acknowledge, rewrite or advance the next account',async()=>{
  const app=harness();let release,entered;
  const pending=new Promise(resolve=>{release=resolve}),started=new Promise(resolve=>{entered=resolve});
  app.context.supabaseTransport.submitSnapshot=()=>{entered();return pending};
  const sync=app.sync();await started;
  app.context.currentUserId='user-b';app.context.authSessionUserId='user-b';app.context.state={owner:'b'};
  app.context.cloudRevision=100;app.context.cloudSyncPending=true;
  release({data:1});assert.equal(await sync,false);
  assert.equal(app.context.cloudRevision,100);assert.equal(app.context.state.owner,'b');
  assert.equal(app.calls.accepted,0);assert.equal(app.calls.saved,0);assert.equal(app.calls.schedule,1);
});

test('switching accounts while building a snapshot prevents dispatching the old personal payload',async()=>{
  const app=harness();let release,entered,requests=0;
  const pending=new Promise(resolve=>{release=resolve}),started=new Promise(resolve=>{entered=resolve});
  app.context.buildCloudSnapshot=()=>{entered();return pending};
  app.context.supabaseTransport.submitSnapshot=async()=>{requests++;return {data:1}};
  const sync=app.sync();await started;app.context.currentUserId='user-b';app.context.authSessionUserId='user-b';
  release({cycles:[],movements:[],completions:[]});assert.equal(await sync,false);assert.equal(requests,0);
});

test('a stale reset cannot write metadata after the account changes while fingerprinting',async()=>{
  const app=harness();let release,entered;
  app.context.state.resetCloudPending=true;
  const pending=new Promise(resolve=>{release=resolve}),started=new Promise(resolve=>{entered=resolve});
  app.context.supabaseTransport.submitSnapshot=async()=>({error:{code:'PT409'}});
  app.context.stateFingerprint=()=>{entered();return pending};
  const sync=app.sync();await started;app.context.currentUserId='user-b';app.context.authSessionUserId='user-b';
  release('old-fingerprint');assert.equal(await sync,false);assert.equal(app.calls.metadata,0);
});

test('a remote poll from the previous account cannot inspect or render the next account',async()=>{
  const app=harness();let release;
  const pending=new Promise(resolve=>{release=resolve});app.context.supabaseTransport.readOne=()=>pending;
  const refresh=app.context.refreshCloudState(true);app.context.currentUserId='user-b';app.context.authSessionUserId='user-b';
  app.context.state=undefined;release({sync_revision:2});assert.equal(await refresh,false);
  assert.equal(app.calls.errors,0);assert.equal(app.calls.render,0);assert.equal(app.calls.accepted,0);
});

test('a rejected poll from the previous account does not mark the current session as failed',async()=>{
  const app=harness();let reject;
  const pending=new Promise((_,r)=>{reject=r});app.context.supabaseTransport.readOne=()=>pending;
  const refresh=app.context.refreshCloudState(true);app.context.currentUserId='user-b';app.context.authSessionUserId='user-b';
  reject(Object.assign(new Error('Previous account'),{code:'ACCOUNT_CHANGED'}));assert.equal(await refresh,false);
  assert.equal(app.calls.errors,0);assert.equal(app.context.cloudSyncLastError,null);
});
