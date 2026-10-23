import test from 'node:test';
import assert from 'node:assert/strict';
import { createSupabaseTransport } from '../js/persistence/supabase-transport.js';

test('a capability response from a previous account is discarded and cannot authorize the next account',async()=>{
  let user='a',release;
  const pending=new Promise(resolve=>{release=resolve});
  const transport=createSupabaseTransport({getUserId:()=>user,getClient:()=>({rpc:()=>pending})});
  const checking=transport.planningAvailable();user='b';release({data:{planning_contract:1}});
  await assert.rejects(checking,{code:'ACCOUNT_CHANGED'});
});

test('changing accounts during capability detection never dispatches the old snapshot',async()=>{
  let user='a',release,writes=0;
  const pending=new Promise(resolve=>{release=resolve});
  const transport=createSupabaseTransport({getUserId:()=>user,getClient:()=>({rpc:name=>{
    if(name==='menuki_state_capabilities')return pending;writes++;return {data:1};
  }})});
  const writing=transport.submitSnapshot('sync_menuki_state',{},0);user='b';release({data:{planning_contract:1}});
  await assert.rejects(writing,{code:'ACCOUNT_CHANGED'});assert.equal(writes,0);
});

test('cloud snapshot does not read the retired shortfalls table', async () => {
  const requestedTables = [];
  const getClient = () => ({
    rpc: async () => ({data: null, error: {code: 'PGRST202'}}),
    from(table) {
      requestedTables.push(table);
      const query = {
        select() { return this; },
        eq() { return this; },
        range() {
          return Promise.resolve({ data: [], error: null });
        },
        maybeSingle() { return Promise.resolve({ data: null, error: null }); },
      };
      return query;
    },
  });
  const transport = createSupabaseTransport({ getClient, getUserId: () => 'user-1' });

  const snapshot = await transport.fetchSnapshot();

  assert.equal(requestedTables.includes('meal_completion_shortfalls'), false);
  assert.deepEqual(snapshot.movements, []);
  assert.equal(Object.hasOwn(snapshot, 'shortfalls'), false);
});

test('cloud snapshot still surfaces unrelated table read errors', async () => {
  const getClient = () => ({
    rpc: async () => ({data: null, error: {code: 'PGRST202'}}),
    from() {
      return {
        select() { return this; },
        eq() { return this; },
        range() { return Promise.resolve({ data: null, error: { code: '42501', message: 'permission denied' } }); },
        maybeSingle() { return Promise.resolve({ data: null, error: null }); },
      };
    },
  });
  const transport = createSupabaseTransport({ getClient, getUserId: () => 'user-1' });

  await assert.rejects(transport.fetchSnapshot(), { code: '42501' });
});
