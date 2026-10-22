import {expect,it} from 'vitest';
import {createWorld} from '../src/world/state';
import {createRegion} from '../src/world/source';
import {heightAt} from '../src/world/geography';
import {createSession} from '../src/session';
import {decodeCheckpoint} from '../src/world/checkpoint';
import type {Vec3} from '../src/world/types';

const flat = (a:number[],b:number[])=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const fmt = (v:number[])=>[+v[0].toFixed(2),+v[1].toFixed(2),+v[2].toFixed(2)];
const drive = (s:Awaited<ReturnType<typeof createSession>>,target:Vec3,maxSeconds:number,stopDistance:number)=>{
  const start=[...s.player.position] as Vec3;
  let minDistance=Infinity,closest=fmt(start),ticks=0;
  for(let i=0;i<maxSeconds*10;i++){
    const p=s.player.position,d=flat(p,target);
    if(d<minDistance){minDistance=d;closest=fmt(p);}
    if(d<=stopDistance)break;
    // Only a player's normal velocity control; no transform setter or body teleport.
    s.setPlayerInput([(target[0]-p[0])/d,0,(target[2]-p[2])/d],1.35);
    s.advance(.1);ticks++;
  }
  s.clearPlayerInput();
  for(let i=0;i<7;i++)s.advance(.1);
  return {from:fmt(start),to:fmt(s.player.position),minDistance:+minDistance.toFixed(2),closest,seconds:+(ticks*.1).toFixed(1)};
};

/** Natural-body A/B. No actor or player teleport after a matched saved native World.
 * Scripted inputs are not a human playtest. Both arms share exactly the same route.
 */
it.each([0,7])('native player reach and resident response with Mira start offset +%s m',async(offset)=>{
  const w=createWorld(createRegion());w.source.extent=[200,200];
  const initialMira=w.residents.find(r=>r.name==='Mira')!;
  initialMira.hunger=.15;initialMira.fatigue=.1;
  initialMira.position=[1.7+offset,heightAt(1.7+offset,8)+.9,8];
  const seed=await createSession(w,heightAt);
  let snapshot='';
  try{
    for(let i=0;i<3600;i++){
      seed.advance(.1);
      if(seed.state.residents.find(r=>r.id===initialMira.id)?.concern?.satisfied)break;
    }
    expect(seed.state.residents.find(r=>r.id===initialMira.id)?.concern?.satisfied).toBe(true);
    snapshot=seed.save();
  }finally{seed.dispose();}
  const root=decodeCheckpoint(snapshot);
  const initialMiraSnapshot=root.residents.find(r=>r.name==='Mira')!;
  const cache=root.source.places.find(p=>p.id===initialMiraSnapshot.concern!.placeId)!;
  const portions=root.things.filter(t=>t.kind==='food'&&!t.consumed&&!t.heldBy&&flat(t.position,cache.position)<2.1);
  const portion=portions.find(t=>t.id!=='thing:food')??portions[0];
  expect(portion).toBeDefined();

  const arm=async(take:boolean,reloadAfterPickup=false)=>{
    const s=await createSession(decodeCheckpoint(snapshot),heightAt);
    try{
      const start=[...s.player.position] as Vec3;
      const target=s.state.things.find(t=>t.id===portion.id)!;
      // Traverse through native steps towards the actual dynamically tracked portion.
      const arrival=drive(s,[...target.position],80,1.2);
      const distance=flat(s.player.position,s.state.things.find(t=>t.id===portion.id)!.position);
      const atArrival={mira:fmt(s.state.residents.find(r=>r.name==='Mira')!.position),player:fmt(s.player.position),item:fmt(s.state.things.find(t=>t.id===portion.id)!.position)};
      let pickup={accepted:false,reason:'control arm'};
      if(take)pickup=s.act({kind:'pickup',targetId:portion.id});
      if(reloadAfterPickup&&pickup.accepted)await s.load(s.save());
      const leave=drive(s,start,80,1.25);
      const snapshots:Array<{seconds:number;goal:string;concern:boolean;reserve:number;known:boolean|null;position:number[];gathered:number}>=[];
      const begin=s.state.seconds;
      const sample=(after:number)=>{
        const r=s.state.residents.find(x=>x.name==='Mira')!;
        const point=s.state.source.places.find(x=>x.id===r.concern?.placeId)!;
        snapshots.push({seconds:after,goal:r.intent.goal,concern:!!r.concern?.satisfied,
          reserve:s.state.things.filter(t=>t.kind==='food'&&!t.consumed&&!t.heldBy&&flat(t.position,point.position)<2.1).length,
          known:r.knownThings.find(t=>t.id===portion.id)?.available??null,position:fmt(r.position),
          gathered:r.memories.filter(m=>m.kind==='gathered').length});
      };
      sample(0);
      for(let i=1;i<=1500;i++){
        s.advance(.1);
        if(i===100||i===300||i===600||i===1500)sample(i*.1);
      }
      const selected=s.state.things.find(t=>t.id===portion.id)!;
      return {take,reloadAfterPickup,initial:fmt(start),arrival,distance:+distance.toFixed(2),atArrival,pickup,leave,
        actualHeldBy:selected.heldBy,steps:s.physics.metrics.steps,elapsed:+(s.state.seconds-begin).toFixed(2),snapshots};
    }finally{s.dispose();}
  };
  const A=await arm(false);
  const B=await arm(true);
  const C=await arm(true,true);
  console.info('OWNER_NATIVE_RETURN',JSON.stringify({offset,cache:cache.id,portion:portion.id,initialMira:fmt(initialMiraSnapshot.position),A,B,C}));
  expect(A.arrival.minDistance,'control player never reached reachable cache vicinity').toBeLessThan(2);
  expect(B.arrival.minDistance,'intervention player never reached cache vicinity').toBeLessThan(2);
  expect(B.pickup.accepted,'real pickup could not be performed after a native walking trajectory').toBe(true);
  expect(A.pickup.accepted).toBe(false);
  expect(B.actualHeldBy).toBe('player:jozz');
  expect(C.pickup.accepted).toBe(true);
  expect(C.actualHeldBy).toBe('player:jozz');
  // Same source run through the same body-controlled arrival and departure.
  expect(A.arrival.from).toEqual(B.arrival.from);
  expect(A.arrival.to).toEqual(B.arrival.to);
  expect(A.leave.to).toEqual(B.leave.to);
  // Merely reading a full reserve at the end would miss that it was rebuilt.
  expect(A.snapshots[0].known).toBe(true);
  expect(B.snapshots[0].known).toBe(false);
  expect(C.snapshots[0].known).toBe(false);
  expect(A.snapshots.at(-1)!.concern).toBe(true);
  expect(B.snapshots.at(-1)!.concern).toBe(true);
  expect(C.snapshots.at(-1)!.concern).toBe(true);
  expect(B.snapshots.at(-1)!.gathered).toBeGreaterThan(A.snapshots.at(-1)!.gathered);
  expect(C.snapshots.at(-1)!.gathered).toBeGreaterThan(A.snapshots.at(-1)!.gathered);
  expect(B.snapshots.at(-1)!.reserve).toBeGreaterThanOrEqual(B.snapshots[0].reserve);
  expect(C.snapshots.at(-1)!.reserve).toBeGreaterThanOrEqual(C.snapshots[0].reserve);
},75000);
