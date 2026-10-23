// PostgreSQL execution tests in an ephemeral PGlite database. No HTTP, Auth
// credentials, hosted connection or production data is used. Pass the installed
// PGlite entry point as argv[2]; it is a test tool, not an application dependency.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { planningRows, initialPlanningState } from '../../js/persistence/planning-state.js';
import { validateProfileDraft, defaultProfile } from '../../js/domain/profile.js';

const modulePath = resolve(process.argv[2] || 'tmp/pglite-runtime/node_modules/@electric-sql/pglite/dist/index.js');
const { PGlite } = await import(pathToFileURL(modulePath));
const db = new PGlite();
let checks = 0;
async function check(name, action) { await action(); checks++; console.log(`OK ${name}`); }
const rows = async (sql, params = []) => (await db.query(sql, params)).rows;
const count = async table => Number((await rows(`select count(*) n from public.${table}`))[0].n);
const userA = randomUUID(), userB = randomUUID();
const authenticate = async user => { await db.exec('reset role'); await rows("select set_config('request.jwt.claim.sub', $1, false)", [user]); await db.exec('set role authenticated'); };
const sync = (snapshot, revision = 0, reset = false) => rows(`select public.${reset ? 'reset' : 'sync'}_menuki_state($1::jsonb,$2::bigint) revision`, [JSON.stringify(snapshot), revision]);
const snapshot = (mode = 'guided') => ({
  ...planningRows(initialPlanningState(mode)), profile: null,
  cycles: [], planned_meals: [], completions: [], movements: [], prep_tasks: [],
  shopping: { id: randomUUID(), starts_on: '2026-10-23', ends_on: '2026-11-12', items: [] },
});
const profile = { sex: 'male', age: 30, height_cm: 180, reference_weight_kg: 80,
  activity_level: 'sedentary', goal: 'maintain', injury_recovery: false,
  auto_portions: true, follow_weight: false, manual_rmr_kcal: null, profile_confirmed: true };
function addPlan(s) {
  const id = randomUUID();
  s.cycles = [{ id, start_date: '2026-10-23', status: 'active', catalog_version: 'test', confirmed_at: '2026-10-23T10:00:00Z' }];
  s.planned_meals = Array.from({length: 21}, (_,day) => Array.from({length: 5}, (_,slot) => ({id: randomUUID(), cycle_id: id,
    meal_date: new Date(Date.UTC(2026,9,23+day)).toISOString().slice(0,10), slot, recipe_id: 'test_recipe', is_locked: false}))).flat();
}
try {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`);
  await rows('insert into auth.users values ($1),($2)', [userA,userB]);
  const migrations = (await readdir(new URL('../../supabase/migrations/', import.meta.url))).filter(x=>x.endsWith('.sql')).sort();
  for (const migration of migrations) await db.exec(await readFile(new URL(`../../supabase/migrations/${migration}`, import.meta.url),'utf8'));
  await check('migration is safely repeatable', async () => {
    await db.exec(await readFile(new URL('../../supabase/migrations/20261023120000_planning_preferences_and_setup.sql',import.meta.url),'utf8'));
  });
  await check('server/client confirmation validation agree across modes, goals, factors and invalid inputs', async()=>{
    const cases=[];
    for(const sex of ['male','female','manual'])for(const activity of ['very_sedentary','sedentary','light','moderate','intense','very_intense'])for(const goal of ['maintain','recomp','fat_loss','muscle_gain']) {
      cases.push({...defaultProfile(),sex,activity,goal,manualRmr:sex==='manual'?1600:null});
    }
    for(const patch of [{age:null},{age:'30'},{age:30.5},{height:124},{weight:251},{activity:'unknown'},{sex:'manual',manualRmr:null},{injury:1}])cases.push({...defaultProfile(),...patch});
    for(const p of cases){
      const transportProfile={sex:p.sex,age:p.age,height_cm:p.height,reference_weight_kg:p.weight,activity_level:p.activity,goal:p.goal,manual_rmr_kcal:p.manualRmr,injury_recovery:p.injury,auto_portions:p.autoPortions,follow_weight:p.followWeight};
      assert.equal((await rows('select public.valid_menuki_profile($1::jsonb) valid',[JSON.stringify(transportProfile)]))[0].valid,validateProfileDraft(p).valid);
    }
  });
  await check('read-only deployment diagnostics return true',async()=>{
    const results=await db.exec(await readFile(new URL('../../supabase/diagnostics/planning_persistence.sql',import.meta.url),'utf8'));
    for(const result of results)for(const row of result.rows)assert.equal(row.ready,true,row.check_name);
  });
  await authenticate(userA);
  const a = snapshot();
  a.setup_draft.age = 32;
  a.recipe_preferences = [{recipe_id:'recipe_one', preference:'favorite'}];
  a.menu_preferences.weekday_lunch_max_minutes = 30;
  await check('new guided account persists partial draft without a profile or menu', async () => {
    assert.equal((await sync(a))[0].revision, 1);
    assert.equal(await count('profiles'),0); assert.equal(await count('plan_cycles'),0);
    assert.equal((await rows('select age from public.profile_setup_drafts'))[0].age,32);
    assert.equal((await rows('select state_initialized_at is not null initialized from public.user_settings'))[0].initialized,true);
  });
  await check('stale revisions are HTTP 409 and leave all fields intact', async () => {
    const stale=structuredClone(a); stale.setup_draft.age=40;
    await assert.rejects(sync(stale,0), {code:'PT409'});
    assert.equal((await rows('select age from public.profile_setup_drafts'))[0].age,32);
  });
  await check('server rejects first plan without confirmed profile transactionally', async () => {
    const bad=structuredClone(a); addPlan(bad); bad.recipe_preferences[0].preference='do_not_propose';
    await assert.rejects(sync(bad,1), /CONFIRMED_PROFILE_REQUIRED/);
    assert.equal(await count('plan_cycles'),0); assert.equal((await rows('select preference from public.recipe_preferences'))[0].preference,'favorite');
  });
  await check('server rejects invalid confirmed profile instead of clamping', async () => {
    for (const change of [{age: 12},{age:'30'},{height_cm:120},{manual_rmr_kcal:300},{sex:'manual',manual_rmr_kcal:null},{age:30.5}]) {
      const bad={...a,profile:{...profile,...change}};
      await assert.rejects(sync(bad,1), /INVALID_CONFIRMED_PROFILE/);
    }
  });
  await check('unknown, null and mistyped preference values roll back draft writes', async () => {
    for (const value of [0,30.5,'30',2000]) {
      const bad=structuredClone(a); bad.setup_draft.age=40; bad.menu_preferences.weekday_lunch_max_minutes=value;
      await assert.rejects(sync(bad,1), /INVALID_TIME_LIMIT/);
      assert.equal((await rows('select age from public.profile_setup_drafts'))[0].age,32);
    }
    const bad=structuredClone(a);bad.setup_draft.unexpected=true;
    await assert.rejects(sync(bad,1), /INVALID_SETUP_DRAFT/);
  });
  await check('first confirmed plan stores exactly 105 meals and no example profile', async () => {
    a.profile={...profile}; addPlan(a);
    assert.equal((await sync(a,1))[0].revision,2);
    assert.equal(await count('planned_meals'),105);
    assert.equal((await rows('select manual_rmr_kcal from public.profiles'))[0].manual_rmr_kcal,null);
  });
  await check('repeated submission reuses one cycle; incomplete cycles are rejected', async () => {
    assert.equal((await sync(a,2))[0].revision,3);
    assert.equal(await count('plan_cycles'),1); assert.equal(await count('planned_meals'),105);
    const bad=structuredClone(a);bad.planned_meals.pop();
    await assert.rejects(sync(bad,3),/INCOMPLETE_MENU_CYCLE/);
  });
  await check('meal use, no-stock marker and reversals remain idempotent without shortfalls',async()=>{
    const completionId=randomUUID(), mealId=a.planned_meals[0].id;
    a.completions=[{id:completionId,planned_meal_id:mealId,recipe_id_snapshot:'test_recipe',catalog_version:'test',operation_id:'meal:1',ingredients:[{ingredient_index:0,food_id:'rice',ingredient_name_snapshot:'Arroz',quantity:10,recipe_unit:'g'}]},
      {id:randomUUID(),planned_meal_id:a.planned_meals[1].id,recipe_id_snapshot:'test_recipe',catalog_version:'test',operation_id:'meal:2',ingredients:[]}];
    a.movements=[{id:randomUUID(),food_id:'rice',quantity:3,unit:'g',movement_kind:'opening',operation_id:'opening:rice'},
      {id:randomUUID(),food_id:'rice',quantity:-10,unit:'g',movement_kind:'meal',operation_id:'meal:1:rice',completion_operation_id:'meal:1'},
      {id:randomUUID(),food_id:'rice',quantity:-5,unit:'g',movement_kind:'meal',operation_id:'meal:2:rice',completion_operation_id:'meal:2'}];
    await sync(a,3);
    assert.equal(Number((await rows('select sum(quantity) n from public.inventory_movements'))[0].n),0);
    assert.equal(Number((await rows("select quantity from public.inventory_movements where operation_id='meal:2:rice'"))[0].quantity),0);
    a.completions[0].reversed_at='2026-10-23T12:00:00Z';
    a.movements.push({id:randomUUID(),food_id:'rice',quantity:3,unit:'g',movement_kind:'reversal',operation_id:'revert:meal:1:rice',reverses_operation_id:'meal:1:rice'});
    await sync(a,4);await sync(a,5);
    assert.equal(Number((await rows('select sum(quantity) n from public.inventory_movements'))[0].n),3);
    assert.equal(await count('inventory_movements'),4);
    assert.equal(await count('meal_completion_shortfalls'),0);
  });
  await check('explicit normal/null reset individual preferences',async()=>{
    a.recipe_preferences[0].preference='normal';a.menu_preferences.weekday_lunch_max_minutes=null;
    await sync(a,6);
    assert.equal((await rows('select preference from public.recipe_preferences'))[0].preference,'normal');
    assert.equal((await rows('select weekday_lunch_max_minutes from public.menu_preferences'))[0].weekday_lunch_max_minutes,null);
  });
  await authenticate(userB);
  await check('second authenticated account cannot read or directly write private planning data',async()=>{
    for(const table of ['profile_setup_drafts','menu_preferences','recipe_preferences','profiles','plan_cycles'])assert.equal(await count(table),0);
    await assert.rejects(rows('insert into public.recipe_preferences(user_id,recipe_id,preference) values($1,$2,$3)',[userA,'recipe_two','favorite']),{code:'42501'});
    await assert.rejects(rows('update public.profiles set age=40 where user_id=$1',[userA]),{code:'42501'});
  });
  const b=snapshot('legacy');b.profile={...profile};
  b.recipe_preferences=[{recipe_id:'recipe_two',preference:'do_not_propose'}];
  b.menu_preferences.weekday_dinner_max_minutes=20;
  await sync(b);
  await check('old-client omissions preserve new preferences and progress',async()=>{
    const {planning_contract,setup_mode,setup_draft,menu_preferences,recipe_preferences,...old}=b;
    await sync(old,1);
    assert.equal((await rows('select preference from public.recipe_preferences'))[0].preference,'do_not_propose');
    assert.equal((await rows('select weekday_dinner_max_minutes from public.menu_preferences'))[0].weekday_dinner_max_minutes,20);
    assert.equal(await count('profile_setup_drafts'),1);
  });
  await check('RPC ignores supplied ownership and cannot downgrade a guided account',async()=>{
    await authenticate(userA);
    const bad={...a,setup_mode:'legacy'};await assert.rejects(sync(bad,7),/Invalid setup mode/);
    await authenticate(userB);
    b.recipe_preferences=[{recipe_id:'recipe_one',preference:'favorite',user_id:userA}];
    await assert.rejects(sync(b,2),/INVALID_RECIPE_PREFERENCE/);
  });
  await check('an old unconfirmed active template cannot be marked confirmed without reviewing the profile',async()=>{
    const template=structuredClone(b);template.profile.profile_confirmed=false;template.recipe_preferences=[];
    addPlan(template);template.cycles[0].confirmed_at=null;
    await sync(template,2);
    template.cycles[0].confirmed_at='2026-10-23T12:00:00Z';
    await assert.rejects(sync(template,3),/CONFIRMED_PROFILE_REQUIRED/);
  });
  await check('confirmed reset clears only this account including preferences and setup',async()=>{
    const fresh=snapshot();await sync(fresh,3,true);
    assert.equal(await count('recipe_preferences'),0);assert.equal(await count('profiles'),0);
    await authenticate(userA);assert.equal(await count('recipe_preferences'),1);assert.equal(await count('planned_meals'),105);
  });
  await check('anonymous sessions cannot access capabilities, RPC or private tables',async()=>{
    await db.exec('reset role; set role anon');
    await assert.rejects(rows('select public.menuki_state_capabilities()'),{code:'42501'});
    await assert.rejects(sync(a),{code:'42501'});
    await assert.rejects(rows('select * from public.profile_setup_drafts'),{code:'42501'});
  });
  console.log(`${checks} PostgreSQL checks passed (local only).`);
} finally { await db.close(); }
