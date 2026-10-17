import test from 'node:test';
import assert from 'node:assert/strict';
import { scaleBreadSlices } from '../js/domain/recipe-portions.js';

test('bread portions stay in whole slices and never exceed two slices per meal', () => {
  assert.equal(scaleBreadSlices(2.5, 1), 2);
  assert.equal(scaleBreadSlices(2, 1.6), 2);
  assert.equal(scaleBreadSlices(1, 0.6), 1);
});
