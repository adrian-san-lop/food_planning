import test from 'node:test';
import assert from 'node:assert/strict';
import { createSupabaseTransport } from '../js/persistence/supabase-transport.js';

test('cloud snapshot loads while the optional shortfalls table is not yet in Supabase', async () => {
  const getClient = () => ({
    from(table) {
      const query = {
        select() { return this; },
        eq() { return this; },
        range() {
          return Promise.resolve(table === 'meal_completion_shortfalls'
            ? { data: null, error: { code: 'PGRST205', message: "Could not find the table 'public.meal_completion_shortfalls' in the schema cache" } }
            : { data: [], error: null });
        },
        maybeSingle() { return Promise.resolve({ data: null, error: null }); },
      };
      return query;
    },
  });
  const transport = createSupabaseTransport({ getClient, getUserId: () => 'user-1' });

  const snapshot = await transport.fetchSnapshot();

  assert.equal(snapshot.shortfallsAvailable, false);
  assert.deepEqual(snapshot.shortfalls, []);
  assert.deepEqual(snapshot.movements, []);
  assert.equal(transport.supportsShortfalls(), false);
});

test('cloud snapshot still surfaces unrelated shortfalls read errors', async () => {
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
