import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlannerReviewView } from '../js/ui/planner-review.js';
import { recipePreferenceControls, planningPreferencesMarkup, timeLimitsPatch } from '../js/ui/planning-preferences.js';
import { createPlanningPreferences } from '../js/domain/planning-preferences.js';
const types=['desayuno','media','comida','tarde','cena'];
const recipes=types.flatMap((type,i)=>[0,1].map(n=>({id:`r${i}_${n}`,name:`Receta <${i}> ${n}`,type,time:20,ingredients:[{id:'rice',rest:1}]})));
function model(){return {proposal:{start:'2026-10-26',catalogVersion:'test',menus:Array.from({length:3},()=>Array.from({length:7},()=>types.map((_,i)=>`r${i}_0`))),locked:Array.from({length:3},()=>Array.from({length:7},()=>Array(5).fill(false)))},
  week:0,scope:'cycle',preferences:createPlanningPreferences(),inspection:{complete:true,issues:[],warnings:[]},summary:{preparations:5,weeklyExceptions:0},profile:{goal:'maintain',injury:false}};}
const view=createPlannerReviewView({getRecipes:()=>recipes,portionsForRecipes:()=>Array(5).fill({rice:1}),getMacro:()=>({k:300}),getTarget:()=>({calories:1600}),formatDate:()=> '26 oct'});

test('daily review renders five editable meals with three weeks and seven selectable days',()=>{
  const html=view.markup(model());assert.equal((html.match(/data-review-meal=/g)||[]).length,5);
  assert.match(html,/data-action="planner-week" data-week="2"/);
  assert.equal((html.match(/data-action="planner-day"/g)||[]).length,7);
  assert.match(html,/data-action="planner-choices-open"/);
  assert.doesNotMatch(html,/name="planner-scope"/);assert.match(html,/diferencia −100 kcal/);
  assert.doesNotMatch(html,/Receta <0>/);assert.match(html,/Receta &lt;0&gt;/);
  assert.match(html,/data-action="planner-regenerate"/);assert.match(html,/Generar otra propuesta/);
});

test('manual exceptions stay explicit and incomplete reviews cannot confirm or compute partial-day portions',()=>{
  const m=model();m.proposal.menus[1][0][2]=null;m.week=1;m.summary=null;m.hasSavedDraft=true;
  m.inspection={complete:false,issues:[{week:1,day:0,slot:2,code:'no_automatic_candidate',timeLimit:5}],warnings:[{week:1,day:1,slot:2,code:'not_proposed'}]};
  const html=view.markup(m);assert.match(html,/data-action="planner-save"[^>]*disabled/);
  assert.match(html,/máximo de 5 min/);assert.match(html,/borrador completo anterior/);
  assert.match(html,/Se calculará al completar el día/);
  m.day=1;assert.match(view.markup(m),/Elección manual: Marcada como No proponer/);
});

test('recipe controls expose a favorite toggle, secondary menu and explicit exclusion badge',()=>{
  const prefs=createPlanningPreferences();prefs.recipePreferences.r0_0='do_not_propose';
  const html=recipePreferenceControls('r0_0',prefs,true);
  assert.match(html,/data-preference="favorite"/);assert.match(html,/aria-pressed="false"/);
  assert.match(html,/data-action="recipe-preference-more"/);assert.match(html,/No proponer<\/span>/);
  assert.doesNotMatch(html,/>Normal<\/button>/);
  assert.equal((recipePreferenceControls('r0_0',prefs,false).match(/disabled/g)||[]).length,2);
});

test('preference dialog keeps optional separate limits and only patches edited values',()=>{
  const prefs=createPlanningPreferences();prefs.recipePreferences.r0_0='favorite';prefs.weekdayTimeLimits.comida=25;
  const html=planningPreferencesMarkup(prefs,recipes,true);
  assert.match(html,/id="planningPreferencesForm"/);assert.match(html,/name="comida"[^>]*value="25"/);
  assert.match(html,/Quitar de favoritas/);assert.match(html,/Receta &lt;0&gt;/);
  assert.deepEqual(timeLimitsPatch({comida:'30',cena:''},prefs.weekdayTimeLimits),{weekdayTimeLimits:{comida:30}});
  assert.deepEqual(timeLimitsPatch({comida:'',cena:'20'},prefs.weekdayTimeLimits),{weekdayTimeLimits:{comida:null,cena:20}});
  for(const v of ['0','1.5','1441','bad'])assert.throws(()=>timeLimitsPatch({comida:v,cena:''},prefs.weekdayTimeLimits));
});
