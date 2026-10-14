import type { Resident, Vec3, WorldState } from '../world/types';

export type ActorAction={kind:'pickup'|'eat'|'gather'|'rest'|'greet';targetId:string}|{kind:'put-down'};
export interface ActionResult {accepted:boolean;reason:string;actorId:string;kind:ActorAction['kind'];targetId:string|null;}
const range=(a:Vec3,b:Vec3)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);

/** The same authored solids used by the native adapter block an attempted reach. */
export function actionSight(state:WorldState,actor:Resident,point:Vec3):boolean {
  const start:Vec3=[actor.position[0],actor.position[1]+.55,actor.position[2]];
  const end:Vec3=[point[0],point[1]+.08,point[2]];
  return !state.source.home.parts.some(p=>{
    if(!p.solid)return false;const c=Math.cos(p.yaw),s=Math.sin(p.yaw);
    const local=(v:Vec3):Vec3=>{const dx=v[0]-p.position[0],dz=v[2]-p.position[2];return [c*dx-s*dz,v[1]-p.position[1],s*dx+c*dz];};
    const a=local(start),b=local(end);let lo=0,hi=1;
    for(let i=0;i<3;i++){
      const h=p.size[i]/2,d=b[i]-a[i];
      if(Math.abs(d)<1e-9){if(Math.abs(a[i])>h)return false;continue;}
      let u=(-h-a[i])/d,v=(h-a[i])/d;if(u>v)[u,v]=[v,u];lo=Math.max(lo,u);hi=Math.min(hi,v);if(lo>hi)return false;
    }
    return lo<.998&&hi>.002;
  });
}
function handPoint(actor:Resident):Vec3 {
  const [x,y,z,w]=actor.rotation,yaw=Math.atan2(2*(w*y+x*z),1-2*(y*y+z*z));
  return [actor.position[0]+Math.sin(yaw)*.62,actor.position[1]+.22,actor.position[2]+Math.cos(yaw)*.62];
}
function effect(state:WorldState,actor:Resident,kind:'picked'|'placed'|'ate'|'gathered'|'met',target:string,detail:string){
  state.events.push({time:state.seconds,kind,actor:actor.id,target,detail});
  actor.memories.push({time:state.seconds,kind,target,detail});
  if(state.events.length>256)state.events.splice(0,state.events.length-256);
  if(actor.memories.length>96)actor.memories.splice(0,actor.memories.length-96);
}

/** A successful attempt records a material effect, never a position correction. */
export function executeAction(state:WorldState,actorId:string,action:ActorAction):ActionResult {
  const actor=state.residents.find(r=>r.id===actorId),targetId='targetId'in action?action.targetId:null;
  const result=(accepted:boolean,reason:string):ActionResult=>({accepted,reason,actorId,kind:action.kind,targetId});
  if(!actor)return result(false,'Nie ma takiej osoby.');
  if(!['pickup','eat','gather','rest','greet','put-down'].includes(action.kind)||action.kind!=='put-down'&&(typeof targetId!=='string'||!targetId.trim()))return result(false,'Nieznana czynność lub cel.');
  if(action.kind==='put-down'){
    const held=state.things.find(t=>t.id===actor.holding&&t.heldBy===actor.id&&!t.consumed);
    if(!held)return result(false,'Nie trzymam żadnej rzeczy.');
    actor.holding=null;held.heldBy=null;effect(state,actor,'placed',held.id,held.kind==='bag'&&actor.intent.goal==='carry-home'?'Odłożył własną torbę':'Puszczam trzymaną rzecz.');
    return result(true,'Puszczasz rzecz; jej dalszy ruch rozstrzyga fizyka.');
  }
  if(action.kind==='gather'){
    const site=state.source.resourceSites?.find(s=>s.id===action.targetId),stock=state.resources?.find(s=>s.id===action.targetId);
    if(!site||!stock||stock.units<=0)return result(false,'Nie ma już dostępnych owoców.');
    if(actor.holding)return result(false,'Najpierw uwolnij ręce.');
    if(range(actor.position,site.position)>1.8||!actionSight(state,actor,site.position))return result(false,'Podejdź bliżej do dostępnych owoców.');
    const id=`${site.id}:portion:${site.capacity-stock.units+1}`;
    if(state.things.some(t=>t.id===id))return result(false,'Ta część zbioru została już ustanowiona.');
    stock.units--;
    state.things.push({id,label:site.kind==='apple'?'Jabłko z polany':'Zebrane jeżyny',kind:'food',foodFlavor:site.kind,size:[.18,.16,.18],mass:.18,
      position:handPoint(actor),rotation:[0,0,0,1],velocity:[...actor.velocity],angularVelocity:[0,0,0],heldBy:actor.id,consumed:false});
    actor.holding=id;effect(state,actor,'gathered',site.id,'Zbieram dostępną porcję; na roślinie pozostaje mniej owoców.');
    return result(true,'Zebrano rzeczywistą porcję owoców.');
  }
  if(action.kind==='rest'){
    const place=state.source.places.find(p=>p.id===action.targetId&&p.kind==='rest');
    if(!place||range(actor.position,place.position)>1.8||!actionSight(state,actor,place.position))return result(false,'Nie mam dostępu do tego miejsca odpoczynku.');
    if(actor.holding)return result(false,'Najpierw odłóż trzymaną rzecz.');
    if(state.residents.some(r=>r.id!==actor.id&&Math.hypot(r.position[0]-place.position[0],r.position[2]-place.position[2])<.85))return result(false,'To miejsce jest zajęte.');
    if(actor.intent.goal!=='rest'||actor.intent.targetId!==place.id)actor.intent={goal:'rest',targetId:place.id,reason:'Wybieram odpoczynek w dostępnym miejscu.',chosenAt:state.seconds};
    return result(true,'Przyjmujesz posturę odpoczynku.');
  }
  if(action.kind==='greet'){
    const other=state.residents.find(r=>r.id===action.targetId&&r.id!==actor.id);
    if(!other||range(actor.position,other.position)>3.5||!actionSight(state,actor,other.position))return result(false,'Podejdź bliżej do tej osoby.');
    actor.sociability=Math.max(0,actor.sociability-.35);other.sociability=Math.max(0,other.sociability-.2);
    effect(state,actor,'met',other.id,`Pozdrawiam ${other.name}.`);
    other.memories.push({time:state.seconds,kind:'met',target:actor.id,detail:`${actor.name} mnie pozdrawia.`});
    if(other.memories.length>96)other.memories.splice(0,other.memories.length-96);
    return result(true,`Pozdrawiasz ${other.name}.`);
  }
  const thing=state.things.find(t=>t.id===action.targetId&&!t.consumed);
  if(!thing)return result(false,'Ta rzecz nie jest już dostępna.');
  const own=thing.heldBy===actor.id&&actor.holding===thing.id;
  if(thing.heldBy&&!own)return result(false,'Rzecz trzyma inna osoba.');
  if(!own&&(range(actor.position,thing.position)>1.8||!actionSight(state,actor,thing.position)))return result(false,'Rzecz jest poza dostępnym zasięgiem.');
  if(action.kind==='pickup'){
    if(actor.holding)return result(false,'Najpierw uwolnij ręce.');
    actor.holding=thing.id;thing.heldBy=actor.id;effect(state,actor,'picked',thing.id,`Podejmuję chwyt: ${thing.label}.`);
    return result(true,'Podejmujesz chwyt; ciężar i opór rozstrzyga fizyka.');
  }
  if(thing.kind!=='food')return result(false,'Tej rzeczy nie można zjeść.');
  thing.consumed=true;thing.heldBy=null;if(own)actor.holding=null;
  actor.hunger=Math.max(0,actor.hunger-(thing.foodFlavor==='berries'?.22:thing.foodFlavor==='apple'?.28:.65));
  const known=actor.knownThings.find(t=>t.id===thing.id);if(known)known.available=false;
  effect(state,actor,'ate',thing.id,`Zjadam dostępną porcję: ${thing.label}.`);
  return result(true,'Porcja została zjedzona.');
}
