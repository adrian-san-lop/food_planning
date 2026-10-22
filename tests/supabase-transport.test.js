import test from 'node:test';
import assert from 'node:assert/strict';
import { createSupabaseTransport } from '../js/persistence/supabase-transport.js';

test('cloud snapshot does not read the retired shortfalls table', async () => {
  const requestedTables = [];
  const getClient = () => ({
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
