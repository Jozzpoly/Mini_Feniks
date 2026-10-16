import { describe, expect, it } from 'vitest';
import { chooseIntent, observeResident, stepLife } from '../src/life';
import {advanceActivities} from '../src/actors/activities';
import type { Resident, WorldState } from '../src/world/types';

function person(id = 'ada'): Resident {
  return { id, name:id, position:[0,0,0], rotation:[0,0,0,1], velocity:[0,0,0], angularVelocity:[0,0,0], fatigue:.72, hunger:.1, sociability:.3, curiosity:.5, preferredRest:'bench', knownParts:[], knownThings:[], known:[{id:'bench', kind:'rest', position:[4,0,0], seenAt:0, occupiedBy:null},{id:'other',kind:'rest',position:[0,0,5],seenAt:0,occupiedBy:null}], memories:[], intent:{goal:'quiet',targetId:null,reason:'spokojnie',chosenAt:-10}, posture:0, holding:null, blockedFor:0, restUntil:0, reconsiderAt:0 };
}
function world(): WorldState {
  return { schema:1,worldId:'test',tick:0,seconds:10,source:{id:'region',revision:0,seed:13,terrainVersion:'fixture-1',extent:[6000,4000],home:{id:'home',position:[0,0,0],yaw:0,parts:[]},channels:[],places:[{id:'bench',label:'ławka',position:[4,0,0],kind:'rest'},{id:'other',label:'druga ławka',position:[0,0,5],kind:'rest'},{id:'pantry',label:'chleb',position:[8,0,1.3],kind:'food'},{id:'put',label:'stół',position:[2,0,0],kind:'put'}]},residents:[person()],things:[{id:'bread',label:'chleb',kind:'food',size:[.2,.2,.2],mass:.1,position:[8,0,0],rotation:[0,0,0,1],velocity:[0,0,0],angularVelocity:[0,0,0],heldBy:null,consumed:false}],events:[],revisions:[] };
}

describe('resident knowledge and own reasons', () => {
  it('keeps a far author edit outside private knowledge and history', () => {
    const state=world(), resident=state.residents[0];
    observeResident(state,resident);
    const before=JSON.stringify({known:resident.known,memories:resident.memories});
    state.source.places.push({id:'far',label:'nowe miejsce',kind:'rest',position:[200,0,0]});
    observeResident(state,resident);
    expect(JSON.stringify({known:resident.known,memories:resident.memories})).toBe(before);
    expect(resident.known.some(k=>k.id==='far')).toBe(false);
  });
  it('changes rest choice after witnessing occupancy of a preferred bench', () => {
    const state=world(),resident=state.residents[0];
    expect(chooseIntent(state,resident).targetId).toBe('bench');
    const neighbor=person('ben');neighbor.position=[4,0,0];state.residents.push(neighbor);
    observeResident(state,resident);
    expect(chooseIntent(state,resident).targetId).toBe('other');
    expect(resident.memories.some(m=>m.kind==='saw' && m.target==='bench')).toBe(true);
  });
  it('keeps remembered place kind and position after a remote author change', () => {
    const state=world(),resident=state.residents[0];resident.known=[{id:'bench',kind:'rest',position:[200,0,0],seenAt:0,occupiedBy:null}];
    state.source.places=state.source.places.filter(p=>p.id==='bench');state.source.places[0].position=[200,0,0];
    expect(chooseIntent(state,resident).targetId).toBe('bench');
    state.source.places=state.source.places.filter(p=>p.id!=='bench');observeResident(state,resident);
    expect(chooseIntent(state,resident).targetId).toBe('bench');
    expect(resident.known[0].position).toEqual([200,0,0]);
  });
  it('learns the absence of a removed rest place locally and chooses a still available place',()=>{
    const state=world(),r=state.residents[0];observeResident(state,r);
    expect(chooseIntent(state,r).targetId).toBe('bench');
    state.source.places=state.source.places.filter(p=>p.id!=='bench');r.position=[100,0,100];state.seconds++;
    observeResident(state,r);expect(chooseIntent(state,r).targetId).toBe('bench');
    r.position=[0,0,0];observeResident(state,r);
    expect(chooseIntent(state,r).targetId).toBe('other');
    expect(r.known.find(k=>k.id==='bench')?.available).toBe(false);
  });
  it('stops routing around an absent wall only after a local witness of its absence',()=>{
    const state=world(),r=state.residents[0];
    state.source.home.parts=[{id:'wall',label:'ściana',position:[2,1,0],size:[.4,3,6],yaw:0,role:'wall',material:'stone',solid:true}];
    observeResident(state,r);expect(r.knownParts.some(p=>p.id==='wall')).toBe(true);
    state.source.home.parts=[];r.position=[100,0,100];state.seconds++;
    observeResident(state,r);expect(r.knownParts.find(p=>p.id==='wall')?.present).not.toBe(false);
    r.position=[0,0,0];observeResident(state,r);
    expect(r.knownParts.find(p=>p.id==='wall')?.present).toBe(false);
    const drive=stepLife(state,.25).get(r.id)!;
    expect(drive.velocity[0]).toBeCloseTo(1.2,6);expect(drive.velocity[2]).toBeCloseTo(0,6);
  });
  it('does not perceive a place through a solid wall', () => {
    const state=world(),resident=state.residents[0];resident.known=[];
    state.source.home.parts.push({id:'wall',label:'ściana',position:[2,1,0],size:[.4,3,6],yaw:0,material:'stone',role:'wall',solid:true});
    observeResident(state,resident);
    expect(resident.known.some(k=>k.id==='bench')).toBe(false);
    expect(resident.known.some(k=>k.id==='other')).toBe(true);
  });
  it('occludes witnesses on the native positive-Y yaw axis', () => {
    const state=world(),resident=state.residents[0];resident.position=[1,0,-3];resident.known=[];
    state.source.places=[{id:'hidden',kind:'rest',label:'za ścianą',position:[1,0,0]}];
    state.source.home.parts=[{id:'diagonal',label:'ściana',position:[0,1,0],size:[4,3,.2],yaw:Math.PI/4,material:'stone',role:'wall',solid:true}];
    observeResident(state,resident);
    expect(resident.known.some(k=>k.id==='hidden')).toBe(false);
    expect(resident.knownParts.some(k=>k.id==='diagonal')).toBe(true);
  });
  it('does not eat because an unwitnessed global portion exists', () => {
    const state=world(),resident=state.residents[0];resident.hunger=.9;resident.fatigue=.1;
    state.things[0].position=[100,0,0];
    observeResident(state,resident);
    expect(chooseIntent(state,resident).goal).not.toBe('eat');
  });
  it('holds a reasonable decision but urgent fatigue preempts curiosity', () => {
    const state=world(),resident=state.residents[0];resident.fatigue=.2;
    state.source.places.push({id:'ridge',label:'grzbiet',kind:'lookout',position:[0,0,12]});
    observeResident(state,resident);resident.curiosity=.9;
    resident.intent=chooseIntent(state,resident);resident.intent.chosenAt=state.seconds;
    const first=resident.intent;
    state.seconds+=.4;resident.hunger=.4;
    expect(chooseIntent(state,resident)).toBe(first);
    resident.fatigue=.97;
    expect(chooseIntent(state,resident).goal).toBe('rest');
  });
  it('allows unpressured quiet without a phase counter or operator order', () => {
    const state=world(),resident=state.residents[0];resident.fatigue=.1;resident.hunger=.1;resident.curiosity=.05;
    expect(chooseIntent(state,resident).goal).toBe('quiet');
    expect(chooseIntent(state,resident).reason.length).toBeGreaterThan(8);
  });
});

describe('life drives actual physical execution', () => {
  it('outputs finite horizontal movement without moving a resident or bag', () => {
    const state=world(),resident=state.residents[0];resident.holding='bag';resident.known.push({id:'put',kind:'put',position:[2,0,0],seenAt:0,occupiedBy:null});
    state.things.push({...state.things[0],id:'bag',kind:'bag',position:[0,1,0],heldBy:resident.id});
    const before=JSON.stringify({position:resident.position,holding:resident.holding,bag:state.things[1]});
    const drive=stepLife(state,.1).get(resident.id)!;
    expect(resident.intent.goal).toBe('carry-home');
    expect(Math.hypot(...drive.velocity)).toBeGreaterThan(0);
    expect(Math.hypot(...drive.velocity)).toBeLessThanOrEqual(1.2);
    expect(drive.velocity[1]).toBe(0);
    expect(JSON.stringify({position:resident.position,holding:resident.holding,bag:state.things[1]})).toBe(before);
  });
  it('does not claim recovery before actual supported rest posture', () => {
    const state=world(),resident=state.residents[0];resident.position=[4,0,0];resident.fatigue=.8;
    const before=resident.fatigue;
    expect(stepLife(state,1).get(resident.id)!.posture).toBe(1);
    expect(resident.fatigue).toBeGreaterThanOrEqual(before);
    resident.posture=.95;resident.velocity=[0,0,0];state.seconds++;
    stepLife(state,1);
    expect(resident.fatigue).toBeLessThan(before);
    expect(resident.memories.some(m=>m.kind==='rested')).toBe(true);
  });
  it('consumes only one arrived, observed, unheld finite portion', () => {
    const state=world(),resident=state.residents[0];resident.position=[8,0,1.3];resident.hunger=.95;resident.fatigue=.1;
    stepLife(state,.1);
    expect(state.things[0].consumed).toBe(false);state.seconds+=4;advanceActivities(state,4);
    expect(state.things[0].consumed).toBe(true);
    const ate=resident.memories.filter(m=>m.kind==='ate').length;
    resident.hunger=.95;state.seconds+=5;stepLife(state,.1);
    expect(resident.memories.filter(m=>m.kind==='ate').length).toBe(ate);
    expect(resident.intent.goal).not.toBe('eat');
  });
  it('refuses someone else’s held food at arrival', () => {
    const state=world(),resident=state.residents[0];resident.position=[8,0,1.3];resident.hunger=.95;resident.fatigue=.1;state.things[0].heldBy='ben';
    stepLife(state,.1);
    expect(state.things[0].consumed).toBe(false);
  });
  it('reconsiders a blocked target rather than blindly repeating it', () => {
    const state=world(),resident=state.residents[0];resident.intent={goal:'rest',targetId:'bench',reason:'zmęczenie',chosenAt:9};resident.blockedFor=3.2;
    stepLife(state,.1);
    expect(resident.intent.targetId).toBe('other');
    expect(resident.memories.some(m=>m.kind==='blocked'&&m.target==='bench')).toBe(true);
  });
  it('does not append frame-by-frame observation or decision memories', () => {
    const state=world(),resident=state.residents[0];resident.fatigue=.1;resident.curiosity=.01;
    stepLife(state,.01);const count=resident.memories.length;
    for(let i=0;i<200;i++){state.seconds+=.01;stepLife(state,.01);}
    expect(resident.memories.length).toBe(count);
  });
  it('navigates the familiar entrance before an interior target', () => {
    const state=world(),resident=state.residents[0];resident.position=[3, .9, 7];resident.holding='bag';
    resident.known.push({id:'put',kind:'put',position:[2, .9, 0],seenAt:0,occupiedBy:null});state.source.places.find(p=>p.id==='put')!.position=[2,.9,0];
    resident.knownParts=[{id:'floor',role:'floor',position:[0,.78,0],size:[10,.24,7],yaw:0,seenAt:0},{id:'left',role:'wall',position:[-2.925,2.2,3.5],size:[4.15,2.6,.3],yaw:0,seenAt:0},{id:'right',role:'wall',position:[2.925,2.2,3.5],size:[4.15,2.6,.3],yaw:0,seenAt:0}];
    state.source.home.parts=resident.knownParts.map(({id,position,size,yaw,role})=>({id,label:id,position,size,yaw,role,material:'stone',solid:true}));
    const drive=stepLife(state,.1).get(resident.id)!;
    // First approach lines up outside the opening rather than aiming through the wall.
    expect(drive.velocity[0]).toBeLessThan(-.7);
    expect(Math.abs(drive.velocity[2])).toBeLessThan(.9);
  });
  it('requires a known meal place rather than treating any loose object as a meal', () => {
    const state=world(),resident=state.residents[0];resident.position=[8,0,1.3];resident.fatigue=.1;resident.hunger=.95;state.source.places=state.source.places.filter(p=>p.kind!=='food');
    stepLife(state,.1);
    expect(state.things[0].consumed).toBe(false);
  });
  it('preempts a food journey on witnessing that its remembered spot is empty', () => {
    const state=world(),resident=state.residents[0];resident.fatigue=.1;resident.hunger=.95;observeResident(state,resident);resident.intent=chooseIntent(state,resident);
    expect(resident.intent.goal).toBe('eat');
    state.things[0].position=[100,0,0];state.seconds+=.2;observeResident(state,resident);
    expect(chooseIntent(state,resident).goal).not.toBe('eat');
  });
  it('keeps a sustained real rest as one meaningful remembered transition', () => {
    const state=world(),resident=state.residents[0];resident.position=[4,0,0];resident.fatigue=.99;resident.posture=.95;
    for(let i=0;i<20;i++){state.seconds+=.5;stepLife(state,.5);}
    expect(resident.memories.filter(m=>m.kind==='rested').length).toBe(1);
  });

  it('keeps the next curiosity decision after a meal rather than completing it at the food', () => {
    const state=world(),resident=state.residents[0];resident.position=[8,0,1.3];resident.fatigue=.1;resident.hunger=.95;resident.curiosity=.9;
    state.source.places.push({id:'ridge',kind:'lookout',position:[12,0,0],label:'skraj'});
    stepLife(state,.1);
    state.seconds+=4;advanceActivities(state,4);stepLife(state,0);
    expect(state.things[0].consumed).toBe(true);
    expect(resident.intent.goal).toBe('wander');
    expect(resident.intent.targetId).toBe('ridge');
  });

  it('routes around privately known diagonal walls using the native yaw axis', () => {
    const state=world(),resident=state.residents[0];resident.position=[1,0,-3];resident.fatigue=.8;
    state.source.places=[{id:'bench',label:'ławka',kind:'rest',position:[1,0,0]}];resident.known=[{id:'bench',kind:'rest',position:[1,0,0],seenAt:0,occupiedBy:null}];
    resident.knownParts=[{id:'diagonal',position:[0,1,0],size:[4,3,.2],yaw:Math.PI/4,role:'wall',seenAt:0}];
    state.source.home.parts=resident.knownParts.map(({id,position,size,yaw,role})=>({id,label:id,position,size,yaw,role,material:'stone',solid:true}));
    const first=stepLife(state,.1).get(resident.id)!;
    expect(Math.abs(first.velocity[0])).toBeGreaterThan(.2);
    for(let i=0;i<90;i++){
      state.seconds+=.1;const drive=stepLife(state,.1).get(resident.id)!;
      resident.position[0]+=drive.velocity[0]*.1;resident.position[2]+=drive.velocity[2]*.1;
      const x=(resident.position[0]-resident.position[2])/Math.sqrt(2),z=(resident.position[0]+resident.position[2])/Math.sqrt(2);
      expect(Math.abs(x)<2.31&&Math.abs(z)<.41,`wall crossing at ${resident.position}`).toBe(false);
    }
    expect(Math.hypot(resident.position[0]-1,resident.position[2])).toBeLessThanOrEqual(.6);
  });
  it('stages a rotated familiar doorway using native yaw world coordinates', () => {
    const state=world(),resident=state.residents[0];const angle=Math.PI/4,c=Math.cos(angle),sin=Math.sin(angle);
    const rotated=(v:[number,number,number]):[number,number,number]=>[c*v[0]+sin*v[2],v[1],-sin*v[0]+c*v[2]];
    resident.position=rotated([3,.9,7]);resident.holding='bag';state.source.places=[{id:'put',label:'stół',kind:'put',position:rotated([2,.9,0])}];
    resident.known=[{id:'put',kind:'put',position:rotated([2,.9,0]),seenAt:0,occupiedBy:null}];
    resident.knownParts=[{id:'floor',role:'floor',position:rotated([0,.78,0]),size:[10,.24,7],yaw:angle,seenAt:0},{id:'left',role:'wall',position:rotated([-2.925,2.2,3.5]),size:[4.15,2.6,.3],yaw:angle,seenAt:0},{id:'right',role:'wall',position:rotated([2.925,2.2,3.5]),size:[4.15,2.6,.3],yaw:angle,seenAt:0}];
    state.source.home.parts=resident.knownParts.map(({id,position,size,yaw,role})=>({id,label:id,position,size,yaw,role,material:'stone',solid:true}));
    const drive=stepLife(state,.1).get(resident.id)!;const localX=c*drive.velocity[0]-sin*drive.velocity[2],localZ=sin*drive.velocity[0]+c*drive.velocity[2];
    expect(localX).toBeCloseTo(-3/Math.hypot(3,1.4)*1.2,6);
    expect(localZ).toBeCloseTo(-1.4/Math.hypot(3,1.4)*1.2,6);
  });
  it('eats one table portion from its private approach outside the solid table', () => {
    const state=world(),resident=state.residents[0];resident.position=[8,.9,1.3];resident.hunger=.95;resident.fatigue=.1;
    state.things[0].position=[8,.92,0];
    state.source.home.parts=[{id:'table',label:'stół',position:[8,.78,0],size:[1.8,.14,1.05],yaw:0,role:'table',material:'timber',solid:true}];
    const drive=stepLife(state,.1).get(resident.id)!;
    state.seconds+=4;advanceActivities(state,4);
    expect(Math.hypot(resident.position[0]-state.things[0].position[0],resident.position[2]-state.things[0].position[2])).toBeGreaterThan(.835);
    expect(state.things[0].consumed).toBe(true);
    expect(drive.velocity).toEqual([0,0,0]);
    expect(resident.memories.filter(m=>m.kind==='ate').map(m=>m.target)).toEqual(['bread']);
  });
  it('routes toward a remembered meal approach while keeping food identity as its target', () => {
    const state=world(),resident=state.residents[0];resident.position=[5,0,1.3];resident.hunger=.95;resident.fatigue=.1;
    const drive=stepLife(state,.1).get(resident.id)!;
    expect(resident.intent.targetId).toBe('bread');
    expect(drive.velocity[0]).toBeCloseTo(1.2,6);expect(drive.velocity[2]).toBeCloseTo(0,6);
    expect(state.things[0].consumed).toBe(false);
  });

});
