import test from 'node:test';
import assert from 'node:assert/strict';
import { createInventoryLedger } from '../js/domain/inventory-ledger.js';

function makeLedger() {
  const state = { stock: {}, movements: [] };
  let id = 0;
  const ledger = createInventoryLedger({
    getState: () => state,
    hasFood: (foodId) => ['apple', 'rice'].includes(foodId),
    roundAmount: (value) => Math.round(Number(value || 0) * 100) / 100,
    newOperationId: () => `generated:${++id}`,
    now: () => '2026-10-17T10:00:00.000Z',
  });
  return { state, ...ledger };
}

test('inventory ledger consumes only available stock and keeps the balance at zero', () => {
  const { state, applyMovement } = makeLedger();
  assert.equal(applyMovement({ operationId: 'purchase:1', foodId: 'apple', quantity: 2, kind: 'purchase' }), true);
  assert.equal(applyMovement({ operationId: 'meal:1:apple', foodId: 'apple', quantity: -3, kind: 'meal' }), true);
  assert.equal(state.movements[1].quantity, -2);
  assert.deepEqual(state.stock, {});
  assert.equal(applyMovement({ operationId: 'meal:1:apple', foodId: 'apple', quantity: -2, kind: 'meal' }), false);
  assert.equal(state.movements.length, 2);
});

test('inventory ledger applies idempotent reversal movements and rejects unknown foods', () => {
  const { state, applyMovement, setInventoryBalance } = makeLedger();
  setInventoryBalance('rice', 5);
  applyMovement({ operationId: 'meal:2:rice', foodId: 'rice', quantity: -3, kind: 'meal' });
  const reversal = { operationId: 'revert:meal:2:rice', foodId: 'rice', quantity: 3, kind: 'meal_reversal' };
  assert.equal(applyMovement(reversal), true);
  assert.equal(applyMovement(reversal), false);
  assert.equal(applyMovement({ operationId: 'bad', foodId: 'missing', quantity: 4 }), false);
  assert.equal(state.stock.rice, 5);
  assert.equal(state.movements.length, 3);
});

