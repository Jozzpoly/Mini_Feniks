import { describe,it,expect } from 'vitest';
import { readStartingWorld } from '../src/world/startup';
import { createRegion } from '../src/world/source';
import { createWorld } from '../src/world/state';
import { encodeCheckpoint } from '../src/world/checkpoint';

describe('opening preserves the single lived history',()=>{
 it('opens the saved changed world rather than reinitializing it',()=>{
  const state=createWorld(createRegion());state.tick=120;state.seconds=2;state.residents[0].fatigue=.27;
  state.things[0].position=[1,130,1];state.residents[0].memories.push({time:2,kind:'placed',target:'thing:bag',detail:'Ta sama rzecz.'});
  const saved=encodeCheckpoint(state),storage={getItem:(key:string)=>key==='mini-feniks:checkpoint'?saved:null};
  expect(readStartingWorld(storage)).toEqual(state);
 });
 it('does not replace an unreadable old history with a fresh world',()=>{
  const saved='not a checkpoint';let writes=0;
  const storage={getItem:()=>saved,setItem:()=>writes++};
  expect(()=>readStartingWorld(storage)).toThrow();expect(writes).toBe(0);expect(storage.getItem()).toBe(saved);
 });
 it('creates a first world only when no previous history exists',()=>{
  const state=readStartingWorld({getItem:()=>null});expect(state.tick).toBe(0);expect(state.residents).toHaveLength(2);
 });
 it('refuses to regenerate saved geography using a different compiled seed',()=>{
  const state=createWorld(createRegion());state.source.seed++;
  expect(()=>readStartingWorld({getItem:()=>encodeCheckpoint(state)})).toThrow(/geograf/);
 });
});
