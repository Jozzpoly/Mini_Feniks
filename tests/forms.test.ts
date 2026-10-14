import { describe, expect, it } from 'vitest';
import { createRegion } from '../src/world/source';
import { createWorld } from '../src/world/state';
import { adoptRegionForms, syncFormProjection, createFormSource, resolveFormTransform,worldToFormPose } from '../src/world/forms';
import { AuthoringHistory } from '../src/world/authoring';
import {observeResident} from '../src/life';
import {encodeCheckpoint,decodeCheckpoint} from '../src/world/checkpoint';
const fixture = () => { const state = createWorld(createRegion()); adoptRegionForms(state.source); state.residents.forEach(p => p.position = [50, 10, 50]); state.things.forEach(t => t.position = [60, 10, 60]); return state; };
describe('composed authoring', () => {
 it('adopts without moving old parts or uses; rotates bench legs and use together', () => {
  const state = fixture(), before = structuredClone(state.source), history = new AuthoringHistory();
  const bench = state.source.forms!.find(f => f.kind === 'bench')!;
  expect(history.apply(state, {kind:'transform',formId:bench.id,yaw:Math.PI/2}).accepted).toBe(true);
  const pose = resolveFormTransform(state.source, bench.id), use = state.source.places.find(p => p.id === 'rest-inside')!;
  expect(use.position[0]).toBeCloseTo(pose.position[0]); expect(use.position[2]).toBeCloseTo(pose.position[2]-.65);
  expect(state.source.home.parts.find(p => p.id === 'home-table')).toEqual(before.home.parts.find(p => p.id === 'home-table'));
  expect(state.source.home.parts.find(p => p.id.startsWith('home-bench-leg'))!.yaw).toBeCloseTo(Math.PI/2);
 });
 it('undo preserves elapsed time, consumption, memories and unrelated edits', () => {
  const state = fixture(), history = new AuthoringHistory(), bench = state.source.forms!.find(f=>f.kind==='bench')!;
  const memories = structuredClone(state.residents[0].knownParts);
  expect(history.apply(state,{kind:'transform',formId:bench.id,position:[-2,0,-1]}).accepted).toBe(true);
  state.seconds=99; state.tick=5940; state.things[0].consumed=true;
  state.source.forms!.find(f=>f.kind==='table')!.label='Later table label';
  expect(history.undo(state).accepted).toBe(true); expect(state.seconds).toBe(99); expect(state.tick).toBe(5940); expect(state.things[0].consumed).toBe(true);
  expect(state.residents[0].knownParts).toEqual(memories); expect(state.source.forms!.find(f=>f.kind==='table')!.label).toBe('Later table label');
 });
 it('rejects old and new occupancy, no-ops and history conflict atomically', () => {
  const state=fixture(), history=new AuthoringHistory(), bench=state.source.forms!.find(f=>f.kind==='bench')!;
  expect(history.apply(state,{kind:'transform',formId:bench.id}).accepted).toBe(false);
  state.residents[0].position=[...state.source.home.parts.find(p=>p.id==='home-bench')!.position];
  const before=structuredClone(state); expect(history.apply(state,{kind:'transform',formId:bench.id,position:[20,0,20]}).accepted).toBe(false); expect(state).toEqual(before);
  state.residents[0].position=[50,10,50]; expect(history.apply(state,{kind:'transform',formId:bench.id,position:[20,0,20]}).accepted).toBe(true);
  bench.label='external'; state.source.forms!.find(f=>f.id===bench.id)!.label='external';
  expect(history.undo(state).accepted).toBe(false);
 });
 it('composes nested parents and rejects cycles before projection mutation', () => {
  const source=createRegion(); adoptRegionForms(source); const root=source.forms![0]; root.yaw=Math.PI/2;
  syncFormProjection(source); const bench=source.forms!.find(f=>f.kind==='bench')!, p=resolveFormTransform(source,bench.id);
  expect(p.position[0]).toBeCloseTo(root.position[0]+bench.position[2]);
  const before=structuredClone(source.home); root.parentId=bench.id; expect(()=>syncFormProjection(source)).toThrow(); expect(source.home).toEqual(before);
 });
 it('removes a subtree, retires identities, keeps stale private knowledge and restores same IDs', () => {
  const state=fixture(), history=new AuthoringHistory(), bench=state.source.forms!.find(f=>f.kind==='bench')!, known=structuredClone(state.residents);
  expect(history.apply(state,{kind:'remove',formId:bench.id}).accepted).toBe(true);
  expect(state.source.retiredIds).toContain('rest-inside'); expect(state.source.retiredIds).toContain('home-bench'); expect(state.residents).toEqual(known);
  expect(history.apply(state,{kind:'create',form:createFormSource('bench',bench.id,[25,0,25])}).accepted).toBe(false);
  expect(history.undo(state).accepted).toBe(true); expect(state.source.home.parts.some(p=>p.id==='home-bench')).toBe(true);
  expect(history.redo(state).accepted).toBe(true);
 });
 it.each(['bench','table','wall','platform','arch','rock'] as const)('creates finite usable %s kit',kind=>{
  const state=fixture(), history=new AuthoringHistory(), form=createFormSource(kind,`new-${kind}`,[30,2,30]);
  expect(form.parts.length).toBeGreaterThan(0); expect(history.apply(state,{kind:'create',form}).accepted).toBe(true);
 });
 it('retires an undone creation after it has been observed and redoes those same identities',()=>{
  const state=fixture(),history=new AuthoringHistory(),form=createFormSource('bench','created-bench',[30,2,30]);
  expect(history.apply(state,{kind:'create',form}).accepted).toBe(true);
  state.residents[0].position=[31,2.9,30];state.seconds=10;state.tick=600;observeResident(state,state.residents[0]);
  expect(state.residents[0].knownParts.some(p=>p.id==='created-bench:seat')).toBe(true);
  state.residents[0].position=[50,10,50];
  expect(history.undo(state).accepted).toBe(true);
  expect(state.source.retiredIds).toContain('created-bench:seat');
  expect(()=>decodeCheckpoint(encodeCheckpoint(state))).not.toThrow();
  expect(history.redo(state).accepted).toBe(true);
  expect(state.source.retiredIds).not.toContain('created-bench:seat');
  expect(state.residents[0].knownParts.some(p=>p.id==='created-bench:seat')).toBe(true);
  expect(()=>decodeCheckpoint(encodeCheckpoint(state))).not.toThrow();
 });
 it('accepts a small child gesture through a parent past the world-angle wrap',()=>{
  const state=fixture(),root=state.source.forms![0],bench=state.source.forms!.find(f=>f.kind==='bench')!;
  root.yaw=3*Math.PI/2;syncFormProjection(state.source);
  const local=worldToFormPose(state.source,bench.id,[1,root.position[1],-3.55],-7*Math.PI/12);
  expect(local.yaw).toBeCloseTo(-Math.PI/12);
  expect(new AuthoringHistory().apply(state,{kind:'transform',formId:bench.id,...local}).accepted).toBe(true);
 });
 it('moves the house own home use with its parts and child forms',()=>{
  const state=fixture(),root=state.source.forms![0],history=new AuthoringHistory();
  expect(history.apply(state,{kind:'transform',formId:root.id,position:[30,root.position[1],30]}).accepted).toBe(true);
  expect(state.source.places.find(p=>p.id==='home')!.position).toEqual([30,root.position[1],31]);
  expect(()=>decodeCheckpoint(encodeCheckpoint(state))).not.toThrow();
 });
});
