import test from 'node:test';
import assert from 'node:assert/strict';
import { initialPlanningState, initializeAccountState, planningRows } from '../js/persistence/planning-state.js';
import { createSupabaseTransport } from '../js/persistence/supabase-transport.js';

function backend({available=false,error=null,tableError=null}={}) {
  const queries=[],writes=[];let calls=0;
  const client={rpc:async(name,args)=>{
    if(name==='menuki_state_capabilities'){calls++;return error?{error}:available?{data:{planning_contract:1}}:{error:{code:'PGRST202'}};}
    writes.push({name,...args});return {data:1};
  },from(table){const q={table};queries.push(q);return {
    select(){return this},eq(key,value){q[key]=value;return this},
    range(from,to){q.range=[from,to];return Promise.resolve({data:[],error:tableError})},
    maybeSingle(){return Promise.resolve({data:null,error:tableError})},
  }}};
  return {transport:createSupabaseTransport({getClient:()=>client,getUserId:()=> 'user-a'}),queries,writes,calls:()=>calls};
}

test('without the migration the account loads using only existing tables and can still sync its legacy snapshot',async()=>{
  const {transport,queries,writes}=backend();const result=await transport.fetchSnapshot();
  assert.equal(result.planningSupported,false);
  assert.equal(queries.some(q=>['profile_setup_drafts','menu_preferences','recipe_preferences'].includes(q.table)),false);
  const source={...planningRows(initialPlanningState()),cycles:[]};
  await transport.submitSnapshot('sync_menuki_state',source,5);
  assert.deepEqual(writes[0].p_snapshot,{cycles:[]});assert.equal(writes[0].p_expected_revision,5);
  assert.equal(source.planning_contract,1);
});

test('unsupported planning writes fail explicitly without being acknowledged by an old writer',async()=>{
  const {transport,writes}=backend();const planning=initialPlanningState();planning.planningPreferences.recipePreferences.recipe='favorite';
  await assert.rejects(transport.submitSnapshot('sync_menuki_state',planningRows(planning),0),{code:'PLANNING_SCHEMA_REQUIRED'});
  assert.equal(writes.length,0);
});

test('supported planning rows use account filters and the same transactional revision-checked RPC',async()=>{
  const {transport,queries,writes}=backend({available:true});const result=await transport.fetchSnapshot();
  assert.equal(result.planningSupported,true);
  for (const name of ['profile_setup_drafts','menu_preferences','recipe_preferences'])assert.equal(queries.find(q=>q.table===name)?.user_id,'user-a');
  const payload=planningRows(initialPlanningState());await transport.submitSnapshot('sync_menuki_state',payload,8);
  assert.deepEqual(writes[0].p_snapshot,payload);assert.equal(writes[0].p_expected_revision,8);
});

test('capability cache is refreshed on request and does not survive account reset',async()=>{
  const {transport,calls}=backend({available:true});await transport.planningAvailable();await transport.planningAvailable();assert.equal(calls(),1);
  await transport.planningAvailable({refresh:true});assert.equal(calls(),2);
  transport.resetCapabilities();await transport.planningAvailable();assert.equal(calls(),3);
});

test('permission/network and new-table errors cannot be mistaken for an absent migration',async()=>{
  for (const code of ['42501','PGRST301','NETWORK_ERROR']) {
    await assert.rejects(backend({error:{code}}).transport.fetchSnapshot(),{code});
  }
  await assert.rejects(backend({available:true,tableError:{code:'42P01'}}).transport.fetchSnapshot(),{code:'42P01'});
});

test('guided initialization prepares empty personal fields while legacy activation and existing data stay intact',()=>{
  const localState={profile:{sex:'manual',age:30},noActiveCycle:false,activeMenus:null,...initialPlanningState()};
  assert.equal(initializeAccountState({localState,hasLocalCopy:true,guidedSetup:true}),localState);
  assert.equal(initializeAccountState({localState,hasLocalCopy:false}),localState);
  const guided=initializeAccountState({localState,hasLocalCopy:false,guidedSetup:true,todayISO:'2026-10-23'});
  assert.equal(guided.profile,null);assert.equal(guided.noActiveCycle,true);assert.equal(guided.setupMode,'guided');
  assert.equal(guided.start,'2026-10-23');assert.equal(guided.setupDraft.profile.age,null);
  assert.equal(localState.profile.age,30);
});

function changingRevisionBackend(continuous = false) {
  let reads=0;
  const client={rpc:async()=>({data:{planning_contract:1}}),from:table=>({select(){return this},eq(){return this},
    range:async()=>({data:[]}),maybeSingle:async()=>({data:table==='user_settings'
      ?{sync_revision:continuous?++reads:++reads===1?1:2,state_initialized_at:'2026-10-23T12:00:00Z'}:null}),
  })};
  return createSupabaseTransport({getClient:()=>client,getUserId:()=> 'user-a'});
}

test('snapshot reads retry if another device commits while the relational tables are being read',async()=>{
  const result=await changingRevisionBackend().fetchSnapshot();
  assert.equal(result.settings.sync_revision,2);assert.equal(result.planningSupported,true);
});

test('continual revision changes stop after bounded retries without returning mixed account data',async()=>{
  await assert.rejects(changingRevisionBackend(true).fetchSnapshot(),{code:'CLOUD_SNAPSHOT_BUSY'});
});
