import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { requiresManualRestingEnergy } from '../js/domain/profile.js';

const source = await readFile(new URL('../js/main.js', import.meta.url), 'utf8');
const start = source.indexOf('function saveProfileForm(');
const end = source.indexOf("\ndocument.addEventListener('submit'", start);
assert.ok(start >= 0 && end > start, 'Profile save handler must remain available for focused regression tests.');
const saveHandler = source.slice(start, end);

function harness({nextProfile, manualRmr = '1600', valid = true} = {}) {
  const original = {sex:'female',age:30,height:165,weight:60,activity:'sedentary',goal:'maintain',manualRmr:1600,
    injury:false,autoPortions:true,followWeight:false};
  const state = {profile:{...original},profileConfirmed:true,cart:{},noActiveCycle:false,start:'2026-10-22'};
  const form = {reportValidity:()=>valid};
  const calls = {save:0,render:0,adapt:0,toasts:[]};
  const values = {sex:'female',age:'30',height:'165',weight:'60',activity:'sedentary',goal:'maintain',manualRmr};
  const context = vm.createContext({
    document:{getElementById:id=>id==='profileForm'?form:null},
    FormData:class {get(key){return values[key]??null}},
    state,requiresManualRestingEnergy,
    profileFormData:()=>({...original,...nextProfile}),
    profileHasChanges:profile=>Object.keys(original).some(key=>profile[key]!==state.profile[key]),
    cycleHasEnded:()=>false,confirm:()=>true,save:()=>calls.save++,render:()=>calls.render++,
    showToast:message=>calls.toasts.push(message),
    adaptActiveMenuForGoalChange:profile=>{calls.adapt++;return {adapted:true,changed:7}},
  });
  vm.runInContext(saveHandler,context);
  return {context,form,state,calls};
}

test('direct profile save action commits edits and adapts the active menu when the goal changes',()=>{
  const {context,form,state,calls}=harness({nextProfile:{goal:'muscle_gain'}});
  assert.equal(context.saveProfileForm(form),true);
  assert.equal(state.profile.goal,'muscle_gain');assert.equal(state.profileConfirmed,true);
  assert.equal(calls.adapt,1);assert.equal(calls.save,1);assert.equal(calls.render,1);
  assert.equal(context.profileHasChanges(state.profile),false);
  assert.match(calls.toasts[0],/menú adaptado: 7 platos pendientes cambiados/);
});

test('a goal change explains when the generator keeps all compatible pending recipes',()=>{
  const setup=harness({nextProfile:{goal:'muscle_gain'}});
  setup.context.adaptActiveMenuForGoalChange=()=>({adapted:true,changed:0});
  assert.equal(setup.context.saveProfileForm(setup.form),true);
  assert.match(setup.calls.toasts[0],/se revisó el menú y se mantienen los platos compatibles/);
});

test('an empty unused manual-energy field does not block saving a formula profile',()=>{
  const {context,form,state,calls}=harness({manualRmr:'',nextProfile:{age:31,manualRmr:1600}});
  assert.equal(context.saveProfileForm(form),true);
  assert.equal(state.profile.age,31);assert.equal(calls.save,1);assert.equal(calls.adapt,0);
});

test('an invalid form keeps profile state unchanged and does not claim a save',()=>{
  const {context,form,state,calls}=harness({valid:false,nextProfile:{age:31}});
  assert.equal(context.saveProfileForm(form),false);
  assert.equal(state.profile.age,30);assert.equal(calls.save,0);assert.equal(calls.render,0);
});

test('a failed menu adaptation is reported without claiming that the menu changed',()=>{
  const setup=harness({nextProfile:{goal:'muscle_gain'}});
  setup.context.adaptActiveMenuForGoalChange=()=>({adapted:false,reason:'error'});
  assert.equal(setup.context.saveProfileForm(setup.form),true);
  assert.equal(setup.state.profile.goal,'muscle_gain');assert.equal(setup.calls.save,1);
  assert.match(setup.calls.toasts[0],/Perfil guardado; no se pudo adaptar el menú.*Se conserva el menú anterior/);
});

test('profile save button uses its explicit delegated action instead of an external form association',()=>{
  assert.match(source,/id="profileSaveButton" type="button" class="btn btn-primary" data-action="profile-save"/);
  assert.match(source,/if\(action==='profile-save'\)\{saveProfileForm\(document\.getElementById\('profileForm'\)\);return\}/);
});
