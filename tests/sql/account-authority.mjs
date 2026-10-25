import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { loadCatalogs } from '../../js/data/catalogs.js';
import { createCloudStateMapper } from '../../js/persistence/cloud-state-mapper.js';
import { createSupabaseTransport } from '../../js/persistence/supabase-transport.js';
import { createStateNormalizer } from '../../js/persistence/state-normalization.js';
import { initialPlanningState } from '../../js/persistence/planning-state.js';
import { createInventoryUnitService } from '../../js/domain/inventory-units.js';
import { normalizeLegacyDeduction } from '../../js/domain/inventory-balance.js';
import { createAccountAction } from '../../js/persistence/account-actions.js';
import { defaultProfile,sanitizeProfile } from '../../js/domain/profile.js';
import { addDays,dateFromISO,dateDiff,isoDate } from '../../js/domain/dates.js';
const { PGlite } = await import(pathToFileURL(resolve(process.argv[2] || 'tmp/pglite-runtime/node_modules/@electric-sql/pglite/dist/index.js')));
const db = new PGlite();
const query = async (sql,args=[]) => (await db.query(sql,args)).rows;
const userA=randomUUID(),userB=randomUUID();let checks=0;
const check=async(name,fn)=>{await fn();checks++;console.log('OK '+name)};
const auth=async id=>{await db.exec('reset role');await query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated')};
const read=async()=> (await query('select public.get_menuki_state() state'))[0].state;
const action=async(data,rev,op=randomUUID())=>(await query('select public.apply_menuki_action($1::jsonb,$2::bigint,$3::uuid) state',[JSON.stringify({contract:2,...data}),rev,op]))[0].state;
const profile={sex:'male',age:30,height_cm:180,reference_weight_kg:80,activity_level:'sedentary',goal:'maintain',injury_recovery:false,auto_portions:true,follow_weight:false,manual_rmr_kcal:null,profile_confirmed:true};
try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`);
 await query('insert into auth.users values($1),($2)',[userA,userB]);
 for(const name of (await readdir(new URL('../../supabase/migrations/',import.meta.url))).filter(n=>n.endsWith('.sql')).sort())await db.exec(await readFile(new URL('../../supabase/migrations/'+name,import.meta.url),'utf8'));
 await check('account migration is repeatable',async()=>{await db.exec(await readFile(new URL('../../supabase/migrations/20261025120000_server_authoritative_accounts.sql',import.meta.url),'utf8'))});
 await check('all eight deployment diagnostics return true',async()=>{const results=await db.exec(await readFile(new URL('../../supabase/diagnostics/account_authority.sql',import.meta.url),'utf8'));assert.equal(results[0].rows.length,8);for(const row of results[0].rows)assert.equal(row.ready,true,row.check_name)});
 await auth(userA);
 await check('new contract advertises its atomic read and initializes a guided account',async()=>{
  assert.equal((await query('select public.menuki_state_capabilities() c'))[0].c.account_contract,2);
  const result=await action({planning_contract:1,setup_mode:'guided',profile},0);
  assert.equal(result.settings.sync_revision,1);assert.equal(result.profile.goal,'maintain');assert.equal(result.accountContract,2);
 });
 const cycle=randomUUID(),meals=Array.from({length:105},(_,i)=>({id:randomUUID(),cycle_id:cycle,meal_date:new Date(Date.UTC(2026,9,25+Math.floor(i/5))).toISOString().slice(0,10),slot:i%5,recipe_id:'test_recipe_'+(i%5),is_locked:false}));
 const plan={cycles:[{id:cycle,start_date:'2026-10-25',status:'active',catalog_version:'test',confirmed_at:'2026-10-25T10:00:00Z'}],planned_meals:meals,
  plan_recipes:['desayuno','media','comida','tarde','cena'].map((type,i)=>({cycle_id:cycle,recipe_id:'test_recipe_'+i,name:'Receta que puede retirarse',meal_type:type,time_minutes:15,steps:['Cocinar.']})),
  plan_ingredients:Array.from({length:5},(_,i)=>({cycle_id:cycle,recipe_id:'test_recipe_'+i,ingredient_index:0,food_id:'rice',base_quantity:80,recipe_unit:'g',food_snapshot:{food:['Arroz','g',350,7,78,1],meta:{unit:'g',recipeUnit:'g'},purchase:['merc','Cereales',1000]}})),
  meal_portions:meals.map(m=>({planned_meal_id:m.id,food_id:'rice',quantity:80})),
  day_targets:Array.from({length:21},(_,i)=>({cycle_id:cycle,meal_date:meals[i*5].meal_date,calculation_version:'test',input_signature:'test',target:{calories:2200,protein:140,carb:250,fat:70}}))};
 await check('a confirmed cycle stores its recipes, portions and targets atomically',async()=>{
  const result=await action(plan,1);assert.equal(result.settings.sync_revision,2);assert.equal(result.plannedMeals.length,105);assert.equal(result.mealPortions.length,105);assert.equal(result.dayTargets.length,21);
 });
 await check('opening two sessions returns the same database state and performs no writes',async()=>{
  const laptop=await read(),mobile=await read();assert.deepEqual(laptop,mobile);assert.equal(mobile.settings.sync_revision,2);
 });
 await check('profile-only save cannot archive, change or omit the confirmed cycle',async()=>{
  const result=await action({profile:{age:31}},2);assert.equal(result.profile.age,31);assert.equal(result.profile.goal,'maintain');assert.equal(result.cycles[0].status,'active');assert.equal(result.plannedMeals.length,105);
 });
 await check('stale device is rejected without changing profile or menu',async()=>{
  await assert.rejects(action({profile:{age:55}},2),{code:'PT409'});assert.equal((await read()).profile.age,31);
 });
 await check('a retry after a lost acknowledgement is idempotent even with an old revision',async()=>{
  const op=randomUUID(),payload={profile:{height_cm:181}};
  const first=await action(payload,3,op),retry=await action(payload,3,op);assert.deepEqual(first,retry);assert.equal(retry.settings.sync_revision,4);
  await assert.rejects(action({profile:{height_cm:182}},4,op),/OPERATION_ID_REUSED/);
 });
 await check('unrelated scoped actions preserve the other accepted values',async()=>{
  await action({weights:[{measured_on:'2026-10-25',weight_kg:79}]},4);
  const state=await action({recipe_preferences:[{recipe_id:'rice_recipe',preference:'favorite'}]},5);
  assert.equal(Number(state.weights[0].weight_kg),79);assert.equal(Number(state.profile.height_cm),181);assert.equal(state.cycles[0].status,'active');
 });
 await check('a menu with missing details is rejected without a partial profile update',async()=>{
  const bad={...plan,profile:{age:45},meal_portions:[],day_targets:[],plan_recipes:[],plan_ingredients:[]};
  bad.cycles=[{...plan.cycles[0],id:randomUUID()}];bad.planned_meals=meals.map(m=>({...m,id:randomUUID(),cycle_id:bad.cycles[0].id}));
  await assert.rejects(action(bad,6),/INCOMPLETE_PLAN_DETAILS/);assert.equal((await read()).profile.age,31);assert.equal((await read()).settings.sync_revision,6);
 });
 await check('an old browser cannot overwrite a contract-2 account or archive its menu',async()=>{
  await assert.rejects(query('select public.sync_menuki_state($1::jsonb,6) r',[JSON.stringify({planning_contract:1,profile:null,cycles:[],planned_meals:[],completions:[],movements:[],prep_tasks:[]})]),/ACCOUNT_CLIENT_UPGRADE_REQUIRED/);
  assert.equal((await read()).settings.sync_revision,6);assert.equal((await read()).cycles[0].status,'active');
 });
 await check('a due confirmed successor is the same read-only projection on both devices and settles only on a write',async()=>{
  await db.exec('reset role');
  const starts=(await query("select to_char((now() at time zone 'Europe/Madrid')::date,'YYYY-MM-DD') d"))[0].d;
  const due=randomUUID(),session=randomUUID(),history=randomUUID(),historyItem=randomUUID(),confirmed=new Date().toISOString(),scope='next-'+starts+'-'+Date.parse(confirmed);
  await query("insert into public.plan_cycles(id,user_id,start_date,status,catalog_version,confirmed_at) values($1,$2,$3,'scheduled','test',$4)",[due,userA,starts,confirmed]);
  await query("insert into public.shopping_sessions(id,user_id,window_key,starts_on,ends_on,status) values($1,$2,'shared-cart',$3,$3::date+20,'open')",[session,userA,starts]);
  for(const [key,kind] of [['current:rice','planned'],[scope+'~current:rice','planned'],['extra:rice:0','extra'],['extra:'+scope+':rice:0','extra']])await query('insert into public.shopping_session_items(id,user_id,session_id,item_key,food_id,item_kind,is_checked,package_count,package_size,unit) values($1,$2,$3,$4,\'rice\',$5,false,1,1000,\'g\')',[randomUUID(),userA,session,key,kind]);
  await query("insert into public.shopping_sessions(id,user_id,window_key,starts_on,ends_on,status) values($1,$2,'past-cart',$3,$3::date+20,'completed')",[history,userA,starts]);
  await query("insert into public.shopping_session_items(id,user_id,session_id,item_key,food_id,item_kind,is_checked,package_count,package_size,unit) values($1,$2,$3,'current:rice','rice','planned',true,1,1000,'g')",[historyItem,userA,history]);
  await auth(userA);const one=await read(),two=await read();assert.deepEqual(one,two);
  assert.equal(one.cycles.find(c=>c.id===due).status,'active');assert.equal(one.cycles.find(c=>c.id===cycle).status,'archived');
  assert.equal((await query('select status from public.plan_cycles where id=$1',[due]))[0].status,'scheduled');
  assert.equal(one.settings.sync_revision,6);assert.equal(one.shoppingItems.length,4);
  assert.equal(one.shoppingItems.find(i=>i.id===historyItem).item_key,'current:rice');
  const after=await action({profile:{age:32}},6);assert.equal(after.settings.sync_revision,7);
  assert.equal((await query('select status from public.plan_cycles where id=$1',[due]))[0].status,'active');
  assert.deepEqual(after.shoppingItems.map(i=>i.item_key).sort(),one.shoppingItems.map(i=>i.item_key).sort());
 });
 await check('different user cannot read or write recipe and portion snapshots of this account',async()=>{
  await auth(userB);const other=await read();assert.equal(other.planRecipes.length,0);assert.equal(other.mealPortions.length,0);
  assert.equal((await query('select * from public.planned_meal_portions')).length,0);
  await assert.rejects(query('insert into public.plan_day_targets(user_id,cycle_id,meal_date,calculation_version,input_signature,target) values($1,$2,current_date,\'x\',\'x\',\'{}\')',[userA,cycle]),{code:'42501'});
  await assert.rejects(action({plan_recipes:plan.plan_recipes},0),{code:'23503'});
 });
 let catalog;const originalFetch=globalThis.fetch;
 try{globalThis.fetch=async url=>({ok:true,json:async()=>JSON.parse(await readFile(url,'utf8'))});catalog=await loadCatalogs({slotTypes:['desayuno','media','comida','tarde','cena'],recoveryTags:['calcium','vitamin_d','vitamin_c']})}finally{globalThis.fetch=originalFetch}
 const realMenus=Array.from({length:3},()=>Array.from({length:7},()=>['yogur_platano','tostada_queso','arroz_pollo','yogur_nueces','merluza_patatas']));
 const empty=()=>({v:12,...initialPlanningState('guided'),start:'2026-10-25',profile:null,profileConfirmed:false,noActiveCycle:true,
  done:{},reversedDone:{},movements:[],stock:{},purchases:[],weights:[],activitySessions:[],legacyStrengthDays:{},archives:[],cart:{},cartExtras:[],deletedWeightDates:[],deletedActivitySessionIds:[]});
 function device(published){
  let food={...published.foods},meta={...published.foodMeta},recipes={...published.recipeById};
  const roundAmount=x=>Math.round(Number(x)*100)/100;
  const units=createInventoryUnitService({getFood:()=>food,getFoodMeta:()=>meta,roundAmount});
  const validMenuSnapshot=menus=>Array.isArray(menus)&&menus.length===3&&menus.every(w=>w.length===7&&w.every(d=>d.length===5&&d.every(id=>recipes[id])));
  const isUuid=value=>typeof value==='string'&&/^[a-f0-9-]{36}$/.test(value);
  const normalizer=createStateNormalizer({emptyState:empty,getFood:()=>food,inventoryUnits:units,normalizeLegacyDeduction,dateFromISO,isoDate,today:()=>dateFromISO('2026-10-25'),activityById:{},sanitizeProfile,validMenuSnapshot,isUuid,cloneMenus:structuredClone,roundAmount});
  const mapper=createCloudStateMapper({getUserId:()=>userB,getFood:()=>food,getRecipes:()=>recipes,getCatalogVersion:()=>published.catalogVersion,getCatalog:()=>published,
   installPlanDetails:(all,active)=>{food={...published.foods};meta={...published.foodMeta};recipes={...published.recipeById};for(const detail of all)Object.assign(recipes,detail.recipes);if(active){Object.assign(food,active.foods);Object.assign(meta,active.foodMeta)}},
   archivedCyclesByUser:new Map(),addDays,dateFromISO,dateDiff,isoDate,today:()=>dateFromISO('2026-10-25'),validMenuSnapshot,cloneMenus:structuredClone,fixedMenus:realMenus,isUuid,emptyState:empty,
   cleanState:normalizer.cleanState,rebuildStock:normalizer.rebuildStock,defaultProfile,sanitizeProfile,...units,commercialPack:()=>({size:1000})});
  const transport=createSupabaseTransport({getUserId:()=>userB,getClient:()=>({rpc:async(name,args)=>{try{
   if(name==='menuki_state_capabilities')return {data:(await query('select public.menuki_state_capabilities() c'))[0].c};
   if(name==='get_menuki_state')return {data:await read()};
   return {data:await action(args.p_action,args.p_expected_revision,args.p_operation_id)};
  }catch(error){return {error:{code:error.code,message:error.message}}}}})});
  return {...mapper,transport};
 }
 const laptop=device(catalog);let latest,baseState;
 await check('real transport, mapper and normalizer confirm a complete portable plan',async()=>{
  const source={...empty(),profile:{...defaultProfile(),sex:'male',age:30,height:180,weight:80,activity:'sedentary',goal:'maintain',manualRmr:null},profileConfirmed:true,noActiveCycle:false,
   activeCycleId:randomUUID(),activeMenus:realMenus,activeMenuCatalogVersion:catalog.catalogVersion,activeMenuConfirmedAt:'2026-10-25T10:00:00Z'};
  const full=await laptop.buildCloudSnapshot(source),result=await laptop.transport.submitAction(createAccountAction({},full),0,randomUUID());
  assert.equal(result.error,undefined);latest=result.data;baseState=laptop.stateFromCloud(latest);
  assert.equal(baseState.noActiveCycle,false);assert.equal(Object.keys(baseState.activePlanDetails.portions).length,105);
 });
 const older=structuredClone(catalog);delete older.recipeById.arroz_pollo;older.foods.rice[2]=999;
 const mobile=device(older);
 await check('a second device with a missing recipe and different nutrition still displays the saved plan',async()=>{
  const state=mobile.stateFromCloud(await mobile.transport.fetchSnapshot());
  assert.equal(state.noActiveCycle,false);assert.equal(state.cloudPlanIssue,null);
  assert.deepEqual(state.activeMenus,baseState.activeMenus);assert.deepEqual(state.activePlanDetails,baseState.activePlanDetails);
  assert.notEqual(state.activePlanDetails.foods.rice[2],999);assert.equal((await read()).settings.sync_revision,1);
 });
 await check('profile changes round-trip exact saved portions to the other device',async()=>{
  const changed=structuredClone(baseState);changed.profile.goal='muscle_gain';
  const before=await laptop.buildCloudSnapshot(baseState,{materialize:false}),after=await laptop.buildCloudSnapshot(changed);
  const result=await laptop.transport.submitAction(createAccountAction(before,after),1,randomUUID());assert.equal(result.error,undefined);latest=result.data;
  const one=laptop.stateFromCloud(latest),two=mobile.stateFromCloud(await mobile.transport.fetchSnapshot());
  assert.equal(two.profile.goal,'muscle_gain');assert.deepEqual(one.activePlanDetails.portions,two.activePlanDetails.portions);baseState=one;
 });
 await check('canonical inventory deductions and lost-response retries keep full meal use and nonnegative stock',async()=>{
  const before=await laptop.buildCloudSnapshot(baseState,{materialize:false}),changed=structuredClone(baseState),usage=changed.activePlanDetails.portions['2026-10-25#2'];
  changed.movements.push({operationId:'opening:rice',foodId:'rice',quantity:10,kind:'opening',createdAt:'2026-10-25T10:00:00Z'},
   {operationId:'meal-test:rice',foodId:'rice',quantity:-usage.rice,kind:'meal',sourceId:'2026-10-25#2',createdAt:'2026-10-25T11:00:00Z'});
  changed.done['2026-10-25#2']={rid:'arroz_pollo',operationId:'meal-test',usage,completedAt:'2026-10-25T11:00:00Z'};
  const command=createAccountAction(before,await laptop.buildCloudSnapshot(changed)),op=randomUUID();
  const result=await laptop.transport.submitAction(command,2,op);assert.equal(result.error,undefined);
  const state=mobile.stateFromCloud(result.data);assert.equal(state.stock.rice||0,0);assert.equal(state.done['2026-10-25#2'].deducted.rice,10);assert.equal(state.done['2026-10-25#2'].usage.rice,usage.rice);
  const retry=await laptop.transport.submitAction(command,2,op);assert.equal(retry.error,undefined);assert.equal(retry.data.settings.sync_revision,3);
  assert.equal(retry.data.movements.length,2);assert.equal(retry.data.completions.length,1);
  baseState=state;
 });
 await check('server rejects an attempt to change a completed quantity and rolls the accompanying profile back',async()=>{
  const before=await mobile.buildCloudSnapshot(baseState,{materialize:false}),changed=structuredClone(baseState);
  changed.profile.age=37;changed.done['2026-10-25#2'].usage.rice+=1;
  const command=createAccountAction(before,await mobile.buildCloudSnapshot(changed));
  const result=await mobile.transport.submitAction(command,3,randomUUID());assert.match(result.error.message,/COMPLETED_QUANTITY_IMMUTABLE/);
  assert.equal((await read()).profile.age,30);assert.equal((await read()).settings.sync_revision,3);
 });
 await check('reversing the meal restores only the confirmed deduction, exactly once',async()=>{
  const before=await laptop.buildCloudSnapshot(baseState,{materialize:false}),changed=structuredClone(baseState),key='2026-10-25#2';
  changed.reversedDone['meal-test']={...changed.done[key],mealKey:key,reversedAt:'2026-10-25T12:00:00Z'};delete changed.done[key];
  changed.movements.push({operationId:'revert:meal-test:rice',foodId:'rice',quantity:10,kind:'meal_reversal',sourceId:key,createdAt:'2026-10-25T12:00:00Z'});
  const command=createAccountAction(before,await laptop.buildCloudSnapshot(changed)),op=randomUUID();
  const first=await laptop.transport.submitAction(command,3,op);assert.equal(first.error,undefined);
  const retry=await laptop.transport.submitAction(command,3,op);assert.equal(retry.error,undefined);assert.equal(retry.data.settings.sync_revision,4);
  const state=mobile.stateFromCloud(retry.data);assert.equal(state.stock.rice,10);assert.equal(state.done[key],undefined);assert.equal(retry.data.movements.length,3);
 });
 await check('explicit reset clears this account and its plan snapshots with an idempotent acknowledgement',async()=>{
  const command={...createAccountAction({},await laptop.buildCloudSnapshot(empty())),reset:true},op=randomUUID();
  const first=await laptop.transport.submitAction(command,4,op);assert.equal(first.error,undefined);
  const retry=await laptop.transport.submitAction(command,4,op);assert.equal(retry.error,undefined);assert.equal(retry.data.settings.sync_revision,5);
  assert.equal(retry.data.planRecipes.length,0);assert.equal(retry.data.mealPortions.length,0);assert.equal(retry.data.profile,null);
  await auth(userA);assert.equal((await read()).profile.age,32);await auth(userB);
 });
 await check('anonymous role cannot use either account RPC',async()=>{
  await db.exec('reset role;set role anon');await assert.rejects(read(),{code:'42501'});await assert.rejects(action({},0),{code:'42501'});
 });
 console.log(`${checks} account-contract PostgreSQL checks passed (local only).`);
}finally{await db.close()}
