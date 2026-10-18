import test from 'node:test';
import assert from 'node:assert/strict';
import { saveLocalState, loadLocalState } from '../js/persistence/local-state.js';

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

test('local state saves the current v11 format and persists catalog unit migrations', () => {
  const storage = memoryStorage({ state: JSON.stringify({ v: 9, usage: { kiwi: 85 } }) });
  const migrated = loadLocalState({
    key: 'state',
    getStorage: () => storage,
    emptyState: () => ({ v: 11, usage: {} }),
    cleanState: (raw) => ({ v: 11, usage: { kiwi: raw.usage.kiwi / 90 } }),
  });

  assert.equal(migrated.v, 11);
  assert.equal(migrated.usage.kiwi, 85 / 90);
  assert.deepEqual(JSON.parse(storage.getItem('state')), migrated);

  saveLocalState({ key: 'state', state: migrated, getStorage: () => storage, updateEditedAt: false });
  assert.equal(JSON.parse(storage.getItem('state')).v, 11);
  assert.equal(loadLocalState({
    key: 'state',
    getStorage: () => storage,
    emptyState: () => ({ v: 11 }),
    cleanState: (raw) => raw,
  }).usage.kiwi, 85 / 90);
});
