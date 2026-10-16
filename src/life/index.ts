import type { Drive, Intent, KnownPart, Memory, PartSource, Resident, Vec3, WorldState } from '../world/types';
import { executeAction } from '../actors/actions';
import { requestAction } from '../actors/activities';
import { concernIntent } from './concerns';
import {occluded,solidBounds} from '../actors/spatial';

const SIGHT = 18;
const SPEED = 1.2;
const HOLD = 2.5;
const ARRIVAL = .6;
const MEAL_ARRIVAL = .25;
const FOOD_REACH = 1.65;
const distance = (a:Vec3,b:Vec3) => Math.hypot(a[0]-b[0], a[2]-b[2]);
const spatialDistance = (a:Vec3,b:Vec3) => Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const copy = (v:Vec3):Vec3 => [...v];
const clamp = (v:number) => Math.max(0,Math.min(1,v));

type Box = Pick<PartSource,'position'|'size'|'yaw'>;
/** Segment against a rotated source box. This is a witness ray, never a mover. */
function hitBox(a:Vec3,b:Vec3,box:Box,pad=0):boolean {
  const c=Math.cos(box.yaw),s=Math.sin(box.yaw);
  const local=(p:Vec3):Vec3 => {const x=p[0]-box.position[0],z=p[2]-box.position[2];return [c*x-s*z,p[1]-box.position[1],s*x+c*z];};
  const start=local(a),end=local(b);let lo=0,hi=1;
  for(let axis=0;axis<3;axis++){
    const half=box.size[axis]/2+(axis===1?0:pad),delta=end[axis]-start[axis];
    if(Math.abs(delta)<1e-8){if(Math.abs(start[axis])>half)return false;continue;}
    let u=(-half-start[axis])/delta,v=(half-start[axis])/delta;
    if(u>v)[u,v]=[v,u];lo=Math.max(lo,u);hi=Math.min(hi,v);
    if(lo>hi)return false;
  }
  return hi>.001 && lo<.999;
}
function visible(state:WorldState,resident:Resident,p:Vec3,omit?:string):boolean {
  if(spatialDistance(resident.position,p)>SIGHT)return false;
  const eye:Vec3=[resident.position[0],resident.position[1]+.65,resident.position[2]];
  const witness:Vec3=[p[0],p[1]+.65,p[2]];
  return !occluded(state,eye,witness,[omit??'',resident.holding??'']);
}
function remember(state:WorldState,resident:Resident,kind:Memory['kind'],target:string,detail:string):void {
  const last=[...resident.memories].reverse().find(m=>m.kind===kind&&m.target===target);
  if(last?.detail===detail && (kind!=='blocked'||state.seconds-last.time<18))return;
  resident.memories.push({time:state.seconds,kind,target,detail});
  if(resident.memories.length>96)resident.memories.splice(0,resident.memories.length-96);
}
function event(state:WorldState,resident:Resident,kind:Memory['kind'],target:string,detail:string):void {
  remember(state,resident,kind,target,detail);
  state.events.push({time:state.seconds,kind,actor:resident.id,target,detail});
  if(state.events.length>256)state.events.splice(0,state.events.length-256);
}

/** Only finished-step, near, unobstructed witnesses refresh private knowledge. */
export function observeResident(state:WorldState,resident:Resident):void {
  const witnessedPlaces=new Set<string>(),witnessedParts=new Set<string>();
  for(const place of state.source.places){
    if(!visible(state,resident,place.position))continue;
    witnessedPlaces.add(place.id);
    const occupied=state.residents.find(other=>other.id!==resident.id&&distance(other.position,place.position)<.85)?.id??null;
    const known=resident.known.find(k=>k.id===place.id);
    if(!known){resident.known.push({id:place.id,kind:place.kind,position:copy(place.position),occupiedBy:occupied,seenAt:state.seconds,available:true});remember(state,resident,'saw',place.id,`Znam teraz miejsce: ${place.label}.`);}
    else {
      if(known.available===false||spatialDistance(known.position,place.position)>.05||known.occupiedBy!==occupied||known.kind!==place.kind)remember(state,resident,'saw',place.id,occupied?`Miejsce zajmuje ${occupied}.`:'Miejsce jest wolne.');
      known.kind=place.kind;known.position=copy(place.position);known.occupiedBy=occupied;known.seenAt=state.seconds;known.available=true;
    }
  }
  for(const part of state.source.home.parts){
    if(!part.solid||!visible(state,resident,part.position,part.id))continue;
    witnessedParts.add(part.id);
    const known=resident.knownParts.find(k=>k.id===part.id);
    const snapshot:KnownPart={id:part.id,position:copy(part.position),size:copy(part.size),yaw:part.yaw,role:part.role,seenAt:state.seconds,present:true};
    if(!known){resident.knownParts.push(snapshot);remember(state,resident,'saw',part.id,`Widzę: ${part.label}.`);}
    else {
      if(known.present===false||spatialDistance(known.position,part.position)>.05||known.size.some((v,i)=>Math.abs(v-part.size[i])>.05)||Math.abs(known.yaw-part.yaw)>.01)remember(state,resident,'saw',part.id,`Widzę zmianę: ${part.label}.`);
      Object.assign(known,snapshot);
    }
  }
  for(const known of resident.known)if(known.available!==false&&!witnessedPlaces.has(known.id)&&visible(state,resident,known.position)){
    known.available=false;known.seenAt=state.seconds;remember(state,resident,'saw',known.id,'Nie ma już miejsca używania w zapamiętanej pozycji.');
  }
  for(const known of resident.knownParts)if(known.present!==false&&!witnessedParts.has(known.id)&&visible(state,resident,known.position,known.id)){
    known.present=false;known.seenAt=state.seconds;remember(state,resident,'saw',known.id,'Nie widzę przeszkody w zapamiętanej pozycji.');
  }
  const witnessedThings=new Set<string>();
  for(const thing of state.things){
    if(!visible(state,resident,thing.position,thing.id))continue;
    witnessedThings.add(thing.id);
    const available=!thing.consumed&&thing.heldBy===null;
    const known=resident.knownThings.find(k=>k.id===thing.id);
    if(!known){resident.knownThings.push({id:thing.id,kind:thing.kind,position:copy(thing.position),size:copy(thing.size),rotation:[...thing.rotation],seenAt:state.seconds,available,present:!thing.consumed});remember(state,resident,'saw',thing.id,`Widzę ${thing.label}${available?' dostępny.':' zajęty lub zużyty.'}`);}
    else {
      if(known.available!==available||distance(known.position,thing.position)>.4)remember(state,resident,'saw',thing.id,available?'Rzecz jest dostępna.':'Rzecz jest zajęta lub zużyta.');
      known.position=copy(thing.position);known.size=copy(thing.size);known.rotation=[...thing.rotation];known.available=available;known.present=!thing.consumed;known.seenAt=state.seconds;
    }
  }
  // An empty, visible remembered spot is a witness too. A remote removal is not.
  for(const known of resident.knownThings){
    if((known.available||known.present)&&!witnessedThings.has(known.id)&&visible(state,resident,known.position,known.id)){
      known.available=false;known.present=false;known.seenAt=state.seconds;remember(state,resident,'saw',known.id,'Nie ma już rzeczy w znanym miejscu.');
    }
  }
  resident.knownResources??=[];resident.knownPeople??=[];
  const witnessedResources=new Set<string>();
  for(const site of state.source.resourceSites??[]){
    if(!visible(state,resident,site.position))continue;
    witnessedResources.add(site.id);
    const available=(state.resources?.find(s=>s.id===site.id)?.units??0)>0;
    const known=resident.knownResources.find(k=>k.id===site.id);
    if(!known){resident.knownResources.push({id:site.id,position:copy(site.position),seenAt:state.seconds,available});remember(state,resident,'saw',site.id,`Widzę ${site.label}${available?' z dostępnymi owocami.':' bez owoców.'}`);}
    else{
      if(known.available!==available||distance(known.position,site.position)>.4)remember(state,resident,'saw',site.id,available?'Widzę dostępne owoce.':'Na znanej roślinie nie ma już dostępnych owoców.');
      known.position=copy(site.position);known.seenAt=state.seconds;known.available=available;
    }
  }
  for(const known of resident.knownResources)if(known.available&&!witnessedResources.has(known.id)&&visible(state,resident,known.position)){
    known.available=false;known.seenAt=state.seconds;remember(state,resident,'saw',known.id,'Nie widzę już rośliny w pamiętanym miejscu.');
  }
  for(const other of state.residents){
    if(other.id===resident.id||!visible(state,resident,other.position))continue;
    const known=resident.knownPeople.find(p=>p.id===other.id);
    if(known){known.position=copy(other.position);known.seenAt=state.seconds;}
    else{resident.knownPeople.push({id:other.id,position:copy(other.position),seenAt:state.seconds});remember(state,resident,'saw',other.id,`Widzę ${other.name}.`);}
  }
}

function obstacles(resident:Resident):KnownPart[] {
 const half=.9-.38*resident.posture,bottom=resident.position[1]-half+.12,top=resident.position[1]+half;
 const fixed=resident.knownParts.filter(p=>p.present!==false&&(p.role==='wall'||p.role==='beam')&&p.position[1]-p.size[1]/2<top&&p.position[1]+p.size[1]/2>bottom);
 const loose:KnownPart[]=resident.knownThings.filter(t=>t.kind!=='food'&&t.id!==resident.holding&&t.present!==false&&(t.available||t.present===true)&&t.size).map(t=>({id:t.id,...solidBounds({position:t.position,size:t.size!,rotation:t.rotation}),yaw:0,role:'beam' as const,seenAt:t.seenAt})).filter(t=>t.position[1]+t.size[1]/2>bottom&&t.position[1]-t.size[1]/2<top);
 return [...fixed,...loose];
}
/** Small visibility graph over PRIVATE witnessed/familiar walls; targets stay in private coordinates. */
function route(resident:Resident,target:Vec3):Vec3|null {
  const parts=obstacles(resident), height=resident.position[1]+.9;
  const start:Vec3=[resident.position[0],height,resident.position[2]],end:Vec3=[target[0],height,target[2]];
  // Vertical body overlap was already filtered. Route on each remaining footprint,
  // including blocks below eye height; the solver remains the final contact authority.
  const clear=(a:Vec3,b:Vec3)=>!parts.some(p=>hitBox([a[0],p.position[1],a[2]],[b[0],p.position[1],b[2]],p,.38));
  if(clear(start,end))return target;
  const points:Vec3[]=[start,end];
  for(const part of parts){
    const c=Math.cos(part.yaw),s=Math.sin(part.yaw);
    for(const x of [-1,1])for(const z of [-1,1]){
      const px=x*(part.size[0]/2+.52),pz=z*(part.size[2]/2+.52);
      points.push([part.position[0]+c*px+s*pz,height,part.position[2]-s*px+c*pz]);
    }
  }
  const cost=points.map(()=>Infinity),previous=points.map(()=>-1),done=new Set<number>();cost[0]=0;
  for(let step=0;step<points.length;step++){
    let next=-1;for(let i=0;i<points.length;i++)if(!done.has(i)&&(next<0||cost[i]<cost[next]))next=i;
    if(next<0||cost[next]===Infinity)break;if(next===1)break;done.add(next);
    for(let i=0;i<points.length;i++)if(i!==next&&!done.has(i)&&clear(points[next],points[i])){
      const candidate=cost[next]+distance(points[next],points[i]);if(candidate<cost[i]){cost[i]=candidate;previous[i]=next;}
    }
  }
  if(!Number.isFinite(cost[1]))return null;
  let next=1;while(previous[next]>0)next=previous[next];
  return [points[next][0],target[1],points[next][2]];
}
/** Familiar doorway staging is derived from saved floor/front-wall geometry. */
function entranceWaypoint(resident:Resident,target:Vec3):Vec3 {
  const floor=resident.knownParts.find(p=>p.role==='floor'&&p.present!==false);
  if(!floor)return target;
  const c=Math.cos(floor.yaw),s=Math.sin(floor.yaw);
  const local=(p:Vec3)=>{const x=p[0]-floor.position[0],z=p[2]-floor.position[2];return [c*x-s*z,s*x+c*z];};
  const [tx,tz]=local(target),[rx,rz]=local(resident.position),front=floor.size[2]/2;
  if(Math.abs(tx)>=floor.size[0]/2||Math.abs(tz)>=front)return target;
  // This home's familiar opening is on the south edge, with two flanking walls.
  const flanks=resident.knownParts.filter(p=>p.present!==false&&p.role==='wall'&&Math.abs(local(p.position)[1]-front)<.35&&p.size[0]<floor.size[0]*.6);
  if(flanks.length<2||rz<front-.65)return target;
  const z=(rz>front+1.75&&Math.hypot(rx,rz-(front+2.1))>.3)||(rz>front+.35&&Math.abs(rx)>.32)?front+2.1:front-.7;
  return [floor.position[0]+s*z,target[1],floor.position[2]+c*z];
}
function recentlyBlocked(state:WorldState,resident:Resident,id:string):boolean {return resident.memories.some(m=>m.kind==='blocked'&&m.target===id&&state.seconds-m.time<18);}
function knownPlaces(state:WorldState,resident:Resident,kind:'rest'|'food'|'lookout'|'put'){
  return resident.known.filter(k=>k.available!==false&&k.kind===kind&&(!k.occupiedBy||k.occupiedBy===resident.id)&&!recentlyBlocked(state,resident,k.id)&&route(resident,k.position)!==null);
}
function bestPlace(state:WorldState,resident:Resident,kind:'rest'|'food'|'lookout'|'put'){
  return knownPlaces(state,resident,kind).sort((a,b)=>distance(resident.position,a.position)-distance(resident.position,b.position)+(kind==='rest'?(a.id===resident.preferredRest?-5:0)-(b.id===resident.preferredRest?-5:0):0))[0];
}
/** Associate finite food with a remembered reachable meal approach, never its live transform. */
function foodApproach(state:WorldState,resident:Resident,foodId:string){
  const food=resident.knownThings.find(k=>k.id===foodId&&k.kind==='food');
  if(!food)return undefined;
  const familiar=knownPlaces(state,resident,'food').filter(p=>distance(p.position,food.position)<1.8)
    .sort((a,b)=>distance(a.position,food.position)-distance(b.position,food.position))[0];
  if(familiar)return familiar;
  const dx=resident.position[0]-food.position[0],dz=resident.position[2]-food.position[2],length=Math.hypot(dx,dz)||1;
  return {id:food.id,kind:'food' as const,position:[food.position[0]+dx/length*.9,food.position[1],food.position[2]+dz/length*.9] as Vec3,seenAt:food.seenAt,occupiedBy:null};
}
function intentTarget(state:WorldState,resident:Resident,intent=resident.intent):Vec3|null {
  if(!intent.targetId)return null;
  if(intent.goal==='eat'&&resident.holding===intent.targetId)return resident.position;
  if(intent.goal==='eat'||intent.goal==='fetch')return foodApproach(state,resident,intent.targetId)?.position??null;
  if(intent.goal==='gather')return resident.knownResources?.find(k=>k.id===intent.targetId)?.position??null;
  if(intent.goal==='meet')return resident.knownPeople?.find(k=>k.id===intent.targetId)?.position??null;
  return resident.known.find(k=>k.id===intent.targetId)?.position??resident.knownThings.find(k=>k.id===intent.targetId)?.position??null;
}
/** A proposal from needs, preferences and private witnesses, never a scripted phase. */
export function chooseIntent(state:WorldState,resident:Resident):Intent {
  const current=resident.intent;
  const personal=concernIntent(state,resident);
  const heldFood=state.things.find(t=>t.id===resident.holding&&t.heldBy===resident.id&&t.kind==='food'&&!t.consumed);
  const knownTarget=resident.known.find(k=>k.id===current.targetId),occupied=knownTarget?.occupiedBy;
  const missingFood=current.goal==='eat'&&current.targetId!==heldFood?.id&&(!resident.knownThings.some(k=>k.id===current.targetId&&k.available)||!current.targetId||!foodApproach(state,resident,current.targetId));
  const invalidCarry=(current.goal==='carry-home'||current.goal==='store')&&!resident.holding;
  const missingResource=current.goal==='gather'&&(!!resident.holding||!resident.knownResources?.some(k=>k.id===current.targetId&&k.available));
  const invalidFetch=current.goal==='fetch'&&(!!resident.holding||!resident.knownThings.some(t=>t.id===current.targetId&&t.available));
  const missingPerson=current.goal==='meet'&&!resident.knownPeople?.some(k=>k.id===current.targetId&&state.seconds-k.seenAt<20);
  const invalid=!!occupied||knownTarget?.available===false||missingFood||invalidCarry||invalidFetch||missingResource||missingPerson||(current.goal!=='quiet'&&!current.targetId)||!!(current.targetId&&recentlyBlocked(state,resident,current.targetId));
  const urgent=resident.fatigue>.92&&current.goal!=='rest'&&current.goal!=='carry-home';
  const make=(goal:Intent['goal'],targetId:string|null,reason:string):Intent=>({goal,targetId,reason,chosenAt:state.seconds});
  if(heldFood&&resident.hunger>.54)return make('eat',heldFood.id,'Jestem głodny i trzymam dostępną porcję.');
  if(heldFood&&personal)return personal;
  if(heldFood)return make('quiet',null,'Trzymam porcję na później; nie znam teraz miejsca, w którym chcę ją odłożyć.');
  if(!invalid&&!urgent&&state.seconds-current.chosenAt<HOLD)return current;
  if(current.goal==='rest'&&!invalid&&resident.fatigue>.25&&state.seconds<resident.restUntil)return current;
  if(resident.holding){const put=bestPlace(state,resident,'put');if(put)return make('carry-home',put.id,'Niosę własną torbę; chcę odłożyć ciężar w znanym miejscu.');}
  if(resident.fatigue>.58){const rest=bestPlace(state,resident,'rest');if(rest)return make('rest',rest.id,rest.id===resident.preferredRest?'Potrzebuję odpoczynku; wybieram swoją ulubioną wolną ławkę.':'Potrzebuję odpoczynku; wybieram inne znane wolne miejsce odpoczynku.');}
  if(resident.hunger>.54&&!resident.holding){
    const food=resident.knownThings.filter(k=>k.kind==='food'&&k.available&&foodApproach(state,resident,k.id)&&!recentlyBlocked(state,resident,k.id)).sort((a,b)=>distance(resident.position,a.position)-distance(resident.position,b.position))[0];
    if(food)return make('eat',food.id,'Odczuwam głód; pamiętam dostępną porcję jedzenia.');
    const resource=resident.knownResources?.filter(k=>k.available&&!recentlyBlocked(state,resident,k.id)&&route(resident,k.position)!==null)
      .sort((a,b)=>distance(resident.position,a.position)-distance(resident.position,b.position))[0];
    if(resource)return make('gather',resource.id,'Odczuwam głód; widziałem dostępne owoce. Spróbuję je zebrać.');
  }
  if(personal)return personal;
  if(resident.sociability>.6&&resident.fatigue<.65){
    const other=resident.knownPeople?.filter(p=>state.seconds-p.seenAt<20&&!recentlyBlocked(state,resident,p.id)&&!resident.memories.some(m=>m.kind==='met'&&m.target===p.id&&state.seconds-m.time<45)&&route(resident,p.position)!==null)
      .sort((a,b)=>distance(resident.position,a.position)-distance(resident.position,b.position))[0];
    if(other)return make('meet',other.id,'Mam ochotę na spotkanie. Podejdę do znajomej osoby, którą niedawno widziałem.');
  }
  if(resident.curiosity>.35&&resident.fatigue<.48){
    const places=knownPlaces(state,resident,'lookout').filter(p=>!resident.memories.some(m=>m.kind==='arrived'&&m.target===p.id&&state.seconds-m.time<45));
    const lookout=places.sort((a,b)=>distance(resident.position,a.position)-distance(resident.position,b.position))[0];
    if(lookout)return make('wander',lookout.id,'Mam siłę i ochotę przyjrzeć się znanemu skrajowi doliny.');
  }
  return make('quiet',null,resident.fatigue>.58?'Potrzebuję odpoczynku, lecz nie znam teraz wolnego dojścia. Poczekam.':resident.hunger>.54?'Odczuwam głód, lecz nie znam dostępnej porcji. Poczekam spokojnie.':'Nic mnie teraz nie przynagla. Mogę pobyć spokojnie.');
}

/** Called after native sync and clock advancement. Changes mind/needs, never transforms or grip. */
export function stepLife(state:WorldState,dt:number):Map<string,Drive> {
  const drives=new Map<string,Drive>();
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('Life step requires a finite nonnegative dt.');
  for(const resident of state.residents){
    observeResident(state,resident);
    resident.hunger=clamp(resident.hunger+dt*.0006);
    resident.fatigue=clamp(resident.fatigue+dt*(.0002+Math.min(1.2,Math.hypot(resident.velocity[0],resident.velocity[2]))*.0008+(resident.holding?.0003:0)));
    resident.curiosity=clamp(resident.curiosity+dt*.0009);resident.sociability=clamp(resident.sociability+dt*.0007);
    if(resident.control==='player'){
      const place=resident.intent.goal==='rest'?state.source.places.find(p=>p.id===resident.intent.targetId&&p.kind==='rest'):undefined;
      if(place&&spatialDistance(resident.position,place.position)<=1.8&&resident.posture>.8&&Math.hypot(...resident.velocity)<.18&&!resident.holding){resident.fatigue=clamp(resident.fatigue-dt*.012);remember(state,resident,'rested',place.id,'Odpoczywam w spokojnej niskiej posturze.');}
      continue;
    }
    if(resident.activity){drives.set(resident.id,{velocity:[0,0,0],posture:0});continue;}
    if(resident.blockedFor>=3&&resident.intent.targetId){
      event(state,resident,'blocked',resident.intent.targetId,'Dojście mnie zatrzymało. Spróbuję innego znanego miejsca albo poczekam.');
      resident.blockedFor=0;resident.reconsiderAt=state.seconds;
    }
    const proposed=chooseIntent(state,resident);
    if(proposed.goal!==resident.intent.goal||proposed.targetId!==resident.intent.targetId){resident.intent=proposed;resident.reconsiderAt=state.seconds+HOLD;}
    else if(state.seconds-resident.intent.chosenAt>=HOLD)resident.intent={...proposed,chosenAt:resident.intent.chosenAt};
    const target=intentTarget(state,resident);
    const near=target&&distance(resident.position,target)<=(resident.intent.goal==='eat'||resident.intent.goal==='fetch'?MEAL_ARRIVAL:resident.intent.goal==='store'?1.2:resident.intent.goal==='meet'?2.6:ARRIVAL);
    let drive:Drive={velocity:[0,0,0],posture:0};
    if(near&&resident.intent.targetId){
      const arrivedId=resident.intent.targetId;
      const arrivedGoal=resident.intent.goal;
      remember(state,resident,'arrived',resident.intent.targetId,resident.intent.reason);
      if(resident.intent.goal==='rest'&&!resident.holding){
        const access=executeAction(state,resident.id,{kind:'rest',targetId:arrivedId});
        if(access.accepted)drive.posture=1;
        else{remember(state,resident,'blocked',arrivedId,access.reason);resident.intent=chooseIntent(state,resident);}
        if(access.accepted&&resident.posture>.8&&Math.hypot(...resident.velocity)<.18){
          resident.fatigue=clamp(resident.fatigue-dt*.012);resident.restUntil=Math.max(resident.restUntil,state.seconds+4);
          resident.intent.reason='Odpoczywam w spokojnej niskiej posturze przy znanym miejscu i odzyskuję siły.';
          remember(state,resident,'rested',arrivedId,'Odpoczywam w spokojnej niskiej posturze.');
        }
      }
      if(arrivedGoal==='fetch'){
        const action=executeAction(state,resident.id,{kind:'pickup',targetId:arrivedId});
        if(!action.accepted)remember(state,resident,'blocked',arrivedId,action.reason);
        resident.intent=chooseIntent(state,resident);
      }
      if(arrivedGoal==='eat'){
        const food=state.things.find(t=>t.id===resident.intent.targetId);
        const known=resident.knownThings.find(k=>k.id===resident.intent.targetId);
        const approach=foodApproach(state,resident,arrivedId);
        if(food&&(food.heldBy===resident.id&&resident.holding===food.id||known?.available&&approach&&distance(resident.position,approach.position)<=MEAL_ARRIVAL&&spatialDistance(resident.position,food.position)<=FOOD_REACH&&visible(state,resident,food.position))){
          const action=requestAction(state,resident.id,{kind:'eat',targetId:food.id});
          if(!action.accepted){remember(state,resident,'blocked',food.id,action.reason);resident.intent=chooseIntent(state,resident);}
        }
      }
      if(arrivedGoal==='gather'){
        const id=resident.intent.targetId!,action=requestAction(state,resident.id,{kind:'gather',targetId:id});
        if(!action.accepted)remember(state,resident,'blocked',id,action.reason);
      }
      if(arrivedGoal==='meet'){
        const id=resident.intent.targetId!,action=executeAction(state,resident.id,{kind:'greet',targetId:id});
        if(!action.accepted)remember(state,resident,'blocked',id,action.reason);
        resident.intent={goal:'quiet',targetId:null,reason:action.accepted?'Spotkaliśmy się. Wracam do własnych spraw.':'Nie udało się spotkać. Rozejrzę się ponownie.',chosenAt:state.seconds};
      }
      if(arrivedGoal==='wander'){resident.curiosity=clamp(resident.curiosity-.22);resident.intent={goal:'quiet',targetId:null,reason:'To już wybrane miejsce. Chcę przez chwilę popatrzeć w ciszy.',chosenAt:state.seconds};}
    }else if(target){
      // A deposit accepts a neighbourhood: a loose bag at its centre must not
      // make the whole place unreachable. Approach its near edge, then let
      // actual body distance/speed authorize release in Session.
      let approach=target;
      if(resident.intent.goal==='store'){
        const dx=resident.position[0]-target[0],dz=resident.position[2]-target[2],length=Math.hypot(dx,dz);
        if(length>1.05)approach=[target[0]+dx/length*1.05,target[1],target[2]+dz/length*1.05];
      }
      const waypoint=route(resident,entranceWaypoint(resident,approach));
      if(waypoint){const dx=waypoint[0]-resident.position[0],dz=waypoint[2]-resident.position[2],length=Math.hypot(dx,dz);if(length>.05)drive.velocity=[dx/length*SPEED,0,dz/length*SPEED];}
      else {remember(state,resident,'blocked',resident.intent.targetId!,'Nie znam bezpiecznego dojścia.');resident.intent=chooseIntent(state,resident);}
    }
    drives.set(resident.id,drive);
  }
  return drives;
}
