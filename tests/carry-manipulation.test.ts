import { describe, expect, it } from 'vitest';
import { createPhysics } from '../src/physics/index';
import { createRegion } from '../src/world/source';
import { createWorld } from '../src/world/state';
import type { Resident, Vec3 } from '../src/world/types';

const yaw = (q: number[]) => Math.atan2(2*(q[3]*q[1]+q[0]*q[2]),1-2*(q[1]*q[1]+q[2]*q[2]));
const angle = (v: number) => Math.atan2(Math.sin(v),Math.cos(v));
function fixture(mass=3, height=.91) {
  const state=createWorld(createRegion()),actor=state.residents[0] as Resident & {carryYaw?:number;carryHeight?:number};
  state.source.home.parts=[];state.source.forms=[];state.source.extent=[30,30];state.source.channels=[];
  state.residents=[actor];actor.position=[0,height,0];actor.rotation=[0,0,0,1];actor.velocity=[0,0,0];actor.angularVelocity=[0,0,0];
  const thing=state.things[0];state.things=[thing];thing.size=[1.6,.18,.22];thing.mass=mass;
  thing.position=[0,height+.22,.62];thing.rotation=[0,Math.sin(.35/2),0,Math.cos(.35/2)];
  thing.velocity=[0,0,0];thing.angularVelocity=[0,0,0];thing.heldBy=actor.id;actor.holding=thing.id;
  return {state,actor,thing};
}
const step=(p:Awaited<ReturnType<typeof createPhysics>>,s:ReturnType<typeof fixture>['state'],n:number)=>{for(let i=0;i<n;i++)p.step(1/60,new Map(),s);};

describe('native finite carry manipulation',()=>{
  for(const mass of [.18,3]) it(`settles a ${mass}kg held portion without manufacturing release velocity`,async()=>{
    const {state,actor,thing}=fixture(mass);thing.size=mass<1?[.18,.16,.18]:[.45,.5,.3];
    thing.position[0]+=.01;
    const p=await createPhysics(state,()=>0);
    try {
      step(p,state,120);
      const error=Math.hypot(thing.position[0]-actor.position[0],thing.position[1]-actor.position[1]-.22,thing.position[2]-actor.position[2]-.62);
      const relativeSpeed=Math.hypot(...thing.velocity.map((v,i)=>v-actor.velocity[i]));
      expect(actor.holding,JSON.stringify({mass,error,relativeSpeed,velocity:thing.velocity})).toBe(thing.id);
      expect(error).toBeLessThan(.15);
      expect(relativeSpeed).toBeLessThan(.3);
      const position=[...thing.position];
      expect(p.release(actor.id,state)).toBe(true);
      step(p,state,30);
      const releaseDrift=Math.hypot(thing.position[0]-position[0],thing.position[2]-position[2]);
      expect(releaseDrift).toBeLessThan(.3);
    } finally {p.dispose();}
  });
  it('turns an asymmetric held thing relative to the actor through physical yaw control',async()=>{
    const {state,actor,thing}=fixture();
    // A long beam at waist height hits the carrier while turning. Give this
    // yaw-control test clearance above the capsule instead of demanding penetration.
    actor.carryHeight=.9;thing.position[1]+=.9;
    const p=await createPhysics(state,()=>0);
    try {
      step(p,state,30);const initial=angle(yaw(thing.rotation)-yaw(actor.rotation));
      actor.carryYaw=Math.PI/2;
      const before=[...thing.rotation];p.step(1/60,new Map(),state);
      expect(Math.abs(angle(yaw(thing.rotation)-yaw(before)))).toBeLessThan(.2);
      step(p,state,180);
      expect(actor.holding).toBe(thing.id);
      expect(angle(yaw(thing.rotation)-yaw(actor.rotation)-initial)).toBeCloseTo(Math.PI/2,1);
    } finally {p.dispose();}
  });
  it('raises a held thing gradually by moving the hand target, leaving body motion to the solver',async()=>{
    const {state,actor,thing}=fixture(),p=await createPhysics(state,()=>0);
    try {
      step(p,state,90);const before=[...thing.position] as Vec3,actorY=actor.position[1];
      actor.carryHeight=.65;p.step(1/60,new Map(),state);
      expect(thing.position[1]-before[1]).toBeLessThan(.05);
      step(p,state,150);
      expect(thing.position[1]-before[1]).toBeGreaterThan(.5);
      expect(Math.abs(actor.position[1]-actorY)).toBeLessThan(.1);
      expect(p.metrics.maxGripForce).toBeLessThanOrEqual(120.001);
    } finally {p.dispose();}
  });
  it('preserves the acquired orientation and applies equal yaw impulse reaction in free flight',async()=>{
    const {state,actor,thing}=fixture(3,12),p=await createPhysics(state,()=>0);
    try {
      p.step(1/60,new Map(),state);expect(yaw(thing.rotation)).toBeCloseTo(.35,3);
      actor.carryYaw=1;p.step(1/60,new Map(),state);
      expect(thing.angularVelocity[1]).toBeGreaterThan(.01);
      expect(actor.angularVelocity[1]).toBeLessThan(-.001);
    } finally {p.dispose();}
  });
  it('releasing preserves actual pose and linear/angular motion without a transform reset',async()=>{
    const {state,actor,thing}=fixture(),p=await createPhysics(state,()=>0);
    try {
      step(p,state,30);actor.carryYaw=1;actor.carryHeight=.5;step(p,state,5);
      const before=structuredClone(thing);
      expect(Math.abs(thing.angularVelocity[1])).toBeGreaterThan(.05);
      expect(p.release(actor.id,state)).toBe(true);
      expect(thing.position).toEqual(before.position);expect(thing.rotation).toEqual(before.rotation);
      expect(thing.velocity).toEqual(before.velocity);expect(thing.angularVelocity).toEqual(before.angularVelocity);
      p.step(1/60,new Map(),state);
      expect(thing.heldBy).toBeNull();expect(Math.abs(thing.angularVelocity[1])).toBeGreaterThan(.02);
    } finally {p.dispose();}
  });
  it('transfers lifting reaction to the carrier and lets an over-heavy thing break the finite grip',async()=>{
    const light=fixture(3,12),heavy=fixture(100),a=await createPhysics(light.state,()=>0),b=await createPhysics(heavy.state,()=>0);
    try {
      step(a,light.state,1);step(b,heavy.state,1);light.actor.carryHeight=.6;heavy.actor.carryHeight=.6;
      step(a,light.state,1);step(b,heavy.state,1);
      expect(light.actor.velocity[1]).toBeLessThan(-9.81/30-.005);
      step(a,light.state,180);step(b,heavy.state,180);
      expect(heavy.actor.holding).toBeNull();expect(heavy.thing.heldBy).toBeNull();
      expect(b.metrics.maxGripForce).toBeLessThanOrEqual(120.001);
    } finally {a.dispose();b.dispose();}
  });
  it('continues carrying the ordinary bag at the default hand height',async()=>{
    const {state,actor,thing}=fixture();thing.size=[.45,.5,.3];thing.rotation=[0,0,0,1];
    const p=await createPhysics(state,()=>0);
    try {step(p,state,240);expect(actor.holding).toBe(thing.id);expect(thing.position[1]-actor.position[1]).toBeGreaterThan(.1);}
    finally {p.dispose();}
  });
});
