import test from 'node:test';
import assert from 'node:assert/strict';
import { changeProposalRecipe, proposalAlternatives } from '../js/domain/menu-review.js';
import { createPlanningPreferences } from '../js/domain/planning-preferences.js';
const types=['desayuno','media','comida','tarde','cena'];
const recipes=types.flatMap((type,i)=>[0,1,2,3].map(n=>({id:`r${i}_${n}`,type,time:n===3?null:10+n*10,ingredients:[{id:`food${n}`,rest:1}]})));
function plan(){return {start:'2026-10-26',menus:Array.from({length:3},()=>Array.from({length:7},()=>types.map((_,i)=>`r${i}_0`))),
  locked:Array.from({length:3},()=>Array.from({length:7},()=>Array(5).fill(false))),confirmedAt:'confirmed'};}

test('cycle swaps change the selected weekday across three independent weeks and lock every explicit choice',()=>{
  const p=plan(),before=structuredClone(p);
  const result=changeProposalRecipe(p,{week:0,day:2,slot:2,recipeId:'r2_1'},recipes);
  for(let w=0;w<3;w++){assert.equal(result.plan.menus[w][2][2],'r2_1');assert.equal(result.plan.locked[w][2][2],true);}
  assert.equal(result.changed.length,3);assert.equal(result.plan.confirmedAt,null);
  assert.deepEqual(p,before);assert.equal(result.plan.menus.flat(2).length,105);
  result.plan.menus[0][2][2]='edit';assert.equal(result.plan.menus[1][2][2],'r2_1');
});

test('cycle swaps preserve other weeks locks even when the choice is made from week three',()=>{
  const p=plan();p.locked[0][2][2]=true;p.locked[2][2][2]=true;
  const result=changeProposalRecipe(p,{week:2,day:2,slot:2,recipeId:'r2_2'},recipes);
  assert.equal(result.plan.menus[0][2][2],'r2_0');assert.equal(result.plan.locked[0][2][2],true);
  assert.equal(result.plan.menus[1][2][2],'r2_2');assert.equal(result.plan.menus[2][2][2],'r2_2');
  assert.deepEqual(result.preserved,[{week:0,day:2,slot:2}]);assert.equal(result.changed.length,2);
});

test('single-meal swaps touch one position, preserve all other meals and permit a manual excluded recipe',()=>{
  const p=plan(),before=structuredClone(p);
  const result=changeProposalRecipe(p,{week:1,day:6,slot:4,recipeId:'r4_3',scope:'meal'},recipes);
  assert.equal(result.changed.length,1);assert.equal(result.plan.menus[1][6][4],'r4_3');
  for(let w=0;w<3;w++)for(let d=0;d<7;d++)for(let s=0;s<5;s++)if(w!==1||d!==6||s!==4)assert.equal(result.plan.menus[w][d][s],before.menus[w][d][s]);
});

test('invalid positions, scope and wrong meal types never mutate a proposal',()=>{
  const p=plan(),before=structuredClone(p);
  for(const patch of [{week:3},{day:-1},{slot:5},{scope:'all'},{recipeId:'r0_1'},{recipeId:'missing'}])assert.throws(()=>changeProposalRecipe(p,{week:0,day:0,slot:2,recipeId:'r2_1',...patch},recipes));
  assert.deepEqual(p,before);
});

test('suggested alternatives respect weekday times, exclusions and unknown time, and prioritize explicit favorites',()=>{
  const p=plan(),prefs=createPlanningPreferences();prefs.weekdayTimeLimits.comida=25;prefs.recipePreferences.r2_1='do_not_propose';
  assert.deepEqual(proposalAlternatives({plan:p,week:0,day:0,slot:2,recipes,preferences:prefs}),[]);
  prefs.weekdayTimeLimits.comida=null;prefs.recipePreferences.r2_3='favorite';
  const choices=proposalAlternatives({plan:p,week:0,day:0,slot:2,recipes,preferences:prefs});
  assert.equal(choices[0].id,'r2_3');assert.equal(choices.some(r=>r.id==='r2_1'),false);
});

test('weekend and partial proposal alternatives remain available without fabricating prep times',()=>{
  const p=plan(),prefs=createPlanningPreferences();prefs.weekdayTimeLimits.comida=1;p.menus[0][5][2]=null;
  const choices=proposalAlternatives({plan:p,week:0,day:5,slot:2,recipes,preferences:prefs,limit:5});
  assert.equal(choices.length,4);assert.equal(choices.find(r=>r.id==='r2_3').time,null);
});
