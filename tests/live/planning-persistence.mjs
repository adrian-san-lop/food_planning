// Explicit, opt-in integration test against the configured Supabase project.
// Uses two newly created, tagged test identities. Never accepts a personal login.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { httpClient } from './supabase-client.mjs';
import { initialPlanningState, planningRows } from '../../js/persistence/planning-state.js';
import { createSupabaseTransport } from '../../js/persistence/supabase-transport.js';

const project = 'vkcedxvnmbmrmwvanznx';
export async function prepareLiveRun({ resumeDirectory = null } = {}) {
  const main = await readFile(new URL('../../js/main.js', import.meta.url), 'utf8');
  const url = main.match(/const SUPABASE_URL='([^']+)'/)[1];
  const key = main.match(/const SUPABASE_PUBLISHABLE_KEY='([^']+)'/)[1];
  assert.equal(new URL(url).hostname, project + '.supabase.co');
  assert.match(key, /^sb_publishable_/);
  const anonymous = httpClient({url,key}), settings = await anonymous.request('/auth/v1/settings');
  assert.equal(settings.error,null);assert.equal(settings.data.mailer_autoconfirm,true,'Do not create accounts if signup sends confirmation emails.');
  const previous = resumeDirectory ? JSON.parse(await readFile(join(resumeDirectory,'session.json'),'utf8')) : null;
  const report = resumeDirectory ? JSON.parse(await readFile(join(resumeDirectory,'results.json'),'utf8')) : null;
  if(previous){assert.equal(previous.url,url);assert.equal(previous.runId,report.runId);}
  const runId = previous?.runId || new Date().toISOString().replace(/\D/g,'').slice(0,14) + '-' + randomBytes(3).toString('hex');
  const directory = resumeDirectory || await mkdtemp(join(tmpdir(),'menuki-package7-'));
  const run = {runId,project,url,key,directory,accounts:previous?.accounts || [],checks:report?.checks || [],startedAt:report?.startedAt || new Date().toISOString(),observations:report?.observations || {}};
  if(previous)for(const account of run.accounts){
    const identity=assertSuccess(await httpClient({...run,token:account.token}).request('/auth/v1/user'));
    assert.equal(identity.id,account.id);assert.equal(identity.user_metadata?.menuki_test_run,runId);
    assert.ok(account.email.startsWith('menuki.qa.'+runId+'.'));
  }
  const checkpoint = async () => {
    // Credentials only in a private, temporary OS folder, never in served/Git files or logs.
    await writeFile(join(directory,'session.json'),JSON.stringify({runId,url,key,accounts:run.accounts}),{mode:0o600});
    await writeFile(join(directory,'results.json'),JSON.stringify({runId,project,startedAt:run.startedAt,accounts:run.accounts.map(({id,email})=>({id,email})),checks:run.checks,observations:run.observations},null,2));
    if (run.accounts.length) await writeFile(join(directory,'cleanup-auth.sql'),cleanupSQL(run));
  };
  run.checkpoint=checkpoint;
  run.createAccounts=async confirmation => {
    assert.equal(confirmation,project,'Explicit project confirmation is required.');
    assert.equal(run.accounts.length,0,'Never silently create a replacement pair on retry.');
    for (const suffix of ['a','b']) {
      const email=`menuki.qa.${runId}.${suffix}@example.com`,password=randomBytes(8).toString('hex')+'A1!';
      const result=await anonymous.request('/auth/v1/signup',{method:'POST',body:{email,password,data:{menuki_test_run:runId,menuki_test_suite:'planning-persistence'}}});
      assert.equal(result.error,null,'Test signup failed: '+result.error?.code);
      assert.ok(result.data.access_token && result.data.user?.id,'Signup did not return a confirmed authenticated session.');
      run.accounts.push({id:result.data.user.id,email,password,token:result.data.access_token});await checkpoint();
    }
  };
  run.check=async(name,action)=>{
    try { await action();run.checks.push({name,passed:true,at:new Date().toISOString()}); }
    catch (error) {run.checks.push({name,passed:false,at:new Date().toISOString(),message:error.message.slice(0,350)});await checkpoint();throw error;}
    await checkpoint();
  };
  await checkpoint();return run;
}

function cleanupSQL(run) {
  const ids=run.accounts.map(({id})=>`'${id}'::uuid`).join(',');
  // The exact run tag, account IDs and reserved test-email prefix must all match.
  return `-- Only the ${run.accounts.length} accounts created by this test run. Review and execute as project owner.\nbegin;\ndelete from auth.users u\nwhere u.id in (${ids})\n  and u.email like 'menuki.qa.${run.runId}.%@example.com'\n  and u.raw_user_meta_data ->> 'menuki_test_run' = '${run.runId}'\n  and not exists (select 1 from public.menuki_admins a where a.user_id = u.id);\ncommit;\n`;
}

const tables=['profiles','user_settings','profile_setup_drafts','menu_preferences','recipe_preferences','plan_cycles','planned_meals',
  'meal_completions','meal_completion_ingredients','inventory_movements','weight_logs','activity_sessions','training_logs','prep_tasks','shopping_sessions','shopping_session_items'];
const profile={sex:'male',age:32,height_cm:180,reference_weight_kg:80,activity_level:'light',goal:'maintain',
  injury_recovery:false,auto_portions:true,follow_weight:false,manual_rmr_kcal:null,profile_confirmed:true};
function snapshot() { return {...planningRows(initialPlanningState('guided')),profile:null,cycles:[],planned_meals:[],completions:[],movements:[],prep_tasks:[],
  shopping:{id:randomUUID(),starts_on:'2026-10-23',ends_on:'2026-11-12',items:[]}}; }
function assertSuccess(result) { assert.equal(result.error,null,result.error?.code+': '+result.error?.message);return result.data; }
function transportFor(run,account) {
  const client=httpClient({...run,token:account.token});
  return {client,transport:createSupabaseTransport({getClient:()=>client,getUserId:()=>account.id})};
}
export async function runLiveChecks(run) {
  assert.equal(run.accounts.length,2);
  const [a,b]=run.accounts,one=transportFor(run,a),two=transportFor(run,b),anon=httpClient(run);
  let revisionA=Number((await one.transport.readOne('user_settings'))?.sync_revision || 0),revisionB=Number((await two.transport.readOne('user_settings'))?.sync_revision || 0);const payload=snapshot(),other=snapshot();
  const sync=async(value,revision,side=one)=>assertSuccess(await side.transport.submitSnapshot('sync_menuki_state',value,revision));
  await run.check('two real Auth sessions and planning capability are available',async()=>{
    for(const side of [one,two])assert.equal(await side.transport.planningAvailable(),true);
    assert.notEqual(a.id,b.id);
    for(const side of [one,two]) {
      const data=await side.transport.fetchSnapshot();assert.equal(data.profile,null);assert.equal(data.cycles.length,0);
      assert.equal(data.movements.length,0);assert.equal(data.weights.length,0);assert.equal(data.activities.length,0);
    }
  });
  await run.check('anonymous clients cannot read private tables or execute planning RPC',async()=>{
    for(const table of tables) {
      const result=await anon.request(`/rest/v1/${table}?select=user_id&limit=1`);
      assert.ok(result.error || Array.isArray(result.data)&&result.data.length===0,table+' exposed rows');
    }
    assert.ok((await anon.rpc('menuki_state_capabilities',{})).error);
    assert.ok((await anon.rpc('sync_menuki_state',{p_snapshot:payload,p_expected_revision:0})).error);
  });
  await run.check('partial guided input is saved without an example profile or automatic cycle',async()=>{
    payload.setup_draft.age=32;payload.setup_draft.height_cm=180;payload.recipe_preferences=[{recipe_id:'yogur_platano',preference:'favorite'}];
    payload.menu_preferences.weekday_lunch_max_minutes=30;
    revisionA=Number(await sync(payload,revisionA));
    const saved=await one.transport.fetchSnapshot();assert.equal(saved.profile,null);assert.equal(saved.cycles.length,0);assert.equal(saved.setupDraft.age,32);
    assert.equal(saved.menuPreferences.weekday_lunch_max_minutes,30);assert.equal(saved.recipePreferences[0].preference,'favorite');
  });
  await run.check('same account can recover progress through a second real password session',async()=>{
    const result=await anon.request('/auth/v1/token?grant_type=password',{method:'POST',body:{email:a.email,password:a.password}});
    const session=assertSuccess(result);assert.equal(session.user.id,a.id);assert.ok(session.access_token);
    run.secondSession={...a,token:session.access_token};
    const second=transportFor(run,run.secondSession);const saved=await second.transport.fetchSnapshot();
    assert.equal(saved.setupDraft.age,32);assert.equal(saved.recipePreferences[0].preference,'favorite');
  });
  await run.check('stale sync returns HTTP 409/PT409 and leaves the accepted revision intact',async()=>{
    const stale=structuredClone(payload);stale.setup_draft.age=50;
    const result=await one.transport.submitSnapshot('sync_menuki_state',stale,0);
    assert.equal(result.status,409);assert.equal(result.error?.code,'PT409');
    assert.equal((await one.transport.fetchSnapshot()).setupDraft.age,32);
  });
  await run.check('invalid profile and first plan are rejected transactionally',async()=>{
    const bad=structuredClone(payload);bad.profile={...profile,age:12};bad.setup_draft.age=50;
    assert.ok((await one.transport.submitSnapshot('sync_menuki_state',bad,revisionA)).error);
    assert.equal((await one.transport.fetchSnapshot()).setupDraft.age,32);
  });
  const raw=JSON.parse(await readFile(new URL('../../data/recipes.json',import.meta.url),'utf8'));
  const picks=['desayuno','media','comida','tarde','cena'].map(type=>raw.recipes.find(recipe=>recipe.mealType===type).id);
  const cycleId=randomUUID();payload.profile={...profile};payload.setup_draft.preferences_reviewed=true;payload.setup_draft.start_date='2026-10-23';
  payload.cycles=[{id:cycleId,start_date:'2026-10-23',status:'active',catalog_version:raw.catalogVersion,generated_at:new Date().toISOString(),confirmed_at:new Date().toISOString(),recovery_focus:false}];
  payload.planned_meals=Array.from({length:21},(_,day)=>Array.from({length:5},(_,slot)=>({id:randomUUID(),cycle_id:cycleId,
    meal_date:new Date(Date.UTC(2026,9,23+day)).toISOString().slice(0,10),slot,recipe_id:picks[slot],is_locked:false}))).flat();
  await run.check('a first plan cannot be accepted without a confirmed profile',async()=>{
    const unconfirmed=structuredClone(payload);unconfirmed.profile=null;unconfirmed.setup_draft.age=50;
    assert.ok((await one.transport.submitSnapshot('sync_menuki_state',unconfirmed,revisionA)).error);
    const saved=await one.transport.fetchSnapshot();assert.equal(saved.cycles.length,0);assert.equal(saved.setupDraft.age,32);
  });
  await run.check('first confirmation and retry preserve one cycle and exactly 105 meals',async()=>{
    revisionA=Number(await sync(payload,revisionA));revisionA=Number(await sync(payload,revisionA));
    const saved=await one.transport.fetchSnapshot();assert.equal(saved.cycles.filter(c=>c.status==='active').length,1);assert.equal(saved.plannedMeals.length,105);
    assert.equal(saved.profile.activity_level,'light');assert.equal(saved.profile.manual_rmr_kcal,null);
    const incomplete=structuredClone(payload);incomplete.planned_meals.pop();
    assert.ok((await one.transport.submitSnapshot('sync_menuki_state',incomplete,revisionA)).error);
  });
  await run.check('all six movement levels can be saved and recovered through the hosted RPC',async()=>{
    for(const activity of ['very_sedentary','sedentary','light','moderate','intense','very_intense']) {
      payload.profile.activity_level=activity;revisionA=Number(await sync(payload,revisionA));
      assert.equal((await one.transport.fetchSnapshot()).profile.activity_level,activity);
    }
    payload.profile.activity_level=profile.activity_level;revisionA=Number(await sync(payload,revisionA));
  });
  await run.check('normal and null explicitly withdraw one recipe preference and time limit',async()=>{
    payload.recipe_preferences[0].preference='normal';payload.menu_preferences.weekday_lunch_max_minutes=null;
    revisionA=Number(await sync(payload,revisionA));const saved=await one.transport.fetchSnapshot();
    assert.equal(saved.recipePreferences[0].preference,'normal');assert.equal(saved.menuPreferences.weekday_lunch_max_minutes,null);
  });
  await run.check('cross-account reads and direct writes cannot escape RLS/RPC boundaries',async()=>{
    for(const table of tables) {
      const result=await two.client.request(`/rest/v1/${table}?select=user_id&user_id=eq.${a.id}`);
      assert.ok(result.error || Array.isArray(result.data)&&result.data.length===0,table+' exposed another user');
    }
    for(const table of ['profile_setup_drafts','menu_preferences','recipe_preferences','profiles','plan_cycles','planned_meals','user_settings']) {
      const result=await two.client.request(`/rest/v1/${table}?user_id=eq.${a.id}`,{method:'PATCH',body:{user_id:b.id},headers:{Prefer:'return=representation'}});
      assert.ok(result.error || Array.isArray(result.data)&&result.data.length===0,table+' accepted an out-of-scope update');
      const own=await one.client.request(`/rest/v1/${table}?user_id=eq.${a.id}`,{method:'PATCH',body:{user_id:a.id},headers:{Prefer:'return=representation'}});
      assert.equal(own.error?.code,'42501',table+' allowed direct writes instead of the scoped RPC');
    }
    const saved=await one.transport.fetchSnapshot();assert.equal(saved.profile.age,32);assert.equal(saved.plannedMeals.length,105);
  });
  await run.check('scoped RPC rejects forged ownership and binds second-user progress to auth.uid()',async()=>{
    other.setup_draft.reference_weight_kg=70;
    revisionB=Number(await sync(other,revisionB,two));
    const forged=structuredClone(other);forged.recipe_preferences=[{recipe_id:picks[0],preference:'favorite',user_id:a.id}];
    assert.ok((await two.transport.submitSnapshot('sync_menuki_state',forged,revisionB)).error);
    assert.equal((await two.transport.fetchSnapshot()).setupDraft.reference_weight_kg,70);
    assert.equal((await one.transport.fetchSnapshot()).setupDraft.reference_weight_kg,null);
  });
  await run.check('zero-stock meals and reversals stay nonnegative and idempotent with full usage snapshots',async()=>{
    payload.completions=[{id:randomUUID(),planned_meal_id:payload.planned_meals[0].id,recipe_id_snapshot:picks[0],catalog_version:raw.catalogVersion,
      operation_id:'qa-meal-one',completed_at:new Date().toISOString(),ingredients:[{ingredient_index:0,food_id:'skyr',ingredient_name_snapshot:'Yogur natural alto en proteínas',quantity:250,recipe_unit:'g'}]},
      {id:randomUUID(),planned_meal_id:payload.planned_meals[1].id,recipe_id_snapshot:picks[1],catalog_version:raw.catalogVersion,
        operation_id:'qa-meal-two',completed_at:new Date().toISOString(),ingredients:[]}];
    payload.movements=[{id:randomUUID(),food_id:'skyr',quantity:50,unit:'g',movement_kind:'purchase',operation_id:'qa-purchase'},
      {id:randomUUID(),food_id:'skyr',quantity:-250,unit:'g',movement_kind:'meal',operation_id:'qa-meal-one:skyr',completion_operation_id:'qa-meal-one'},
      {id:randomUUID(),food_id:'skyr',quantity:-50,unit:'g',movement_kind:'meal',operation_id:'qa-meal-two:skyr',completion_operation_id:'qa-meal-two'}];
    revisionA=Number(await sync(payload,revisionA));let saved=await one.transport.fetchSnapshot();
    assert.equal(saved.movements.reduce((n,m)=>n+Number(m.quantity),0),0);
    assert.equal(Number(saved.movements.find(m=>m.operation_id==='qa-meal-two:skyr').quantity),0);
    const full=(await one.client.request('/rest/v1/meal_completion_ingredients?select=quantity')).data;assert.equal(Number(full[0].quantity),250);
    payload.completions[0].reversed_at=new Date().toISOString();
    payload.movements.push({id:randomUUID(),food_id:'skyr',quantity:50,unit:'g',movement_kind:'reversal',operation_id:'revert:qa-meal-one:skyr',reverses_operation_id:'qa-meal-one:skyr'});
    revisionA=Number(await sync(payload,revisionA));revisionA=Number(await sync(payload,revisionA));saved=await one.transport.fetchSnapshot();
    assert.equal(saved.movements.length,4);assert.equal(saved.movements.reduce((n,m)=>n+Number(m.quantity),0),50);
  });
  await run.check('retired shortfall writes remain suppressed on the hosted project',async()=>{
    const retired=await one.client.request('/rest/v1/meal_completion_shortfalls?select=user_id&user_id=eq.'+a.id);
    run.observations.retiredShortfalls={status:retired.status,ownRows:retired.data?.length??null};
    assertSuccess(retired);
    assert.equal(retired.data.length,0,'The hosted project created retired shortfall rows for this isolated test account.');
  });
  run.revisions={a:revisionA,b:revisionB};await run.checkpoint();return run;
}

export async function clearTestState(run) {
  // Guarded by creation metadata and exact identities; never resets an existing account.
  for(const account of run.accounts) {
    const side=transportFor(run,account),identity=assertSuccess(await side.client.request('/auth/v1/user'));
    assert.equal(identity.id,account.id);assert.equal(identity.user_metadata?.menuki_test_run,run.runId);
    const current=await side.transport.readOne('user_settings');
    if (current?.state_initialized_at) assertSuccess(await side.transport.submitSnapshot('reset_menuki_state',snapshot(),Number(current.sync_revision)));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const run=await prepareLiveRun();
  console.log('Read-only preflight OK. Explicit creation requires MENUKI_LIVE_TEST_PROJECT='+project+'.');
  if(process.env.MENUKI_LIVE_TEST_PROJECT===project) {
    try {await run.createAccounts(project);await runLiveChecks(run);console.log(`${run.checks.length} real Supabase checks passed.`);}
    finally {await clearTestState(run);console.log('Private temporary report: '+run.directory);}
  }
}
