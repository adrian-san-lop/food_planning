import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlanningPreferencesController } from '../js/ui/planning-preferences-controller.js';
import { createPlanningPreferences } from '../js/domain/planning-preferences.js';

function harness(available=true) {
  const state={planningPreferences:createPlanningPreferences(),activeMenus:[[['old']]],stock:{rice:20},done:{meal:{usage:{rice:10}}},plannerDraft:{id:'keep'}};
  const calls={save:0,change:0,notifications:[]};
  const dialog={open:false,addEventListener(){},showModal(){this.open=true},close(){this.open=false}};
  const content={innerHTML:''};
  const document={addEventListener(){},getElementById:id=>id==='planningPreferencesDialog'?dialog:id==='planningPreferencesContent'?content:null};
  const controller=createPlanningPreferencesController({document,getState:()=>state,getRecipes:()=>[{id:'recipe_one',name:'Plato uno'}],isAvailable:()=>available,
    save:()=>calls.save++,onChange:()=>calls.change++,notify:value=>calls.notifications.push(value)});
  return {state,calls,controller,dialog,content};
}

test('recipe preference actions persist explicit choices while active plans, pantry, history and drafts stay untouched',()=>{
  const app=harness(),original=structuredClone(app.state);
  app.controller.setRecipe('recipe_one','favorite');
  assert.equal(app.state.planningPreferences.recipePreferences.recipe_one,'favorite');
  assert.equal(app.calls.save,1);assert.equal(app.calls.change,1);
  for(const key of ['activeMenus','stock','done','plannerDraft'])assert.deepEqual(app.state[key],original[key]);
  app.controller.setRecipe('recipe_one','normal');assert.equal(app.state.planningPreferences.recipePreferences.recipe_one,'normal');
  assert.equal(app.calls.save,2);
  app.controller.setRecipe('recipe_one','normal');assert.equal(app.calls.save,2);
});

test('an unavailable schema or invalid recipe/preference cannot create unpersistable personal changes',()=>{
  const unsupported=harness(false),before=structuredClone(unsupported.state);
  unsupported.controller.setRecipe('recipe_one','favorite');assert.deepEqual(unsupported.state,before);assert.equal(unsupported.calls.save,0);
  const app=harness();app.controller.setRecipe('unknown','favorite');app.controller.setRecipe('recipe_one','invalid');
  assert.deepEqual(app.state.planningPreferences,createPlanningPreferences());assert.equal(app.calls.save,0);
});

test('opening or cancelling preferences is a view action with no state writes',()=>{
  const app=harness();app.controller.open(null);assert.equal(app.dialog.open,true);assert.match(app.content.innerHTML,/Guardar preferencias/);
  app.controller.close();assert.equal(app.dialog.open,false);assert.equal(app.calls.save,0);
});
