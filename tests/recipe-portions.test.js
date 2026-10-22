import test from 'node:test';
import assert from 'node:assert/strict';
import { scaleBreadSlices, validPortionRule, scalePortion } from '../js/domain/recipe-portions.js';

test('bread portions stay in whole slices and never exceed two slices per meal', () => {
  assert.equal(scaleBreadSlices(2.5, 1), 2);
  assert.equal(scaleBreadSlices(2, 1.6), 2);
  assert.equal(scaleBreadSlices(1, 0.6), 1);
});

test('practical scaling snaps within absolute bounds without erasing small ingredients', () => {
  const rice = { group: 'carb', min: 30, max: 120, step: 10 };
  assert.equal(scalePortion(65, 1, rice), 70);
  assert.equal(scalePortion(65, 100, rice), 120);
  assert.equal(scalePortion(65, 0, rice), 30);
  assert.equal(scalePortion(0.5, 10, { group: 'fixed', min: 0.5, max: 2, step: 0.5 }), 0.5);
  assert.equal(scalePortion(1e-9, 1, { group: 'fat', min: 1e-9, max: 2e-9, step: 1e-9 }), 1e-9);
  for (const value of [NaN, Infinity, -1]) assert.throws(() => scalePortion(65, value, rice), TypeError);
  assert.equal(validPortionRule({ ...rice, max: 115 }), false);
  assert.throws(() => scalePortion(65, 1, { ...rice, step: 0 }), TypeError);
});
