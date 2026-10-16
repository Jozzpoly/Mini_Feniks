import {it,expect} from 'vitest';
import {readLivingWorld,STORAGE_KEY} from '../src/world/startup';
import {createWorld} from '../src/world/state';
import {createRegion} from '../src/world/source';
import {encodeCheckpoint} from '../src/world/checkpoint';
it('opens a distinct R&D slot without reading or rewriting the prior owner checkpoint',()=>{
 const old='an important old checkpoint';const values=new Map([['mini-feniks:checkpoint',old]]),read:string[]=[];
 const state=readLivingWorld({getItem:key=>{read.push(key);return values.get(key)??null;}});
 expect(read).toEqual([STORAGE_KEY]);expect(values.get('mini-feniks:checkpoint')).toBe(old);expect(state.seconds).toBe(0);
 const saved=createWorld(createRegion());saved.seconds=5;saved.tick=300;values.set(STORAGE_KEY,encodeCheckpoint(saved));
 expect(readLivingWorld({getItem:key=>values.get(key)??null}).seconds).toBe(5);
});
it('has material objects away from the house and independently useful known storage locations',()=>{
 const state=createWorld(createRegion());
 expect(state.things.filter(t=>t.kind==='material').length).toBeGreaterThanOrEqual(3);
 expect(state.source.places.filter(p=>p.kind==='put').length).toBeGreaterThan(1);
 expect(state.source.forms?.some(f=>f.parentId===null&&Math.hypot(f.position[0],f.position[2])>60)).toBe(true);
});
