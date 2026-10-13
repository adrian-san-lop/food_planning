import { addDays, civilDayOfMonth, dateDiff, dateFromISO, formatDate, formatMadridDateTime, isoDate, monday, today } from './domain/dates.js?v=20261013-ux-repair';
import { loadCatalogs as fetchCatalogs } from './data/catalogs.js?v=20261013-ux-repair';
import { createInventoryUnitService } from './domain/inventory-units.js?v=20261013-ux-repair';
import { createRecipeProposalExport, serializeRecipeProposalExport } from './domain/recipe-proposal-export.js?v=20261013-admin-proposal-maintenance';
import { createReconciliationBase, reconcileStates } from './domain/state-reconciliation.js?v=20261013-ux-repair';
import { loadLocalState, saveLocalState } from './persistence/local-state.js?v=20261013-ux-repair';
import { createSupabaseTransport } from './persistence/supabase-transport.js?v=20261013-ux-repair';
import { createRecipeProposalService } from './persistence/recipe-proposals.js?v=20261013-admin-proposal-maintenance';
import { escapeAttribute, escapeHTML } from './ui/html.js?v=20261013-ux-repair';
const DAYS=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const SHORT=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const SLOTS=['Desayuno','Media mañana','Comida','Media tarde','Cena'];
const SLOT_TYPES=['desayuno','media','comida','tarde','cena'];
const SLOT_ICONS=['sun','coffee','utensils','apple','moon'];
const NAV=[['inicio','Inicio','home'],['perfil','Mi perfil','weight'],['semana','Menú 3 semanas','calendar'],['recetas','Recetario','chef'],['compra','Compra dinámica','cart'],['despensa','Mi despensa','leaf'],['evolucion','Actividad y peso','chart'],['guia','Consejos y ajustes','info']];
const PROPOSAL_NAV=[['proponer','Proponer receta','chef'],['admin','Revisar propuestas','chef']];
const ICONS={home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',chef:'<path d="M6 13a4 4 0 0 1-1-7 4.5 4.5 0 0 1 8-2 4 4 0 0 1 6 6 4 4 0 0 1-1 3"/><path d="M6 13v7h12v-7M6 17h12"/>',cart:'<circle cx="9" cy="20" r="1"/><circle cx="19" cy="20" r="1"/><path d="M2 3h2l3 13h13l2-10H5"/>',chart:'<path d="M3 3v18h18M7 15l4-5 3 3 6-8"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 18v3h16v-3"/>',upload:'<path d="M12 17V4m-5 5 5-5 5 5M4 17v4h16v-4"/>',check:'<path d="m5 12 5 5L20 7"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',flame:'<path d="M12 22c5-1 8-4 8-8 0-3-2-6-4-8 0 4-3 5-4 6 0-3-1-6-4-9 0 6-4 8-4 13 0 4 3 6 8 6Z"/>',muscle:'<path d="M3 14c3-1 5-2 6-6 2-2 5-1 5 1v3l2-2c2-2 5 1 4 3-2 5-6 8-12 8-3 0-5-3-5-7z"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',arrow:'<path d="M4 12h16m-7-7 7 7-7 7"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',coffee:'<path d="M4 8h12v7a5 5 0 0 1-10 0V8M16 9h2a3 3 0 0 1 0 6h-2M2 21h17"/>',utensils:'<path d="M4 3v6a3 3 0 0 0 6 0V3M7 3v18M18 3c-3 3-3 7 0 10v8"/>',apple:'<path d="M12 7c-2-3-8-3-9 3-1 5 3 11 6 11 2 0 2-1 3-1s1 1 3 1c3 0 7-6 6-11-1-6-7-6-9-3Zm0-2c0-2 2-4 4-4"/>',moon:'<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>',spark:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>',leaf:'<path d="M20 3C11 3 5 7 5 14a7 7 0 0 0 7 7c7 0 10-9 8-18ZM4 20c4-7 9-11 16-14"/>',weight:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M9 10a4 4 0 0 1 6 0l-3 4z"/>',trash:'<path d="M4 6h16M9 6V4h6v2M7 6l1 15h8l1-15M10 10v8m4-8v8"/>',printer:'<path d="M6 9V3h12v6M6 18H4V9h16v9h-2M6 15h12v6H6z"/>',reset:'<path d="M3 12a9 9 0 1 0 3-7l-3 3M3 3v5h5"/>',plus:'<path d="M12 5v14M5 12h14"/>',more:'<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>'};
function ic(name){return '<span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24">'+(ICONS[name]||ICONS.leaf)+'</svg></span>'}
let FOOD={};
let RECIPES=[];
const WEEK_1=[
 ['yogur_platano','tostada_queso','arroz_pollo','yogur_nueces','merluza_patatas'],
 ['huevos_pan_kiwi','yogur_manzana','lentejas_huevo','hummus_zanahoria','pasta_pavo'],
 ['yogur_avena_rojos','bocadillo_pavo','salmon_patata','yogur_naranja','tortilla_atun'],
 ['yogur_kiwi','yogur_pera','ensalada_garbanzos','hummus_zanahoria','pollo_boniato'],
 ['yogur_rojos_nueces','bocadillo_pavo_peq','pasta_pavo_champi','yogur_fruta','fajitas_pollo'],
 ['huevos_pan_kiwi','yogur_platano_simple','pollo_boniato_ensalada','griego_nueces','sardinas_tostas'],
 ['yogur_avena_manzana','naranja_almendras','arroz_gambas','yogur_fruta','crema_tortilla']
];

const WEEK_2=[
 ['yogur_pera_nueces','yogur_kiwi_ligero','bacalao_pisto','mini_pavo_tomate','alubias_huevo'],
 ['tostada_huevo_pavo','yogur_kiwi_ligero','pavo_arroz_tomate','pera_nueces_ligero','gulas_gambas'],
 ['tostada_aguacate_huevo','yogur_kiwi_ligero','garbanzos_bacalao','mandarina_almendras','wok_pollo_fideos'],
 ['yogur_cacao_platano','mini_pavo_tomate','quinoa_salmon','hummus_ligero','tortilla_patata_atun'],
 ['yogur_manzana_canela','huevo_fruta','alubias_pavo','yogur_fruta_ligero','cuscus_merluza'],
 ['huevos_pan_kiwi','snack_kiwi_skyr','pasta_atun_ensalada','yogur_nueces','pollo_esparragos'],
 ['yogur_avena_rojos','hummus_ligero','arroz_gambas_guisantes','mini_pavo_tomate','crema_calabaza_pavo']
];
const WEEK_3=[
 ['yogur_cacao_kiwi','yogur_kiwi_ligero','pavo_curry_arroz','mini_pavo_tomate','caballa_patatas'],
 ['yogur_avena_rojos','yogur_fruta_ligero','lentejas_caballa','hummus_ligero','cuscus_pollo'],
 ['yogur_avena_rojos','mini_pavo_tomate','pasta_salmon_espinacas','mandarina_almendras','huevos_alubias'],
 ['yogur_miel_no','yogur_kiwi_ligero','pollo_garbanzos','yogur_fruta_ligero','trucha_patatas'],
 ['yogur_avena_rojos','huevo_fruta','fideos_gambas','yogur_fruta_ligero','wrap_pavo'],
 ['tostada_huevo_pavo','yogur_kiwi_ligero','hamburguesa_pavo','yogur_nueces','alubias_revuelto'],
 ['yogur_avena_rojos','hummus_ligero','quinoa_salmon','mini_pavo_tomate','tortitas_atun']
];
const FIXED_MENUS=[WEEK_1,WEEK_2,WEEK_3];
let MENUS=FIXED_MENUS;
let REC={};
let CATALOG={};




const PREP=[['dom1','Domingo: lavar y cortar verdura para los próximos días'],['dom2','Domingo: preparar huevos cocidos y crema de verduras si toca'],['dom3','Domingo: repartir y congelar carnes y pescados para días posteriores'],['mie1','Miércoles: repasar fruta y verdura fresca restante'],['mie2','Miércoles: descongelar de forma segura las proteínas de jueves y viernes'],['mie3','Miércoles: generar la compra para próximos siete días']];

// Mi plan saludable — versión estática para publicar en GitHub Pages.
let FOOD_META={};
let catalogVersion='';
const RECOVERY_TAGS=new Set(['calcium','vitamin_d','vitamin_c']);
const RECOVERY_TAG_LABELS={calcium:'calcio',vitamin_d:'vitamina D',vitamin_c:'vitamina C'};
async function loadCatalogs(){
 const loaded=await fetchCatalogs({slotTypes:SLOT_TYPES,recoveryTags:RECOVERY_TAGS});
 FOOD_META=loaded.foodMeta;FOOD=loaded.foods;RECIPES=loaded.recipes;REC=loaded.recipeById;CATALOG=loaded.catalog;catalogVersion=loaded.catalogVersion;
 if(!validMenuSnapshot(FIXED_MENUS,true))throw new Error('El menú actual no coincide con los tipos de receta del catálogo.');
}
function recipeRecoveryTags(recipe){const tags=new Set();for(const item of recipe?.ingredients||[])for(const tag of FOOD_META[item.id]?.recoveryTags||[])tags.add(tag);return tags}
function recoveryRecipeScore(recipe,profile=state.profile){if(!profile?.injury)return 0;const tags=recipeRecoveryTags(recipe);return (tags.has('calcium')?1.15:0)+(tags.has('vitamin_d')?1.2:0)+(tags.has('vitamin_c')?0.45:0)}
function recoveryDayScore(recipes,profile=state.profile){if(!profile?.injury)return 0;const counts={calcium:0,vitamin_d:0,vitamin_c:0};for(const recipe of recipes)for(const tag of recipeRecoveryTags(recipe))counts[tag]++;return (counts.calcium?1.5:0)+(counts.vitamin_d?1.5:0)+(counts.vitamin_c?1:0)+(counts.calcium>1?0.35:0)}
function plannerRecoveryCoverage(menus){const totals={calcium:0,vitamin_d:0,vitamin_c:0};for(const week of menus)for(const day of week){const tags=new Set(day.flatMap(id=>[...recipeRecoveryTags(REC[id])]));for(const tag of Object.keys(totals))if(tags.has(tag))totals[tag]++}return totals}
const SUPABASE_URL='https://vkcedxvnmbmrmwvanznx.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_agL7NqBqKBDiBMUmIw78MQ_rBvvT_Dr';
const LOCAL_STATE_KEY='mi_plan_saludable_v3_13oct';
let KEY=LOCAL_STATE_KEY; // La copia de trabajo local se separa por cuenta
let supabaseClient=null,authMode='login',authBusy=false,authMessage='',authMessageType='info';
let authSessionUserId=null,currentUserId=null,currentUserEmail='',appReadyUserId=null,openingUserId=null;
const supabaseTransport=createSupabaseTransport({getClient:()=>supabaseClient,getUserId:()=>currentUserId});
const recipeProposalService=createRecipeProposalService({getClient:()=>supabaseClient});
let cloudReady=false,cloudRevision=0,cloudSyncTimer=null,cloudSyncInFlight=false,cloudSyncPending=false,cloudSyncLastError=null,cloudSyncRetryTask='sync',cloudRefreshInFlight=false,lastCloudRefreshAt=0;
let menukiAdmin=false,proposalInbox=[],proposalInboxLoaded=false,proposalInboxLoading=false,proposalInboxBusy=false,proposalExporting=false,proposalExportToken=0,proposalInboxError='';
let proposalEditingId=null,proposalEditingDraft=null,proposalActionToken=0,proposalLoadToken=0;
const PROPOSAL_LIMITS={name:120,ingredient:160,step:500,items:30};
function newRecipeProposalDraft(){return {mealType:'desayuno',name:'',ingredients:[''],steps:['']}}
function newRecipeProposalClientId(){const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;return [...bytes].map((byte,index)=>[4,6,8,10].includes(index)?'-'+byte.toString(16).padStart(2,'0'):byte.toString(16).padStart(2,'0')).join('')}
let recipeProposalDraft=newRecipeProposalDraft(),recipeProposalClientId=newRecipeProposalClientId(),recipeProposalSubmitting=false;
const SYNC_META_PREFIX=LOCAL_STATE_KEY+':sync:user:';
let passwordRecoveryActive=false,catalogsLoaded=false,catalogsPromise=null;
const FIRST_CYCLE_START='2026-10-13';
const WEEK_TITLES=['Equilibrio y primeras recetas','Más variedad sin complicaciones','Nuevas ideas para terminar fuerte'];
let persistent=true;
function initialStart(){return FIRST_CYCLE_START}
function emptyState(){return {v:8,start:initialStart(),noActiveCycle:false,profile:defaultProfile(),profileConfirmed:false,cart:{},cartExtras:[],done:{},legacyStrengthDays:{},activitySessions:[],deletedActivitySessionIds:[],stock:{},movements:[],purchases:[],weights:[],deletedWeightDates:[],resetCloudPending:false,prep:{},archives:[],activeMenus:null,activeMenuCatalogVersion:null,activeMenuGeneratedAt:null,activeMenuConfirmedAt:null,activeMenuRecoveryFocus:false,nextMenu:null,plannerDraft:null,lastBackupAt:null}}
function mealUsage(recipe){const ans={};for(const item of recipe.ingredients)ans[item.id]=(ans[item.id]||0)+item.rest;return ans}
// Valores de ejemplo no personales; se pueden editar desde «Mi perfil».
const DEFAULT_PROFILE={sex:'manual',age:30,height:170,weight:70,activity:'low',goal:'maintain',injury:false,autoPortions:true,followWeight:false,manualRmr:1600};
function defaultProfile(){return {...DEFAULT_PROFILE}}
function sanitizeProfile(raw){
 const p={...defaultProfile(),...(raw&&typeof raw==='object'?raw:{})};
 delete p.trainingBonus;
 if(!['male','female','manual'].includes(p.sex))p.sex='male';
 if(!['very_low','low','medium','high'].includes(p.activity))p.activity='very_low';
 if(!['maintain','recomp','fat_loss','muscle_gain'].includes(p.goal))p.goal='maintain';
 for(const [id,min,max] of [['age',18,95],['height',125,220],['weight',35,250],['manualRmr',800,3500]]){
  let v=Number(p[id]);p[id]=Number.isFinite(v)?Math.max(min,Math.min(max,v)):DEFAULT_PROFILE[id];
 }
 p.injury=p.injury===true;p.autoPortions=p.autoPortions!==false;p.followWeight=p.followWeight!==false;
 return p;
}
function effectiveWeight(profile=state.profile){
 if(profile.followWeight&&state.weights.length){const recent=[...state.weights].filter(x=>dateFromISO(x.date)&&dateFromISO(x.date)<=today()).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);if(recent.length)return Math.round(recent.reduce((n,x)=>n+Number(x.kg),0)/recent.length*10)/10}
 return profile.weight;
}
const ACTIVITY_FACTORS={very_low:1.20,low:1.30,medium:1.40,high:1.52};
const GOAL_NAMES={maintain:'Mantener peso',recomp:'Perder grasa y mantener músculo',fat_loss:'Reducir grasa',muscle_gain:'Ganar masa muscular'};
const ACTIVITY_OPTIONS=[
 {id:'strength-standard',label:'Fuerza · rutina habitual (3,5 MET)',met:3.5},
 {id:'strength-vigorous',label:'Fuerza · sesión vigorosa (6 MET)',met:6},
 {id:'running-8kph',label:'Carrera · ritmo aprox. 8 km/h (8,5 MET)',met:8.5},
 {id:'running-10kph',label:'Carrera · ritmo aprox. 10 km/h (9,3 MET)',met:9.3},
 {id:'football-recreational',label:'Fútbol · recreativo (7 MET)',met:7},
 {id:'football-competitive',label:'Fútbol · competitivo (9,5 MET)',met:9.5},
 {id:'surf-recreational',label:'Surf · sesión general (3 MET)',met:3},
 {id:'surf-paddling',label:'Surf · remo intenso (6,8 MET)',met:6.8},
 {id:'skating-recreational',label:'Patinaje en línea · recreativo (7,5 MET)',met:7.5},
 {id:'skating-training',label:'Patinaje en línea · entrenamiento moderado (9,8 MET)',met:9.8},
 {id:'cycling-easy',label:'Ciclismo · paseo suave (4,3 MET)',met:4.3},
 {id:'cycling-moderate',label:'Ciclismo · ritmo moderado (7 MET)',met:7},
 {id:'cycling-vigorous',label:'Ciclismo · vigoroso (9 MET)',met:9},
 {id:'other-moderate',label:'Otra actividad · referencia moderada (3,5 MET)',met:3.5}
];
const ACTIVITY_BY_ID=Object.fromEntries(ACTIVITY_OPTIONS.map(x=>[x.id,x]));
function nutritionProfile(p=state.profile,overrideWeight){
 const weight=overrideWeight??effectiveWeight(p);
 const rmr=p.sex==='manual'?p.manualRmr:10*weight+6.25*p.height-5*p.age+(p.sex==='male'?5:-161);
 const maintenance=rmr*ACTIVITY_FACTORS[p.activity];
 return {weight,rmr,maintenance};
}
function nutritionTarget(activityKcal=0,p=state.profile,overrideWeight){
 const data=nutritionProfile(p,overrideWeight),weight=data.weight;
 const goals={maintain:1,recomp:p.injury?1:.97,fat_loss:p.injury?.95:.88,muscle_gain:p.injury?1.02:1.07};
 const factors={maintain:1.8,recomp:2.0,fat_loss:2.0,muscle_gain:1.9};
 const fatFactors={maintain:.85,recomp:.85,fat_loss:.8,muscle_gain:.9};
 const desiredKcal=data.maintenance*goals[p.goal];
 // Add only estimated net energy from completed sessions to the goal-adjusted daily baseline.
 const baseCalories=Math.round(Math.max(data.rmr*1.10,desiredKcal)/10)*10;
 const addedActivityKcal=Math.max(0,Number(activityKcal)||0);
 const calories=Math.round((baseCalories+addedActivityKcal)/10)*10;
 const protein=Math.round(weight*factors[p.goal]);
 const fat=Math.round(weight*fatFactors[p.goal]);
 const carb=Math.max(0,Math.round((calories-protein*4-fat*9)/4));
 return {...data,calories,baseCalories,activityKcal:addedActivityKcal,protein,fat,carb,maintain:data.maintenance,injuryLimited:p.injury&&['recomp','fat_loss','muscle_gain'].includes(p.goal)};
}
const PROTEIN_PORTIONS=new Set(['skyr','greek','cheese','chicken','turkey','turkeySlice','hake','cod','salmon','trout','shrimp','tuna','sardines','mackerel','gulas','tofuFirm','tempeh','edamame','soyProteinTextured','porkTenderloin','beefSirloin','turkeyMince','cottageCheese']);
const CARB_PORTIONS=new Set(['granola','oats','bread','rice','pasta','tortilla','quinoa','couscous','noodles','potato','sweetpotato','raisins','cornCanned']);
const FAT_PORTIONS=new Set(['oliveoil','walnuts','almonds','peanuts','avocado','chiaSeeds','pumpkinSeeds','tahini']);
const limit=(value,min,max)=>Math.max(min,Math.min(max,value));
function getMacro(usage){const m={k:0,p:0,c:0,f:0};for(const [id,amount] of Object.entries(usage)){
 const f=FOOD[id];if(!f)continue;const n=f[1]==='ud'?amount:amount/100;
 m.k+=f[2]*n;m.p+=f[3]*n;m.c+=f[4]*n;m.f+=f[5]*n;
 }return m;}
function scaleIngredient(amount,id,factor){
 const raw=amount*factor;
 const roundTo=FOOD[id]?.[1]==='ud' ? .25 : id==='oliveoil' ? 1 : (id==='potato'||id==='sweetpotato'?10:5);
 return Math.max(roundTo,Math.round(raw/roundTo)*roundTo);
}
// Se generan las 5 ingestas juntas para adaptar proteína, grasa e hidratos.
// Solo cambian raciones, nunca verduras/frutas por defecto ni ingredientes de una receta.
// Las comidas ya registradas conservarán sus cantidades originales mediante state.done.
function portionsForRecipes(recipes,activityKcal=0,profile=state.profile,previewWeight,fixedUsages=[]){
  const portions=recipes.map((r,index)=>fixedUsages[index]
   ?Object.entries(fixedUsages[index]).map(([id,amount])=>({id,amount:Number(amount)||0,fixed:true}))
   :r.ingredients.map(it=>({id:it.id,amount:it.rest,fixed:false})));
 if(!profile.autoPortions)return portions.map(items=>Object.fromEntries(items.map(x=>[x.id,x.amount])));
 const target=nutritionTarget(activityKcal,profile,previewWeight);
 const macro=items=>items.reduce((out,item)=>{const f=FOOD[item.id],v=f[1]==='ud'?item.amount:item.amount/100;out.k+=f[2]*v;out.p+=f[3]*v;out.f+=f[5]*v;return out},{k:0,p:0,f:0});
  const all=portions.flat(),fixed=all.filter(x=>x.fixed),adjustable=all.filter(x=>!x.fixed);
  const fixedProtein=macro([...fixed,...adjustable.filter(x=>!PROTEIN_PORTIONS.has(x.id))]).p;
  const variableProtein=macro(adjustable.filter(x=>PROTEIN_PORTIONS.has(x.id))).p;
 const proteinMultiplier=limit(variableProtein>0?(target.protein-fixedProtein)/variableProtein:1,.60,1.65);
  for(const item of adjustable)if(PROTEIN_PORTIONS.has(item.id))item.amount=scaleIngredient(item.amount,item.id,proteinMultiplier);
  const fixedFat=macro([...fixed,...adjustable.filter(x=>!FAT_PORTIONS.has(x.id))]).f;
  const variableFat=macro(adjustable.filter(x=>FAT_PORTIONS.has(x.id))).f;
 const fatMultiplier=limit(variableFat>0?(target.fat-fixedFat)/variableFat:1,.65,1.55);
  for(const item of adjustable)if(FAT_PORTIONS.has(item.id))item.amount=scaleIngredient(item.amount,item.id,fatMultiplier);
  const after=macro(all),carbKcal=macro(adjustable.filter(x=>CARB_PORTIONS.has(x.id))).k;
 const carbMultiplier=limit(carbKcal>0?1+(target.calories-after.k)/carbKcal:1,.52,1.90);
  for(const item of adjustable)if(CARB_PORTIONS.has(item.id))item.amount=scaleIngredient(item.amount,item.id,carbMultiplier);
 return portions.map(items=>{const o={};for(const x of items)o[x.id]=(o[x.id]||0)+x.amount;return o});
}
function planPortions(week,day,profile=state.profile,previewWeight){const date=dateISOAt(week,day),fixed=MENUS[week][day].map((_,slot)=>state.done[mealKey(week,day,slot)]?.usage||null);return portionsForRecipes(MENUS[week][day].map(id=>REC[id]),activityEnergyForDate(date,profile,previewWeight),profile,previewWeight,fixed)}
function recipeUsage(day,slot,week=visibleWeek){const key=mealKey(week,day,slot);if(state.done[key]?.usage)return state.done[key].usage;return planPortions(week,day)[slot]}
function safeWeightList(input){return Array.isArray(input)?input.filter(w=>dateFromISO(w.date)&&Number.isFinite(Number(w.kg))&&Number(w.kg)>=30&&Number(w.kg)<=250).slice(-1500).map(w=>({date:w.date,kg:Number(w.kg)})):[]}
function safeActivitySessions(input){if(!Array.isArray(input))return [];const seen=new Set();return input.filter(s=>{if(!s||typeof s.id!=='string'||!s.id||seen.has(s.id)||!dateFromISO(s.date)||s.date>isoDate(today())||typeof s.activityId!=='string'||!s.activityId)return false;const duration=Number(s.durationMinutes),met=Number(s.met);if(!Number.isInteger(duration)||duration<1||duration>600||Number.isFinite(met)&&(met<1||met>20))return false;seen.add(s.id);return true}).slice(-2000).map(s=>({id:s.id,date:s.date,activityId:s.activityId,met:Number.isFinite(Number(s.met))?Number(s.met):(ACTIVITY_BY_ID[s.activityId]?.met||1),durationMinutes:Number(s.durationMinutes),createdAt:typeof s.createdAt==='string'?s.createdAt:new Date().toISOString()}))}
function activitySessionsForDate(date){return (state?.activitySessions||[]).filter(s=>s.date===date)}
function activityEnergyForDate(date,profile=state?.profile||DEFAULT_PROFILE,weightOverride){const weight=weightOverride??effectiveWeight(profile);return Math.round(activitySessionsForDate(date).reduce((sum,s)=>sum+Math.max(0,Number(s.met)-1)*weight*Number(s.durationMinutes)/60,0))}
function activitySessionEnergy(s){return Math.max(0,(Number(s.met)-1)*effectiveWeight()*Number(s.durationMinutes)/60)}
function activityLabel(id){return ACTIVITY_BY_ID[id]?.label||'Actividad'}
function activityOptionsMarkup(){return ACTIVITY_OPTIONS.map(x=>'<option value="'+escapeAttribute(x.id)+'">'+escapeHTML(x.label)+'</option>').join('')}
let activityHistoryLimit=12;
function activityHistoryPanel(){const all=[...(state.activitySessions||[])].sort((a,b)=>b.date.localeCompare(a.date)||String(b.createdAt).localeCompare(String(a.createdAt))),rows=all.slice(0,activityHistoryLimit),remaining=all.length-rows.length;return '<section class="panel activity-history" aria-labelledby="activityHistoryTitle"><div class="section-head"><div><h2 id="activityHistoryTitle">Sesiones de actividad</h2><p>Registro de actividad realizada. Puedes eliminar una sesión si la anotaste por error.</p></div><button class="btn btn-primary" data-action="activity-open">'+ic('plus')+' Registrar sesión</button></div>'+(rows.length?'<div class="activity-log-list">'+rows.map(s=>'<div class="activity-log-row"><div><strong>'+escapeHTML(s.date)+' · '+escapeHTML(activityLabel(s.activityId))+'</strong><small>'+escapeHTML(s.durationMinutes)+' min · '+nformat(activitySessionEnergy(s))+' kcal netas estimadas</small></div><button type="button" class="btn btn-quiet btn-danger activity-delete-button" data-action="delete-activity" data-id="'+escapeAttribute(s.id)+'" aria-label="Eliminar sesión de '+escapeAttribute(s.date)+' · '+escapeAttribute(activityLabel(s.activityId))+'">'+ic('trash')+'<span>Eliminar sesión</span></button></div>').join('')+'</div>'+(remaining?'<button type="button" class="btn activity-history-more" data-action="activity-history-more">Ver más sesiones ('+remaining+')</button>':''):'<div class="empty">Aún no has registrado sesiones. Usa «Registrar sesión» después de hacer actividad.</div>')+'</section>'}
const roundAmount=value=>Math.round(Number(value||0)*100)/100;
const inventoryUnitService=createInventoryUnitService({getFoodMeta:()=>FOOD_META,getFood:()=>FOOD,roundAmount});
const {foodStockUnit,foodRecipeUnit,foodPieceWeight,recipeToStockAmount,stockToRecipeAmount,normalizeQuantityMap,convertLegacyPack}=inventoryUnitService;
function normalizeDoneEntries(entries,sourceVersion){
 const out={};
 for(const [key,entry] of Object.entries(entries||{})){
  if(!entry||typeof entry!=='object')continue;
  const oldUsage=entry.usage&&typeof entry.usage==='object'?entry.usage:{};
  const usage=normalizeQuantityMap(oldUsage,(id,value)=>sourceVersion>=6&&sourceVersion<8?stockToRecipeAmount(id,value):value);
   const hasDeducted=entry.deducted&&typeof entry.deducted==='object';
   const deductedSource=hasDeducted?entry.deducted:(sourceVersion===5?{}:sourceVersion>=8?usage:oldUsage);
   const convertDeducted=sourceVersion===5||(!hasDeducted&&sourceVersion>=8)?recipeToStockAmount:(id,value)=>value;
   const deducted=normalizeQuantityMap(deductedSource,convertDeducted);
   const shortfall=sourceVersion===5?Object.fromEntries(Object.entries(usage).map(([id,value])=>[id,roundAmount(Math.max(0,recipeToStockAmount(id,value)-Number(deducted[id]||0)))]).filter(([,value])=>value>.001)):normalizeQuantityMap(entry.shortfall,(id,value)=>value);
  out[key]={...entry,operationId:entry.operationId||'v'+sourceVersion+'-meal:'+key,usage,deducted,shortfall,...(sourceVersion<8?{legacySnapshot:true}:{})};
 }
 return out;
}
function rebuildStock(target){const totals={};for(const move of target.movements||[]){if(!FOOD[move.foodId])continue;totals[move.foodId]=(totals[move.foodId]||0)+Number(move.quantity||0)}target.stock={};for(const [id,value] of Object.entries(totals)){const amount=roundAmount(value);if(Math.abs(amount)>.001)target.stock[id]=amount}}
function cloneMenus(menus){return menus.map(week=>week.map(day=>day.slice()))}
function slotTypeCompatible(type,slot,allowSnackInterchange=false){return type===SLOT_TYPES[slot]||(allowSnackInterchange&&[1,3].includes(slot)&&['media','tarde'].includes(type))}
function validMenuSnapshot(menus,allowSnackInterchange=false){return Array.isArray(menus)&&menus.length===3&&menus.every(week=>Array.isArray(week)&&week.length===7&&week.every(day=>Array.isArray(day)&&day.length===5&&day.every((id,slot)=>typeof id==='string'&&slotTypeCompatible(REC[id]?.type,slot,allowSnackInterchange))))}
function emptyLocks(){return Array.from({length:3},()=>Array.from({length:7},()=>Array(5).fill(false)))}
function cleanCyclePlan(raw){if(!raw||typeof raw!=='object'||!dateFromISO(raw.start)||!validMenuSnapshot(raw.menus)||typeof raw.catalogVersion!=='string')return null;const locked=emptyLocks();if(Array.isArray(raw.locked)&&raw.locked.length===3){for(let w=0;w<3;w++)for(let d=0;d<7;d++)for(let s=0;s<5;s++)locked[w][d][s]=!!raw.locked?.[w]?.[d]?.[s]}return {start:raw.start,menus:cloneMenus(raw.menus),locked,catalogVersion:raw.catalogVersion,recoveryFocus:raw.recoveryFocus===true,generatedAt:typeof raw.generatedAt==='string'?raw.generatedAt:new Date().toISOString(),confirmedAt:typeof raw.confirmedAt==='string'?raw.confirmedAt:null}}
function cleanState(obj){
  if(!obj||typeof obj!=='object')return null;
  if(![5,6,7,8].includes(obj.v)||!dateFromISO(obj.start)||!obj.done||typeof obj.done!=='object'||!obj.stock||typeof obj.stock!=='object'||Object.keys(obj.done).length>3000)return null;
  const s=emptyState();
  s.profile=sanitizeProfile(obj.profile);
  s.profileConfirmed=obj.profileConfirmed===true;
  s.start=obj.start;
  s.noActiveCycle=obj.noActiveCycle===true;
  const fromV5=obj.v===5;
  s.done=normalizeDoneEntries(obj.done,obj.v);
  s.legacyStrengthDays=obj.legacyStrengthDays&&typeof obj.legacyStrengthDays==='object'?obj.legacyStrengthDays:(obj.strength&&typeof obj.strength==='object'?obj.strength:{});
  s.activitySessions=safeActivitySessions(obj.activitySessions);
  s.deletedActivitySessionIds=Array.isArray(obj.deletedActivitySessionIds)?[...new Set(obj.deletedActivitySessionIds.filter(x=>typeof x==='string'))].slice(-2000):[];
  s.cart=obj.cart&&typeof obj.cart==='object'?{...obj.cart}:{};
  s.cartExtras=Array.isArray(obj.cartExtras)?obj.cartExtras.filter(x=>x&&FOOD[x.id]&&Number.isFinite(+x.count)&&Number.isFinite(+x.size)).slice(-100).map(x=>({...x,...(fromV5?convertLegacyPack(x.id,x.count,x.size):{count:+x.count,size:+x.size})})):[];
  if(fromV5){
    for(const [key,choice] of Object.entries(s.cart)){const id=key.split(':').at(-1);if(foodPieceWeight(id)>0&&choice&&Number.isFinite(+choice.count)&&Number.isFinite(+choice.size))Object.assign(choice,convertLegacyPack(id,choice.count,choice.size))}
    s.movements=Object.entries(FOOD).flatMap(([id])=>{const amount=Number(obj.stock[id]||0);if(!Number.isFinite(amount)||amount<=0||amount>1000000)return [];const quantity=roundAmount(recipeToStockAmount(id,amount));return quantity>0?[{operationId:'v5-opening:'+id,foodId:id,quantity,kind:'opening',createdAt:new Date().toISOString(),note:'Saldo existente al actualizar desde v5'}]:[]});
  }else{
    const seen=new Set();
    s.movements=Array.isArray(obj.movements)?obj.movements.filter(move=>{if(!move||!FOOD[move.foodId]||typeof move.operationId!=='string'||!move.operationId||seen.has(move.operationId)||!Number.isFinite(Number(move.quantity))||Math.abs(Number(move.quantity))>1000000)return false;seen.add(move.operationId);return true}).map(move=>({...move,quantity:roundAmount(move.quantity)})):[];
  }
  s.weights=safeWeightList(obj.weights);
  s.deletedWeightDates=Array.isArray(obj.deletedWeightDates)?[...new Set(obj.deletedWeightDates.filter(dateFromISO))].slice(-1500):[];
  s.resetCloudPending=obj.resetCloudPending===true;
  s.purchases=Array.isArray(obj.purchases)?obj.purchases.slice(-2500).filter(p=>p&&FOOD[p.id]&&Number.isFinite(Number(p.amount))&&Number(p.amount)>0).map(p=>({...p,amount:fromV5?roundAmount(recipeToStockAmount(p.id,+p.amount)):+p.amount})):[];
  s.prep=obj.prep&&typeof obj.prep==='object'?obj.prep:{};
  s.archives=Array.isArray(obj.archives)?obj.archives.slice(-6).map(a=>a&&a.done&&typeof a.done==='object'?({...a,done:normalizeDoneEntries(a.done,obj.v)}):a):[];
  s.activeMenus=validMenuSnapshot(obj.activeMenus,true)?cloneMenus(obj.activeMenus):null;
  s.activeMenuCatalogVersion=s.activeMenus&&typeof obj.activeMenuCatalogVersion==='string'?obj.activeMenuCatalogVersion:null;
  s.activeMenuGeneratedAt=typeof obj.activeMenuGeneratedAt==='string'?obj.activeMenuGeneratedAt:null;
  s.activeMenuConfirmedAt=typeof obj.activeMenuConfirmedAt==='string'?obj.activeMenuConfirmedAt:null;
  s.activeMenuRecoveryFocus=obj.activeMenuRecoveryFocus===true;
  s.nextMenu=cleanCyclePlan(obj.nextMenu);
  s.plannerDraft=cleanCyclePlan(obj.plannerDraft);
  s.lastBackupAt=typeof obj.lastBackupAt==='string'?obj.lastBackupAt:null;
  rebuildStock(s);
  return s;
}
function load(){
 return loadLocalState({key:KEY,cleanState,emptyState,getStorage:()=>localStorage,onError:()=>{persistent=false}});
}
let state;
function save(){persistent=saveLocalState({key:KEY,state,getStorage:()=>localStorage});if(cloudReady)scheduleCloudSync()}
const cloudUuidCache=new Map();
function cloudUuid(kind,key){
 const cacheKey=currentUserId+'|'+kind+'|'+key;
 if(!cloudUuidCache.has(cacheKey))cloudUuidCache.set(cacheKey,(async()=>{
  const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(cacheKey))).slice(0,16);
  bytes[6]=(bytes[6]&15)|128;bytes[8]=(bytes[8]&63)|128;
  const hex=[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
  return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
 })());
 return cloudUuidCache.get(cacheKey);
}
function cloudStatus(message,level='idle'){
 const label=document.getElementById('cloudSyncStatus'),button=document.getElementById('cloudSyncButton');
 if(label){label.textContent=message;label.dataset.level=level}
 if(button){button.disabled=cloudSyncInFlight;button.textContent=cloudSyncInFlight?'Reintentando…':'Reintentar';button.hidden=level!=='error'||!cloudReady}

}
function cloudErrorForUser(error){
 const message=String(error?.message||'').replace(/\s+/g,' ').trim(),code=String(error?.code||'').trim();
 if(message.includes('REMOTE_DATA_EXISTS_RELOAD'))return 'Supabase ya tiene datos para esta cuenta, pero no consta la importación inicial. No se ha enviado la copia local para evitar sobrescribir esos datos. Código REMOTE_DATA_EXISTS_RELOAD.';
 if(message.includes('SYNC_CONFLICT')||code==='PT409'||code==='40001')return 'La revisión de Supabase cambió durante la sincronización. La copia local se conserva; vuelve a intentarlo para cargar el estado más reciente.';
 if(code==='PGRST202'||message.includes('schema cache'))return 'Supabase no encuentra la función de sincronización. Comprueba que la migración de sincronización se aplicó en el proyecto conectado.'+(code?' Código '+code+'.':'');
 const detail=[code?'código '+code:'',message].filter(Boolean).join(' · ').slice(0,320);
 return (detail?'Error de Supabase: '+detail+'. ':'No se recibió el detalle del error. ')+'La copia local se conserva.';
}
function cloudMetaKey(){return SYNC_META_PREFIX+(currentUserId||'')}
function readCloudMeta(){try{return JSON.parse(localStorage.getItem(cloudMetaKey())||'null')}catch{return null}}
function writeCloudMeta(revision,fingerprint,snapshot=null,baseState=null,replaceKnown=false){
 try{
  const previous=readCloudMeta()||{},movementOps=new Set(replaceKnown?[]:previous.movementOps||[]),completionOps=new Set(replaceKnown?[]:previous.completionOps||[]),activityIds=new Set(replaceKnown?[]:previous.activityIds||[]),weightValues=replaceKnown?{}:{...(previous.weightValues||{})};
  for(const row of snapshot?.movements||[])movementOps.add(row.operation_id);
  for(const row of snapshot?.completions||[])completionOps.add(row.operation_id);
  for(const row of snapshot?.activity_sessions||[])activityIds.add(row.client_id);
  for(const id of snapshot?.deleted_activity_ids||[])activityIds.delete(id);
  for(const row of snapshot?.weights||[])weightValues[row.measured_on]=Number(row.weight_kg);
  for(const date of snapshot?.deleted_weight_dates||[])delete weightValues[date];
  localStorage.setItem(cloudMetaKey(),JSON.stringify({revision:Number(revision)||0,fingerprint,movementOps:[...movementOps],completionOps:[...completionOps],activityIds:[...activityIds],weightValues,baseState:baseState?createReconciliationBase(baseState):previous.baseState||null,updatedAt:new Date().toISOString()}));
 }catch{persistent=false}
}
function reduceCloudSnapshot(snapshot,meta){
 if(Array.isArray(meta?.movementOps)){const known=new Set(meta.movementOps);snapshot.movements=snapshot.movements.filter(x=>!known.has(x.operation_id))}
 if(Array.isArray(meta?.completionOps)){const known=new Set(meta.completionOps);snapshot.completions=snapshot.completions.filter(x=>!known.has(x.operation_id)||!!x.reversed_at)}
 if(Array.isArray(meta?.activityIds)){const known=new Set(meta.activityIds);snapshot.activity_sessions=snapshot.activity_sessions.filter(x=>!known.has(x.client_id))}
 if(meta?.weightValues){snapshot.weights=snapshot.weights.filter(x=>Number(meta.weightValues[x.measured_on])!==Number(x.weight_kg))}
 return snapshot;
}
async function stateFingerprint(value=state){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))].map(x=>x.toString(16).padStart(2,'0')).join('')}
function saveLocalOnly(){persistent=saveLocalState({key:KEY,state,getStorage:()=>localStorage,updateEditedAt:false})}
function scheduleCloudSync(){if(!cloudReady)return;clearTimeout(cloudSyncTimer);cloudSyncTimer=setTimeout(()=>syncCloudNow(),700)}
function planDate(start,offset){return isoDate(addDays(dateFromISO(start),offset))}
function planLockAt(locked,week,day,slot){return !!locked?.[week]?.[day]?.[slot]}
async function buildCloudSnapshot(source=state){
 const definitions=[];
 const addCycle=(kind,key,start,menus,version,options={})=>{
  // The fixed menu intentionally interchanges the two snack slots; accept that
  // same compatibility when validating the active and archived cycles for sync.
  if(!dateFromISO(start)||!validMenuSnapshot(menus,true))throw Error('Hay un menú guardado incompleto o incompatible; conserva una copia y revisa su ciclo antes de sincronizar.');
  definitions.push({kind,key,start,menus:cloneMenus(menus),version:version||catalogVersion,...options});
 };
 const activeMenus=source.activeMenus?cloneMenus(source.activeMenus):cloneMenus(FIXED_MENUS);
 if(!source.noActiveCycle)addCycle('active','current',source.start,activeMenus,source.activeMenuCatalogVersion||catalogVersion,{prep:source.prep||{},done:source.done||{},generatedAt:source.activeMenuGeneratedAt||null,confirmedAt:source.activeMenuConfirmedAt||null,recoveryFocus:!!source.activeMenuRecoveryFocus});
 for(const [i,a] of (source.archives||[]).entries())if(a&&dateFromISO(a.start)&&validMenuSnapshot(a.menus,true))addCycle('archived','archive:'+a.start+':'+(a.archivedAt||i),a.start,a.menus,a.catalogVersion||catalogVersion,{prep:a.prep||{},done:a.done||{},archivedAt:a.archivedAt||new Date(a.start+'T12:00:00Z').toISOString(),generatedAt:a.generatedAt||null,confirmedAt:a.confirmedAt||null,recoveryFocus:!!a.recoveryFocus});
 if(source.nextMenu)addCycle('scheduled','next:'+source.nextMenu.start+':'+(source.nextMenu.generatedAt||''),source.nextMenu.start,source.nextMenu.menus,source.nextMenu.catalogVersion,{locked:source.nextMenu.locked,generatedAt:source.nextMenu.generatedAt||null,confirmedAt:source.nextMenu.confirmedAt||null,recoveryFocus:!!source.nextMenu.recoveryFocus});
 if(source.plannerDraft)addCycle('draft','draft:'+source.plannerDraft.start+':'+(source.plannerDraft.generatedAt||''),source.plannerDraft.start,source.plannerDraft.menus,source.plannerDraft.catalogVersion,{locked:source.plannerDraft.locked,generatedAt:source.plannerDraft.generatedAt||null,confirmedAt:source.plannerDraft.confirmedAt||null,recoveryFocus:!!source.plannerDraft.recoveryFocus});

 const cycles=[],plannedMeals=[],prepTasks=[],mealByKey=new Map(),cycleByKey=new Map();
 for(const def of definitions){
  const cycleId=await cloudUuid('cycle',def.start+':'+def.version+':'+JSON.stringify(def.menus));
  def.id=cycleId;cycleByKey.set(def.key,def);
  cycles.push({id:cycleId,start_date:def.start,status:def.kind,catalog_version:def.version,generated_at:def.generatedAt,confirmed_at:def.confirmedAt,recovery_focus:def.recoveryFocus,archived_at:def.archivedAt||null});
  for(let offset=0;offset<21;offset++)for(let slot=0;slot<5;slot++){
   const week=Math.floor(offset/7),day=offset%7,mealDate=planDate(def.start,offset),recipeId=def.menus[week]?.[day]?.[slot];
   if(!REC[recipeId])throw Error('El menú contiene una receta que no está en el catálogo: '+String(recipeId));
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
  const operationId=String(item.operationId||'legacy:'+key),rid=REC[item.rid]?item.rid:found.recipe_id;
  const previous=completionByOperation.get(operationId)||{operation_id:operationId,planned_meal_id:found.id,recipe_id_snapshot:rid,catalog_version:def.version,completed_at:item.completedAt||new Date().toISOString(),reversed_at:null,usage:{}};
  previous.usage={...previous.usage,...(item.usage||{})};completionByOperation.set(operationId,previous);
 }}
 for(const def of definitions)collectDone(def,def.done);
 const reversedAtFor=operationId=>source.movements?.find(m=>m.kind==='meal_reversal'&&String(m.operationId||'').startsWith('revert:'+operationId+':'))?.createdAt||null;
 for(const move of source.movements||[])if(move?.kind==='meal'&&move.sourceId){
  const suffix=':'+move.foodId;if(!String(move.operationId||'').endsWith(suffix))continue;
  const operationId=String(move.operationId).slice(0,-suffix.length),found=findMeal(move.sourceId);if(!found)continue;
  const previous=completionByOperation.get(operationId)||{operation_id:operationId,planned_meal_id:found.row.id,recipe_id_snapshot:found.row.recipe_id,catalog_version:found.def.version,completed_at:move.createdAt||new Date().toISOString(),reversed_at:null,usage:{}};
  previous.reversed_at=reversedAtFor(operationId);completionByOperation.set(operationId,previous);
 }
 const completions=[];
 for(const entry of completionByOperation.values()){
  const def=definitions.find(x=>x.id&&plannedMeals.some(m=>m.id===entry.planned_meal_id&&m.cycle_id===x.id));
  const recipe=REC[entry.recipe_id_snapshot],ingredients=[];
  for(const [foodId,quantity] of Object.entries(entry.usage||{}))if(FOOD[foodId]&&Number(quantity)>0){
   const index=Math.max(0,recipe?.ingredients?.findIndex(x=>x.id===foodId)??0);
   ingredients.push({ingredient_index:index,food_id:foodId,ingredient_name_snapshot:FOOD[foodId][0],quantity:Number(quantity),recipe_unit:foodRecipeUnit(foodId)});
  }
  completions.push({id:await cloudUuid('completion',entry.operation_id),planned_meal_id:entry.planned_meal_id,recipe_id_snapshot:entry.recipe_id_snapshot,catalog_version:entry.catalog_version||def?.version||catalogVersion,operation_id:entry.operation_id,completed_at:entry.completed_at,reversed_at:entry.reversed_at,ingredients});
 }
 const currentShortfall=new Map();
 for(const doneEntry of Object.values(source.done||{}))if(doneEntry?.operationId)currentShortfall.set(doneEntry.operationId,doneEntry.shortfall||{});
 const movements=[];
 for(const move of source.movements||[]){
  if(!move||!FOOD[move.foodId]||!Number.isFinite(Number(move.quantity))||!move.operationId)continue;
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
  const opParts=String(move.operationId).split(':'),group=kind==='purchase'&&/^\d+$/.test(opParts.at(-1))?opParts.slice(0,-1).join(':'):null;
  const shortfall=completionOperation?(Number(currentShortfall.get(completionOperation)?.[move.foodId])||0):0;
  movements.push({id:await cloudUuid('movement',move.operationId),food_id:move.foodId,quantity:Number(move.quantity),unit:foodStockUnit(move.foodId),movement_kind:kind,operation_id:String(move.operationId),operation_group_id:group,completion_operation_id:completionOperation,reverses_operation_id:reversesOperation,shortfall_quantity:shortfall,note:move.note||null,created_at:move.createdAt||new Date().toISOString()});
 }
 const activitySessions=[];
 for(const session of source.activitySessions||[])activitySessions.push({id:await cloudUuid('activity-session',session.id),client_id:session.id,session_date:session.date,activity_code:session.activityId,duration_minutes:session.durationMinutes,met_value:session.met,created_at:session.createdAt});
 const weights=(source.weights||[]).map(x=>({measured_on:x.date,weight_kg:x.kg}));
 const shoppingItems=[];
 for(const [key,choice] of Object.entries(source.cart||{})){
  const split=key.indexOf(':'),foodId=split>=0?key.slice(split+1):'';if(!FOOD[foodId])continue;
  const pack=commercialPack(foodId),size=Number(choice?.size)||pack.size,count=Math.max(0,Number(choice?.count)||0);
  shoppingItems.push({id:await cloudUuid('shopping-item',key),item_key:key,food_id:foodId,item_kind:'planned',is_checked:!!choice?.checked,package_count:count,package_size:size,unit:foodStockUnit(foodId)});
 }
 for(const [index,extra] of (source.cartExtras||[]).entries())if(FOOD[extra.id]&&Number(extra.size)>0)shoppingItems.push({id:await cloudUuid('shopping-item','extra:'+extra.id+':'+index),item_key:'extra:'+extra.id+':'+index,food_id:extra.id,item_kind:'extra',is_checked:false,package_count:Math.max(0,Number(extra.count)||0),package_size:Number(extra.size),unit:foodStockUnit(extra.id)});
 const profile=source.profile||defaultProfile(),todayISO=isoDate(today()),shoppingStart=source.start||todayISO;
 return {profile:{sex:profile.sex,age:profile.age,height_cm:profile.height,reference_weight_kg:profile.weight,activity_level:profile.activity,goal:profile.goal,injury_recovery:profile.injury,auto_portions:profile.autoPortions,follow_weight:profile.followWeight,manual_rmr_kcal:profile.manualRmr,profile_confirmed:source.profileConfirmed===true},cycles,planned_meals:plannedMeals,prep_tasks:prepTasks,completions,movements,weights,deleted_weight_dates:source.deletedWeightDates||[],activity_sessions:activitySessions,deleted_activity_ids:source.deletedActivitySessionIds||[],legacy_training_dates:Object.keys(source.legacyStrengthDays||{}).filter(dateFromISO),shopping:{id:await cloudUuid('shopping-session','shared-cart'),starts_on:shoppingStart,ends_on:planDate(shoppingStart,20),items:shoppingItems},last_backup_at:source.lastBackupAt||null};
}
async function fetchCloudSnapshot(){
 return supabaseTransport.fetchSnapshot();
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
 for(const row of data.ingredients){if(!ingredientsByCompletion.has(row.completion_id))ingredientsByCompletion.set(row.completion_id,{});const usage=ingredientsByCompletion.get(row.completion_id);usage[row.food_id]=(usage[row.food_id]||0)+Number(row.quantity)}
 for(const move of data.movements)if(move.source_completion_id){if(!movementsByCompletion.has(move.source_completion_id))movementsByCompletion.set(move.source_completion_id,{});const amounts=movementsByCompletion.get(move.source_completion_id);if(move.movement_kind==='meal')amounts[move.food_id]=(amounts[move.food_id]||0)+Math.abs(Number(move.quantity));if(move.movement_kind==='meal'&&Number(move.shortfall_quantity)>0){if(!shortfallByCompletion.has(move.source_completion_id))shortfallByCompletion.set(move.source_completion_id,{});shortfallByCompletion.get(move.source_completion_id)[move.food_id]=Number(move.shortfall_quantity)}}
 const doneByCycle=new Map();
 for(const completion of data.completions){if(completion.reversed_at)continue;const planned=plannedById.get(completion.planned_meal_id);if(!planned)continue;if(!doneByCycle.has(planned.cycle_id))doneByCycle.set(planned.cycle_id,{});doneByCycle.get(planned.cycle_id)[planned.meal_date+'#'+planned.slot]={rid:completion.recipe_id_snapshot,usage:ingredientsByCompletion.get(completion.id)||{},deducted:movementsByCompletion.get(completion.id)||{},shortfall:shortfallByCompletion.get(completion.id)||{},operationId:completion.operation_id,completedAt:completion.completed_at}}
 const allMovements=data.movements.slice().sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at))).map(move=>{
  const sourceCompletion=move.source_completion_id?completionById.get(move.source_completion_id):null;
  const reversalTarget=move.reverses_movement_id?movementById.get(move.reverses_movement_id):null;
  const parent=sourceCompletion|| (reversalTarget?.source_completion_id?completionById.get(reversalTarget.source_completion_id):null),planned=parent?plannedById.get(parent.planned_meal_id):null;
  return {operationId:move.operation_id,foodId:move.food_id,quantity:Number(move.quantity),kind:move.movement_kind==='reversal'?'meal_reversal':move.movement_kind,sourceId:planned?planned.meal_date+'#'+planned.slot:undefined,createdAt:move.created_at,note:move.note||undefined};
 });
 const sProfile=data.profile;
 s.profile=sanitizeProfile({sex:sProfile.sex,age:sProfile.age,height:sProfile.height_cm,weight:sProfile.reference_weight_kg,activity:sProfile.activity_level,goal:sProfile.goal,injury:sProfile.injury_recovery,autoPortions:sProfile.auto_portions,followWeight:sProfile.follow_weight,manualRmr:sProfile.manual_rmr_kcal});
 s.profileConfirmed=sProfile.profile_confirmed===true;
 if(active){s.noActiveCycle=false;s.start=active.start_date;s.activeMenus=menuOf.get(active.id);s.activeMenuCatalogVersion=active.catalog_version;s.activeMenuGeneratedAt=active.generated_at;s.activeMenuConfirmedAt=active.confirmed_at;s.activeMenuRecoveryFocus=!!active.recovery_focus;s.done=doneByCycle.get(active.id)||{};s.prep=prepOf.get(active.id)||{}}
 else{s.noActiveCycle=true;s.start=isoDate(today());s.activeMenus=null;s.activeMenuCatalogVersion=null;s.activeMenuGeneratedAt=null;s.activeMenuConfirmedAt=null;s.activeMenuRecoveryFocus=false;s.done={};s.prep={}}
 s.movements=allMovements;s.stock={};rebuildStock(s);
 s.purchases=allMovements.filter(x=>x.kind==='purchase'&&x.quantity>0).slice(-2500).map(x=>({id:x.foodId,amount:x.quantity,date:x.createdAt,operationId:x.operationId}));
 s.weights=data.weights.map(x=>({date:x.measured_on,kg:Number(x.weight_kg)})).sort((a,b)=>a.date.localeCompare(b.date));
 s.activitySessions=data.activities.slice().sort((a,b)=>String(a.session_date).localeCompare(String(b.session_date))||String(a.created_at).localeCompare(String(b.created_at))).slice(-2000).map(x=>({id:x.client_id||x.id,date:x.session_date,activityId:x.activity_code,met:Number(x.met_value),durationMinutes:Number(x.duration_minutes),createdAt:x.created_at}));
 s.legacyStrengthDays=Object.fromEntries(data.training.map(x=>[x.training_date,true]));
 const archived=data.cycles.filter(x=>x.status==='archived').sort((a,b)=>String(a.archived_at||a.created_at).localeCompare(String(b.archived_at||b.created_at))).slice(-6);
 s.archives=archived.map(c=>({start:c.start_date,done:doneByCycle.get(c.id)||{},legacyStrengthDays:{},prep:prepOf.get(c.id)||{},menus:menuOf.get(c.id),catalogVersion:c.catalog_version,archivedAt:c.archived_at||c.created_at,generatedAt:c.generated_at,confirmedAt:c.confirmed_at,recoveryFocus:!!c.recovery_focus}));
 const toPlan=c=>c?({start:c.start_date,menus:menuOf.get(c.id),locked:locksOf.get(c.id),catalogVersion:c.catalog_version,generatedAt:c.generated_at,confirmedAt:c.confirmed_at,recoveryFocus:!!c.recovery_focus}):null;
 s.nextMenu=toPlan(data.cycles.find(x=>x.status==='scheduled'));s.plannerDraft=toPlan(data.cycles.find(x=>x.status==='draft'));
 const shopping=data.shoppingSessions.find(x=>x.status==='open');
 if(shopping){for(const item of data.shoppingItems.filter(x=>x.session_id===shopping.id)){if(item.item_kind==='planned')s.cart[item.item_key]={count:Number(item.package_count),size:Number(item.package_size),checked:!!item.is_checked};else s.cartExtras.push({id:item.food_id,count:Number(item.package_count),size:Number(item.package_size)})}}
 s.lastBackupAt=data.settings?.last_backup_at||null;s.deletedWeightDates=[];s.deletedActivitySessionIds=[];
 const cleaned=cleanState(s);if(!cleaned)throw Error('Los datos recuperados de Supabase no pasan las validaciones locales. No he sustituido los datos de este navegador.');return cleaned;
}
async function initializeCloudState(user){
 cloudReady=false;cloudSyncLastError=null;cloudStatus('Conectando los datos de tu cuenta…','working');
 const localExists=!!localStorage.getItem(KEY),localState=load();
 const settings=await supabaseTransport.readOne('user_settings',user.id);
 if(!settings?.state_initialized_at){
  state=localState;cloudRevision=Number(settings?.sync_revision)||0;cloudReady=true;
  const ok=await syncCloudNow(true);if(!ok)throw Error(cloudErrorForUser(cloudSyncLastError));
  return;
 }
 const remote=await fetchCloudSnapshot(),remoteRevision=Number(remote.settings?.sync_revision)||0,meta=readCloudMeta();
 if(localState.resetCloudPending){
  state=localState;cloudRevision=remoteRevision;cloudReady=true;cloudStatus('Aplicando el reinicio/restauración confirmados…','working');
  if(!await syncCloudNow(true))throw Error(cloudErrorForUser(cloudSyncLastError));
  return;
 }
 const localChanged=localExists&&meta?.fingerprint&&(await stateFingerprint(localState))!==meta.fingerprint;
 const localHasUntrackedData=localExists&&!meta?.fingerprint&&hasMeaningfulLocalState(localState);
 if(localChanged||localHasUntrackedData){
  await reconcileCloudState(remote,localState,meta);
  const mergedFingerprint=await stateFingerprint(state),remoteFingerprint=await stateFingerprint(stateFromCloud(remote));
  if(mergedFingerprint!==remoteFingerprint){cloudStatus('Cambios combinados · sincronizando','pending');scheduleCloudSync()}
  else cloudStatus('Sincronizado con Supabase','ok');
  return;
 }
 await adoptCloudState(remote);
 cloudStatus('Sincronizado con Supabase','ok');
}
function hasMeaningfulLocalState(value){return !!(value.profileConfirmed||Object.keys(value.done||{}).length||value.movements?.length||value.weights?.length||value.activitySessions?.length||value.archives?.length||value.nextMenu||value.plannerDraft||Object.keys(value.cart||{}).length||value.cartExtras?.length||value.activeMenus||JSON.stringify(value.profile)!==JSON.stringify(defaultProfile()))}

function cloudMetaSnapshot(remote){return {movements:(remote.movements||[]).map(x=>({operation_id:x.operation_id})),completions:(remote.completions||[]).map(x=>({operation_id:x.operation_id})),activity_sessions:(remote.activities||[]).map(x=>({client_id:x.client_id||x.id})),weights:(remote.weights||[]).map(x=>({measured_on:x.measured_on,weight_kg:x.weight_kg}))}}
async function adoptCloudState(remote){
 const remoteState=stateFromCloud(remote),revision=Number(remote.settings?.sync_revision)||0;
 state=remoteState;MENUS=state.activeMenus?cloneMenus(state.activeMenus):cloneMenus(FIXED_MENUS);cloudRevision=revision;cloudReady=true;saveLocalOnly();
 writeCloudMeta(revision,await stateFingerprint(remoteState),cloudMetaSnapshot(remote),remoteState,true);
}
async function reconcileCloudState(remote,localState=state,meta=readCloudMeta()){
 const remoteState=stateFromCloud(remote),revision=Number(remote.settings?.sync_revision)||0;
 const merged=reconcileStates(meta?.baseState||emptyState(),localState,remoteState,{baseActivityIds:meta?.activityIds||[],baseWeightValues:meta?.weightValues||{},remoteActivityIds:(remote.activities||[]).map(x=>x.client_id||x.id)});
 const cleaned=cleanState(merged);if(!cleaned)throw Error('No se pudieron combinar los cambios locales con la cuenta. La copia local se conserva.');
 state=cleaned;rebuildStock(state);MENUS=state.activeMenus?cloneMenus(state.activeMenus):cloneMenus(FIXED_MENUS);cloudRevision=revision;cloudReady=true;saveLocalOnly();
 writeCloudMeta(revision,await stateFingerprint(remoteState),cloudMetaSnapshot(remote),remoteState,true);
 return {remoteState,mergedState:state};
}
async function syncCloudNow(immediate=false){
 if(!cloudReady||!currentUserId||!supabaseClient)return false;
 if(cloudSyncInFlight){cloudSyncPending=true;return false}
 clearTimeout(cloudSyncTimer);cloudSyncInFlight=true;cloudStatus('Sincronizando con Supabase…','working');
 try{
  for(let attempt=0;attempt<5;attempt++){
   const submitted=JSON.parse(JSON.stringify(state)),meta=readCloudMeta(),fullSnapshot=await buildCloudSnapshot(submitted),snapshot=submitted.resetCloudPending?fullSnapshot:reduceCloudSnapshot(JSON.parse(JSON.stringify(fullSnapshot)),meta),rpcName=submitted.resetCloudPending?'reset_menuki_state':'sync_menuki_state';
   const {data,error}=await supabaseTransport.submitSnapshot(rpcName,snapshot,cloudRevision);
   if(error){
    if(error.message?.includes('SYNC_CONFLICT')||error.code==='PT409'||error.code==='40001'){
     const remote=await fetchCloudSnapshot();cloudRevision=Number(remote.settings?.sync_revision)||0;
     if(submitted.resetCloudPending){writeCloudMeta(cloudRevision,await stateFingerprint(stateFromCloud(remote)),cloudMetaSnapshot(remote),stateFromCloud(remote),true)}
     else await reconcileCloudState(remote,state,meta);
     continue;
    }
    throw error;
   }
   cloudRevision=Number(data)||cloudRevision+1;
   if(state===undefined)return false;
   const stateWasUnchanged=JSON.stringify(state)===JSON.stringify(submitted);
   if(submitted.resetCloudPending&&state.resetCloudPending){state.resetCloudPending=false;try{localStorage.removeItem(cloudMetaKey())}catch{persistent=false}}
   for(const id of submitted.deletedActivitySessionIds||[])state.deletedActivitySessionIds=(state.deletedActivitySessionIds||[]).filter(x=>x!==id);
   for(const date of submitted.deletedWeightDates||[])state.deletedWeightDates=(state.deletedWeightDates||[]).filter(x=>x!==date);
   const acknowledged=JSON.parse(JSON.stringify(submitted));acknowledged.resetCloudPending=false;acknowledged.deletedActivitySessionIds=[];acknowledged.deletedWeightDates=[];
   saveLocalOnly();writeCloudMeta(cloudRevision,await stateFingerprint(acknowledged),fullSnapshot,acknowledged,true);cloudSyncLastError=null;cloudSyncRetryTask='sync';cloudStatus('Sincronizado con Supabase','ok');
   if(!stateWasUnchanged||cloudSyncPending){cloudSyncPending=false;scheduleCloudSync()}
   return true;
  }
  throw Error('Supabase recibió cambios continuos desde otro dispositivo. Menuki volverá a sincronizar al reintentarlo.');
 }catch(error){cloudSyncLastError=error;cloudSyncRetryTask='sync';cloudStatus('No se pudo sincronizar · la copia local se conserva','error');console.error('Menuki cloud sync failed',error);return false}
 finally{cloudSyncInFlight=false;const button=document.getElementById('cloudSyncButton');if(button)button.disabled=false}
}
function newOperationId(){return globalThis.crypto?.randomUUID?globalThis.crypto.randomUUID():'op-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)}
function applyMovement(move){if(!move?.operationId||!FOOD[move.foodId]||!Number.isFinite(Number(move.quantity))||state.movements.some(x=>x.operationId===move.operationId))return false;const quantity=roundAmount(move.quantity);if(!quantity)return false;state.movements.push({...move,quantity,createdAt:move.createdAt||new Date().toISOString()});state.stock[move.foodId]=roundAmount(Number(state.stock[move.foodId]||0)+quantity);if(Math.abs(state.stock[move.foodId])<.001)delete state.stock[move.foodId];return true}
function setInventoryBalance(id,value,kind='adjustment'){const current=Number(state.stock[id]||0),delta=roundAmount(Number(value)-current);if(!delta)return false;return applyMovement({operationId:newOperationId(),foodId:id,quantity:delta,kind,createdAt:new Date().toISOString()})}
let visibleWeek=0,selectedDay=0,view='inicio',shopStore='merc',shopRange='7',shoppingSearch='',recipeFilter='todos',recipeSearch='',pantryFilter='used',pantrySearch='',modalCtx=null,plannerProposal=null,toastTimer,mobileMoreOpen=false,cycleStartEditorOpen=false,cycleStartDraft=null,cycleSetupDateDraft='',quickGuideStep=0;
function renderQuickGuide(){
 const root=document.getElementById('quickGuideContent');
 if(!root)return;
 const activeCycle=!state.noActiveCycle;
 const steps=[
  {
   eyebrow:'PRIMEROS PASOS · PERSONALIZA',
   title:'Personaliza tu plan',
   text:'Revisa tu edad, altura, peso, movimiento habitual y objetivo. Menuki usa esos datos para estimar tus objetivos y adaptar las raciones.',
   note:activeCycle?'La fecha de inicio se cambia en Menú 3 semanas. El acceso de Inicio abre directamente ese editor.':'Tu cuenta no tiene un ciclo activo. Selecciona el día de inicio en el aviso que aparece arriba en todas las páginas.',
   actions:'<button type="button" class="btn btn-subtle" data-action="quick-guide-profile">Revisar perfil</button>'+(activeCycle?'<button type="button" class="btn btn-quiet" data-action="edit-cycle-start">'+ic('calendar')+' Cambiar fecha</button>':'<button type="button" class="btn btn-quiet" data-action="quick-guide-choose-cycle">'+ic('calendar')+' Elegir fecha</button>')
  },
  {
   eyebrow:'PRIMEROS PASOS · TU MENÚ',
   title:'Consulta y registra tus comidas',
   text:activeCycle?'Inicio enseña el menú de hoy. En Menú 3 semanas puedes cambiar de día, consultar las recetas y ajustar lo que está planificado.':'Cuando elijas la fecha de inicio, Inicio mostrará el menú de hoy y Menú 3 semanas permitirá consultar otros días y recetas.',
   note:'Marca una comida solo después de haberla tomado. Las cantidades registradas se conservan aunque luego cambie el menú.',
   actions:activeCycle?'<button type="button" class="btn btn-subtle" data-action="navigate" data-view="semana">Abrir Menú 3 semanas</button>':'<button type="button" class="btn btn-subtle" data-action="quick-guide-choose-cycle">'+ic('calendar')+' Elegir fecha de inicio</button>'
  },
  {
   eyebrow:'PRIMEROS PASOS · TU PROGRESO',
   title:'Compra, despensa y actividad',
   text:'La lista de compra te ayuda a reponer ingredientes; al finalizar una compra, los productos se suman a la despensa. En Actividad y peso puedes llevar un seguimiento opcional.',
   note:'Registra una sesión solo después de hacerla. Su estimación afecta al objetivo de ese día; el peso es opcional.',
   actions:'<button type="button" class="btn btn-subtle" data-action="navigate" data-view="compra">'+ic('cart')+' Abrir Compra</button><button type="button" class="btn btn-quiet" data-action="navigate" data-view="despensa">'+ic('leaf')+' Ver despensa</button><button type="button" class="btn btn-quiet" data-action="navigate" data-view="evolucion">'+ic('chart')+' Actividad y peso</button>'
  }
 ];
 quickGuideStep=Math.max(0,Math.min(steps.length-1,quickGuideStep));
 const step=steps[quickGuideStep];
 root.innerHTML='<div class="quick-guide-body"><div class="quick-guide-progress"><span class="eyebrow">'+step.eyebrow+'</span><span>Paso '+(quickGuideStep+1)+' de '+steps.length+'</span></div><div class="quick-guide-progress-track" aria-hidden="true">'+steps.map((item,index)=>'<span class="'+(index<=quickGuideStep?'is-complete':'')+'"></span>').join('')+'</div><h2 id="quickGuideTitle" tabindex="-1">'+step.title+'</h2><p class="quick-guide-text">'+step.text+'</p><p class="quick-guide-note">'+step.note+'</p><div class="quick-guide-chips">'+(quickGuideStep===1?SLOTS.map((slot,index)=>'<span class="quick-guide-chip">'+ic(SLOT_ICONS[index])+escapeHTML(slot)+'</span>').join(''):quickGuideStep===2?'<span class="quick-guide-chip">'+ic('cart')+'Compra</span><span class="quick-guide-chip">'+ic('leaf')+'Despensa</span><span class="quick-guide-chip">'+ic('chart')+'Actividad y peso</span>':'')+'</div><div class="quick-guide-actions">'+step.actions+'</div><div class="quick-guide-footer"><button type="button" class="btn btn-quiet" data-action="quick-guide-close">Cerrar</button><div><button type="button" class="btn btn-quiet" data-action="quick-guide-previous" '+(quickGuideStep===0?'disabled':'')+'>Anterior</button><button type="button" class="btn btn-primary" data-action="quick-guide-next">'+(quickGuideStep===steps.length-1?'Terminar':'Siguiente')+'</button></div></div></div>';
}
function openQuickGuide(){quickGuideStep=0;renderQuickGuide();const dialog=document.getElementById('quickGuideDialog');if(dialog&&!dialog.open)dialog.showModal()}
function applyHomeOnboarding(root){
 if(view!=='inicio')return;
 const copy=root.querySelector('.home-banner-copy');
 if(!copy||copy.querySelector('.home-banner-actions'))return;
 if(!state.profileConfirmed){const intro=copy.querySelector('p');if(intro)intro.textContent='Empieza revisando tu perfil y descubre cómo organizar tu menú y tu progreso.'}
 const actions=document.createElement('div');
 actions.className='home-banner-actions';
 if(!state.profileConfirmed){
  const profile=document.createElement('button');
  profile.type='button';profile.className='btn btn-subtle';profile.dataset.action='quick-guide-profile';profile.textContent='Revisar perfil';
  actions.append(profile);
 }
 const guide=document.createElement('button');
 guide.type='button';guide.className='btn btn-quiet';guide.dataset.action='quick-guide-open';guide.textContent='Ver guía rápida';
 actions.append(guide);
 const dateLink=copy.querySelector('.home-banner-date-link');
 if(dateLink)actions.append(dateLink);
 copy.append(actions);
}
function applyQuickGuideEntry(root){
 if(view!=='guia')return;
 const firstUse=root.querySelector('.first-use-card');
 if(firstUse){
  const actions=firstUse.querySelector('.first-use-actions');
  if(actions&&!actions.querySelector('[data-action=\"quick-guide-open\"]')){
   const button=document.createElement('button');button.type='button';button.className='btn btn-subtle';button.dataset.action='quick-guide-open';button.textContent='Ver guía rápida';actions.append(button);
  }
  return;
 }
 const intro=root.querySelector('.page-intro');
 if(!intro||root.querySelector('.quick-guide-entry'))return;
 const entry=document.createElement('section');
 entry.className='quick-guide-entry';
 entry.innerHTML='<div><strong>¿Primera vez en Menuki?</strong><p>Recorre en unos minutos las funciones principales y cómo empezar.</p></div><button type=\"button\" class=\"btn btn-subtle\" data-action=\"quick-guide-open\">Ver guía rápida</button>';
 intro.insertAdjacentElement('afterend',entry);
}
function applyProfileAccount(root){
 if(view!=='perfil')return;
 const card=root.querySelector('.profile-card'),hero=card?.querySelector('.profile-hero');
 if(!card||!hero||card.querySelector('.profile-account-row'))return;
 const row=document.createElement('div'),copy=document.createElement('div'),label=document.createElement('span'),email=document.createElement('strong'),signOut=document.createElement('button');
 row.className='profile-account-row';copy.className='profile-account-copy';label.className='mini-kicker';label.textContent='CUENTA';email.className='profile-account-email';email.textContent=currentUserEmail||'Sesión iniciada';copy.append(label,email);
 signOut.type='button';signOut.id='authSignOut';signOut.className='btn btn-quiet';signOut.dataset.action='sign-out';signOut.textContent='Cerrar sesión';row.append(copy,signOut);hero.before(row);
}
function alignCurrentDay(){const off=dateDiff(dateFromISO(state.start),today());if(off>=0&&off<21){visibleWeek=Math.floor(off/7);selectedDay=off%7}else if(off>=21){visibleWeek=2;selectedDay=6}else{visibleWeek=0;selectedDay=0}}
function todayMenuPosition(){if(state.noActiveCycle)return null;const offset=dateDiff(dateFromISO(state.start),today());return offset>=0&&offset<21?{week:Math.floor(offset/7),day:offset%7}:null}
function dateAt(week,day){return addDays(dateFromISO(state.start),week*7+day)}
function dateISOAt(week,day){return isoDate(dateAt(week,day))}
function mealKey(week,day,slot){return dateISOAt(week,day)+'#'+slot}
function activitySessionsForDay(day,week=visibleWeek){return activitySessionsForDate(dateISOAt(week,day))}
function done(day,slot,week=visibleWeek){return !!state.done[mealKey(week,day,slot)]}
function mealIsFuture(day,week=visibleWeek){return dateISOAt(week,day)>isoDate(today())}
function mealAt(day,slot,week=visibleWeek){return REC[MENUS[week][day][slot]]}
function nformat(value){return new Intl.NumberFormat('es-ES',{maximumFractionDigits:0}).format(Math.round(value||0))}
function qty(value){return new Intl.NumberFormat('es-ES',{maximumFractionDigits:2}).format(Number(value||0))}
function itemQuantity(id,value){return qty(value)+' '+foodStockUnit(id)}
function recipeQuantity(id,value){return qty(value)+' '+foodRecipeUnit(id)}
function calc(recipe){const ans={k:0,p:0,c:0,f:0};for(const item of recipe.ingredients){const f=FOOD[item.id],factor=f[1]==='ud'?item.rest:item.rest/100;ans.k+=f[2]*factor;ans.p+=f[3]*factor;ans.c+=f[4]*factor;ans.f+=f[5]*factor}return ans}
function dayCalc(day,week=visibleWeek){const total={k:0,p:0,c:0,f:0};for(let slot=0;slot<5;slot++){const mac=getMacro(recipeUsage(day,slot,week));for(const k of Object.keys(total))total[k]+=mac[k]}return total}
function completedDayCalc(day,week=visibleWeek){const total={k:0,p:0,c:0,f:0};for(let slot=0;slot<5;slot++){const usage=state.done[mealKey(week,day,slot)]?.usage;if(!usage)continue;const mac=getMacro(usage);for(const key of Object.keys(total))total[key]+=mac[key]}return total}
function target(day,week=visibleWeek){const k=nutritionTarget(activityEnergyForDate(dateISOAt(week,day))).calories;return [k-65,k+65]}
function countDoneWeek(week=visibleWeek){let n=0;for(let d=0;d<7;d++)for(let s=0;s<5;s++)if(done(d,s,week))n++;return n}
function totalDone(){return Array.from({length:3},(_,w)=>countDoneWeek(w)).reduce((a,b)=>a+b,0)}
 function usedTotals(){const totals={};for(const entry of Object.values(state.done)){if(!entry)continue;for(const [id,value] of Object.entries(entry.usage||{})){if(FOOD[id])totals[id]=(totals[id]||0)+recipeToStockAmount(id,value)}}return totals}
function totalDaysLeft(){return dateDiff(today(),addDays(dateFromISO(state.start),20))}
function cycleDateLabel(){return formatDate(dateFromISO(state.start),{day:'numeric',month:'short'})+' – '+formatDate(addDays(dateFromISO(state.start),20),{day:'numeric',month:'short',year:'numeric'})}
function dayLabel(day,week=visibleWeek){return formatDate(dateAt(week,day),{day:'numeric',month:'short'})}
function dayNameAt(day,week=visibleWeek){const name=formatDate(dateAt(week,day),{weekday:'long'});return name[0].toUpperCase()+name.slice(1)}
function dayShortAt(day,week=visibleWeek){return formatDate(dateAt(week,day),{weekday:'short'}).replace('.', '').toUpperCase()}
function actualWeek(){const offset=dateDiff(dateFromISO(state.start),today());return offset<0?-1:offset>=21?3:Math.floor(offset/7)}
function startBanner(){const begin=dateFromISO(state.start),days=dateDiff(today(),begin);if(days<=0)return '';return '<section class="start-banner" role="status"><span class="start-badge">📆 COMIENZO DEL PLAN</span><strong>Empezamos el '+formatDate(begin,{weekday:'long',day:'numeric',month:'long',year:'numeric'})+'</strong><p>Faltan <b>'+days+' '+(days===1?'día':'días')+'</b> para comenzar. Estás viendo la semana 1 para organizarte, no una semana ya transcurrida. El ciclo termina el '+formatDate(addDays(begin,20),{weekday:'long',day:'numeric',month:'long'})+'.</p></section>'}
function showToast(message){const box=document.getElementById('toast');box.textContent=message;box.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>box.classList.remove('show'),3200)}
function reminderBanner(){const remain=totalDaysLeft();if(remain>3)return '';if(remain>=0){return '<section class="reminder-banner" role="status"><span class="reminder-icon">🔔</span><div class="reminder-body"><span class="mini-kicker">FIN DEL CICLO · '+(remain===0?'HOY':remain+' DÍAS')+'</span><strong>Es momento de preparar otro menú de 3 semanas</strong><p>Tu tercera semana termina el '+formatDate(addDays(dateFromISO(state.start),20),{day:'numeric',month:'long'})+'. Copia el encargo y pégalo en ChatGPT para preparar recetas nuevas, conservando tus preferencias.</p></div><button class="btn btn-primary" data-action="new-prompt">Copiar encargo '+ic('arrow')+'</button></section>'}if(remain<0){return '<section class="reminder-banner" role="status"><span class="reminder-icon">🌿</span><div class="reminder-body"><strong>¡Ciclo de 3 semanas finalizado!</strong><p>Puedes copiar el encargo y pedir otras 3 semanas en ChatGPT, teniendo en cuenta el registro del ciclo.</p></div><button class="btn btn-primary" data-action="new-prompt">Copiar encargo '+ic('arrow')+'</button></section>'}return ''}
function weekTabs(){const current=actualWeek();return '<div class="weeks-overview">'+MENUS.map((_,w)=>{const c=countDoneWeek(w),stage=current===-1?(w===0?'COMIENZA '+formatDate(dateFromISO(state.start),{day:'numeric',month:'short'}).toUpperCase():'PRÓXIMAMENTE'):current===w?'EN CURSO':current>w?'FINALIZADA':'PRÓXIMAMENTE';return '<button class="week-chip '+(visibleWeek===w?'active':'')+'" data-action="go-week" data-week="'+w+'" aria-pressed="'+(visibleWeek===w)+'" aria-label="Semana '+(w+1)+', '+WEEK_TITLES[w]+', '+c+' de 35 comidas completadas"><span>SEMANA '+(w+1)+' · '+stage+'</span><b>'+WEEK_TITLES[w]+'</b><small>'+formatDate(dateAt(w,0),{day:'numeric',month:'short'})+' – '+formatDate(dateAt(w,6),{day:'numeric',month:'short'})+' · '+c+'/35</small><progress class="week-chip-progress" value="'+c+'" max="35" aria-hidden="true"></progress></button>'}).join('')+'</div>'}
function renderNav(){
 const navItems=[...NAV,PROPOSAL_NAV[0],...(menukiAdmin?[PROPOSAL_NAV[1]]:[])];
 const desktop=navItems.map(n=>'<button type="button" class="nav-btn'+(view===n[0]?' active':'')+'" data-action="navigate" data-view="'+n[0]+'" aria-current="'+(view===n[0]?'page':'false')+'">'+ic(n[2])+'<span>'+n[1]+'</span></button>').join('');
 const primaryIds=['inicio','semana','compra','evolucion'],primary=navItems.filter(n=>primaryIds.includes(n[0])),secondaryIds=['perfil','despensa','recetas','guia','proponer',...(menukiAdmin?['admin']:[])],secondary=secondaryIds.map(id=>navItems.find(n=>n[0]===id)).filter(Boolean),secondaryActive=secondary.some(n=>view===n[0]);
 const mobileButton=n=>'<button type="button" class="mobile-tab'+(view===n[0]?' active':'')+'" data-action="navigate" data-view="'+n[0]+'" aria-current="'+(view===n[0]?'page':'false')+'">'+ic(n[2])+'<span>'+({inicio:'Inicio',semana:'Menú',compra:'Compra',despensa:'Despensa',evolucion:'Actividad'}[n[0]]||n[1])+'</span></button>';
 const more=secondary.map(n=>'<button type="button" class="mobile-more-item'+(view===n[0]?' active':'')+'" data-action="navigate" data-view="'+n[0]+'" aria-current="'+(view===n[0]?'page':'false')+'">'+ic(n[2])+'<span>'+({perfil:'Perfil',despensa:'Despensa',recetas:'Recetas',guia:'Guía',proponer:'Proponer receta',admin:'Revisar propuestas'}[n[0]]||n[1])+'</span></button>').join('');
 document.getElementById('sideNav').innerHTML=desktop;
 document.getElementById('mobileNav').innerHTML=primary.map(mobileButton).join('')+'<button type="button" id="mobileMoreToggle" class="mobile-tab mobile-more-toggle'+(secondaryActive?' active':'')+'" data-action="toggle-more" aria-controls="mobileMoreMenu" aria-expanded="'+mobileMoreOpen+'" aria-current="'+(secondaryActive?'page':'false')+'">'+ic('more')+'<span>Más</span></button><div class="mobile-more-menu" id="mobileMoreMenu" aria-label="Más secciones" '+(mobileMoreOpen?'':'hidden')+'>'+more+'</div>';
}
function renderHeader(){const a=dateAt(visibleWeek,0),b=dateAt(visibleWeek,6),pager=document.querySelector('.week-pager');document.getElementById('weekLabel').textContent='Viendo '+(visibleWeek+1)+'/3 · '+formatDate(a,{day:'numeric',month:'short'})+'–'+formatDate(b,{day:'numeric',month:'short'});pager.hidden=view!=='semana'||state.noActiveCycle;document.querySelector('[data-action="prev-week"]').disabled=visibleWeek<=0;document.querySelector('[data-action="next-week"]').disabled=visibleWeek>=2}
function renderCycleSetupNotice(){const root=document.getElementById('cycleSetupBanner');if(!root)return;if(!state?.noActiveCycle){root.hidden=true;root.innerHTML='';cycleSetupDateDraft='';return}root.hidden=false;root.innerHTML='<section class="cycle-setup-notice" role="region" aria-labelledby="cycleSetupTitle"><div class="cycle-setup-mark">'+ic('calendar')+'</div><div class="cycle-setup-copy"><h2 id="cycleSetupTitle">Tu cuenta no tiene un ciclo activo</h2><p>Selecciona el día en que empieza el plan. Puedes seguir usando el resto de Menuki; tus datos personales se conservan.</p></div><div class="cycle-setup-fields"><label for="cycleSetupDate">Día de inicio<input id="cycleSetupDate" type="date" data-change="cycle-setup-date" value="'+escapeAttribute(cycleSetupDateDraft)+'" required></label><button type="button" class="btn btn-primary" data-action="activate-cycle">Activar ciclo</button></div></section>'}
function mealCard(day,slot,week=visibleWeek){
 const r=mealAt(day,slot,week),c=getMacro(recipeUsage(day,slot,week)),checked=done(day,slot,week),future=mealIsFuture(day,week),date=dateISOAt(week,day),status=checked?(future?'Registrada':'Realizada'):future?'Planificada':'Pendiente',statusClass=checked?'done':future?'planned':'pending',label=checked?'Desmarcar comida registrada':future?'Comida planificada para '+date:'Registrar '+SLOTS[slot]+' como realizada',title=future&&!checked?'Podrás registrarla cuando llegue el día':'Registrar y descontar ingredientes';
 return '<article class="meal-card '+(checked?'done':'')+'"><div class="meal-body"><div class="meal-top"><span class="meal-type">'+ic(SLOT_ICONS[slot])+'<span>'+escapeHTML(SLOTS[slot])+'</span></span><span class="meal-status '+statusClass+'">'+status+'</span><button type="button" class="meal-check '+(checked?'checked':'')+'"'+(future&&!checked?' disabled':'')+' data-action="toggle-meal" data-week="'+week+'" data-day="'+day+'" data-slot="'+slot+'" aria-label="'+escapeAttribute(label)+'" title="'+escapeAttribute(title)+'">'+ic('check')+'</button></div><button class="meal-open" data-action="open" data-recipe="'+escapeAttribute(r.id)+'" data-week="'+week+'" data-day="'+day+'" data-slot="'+slot+'"><h3>'+escapeHTML(r.name)+'</h3><div class="meal-meta"><span>'+ic('clock')+' '+escapeHTML(r.time)+' min</span><span><b>'+nformat(c.k)+' kcal</b> aprox.</span><span>'+nformat(c.p)+' g proteína</span></div></button></div></article>';
}
function dayTiles(week=visibleWeek){
 return `<div class="week-strip" aria-label="Días de la semana">${MENUS[week].map((_,d)=>{
  const completed=MENUS[week][d].filter((x,s)=>done(d,s,week)).length,count=activitySessionsForDay(d,week).length;
  return `<button class="day-btn ${d===selectedDay?'selected':''}" data-action="select-day" data-week="${week}" data-day="${d}" aria-label="Ver ${dayNameAt(d,week)} ${civilDayOfMonth(dateAt(week,d))}; ${completed} de 5 comidas completadas"><span class="day-short">${dayShortAt(d,week)}</span><span class="day-num">${civilDayOfMonth(dateAt(week,d))}</span><span class="day-extra">${count?count+' sesión'+(count===1?'':'es'):'Base'}</span><progress class="day-progress" value="${completed}" max="5" aria-hidden="true"></progress></button>`
 }).join('')}</div>`
}
function dayActivity(day,week=visibleWeek){const date=dateISOAt(week,day),sessions=activitySessionsForDate(date),extra=activityEnergyForDate(date),future=date>isoDate(today());return '<div class="activity-day"><span class="activity-day-note">'+(sessions.length?sessions.length+' sesión'+(sessions.length===1?'':'es')+' · +'+nformat(extra)+' kcal estimadas':'Sin sesiones · objetivo base')+'</span><button class="btn btn-subtle" data-action="activity-open" data-day="'+day+'" data-week="'+week+'" '+(future?'disabled':'')+'>'+ic('plus')+' Registrar actividad</button></div>'}
function energyStatus(day,week=visibleWeek,dateOverride=null,hasMenu=true){
 const date=dateOverride||dateISOAt(week,day),c=hasMenu?completedDayCalc(day,week):{k:0,p:0,c:0,f:0},activity=activityEnergyForDate(date),t=nutritionTarget(activity);
  const mk=(label,actual,goal,unit,variant='')=>'<div class="meter-info"><span>'+label+' · '+nformat(actual)+' '+unit+'</span><span>Objetivo ≈ '+nformat(goal)+' '+unit+'</span></div><progress class="meter-progress '+escapeAttribute(variant)+'" value="'+Math.max(0,Math.min(100,actual/Math.max(goal,1)*100)).toFixed(1)+'" max="100" aria-label="'+escapeAttribute(label+' frente a su objetivo')+'"></progress>';
 const meals=hasMenu?MENUS[week][day].filter((_,slot)=>done(day,slot,week)).length:0;
 return '<div class="panel nutrition-meter"><div class="meter-heading"><h3>Objetivo nutricional de hoy</h3><button class="btn btn-subtle" data-action="navigate" data-view="perfil">Editar perfil →</button></div>'+mk('Menú consumido',c.k,t.calories,'kcal')+'<div class="nutrition-meter-spacer"></div>'+mk('Proteína consumida',c.p,t.protein,'g','meter-progress--protein')+'<div class="macro-chips"><span>🍞 '+nformat(c.c)+' / '+nformat(t.carb)+' g hidratos</span><span>🥑 '+nformat(c.f)+' / '+nformat(t.fat)+' g grasas</span></div><p class="target-note">'+(hasMenu?meals+' de 5 comidas registradas cuentan en estas barras. ':'No hay comidas de este ciclo para hoy. ')+(activity?'Las sesiones añaden '+nformat(activity)+' kcal netas al objetivo de hoy; no cuentan como alimentos. ':'Sin sesiones: se aplica el objetivo base. ')+(state.profile.injury?'Recuperación activa: evitar déficits agresivos. ':'')+'Valores aproximados; las cantidades registradas se conservan.</p></div>';
}

function profileSummaryMarkup(p=state.profile,weightOverride){
 const base=nutritionTarget(0,p,weightOverride);
 const stat=(title,a,b,footer)=>'<div class="profile-stat"><small>'+title+'</small><b>'+(title==='Peso para el cálculo'?qty(a):nformat(a))+(b||'')+'</b><span>'+footer+'</span></div>';
 const row=(title,m)=>'<div class="profile-target-row"><span class="target-label">'+title+'</span><b>'+nformat(m.calories)+' kcal</b><div class="macro-chips"><span>Proteínas '+nformat(m.protein)+' g</span><span>Grasas '+nformat(m.fat)+' g</span><span>Hidratos '+nformat(m.carb)+' g</span></div></div>';
 return '<div class="profile-stats">'+stat('Peso para el cálculo',base.weight,' kg','Media últimas 3 mediciones o peso base')+stat('Metabolismo en reposo',base.rmr,' kcal','Ecuación estimativa')+stat('Mantenimiento base',base.maintenance,' kcal','Movimiento diario habitual')+'</div>'+row('🎯 Objetivo diario base',base)+(p.injury?'<div class="recovery-note">🦴 <strong>Recuperación ósea activa.</strong> Se limita automáticamente el déficit al 5 % y se modera cualquier superávit. El planificador de nuevos ciclos favorece cualitativamente alimentos con calcio y vitamina D, además de frutas y verduras con vitamina C; no calcula micronutrientes.</div>':'')+'<p class="target-note">Las sesiones se registran cuando ocurren y solo suman energía a esa fecha. Proteínas y grasas se mantienen estables; las raciones de hidratos absorben principalmente el ajuste. Los valores son estimaciones, no mediciones clínicas.</p>';
}
function profileFormData(){
 const form=document.getElementById('profileForm');if(!form)return null;
 const data=new FormData(form);
 return sanitizeProfile({sex:String(data.get('sex')),age:Number(data.get('age')),height:Number(data.get('height')),weight:Number(data.get('weight')),activity:String(data.get('activity')),goal:String(data.get('goal')),manualRmr:Number(data.get('manualRmr')),injury:data.has('injury'),autoPortions:data.has('autoPortions'),followWeight:data.has('followWeight')});
}
function updateProfilePreview(){const form=document.getElementById('profileForm');if(!form)return;const p=profileFormData(),preview=document.getElementById('profilePreview');if(preview){
 // En un borrador con nuevo peso no usamos un peso anterior del seguimiento.
 const effective=p.followWeight&&state.weights.length?undefined:p.weight;
 preview.innerHTML=profileSummaryMarkup(p,effective);
 }const custom=document.getElementById('manualRmrField');if(custom)custom.hidden=form.elements.sex.value!=='manual';}
function profileView(){const p=state.profile,t=nutritionTarget(0),w=effectiveWeight(),last=state.weights.length?[...state.weights].sort((a,b)=>b.date.localeCompare(a.date))[0]:null;
 const select=(name,options)=>options.map(([key,label])=>'<option value="'+escapeAttribute(key)+'" '+(p[name]===key?'selected':'')+'>'+escapeHTML(label)+'</option>').join('');
 const num=(id,label,min,max,step)=>'<label class="profile-field">'+escapeHTML(label)+'<input required type="number" name="'+escapeAttribute(id)+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+escapeAttribute(p[id])+'"></label>';
 const checked=id=>p[id]?'checked':'';
 return '<div class="page-intro"><div class="eyebrow">TU MOTOR NUTRICIONAL</div><h1>Un menú que cambia contigo</h1><p>Modifica tu perfil, el movimiento habitual o la meta física. La aplicación calcula un objetivo distinto y adapta las raciones de los <strong>21 días pendientes</strong>; la compra y la despensa usarán exactamente esas cantidades.</p></div><section class="panel profile-card"><div class="profile-hero"><div><span class="mini-kicker">PERSONALIZACIÓN · 3 SEMANAS</span><h2>Mi perfil y mis objetivos</h2><p>Solo necesitas unos pocos datos. Puedes cambiar de objetivo sin empezar de cero.</p></div><span class="profile-emoji">🌿</span></div>'+(state.profileConfirmed?'':'<aside class="profile-review-notice" role="status"><strong>Revisa estos datos antes de usar los objetivos.</strong><p>Menuki muestra valores genéricos de ejemplo. Las calorías y raciones que ves ahora se calculan con ellos; comprueba edad, altura, peso, movimiento y objetivo, y guarda el perfil para confirmarlo.</p></aside>')+'<form id="profileForm"><div class="profile-label">01 · Datos para la fórmula</div><div class="profile-fields"><label class="profile-field">Sexo de la ecuación<select name="sex">'+select('sex',[['male','Hombre (+5)'],['female','Mujer (−161)'],['manual','Introducir mi gasto en reposo']])+'</select><small>La fórmula original tiene dos coeficientes. Usa una estimación manual si ninguno te representa.</small></label>'+num('age','Edad (años)',18,95,1)+num('height','Altura (cm)',125,220,1)+num('weight','Peso de referencia (kg)',35,250,.1)+'</div><div class="profile-fields" id="manualRmrField" '+(p.sex!=='manual'?'hidden':'')+'>'+num('manualRmr','Metabolismo en reposo conocido (kcal)',800,3500,10)+'</div><label class="profile-toggle"><input type="checkbox" name="followWeight" '+checked('followWeight')+'><span><b>Actualizar con mis registros de peso</b><small>'+ (last?'Último registro: '+Number(last.kg).toFixed(1)+' kg ('+escapeHTML(last.date)+').':'Todavía no hay pesos registrados. Se usa el peso de referencia.')+' Se usa la media de hasta tres mediciones recientes para no reaccionar a cada fluctuación.</small></span></label><div class="profile-label">02 · Movimiento y ejercicio</div><div class="profile-fields"><label class="profile-field">Movimiento diario (sin entrenamientos)<select name="activity">'+select('activity',[['very_low','Muy bajo · casa, pocos pasos (×1,20)'],['low','Bajo · algunos paseos (×1,30)'],['medium','Medio · actividad frecuente (×1,40)'],['high','Alto · muchos desplazamientos (×1,52)']])+'</select><small>Mantén el ejercicio fuera de este nivel; las sesiones se añadirán cuando las registres.</small></label><div class="activity-estimate-note"><strong>Sesiones reales, sin previsión</strong><small>Registra la actividad después de hacerla. Solo cambia el objetivo y las comidas aún pendientes de esa fecha.</small></div></div><label class="profile-toggle injury-toggle"><input type="checkbox" name="injury" '+checked('injury')+'><span><b>🦴 Recuperación ósea activa</b><small>Limita los recortes de energía y, al preparar o regenerar el siguiente menú, favorece recetas con fuentes de calcio, vitamina D y vitamina C. No calcula cantidades de micronutrientes ni sustituye el menú activo.</small></span></label><div class="profile-label">03 · ¿Qué quieres conseguir?</div><div class="goal-choices">'+[['maintain','🌿','Mantener peso','Energía estable y buena recuperación'],['recomp','⚖️','Recomposición','Reducir grasa, conservar músculo'],['fat_loss','🍃','Bajar grasa','Déficit moderado al estar recuperado'],['muscle_gain','💪','Ganar músculo','Superávit pequeño + fuerza']].map(([id,icon,name,sub])=>'<label class="goal-option"><input type="radio" name="goal" value="'+escapeAttribute(id)+'" '+(p.goal===id?'checked':'')+'><span class="goal-option-content"><i>'+escapeHTML(icon)+'</i><b>'+escapeHTML(name)+'</b><small>'+escapeHTML(sub)+'</small></span></label>').join('')+'</div><label class="profile-toggle"><input type="checkbox" name="autoPortions" '+checked('autoPortions')+'><span><b>Adaptar las cantidades de las recetas automáticamente</b><small>Ajusta raciones de proteínas, cereales, pan, patata, aceite y frutos secos. No cambia los platos ni ingredientes principales. Si lo desactivas, solo cambian las metas.</small></span></label><div class="profile-actions"><button type="submit" class="btn btn-primary">'+ic('check')+' '+(state.profileConfirmed?'Guardar y recalcular menú y compra':'Confirmar perfil y guardar')+'</button><button type="button" class="btn btn-quiet" data-action="restore-profile">Valores iniciales</button></div></form></section><section class="panel profile-results"><div class="section-head"><div><div class="eyebrow">CÁLCULO EN TIEMPO REAL</div><h2>Así queda tu objetivo</h2><p>Previsualización: los cambios se aplican al guardar.</p></div><span class="badge-soft">'+escapeHTML(GOAL_NAMES[p.goal])+'</span></div><div id="profilePreview">'+profileSummaryMarkup(p)+'</div></section><div class="profile-foot"><div class="soft-banner"><span>🥗</span><div><strong>El objetivo es dinámico; las recetas tienen límites</strong><p>Con perfiles muy diferentes al original, un simple cambio de raciones puede no alcanzar las calorías o proteínas necesarias. La aplicación señalará las diferencias y será preferible crear otro menú. Las comidas ya realizadas <strong>no se recalculan</strong>; la despensa solo se actualizará con los próximos platos.</p></div></div><div class="soft-banner"><span>🧭</span><div><strong>El cálculo no sustituye la evolución real</strong><p>Revisa medias semanales de peso, apetito, actividad, rendimiento y recuperación después de 2–3 semanas. Una fórmula no detecta tu metabolismo individual ni estima el porcentaje de grasa. Con enfermedades, embarazo o lesión que requiera atención, consulta a un profesional.</p></div></div></div>';
}

function dashboard(){
 const position=todayMenuPosition(),d=position?.day??null,w=position?.week??null,date=isoDate(today());
 const progress=totalDone(),needed=shoppingModel().rows.length,used=Object.keys(usedTotals()).length;
 const stats='<div class="stat-grid dashboard-stats">'+[
  ['Objetivo base',nformat(nutritionTarget(0).calories),'kcal','flame','Sin sesiones futuras previstas'],['Sesiones hoy',String(activitySessionsForDate(isoDate(today())).length),'','muscle','Solo actividad ya realizada'],['Comidas registradas',state.noActiveCycle?'—':progress+' / 105','','check',state.noActiveCycle?'Sin ciclo activo':'En las 3 semanas'],['Ingredientes por reponer',needed+'','','cart',used+' productos distintos consumidos']
 ].map((s,i)=>'<div class="stat"><div class="stat-top"><span>'+s[0]+'</span><span class="stat-icon '+(i%2?'peach':'')+'">'+ic(s[3])+'</span></div><div class="stat-value '+(i<2?'stat-value--compact':'')+'">'+s[1]+' <small>'+s[2]+'</small></div><div class="stat-note">'+s[4]+'</div></div>').join('')+'</div>';
 const menu=position
  ?'<section class="dashboard-menu"><div class="dashboard-menu-heading"><div><div class="eyebrow">'+escapeHTML(dayNameAt(d,w)+' · '+dayLabel(d,w))+'</div><h1>Menú de hoy</h1><p>Consulta los platos y marca cada comida después de realizarla.</p></div><button class="btn btn-quiet dashboard-full-week" data-action="navigate" data-view="semana">Ver menú completo '+ic('arrow')+'</button></div><div class="day-summary"><div><h3>'+dayNameAt(d,w)+' · '+dayLabel(d,w)+'</h3><p>'+MENUS[w][d].filter((_,slot)=>done(d,slot,w)).length+' de 5 comidas registradas · '+nformat(completedDayCalc(d,w).k)+' kcal y '+nformat(completedDayCalc(d,w).p)+' g de proteína consumidas</p></div><div class="right">'+dayActivity(d,w)+'</div></div><div class="meal-grid">'+MENUS[w][d].map((_,slot)=>mealCard(d,slot,w)).join('')+'</div></section>'
  :'<section class="dashboard-menu"><div class="dashboard-menu-heading"><div><div class="eyebrow">MENÚ DEL CICLO</div><h1>Menú de hoy</h1><div class="cycle-boundary-notice" role="status"><span class="cycle-boundary-icon">'+ic('calendar')+'</span><span>'+(date<state.start?'Tu ciclo empieza el <strong>'+escapeHTML(formatDate(dateFromISO(state.start),{weekday:'long',day:'numeric',month:'long'}))+'</strong>.':'El ciclo terminó el <strong>'+escapeHTML(formatDate(addDays(dateFromISO(state.start),20),{weekday:'long',day:'numeric',month:'long'}))+'</strong>.')+'</span></div></div><button class="btn btn-primary" data-action="navigate" data-view="semana">Ver menú '+ic('arrow')+'</button></div></section>';
 return '<section class="home-banner" aria-label="Resumen de Menuki"><div class="home-banner-mark" aria-hidden="true">'+ic('spark')+'</div><div class="home-banner-copy"><div class="eyebrow">MENUKI · TU PLAN SALUDABLE</div><h2>Pequeños pasos, buen ritmo</h2><p>Tu menú y tu progreso de hoy, en un mismo lugar.</p><button type="button" class="home-banner-date-link" data-action="edit-cycle-start">'+ic('calendar')+' Cambiar fecha del plan '+ic('arrow')+'</button></div></section>'+stats+energyStatus(d,w,date,!!position)+menu;
}
function nextCycleStart(){const current=dateFromISO(state.start),scheduled=addDays(current,21),now=today();return isoDate(scheduled<now?now:scheduled)}
function plannerNutrition(recipes){const portions=portionsForRecipes(recipes,0),total={k:0,p:0,c:0,f:0};for(const usage of portions){const m=getMacro(usage);for(const key of Object.keys(total))total[key]+=m[key]}return {portions,total}}
function recipeStockScore(recipe,projected){if(!recipe.ingredients.length)return 0;return recipe.ingredients.reduce((score,item)=>{const need=Math.max(.01,recipeToStockAmount(item.id,Number(item.rest)||0)),available=Math.max(0,Number(projected[item.id]||0));return score+Math.min(1,available/need)},0)/recipe.ingredients.length}
function buildCycleProposal(previous){
 const locked=previous?.locked||emptyLocks(),menus=Array.from({length:3},()=>Array.from({length:7},()=>Array(5).fill(''))),currentIds=new Set(MENUS.flat(2)),assigned={},history=SLOT_TYPES.map((_,slot)=>MENUS.flatMap(week=>week.map(day=>day[slot]))),projected={...state.stock},recipesByType=Object.fromEntries(SLOT_TYPES.map(type=>[type,RECIPES.filter(r=>r.type===type)]));
 for(let w=0;w<3;w++){
  const usedThisWeek=SLOT_TYPES.map(()=>new Set());
  for(let d=0;d<7;d++){
   const fixed=SLOT_TYPES.map((_,s)=>locked?.[w]?.[d]?.[s]?REC[previous.menus[w][d][s]]:null);
   const ranked=SLOT_TYPES.map((type,s)=>recipesByType[type].map(recipe=>{const sequence=history[s],repeatCount=Number(assigned[recipe.id]||0),recent=sequence.slice(-3).includes(recipe.id),sameWeek=usedThisWeek[s].has(recipe.id);const freshness=currentIds.has(recipe.id)?0:2.2,repeat=repeatCount===0?1.4:-Math.min(7,repeatCount*2.1),near=recent?-3.5:0,weekPenalty=sameWeek?-2.6:0,stock=recipeStockScore(recipe,projected)*2.2,recovery=recoveryRecipeScore(recipe,state.profile),random=Math.random()*1.25;return {recipe,score:freshness+repeat+near+weekPenalty+stock+recovery+random}}).sort((a,b)=>b.score-a.score).slice(0,9));
   let best=null;
   for(let attempt=0;attempt<18;attempt++){
    const chosen=SLOT_TYPES.map((_,s)=>{if(fixed[s])return fixed[s];const choices=ranked[s].slice(0,Math.min(8,ranked[s].length));const index=Math.min(choices.length-1,Math.floor(Math.pow(Math.random(),1.25)*choices.length));return choices[index]?.recipe});
    if(chosen.some(r=>!r))throw new Error('No hay suficientes recetas compatibles para completar el menú.');
    const estimate=plannerNutrition(chosen),target=nutritionTarget(0),m=estimate.total,penalty=Math.abs(m.k-target.calories)/Math.max(target.calories,1)+.55*Math.abs(m.p-target.protein)/Math.max(target.protein,1)+.25*Math.abs(m.c-target.carb)/Math.max(target.carb,1)+.2*Math.abs(m.f-target.fat)/Math.max(target.fat,1);const preference=chosen.reduce((sum,r,s)=>sum+(ranked[s].find(x=>x.recipe.id===r.id)?.score||0),0);const score=preference+recoveryDayScore(chosen,state.profile)-penalty*5;if(!best||score>best.score)best={recipes:chosen,portions:estimate.portions,score};
   }
   menus[w][d]=best.recipes.map(r=>r.id);
   for(let s=0;s<5;s++){const r=best.recipes[s];assigned[r.id]=(assigned[r.id]||0)+1;history[s].push(r.id);usedThisWeek[s].add(r.id);for(const [id,amount] of Object.entries(best.portions[s]))projected[id]=Number(projected[id]||0)-recipeToStockAmount(id,Number(amount||0))}
  }
 }
 return {start:nextCycleStart(),menus,locked:locked.map(week=>week.map(day=>day.slice())),catalogVersion,recoveryFocus:!!state.profile.injury,generatedAt:new Date().toISOString(),confirmedAt:null};
}
function persistPlannerDraft(){if(!plannerProposal)return;state.plannerDraft={...plannerProposal,menus:cloneMenus(plannerProposal.menus),locked:plannerProposal.locked.map(week=>week.map(day=>day.slice()))};save()}
function plannerCounts(menus){const all=menus.flat(2),unique=new Set(all),old=new Set(MENUS.flat(2));return {distinct:unique.size,unused:[...unique].filter(id=>!old.has(id)).length,repeats:all.length-unique.size}}
function renderPlannerReview(){
 if(!plannerProposal)return;
 const root=document.getElementById('plannerContent'),summary=plannerCounts(plannerProposal.menus),date=dateFromISO(plannerProposal.start),dateLabel=formatDate(date,{day:'numeric',month:'long',year:'numeric'});
 const modeChanged=Boolean(state.profile.injury)!==Boolean(plannerProposal.recoveryFocus);
 const recoveryMessage=plannerProposal.recoveryFocus?'Esta propuesta se generó con Recuperación ósea activa: el selector favorece recetas con alimentos etiquetados como fuentes de calcio y vitamina D, y frutas/verduras con vitamina C.':'Esta propuesta se generó sin la preferencia de Recuperación ósea.';
 const modeNotice=modeChanged?' El ajuste del perfil ha cambiado desde la generación; regenera las comidas desbloqueadas para aplicarlo. Las comidas bloqueadas se conservan.':'';
 const c=plannerProposal.recoveryFocus?plannerRecoveryCoverage(plannerProposal.menus):null;
 const coverage=c?'<p class="target-note"><strong>Presencia cualitativa de ingredientes etiquetados:</strong> '+RECOVERY_TAG_LABELS.calcium+' '+c.calcium+'/21 días · '+RECOVERY_TAG_LABELS.vitamin_d+' '+c.vitamin_d+'/21 · '+RECOVERY_TAG_LABELS.vitamin_c+' '+c.vitamin_c+'/21. Cuenta presencia en recetas, no cantidades ni objetivos de ingesta.</p>':'';
 root.innerHTML='<div class="planner-content"><div class="planner-intro"><div class="eyebrow">PROPUESTA EDITABLE · CATÁLOGO '+escapeHTML(plannerProposal.catalogVersion)+'</div><h2>Revisa el siguiente ciclo</h2><p>El menú empieza el '+dateLabel+' y contiene 105 comidas. El stock favorece ingredientes disponibles, pero no bloquea recetas. El menú propuesto usa el objetivo base, sin prever sesiones. Registra la actividad cuando ocurra para ajustar solo las comidas pendientes de esa fecha.</p><p>'+recoveryMessage+modeNotice+'</p><p>Los selectores sustituyen recetas del mismo espacio y las dejan bloqueadas. Puedes desbloquearlas y regenerar el resto. No hay todavía filtros de gustos o alergias.</p></div><div class="planner-summary"><span>'+summary.distinct+' recetas distintas</span><span>'+summary.unused+' no usadas en el ciclo actual</span><span>'+summary.repeats+' repeticiones dentro de la propuesta</span></div>'+coverage+plannerProposal.menus.map((week,w)=>'<section class="planner-day"><h3>Semana '+(w+1)+'</h3>'+week.map((ids,d)=>{const dateAtPlan=addDays(date,w*7+d),recipes=ids.map(id=>REC[id]),portions=portionsForRecipes(recipes,0);return '<div class="planner-day"><h3>'+formatDate(dateAtPlan,{weekday:'long',day:'numeric',month:'short'})+'</h3>'+ids.map((id,s)=>{const recipe=REC[id],macro=getMacro(portions[s]),locked=plannerProposal.locked[w][d][s],options=RECIPES.filter(r=>r.type===SLOT_TYPES[s]).map(r=>'<option value="'+escapeAttribute(r.id)+'" '+(r.id===id?'selected':'')+'>'+escapeHTML(r.name)+'</option>').join('');return '<div class="planner-meal"><span class="planner-slot">'+SLOTS[s]+'</span><select data-change="proposal-recipe" data-week="'+w+'" data-day="'+d+'" data-slot="'+s+'" aria-label="Receta para '+SLOTS[s]+'">'+options+'</select><small>'+nformat(macro.k)+' kcal aprox.</small><button type="button" class="btn planner-lock" data-action="planner-lock" data-week="'+w+'" data-day="'+d+'" data-slot="'+s+'">'+(locked?'🔒 Bloqueada':'Bloquear')+'</button></div>'}).join('')+'</div>'}).join('')+'</section>').join('')+'<div class="planner-actions"><button class="btn" data-action="planner-close">Cerrar</button><button class="btn" data-action="planner-regenerate">Regenerar comidas desbloqueadas</button><button class="btn btn-primary" data-action="planner-save">Guardar siguiente menú</button></div></div>';
}
function openPlannerDialog(){plannerProposal=cleanCyclePlan(state.plannerDraft||state.nextMenu);if(!plannerProposal){plannerProposal=buildCycleProposal(null);persistPlannerDraft()}renderPlannerReview();const dialog=document.getElementById('plannerDialog');if(!dialog.open)dialog.showModal()}
function regeneratePlannerProposal(){try{plannerProposal=buildCycleProposal(plannerProposal);persistPlannerDraft();renderPlannerReview();showToast('Propuesta regenerada · se conservaron las comidas bloqueadas')}catch(error){showToast(error.message||'No se pudo generar el menú')}}
function swapPlannerRecipe(el){if(!plannerProposal)return;const w=Number(el.dataset.week),d=Number(el.dataset.day),s=Number(el.dataset.slot),recipe=REC[el.value];if(!recipe||recipe.type!==SLOT_TYPES[s])return;plannerProposal.menus[w][d][s]=recipe.id;plannerProposal.locked[w][d][s]=true;persistPlannerDraft();renderPlannerReview()}
function togglePlannerLock(button){if(!plannerProposal)return;const w=Number(button.dataset.week),d=Number(button.dataset.day),s=Number(button.dataset.slot);plannerProposal.locked[w][d][s]=!plannerProposal.locked[w][d][s];persistPlannerDraft();renderPlannerReview()}
function savePlannerProposal(){if(!plannerProposal||!validMenuSnapshot(plannerProposal.menus)){showToast('La propuesta no es válida');return}state.nextMenu={...plannerProposal,menus:cloneMenus(plannerProposal.menus),locked:plannerProposal.locked.map(week=>week.map(day=>day.slice())),confirmedAt:new Date().toISOString()};state.plannerDraft=null;save();const advanced=activateScheduledCycleIfDue();document.getElementById('plannerDialog').close();render();showToast(advanced?'El nuevo ciclo ya está activo':'Siguiente menú guardado para el '+formatDate(dateFromISO(state.nextMenu?.start||state.start),{day:'numeric',month:'long'}))}
function activateScheduledCycleIfDue(){if(!state?.nextMenu||state.noActiveCycle)return false;const scheduled=dateFromISO(state.nextMenu.start);if(!scheduled||scheduled>today())return false;const next=state.nextMenu;state.archives.push({start:state.start,done:state.done,legacyStrengthDays:state.legacyStrengthDays,prep:state.prep,menus:cloneMenus(MENUS),catalogVersion:state.activeMenuCatalogVersion||catalogVersion,generatedAt:state.activeMenuGeneratedAt,confirmedAt:state.activeMenuConfirmedAt,recoveryFocus:state.activeMenuRecoveryFocus,archivedAt:new Date().toISOString()});state.archives=state.archives.slice(-6);state.start=next.start;state.activeMenus=cloneMenus(next.menus);state.activeMenuCatalogVersion=next.catalogVersion;state.activeMenuGeneratedAt=next.generatedAt||null;state.activeMenuConfirmedAt=next.confirmedAt||null;state.activeMenuRecoveryFocus=!!next.recoveryFocus;state.done={};state.legacyStrengthDays={};state.prep={};state.cart={};state.nextMenu=null;state.plannerDraft=null;MENUS=state.activeMenus;alignCurrentDay();save();return true}
 function authRedirectUrl(){return window.location.origin+window.location.pathname}
 function renderAuthScreen(mode=authMode,message=authMessage,level=authMessageType){
  authMode=mode;authMessage=message||'';authMessageType=level||'info';
  const shell=document.getElementById('authShell'),app=document.querySelector('.app'),mobile=document.getElementById('mobileNav'),overlay=document.getElementById('catalogStatus');
  app.hidden=true;app.inert=true;mobile.hidden=true;overlay.hidden=true;shell.hidden=false;
  const recovery=mode==='recovery',reset=mode==='reset',isSignup=mode==='signup';
  const titles={login:'Accede a Menuki',signup:'Crea tu cuenta',reset:'Recupera tu contraseña',recovery:'Elige una contraseña nueva'};
  const descriptions={login:'Entra con tu correo y contraseña para abrir la aplicación.',signup:'Regístrate con tu correo y contraseña para usar Menuki.',reset:'Te enviaremos un enlace para crear una contraseña nueva.',recovery:'Escribe la nueva contraseña de tu cuenta.'};
  document.getElementById('authTitle').textContent=titles[mode]||titles.login;
  document.getElementById('authDescription').textContent=descriptions[mode]||descriptions.login;
  document.getElementById('authTabs').hidden=reset||recovery;
  document.querySelectorAll('[data-auth-mode]').forEach(button=>button.setAttribute('aria-selected',String(button.dataset.authMode===mode)));
  document.getElementById('authEmailField').hidden=recovery;
  document.getElementById('authPasswordField').hidden=reset;
  const email=document.getElementById('authEmail'),password=document.getElementById('authPassword');
  email.required=!recovery;password.required=!reset;
  password.autocomplete=(isSignup||recovery)?'new-password':'current-password';
  document.getElementById('authPasswordField').firstChild.textContent=recovery?'Nueva contraseña':'Contraseña';
  document.getElementById('authSubmit').textContent=authBusy?'Procesando…':({login:'Iniciar sesión',signup:'Crear cuenta',reset:'Enviar enlace',recovery:'Guardar contraseña'}[mode]||'Continuar');
  document.getElementById('authSubmit').disabled=authBusy;
  document.getElementById('authForgot').hidden=mode!=='login';
  document.getElementById('authBack').hidden=!(reset||recovery);
  const alert=document.getElementById('authAlert');alert.hidden=!authMessage;alert.className='auth-alert'+(authMessageType==='error'?' error':'');alert.textContent=authMessage;
 }
 function showLoadingOverlay(title,detail){const overlay=document.getElementById('catalogStatus');overlay.classList.remove('error');overlay.setAttribute('role','status');overlay.innerHTML='<div><strong>'+escapeHTML(title)+'</strong><p>'+escapeHTML(detail)+'</p></div>';overlay.hidden=false}
 function selectUserLocalState(userId){
  const userKey=LOCAL_STATE_KEY+':user:'+userId;KEY=userKey;
  try{if(!localStorage.getItem(userKey)){const previous=localStorage.getItem(LOCAL_STATE_KEY);if(previous){localStorage.setItem(userKey,previous);localStorage.removeItem(LOCAL_STATE_KEY)}}}catch(error){persistent=false}
 }
 function ensureCatalogs(){if(catalogsLoaded)return Promise.resolve();if(!catalogsPromise)catalogsPromise=loadCatalogs().then(()=>{catalogsLoaded=true}).catch(error=>{catalogsPromise=null;throw error});return catalogsPromise}
 async function openAuthenticatedApp(user){
  if(!user?.id||passwordRecoveryActive)return;
  const id=user.id;authSessionUserId=id;currentUserEmail=user.email||'Sesión iniciada';
  if(currentUserId!==id){currentUserId=id;appReadyUserId=null;state=undefined;persistent=true;cloudReady=false;cloudRevision=0;lastCloudRefreshAt=0;menukiAdmin=false;proposalInbox=[];proposalInboxLoaded=false;proposalInboxLoading=false;proposalInboxBusy=false;proposalInboxError='';proposalEditingId=null;proposalEditingDraft=null;proposalActionToken++;proposalLoadToken++;proposalExportToken++;proposalExporting=false;recipeProposalDraft=newRecipeProposalDraft();recipeProposalClientId=newRecipeProposalClientId();view='inicio';selectUserLocalState(id)}
  if(appReadyUserId===id){document.getElementById('authShell').hidden=true;document.querySelector('.app').hidden=false;document.querySelector('.app').inert=false;document.getElementById('mobileNav').hidden=false;return}
  if(openingUserId===id)return;openingUserId=id;
  showLoadingOverlay('Cargando Menuki…','Estamos cargando los catálogos y los datos asociados a tu cuenta.');
  try{
   await ensureCatalogs();if(authSessionUserId!==id||currentUserId!==id)return;
   await initializeCloudState(user);if(authSessionUserId!==id||currentUserId!==id)return;
   try{menukiAdmin=await recipeProposalService.isAdmin()}catch(error){menukiAdmin=false;console.info('Menuki admin role is unavailable; standard account access remains active',error)}if(authSessionUserId!==id||currentUserId!==id)return;
   MENUS=state.activeMenus?cloneMenus(state.activeMenus):cloneMenus(FIXED_MENUS);lastSeenDate=isoDate(today());const advanced=activateScheduledCycleIfDue();alignCurrentDay();
   const app=document.querySelector('.app'),account=document.getElementById('authAccount');document.getElementById('authShell').hidden=true;app.hidden=false;app.inert=false;document.getElementById('mobileNav').hidden=false;account.hidden=false;appReadyUserId=id;render();document.getElementById('catalogStatus').hidden=true;
   if(advanced)showToast('Ha comenzado el menú de tu siguiente ciclo');if(!persistent)showToast('No se pudo guardar una copia de trabajo en este navegador.')
  }catch(error){if(authSessionUserId!==id)return;const overlay=document.getElementById('catalogStatus');overlay.classList.add('error');overlay.setAttribute('role','alert');overlay.innerHTML='<div><strong>No se pudieron cargar los datos de tu cuenta</strong><p>'+escapeHTML(error.message||'Comprueba la conexión y vuelve a cargar la página.')+'</p><button type="button" class="btn btn-primary" data-action="reload">Reintentar</button></div>'}
  finally{if(openingUserId===id)openingUserId=null}
 }
 function closeAuthenticatedApp(){clearTimeout(cloudSyncTimer);authSessionUserId=null;currentUserId=null;currentUserEmail='';appReadyUserId=null;passwordRecoveryActive=false;cloudReady=false;cloudRevision=0;cloudSyncPending=false;state=undefined;KEY=LOCAL_STATE_KEY;menukiAdmin=false;proposalInbox=[];proposalInboxLoaded=false;proposalInboxError='';proposalInboxLoading=false;proposalInboxBusy=false;proposalEditingId=null;proposalEditingDraft=null;proposalActionToken++;proposalLoadToken++;proposalExportToken++;proposalExporting=false;recipeProposalDraft=newRecipeProposalDraft();recipeProposalClientId=newRecipeProposalClientId();recipeProposalSubmitting=false;view='inicio';document.getElementById('authAccount').hidden=true;document.getElementById('viewRoot').innerHTML='';document.getElementById('mobileNav').innerHTML='';document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());renderAuthScreen('login')}
 function handleAuthStateChange(event,session){
  if(event==='PASSWORD_RECOVERY'){passwordRecoveryActive=true;renderAuthScreen('recovery');return}
  if(event==='SIGNED_OUT'){closeAuthenticatedApp();return}
  if(session?.user){authSessionUserId=session.user.id;if(passwordRecoveryActive){renderAuthScreen('recovery');return}openAuthenticatedApp(session.user)}
  else if(event==='INITIAL_SESSION')renderAuthScreen('login');
 }
 function authErrorMessage(error){const message=String(error?.message||'');if(/invalid login credentials/i.test(message))return'El correo o la contraseña no son correctos.';if(/email not confirmed/i.test(message))return'El proyecto aún solicita confirmar el correo. Desactiva esa opción en Supabase Auth para aplicar la configuración acordada.';if(/user already registered|already been registered/i.test(message))return'Ya existe una cuenta con ese correo. Inicia sesión.';if(/password.*(minimum|least|length)|password should/i.test(message))return'La contraseña no cumple los requisitos configurados en Supabase.';return message?'No se pudo completar la operación: '+message:'No se pudo completar la operación. Comprueba la conexión e inténtalo de nuevo.'}
 async function handleAuthSubmit(event){
  event.preventDefault();if(authBusy||!supabaseClient)return;
  const email=document.getElementById('authEmail').value.trim(),password=document.getElementById('authPassword').value;
  authBusy=true;renderAuthScreen(authMode,'','info');
  try{
   if(authMode==='login'){
    const {data,error}=await supabaseClient.auth.signInWithPassword({email,password});if(error)throw error;if(!data.session)throw Error('No se recibió una sesión de acceso.');passwordRecoveryActive=false;await openAuthenticatedApp(data.user);
   }else if(authMode==='signup'){
    const {data,error}=await supabaseClient.auth.signUp({email,password});if(error)throw error;if(!data.session){authBusy=false;renderAuthScreen('signup','No se inició sesión al crear la cuenta. Comprueba que la confirmación de correo está desactivada en Supabase Auth; si la cuenta ya existía, inicia sesión.','error');return}passwordRecoveryActive=false;await openAuthenticatedApp(data.user);
   }else if(authMode==='reset'){
    const {error}=await supabaseClient.auth.resetPasswordForEmail(email,{redirectTo:authRedirectUrl()});if(error)throw error;authBusy=false;renderAuthScreen('reset','Si existe una cuenta con ese correo, recibirás un enlace para cambiar la contraseña.');return;
   }else if(authMode==='recovery'){
    const {error}=await supabaseClient.auth.updateUser({password});if(error)throw error;passwordRecoveryActive=false;const {data,error:sessionError}=await supabaseClient.auth.getSession();if(sessionError)throw sessionError;if(data.session){authSessionUserId=data.session.user.id;await openAuthenticatedApp(data.session.user)}else renderAuthScreen('login','Contraseña actualizada. Inicia sesión con la nueva contraseña.');
   }
  }catch(error){renderAuthScreen(authMode,authErrorMessage(error),'error')}
  finally{authBusy=false;const shell=document.getElementById('authShell');if(!shell.hidden)renderAuthScreen(authMode,authMessage,authMessageType)}
 }
 async function signOutOfApp(){if(!supabaseClient)return;const button=document.getElementById('authSignOut');if(button)button.disabled=true;try{const {error}=await supabaseClient.auth.signOut();if(error)throw error;closeAuthenticatedApp()}catch(error){showToast(authErrorMessage(error))}finally{if(button)button.disabled=false}}
 function startApp(){
  const app=document.querySelector('.app');app.hidden=true;app.inert=true;document.getElementById('mobileNav').hidden=true;
  document.querySelectorAll('[data-auth-mode]').forEach(button=>button.addEventListener('click',()=>renderAuthScreen(button.dataset.authMode,'')));
  document.getElementById('authForm').addEventListener('submit',handleAuthSubmit);
  document.getElementById('authForgot').addEventListener('click',()=>renderAuthScreen('reset',''));
  document.getElementById('authBack').addEventListener('click',()=>{passwordRecoveryActive=false;renderAuthScreen('login')});
  const overlay=document.getElementById('catalogStatus');showLoadingOverlay('Comprobando acceso…','Conectando con Supabase Auth.');
  const query=new URLSearchParams(location.search),fragment=new URLSearchParams(location.hash.slice(1));passwordRecoveryActive=query.get('type')==='recovery'||fragment.get('type')==='recovery';
  if(!window.supabase?.createClient){renderAuthScreen('login','No se pudo cargar el servicio de acceso. Comprueba la conexión y vuelve a abrir la página.','error');return}
  try{supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})}catch(error){renderAuthScreen('login','No se pudo iniciar el servicio de acceso. Recarga la página e inténtalo de nuevo.','error');return}
  supabaseClient.auth.onAuthStateChange((event,session)=>{setTimeout(()=>handleAuthStateChange(event,session),0)});
  supabaseClient.auth.getSession().then(({data,error})=>{if(error)throw error;if(passwordRecoveryActive){renderAuthScreen('recovery');return}if(data.session)return openAuthenticatedApp(data.session.user);renderAuthScreen('login')}).catch(error=>renderAuthScreen('login','No se pudo comprobar la sesión. Comprueba la conexión e inténtalo de nuevo. '+String(error?.message||''),'error'));
 }
function plannerCard(){const saved=state.plannerDraft||state.nextMenu,date=saved?.start||nextCycleStart(),label=formatDate(dateFromISO(date),{day:'numeric',month:'long',year:'numeric'}),description=saved?(state.plannerDraft?'Tienes una propuesta sin confirmar.':'El siguiente menú está guardado y se activará al comenzar este ciclo.'):'Prepara ahora una propuesta revisable para las tres semanas siguientes.';return '<section class="planner-card panel"><div><div class="eyebrow">PRÓXIMO CICLO · DESDE '+label.toLocaleUpperCase('es-ES')+'</div><h3>'+ (saved?'Menú preparado':'Genera tu siguiente menú')+'</h3><p>'+description+' La generación usa el catálogo JSON v'+escapeHTML(catalogVersion)+'.</p></div><button class="btn '+(saved?'':'btn-primary')+'" data-action="planner-open">'+(state.plannerDraft?'Continuar revisión':state.nextMenu?'Revisar menú guardado':'Preparar propuesta')+'</button></section>'}
function cycleStartPanel(){
 const start=dateFromISO(state.start),end=addDays(start,20),startLabel=formatDate(start,{weekday:'long',day:'numeric',month:'long',year:'numeric'}),endLabel=formatDate(end,{day:'numeric',month:'long',year:'numeric'});
 if(cycleStartEditorOpen)return '<section class="cycle-start-panel cycle-start-panel--editing panel" aria-labelledby="cycleStartHeading"><div class="cycle-start-mark">'+ic('calendar')+'</div><div class="cycle-start-copy"><div class="eyebrow">PLAN DE 3 SEMANAS</div><h2 id="cycleStartHeading">Cambiar fecha de inicio</h2><p>Elige el día exacto en que comienza el ciclo.</p></div><div class="cycle-start-form"><label for="cycleStartMenu">Primer día del plan</label><input id="cycleStartMenu" type="date" value="'+escapeAttribute(cycleStartDraft??state.start)+'" required><p>Si hay comidas realizadas, te pediremos confirmación para archivarlas. Se conservarán las sesiones, la despensa, las compras y los pesos.</p></div><div class="cycle-start-actions"><button type="button" class="btn" data-action="cancel-cycle-start">Cancelar</button><button type="button" class="btn btn-primary" data-action="save-cycle-start">Guardar fecha</button></div></section>';
 return '<section class="cycle-start-panel panel" aria-labelledby="cycleStartHeading"><div class="cycle-start-mark">'+ic('calendar')+'</div><div class="cycle-start-copy"><div class="eyebrow">PLAN DE 3 SEMANAS</div><h2 id="cycleStartHeading">Empieza el '+escapeHTML(startLabel)+'</h2><p>Este ciclo termina el '+escapeHTML(endLabel)+'.</p></div><button type="button" class="btn cycle-start-toggle" data-action="toggle-cycle-start" aria-expanded="false">Cambiar fecha '+ic('arrow')+'</button></section>';
}
function weekView(){
  if(state.noActiveCycle)return '<div class="page-intro"><div class="eyebrow">PLANIFICACIÓN</div><h1>Menú pendiente de activación</h1><p>Selecciona primero el día de inicio en el aviso superior. Después aparecerán aquí las semanas, los días y las comidas del ciclo.</p></div>';
  const days=MENUS[visibleWeek],day=selectedDay,meals=days[day],nutrition=dayCalc(day),completed=meals.filter((_,slot)=>done(day,slot,visibleWeek)).length;
  const mealRows=meals.map((id,slot)=>{
   const recipe=REC[id],macro=getMacro(recipeUsage(day,slot,visibleWeek)),isDone=done(day,slot,visibleWeek),future=mealIsFuture(day,visibleWeek);
   return '<div class="meal-table-row"><span class="cat">'+ic(SLOT_ICONS[slot])+'<span>'+escapeHTML(SLOTS[slot])+'</span></span><div><button class="name" data-action="open" data-recipe="'+escapeAttribute(recipe.id)+'" data-week="'+visibleWeek+'" data-day="'+day+'" data-slot="'+slot+'">'+escapeHTML(recipe.name)+'</button><div class="sub">'+escapeHTML(recipe.time)+' min · '+nformat(macro.p)+' g proteína · '+(isDone?'Realizada':future?'Planificada':'Pendiente')+'</div></div><span class="kcal">'+nformat(macro.k)+' kcal</span><button class="meal-check '+(isDone?'checked':'')+'"'+(future&&!isDone?' disabled':'')+' data-action="toggle-meal" data-week="'+visibleWeek+'" data-day="'+day+'" data-slot="'+slot+'" title="'+(future&&!isDone?'Podrás registrarla cuando llegue el día':'Registrar comida como realizada')+'" aria-label="'+(isDone?'Desmarcar comida realizada':future?'Comida planificada':'Registrar comida como realizada')+'">'+ic('check')+'</button></div>';
  }).join('');
  return '<div class="page-intro"><div class="eyebrow">105 INGESTAS · 21 DÍAS · MENÚ ROTATIVO</div><h1>Tu menú de 3 semanas</h1><p>Este ciclo mantiene sus recetas y registros. Puedes preparar y revisar el siguiente menú desde el catálogo completo antes de que comience.</p></div>'+cycleStartPanel()+weekTabs()+dayTiles(visibleWeek)+startBanner()+reminderBanner()+'<section class="plan-day"><div class="plan-day-head"><div class="day-circle">'+civilDayOfMonth(dateAt(visibleWeek,day))+'</div><div><h3>'+dayNameAt(day)+' <span class="tiny-pill">'+completed+'/5 realizadas</span></h3><p>'+nformat(nutrition.k)+' kcal · '+nformat(nutrition.p)+' g proteína · '+dayLabel(day)+'</p></div><div class="spacer"></div>'+dayActivity(day,visibleWeek)+'</div><div class="plan-day-body">'+mealRows+'</div></section><div class="soft-banner soft-banner--planner"><span>🏋️</span><div><strong>Registra lo que realmente haces</strong><p>Añade cada sesión después de realizarla, con actividad y duración. Su gasto estimado ajusta principalmente hidratos de las comidas todavía pendientes de esa fecha; no se presupone entrenamiento en días futuros.</p></div></div>'+plannerCard()+'<div class="soft-banner"><span>⚖️</span><div><strong>Cómo se calculan cantidades</strong><p>Arroz, pasta y avena en seco, legumbres escurridas y carne/pescado antes de cocinarlos. El aceite indicado forma parte de las calorías. Todas las cifras son orientativas.</p></div></div>';
}
function recipeTile(r){const c=calc(r,false),typename=r.type==='media'?'Snack mañana':r.type==='tarde'?'Snack tarde':r.type==='desayuno'?'Desayuno':r.type==='comida'?'Comida':'Cena';return '<button class="recipe-tile" data-action="open" data-recipe="'+escapeAttribute(r.id)+'"><div class="tile-body"><span class="tile-tag">'+escapeHTML(typename)+'</span><h3>'+escapeHTML(r.name)+'</h3><div class="tile-meta"><span>'+ic('clock')+' '+escapeHTML(r.time)+' min</span><span>'+nformat(c.k)+' kcal · '+nformat(c.p)+' g prot.</span></div></div></button>'}
function recipesList(){let normalize=x=>x.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');let q=normalize(recipeSearch);let items=RECIPES.filter(r=>(recipeFilter==='todos'||r.type===recipeFilter||recipeFilter==='snack'&&['media','tarde'].includes(r.type))&&(normalize(r.name).includes(q)||r.ingredients.some(i=>normalize(FOOD[i.id][0]).includes(q))));return items.length?'<div class="recipe-grid">'+items.map(recipeTile).join('')+'</div>':'<div class="empty"><span>🥬</span>No hay recetas con esos filtros.</div>'}
function recipesView(){return '<div class="page-intro"><div class="eyebrow">RECETARIO PARA 21 DÍAS</div><h1>Ideas sin caer en la monotonía</h1><p>'+RECIPES.length+' recetas y combinaciones, con ingredientes y preparación explicada. Desayunos sin queso, opciones con yogur y comidas/cenas variadas de 20–30 minutos en general.</p></div><div class="recipe-tools"><label class="search-input">'+ic('search')+'<input type="search" id="recipeSearch" autocomplete="off" placeholder="Busca por plato o ingrediente…" value="'+escapeHTML(recipeSearch)+'" aria-label="Buscar recetas"></label><div class="chips">'+[['todos','Todas'],['desayuno','Desayunos'],['comida','Comidas'],['cena','Cenas'],['snack','Snacks']].map(x=>'<button class="chip '+(recipeFilter===x[0]?'active':'')+'" data-action="filter" data-filter="'+x[0]+'">'+x[1]+'</button>').join('')+'</div></div><div id="recipeResults">'+recipesList()+'</div><div class="footnote">Los datos nutricionales son orientativos y pueden variar según los productos.</div>'}
// Compra dinámica basada en comidas aún pendientes y el inventario declarado.
// Horizontes de compra exactos: 7 días = 7 fechas; 14 días = 14 fechas.
// Antes del comienzo se cuenta desde 13/10, NO desde la fecha de hoy.
function futureDates(){
 const first=dateFromISO(state.start),last=addDays(first,20);
 const current=dateFromISO(isoDate(today()));
 if(current>last)return null;
 return current<first?first:current;
}
function plannedDays(horizon=shopRange){
 if(state.noActiveCycle)return [];
 const first=dateFromISO(state.start),end=addDays(first,20);
 if(horizon==='visible')return Array.from({length:7},(_,i)=>dateAt(visibleWeek,i));
 const begin=futureDates();if(!begin)return [];
 const count=horizon==='3'?3:horizon==='14'?14:horizon==='all'?21:7;
 const dates=[];
 for(let i=0;i<count;i++){
   const date=addDays(begin,i);
   if(date>end)break;
   dates.push(date);
 }
 return dates;
}
function plannedNeeds(horizon=shopRange){
 const res={},dates=plannedDays(horizon);let remaining=0;
 for(const date of dates){
  const off=dateDiff(dateFromISO(state.start),date);
  if(off<0||off>=21)continue;
  const w=Math.floor(off/7),d=off%7;
  for(let slot=0;slot<5;slot++){
   if(done(d,slot,w))continue;
   remaining++;
   const usage=recipeUsage(d,slot,w);
    for(const [id,value] of Object.entries(usage))res[id]=(res[id]||0)+recipeToStockAmount(id,value);
  }
 }
 return {res,remaining,dates};
}
function shoppingModel(horizon=shopRange){
 const {res,remaining,dates}=plannedNeeds(horizon);
 const rows=Object.entries(res).filter(([id])=>FOOD[id]).map(([id,needed])=>({
   id,needed,stock:Number(state.stock[id]||0),
   missing:Math.max(0,needed-Number(state.stock[id]||0)),
  store:CATALOG[id]?.[0]||'merc',group:CATALOG[id]?.[1]||'Otros'
 })).filter(r=>r.missing>0.001).sort((a,b)=>a.group.localeCompare(b.group,'es')||FOOD[a.id][0].localeCompare(FOOD[b.id][0],'es'));
 return {rows,remaining,dates,covered:Object.keys(res).length-rows.length};
}
function rangeDates(horizon=shopRange){
 if(state.noActiveCycle)return 'Sin ciclo activo';
 const dates=plannedDays(horizon);
 if(!dates.length)return 'Ciclo terminado o sin fechas por delante';
 return formatDate(dates[0],{day:'numeric',month:'short'})+' – '+formatDate(dates[dates.length-1],{day:'numeric',month:'short'});
}
// Compra práctica: paquetes y unidades, con inventario exacto por debajo.
function commercialPack(id){const p=FOOD_META[id]?.purchase,unit=foodStockUnit(id),size=Number(p?.quantity)||100;return {size,label:p?.label||((size>=1000?qty(size/1000)+' kg':qty(size)+' '+unit)+' / envase'),unit:p?.unit||unit,approx:unit==='ud'&&foodRecipeUnit(id)==='g'&&foodPieceWeight(id)>0}}
function cartKey(id){return shopRange+':'+id}
function cartChoice(id,missing){const saved=state.cart[cartKey(id)];const pack=commercialPack(id);return saved&&Number.isFinite(+saved.count)?saved:{count:Math.ceil(missing/pack.size),size:pack.size,checked:false}}
function shopView(){
 const model=shoppingModel(),allStock=Object.entries(state.stock).filter(([_,q])=>Number(q)>0).length;
 const categories=['merc','fruit'];
 const byStore=categories.map(store=>{
  const rows=model.rows.filter(r=>r.store===store),groups=[...new Set(rows.map(r=>r.group))];
  const groupMarkup=groups.map(group=>{
   const groupRows=rows.filter(r=>r.group===group),slug=(store+'-'+group).toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-');
   const items=groupRows.map(r=>{
    const pack=commercialPack(r.id),c=cartChoice(r.id,r.missing),id=escapeAttribute(r.id),unit=escapeHTML(foodStockUnit(r.id)),name=escapeHTML(FOOD[r.id][0]);
    const controls=c.checked?'':'<div class="pack-controls"><button class="pack-step" type="button" data-action="cart-minus" data-food="'+id+'" aria-label="Quitar unidad">−</button><input aria-label="Número de envases" type="number" min="0" max="999" step="1" data-change="cart-count" data-food="'+id+'" value="'+escapeAttribute(c.count)+'"><button class="pack-step" type="button" data-action="cart-plus" data-food="'+id+'" aria-label="Añadir unidad">+</button><span class="pack-unit">× '+escapeHTML(pack.label)+'</span></div><details class="pack-adjust"><summary>Editar tamaño del envase</summary><label>Contenido real por envase ('+unit+') <input type="number" min="0.1" step="1" max="100000" data-change="cart-size" data-food="'+id+'" value="'+escapeAttribute(c.size)+'"></label></details>';
    return '<div class="pack-row'+(c.checked?' is-checked':'')+'" data-shop-name="'+escapeAttribute(FOOD[r.id][0])+'"><label class="pack-check"><input type="checkbox" data-change="cart-check" data-food="'+id+'" '+(c.checked?'checked':'')+'><span><strong>'+name+'</strong>'+(c.checked?'':'<small>Faltan '+itemQuantity(r.id,r.missing)+' · En casa '+itemQuantity(r.id,r.stock)+'</small>')+'</span></label>'+controls+'</div>';
   }).join('');
    return '<details class="shop-group" data-shop-group data-accordion-id="shop-'+escapeAttribute(slug)+'"><summary class="shop-group-title" data-action="toggle-accordion">'+escapeHTML(group)+'<span>'+groupRows.length+' artículos</span></summary><div class="shop-group-items">'+items+'</div></details>';
  }).join('');
  return '<section class="shop-store"><h2>'+(store==='merc'?'🛒 Supermercado':'🍎 Frutería')+'</h2>'+(groupMarkup||'<div class="empty">Sin productos pendientes en esta tienda.</div>')+'</section>';
 }).join('');
 const ranges=[['3','Próximos 3 días'],['7','Próximos 7 días'],['14','Próximos 14 días'],['visible','Semana visible'],['all','Ciclo pendiente']];
 const extraOptions=Object.keys(FOOD).sort((a,b)=>FOOD[a][0].localeCompare(FOOD[b][0],'es')).map(id=>'<option value="'+escapeAttribute(id)+'">'+escapeHTML(FOOD[id][0])+'</option>').join('');
 return '<div class="page-intro"><div class="eyebrow">COMPRAR COMO EN EL SUPERMERCADO</div><h1>Mi compra inteligente</h1><p>La app convierte las cantidades de las recetas a <strong>envases, bandejas, botes y unidades</strong>. Marca lo que metes en el carrito y pulsa <strong>Finalizar compra</strong> para actualizar la despensa de una sola vez.</p></div><div class="shop-top-actions"><button class="btn" data-action="copy-shopping">Copiar lista</button><button class="btn btn-subtle" data-action="navigate" data-view="despensa">Ver despensa</button></div>'+startBanner()+reminderBanner()+'<div class="shop-toolbar"><label class="field">Compra para<select data-change="shopping-range">'+ranges.map(([value,label])=>'<option value="'+escapeAttribute(value)+'" '+(shopRange===value?'selected':'')+'>'+escapeHTML(label)+'</option>').join('')+'</select></label><label class="search-input shop-search">🔎<input type="search" id="shoppingSearch" placeholder="Buscar producto…" value="'+escapeAttribute(shoppingSearch)+'" aria-label="Buscar producto en la compra"></label><div class="range-meta">📅 '+escapeHTML(rangeDates())+' · '+escapeHTML(model.remaining)+' ingestas pendientes</div></div><div class="stat-grid compact-stats"><div class="stat"><div class="stat-top">Productos pendientes</div><div class="stat-value">'+escapeHTML(model.rows.length)+'</div></div><div class="stat"><div class="stat-top">Cubiertos por despensa</div><div class="stat-value">'+escapeHTML(model.covered)+'</div></div><div class="stat"><div class="stat-top">Productos en casa</div><div class="stat-value">'+escapeHTML(allStock)+'</div></div></div><div class="shop-instructions"><span>💡</span><p>La compra ya utiliza las raciones adaptadas a tu perfil. Los envases son orientativos: comprueba la etiqueta y corrige el tamaño solo si es distinto. <strong>Marcar un envase no modifica la despensa.</strong> Al pulsar «Finalizar compra» se suman a existencias los artículos marcados.</p></div>'+byStore+mobileShopBarHTML(model)+'<div class="empty shop-search-empty" id="shoppingSearchEmpty" hidden>No hay productos que coincidan con la búsqueda.</div><section class="shop-group shop-group--extra"><h2>➕ Compra imprevista</h2><p class="muted">¿Has comprado algo fuera del menú? Añádelo al carrito.</p><div class="extra-purchase"><select id="extraFood">'+extraOptions+'</select><input id="extraAmount" type="number" min="1" step="1" value="1" aria-label="Número de envases"><button class="btn" data-action="add-extra">Añadir producto</button></div><div id="extraCart">'+extraCartHTML()+'</div></section><div class="shop-actions"><button class="btn btn-primary desktop-finish-cart" data-action="finish-cart">✅ Finalizar compra y actualizar despensa</button></div><div class="footnote">Al final del ciclo las compras de 7 y 14 días pueden coincidir si no quedan suficientes recetas. Guarda frescos en condiciones seguras, congelando lo que no se vaya a consumir a tiempo. Para hacer una compra distinta cambia el período antes de marcar productos.</div>';
}
function mobileShopBarHTML(){return '<div class="mobile-shop-bar" id="mobileShopBar" role="region" aria-label="Progreso de la compra"><span class="mobile-shop-progress" id="shopProgress" role="status" aria-live="polite"></span><button type="button" class="btn btn-primary" data-action="finish-cart" disabled>Finalizar compra</button></div>'}
function updateShoppingProgress(){const progress=document.getElementById('shopProgress'),button=document.querySelector('#mobileShopBar [data-action="finish-cart"]');if(!progress||!button)return;const model=shoppingModel(),selected=model.rows.filter(r=>{const choice=cartChoice(r.id,r.missing);return choice.checked&&Number(choice.count)>0}).length,extras=(state.cartExtras||[]).length,total=selected+extras,remaining=Math.max(0,model.rows.length-selected);progress.textContent=model.rows.length===0&&extras===0?'No hay productos pendientes para este período.':total+' '+(total===1?'marcado':'marcados')+' · '+remaining+' '+(remaining===1?'pendiente':'pendientes');button.disabled=total===0}
function applyShoppingSearch(){const input=document.getElementById('shoppingSearch');if(!input)return;const query=input.value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');let visible=0;document.querySelectorAll('.shop-store').forEach(store=>{let storeVisible=0;store.querySelectorAll('.pack-row').forEach(row=>{const name=(row.dataset.shopName||'').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');const match=!query||name.includes(query);row.classList.toggle('search-hidden',!match);if(match){visible++;storeVisible++}});store.querySelectorAll('details[data-shop-group]').forEach(group=>{const hasMatch=Array.from(group.querySelectorAll('.pack-row')).some(row=>!row.classList.contains('search-hidden'));group.classList.toggle('search-hidden',query.length>0&&!hasMatch);if(query.length>0)group.open=hasMatch});store.classList.toggle('search-hidden',query.length>0&&storeVisible===0)});const empty=document.getElementById('shoppingSearchEmpty');if(empty)empty.hidden=!query||visible>0}
function extraCartHTML(){return (state.cartExtras||[]).map((e,i)=>'<p>🛍️ '+escapeHTML(FOOD[e.id]?.[0]||e.id)+' · '+escapeHTML(e.count)+' × '+itemQuantity(e.id,e.size)+' <button class="btn btn-quiet" data-action="remove-extra" data-index="'+escapeAttribute(i)+'">Quitar</button></p>').join('')}
function cartChange(id,key,value){if(!FOOD[id])return;const r=shoppingModel().rows.find(x=>x.id===id);const pack=commercialPack(id);const cur=cartChoice(id,r?r.missing:0);cur[key]=value;state.cart[cartKey(id)]=cur;save();}
function finishCart(){const model=shoppingModel(),purchases=[];for(const r of model.rows){const c=cartChoice(r.id,r.missing);if(!c.checked||c.count<=0)continue;const amount=Number(c.count)*Number(c.size);if(!Number.isFinite(amount)||amount<=0)continue;purchases.push({id:r.id,amount})}for(const extra of state.cartExtras||[]){if(FOOD[extra.id]&&extra.count>0&&extra.size>0)purchases.push({id:extra.id,amount:extra.count*extra.size})}if(!purchases.length){showToast('Marca los productos que has comprado');return}const purchaseId=newOperationId(),date=new Date().toISOString();for(const [index,x] of purchases.entries()){const operationId=purchaseId+':'+index;applyMovement({operationId,foodId:x.id,quantity:x.amount,kind:'purchase',createdAt:date});state.purchases.push({...x,date,operationId})}state.purchases=state.purchases.slice(-2500);state.cart={};state.cartExtras=[];save();render();showToast('✅ '+purchases.length+' productos añadidos a la despensa')}

function activeFoods(){const ids=new Set();MENUS.forEach(week=>week.forEach(day=>day.forEach(id=>REC[id].ingredients.forEach(i=>ids.add(i.id)))));return ids}
function pantryShortfalls(){const totals={};for(const entry of Object.values(state.done||{})){for(const [id,amount] of Object.entries(entry?.shortfall||{})){if(FOOD[id]&&Number(amount)>0)totals[id]=(totals[id]||0)+Number(amount)}}return totals}
function pantryList(){const used=usedTotals(),active=activeFoods(),norm=x=>x.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,''),q=norm(pantrySearch);return Object.keys(FOOD).filter(id=>(pantryFilter==='all'||pantryFilter==='stock'&&Number(state.stock[id]||0)>0||pantryFilter==='deficit'&&Number(state.stock[id]||0)<0||pantryFilter==='used'&&active.has(id))&&norm(FOOD[id][0]).includes(q)).sort((a,b)=>(CATALOG[a]?.[0]||'z').localeCompare(CATALOG[b]?.[0]||'z')||(CATALOG[a]?.[1]||'z').localeCompare(CATALOG[b]?.[1]||'z')||FOOD[a][0].localeCompare(FOOD[b][0],'es'))}
function pantryListHTML(){
 const ids=pantryList(),used=usedTotals();if(!ids.length)return '<div class="empty"><span>🧺</span>Sin ingredientes con estos filtros.</div>';
 const groups=new Map();
 for(const id of ids){const catalog=CATALOG[id]||['merc','Otros',100],group=(catalog[0]==='merc'?'Supermercado':'Frutería')+' · '+catalog[1];if(!groups.has(group))groups.set(group,[]);groups.get(group).push(id)}
 return [...groups.entries()].map(([group,items])=>{
  const slug=group.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-');
  const rows=items.map(id=>{
   const balance=Number(state.stock[id]||0),unit=foodStockUnit(id),safeId=escapeAttribute(id),safeUnit=escapeHTML(unit),safeBalance=escapeAttribute(balance);
   return '<div class="pantry-row"><div><strong>'+escapeHTML(FOOD[id][0])+'</strong><small>Consumido en el ciclo: '+itemQuantity(id,used[id]||0)+'</small>'+(balance<0?'<small class="deficit-note">Déficit actual: '+itemQuantity(id,-balance)+'</small>':'')+'</div><div class="pantry-value"><label for="stock-'+safeId+'">Saldo ('+safeUnit+')</label><input id="stock-'+safeId+'" type="number" min="-1000000" step="'+(unit==='ud' ? .25 : 0.1)+'" max="1000000" data-change="stock-quantity" data-food="'+safeId+'" value="'+safeBalance+'" aria-label="Saldo de despensa de '+escapeAttribute(FOOD[id][0])+'"></div></div>';
  }).join('');
   return '<details class="shop-group pantry-category" data-accordion-id="pantry-'+escapeAttribute(slug)+'"'+(pantrySearch?' open':'')+'><summary class="shop-group-title" data-action="toggle-accordion">'+escapeHTML(group)+'<span>'+items.length+' alimentos</span></summary><div class="pantry-grid">'+rows+'</div></details>';
 }).join('');
}
function pantryView(){const doneMeals=totalDone(),used=usedTotals(),shortfalls=pantryShortfalls(),positive=Object.values(state.stock).filter(n=>Number(n)>0).length,shortfallRows=Object.entries(shortfalls).sort((a,b)=>b[1]-a[1]).slice(0,8);return '<div class="page-intro"><div class="eyebrow">CONTROL REAL DE INGREDIENTES</div><h1>Mi despensa e ingredientes consumidos</h1><p>Registra lo que tienes y lo que compras. Al completar una receta, se registra todo el consumo aunque el saldo anotado no alcance.</p></div><div class="stat-grid compact-stats">'+[['Comidas realizadas',doneMeals+'/105','registros del ciclo'],['Ingredientes consumidos',Object.keys(used).length,'referencias diferentes'],['Con saldo positivo',positive,'productos en despensa'],['Con faltantes registrados',shortfallRows.length,'ingredientes con faltante']].map(x=>'<div class="stat"><div class="stat-top">'+x[0]+'</div><div class="stat-value">'+x[1]+'</div><div class="stat-note">'+x[2]+'</div></div>').join('')+'</div><div class="soft-banner soft-banner--pantry"><span>🧾</span><div><strong>El faltante queda registrado</strong><p>Si una receta consume más de lo anotado, la comida se registra y el saldo puede quedar negativo. Así ves la diferencia y la lista de compra la tiene en cuenta.</p></div></div>'+(shortfallRows.length?'<section class="panel panel--spaced"><h3>Faltantes detectados en comidas</h3><div class="simple-list">'+shortfallRows.map(([id,n])=>'<div class="simple-row"><span>'+escapeHTML(FOOD[id][0])+'</span><strong>'+itemQuantity(id,n)+'</strong></div>').join('')+'</div></section>':'')+'<div class="recipe-tools"><label class="search-input">'+ic('search')+'<input id="pantrySearch" type="search" placeholder="Buscar ingredientes…" value="'+escapeHTML(pantrySearch)+'" aria-label="Buscar ingredientes"></label><div class="chips">'+[['used','De mis menús'],['stock','Con stock'],['deficit','Con déficit'],['all','Todos']].map(a=>'<button class="chip '+(pantryFilter===a[0]?'active':'')+'" data-action="pantry-filter" data-filter="'+a[0]+'">'+a[1]+'</button>').join('')+'</div></div><div id="pantryResults">'+pantryListHTML()+'</div><div class="two-cols two-cols--spaced"><section class="panel"><h3>📋 Registro del consumo</h3><p>Consumo acumulado del ciclo actual.</p><div class="simple-list">'+Object.entries(used).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([id,n])=>'<div class="simple-row"><span>'+escapeHTML(FOOD[id][0])+'</span><strong>'+itemQuantity(id,n)+'</strong></div>').join('')+'</div>'+(doneMeals===0?'<div class="target-note">Completa una comida del menú para comenzar.</div>':'')+'</section><section class="panel"><h3>🛍️ Compras registradas</h3><p>Entradas añadidas a la despensa; los cambios manuales también quedan anotados.</p><div class="simple-list">'+(state.purchases.length?state.purchases.slice(-8).reverse().map(p=>'<div class="simple-row"><span>'+escapeHTML(FOOD[p.id]?.[0]||'Ingrediente')+'<small class="muted-detail">'+escapeHTML(formatMadridDateTime(p.date,{day:'numeric',month:'short',year:'numeric'})||'')+'</small></span><strong>+'+(FOOD[p.id]?itemQuantity(p.id,p.amount):'')+'</strong></div>').join(''):'<p>Aún no hay compras registradas.</p>')+'</div></section></div><div class="footnote">Unidades de inventario: g, ml y ud. Las recetas pesan en gramos las frutas y verduras enteras; la despensa y las compras las cuentan por piezas usando un peso comestible aproximado. La leche se compra en tetrabrik de 1 L y el café molido se mide en gramos.</div>'}
function recipeIngredients(r,usage,loggedShortfall){return r.ingredients.map(item=>{const f=FOOD[item.id],q=usage[item.id]||0,stock=Number(state.stock[item.id]||0),neededStock=recipeToStockAmount(item.id,q),missing=loggedShortfall?Number(loggedShortfall[item.id]||0):Math.max(0,neededStock-Math.max(0,stock));return '<div class="ingredient-row"><span>'+escapeHTML(f[0])+'<small class="muted-detail">En despensa: '+itemQuantity(item.id,stock)+(missing>.001?' · '+(loggedShortfall?'Faltaron ':'Faltan ')+itemQuantity(item.id,missing):'')+'</small></span><span>'+recipeQuantity(item.id,q)+'</span></div>'}).join('')}
function weightChart(){const xs=[...state.weights].filter(x=>Number.isFinite(+x.kg)&&+x.kg>0).sort((a,b)=>a.date.localeCompare(b.date)).slice(-16);if(xs.length<2)return '<div class="empty empty-chart"><span>📈</span>Añade al menos dos registros para ver tu evolución.</div>';const W=620,H=240,L=40,R=12,T=18,B=35,values=xs.map(x=>Number(x.kg)),min=Math.min(...values)-.7,max=Math.max(...values)+.7,span=max-min||1;const pos=xs.map((x,i)=>({x:L+i*(W-L-R)/(xs.length-1),y:T+(max-Number(x.kg))/span*(H-T-B)}));let path=pos.map((p,i)=>(i?'L':'M')+p.x.toFixed(2)+' '+p.y.toFixed(2)).join(' ');let area=path+' L '+pos.at(-1).x+' '+(H-B)+' L '+pos[0].x+' '+(H-B)+' Z';let grid=[0,.25,.5,.75,1].map(v=>{const y=T+v*(H-T-B);return '<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'" stroke="#e6ebe3"/><text x="'+(L-9)+'" y="'+(y+4)+'" text-anchor="end" fill="#87978a" font-size="11">'+(max-v*span).toFixed(1)+'</text>'}).join('');return '<svg class="weight-graph" viewBox="0 0 620 240" role="img" aria-label="Evolución registrada del peso en kilogramos">'+grid+'<path d="'+area+'" fill="#dceee2" opacity=".85"/><path d="'+path+'" fill="none" stroke="#3c7e62" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'+pos.map((p,i)=>'<circle cx="'+p.x+'" cy="'+p.y+'" r="4" fill="#fff" stroke="#3c7e62" stroke-width="2.6"/><text x="'+p.x+'" y="'+(H-8)+'" font-size="10" fill="#819181" text-anchor="middle">'+escapeHTML(xs[i].date.slice(5).replace('-','/'))+'</text>').join('')+'</svg>'}
function trackingView(){
 const arr=[...state.weights].sort((a,b)=>b.date.localeCompare(a.date)),last=arr[0],before=arr[1],delta=last&&before?(last.kg-before.kg).toFixed(1):null;
 const entries=arr.length?arr.slice(0,7).map(w=>'<div class="weight-entry"><div><b>'+Number(w.kg).toFixed(1)+' kg</b> <small>· '+escapeHTML(w.date)+'</small></div><button data-action="delete-weight" data-date="'+escapeHTML(w.date)+'" title="Eliminar peso" aria-label="Eliminar registro">'+ic('trash')+'</button></div>').join(''):'<p>Aún no hay registros.</p>';
 return '<div class="page-intro"><div class="eyebrow">SEGUIMIENTO PERSONAL</div><h1>Actividad y peso</h1><p>Las sesiones aparecen al principio de esta página. Regístralas una vez realizadas y usa «Eliminar sesión» para corregir una anotación. Una sesión nunca modifica días futuros ni las comidas que ya registraste.</p></div>'+activityHistoryPanel()+'<div class="two-cols two-cols--tracking"><section class="panel"><h3>Tu evolución de peso</h3><p>Últimas 16 mediciones guardadas en tu cuenta.</p>'+weightChart()+(last?'<div class="day-summary day-summary--last-weight"><div><h3>Último registro · '+Number(last.kg).toFixed(1)+' kg</h3><p>'+escapeHTML(last.date)+'</p></div><span class="tiny-pill">'+(delta===null?'Primer registro':(Number(delta)>0?'+':'')+delta+' kg vs. anterior')+'</span></div>':'')+'</section><section class="panel"><h3>Añadir un peso</h3><p>Pésate tres mañanas a la semana en condiciones similares.</p><form id="weightForm" class="form-row"><div class="field"><label for="weightDate">Fecha</label><input id="weightDate" name="date" type="date" required value="'+isoDate(today())+'"></div><div class="field"><label for="weightKg">Peso (kg)</label><input id="weightKg" name="weight" type="number" step="0.1" min="30" max="250" placeholder="75.0" required></div><button class="btn btn-primary" type="submit">'+ic('plus')+' Guardar</button></form><div class="weight-entries">'+entries+'</div></section></div><div class="two-cols two-cols--tracking"><section class="panel"><h3>Objetivos orientativos</h3><ul class="bullet-list"><li>Proteína orientativa para tu perfil: '+nformat(nutritionTarget(0).protein)+' g/día.</li><li>Objetivo base: '+nformat(nutritionTarget(0).calories)+' kcal; una sesión real se añade únicamente a su fecha.</li><li>El gasto se estima con el tipo e intensidad elegidos y la duración registrada.</li><li>Revisa peso, actividad, apetito, rendimiento y recuperación cada dos semanas.</li></ul></section><section class="panel"><h3>Datos y privacidad</h3><p>Los datos se sincronizan con Supabase y quedan asociados a tu cuenta; este navegador conserva una copia de trabajo. Puedes restaurar una copia JSON compatible con los formatos admitidos.</p><div class="shop-actions"><button class="btn" data-action="import">Importar</button><button class="btn btn-quiet btn-danger" data-action="reset-progress">'+ic('trash')+' Reiniciar todo</button></div></section></div>'
}
function guideView(){return firstUseBanner()+'<div class="page-intro"><div class="eyebrow">PLANIFICACIÓN Y SEGUIMIENTO</div><h1>Guía de uso y planificación</h1><p>Consulta los ajustes de calorías, alimentación durante la recuperación y cómo mantener actualizada la despensa durante las tres semanas.</p></div><div class="guide-grid"><section class="guide-card"><div class="guide-ico">🔥</div><h3>Metabolismo basal y calorías</h3><p>Con los datos actuales: <strong>'+nformat(nutritionTarget(0).rmr)+' kcal</strong> de gasto estimado en reposo, <strong>'+nformat(nutritionTarget(0).maintenance)+' kcal</strong> de mantenimiento en descanso (antes del objetivo). Se recalcula al cambiar peso, edad, estatura o actividad.</p><p><button class="btn btn-subtle" data-action="navigate" data-view="perfil">Cambiar perfil →</button></p></section><section class="guide-card"><div class="guide-ico">⚖️</div><h3>Objetivos de esta etapa</h3><p>Meta: <strong>'+escapeHTML(GOAL_NAMES[state.profile.goal])+'</strong>. Objetivo base: '+nformat(nutritionTarget(0).calories)+' kcal; las sesiones reales se añaden a su fecha; proteína: '+nformat(nutritionTarget(0).protein)+' g. Son orientaciones: ajusta con la evolución sin dietas restrictivas durante una fractura.</p></section><section class="guide-card"><div class="guide-ico">🦴</div><h3>Recuperación ósea</h3><p>Una alimentación equilibrada con suficiente energía y proteína, además de fuentes de calcio y vitamina D, acompaña la reparación normal del hueso. El siguiente menú que generes con Recuperación activa dará preferencia a estos alimentos y a frutas y verduras con vitamina C; no promete acelerar la consolidación ni sustituye las indicaciones de traumatología. La vitamina D procede de pocos alimentos; consulta con un profesional antes de tomar suplementos. Fuentes: <a href="https://www.northerncarealliance.nhs.uk/patient-information/patient-leaflets/orthopaedic-surgery-discharge-advice-following-simple-foot-fracture?q=%2Fpatient-information%2Fpatient-leaflets%2Forthopaedic-surgery-discharge-advice-following-simple-foot-fracture" target="_blank" rel="noopener noreferrer">NHS · fractura simple de pie</a>, <a href="https://www.nhs.uk/conditions/broken-leg/" target="_blank" rel="noopener noreferrer">NHS · fracturas</a>, <a href="https://ods.od.nih.gov/factsheets/calcium-HealthProfessional/" target="_blank" rel="noopener noreferrer">NIH · calcio</a> y <a href="https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/" target="_blank" rel="noopener noreferrer">NIH · vitamina D</a> y <a href="https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/" target="_blank" rel="noopener noreferrer">NIH · vitamina C</a>.</p></section><section class="guide-card"><div class="guide-ico">🥦</div><h3>Pesos y porciones</h3><p>Arroz, pasta, fideos, cuscús, quinoa y avena: <strong>peso seco</strong>. Legumbres: <strong>cocidas escurridas</strong>. Carnes/pescados: <strong>antes de cocinar</strong>. Las kcal son orientativas; consulta las etiquetas reales de Supermercado.</p></section><section class="guide-card guide-wide"><div class="guide-ico">🗓️</div><h3>Organización de la semana '+(visibleWeek+1)+'</h3><p>Prepara verduras y repartos de proteína el domingo y repasa las existencias los miércoles.</p><div class="prep-items">'+PREP.map(x=>{const k=visibleWeek+'#'+x[0];return '<label class="prep-item '+(state.prep[k]?'checked':'')+'"><input type="checkbox" data-change="prep" data-id="'+k+'" '+(state.prep[k]?'checked':'')+'><span>'+x[1]+'</span></label>'}).join('')+'</div></section><section class="guide-card"><div class="guide-ico">🧺</div><h3>Despensa y compra dinámica</h3><p>1) Introduce lo que tengas en <strong>Despensa</strong>. 2) Consulta la compra para los próximos siete días. 3) Marca envases comprados y finaliza la compra. 4) Al marcar un plato, se registran sus ingredientes consumidos y se descuenta la cantidad disponible. Al desmarcar, se revierte el descuento realizado.</p></section><section class="guide-card"><div class="guide-ico">🧊</div><h3>Conservación</h3><p>Prepara por tandas, pero no dejes tres semanas de comida fresca en la nevera. Refrigera rápidamente, congela lo que no vayas a tomar pronto y extrema precauciones con el arroz cocido, carnes y pescado.</p></section><section class="guide-card guide-wide"><div class="guide-ico">🔔</div><h3>Aviso de fin de ciclo</h3><p>La app muestra un aviso <strong>los últimos tres días del plan</strong> cuando la abres. Un HTML sin servidor no puede enviarte avisos en segundo plano de forma fiable. Si quieres un aviso incluso con la web cerrada, descarga un recordatorio de calendario para 3 días antes de acabar.</p><div class="shop-actions"><button class="btn btn-primary" data-action="calendar-reminder">'+ic('calendar')+' Descargar recordatorio (.ics)</button><button class="btn" data-action="new-prompt">'+ic('spark')+' Copiar encargo del próximo menú</button></div></section><section class="guide-card guide-wide"><div class="guide-ico">📅</div><h3>Fecha de inicio del ciclo</h3><p>Tu ciclo comienza el <strong>'+formatDate(dateFromISO(state.start),{weekday:'long',day:'numeric',month:'long'})+'</strong> y acaba el <strong>'+formatDate(addDays(dateFromISO(state.start),20),{weekday:'long',day:'numeric',month:'long'})+'</strong>. Puedes modificar la fecha: el primer día será exactamente el que elijas, sin ajustarse al lunes. Si ya hay comidas registradas, se archivarán antes de empezar el nuevo ciclo; el inventario y los pesos permanecerán. Cambiar la fecha no genera recetas nuevas: para otro menú, utiliza el botón de copiar encargo al final del ciclo.</p><div class="shop-actions"><label class="field">Primer día del plan<input id="cycleStart" type="date" data-change="cycle-start" value="'+escapeHTML(state.start)+'"></label></div></section><section class="guide-card guide-wide"><div class="guide-ico">🔒</div><h3>Privacidad y restauración</h3><p>Los datos de tu cuenta se sincronizan con Supabase y también se conservan en este navegador como copia de trabajo. Si la sincronización falla, la app lo indicará y mantendrá los datos locales. La aplicación puede restaurar archivos JSON en formatos v5 a v8. La migración adapta las existencias antiguas de frutas y verduras y conserva los movimientos, comidas y registros sin volver a aplicarlos. Las antiguas marcas de fuerza se conservan como legado, pero no alteran los cálculos. No se admiten formatos anteriores a v5.</p><div class="shop-actions"><button class="btn" data-action="import">'+ic('upload')+' Importar copia JSON</button><button class="btn" data-action="print">'+ic('printer')+' Imprimir</button></div></section><section class="guide-card guide-wide"><div class="guide-ico">🥗</div><h3>Datos nutricionales</h3><p>Los valores de composición son genéricos y pueden no coincidir con los productos concretos de Supermercado. Si hay algún cambio clínico relevante durante la fractura, adapta la alimentación con un profesional sanitario.</p></section></div>'}
function captureRecipeProposalDraft(){const form=document.getElementById('recipeProposalForm');if(!form)return;const data=new FormData(form);recipeProposalDraft={mealType:String(data.get('mealType')||'desayuno'),name:String(data.get('name')||''),ingredients:data.getAll('ingredient').map(String),steps:data.getAll('step').map(String)}}
function recipeProposalView(){
 const draft=recipeProposalDraft;
 const ingredients=draft.ingredients.map((value,index)=>'<div class="proposal-list-row"><label for="proposalIngredient'+index+'">Ingrediente '+(index+1)+'<input id="proposalIngredient'+index+'" data-index="'+index+'" name="ingredient" type="text" maxlength="'+PROPOSAL_LIMITS.ingredient+'" value="'+escapeAttribute(value)+'" placeholder="Por ejemplo: pavo, arroz, tomate" required '+(recipeProposalSubmitting?'disabled':'')+'><small>Hasta '+PROPOSAL_LIMITS.ingredient+' caracteres.</small></label>'+(draft.ingredients.length>1?'<button type="button" class="btn btn-quiet proposal-remove" data-action="proposal-remove-ingredient" data-index="'+index+'" aria-label="Quitar ingrediente '+(index+1)+'" '+(recipeProposalSubmitting?'disabled':'')+'>Quitar</button>':'')+'</div>').join('');
 const steps=draft.steps.map((value,index)=>'<div class="proposal-list-row proposal-step-row"><label for="proposalStep'+index+'">Paso '+(index+1)+'<textarea id="proposalStep'+index+'" data-index="'+index+'" name="step" rows="2" maxlength="'+PROPOSAL_LIMITS.step+'" placeholder="Describe qué hay que hacer" required '+(recipeProposalSubmitting?'disabled':'')+'>'+escapeHTML(value)+'</textarea><small>Hasta '+PROPOSAL_LIMITS.step+' caracteres.</small></label>'+(draft.steps.length>1?'<button type="button" class="btn btn-quiet proposal-remove" data-action="proposal-remove-step" data-index="'+index+'" aria-label="Quitar paso '+(index+1)+'" '+(recipeProposalSubmitting?'disabled':'')+'>Quitar</button>':'')+'</div>').join('');
 return '<div class="page-intro"><div class="eyebrow">RECETAS DE LA COMUNIDAD</div><h1>Proponer una receta</h1><p>Comparte la idea con sus ingredientes y preparación. No necesitas calcular cantidades, calorías ni nutrientes.</p></div><section class="panel recipe-proposal-panel"><form id="recipeProposalForm" class="recipe-proposal-form"><label class="field" for="proposalMealType">Tipo de receta<select id="proposalMealType" name="mealType" required '+(recipeProposalSubmitting?'disabled':'')+'>'+[['desayuno','Desayuno'],['comida','Comida'],['snack','Snack'],['cena','Cena']].map(([value,label])=>'<option value="'+value+'"'+(draft.mealType===value?' selected':'')+'>'+label+'</option>').join('')+'</select></label><label class="field" for="proposalName">Nombre de la receta<input id="proposalName" name="name" type="text" maxlength="'+PROPOSAL_LIMITS.name+'" value="'+escapeAttribute(draft.name)+'" placeholder="Por ejemplo: Pasta con pavo y verduras" required '+(recipeProposalSubmitting?'disabled':'')+'><small>Hasta '+PROPOSAL_LIMITS.name+' caracteres.</small></label><fieldset class="proposal-fieldset"><legend>Ingredientes</legend><p class="proposal-help">Escribe un ingrediente por línea. No hacen falta cantidades.</p>'+ingredients+'<button type="button" class="btn proposal-add" data-action="proposal-add-ingredient" '+(draft.ingredients.length>=PROPOSAL_LIMITS.items||recipeProposalSubmitting?'disabled':'')+'>+ Añadir ingrediente</button></fieldset><fieldset class="proposal-fieldset"><legend>Preparación</legend><p class="proposal-help">Añade los pasos en el orden en que se prepara la receta.</p>'+steps+'<button type="button" class="btn proposal-add" data-action="proposal-add-step" '+(draft.steps.length>=PROPOSAL_LIMITS.items||recipeProposalSubmitting?'disabled':'')+'>+ Añadir paso</button></fieldset><div class="proposal-review-note"><strong>¿Qué ocurre después?</strong><p>El administrador revisará la propuesta y completará las cantidades y los datos nutricionales con ayuda de IA antes de incorporarla al recetario.</p></div><div class="dialog-actions"><button class="btn btn-primary" type="submit" '+(recipeProposalSubmitting?'disabled':'')+'>'+(recipeProposalSubmitting?'Enviando…':'Enviar propuesta')+'</button></div></form></section>';
}
function proposalMealTypeLabel(value){return {desayuno:'Desayuno',comida:'Comida',snack:'Snack',cena:'Cena'}[value]||'Receta'}
function proposalExpectedSnapshot(proposal){return {mealType:proposal.meal_type,name:proposal.recipe_name,ingredients:[...proposal.ingredients],steps:[...proposal.steps]}}
function recipeProposalEditForm(proposal){
 const draft=proposalEditingDraft,busy=proposalInboxBusy||proposalExporting;
 const ingredients=draft.ingredients.map((value,index)=>'<div class="proposal-list-row"><label for="adminProposalIngredient'+index+'">Ingrediente '+(index+1)+'<input id="adminProposalIngredient'+index+'" data-index="'+index+'" name="ingredient" type="text" maxlength="'+PROPOSAL_LIMITS.ingredient+'" value="'+escapeAttribute(value)+'" required '+(busy?'disabled':'')+'><small>Hasta '+PROPOSAL_LIMITS.ingredient+' caracteres.</small></label>'+(draft.ingredients.length>1?'<button type="button" class="btn btn-quiet proposal-remove" data-action="admin-proposal-remove-ingredient" data-index="'+index+'" aria-label="Quitar ingrediente '+(index+1)+'" '+(busy?'disabled':'')+'>Quitar</button>':'')+'</div>').join('');
 const steps=draft.steps.map((value,index)=>'<div class="proposal-list-row proposal-step-row"><label for="adminProposalStep'+index+'">Paso '+(index+1)+'<textarea id="adminProposalStep'+index+'" data-index="'+index+'" name="step" rows="2" maxlength="'+PROPOSAL_LIMITS.step+'" required '+(busy?'disabled':'')+'>'+escapeHTML(value)+'</textarea><small>Hasta '+PROPOSAL_LIMITS.step+' caracteres.</small></label>'+(draft.steps.length>1?'<button type="button" class="btn btn-quiet proposal-remove" data-action="admin-proposal-remove-step" data-index="'+index+'" aria-label="Quitar paso '+(index+1)+'" '+(busy?'disabled':'')+'>Quitar</button>':'')+'</div>').join('');
 return '<form id="recipeProposalEditForm" class="recipe-proposal-form proposal-edit-form" data-id="'+escapeAttribute(proposal.id)+'"><p class="proposal-help">Los cambios se guardarán en el buzón y aparecerán en la próxima exportación.</p><label class="field" for="adminProposalMealType">Tipo de receta<select id="adminProposalMealType" name="mealType" required '+(busy?'disabled':'')+'>'+[['desayuno','Desayuno'],['comida','Comida'],['snack','Snack'],['cena','Cena']].map(([value,label])=>'<option value="'+value+'"'+(draft.mealType===value?' selected':'')+'>'+label+'</option>').join('')+'</select></label><label class="field" for="adminProposalName">Nombre de la receta<input id="adminProposalName" name="name" type="text" maxlength="'+PROPOSAL_LIMITS.name+'" value="'+escapeAttribute(draft.name)+'" required '+(busy?'disabled':'')+'><small>Hasta '+PROPOSAL_LIMITS.name+' caracteres.</small></label><fieldset class="proposal-fieldset"><legend>Ingredientes</legend>'+ingredients+'<button type="button" class="btn proposal-add" data-action="admin-proposal-add-ingredient" '+(draft.ingredients.length>=PROPOSAL_LIMITS.items||busy?'disabled':'')+'>+ Añadir ingrediente</button></fieldset><fieldset class="proposal-fieldset"><legend>Preparación</legend>'+steps+'<button type="button" class="btn proposal-add" data-action="admin-proposal-add-step" '+(draft.steps.length>=PROPOSAL_LIMITS.items||busy?'disabled':'')+'>+ Añadir paso</button></fieldset><div class="dialog-actions"><button class="btn btn-primary" type="submit" '+(busy?'disabled':'')+'>'+(busy?'Guardando…':'Guardar cambios')+'</button><button class="btn" type="button" data-action="admin-cancel-proposal-edit" '+(busy?'disabled':'')+'>Cancelar</button></div></form>';
}
function recipeProposalAdminView(){
 if(!menukiAdmin)return '<div class="page-intro"><h1>Sin acceso</h1><p>Esta sección solo está disponible para el administrador.</p></div>';
 const count=proposalInbox.length;
 const rows=proposalInbox.map(proposal=>{
  const editing=proposalEditingId===proposal.id,actionsDisabled=proposalInboxBusy||proposalExporting||proposalEditingId!==null;
  const detail='<div class="proposal-card-columns"><section><h3>Ingredientes enviados</h3><ul>'+proposal.ingredients.map(item=>'<li>'+escapeHTML(item)+'</li>').join('')+'</ul></section><section><h3>Preparación enviada</h3><ol>'+proposal.steps.map(item=>'<li>'+escapeHTML(item)+'</li>').join('')+'</ol></section></div>';
  const actions=editing?'': '<div class="proposal-card-actions"><button class="btn" type="button" data-action="admin-edit-proposal" data-id="'+escapeAttribute(proposal.id)+'" aria-label="Editar propuesta '+escapeAttribute(proposal.recipe_name)+'" '+(actionsDisabled?'disabled':'')+'>Editar</button><button class="btn btn-danger" type="button" data-action="admin-delete-proposal" data-id="'+escapeAttribute(proposal.id)+'" aria-label="Eliminar propuesta '+escapeAttribute(proposal.recipe_name)+'" '+(actionsDisabled?'disabled':'')+'>Eliminar</button></div>';
  return '<article class="proposal-card"><header class="proposal-card-header"><div><div class="eyebrow">'+escapeHTML(proposalMealTypeLabel(proposal.meal_type))+'</div><h2>'+escapeHTML(proposal.recipe_name)+'</h2></div><time datetime="'+escapeAttribute(proposal.created_at)+'">'+escapeHTML(formatMadridDateTime(proposal.created_at,{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})||'Fecha no disponible')+'</time></header>'+(editing?recipeProposalEditForm(proposal):detail+actions)+'</article>';
 }).join('');
 const actionsDisabled=proposalInboxLoading||proposalInboxBusy||proposalExporting||proposalEditingId!==null;
 return '<div class="page-intro"><div class="eyebrow">ADMINISTRACIÓN</div><h1>Propuestas de recetas</h1><p>Corrige o descarta propuestas aquí. Después descarga el JSON para adjuntarlo a un chat de Codex con acceso al repositorio.</p></div><section class="panel proposal-admin-panel"><div class="proposal-admin-heading"><div><h2>Buzón de propuestas</h2><p>'+count+' '+(count===1?'propuesta guardada':'propuestas guardadas')+'</p></div><div class="proposal-admin-actions"><button class="btn btn-primary" type="button" data-action="admin-export-proposals" '+(!proposalInboxLoaded||!count||actionsDisabled?'disabled':'')+'>'+(proposalExporting?'Preparando JSON…':'Descargar JSON para Codex')+'</button><button class="btn" type="button" data-action="admin-refresh-proposals" '+(actionsDisabled?'disabled':'')+'>Actualizar</button></div></div>'+(proposalInboxError?'<p class="proposal-error" role="alert">'+escapeHTML(proposalInboxError)+'</p>':'')+(proposalInboxLoading?'<p role="status">Cargando propuestas…</p>':count?'<div class="proposal-list">'+rows+'</div>':'<div class="empty proposal-empty"><span>🥣</span>Aún no hay propuestas pendientes.</div>')+'<div class="proposal-purge"><div><strong>Limpiar el buzón</strong><p>Cuando todas las recetas ya estén incorporadas y publicadas en los JSON, puedes eliminar las propuestas guardadas aquí.</p></div><button class="btn btn-danger" type="button" data-action="admin-clear-proposals" '+(!count||actionsDisabled?'disabled':'')+'>'+(proposalInboxBusy?'Eliminando…':'Eliminar todas las propuestas')+'</button></div></section>';
}
function captureAdminProposalDraft(form=document.getElementById('recipeProposalEditForm')){if(!form||!proposalEditingDraft)return;const data=new FormData(form);proposalEditingDraft={...proposalEditingDraft,mealType:String(data.get('mealType')||''),name:String(data.get('name')||''),ingredients:[...form.querySelectorAll('[name="ingredient"]')].map(input=>input.value),steps:[...form.querySelectorAll('[name="step"]')].map(input=>input.value)}}
function beginRecipeProposalEdit(proposalId){if(!menukiAdmin||proposalInboxBusy||proposalExporting||proposalEditingId!==null)return;const proposal=proposalInbox.find(item=>item.id===proposalId);if(!proposal)return;proposalEditingId=proposal.id;proposalEditingDraft={expected:proposalExpectedSnapshot(proposal),mealType:proposal.meal_type,name:proposal.recipe_name,ingredients:[...proposal.ingredients],steps:[...proposal.steps]};render();document.getElementById('adminProposalName')?.focus()}
function cancelRecipeProposalEdit(){if(proposalInboxBusy)return;proposalEditingId=null;proposalEditingDraft=null;proposalInboxError='';render()}
function changeRecipeProposalEditList(kind,operation,index){if(!proposalEditingDraft||proposalInboxBusy)return;captureAdminProposalDraft();const field=kind==='ingredient'?'ingredients':'steps';if(operation==='add'){if(proposalEditingDraft[field].length>=PROPOSAL_LIMITS.items)return;proposalEditingDraft[field].push('')}else{if(proposalEditingDraft[field].length<=1)return;proposalEditingDraft[field].splice(index,1)}render();const selector=kind==='ingredient'?'[name="ingredient"]':'[name="step"]';const targetIndex=operation==='add'?proposalEditingDraft[field].length-1:Math.min(index,proposalEditingDraft[field].length-1);document.querySelector('#recipeProposalEditForm '+selector+'[data-index="'+targetIndex+'"]')?.focus()}
async function loadRecipeProposals(force=false){if(!menukiAdmin||!supabaseClient||proposalInboxLoading||proposalEditingId!==null||(!force&&proposalInboxLoaded))return;const loadToken=++proposalLoadToken,loadUserId=currentUserId;proposalInboxLoading=true;proposalInboxError='';if(view==='admin')render();try{const proposals=await recipeProposalService.list();if(loadToken!==proposalLoadToken||currentUserId!==loadUserId||!menukiAdmin)return;proposalInbox=proposals;proposalInboxLoaded=true}catch(error){if(loadToken!==proposalLoadToken||currentUserId!==loadUserId)return;proposalInboxError='No se pudieron cargar las propuestas. Comprueba la conexión e inténtalo de nuevo.';console.error('Menuki recipe proposals could not be loaded',error)}finally{if(loadToken===proposalLoadToken){proposalInboxLoading=false;if(view==='admin')render()}}}
async function downloadRecipeProposalExport(){if(!menukiAdmin||!supabaseClient||!proposalInboxLoaded||proposalInboxLoading||proposalInboxBusy||proposalExporting||proposalEditingId!==null)return;const exportToken=++proposalExportToken,exportUserId=currentUserId;proposalExporting=true;proposalInboxError='';render();try{proposalInbox=await recipeProposalService.list();if(proposalExportToken!==exportToken||currentUserId!==exportUserId||!menukiAdmin)return;proposalInboxLoaded=true;if(!proposalInbox.length){showToast('No hay propuestas para exportar.');return}const exportedAt=new Date().toISOString(),exportPackage=createRecipeProposalExport({proposals:proposalInbox,catalogVersion,exportedAt}),fileStamp=exportedAt.replace(/[-:.]/g,'');downloadFile('menuki-recipe-proposals-'+fileStamp+'.json','application/json;charset=utf-8',serializeRecipeProposalExport(exportPackage));showToast('JSON descargado con '+proposalInbox.length+' propuestas.')}catch(error){if(proposalExportToken!==exportToken)return;console.error('Menuki recipe proposal export failed',error);proposalInboxLoaded=false;proposalInboxError='No se pudo preparar el JSON. Actualiza el buzón e inténtalo de nuevo.';showToast(proposalInboxError)}finally{if(proposalExportToken===exportToken){proposalExporting=false;if(view==='admin')render()}}}
async function saveRecipeProposalEdit(event){
 event.preventDefault();const form=event.target;
 if(!menukiAdmin||proposalInboxBusy||!proposalEditingId||!proposalEditingDraft)return;
 captureAdminProposalDraft(form);if(!form.reportValidity())return;
 const proposal=proposalInbox.find(item=>item.id===proposalEditingId);
 if(!proposal){proposalInboxLoaded=false;proposalEditingId=null;proposalEditingDraft=null;showToast('La propuesta ya no está en el buzón. Actualiza la lista.');render();return}
 const draft=proposalEditingDraft,mealType=draft.mealType,name=draft.name.trim(),ingredients=draft.ingredients.map(value=>value.trim()),steps=draft.steps.map(value=>value.trim());
 if(!['desayuno','comida','snack','cena'].includes(mealType)||!name||name.length>PROPOSAL_LIMITS.name||!ingredients.length||ingredients.length>PROPOSAL_LIMITS.items||ingredients.some(value=>!value||value.length>PROPOSAL_LIMITS.ingredient)||!steps.length||steps.length>PROPOSAL_LIMITS.items||steps.some(value=>!value||value.length>PROPOSAL_LIMITS.step)){showToast('Revisa el nombre, el tipo, los ingredientes y los pasos.');return}
 proposalEditingDraft={...draft,mealType,name,ingredients,steps};proposalInboxBusy=true;proposalInboxError='';const actionToken=++proposalActionToken,actionUserId=currentUserId;render();let refreshAfterConflict=false;
 try{
  await recipeProposalService.update({proposalId:proposal.id,expected:draft.expected,mealType,recipeName:name,ingredients,steps});
  if(actionToken!==proposalActionToken||currentUserId!==actionUserId||!menukiAdmin)return;
  proposalInbox=proposalInbox.map(item=>item.id===proposal.id?{...item,meal_type:mealType,recipe_name:name,ingredients,steps}:item);proposalEditingId=null;proposalEditingDraft=null;proposalInboxLoaded=true;showToast('Cambios guardados. Se incluirán en la próxima exportación.');
 }catch(error){
  if(actionToken!==proposalActionToken||currentUserId!==actionUserId)return;
  console.error('Menuki recipe proposal update failed',error);
  if(error?.code==='PT409'||String(error?.message||'').includes('PROPOSAL_CHANGED')||String(error?.message||'').includes('PROPOSAL_NOT_FOUND')){proposalInboxError='La propuesta cambió en otra sesión. Se actualizará la lista; revisa de nuevo antes de guardar.';proposalEditingId=null;proposalEditingDraft=null;proposalInboxLoaded=false;refreshAfterConflict=true}
  else proposalInboxError='No se pudieron guardar los cambios. El borrador se conserva; inténtalo de nuevo.';
  showToast(proposalInboxError);
 }finally{if(actionToken===proposalActionToken){proposalInboxBusy=false;if(view==='admin')render();if(refreshAfterConflict)await loadRecipeProposals(true)}}
}
async function deleteRecipeProposal(proposalId){
 if(!menukiAdmin||proposalInboxBusy||proposalExporting||proposalEditingId!==null)return;
 const proposal=proposalInbox.find(item=>item.id===proposalId);if(!proposal)return;
 if(!confirm('¿Eliminar solo la propuesta «'+proposal.recipe_name+'»? También se borrarán sus ingredientes y pasos. Las demás propuestas se conservarán.'))return;
 proposalInboxBusy=true;proposalInboxError='';const actionToken=++proposalActionToken,actionUserId=currentUserId;render();let refreshAfterConflict=false;
 try{
  await recipeProposalService.deleteOne({proposalId:proposal.id,expected:proposalExpectedSnapshot(proposal)});
  if(actionToken!==proposalActionToken||currentUserId!==actionUserId||!menukiAdmin)return;
  proposalInbox=proposalInbox.filter(item=>item.id!==proposal.id);proposalInboxLoaded=true;showToast('Propuesta eliminada. Las demás se mantienen en el buzón.');
 }catch(error){
  if(actionToken!==proposalActionToken||currentUserId!==actionUserId)return;
  console.error('Menuki recipe proposal deletion failed',error);
  if(error?.code==='PT409'||String(error?.message||'').includes('PROPOSAL_CHANGED')||String(error?.message||'').includes('PROPOSAL_NOT_FOUND')){proposalInboxError='La propuesta cambió en otra sesión. Se actualizará la lista antes de volver a intentarlo.';proposalInboxLoaded=false;refreshAfterConflict=true}
  else proposalInboxError='No se pudo eliminar la propuesta. Comprueba la conexión e inténtalo de nuevo.';
  showToast(proposalInboxError);
 }finally{if(actionToken===proposalActionToken){proposalInboxBusy=false;if(view==='admin')render();if(refreshAfterConflict)await loadRecipeProposals(true)}}
}
async function clearRecipeProposals(){
 if(!menukiAdmin||proposalInboxBusy||proposalExporting||proposalEditingId!==null||!proposalInboxLoaded)return;
 const expectedCount=proposalInbox.length;if(!expectedCount)return;
 if(!confirm('Se eliminarán permanentemente las '+expectedCount+' propuestas del buzón, junto con sus ingredientes y pasos. Hazlo solo después de incorporar y publicar todas las recetas en los catálogos JSON. ¿Continuar?'))return;
 proposalInboxBusy=true;proposalInboxError='';const actionToken=++proposalActionToken,actionUserId=currentUserId;render();
 try{
  const deleted=await recipeProposalService.clearAll(expectedCount);
  if(actionToken!==proposalActionToken||currentUserId!==actionUserId||!menukiAdmin)return;
  proposalInbox=[];proposalInboxLoaded=true;showToast(Number(deleted)===1?'Se eliminó 1 propuesta.':'Se eliminaron '+Number(deleted)+' propuestas.');
 }catch(error){
  if(actionToken!==proposalActionToken||currentUserId!==actionUserId)return;
  console.error('Menuki recipe proposal purge failed',error);
  if(error?.code==='PT409'||String(error?.message||'').includes('PROPOSAL_COUNT_CHANGED')){proposalInboxError='El buzón cambió desde la última consulta. Actualízalo y confirma el borrado de nuevo.';proposalInboxLoaded=false}
  else proposalInboxError='No se pudieron eliminar las propuestas. Comprueba el acceso de administrador e inténtalo de nuevo.';
 }finally{if(actionToken===proposalActionToken){proposalInboxBusy=false;if(view==='admin')render()}}
}
async function submitRecipeProposal(event){event.preventDefault();if(recipeProposalSubmitting||!supabaseClient)return;captureRecipeProposalDraft();const name=recipeProposalDraft.name.trim(),ingredients=recipeProposalDraft.ingredients.map(value=>value.trim()),steps=recipeProposalDraft.steps.map(value=>value.trim());if(!name||name.length>PROPOSAL_LIMITS.name){showToast('Escribe un nombre de receta de hasta '+PROPOSAL_LIMITS.name+' caracteres.');return}if(!ingredients.length||ingredients.length>PROPOSAL_LIMITS.items||ingredients.some(value=>!value||value.length>PROPOSAL_LIMITS.ingredient)){showToast('Completa cada ingrediente (máximo '+PROPOSAL_LIMITS.ingredient+' caracteres).');return}if(!steps.length||steps.length>PROPOSAL_LIMITS.items||steps.some(value=>!value||value.length>PROPOSAL_LIMITS.step)){showToast('Completa cada paso (máximo '+PROPOSAL_LIMITS.step+' caracteres).');return}recipeProposalDraft={...recipeProposalDraft,name,ingredients,steps};recipeProposalSubmitting=true;render();try{await recipeProposalService.submit({clientId:recipeProposalClientId,mealType:recipeProposalDraft.mealType,recipeName:name,ingredients,steps});recipeProposalDraft=newRecipeProposalDraft();recipeProposalClientId=newRecipeProposalClientId();proposalInboxLoaded=false;showToast('Propuesta enviada para revisión. Todavía no forma parte del recetario.')}catch(error){console.error('Menuki recipe proposal could not be submitted',error);showToast('No se pudo enviar la propuesta. El texto sigue en el formulario; revisa la conexión e inténtalo de nuevo.')}finally{recipeProposalSubmitting=false;if(view==='proponer')render()}}
function addRecipeProposalItem(kind){captureRecipeProposalDraft();const field=kind==='ingredient'?'ingredients':'steps',limit=PROPOSAL_LIMITS.items;if(recipeProposalDraft[field].length>=limit)return;recipeProposalDraft[field].push('');render();document.querySelector('[name="'+(kind==='ingredient'?'ingredient':'step')+'"][data-index="'+(recipeProposalDraft[field].length-1)+'"]')?.focus()}
function removeRecipeProposalItem(kind,index){captureRecipeProposalDraft();const field=kind==='ingredient'?'ingredients':'steps';if(recipeProposalDraft[field].length<=1)return;recipeProposalDraft[field].splice(index,1);render()}
function firstUseBanner(){if(state.profileConfirmed||view!=='guia')return '';return '<section class="first-use-card" aria-labelledby="firstUseTitle"><div class="eyebrow">PRIMEROS PASOS · PASO 1 DE 5</div><h2 id="firstUseTitle">Empieza revisando tu perfil</h2><p>Menuki muestra valores genéricos de ejemplo. Los objetivos y las raciones se calculan con ellos hasta que confirmes tus datos.</p><ol><li class="current"><strong>Revisa tu perfil</strong><span>Confirma edad, altura, peso, movimiento y objetivo.</span></li><li><strong>Explora el menú</strong><span>Consulta los platos y cambia los que quieras.</span></li><li><strong>Configura la despensa</strong><span>Puedes hacerlo ahora o más adelante.</span></li><li><strong>Revisa la compra semanal</strong><span>Finalízala cuando hayas comprado.</span></li><li><strong>Registra lo que comas</strong><span>Marca cada comida después de tomarla.</span></li></ol><div class="first-use-actions"><button class="btn btn-primary" data-action="navigate" data-view="perfil">Revisar mi perfil</button><button class="btn btn-quiet" data-action="navigate" data-view="semana">Ver el menú</button></div></section>'}
function applyNoActiveCyclePresentation(root){if(!state.noActiveCycle)return;if(view==='inicio'){root.querySelector('.home-banner-date-link')?.remove();const menu=root.querySelector('.dashboard-menu');if(menu)menu.innerHTML='<div class="dashboard-menu-heading"><div><div class="eyebrow">PLANIFICACIÓN</div><h1>Menú pendiente de activación</h1><p>Selecciona el día de inicio en el aviso superior para mostrar tu menú.</p></div></div>'}if(view==='guia'){const card=[...root.querySelectorAll('.guide-card')].find(node=>node.querySelector('h3')?.textContent==='Fecha de inicio del ciclo');if(card){const paragraph=card.querySelector('p');if(paragraph)paragraph.textContent='Tu cuenta no tiene un ciclo activo. Selecciona el día de inicio en el aviso superior para empezar.';card.querySelector('.shop-actions')?.remove()}}if(view==='despensa'){const stat=root.querySelector('.compact-stats .stat');if(stat){const value=stat.querySelector('.stat-value'),note=stat.querySelector('.stat-note');if(value)value.textContent='—';if(note)note.textContent='Sin ciclo activo'}}}
function render(){const root=document.getElementById('viewRoot'),sameView=root.dataset.renderedView===view,openGroups=sameView?new Set([...root.querySelectorAll('details[data-accordion-id][open]')].map(node=>node.dataset.accordionId)):new Set();renderCycleSetupNotice();renderHeader();renderNav();const app=document.querySelector('.app');app.classList.toggle('shopping-view',view==='compra');app.classList.toggle('weekless-view',view==='compra'||view==='despensa');const renderer=({inicio:dashboard,perfil:profileView,semana:weekView,recetas:recipesView,compra:shopView,despensa:pantryView,evolucion:trackingView,guia:guideView,proponer:recipeProposalView,admin:recipeProposalAdminView}[view]||dashboard);root.innerHTML=renderer();root.dataset.renderedView=view;applyNoActiveCyclePresentation(root);applyHomeOnboarding(root);applyQuickGuideEntry(root);applyProfileAccount(root);for(const node of root.querySelectorAll('details[data-accordion-id]'))node.open=openGroups.has(node.dataset.accordionId)||node.open;if(view==='compra'){applyShoppingSearch();updateShoppingProgress()}}
 function showRecipe(id,day,slot,week=visibleWeek){const r=REC[id];if(!r)return;modalCtx={id,week:week==null?visibleWeek:Number(week),day:day==null?null:Number(day),slot:slot==null?null:Number(slot)};renderRecipeModal();const dlg=document.getElementById('recipeDialog');if(!dlg.open)dlg.showModal()}
function renderRecipeModal(){
 if(!modalCtx)return;
 const ctx=modalCtx,r=REC[ctx.id],hasDay=ctx.day!==null&&ctx.slot!==null;
 const usage=hasDay?recipeUsage(ctx.day,ctx.slot,ctx.week):mealUsage(r);
 const key=hasDay?mealKey(ctx.week,ctx.day,ctx.slot):null;
 const finalUsage=hasDay&&state.done[key]?.usage?state.done[key].usage:usage;
 const mac=getMacro(finalUsage),loggedShortfall=hasDay?state.done[key]?.shortfall:null;
 const date=hasDay?dateISOAt(ctx.week,ctx.day):null,sessions=date?activitySessionsForDate(date):[],future=hasDay&&date>isoDate(today());
 const stateText=hasDay?(done(ctx.day,ctx.slot,ctx.week)?'Marcar como pendiente':future?'Planificada · podrás registrarla el '+date:'Registrar comida como realizada'):'';
 const recipeType=r.type==='desayuno'?'DESAYUNO':r.type==='comida'?'COMIDA':r.type==='cena'?'CENA':'SNACK';
 const targetNote=hasDay
  ?(future&&!done(ctx.day,ctx.slot,ctx.week)
    ?'Esta comida está planificada para el '+date+'. Podrás registrarla cuando llegue el día.'
    :sessions.length?sessions.length+' sesión(es) realizada(s) el '+date+'; su ajuste afecta solo las comidas aún pendientes.'
    :'Cantidades del día sin sesiones registradas. Puedes registrar actividad ya realizada desde el resumen del día.')
  :'Cantidades base del recetario; el menú del día muestra las raciones personalizadas.';
 document.getElementById('modalContent').innerHTML=
  '<div class="dialog-body"><div class="eyebrow">'+escapeHTML(recipeType)+' · '+escapeHTML(r.time)+' MINUTOS</div>'+
  '<div class="dialog-top"><div><h2>'+escapeHTML(r.name)+'</h2><p class="intro">'+escapeHTML(r.intro||'Una receta sencilla, equilibrada y preparada con ingredientes fáciles de encontrar.')+'</p></div></div>'+
  '<div class="dialog-metrics">'+[['k','kcal'],['p','g proteína'],['c','g hidratos'],['f','g grasa']].map(x=>'<div class="dialog-metric"><b>'+nformat(mac[x[0]])+'</b><small>'+escapeHTML(x[1])+' aprox.</small></div>').join('')+'</div>'+
  '<div class="dialog-cols"><div><h3>Ingredientes · 1 persona</h3>'+recipeIngredients(r,finalUsage,loggedShortfall)+'</div><div><h3>Cómo prepararlo</h3><ol class="steps-list">'+r.steps.map((step,i)=>'<li><span class="step-n">'+(i+1)+'</span><span>'+escapeHTML(step)+'</span></li>').join('')+'</ol><div class="recipe-tip">💡 <strong>Consejo:</strong> '+escapeHTML(r.tip)+'</div></div></div>'+
  '<div class="dialog-actions">'+(hasDay?'<button class="btn btn-primary" data-action="toggle-meal" data-week="'+escapeAttribute(ctx.week)+'" data-day="'+escapeAttribute(ctx.day)+'" data-slot="'+escapeAttribute(ctx.slot)+'" data-modal="1" '+(future&&!done(ctx.day,ctx.slot,ctx.week)?'disabled aria-disabled="true"':'')+'>'+ic('check')+' '+escapeHTML(stateText)+'</button>':'')+'<button class="btn" data-action="close-modal">Cerrar</button></div>'+
  '<p class="target-note">'+escapeHTML(targetNote)+'</p></div>';
}
function toggleMeal(day,slot,week=visibleWeek){
 if(state.noActiveCycle){showToast('Selecciona primero el día de inicio del ciclo');return}
 const key=mealKey(week,day,slot);
 if(!state.done[key]&&mealIsFuture(day,week)){showToast('Esta comida está planificada. Podrás registrarla cuando llegue el día.');return}
 if(state.done[key]){
  const saved=state.done[key],baseId=saved.operationId||'legacy:'+key;
  for(const [id,amount] of Object.entries(saved.usage||{})){
   if(!FOOD[id])continue;
   const restore=Number(saved.legacySnapshot?(saved.deducted?.[id]||0):(saved.deducted?.[id]??recipeToStockAmount(id,amount)));
   if(restore>0)applyMovement({operationId:'revert:'+baseId+':'+id,foodId:id,quantity:restore,kind:'meal_reversal',sourceId:key});
  }
  delete state.done[key];showToast('Comida desmarcada · movimientos revertidos');
 }else{
  const rec=mealAt(day,slot,week),usage=recipeUsage(day,slot,week),deducted={},shortfall={},operationId=newOperationId(),completedAt=new Date().toISOString();
  for(const [id,amount] of Object.entries(usage)){
   if(!FOOD[id])continue;
   const inStock=Number(state.stock[id]||0),stockAmount=roundAmount(recipeToStockAmount(id,amount));
   deducted[id]=stockAmount;
   const missing=roundAmount(Math.max(0,stockAmount-Math.max(0,inStock)));
   if(missing>.001)shortfall[id]=missing;
   applyMovement({operationId:operationId+':'+id,foodId:id,quantity:-stockAmount,kind:'meal',sourceId:key,createdAt:completedAt});
  }
  state.done[key]={rid:rec.id,usage,deducted,shortfall,operationId,completedAt};
  const missingRows=Object.entries(shortfall);
  showToast(missingRows.length?'Comida registrada · falta stock de '+missingRows.map(([id,n])=>FOOD[id][0]+' ('+itemQuantity(id,n)+')').join(', '):'Comida registrada · despensa actualizada');
 }
 save();
}
function openActivityDialog(day=null,week=visibleWeek){const requested=day===null?isoDate(today()):dateISOAt(week,day),date=requested>isoDate(today())?isoDate(today()):requested,dlg=document.getElementById('activityDialog');document.getElementById('activityDate').value=date;document.getElementById('activityDate').max=isoDate(today());document.getElementById('activityType').innerHTML=activityOptionsMarkup();document.getElementById('activityDuration').value='';renderActivityDateSessions(date);if(!dlg.open)dlg.showModal()}
function renderActivityDateSessions(date){const root=document.getElementById('activityDateSessions');if(!root)return;const rows=activitySessionsForDate(date).slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));root.innerHTML='<div class="activity-date-list"><h3>Sesiones de '+escapeHTML(date||'')+'</h3>'+(rows.length?rows.map(s=>'<div class="activity-log-row"><div><strong>'+escapeHTML(activityLabel(s.activityId))+'</strong><small>'+escapeHTML(s.durationMinutes)+' min · +'+nformat(activitySessionEnergy(s))+' kcal netas aprox.</small></div><button type="button" class="btn btn-quiet btn-danger activity-delete-button" data-action="delete-activity" data-id="'+escapeAttribute(s.id)+'" aria-label="Eliminar sesión de '+escapeAttribute(date||'')+' · '+escapeAttribute(activityLabel(s.activityId))+'">'+ic('trash')+'<span>Eliminar sesión</span></button></div>').join(''):'<p class="muted">Sin sesiones registradas para esta fecha.</p>')+'</div>'}
function saveActivitySession(form){if(!form.reportValidity())return;const data=new FormData(form),date=String(data.get('date')),activityId=String(data.get('activityId')),durationMinutes=Number(data.get('durationMinutes')),activity=ACTIVITY_BY_ID[activityId];if(!dateFromISO(date)||date>isoDate(today())||!activity||!Number.isInteger(durationMinutes)||durationMinutes<1||durationMinutes>600){showToast('Revisa la fecha, el tipo de actividad y la duración');return}state.activitySessions.push({id:newOperationId(),date,activityId,met:activity.met,durationMinutes,createdAt:new Date().toISOString()});state.activitySessions=state.activitySessions.slice(-2000);state.cart={};save();document.getElementById('activityDuration').value='';renderActivityDateSessions(date);render();showToast('Sesión guardada · se recalculan las comidas aún pendientes de ese día')}
function deleteActivitySession(id){const session=state.activitySessions.find(x=>x.id===id);if(!session)return;if(!confirm('¿Eliminar la sesión de '+session.date+'? Las comidas ya registradas conservarán sus cantidades.'))return;state.activitySessions=state.activitySessions.filter(x=>x.id!==id);state.deletedActivitySessionIds=[...new Set([...(state.deletedActivitySessionIds||[]),id])].slice(-2000);state.cart={};save();renderActivityDateSessions(document.getElementById('activityDate')?.value||session.date);render();showToast('Sesión eliminada · se actualizaron las comidas pendientes de esa fecha')}
function navigate(where){const allowed=['inicio','perfil','semana','recetas','compra','despensa','evolucion','guia','proponer',...(menukiAdmin?['admin']:[])];if(!allowed.includes(where))return;const guideDialog=document.getElementById('quickGuideDialog');if(guideDialog?.open)guideDialog.close();mobileMoreOpen=false;if(where!=='semana'){cycleStartEditorOpen=false;cycleStartDraft=null}if(where==='semana'&&view==='inicio'){const position=todayMenuPosition();if(position){visibleWeek=position.week;selectedDay=position.day}}view=where;if(where==='admin')loadRecipeProposals();render();window.scrollTo({top:0,behavior:'smooth'})}
document.addEventListener('click',event=>{if(mobileMoreOpen&&!event.target.closest('#mobileNav')){mobileMoreOpen=false;renderNav()}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&mobileMoreOpen){mobileMoreOpen=false;renderNav();document.getElementById('mobileMoreToggle')?.focus()}});
function copyText(message){if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(message).then(()=>showToast('Texto copiado al portapapeles')).catch(()=>legacyCopy(message))}else legacyCopy(message)}
function legacyCopy(value){const ta=document.createElement('textarea');ta.value=value;ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.select();let success=false;try{success=document.execCommand('copy')}catch(e){}ta.remove();showToast(success?'Texto copiado':'No se pudo copiar automáticamente: prueba de nuevo en un navegador actualizado')}
function shoppingText(){const lines=['MI COMPRA · '+rangeDates()];const m=shoppingModel();for(const store of ['merc','fruit']){lines.push('',store==='merc'?'SUPERMERCADO':'FRUTERÍA');for(const r of m.rows.filter(x=>x.store===store)){const c=cartChoice(r.id,r.missing),p=commercialPack(r.id);lines.push((c.checked?'[x] ':'[ ] ')+FOOD[r.id][0]+' — '+c.count+' × '+p.label)}}for(const e of state.cartExtras||[])lines.push('[ ] EXTRA: '+FOOD[e.id][0]+' — '+e.count+' × '+itemQuantity(e.id,e.size));return lines.join('\n')}

function nextMenuPrompt(){const tally=Object.entries(usedTotals()).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([id,n])=>FOOD[id][0]+' ('+itemQuantity(id,n)+')');const text=['Quiero preparar un nuevo ciclo de menú saludable de 3 semanas en mi app HTML, con cinco ingestas al día y 21 días diferentes.','Perfil: '+(state.profile.sex==='manual'?'fórmula en reposo manual':state.profile.sex==='female'?'mujer':'hombre')+', '+effectiveWeight()+' kg, '+state.profile.height+' cm, '+state.profile.age+' años; movimiento '+state.profile.activity+'. Recuperación ósea activa: '+(state.profile.injury?'sí':'no')+'. Si está activa, prioriza comidas equilibradas con suficiente energía/proteína y fuentes de calcio y vitamina D, además de frutas/verduras variadas; no recomiendes suplementos ni prometas acelerar la consolidación. Las sesiones se registran después de realizarlas; no hay entrenamientos futuros previstos.','Objetivo: '+escapeHTML(GOAL_NAMES[state.profile.goal])+'. Objetivo diario base: '+nutritionTarget(0).calories+' kcal, '+nutritionTarget(0).protein+' g proteína, '+nutritionTarget(0).fat+' g grasas y '+nutritionTarget(0).carb+' g hidratos; estimaciones sujetas a evolución. Adaptar porciones: '+(state.profile.autoPortions?'sí':'no')+'.','Preferencias: alimentos variados, pescado blanco/azul, huevos, legumbres, pollo y pavo, arroz, pasta y verduras; desayunos con yogur, granola, avena o huevos, NUNCA queso en el desayuno.','Compras en Supermercado y frutería. Tiempo disponible: 20–30 minutos por receta. Horno, freidora de aire, microondas y batidora.','Necesito conservar la estructura de recetas (ingredientes medibles, pesos, preparación), registro de comidas y lista de compra que descuenta stock y calcula faltantes.','En el ciclo anterior completé '+totalDone()+' de 105 comidas. Ingredientes más consumidos registrados: '+(tally.join(', ')||'sin registros todavía')+'.','Genera platos distintos a los actuales y adapta cantidades después de verificar las calorías totales por día.'];copyText(text.join('\n\n'))}
function downloadFile(name,mime,data){const blob=new Blob([data],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000)}
function calendarReminder(){if(state.noActiveCycle){showToast('Selecciona primero el día de inicio del ciclo');return}const d=addDays(dateFromISO(state.start),17),s=isoDate(d).replaceAll('-','');const esc=x=>x.replaceAll('\\','\\\\').replaceAll(',','\\,').replaceAll(';','\\;').replaceAll('\n','\\n');const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Mi Plan Saludable//Avisos//ES','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:renovar-menu-'+s+'@plan-saludable-local','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''),'DTSTART:'+s+'T090000','DTEND:'+s+'T091500','SUMMARY:'+esc('Renovar menú saludable de 3 semanas'),'DESCRIPTION:'+esc('Tu ciclo acaba dentro de 3 días. Abre tu plan y prepara un menú diferente para las próximas 3 semanas.'),'BEGIN:VALARM','TRIGGER:-PT0M','ACTION:DISPLAY','DESCRIPTION:Renovar menú saludable','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');downloadFile('recordatorio_renovar_menu_'+s+'.ics','text/calendar;charset=utf-8',ics);showToast('Recordatorio descargado · impórtalo en tu calendario')}
function activateCycleFromSetup(requested){const date=dateFromISO(requested);if(!date){showToast('Selecciona una fecha de inicio válida');return false}if(!state.noActiveCycle)return false;const start=isoDate(date),scheduled=state.nextMenu?.start===start?state.nextMenu:null;state.start=start;state.noActiveCycle=false;state.activeMenus=cloneMenus(scheduled?.menus||FIXED_MENUS);state.activeMenuCatalogVersion=scheduled?.catalogVersion||catalogVersion;state.activeMenuGeneratedAt=scheduled?.generatedAt||null;state.activeMenuConfirmedAt=scheduled?.confirmedAt||null;state.activeMenuRecoveryFocus=scheduled?.recoveryFocus===true;if(scheduled)state.nextMenu=null;else if(state.nextMenu)state.nextMenu.start=isoDate(addDays(date,21));if(state.plannerDraft)state.plannerDraft.start=isoDate(addDays(date,21));state.done={};state.prep={};MENUS=cloneMenus(state.activeMenus);cycleSetupDateDraft='';alignCurrentDay();save();render();showToast('Ciclo activado · el menú empieza el '+formatDate(date,{day:'numeric',month:'long'}));return true}
function changeCycleStart(requested){if(state.noActiveCycle)return activateCycleFromSetup(requested);const d=dateFromISO(requested);if(!d){showToast('Fecha de inicio no válida');render();return}const next=isoDate(d);if(next===state.start){cycleStartEditorOpen=false;cycleStartDraft=null;render();return}if(Object.keys(state.done).length||Object.keys(state.legacyStrengthDays).length){if(!confirm('Cambiar la fecha archivará las comidas y marcas antiguas del ciclo. Se conservarán las sesiones de actividad, inventario, compras y pesos. ¿Continuar?')){cycleStartDraft=requested;render();document.getElementById('cycleStartMenu')?.focus();return}state.archives.push({start:state.start,done:state.done,legacyStrengthDays:state.legacyStrengthDays,prep:state.prep,menus:cloneMenus(MENUS),catalogVersion:state.activeMenuCatalogVersion||catalogVersion,generatedAt:state.activeMenuGeneratedAt,confirmedAt:state.activeMenuConfirmedAt,recoveryFocus:state.activeMenuRecoveryFocus,archivedAt:new Date().toISOString()});state.archives=state.archives.slice(-6)}state.start=next;if(state.nextMenu)state.nextMenu.start=isoDate(addDays(d,21));if(state.plannerDraft)state.plannerDraft.start=isoDate(addDays(d,21));state.done={};state.legacyStrengthDays={};state.prep={};cycleStartEditorOpen=false;cycleStartDraft=null;alignCurrentDay();save();render();showToast('Plan de 3 semanas actualizado')}
// Cambios de la interfaz (delegación compatible con páginas HTML locales).
document.addEventListener('click',function(event){const btn=event.target.closest('[data-action]');if(!btn)return;const action=btn.dataset.action;
 if(action==='sign-out'){signOutOfApp();return}
 if(action==='quick-guide-open'){openQuickGuide();return}
 if(action==='quick-guide-close'){document.getElementById('quickGuideDialog')?.close();return}
 if(action==='quick-guide-next'){if(quickGuideStep>=2){document.getElementById('quickGuideDialog')?.close();return}quickGuideStep++;renderQuickGuide();document.getElementById('quickGuideTitle')?.focus();return}
 if(action==='quick-guide-previous'){quickGuideStep=Math.max(0,quickGuideStep-1);renderQuickGuide();document.getElementById('quickGuideTitle')?.focus();return}
 if(action==='quick-guide-profile'){document.getElementById('quickGuideDialog')?.close();navigate('perfil');return}
 if(action==='quick-guide-choose-cycle'){document.getElementById('quickGuideDialog')?.close();const input=document.getElementById('cycleSetupDate');input?.scrollIntoView({behavior:'smooth',block:'center'});input?.focus();return}
 if(action==='toggle-accordion'){event.preventDefault();const group=btn.closest('details[data-accordion-id]');if(group)group.open=!group.open;return}
 if(action==='reload'){window.location.reload();return}
 if(action==='cloud-sync')return cloudSyncRetryTask==='refresh'?refreshCloudState(true):syncCloudNow(true)
 if(action==='toggle-more'){mobileMoreOpen=!mobileMoreOpen;renderNav();document.getElementById('mobileMoreToggle')?.focus();return}
 if(action==='activate-cycle'){const input=document.getElementById('cycleSetupDate');if(!input||!input.reportValidity())return;cycleSetupDateDraft=input.value;activateCycleFromSetup(input.value);return}
 if(action==='edit-cycle-start'){document.getElementById('quickGuideDialog')?.close();cycleStartDraft=state.start;cycleStartEditorOpen=true;navigate('semana');return}
 if(action==='toggle-cycle-start'){cycleStartEditorOpen=!cycleStartEditorOpen;cycleStartDraft=cycleStartEditorOpen?state.start:null;render();if(cycleStartEditorOpen)document.getElementById('cycleStartMenu')?.focus();else document.querySelector('[data-action="toggle-cycle-start"]')?.focus();return}
 if(action==='cancel-cycle-start'){cycleStartEditorOpen=false;cycleStartDraft=null;render();document.querySelector('[data-action="toggle-cycle-start"]')?.focus();return}
 if(action==='save-cycle-start'){const input=document.getElementById('cycleStartMenu');if(!input||!input.reportValidity())return;cycleStartDraft=input.value;changeCycleStart(input.value);return}
  if(action==='navigate')return navigate(btn.dataset.view);
  if(action==='proposal-add-ingredient')return addRecipeProposalItem('ingredient');
  if(action==='proposal-add-step')return addRecipeProposalItem('step');
  if(action==='proposal-remove-ingredient')return removeRecipeProposalItem('ingredient',Number(btn.dataset.index));
  if(action==='proposal-remove-step')return removeRecipeProposalItem('step',Number(btn.dataset.index));
  if(action==='admin-edit-proposal')return beginRecipeProposalEdit(btn.dataset.id);
  if(action==='admin-cancel-proposal-edit')return cancelRecipeProposalEdit();
  if(action==='admin-proposal-add-ingredient')return changeRecipeProposalEditList('ingredient','add');
  if(action==='admin-proposal-remove-ingredient')return changeRecipeProposalEditList('ingredient','remove',Number(btn.dataset.index));
  if(action==='admin-proposal-add-step')return changeRecipeProposalEditList('step','add');
  if(action==='admin-proposal-remove-step')return changeRecipeProposalEditList('step','remove',Number(btn.dataset.index));
  if(action==='admin-delete-proposal')return deleteRecipeProposal(btn.dataset.id);
  if(action==='admin-refresh-proposals')return loadRecipeProposals(true);
  if(action==='admin-export-proposals')return downloadRecipeProposalExport();
  if(action==='admin-clear-proposals')return clearRecipeProposals();
  if(action==='activity-open'){openActivityDialog(btn.dataset.day==null?null:Number(btn.dataset.day),btn.dataset.week==null?visibleWeek:Number(btn.dataset.week));return}
  if(action==='activity-close'){document.getElementById('activityDialog').close();return}
  if(action==='delete-activity'){deleteActivitySession(btn.dataset.id);return}
  if(action==='activity-history-more'){activityHistoryLimit+=12;render();return}
  if(action==='planner-open'){openPlannerDialog();return}
  if(action==='planner-close'){document.getElementById('plannerDialog').close();return}
  if(action==='planner-regenerate'){regeneratePlannerProposal();return}
  if(action==='planner-save'){savePlannerProposal();return}
  if(action==='planner-lock'){togglePlannerLock(btn);return}
 if(action==='select-day'){visibleWeek=Math.min(2,Math.max(0,Number(btn.dataset.week??visibleWeek)));selectedDay=Number(btn.dataset.day);render();return}
 if(action==='prev-week'||action==='next-week'){visibleWeek=Math.min(2,Math.max(0,visibleWeek+(action==='prev-week'?-1:1)));render();return}
 if(action==='go-week'){visibleWeek=Number(btn.dataset.week);render();return}
 if(action==='open'){showRecipe(btn.dataset.recipe,btn.dataset.day,btn.dataset.slot,btn.dataset.week);return}
 if(action==='close-modal'){document.getElementById('recipeDialog').close();modalCtx=null;return}
 if(action==='toggle-meal'){const w=btn.dataset.modal==='1'&&modalCtx?modalCtx.week:Number(btn.dataset.week??visibleWeek);toggleMeal(Number(btn.dataset.day),Number(btn.dataset.slot),w);if(btn.dataset.modal==='1')renderRecipeModal();render();return}
 if(action==='filter'){recipeFilter=btn.dataset.filter;render();return}
 if(action==='shop-tab'){shopStore=btn.dataset.store;render();return}
 if(action==='pantry-filter'){pantryFilter=btn.dataset.filter;render();return}
 if(action==='cart-minus'||action==='cart-plus'){const id=btn.dataset.food,r=shoppingModel().rows.find(x=>x.id===id);if(!r)return;const c=cartChoice(id,r.missing);cartChange(id,'count',Math.max(0,Number(c.count)+(action==='cart-plus'?1:-1)));render();return}
 if(action==='finish-cart'){finishCart();return}
 if(action==='add-extra'){const id=document.getElementById('extraFood').value,count=Number(document.getElementById('extraAmount').value);if(!FOOD[id]||!Number.isInteger(count)||count<1||count>999){showToast('Selecciona un producto y una cantidad válida');return}const p=commercialPack(id);state.cartExtras=state.cartExtras||[];state.cartExtras.push({id,count,size:p.size});save();render();showToast('Producto añadido al carrito');return}
 if(action==='remove-extra'){state.cartExtras.splice(Number(btn.dataset.index),1);save();render();return}
  if(action==='register-purchase'){const id=btn.dataset.food;const inp=document.getElementById('buy-'+id);const amount=Number(inp?.value);if(!FOOD[id]||!Number.isFinite(amount)||amount<=0||amount>1000000){showToast('Introduce una cantidad comprada válida');return}const operationId=newOperationId(),date=new Date().toISOString();applyMovement({operationId,foodId:id,quantity:amount,kind:'purchase',createdAt:date});state.purchases.push({id,amount,date,operationId});state.purchases=state.purchases.slice(-2500);save();render();showToast('Compra registrada · despensa actualizada');return}
 if(action==='copy-shopping'){copyText(shoppingText());return}
 if(action==='new-prompt'){nextMenuPrompt();return}
 if(action==='calendar-reminder'){calendarReminder();return}

 if(action==='import'){document.getElementById('importInput').click();return}
 if(action==='print'){window.print();return}
 if(action==='delete-weight'){if(confirm('¿Eliminar el peso registrado el '+btn.dataset.date+'?')){state.weights=state.weights.filter(w=>w.date!==btn.dataset.date);state.deletedWeightDates=[...new Set([...(state.deletedWeightDates||[]),btn.dataset.date])].slice(-1500);if(state.profile.followWeight)state.cart={};save();render();showToast('Registro eliminado')}return}
 if(action==='restore-profile'){
  if(!confirm('¿Restablecer el formulario a los valores de ejemplo? No modifica tus registros hasta guardar.'))return;
  const form=document.getElementById('profileForm');form.reset();const d=defaultProfile();
  for(const [id,v] of Object.entries(d)){
   if(id==='goal'){form.querySelector('input[name="goal"][value="'+v+'"]').checked=true;continue}
   const el=form.elements.namedItem(id);if(!el)continue;if(el.type==='checkbox')el.checked=!!v;else el.value=v;
  }
  updateProfilePreview();showToast('Valores iniciales cargados en el formulario');return;
 }
 if(action==='reset-progress'){if(confirm('Esto reiniciará el perfil y el menú y eliminará comidas realizadas, stock, compras, sesiones y pesos sincronizados en Supabase y en este navegador. Esta acción no se puede deshacer desde Menuki. ¿Continuar?')){state=emptyState();state.resetCloudPending=true;MENUS=FIXED_MENUS;plannerProposal=null;alignCurrentDay();save();render();showToast('Reinicio guardado; sincronizando con Supabase')}return}
});
document.addEventListener('change',function(event){const el=event.target,action=el.dataset.change;if(el.closest('#recipeProposalEditForm')){captureAdminProposalDraft();return}if(el.closest('#recipeProposalForm')){captureRecipeProposalDraft();return}if(el.closest('#profileForm')){updateProfilePreview();return}
 if(action==='cycle-setup-date'){cycleSetupDateDraft=el.value;return}
 if(action==='proposal-recipe'){swapPlannerRecipe(el);return}

 if(action==='cart-check'){const id=el.dataset.food,r=shoppingModel().rows.find(x=>x.id===id);if(r){cartChange(id,'checked',el.checked);render();document.querySelector('[data-change="cart-check"][data-food="'+CSS.escape(id)+'"]')?.focus()}return}
 if(action==='cart-count'||action==='cart-size'){const id=el.dataset.food,v=Number(el.value);if(!Number.isFinite(v)||v<0||v>100000){showToast('Cantidad no válida');render();return}const r=shoppingModel().rows.find(x=>x.id===id);if(r)cartChange(id,action==='cart-count'?'count':'size',v);updateShoppingProgress();return}
 if(action==='shopping-range'){shopRange=el.value;render();return}
  if(action==='stock-quantity'){const id=el.dataset.food,v=Number(el.value);if(!FOOD[id]||!Number.isFinite(v)||v< -1000000||v>1000000){showToast('Stock no válido');render();return}setInventoryBalance(id,v);state.cart={};save();render();showToast('Despensa y compra actualizadas');return}
 if(action==='prep'){state.prep[el.dataset.id]=el.checked;save();render();return}
 if(action==='cycle-start'){changeCycleStart(el.value);return}
 if(action==='activity-date'){renderActivityDateSessions(el.value);return}

});
document.addEventListener('input',function(event){if(event.target.closest('#recipeProposalEditForm')){captureAdminProposalDraft();return}if(event.target.closest('#recipeProposalForm')){captureRecipeProposalDraft();return}if(event.target.closest('#profileForm'))updateProfilePreview();if(event.target.id==='shoppingSearch'){shoppingSearch=event.target.value;applyShoppingSearch();return}if(event.target.id==='recipeSearch'){recipeSearch=event.target.value;const node=document.getElementById('recipeResults');if(node)node.innerHTML=recipesList()}if(event.target.id==='pantrySearch'){pantrySearch=event.target.value;const node=document.getElementById('pantryResults');if(node)node.innerHTML=pantryListHTML()}});
document.addEventListener('submit',function(event){
 if(event.target.id==='recipeProposalEditForm'){return saveRecipeProposalEdit(event)}
 if(event.target.id==='recipeProposalForm'){return submitRecipeProposal(event)}
 if(event.target.id==='profileForm'){
  event.preventDefault();const form=event.target;
  if(!form.reportValidity())return;
  const data=new FormData(form),p=profileFormData();
  for(const [id,min,max] of [['age',18,95],['height',125,220],['weight',35,250],['manualRmr',800,3500]]){
    if(!Number.isFinite(Number(data.get(id)))||Number(data.get(id))<min||Number(data.get(id))>max){showToast('Revisa los datos: '+id);return}
  }
  const selected=Object.values(state.cart).some(c=>c.checked);
  if(selected&&!confirm('Hay productos marcados en el carrito. Al cambiar raciones se reiniciará la selección para recalcular envases. ¿Continuar?'))return;
    const firstConfirmation=!state.profileConfirmed;state.profile=p;state.profileConfirmed=true;state.cart={};save();render();showToast(firstConfirmation?'Perfil revisado y guardado · objetivos y compra recalculados':'Objetivos, raciones y compra recalculados');return;
 }
 if(event.target.id==='activityForm'){event.preventDefault();saveActivitySession(event.target);return}
  if(event.target.id!=='weightForm')return;event.preventDefault();const date=document.getElementById('weightDate').value,kg=Number(document.getElementById('weightKg').value);if(!dateFromISO(date)||!Number.isFinite(kg)||kg<30||kg>250){showToast('Revisa fecha y peso');return}state.weights=state.weights.filter(w=>w.date!==date);state.weights.push({date,kg});state.weights.sort((a,b)=>a.date.localeCompare(b.date));state.deletedWeightDates=(state.deletedWeightDates||[]).filter(x=>x!==date);if(state.profile.followWeight)state.cart={};save();render();showToast('Peso guardado · '+(state.profile.followWeight?'objetivos y compra recalculados':'sin cambiar tu peso de referencia'))});
document.getElementById('importInput').addEventListener('change',async function(event){const file=event.target.files?.[0];if(!file)return;try{if(file.size>12000000)throw Error('Archivo demasiado grande');const data=cleanState(JSON.parse(await file.text()));if(!data)throw Error('Formato no válido');if(!confirm('La copia sustituirá los datos de este navegador y los datos de Menuki guardados en Supabase. Esta acción sustituirá los datos actuales de Menuki en este dispositivo y en Supabase. ¿Continuar?'))return;data.resetCloudPending=true;state=data;alignCurrentDay();save();render();showToast('Copia restaurada; sincronizando con Supabase')}catch(error){showToast('No se pudo importar: archivo no válido')}finally{event.target.value=''}});
document.getElementById('recipeDialog').addEventListener('close',()=>modalCtx=null);
let lastSeenDate=isoDate(today());
function updateOnDayChange(){if(!state)return;const date=isoDate(today());if(date===lastSeenDate)return;lastSeenDate=date;const advanced=activateScheduledCycleIfDue();alignCurrentDay();render();if(advanced)showToast('Ha comenzado el menú de tu siguiente ciclo')}
async function refreshCloudState(force=false){
 if(!cloudReady||!currentUserId||!supabaseClient||document.hidden||cloudSyncInFlight||cloudRefreshInFlight)return false;
 const now=Date.now();if(!force&&now-lastCloudRefreshAt<12000)return false;lastCloudRefreshAt=now;cloudRefreshInFlight=true;
 try{
  const settings=await supabaseTransport.readOne('user_settings'),revision=Number(settings?.sync_revision)||0;
  if(revision===cloudRevision){
   const meta=readCloudMeta(),localDirty=state.resetCloudPending||(meta?.fingerprint?(await stateFingerprint(state))!==meta.fingerprint:hasMeaningfulLocalState(state));
   if(localDirty)scheduleCloudSync();
   else if(document.getElementById('cloudSyncStatus')?.dataset.level==='error'){cloudSyncLastError=null;cloudStatus('Sincronizado con Supabase','ok')}
   return true;
  }
  const remote=await fetchCloudSnapshot(),remoteRevision=Number(remote.settings?.sync_revision)||revision;
  if(state.resetCloudPending){cloudRevision=remoteRevision;cloudStatus('Aplicando el reinicio/restauración confirmados…','working');scheduleCloudSync();return true}
  const meta=readCloudMeta(),localFingerprint=await stateFingerprint(state),localChanged=meta?.fingerprint?localFingerprint!==meta.fingerprint:hasMeaningfulLocalState(state);
  if(localChanged){
   await reconcileCloudState(remote,state,meta);
   if((await stateFingerprint(state))!== (await stateFingerprint(stateFromCloud(remote)))){cloudStatus('Cambios combinados · sincronizando','pending');scheduleCloudSync()}
   else cloudStatus('Sincronizado con Supabase','ok');
  }else{await adoptCloudState(remote);cloudStatus('Sincronizado con Supabase','ok')}
  const advanced=activateScheduledCycleIfDue();alignCurrentDay();render();if(advanced)showToast('Ha comenzado el menú de tu siguiente ciclo');
  cloudSyncLastError=null;cloudSyncRetryTask='sync';
  return true;
 }catch(error){cloudSyncLastError=error;cloudSyncRetryTask='refresh';cloudStatus('No se pudo actualizar desde Supabase · se conserva la copia local','error');console.error('Menuki cloud refresh failed',error);return false}
 finally{cloudRefreshInFlight=false}
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden){updateOnDayChange();refreshCloudState(true)}});
window.addEventListener('focus',()=>{updateOnDayChange();refreshCloudState(true)});
window.addEventListener('pageshow',()=>refreshCloudState(true));
window.addEventListener('online',()=>refreshCloudState(true));
setInterval(()=>refreshCloudState(),15*1000);
setInterval(updateOnDayChange,60*1000);
startApp();
