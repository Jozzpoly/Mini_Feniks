import type { Drive, Intent, KnownPart, Memory, PartSource, Resident, Vec3, WorldState } from '../world/types';

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
  return !state.source.home.parts.some(part=>part.solid&&part.id!==omit&&hitBox(eye,witness,part));
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
  for(const place of state.source.places){
    if(!visible(state,resident,place.position))continue;
    const occupied=state.residents.find(other=>other.id!==resident.id&&distance(other.position,place.position)<.85)?.id??null;
    const known=resident.known.find(k=>k.id===place.id);
    if(!known){resident.known.push({id:place.id,kind:place.kind,position:copy(place.position),occupiedBy:occupied,seenAt:state.seconds});remember(state,resident,'saw',place.id,`Znam teraz miejsce: ${place.label}.`);}
    else {
      if(spatialDistance(known.position,place.position)>.05||known.occupiedBy!==occupied||known.kind!==place.kind)remember(state,resident,'saw',place.id,occupied?`Miejsce zajmuje ${occupied}.`:'Miejsce jest wolne.');
      known.kind=place.kind;known.position=copy(place.position);known.occupiedBy=occupied;known.seenAt=state.seconds;
    }
  }
  for(const part of state.source.home.parts){
    if(!part.solid||!visible(state,resident,part.position,part.id))continue;
    const known=resident.knownParts.find(k=>k.id===part.id);
    const snapshot:KnownPart={id:part.id,position:copy(part.position),size:copy(part.size),yaw:part.yaw,role:part.role,seenAt:state.seconds};
    if(!known){resident.knownParts.push(snapshot);remember(state,resident,'saw',part.id,`Widzę: ${part.label}.`);}
    else {
      if(spatialDistance(known.position,part.position)>.05||known.size.some((v,i)=>Math.abs(v-part.size[i])>.05)||Math.abs(known.yaw-part.yaw)>.01)remember(state,resident,'saw',part.id,`Widzę zmianę: ${part.label}.`);
      Object.assign(known,snapshot);
    }
  }
  const witnessedThings=new Set<string>();
  for(const thing of state.things){
    if(!visible(state,resident,thing.position))continue;
    witnessedThings.add(thing.id);
    const available=!thing.consumed&&thing.heldBy===null;
    const known=resident.knownThings.find(k=>k.id===thing.id);
    if(!known){resident.knownThings.push({id:thing.id,kind:thing.kind,position:copy(thing.position),seenAt:state.seconds,available});remember(state,resident,'saw',thing.id,`Widzę ${thing.label}${available?' dostępny.':' zajęty lub zużyty.'}`);}
    else {
      if(known.available!==available||distance(known.position,thing.position)>.4)remember(state,resident,'saw',thing.id,available?'Rzecz jest dostępna.':'Rzecz jest zajęta lub zużyta.');
      known.position=copy(thing.position);known.available=available;known.seenAt=state.seconds;
    }
  }
  // An empty, visible remembered spot is a witness too. A remote removal is not.
  for(const known of resident.knownThings){
    if(known.available&&!witnessedThings.has(known.id)&&visible(state,resident,known.position)){
      known.available=false;known.seenAt=state.seconds;remember(state,resident,'saw',known.id,'Nie ma już rzeczy w znanym miejscu.');
    }
  }
}

function obstacles(resident:Resident):KnownPart[] {return resident.knownParts.filter(p=>(p.role==='wall'||p.role==='beam')&&p.position[1]-p.size[1]/2<resident.position[1]+1.6&&p.position[1]+p.size[1]/2>resident.position[1]+.1);}
/** Small visibility graph over PRIVATE witnessed/familiar walls; targets stay in private coordinates. */
function route(resident:Resident,target:Vec3):Vec3|null {
  const parts=obstacles(resident), height=resident.position[1]+.9;
  const start:Vec3=[resident.position[0],height,resident.position[2]],end:Vec3=[target[0],height,target[2]];
  const clear=(a:Vec3,b:Vec3)=>!parts.some(p=>hitBox(a,b,p,.38));
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
  const floor=resident.knownParts.find(p=>p.role==='floor');
  if(!floor)return target;
  const c=Math.cos(floor.yaw),s=Math.sin(floor.yaw);
  const local=(p:Vec3)=>{const x=p[0]-floor.position[0],z=p[2]-floor.position[2];return [c*x-s*z,s*x+c*z];};
  const [tx,tz]=local(target),[rx,rz]=local(resident.position),front=floor.size[2]/2;
  if(Math.abs(tx)>=floor.size[0]/2||Math.abs(tz)>=front)return target;
  // This home's familiar opening is on the south edge, with two flanking walls.
  const flanks=resident.knownParts.filter(p=>p.role==='wall'&&Math.abs(local(p.position)[1]-front)<.35&&p.size[0]<floor.size[0]*.6);
  if(flanks.length<2||rz<front-.65)return target;
  const z=(rz>front+1.75&&Math.hypot(rx,rz-(front+2.1))>.3)||(rz>front+.35&&Math.abs(rx)>.32)?front+2.1:front-.7;
  return [floor.position[0]+s*z,target[1],floor.position[2]+c*z];
}
function recentlyBlocked(state:WorldState,resident:Resident,id:string):boolean {return resident.memories.some(m=>m.kind==='blocked'&&m.target===id&&state.seconds-m.time<18);}
function knownPlaces(state:WorldState,resident:Resident,kind:'rest'|'food'|'lookout'|'put'){
  return resident.known.filter(k=>k.kind===kind&&(!k.occupiedBy||k.occupiedBy===resident.id)&&!recentlyBlocked(state,resident,k.id)&&route(resident,k.position)!==null);
}
function bestPlace(state:WorldState,resident:Resident,kind:'rest'|'food'|'lookout'|'put'){
  return knownPlaces(state,resident,kind).sort((a,b)=>distance(resident.position,a.position)-distance(resident.position,b.position)+(kind==='rest'?(a.id===resident.preferredRest?-5:0)-(b.id===resident.preferredRest?-5:0):0))[0];
}
/** Associate finite food with a remembered reachable meal approach, never its live transform. */
function foodApproach(state:WorldState,resident:Resident,foodId:string){
  const food=resident.knownThings.find(k=>k.id===foodId&&k.kind==='food');
  if(!food)return undefined;
  return knownPlaces(state,resident,'food').filter(p=>distance(p.position,food.position)<1.8)
    .sort((a,b)=>distance(a.position,food.position)-distance(b.position,food.position))[0];
}
function intentTarget(state:WorldState,resident:Resident,intent=resident.intent):Vec3|null {
  if(!intent.targetId)return null;
  if(intent.goal==='eat')return foodApproach(state,resident,intent.targetId)?.position??null;
  return resident.known.find(k=>k.id===intent.targetId)?.position??resident.knownThings.find(k=>k.id===intent.targetId)?.position??null;
}
/** A proposal from needs, preferences and private witnesses, never a scripted phase. */
export function chooseIntent(state:WorldState,resident:Resident):Intent {
  const current=resident.intent;
  const occupied=current.targetId&&resident.known.find(k=>k.id===current.targetId)?.occupiedBy;
  const missingFood=current.goal==='eat'&&(!resident.knownThings.some(k=>k.id===current.targetId&&k.available)||!current.targetId||!foodApproach(state,resident,current.targetId));
  const invalidCarry=current.goal==='carry-home'&&!resident.holding;
  const invalid=!!occupied||missingFood||invalidCarry||(current.goal!=='quiet'&&!current.targetId)||!!(current.targetId&&recentlyBlocked(state,resident,current.targetId));
  const urgent=resident.fatigue>.92&&current.goal!=='rest'&&current.goal!=='carry-home';
  if(!invalid&&!urgent&&state.seconds-current.chosenAt<HOLD)return current;
  if(current.goal==='rest'&&!invalid&&resident.fatigue>.25&&state.seconds<resident.restUntil)return current;
  const make=(goal:Intent['goal'],targetId:string|null,reason:string):Intent=>({goal,targetId,reason,chosenAt:state.seconds});
  if(resident.holding){const put=bestPlace(state,resident,'put');if(put)return make('carry-home',put.id,'Niosę własną torbę; chcę odłożyć ciężar w znanym miejscu.');}
  if(resident.fatigue>.58){const rest=bestPlace(state,resident,'rest');if(rest)return make('rest',rest.id,rest.id===resident.preferredRest?'Potrzebuję odpoczynku; wybieram swoją ulubioną wolną ławkę.':'Potrzebuję odpoczynku; wybieram inne znane wolne miejsce odpoczynku.');}
  if(resident.hunger>.54&&!resident.holding){
    const food=resident.knownThings.filter(k=>k.kind==='food'&&k.available&&foodApproach(state,resident,k.id)&&!recentlyBlocked(state,resident,k.id)).sort((a,b)=>distance(resident.position,a.position)-distance(resident.position,b.position))[0];
    if(food)return make('eat',food.id,'Odczuwam głód; pamiętam dostępną porcję jedzenia.');
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
    resident.hunger=clamp(resident.hunger+dt*.0018);
    resident.fatigue=clamp(resident.fatigue+dt*(.0008+Math.min(1.2,Math.hypot(resident.velocity[0],resident.velocity[2]))*.003+(resident.holding?.0012:0)));
    if(resident.blockedFor>=3&&resident.intent.targetId){
      event(state,resident,'blocked',resident.intent.targetId,'Dojście mnie zatrzymało. Spróbuję innego znanego miejsca albo poczekam.');
      resident.blockedFor=0;resident.reconsiderAt=state.seconds;
    }
    const proposed=chooseIntent(state,resident);
    if(proposed.goal!==resident.intent.goal||proposed.targetId!==resident.intent.targetId){resident.intent=proposed;resident.reconsiderAt=state.seconds+HOLD;}
    else if(state.seconds-resident.intent.chosenAt>=HOLD)resident.intent={...proposed,chosenAt:resident.intent.chosenAt};
    const target=intentTarget(state,resident);
    const near=target&&distance(resident.position,target)<=(resident.intent.goal==='eat'?MEAL_ARRIVAL:ARRIVAL);
    let drive:Drive={velocity:[0,0,0],posture:0};
    if(near&&resident.intent.targetId){
      const arrivedGoal=resident.intent.goal;
      remember(state,resident,'arrived',resident.intent.targetId,resident.intent.reason);
      if(resident.intent.goal==='rest'&&!resident.holding){
        drive.posture=1;
        if(resident.posture>.8&&Math.hypot(...resident.velocity)<.18){
          resident.fatigue=clamp(resident.fatigue-dt*.024);resident.restUntil=Math.max(resident.restUntil,state.seconds+4);
          resident.intent.reason='Odpoczywam w spokojnej niskiej posturze przy znanym miejscu i odzyskuję siły.';
          remember(state,resident,'rested',resident.intent.targetId,'Odpoczywam w spokojnej niskiej posturze.');
        }
      }
      if(resident.intent.goal==='eat'&&!resident.holding){
        const food=state.things.find(t=>t.id===resident.intent.targetId);
        const known=resident.knownThings.find(k=>k.id===resident.intent.targetId);
        const approach=foodApproach(state,resident,resident.intent.targetId);
        if(food&&known?.available&&approach&&distance(resident.position,approach.position)<=MEAL_ARRIVAL&&food.kind==='food'&&!food.consumed&&!food.heldBy&&spatialDistance(resident.position,food.position)<=FOOD_REACH&&visible(state,resident,food.position)){
          food.consumed=true;known.available=false;resident.hunger=clamp(resident.hunger-.65);event(state,resident,'ate',food.id,'Ta dostępna porcja zaspokoiła mój głód.');resident.intent=chooseIntent(state,resident);
        }
      }
      if(arrivedGoal==='wander'){resident.curiosity=clamp(resident.curiosity-.22);resident.intent={goal:'quiet',targetId:null,reason:'To już wybrane miejsce. Chcę przez chwilę popatrzeć w ciszy.',chosenAt:state.seconds};}
    }else if(target){
      const waypoint=route(resident,entranceWaypoint(resident,target));
      if(waypoint){const dx=waypoint[0]-resident.position[0],dz=waypoint[2]-resident.position[2],length=Math.hypot(dx,dz);if(length>.05)drive.velocity=[dx/length*SPEED,0,dz/length*SPEED];}
      else {remember(state,resident,'blocked',resident.intent.targetId!,'Nie znam bezpiecznego dojścia.');resident.intent=chooseIntent(state,resident);}
    }
    drives.set(resident.id,drive);
  }
  return drives;
}
