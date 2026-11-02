import test from 'node:test';
import assert from 'node:assert/strict';
import { projectPlanningStock } from '../js/domain/planning-stock.js';
import { MENU_SLOT_TYPES } from '../js/domain/menu-generator.js';

const recipes = MENU_SLOT_TYPES.map((type, slot) => ({id: `r_${slot}`, type, ingredients: [{id: 'bread', rest: 1}, {id: 'apple', rest: 0.5}]}));
const menus = Array.from({length: 3}, () => Array.from({length: 7}, () => recipes.map(recipe => recipe.id)));
const convert = (id, amount) => id === 'bread' ? amount * 25 : amount;

test('projected stock uses only pending dates before start, fixed snapshots and real reference-day activity', () => {
  const done = {'2026-10-23#0': {usage: {bread: 1.5, apple: 0.5}}};
  const currentCycle = {start: '2026-10-22', menus, done};
  const input = {stock: {bread: 1000, apple: 10}, asOf: '2026-10-23', start: '2026-10-25', currentCycle};
  const before = structuredClone(input), calls = [];
  const result = projectPlanningStock({...input, recipes, toStockAmount: convert, activityKcalToday: 350,
    evaluateDay(day, activity, fixed) {
      calls.push({activity, fixed: structuredClone(fixed)});
      return {portions: day.map((recipe, slot) => fixed[slot] || {bread: activity ? 2 : 1, apple: 0.5})};
    }});
  assert.equal(result.pendingMeals, 9);
  assert.deepEqual(result.dates, ['2026-10-23', '2026-10-24']);
  assert.deepEqual(calls.map(call => call.activity), [350, 0]);
  assert.deepEqual(calls[0].fixed[0], done['2026-10-23#0'].usage);
  assert.deepEqual(result.stock, {bread: 1000 - (4 * 2 + 5) * 25, apple: 10 - 9 * 0.5});
  assert.deepEqual(input, before);
});

test('projection floors balances, skips completed days and never consumes a previous or later cycle', () => {
  const currentCycle = {start: '2026-10-22', menus, done: Object.fromEntries(recipes.map((_, slot) => [`2026-10-23#${slot}`, {usage: {bread: 1}}]))};
  const options = {stock: {bread: 10, apple: 0}, asOf: '2026-10-23', start: '2027-01-01', currentCycle, recipes, toStockAmount: convert,
    evaluateDay: day => ({portions: day.map(() => ({bread: 1, apple: 0.5}))})};
  const result = projectPlanningStock(options);
  assert.equal(result.pendingMeals, 19 * 5);
  assert.equal(result.dates.length, 19);
  assert.deepEqual(result.stock, {bread: 0, apple: 0});
  for (const start of ['2026-10-23', '2026-10-20']) {
    assert.deepEqual(projectPlanningStock({...options, start}).stock, options.stock);
    assert.equal(projectPlanningStock({...options, start}).pendingMeals, 0);
  }
  assert.equal(projectPlanningStock({...options, currentCycle: null}).pendingMeals, 0);
});

test('projection rejects invalid source data and unit conversions instead of silently treating it as stock', () => {
  const options = {stock: {}, asOf: '2026-10-23', start: '2026-10-24', currentCycle: {start: '2026-10-23', menus}, recipes,
    evaluateDay: day => ({portions: day.map(() => ({bread: 1}))}), toStockAmount: convert};
  for (const patch of [{asOf: '2026-02-30'}, {start: ''}, {stock: {bread: NaN}}, {activityKcalToday: -1},
    {currentCycle: {start: '2026-10-23', menus: []}}, {toStockAmount: () => NaN}]) {
    assert.throws(() => projectPlanningStock({...options, ...patch}), TypeError);
  }
});
