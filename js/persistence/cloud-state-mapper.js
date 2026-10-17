/** Maps Menuki's in-memory state to and from the relational Supabase snapshot contract. */
export function createCloudStateMapper({
  getUserId, getFood, getRecipes, getCatalogVersion, getShortfallsAvailability,
  archivedCyclesByUser, addDays, dateFromISO, dateDiff, isoDate, today,
  validMenuSnapshot, cloneMenus, isUuid, emptyState, cleanState, rebuildStock,
  defaultProfile, sanitizeProfile, foodStockUnit, foodRecipeUnit,
  storedRecipeToCurrentAmount, commercialPack,
}) {
  const cloudUuidCache = new Map();
  function cloudUuid(kind,key){
 const cacheKey=getUserId()+'|'+kind+'|'+key;
 if(!cloudUuidCache.has(cacheKey))cloudUuidCache.set(cacheKey,(async()=>{
  const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(cacheKey))).slice(0,16);
  bytes[6]=(bytes[6]&15)|128;bytes[8]=(bytes[8]&63)|128;
  const hex=[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
  return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
 })());
 return cloudUuidCache.get(cacheKey);
}
  function planDate(start,offset){return isoDate(addDays(dateFromISO(start),offset))}
function planLockAt(locked,week,day,slot){return !!locked?.[week]?.[day]?.[slot]}
async function buildCloudSnapshot(source){
 const definitions=[];
 const addCycle=(kind,key,start,menus,version,options={})=>{
  // The fixed menu intentionally interchanges the two snack slots; accept that
  // same compatibility when validating the active and archived cycles for sync.
  if(!dateFromISO(start)||!validMenuSnapshot(menus,true))throw Error('Hay un menú guardado incompleto o incompatible; conserva una copia y revisa su ciclo antes de sincronizar.');
  definitions.push({kind,key,start,menus:cloneMenus(menus),version:version||getCatalogVersion(),...options});
 };
 const activeMenus=source.activeMenus?cloneMenus(source.activeMenus):cloneMenus(FIXED_MENUS);
 if(!source.noActiveCycle)addCycle('active','current',source.start,activeMenus,source.activeMenuCatalogVersion||getCatalogVersion(),{cycleId:isUuid(source.activeCycleId)?source.activeCycleId:null,prep:source.prep||{},done:source.done||{},reversedDone:source.reversedDone||{},generatedAt:source.activeMenuGeneratedAt||null,confirmedAt:source.activeMenuConfirmedAt||null,recoveryFocus:!!source.activeMenuRecoveryFocus});
 for(const [i,a] of (source.archives||[]).entries())if(a&&dateFromISO(a.start)&&validMenuSnapshot(a.menus,true))addCycle('archived','archive:'+a.start+':'+(a.archivedAt||i),a.start,a.menus,a.catalogVersion||getCatalogVersion(),{cycleId:isUuid(a.cycleId)?a.cycleId:null,prep:a.prep||{},done:a.done||{},reversedDone:a.reversedDone||{},archivedAt:a.archivedAt||new Date(a.start+'T12:00:00Z').toISOString(),generatedAt:a.generatedAt||null,confirmedAt:a.confirmedAt||null,recoveryFocus:!!a.recoveryFocus});
 if(source.nextMenu)addCycle('scheduled','next:'+source.nextMenu.start+':'+(source.nextMenu.generatedAt||''),source.nextMenu.start,source.nextMenu.menus,source.nextMenu.catalogVersion,{locked:source.nextMenu.locked,generatedAt:source.nextMenu.generatedAt||null,confirmedAt:source.nextMenu.confirmedAt||null,recoveryFocus:!!source.nextMenu.recoveryFocus});
 if(source.plannerDraft)addCycle('draft','draft:'+source.plannerDraft.start+':'+(source.plannerDraft.generatedAt||''),source.plannerDraft.start,source.plannerDraft.menus,source.plannerDraft.catalogVersion,{locked:source.plannerDraft.locked,generatedAt:source.plannerDraft.generatedAt||null,confirmedAt:source.plannerDraft.confirmedAt||null,recoveryFocus:!!source.plannerDraft.recoveryFocus});

 const cycles=[],plannedMeals=[],prepTasks=[],mealByKey=new Map(),cycleByKey=new Map();
 const usedCycleIds=new Set();
 for(const [definitionIndex,def] of definitions.entries()){
  const contentKey=def.start+':'+def.version+':'+JSON.stringify(def.menus),legacyId=def.cycleId||await cloudUuid('cycle',contentKey);
  const cycleId=usedCycleIds.has(legacyId)?await cloudUuid('cycle-instance',def.key+':'+definitionIndex+':'+contentKey):legacyId;
  if(usedCycleIds.has(cycleId))throw Error('Hay dos instancias del ciclo con el mismo identificador. Conserva la copia local y revisa el historial antes de sincronizar.');
  usedCycleIds.add(cycleId);
  def.id=cycleId;cycleByKey.set(def.key,def);
  cycles.push({id:cycleId,start_date:def.start,status:def.kind,catalog_version:def.version,generated_at:def.generatedAt,confirmed_at:def.confirmedAt,recovery_focus:def.recoveryFocus,archived_at:def.archivedAt||null});
  for(let offset=0;offset<21;offset++)for(let slot=0;slot<5;slot++){
   const week=Math.floor(offset/7),day=offset%7,mealDate=planDate(def.start,offset),recipeId=def.menus[week]?.[day]?.[slot];
   if(!getRecipes()[recipeId])throw Error('El menú contiene una receta que no está en el catálogo: '+String(recipeId));
   const key=mealDate+'#'+slot,id=await cloudUuid('planned-meal',cycleId+':'+key),row={id,cycle_id:cycleId,meal_date:mealDate,slot,recipe_id:recipeId,is_locked:planLockAt(def.locked,week,day,slot)};
   plannedMeals.push(row);mealByKey.set(def.key+'|'+key,row);
  }
  for(const [taskKey,isCompleted] of Object.entries(def.prep||{})){
   const split=taskKey.indexOf('#'),weekIndex=Number(taskKey.slice(0,split)),task=split>=0?taskKey.slice(split+1):taskKey;
   if(Number.isInteger(weekIndex)&&weekIndex>=0&&weekIndex<3&&task)prepTasks.push({cycle_id:cycleId,week_index:weekIndex,task_key:task,is_completed:!!isCompleted});
  }
 }
 const findMeal=(key)=>{for(const def of definitions){const row=mealByKey.get(def.key+'|'+key);if(row)return {def,row}}return null};
 const completionByOperation=new Map();
 function collectDone(def,entries){for(const [key,item] of Object.entries(entries||{})){
  if(!item||!/^\d{4}-\d{2}-\d{2}#[0-4]$/.test(key))continue;
  const found=mealByKey.get(def.key+'|'+key);if(!found)continue;
  const operationId=String(item.operationId||'legacy:'+key),rid=getRecipes()[item.rid]?item.rid:found.recipe_id;
  const previous=completionByOperation.get(operationId)||{operation_id:operationId,planned_meal_id:found.id,recipe_id_snapshot:rid,catalog_version:def.version,completed_at:item.completedAt||new Date().toISOString(),reversed_at:null,usage:{}};
  previous.usage={...previous.usage,...(item.usage||{})};completionByOperation.set(operationId,previous);
 }}
 for(const def of definitions)collectDone(def,def.done);
 for(const def of definitions)for(const item of Object.values(def.reversedDone||{})){
  const key=item?.mealKey;if(!item||typeof key!=='string'||!/^\d{4}-\d{2}-\d{2}#[0-4]$/.test(key))continue;
  const found=mealByKey.get(def.key+'|'+key);if(!found)continue;
  const operationId=String(item.operationId||'legacy:'+key),rid=getRecipes()[item.rid]?item.rid:found.recipe_id;
  const previous=completionByOperation.get(operationId)||{operation_id:operationId,planned_meal_id:found.id,recipe_id_snapshot:rid,catalog_version:def.version,completed_at:item.completedAt||new Date().toISOString(),reversed_at:item.reversedAt||null,usage:{}};
  previous.usage={...previous.usage,...(item.usage||{})};previous.reversed_at=item.reversedAt||previous.reversed_at;completionByOperation.set(operationId,previous);
 }
 const reversedAtFor=operationId=>source.movements?.find(m=>m.kind==='meal_reversal'&&String(m.operationId||'').startsWith('revert:'+operationId+':'))?.createdAt||null;
 for(const move of source.movements||[])if(move?.kind==='meal'&&move.sourceId){
  const suffix=':'+move.foodId;if(!String(move.operationId||'').endsWith(suffix))continue;
  const operationId=String(move.operationId).slice(0,-suffix.length),found=findMeal(move.sourceId);if(!found)continue;
  const previous=completionByOperation.get(operationId)||{operation_id:operationId,planned_meal_id:found.row.id,recipe_id_snapshot:found.row.recipe_id,catalog_version:found.def.version,completed_at:move.createdAt||new Date().toISOString(),reversed_at:null,usage:{}};
  previous.reversed_at=reversedAtFor(operationId)||previous.reversed_at;completionByOperation.set(operationId,previous);
 }
 const currentShortfall=new Map();
 for(const def of definitions){for(const doneEntry of Object.values(def.done||{}))if(doneEntry?.operationId)currentShortfall.set(doneEntry.operationId,doneEntry.shortfall||{});for(const reversedEntry of Object.values(def.reversedDone||{}))if(reversedEntry?.operationId)currentShortfall.set(reversedEntry.operationId,reversedEntry.shortfall||{})}
 const completions=[];
 for(const entry of completionByOperation.values()){
  const def=definitions.find(x=>x.id&&plannedMeals.some(m=>m.id===entry.planned_meal_id&&m.cycle_id===x.id));
  const recipe=getRecipes()[entry.recipe_id_snapshot],ingredients=[];
  for(const [foodId,quantity] of Object.entries(entry.usage||{}))if(getFood()[foodId]&&Number(quantity)>0){
   const index=Math.max(0,recipe?.ingredients?.findIndex(x=>x.id===foodId)??0);
   ingredients.push({ingredient_index:index,food_id:foodId,ingredient_name_snapshot:getFood()[foodId][0],quantity:Number(quantity),recipe_unit:foodRecipeUnit(foodId)});
  }
  const shortfalls=Object.entries(currentShortfall.get(entry.operation_id)||{}).filter(([foodId,quantity])=>getFood()[foodId]&&Number(quantity)>0).map(([foodId,quantity])=>({food_id:foodId,quantity:Number(quantity),unit:foodStockUnit(foodId)}));
  completions.push({id:await cloudUuid('completion',entry.operation_id),planned_meal_id:entry.planned_meal_id,recipe_id_snapshot:entry.recipe_id_snapshot,catalog_version:entry.catalog_version||def?.version||getCatalogVersion(),operation_id:entry.operation_id,completed_at:entry.completed_at,reversed_at:entry.reversed_at,ingredients,shortfalls});
 }
 const movements=[];
 for(const move of source.movements||[]){
  if(!move||!getFood()[move.foodId]||!Number.isFinite(Number(move.quantity))||!move.operationId)continue;
  let kind=move.kind==='meal_reversal'?'reversal':move.kind;
  if(!['opening','purchase','meal','adjustment','waste','reversal'].includes(kind))continue;
  let completionOperation=null,reversesOperation=null;
  if(kind==='meal'){
   const suffix=':'+move.foodId,op=String(move.operationId).endsWith(suffix)?String(move.operationId).slice(0,-suffix.length):'';
   const found=move.sourceId&&findMeal(move.sourceId);
   if(op&&found&&completionByOperation.has(op))completionOperation=op;
   else kind='adjustment';
  }else if(kind==='reversal'){
   const raw=String(move.operationId).startsWith('revert:')?String(move.operationId).slice(7):'';
   const suffix=':'+move.foodId;reversesOperation=raw.endsWith(suffix)?raw:'';
   if(!reversesOperation)kind='adjustment';
  }
  if(kind==='meal'&&Number(move.quantity)===0&&getShortfallsAvailability()===false)continue;
  const opParts=String(move.operationId).split(':'),group=kind==='purchase'&&/^\d+$/.test(opParts.at(-1))?opParts.slice(0,-1).join(':'):null;

  movements.push({id:await cloudUuid('movement',move.operationId),food_id:move.foodId,quantity:Number(move.quantity),unit:foodStockUnit(move.foodId),movement_kind:kind,operation_id:String(move.operationId),operation_group_id:group,completion_operation_id:completionOperation,reverses_operation_id:reversesOperation,shortfall_quantity:0,note:move.note||null,created_at:move.createdAt||new Date().toISOString()});
 }
 const activitySessions=[];
 for(const session of source.activitySessions||[])activitySessions.push({id:await cloudUuid('activity-session',session.id),client_id:session.id,session_date:session.date,activity_code:session.activityId,duration_minutes:session.durationMinutes,met_value:session.met,created_at:session.createdAt});
 const weights=(source.weights||[]).map(x=>({measured_on:x.date,weight_kg:x.kg}));
 const shoppingItems=[];
 for(const [key,choice] of Object.entries(source.cart||{})){
  const split=key.indexOf(':'),foodId=split>=0?key.slice(split+1):'';if(!getFood()[foodId])continue;
  const pack=commercialPack(foodId),size=Number(choice?.size)||pack.size,count=Math.max(0,Number(choice?.count)||0);
  shoppingItems.push({id:await cloudUuid('shopping-item',key),item_key:key,food_id:foodId,item_kind:'planned',is_checked:!!choice?.checked,package_count:count,package_size:size,unit:foodStockUnit(foodId)});
 }
 for(const [index,extra] of (source.cartExtras||[]).entries())if(getFood()[extra.id]&&Number(extra.size)>0){const key='extra:'+(extra.scope&&extra.scope!=='current'?extra.scope+':':'')+extra.id+':'+index;shoppingItems.push({id:await cloudUuid('shopping-item',key),item_key:key,food_id:extra.id,item_kind:'extra',is_checked:false,package_count:Math.max(0,Number(extra.count)||0),package_size:Number(extra.size),unit:foodStockUnit(extra.id)})}
 const profile=source.profile||defaultProfile(),todayISO=isoDate(today()),shoppingStart=source.start||todayISO;
 return {profile:{sex:profile.sex,age:profile.age,height_cm:profile.height,reference_weight_kg:profile.weight,activity_level:profile.activity,goal:profile.goal,injury_recovery:profile.injury,auto_portions:profile.autoPortions,follow_weight:profile.followWeight,manual_rmr_kcal:profile.manualRmr,profile_confirmed:source.profileConfirmed===true},cycles,planned_meals:plannedMeals,prep_tasks:prepTasks,completions,movements,weights,deleted_weight_dates:source.deletedWeightDates||[],activity_sessions:activitySessions,deleted_activity_ids:source.deletedActivitySessionIds||[],legacy_training_dates:Object.keys(source.legacyStrengthDays||{}).filter(dateFromISO),shopping:{id:await cloudUuid('shopping-session','shared-cart'),starts_on:shoppingStart,ends_on:planDate(shoppingStart,20),items:shoppingItems},last_backup_at:source.lastBackupAt||null};
}
  function stateFromCloud(data){
 if(!data.profile)throw Error('La cuenta tiene sincronización iniciada pero no contiene su perfil. No he sustituido los datos de este navegador.');
 const s=emptyState(),mealRowsByCycle=new Map(),cycleInfo=new Map(),menuOf=new Map(),locksOf=new Map(),prepOf=new Map();
 const visibleArchivedIds=new Set(data.cycles.filter(x=>x.status==='archived').sort((a,b)=>String(a.archived_at||a.created_at).localeCompare(String(b.archived_at||b.created_at))).slice(-6).map(x=>x.id));
 for(const row of data.plannedMeals){if(!mealRowsByCycle.has(row.cycle_id))mealRowsByCycle.set(row.cycle_id,[]);mealRowsByCycle.get(row.cycle_id).push(row)}
 for(const cycle of data.cycles){
  const menus=Array.from({length:3},()=>Array.from({length:7},()=>Array(5).fill(null))),locks=Array.from({length:3},()=>Array.from({length:7},()=>Array(5).fill(false))),start=dateFromISO(cycle.start_date);
  for(const row of mealRowsByCycle.get(cycle.id)||[]){const offset=dateDiff(start,dateFromISO(row.meal_date));if(offset<0||offset>=21||row.slot<0||row.slot>4)continue;const week=Math.floor(offset/7),day=offset%7;menus[week][day][row.slot]=row.recipe_id;locks[week][day][row.slot]=!!row.is_locked}
  if((cycle.status!=='archived'||visibleArchivedIds.has(cycle.id))&&!validMenuSnapshot(menus,true))throw Error('Hay un ciclo de Supabase incompleto o una receta que falta en el catálogo. No he sustituido los datos de este navegador.');
  cycleInfo.set(cycle.id,cycle);menuOf.set(cycle.id,menus);locksOf.set(cycle.id,locks);
 }
 const active=data.cycles.find(x=>x.status==='active');
 for(const row of data.prep){if(!prepOf.has(row.cycle_id))prepOf.set(row.cycle_id,{});prepOf.get(row.cycle_id)[row.week_index+'#'+row.task_key]=!!row.is_completed}
 const plannedById=new Map(data.plannedMeals.map(x=>[x.id,x])),completionById=new Map(data.completions.map(x=>[x.id,x])),ingredientsByCompletion=new Map(),movementsByCompletion=new Map(),shortfallByCompletion=new Map(),movementById=new Map(data.movements.map(x=>[x.id,x]));
 for(const row of data.ingredients){if(!ingredientsByCompletion.has(row.completion_id))ingredientsByCompletion.set(row.completion_id,{});const usage=ingredientsByCompletion.get(row.completion_id);const quantity=storedRecipeToCurrentAmount(row.food_id,row.quantity,row.recipe_unit||foodRecipeUnit(row.food_id));usage[row.food_id]=(usage[row.food_id]||0)+quantity}
 for(const move of data.movements)if(move.source_completion_id){if(!movementsByCompletion.has(move.source_completion_id))movementsByCompletion.set(move.source_completion_id,{});const amounts=movementsByCompletion.get(move.source_completion_id);if(move.movement_kind==='meal'){const legacyShortfall=Math.max(0,Number(move.shortfall_quantity)||0);amounts[move.food_id]=(amounts[move.food_id]||0)+Math.max(0,Math.abs(Number(move.quantity))-legacyShortfall);if(legacyShortfall>.001){if(!shortfallByCompletion.has(move.source_completion_id))shortfallByCompletion.set(move.source_completion_id,{});shortfallByCompletion.get(move.source_completion_id)[move.food_id]=legacyShortfall}}}
 for(const row of data.shortfalls||[]){if(!shortfallByCompletion.has(row.completion_id))shortfallByCompletion.set(row.completion_id,{});shortfallByCompletion.get(row.completion_id)[row.food_id]=Number(row.quantity)}
 const doneByCycle=new Map(),reversedDoneByCycle=new Map();
 for(const completion of data.completions){const planned=plannedById.get(completion.planned_meal_id);if(!planned)continue;const mealKey=planned.meal_date+'#'+planned.slot,usage=ingredientsByCompletion.get(completion.id)||{},deducted=movementsByCompletion.get(completion.id)||{};for(const foodId of Object.keys(usage))if(!Object.hasOwn(deducted,foodId))deducted[foodId]=0;const entry={rid:completion.recipe_id_snapshot,usage,deducted,shortfall:shortfallByCompletion.get(completion.id)||{},operationId:completion.operation_id,completedAt:completion.completed_at};if(completion.reversed_at){if(!reversedDoneByCycle.has(planned.cycle_id))reversedDoneByCycle.set(planned.cycle_id,{});reversedDoneByCycle.get(planned.cycle_id)[completion.operation_id]={...entry,mealKey,reversedAt:completion.reversed_at};continue}if(!doneByCycle.has(planned.cycle_id))doneByCycle.set(planned.cycle_id,{});doneByCycle.get(planned.cycle_id)[mealKey]=entry}
 const allMovements=data.movements.slice().sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at))).map(move=>{
  const sourceCompletion=move.source_completion_id?completionById.get(move.source_completion_id):null;
  const reversalTarget=move.reverses_movement_id?movementById.get(move.reverses_movement_id):null;
  const parent=sourceCompletion|| (reversalTarget?.source_completion_id?completionById.get(reversalTarget.source_completion_id):null),planned=parent?plannedById.get(parent.planned_meal_id):null;
  return {operationId:move.operation_id,foodId:move.food_id,quantity:Number(move.quantity),kind:move.movement_kind==='reversal'?'meal_reversal':move.movement_kind,sourceId:planned?planned.meal_date+'#'+planned.slot:undefined,createdAt:move.created_at,note:move.note||undefined};
 });
 const sProfile=data.profile;
 s.profile=sanitizeProfile({sex:sProfile.sex,age:sProfile.age,height:sProfile.height_cm,weight:sProfile.reference_weight_kg,activity:sProfile.activity_level,goal:sProfile.goal,injury:sProfile.injury_recovery,autoPortions:sProfile.auto_portions,followWeight:sProfile.follow_weight,manualRmr:sProfile.manual_rmr_kcal});
 s.profileConfirmed=sProfile.profile_confirmed===true;
 if(active){s.noActiveCycle=false;s.activeCycleId=active.id;s.start=active.start_date;s.activeMenus=menuOf.get(active.id);s.activeMenuCatalogVersion=active.catalog_version;s.activeMenuGeneratedAt=active.generated_at;s.activeMenuConfirmedAt=active.confirmed_at;s.activeMenuRecoveryFocus=!!active.recovery_focus;s.done=doneByCycle.get(active.id)||{};s.reversedDone=reversedDoneByCycle.get(active.id)||{};s.prep=prepOf.get(active.id)||{}}
 else{s.noActiveCycle=true;s.activeCycleId=null;s.start=isoDate(today());s.activeMenus=null;s.activeMenuCatalogVersion=null;s.activeMenuGeneratedAt=null;s.activeMenuConfirmedAt=null;s.activeMenuRecoveryFocus=false;s.done={};s.prep={}}
 s.movements=allMovements;s.stock={};rebuildStock(s);
 s.purchases=allMovements.filter(x=>x.kind==='purchase'&&x.quantity>0).slice(-2500).map(x=>({id:x.foodId,amount:x.quantity,date:x.createdAt,operationId:x.operationId}));
 s.weights=data.weights.map(x=>({date:x.measured_on,kg:Number(x.weight_kg)})).sort((a,b)=>a.date.localeCompare(b.date));
 s.activitySessions=data.activities.slice().sort((a,b)=>String(a.session_date).localeCompare(String(b.session_date))||String(a.created_at).localeCompare(String(b.created_at))).slice(-2000).map(x=>({id:x.client_id||x.id,date:x.session_date,activityId:x.activity_code,met:Number(x.met_value),durationMinutes:Number(x.duration_minutes),createdAt:x.created_at}));
 s.legacyStrengthDays=Object.fromEntries(data.training.map(x=>[x.training_date,true]));
 const allArchived=data.cycles.filter(x=>x.status==='archived').sort((a,b)=>String(a.archived_at||a.created_at).localeCompare(String(b.archived_at||b.created_at))),toArchiveState=c=>({cycleId:c.id,start:c.start_date,done:doneByCycle.get(c.id)||{},reversedDone:reversedDoneByCycle.get(c.id)||{},legacyStrengthDays:{},prep:prepOf.get(c.id)||{},menus:menuOf.get(c.id),catalogVersion:c.catalog_version,archivedAt:c.archived_at||c.created_at,generatedAt:c.generated_at,confirmedAt:c.confirmed_at,recoveryFocus:!!c.recovery_focus});
 const archiveCache=new Map();for(const cycle of allArchived){const cached=toArchiveState(cycle);if(isUuid(cycle.id)&&validMenuSnapshot(cached.menus,true))archiveCache.set(cycle.id,cached)}if(getUserId())archivedCyclesByUser.set(getUserId(),archiveCache);
 const archived=allArchived.slice(-6);s.archives=archived.map(toArchiveState);
 const toPlan=c=>c?({start:c.start_date,menus:menuOf.get(c.id),locked:locksOf.get(c.id),catalogVersion:c.catalog_version,generatedAt:c.generated_at,confirmedAt:c.confirmed_at,recoveryFocus:!!c.recovery_focus}):null;
 s.nextMenu=toPlan(data.cycles.find(x=>x.status==='scheduled'));s.plannerDraft=toPlan(data.cycles.find(x=>x.status==='draft'));
 const shopping=data.shoppingSessions.find(x=>x.status==='open');
 if(shopping){for(const item of data.shoppingItems.filter(x=>x.session_id===shopping.id)){if(item.item_kind==='planned')s.cart[item.item_key]={count:Number(item.package_count),size:Number(item.package_size),checked:!!item.is_checked};else{const parts=String(item.item_key||'').split(':'),scope=parts.length===4?parts[1]:'current';s.cartExtras.push({id:item.food_id,count:Number(item.package_count),size:Number(item.package_size),...(scope==='current'?{}:{scope})})}}}
 s.lastBackupAt=data.settings?.last_backup_at||null;s.deletedWeightDates=[];s.deletedActivitySessionIds=[];
 const cleaned=cleanState(s);if(!cleaned)throw Error('Los datos recuperados de Supabase no pasan las validaciones locales. No he sustituido los datos de este navegador.');return cleaned;
}
  return { buildCloudSnapshot, stateFromCloud };
}
