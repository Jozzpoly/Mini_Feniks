import { describe,it,expect } from 'vitest';
import { createSession } from '../src/session';
import { createRegion } from '../src/world/source';
import { createWorld } from '../src/world/state';
import { heightAt } from '../src/world/geography';
import { encodeCheckpoint,decodeCheckpoint } from '../src/world/checkpoint';

describe('one evolving inhabited realm',()=>{
 it('advances only completed fixed steps and freezes under pause',async()=>{
  const s=await createSession(createWorld(createRegion()),heightAt);
  s.advance(.1);expect(s.state.tick).toBe(6);
  s.paused=true;const before=encodeCheckpoint(s.state);s.advance(60);
  expect(encodeCheckpoint(s.state)).toBe(before);s.dispose();
 });
 it('carries the same bag through the actual home and continues from its own needs',async()=>{
  const s=await createSession(createWorld(createRegion()),heightAt);
  for(let i=0;i<900;i++)s.advance(.1);
  expect(s.state.events.some(e=>e.kind==='placed'&&e.detail==='Odłożył własną torbę')).toBe(true);
  const bag=s.state.things.find(t=>t.kind==='bag')!;
  expect(Math.abs(bag.position[0])).toBeLessThan(5);expect(Math.abs(bag.position[2])).toBeLessThan(3.5);
  expect(s.state.residents.some(r=>r.memories.some(m=>m.kind==='rested'))).toBe(true);
  expect(s.state.things.find(t=>t.kind==='bag')?.id).toBe('thing:bag');
  const loaded=decodeCheckpoint(encodeCheckpoint(s.state));
  expect(loaded.seconds).toBeCloseTo(s.state.seconds,9);
  expect(loaded.residents.map(r=>r.intent)).toEqual(s.state.residents.map(r=>r.intent));
  s.dispose();
 },20000);
 it('load preserves private stale knowledge until an actual resumed observation',async()=>{
  const s=await createSession(createWorld(createRegion()),heightAt);s.paused=true;
  const result=s.edit('home-wall-front-left',{size:[4.15,2.9,.3]});expect(result.accepted).toBe(true);
  const snapshot=s.save(),before=JSON.stringify(s.state.residents.map(r=>({known:r.known,parts:r.knownParts,memories:r.memories,intent:r.intent})));
  await s.load(snapshot);
  expect(JSON.stringify(s.state.residents.map(r=>({known:r.known,parts:r.knownParts,memories:r.memories,intent:r.intent})))).toBe(before);
  s.dispose();
 });
 it('rejects a different terrain recipe without replacing the running world',async()=>{
  const s=await createSession(createWorld(createRegion()),heightAt),snapshot=s.save();
  const edited=decodeCheckpoint(snapshot);edited.source.seed++;
  await expect(s.load(encodeCheckpoint(edited))).rejects.toThrow(/geograf/);
  expect(s.save()).toBe(snapshot);s.dispose();
 });
 it('a hungry resident can actually reach and eat the finite meal on the solid table',async()=>{
  const state=createWorld(createRegion()),r=state.residents[0];
  r.holding=null;state.things[0].heldBy=null;r.fatigue=.15;r.curiosity=.1;r.hunger=.8;
  r.position=[.8,state.source.home.position[1]+.9,1.5];
  const s=await createSession(state,heightAt);
  for(let i=0;i<250;i++)s.advance(.1);
  expect(s.state.things.find(t=>t.kind==='food')!.consumed).toBe(true);
  expect(s.state.events.filter(e=>e.kind==='ate')).toHaveLength(1);
  expect(r.hunger).toBeLessThan(.35);s.dispose();
 },20000);
});
