import { describe, it, expect } from 'vitest';
import { createPhysics } from '../src/physics/index';
import { createRegion } from '../src/world/source';
import { createWorld } from '../src/world/state';
import { heightAt } from '../src/world/geography';
import { encodeCheckpoint, decodeCheckpoint } from '../src/world/checkpoint';

describe('real native execution in the authored home',()=>{
 it('keeps two native residents from occupying one body volume',async()=>{
  const s=createWorld(createRegion()), y=heightAt(0,8)+.9;
  s.residents[0].position=[0,y,8];s.residents[1].position=[.35,y,8];
  s.residents[0].holding=null;s.things[0].heldBy=null;
  const p=await createPhysics(s,heightAt);
  for(let i=0;i<180;i++)p.step(1/60,new Map(),s);
  const [a,b]=s.residents;
  expect(Math.hypot(a.position[0]-b.position[0],a.position[2]-b.position[2])).toBeGreaterThan(.58);
  p.dispose();
 });
 it('walks actual .15m entrance steps with bounded supported drive',async()=>{
  const s=createWorld(createRegion()); const a=s.residents[0];
  a.position=[0,heightAt(0,6.1)+.9,6.1];a.holding=null;s.things[0].heldBy=null;
  s.residents[1].position=[8,heightAt(8,8)+.9,8];
  const p=await createPhysics(s,heightAt);
  for(let i=0;i<360;i++)p.step(1/60,new Map([[a.id,{velocity:[0,0,-.8],posture:0}]]),s);
  expect(a.position[2]).toBeLessThan(2.9);
  expect(a.position[1]).toBeGreaterThan(s.source.home.position[1]+.65);
  expect(p.metrics.maxSupportForce).toBeLessThanOrEqual(1800.001);
  p.dispose();
 });
 it('does not levitate above unreachable ground',async()=>{
  const s=createWorld(createRegion());const a=s.residents[0];
  a.holding=null;s.things[0].heldBy=null;a.position=[0,heightAt(0,9)+3,9];
  const p=await createPhysics(s,heightAt), before=a.position[1];
  p.step(1/60,new Map([[a.id,{velocity:[0,0,0],posture:0}]]),s);
  expect(a.position[1]).toBeLessThan(before);
  expect(p.metrics.lastSupportForce.get(a.id)??0).toBe(0);
  p.dispose();
 });
 it('can stand after supported rest without mistaking distant terrain bounds for a ceiling',async()=>{
  const s=createWorld(createRegion()),a=s.residents[0];
  a.holding=null;s.things[0].heldBy=null;a.position=[-8,heightAt(-8,8)+.9,8];
  const p=await createPhysics(s,heightAt);
  for(let i=0;i<180;i++)p.step(1/60,new Map([[a.id,{velocity:[0,0,0],posture:1}]]),s);
  expect(a.posture).toBeGreaterThan(.95);
  for(let i=0;i<180;i++)p.step(1/60,new Map([[a.id,{velocity:[0,0,0],posture:0}]]),s);
  expect(a.posture).toBeLessThan(.05);p.dispose();
 });
 it('restores current velocity and held identity before the first resumed step',async()=>{
  const s=createWorld(createRegion());s.things[0].velocity=[.2,.1,-.3];s.things[0].angularVelocity=[.1,.2,.3];
  const saved=decodeCheckpoint(encodeCheckpoint(s));const p=await createPhysics(saved,heightAt);
  p.sync(saved);
  saved.things[0].velocity.forEach((v,i)=>expect(v).toBeCloseTo(s.things[0].velocity[i],6));
  saved.things[0].angularVelocity.forEach((v,i)=>expect(v).toBeCloseTo(s.things[0].angularVelocity[i],6));
  expect(saved.things[0].heldBy).toBe(s.residents[0].id);
  p.dispose();
 });
});
