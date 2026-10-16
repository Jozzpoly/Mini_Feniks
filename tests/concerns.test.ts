import {describe,it,expect} from 'vitest';
import {createWorld} from '../src/world/state';
import {createRegion} from '../src/world/source';
import {chooseIntent,observeResident,stepLife} from '../src/life';
import {establishResourceSites} from '../src/world/resources';

describe('a resident keeps a material concern rather than a fixed action sequence',()=>{
 it('keeps its chosen cache when someone temporarily stands there and prefers a cheaper local source',()=>{
  const w=createWorld(createRegion());establishResourceSites(w);w.seconds=10;
  const r=w.residents[1],put=r.known.find(p=>p.kind==='put')!;
  r.fatigue=.1;r.hunger=.1;r.concern={kind:'provision',placeId:put.id,desiredUnits:2,startedAt:0,reason:'Mój zapas.',satisfied:false};
  put.occupiedBy=w.residents[0].id;
  r.known.push({id:'other-cache',kind:'put',position:[40,130,40],seenAt:10,occupiedBy:null,available:true});
  r.knownThings=[{id:w.things[1].id,kind:'food',position:[40,130,40],seenAt:10,available:true}];
  r.knownResources=[{id:w.source.resourceSites![0].id,position:[r.position[0]+2,r.position[1],r.position[2]],available:true,seenAt:10}];
  expect(chooseIntent(w,r).goal).toBe('gather');expect(r.concern.placeId).toBe(put.id);
 });
 it.each(['Radom','Mira'])('lets %s save a held portion rather than always eating it',name=>{
  const w=createWorld(createRegion());establishResourceSites(w);w.seconds=10;
  const r=w.residents.find(r=>r.name===name)!,food=w.things[1],put=r.known.find(k=>k.kind==='put')!;
  w.residents.forEach(a=>a.holding=null);w.things.forEach(t=>t.heldBy=null);
  r.holding=food.id;food.heldBy=r.id;r.hunger=.2;r.fatigue=.2;
  r.concern={kind:'provision',placeId:put.id,desiredUnits:3,startedAt:0,reason:'Chcę mieć zapas na później.',satisfied:false};
  expect(chooseIntent(w,r).goal).toBe('store');
  r.fatigue=.7;expect(chooseIntent(w,r).goal).toBe('store');
  r.hunger=.9;expect(chooseIntent(w,r).goal).toBe('eat');
 });
 it('pursues a known loose portion at a different place instead of requiring a food-service marker',()=>{
  const w=createWorld(createRegion()),r=w.residents[1],food=w.things[1];w.seconds=10;
  r.hunger=.9;r.fatigue=.1;food.position=[14,r.position[1],10];r.position=[13,r.position[1],10];
  r.known=r.known.filter(k=>k.kind!=='food');observeResident(w,r);
  expect(chooseIntent(w,r).targetId).toBe(food.id);
 });
 it('recognizes that a material obstacle was moved only after seeing it',()=>{
  const w=createWorld(createRegion()),r=w.residents[1];
  const t={...w.things[0],id:'movable-barrier',kind:'material' as const,heldBy:null,position:[12,r.position[1],9] as [number,number,number],size:[.5,1,2] as [number,number,number]};
  w.things.push(t);r.position=[10,r.position[1],9];observeResident(w,r);
  const known=r.knownThings.find(k=>k.id===t.id)!;expect(known.size).toEqual(t.size);
  r.position=[100,r.position[1],100];t.position=[20,t.position[1],9];w.seconds=5;observeResident(w,r);
  expect(known.position[0]).toBe(12);
  r.position=[12,r.position[1],9];observeResident(w,r);expect(known.position[0]).toBe(20);
 });
});

it('routes the body around a witnessed low block, keeps stale knowledge, then notices the moved opening',()=>{
 const w=createWorld(createRegion()),r=w.residents[1];w.residents=[r];w.seconds=10;
 w.source.home.parts=[];w.source.places=[{id:'target',label:'skraj',kind:'lookout',position:[30,130,36]}];
 r.position=[30,130.9,30];r.velocity=[0,0,0];r.holding=null;r.hunger=.1;r.fatigue=.1;r.knownParts=[];r.knownThings=[];
 r.known=[{id:'target',kind:'lookout',position:[30,130,36],seenAt:10,available:true,occupiedBy:null}];
 r.intent={goal:'wander',targetId:'target',reason:'Idę do znanego miejsca.',chosenAt:10};
 const block={...w.things[0],id:'barrier',heldBy:null,kind:'material' as const,size:[2,1,1] as [number,number,number],position:[30,130.5,33] as [number,number,number]};w.things=[block];
 expect(Math.abs(stepLife(w,.25).get(r.id)!.velocity[0])).toBeGreaterThan(.2);
 r.position=[100,130.9,100];block.position=[40,130.5,33];w.seconds++;observeResident(w,r);
 expect(r.knownThings.find(t=>t.id===block.id)!.position[0]).toBe(30);
 r.position=[30,130.9,30];w.seconds++;
 expect(stepLife(w,.25).get(r.id)!.velocity).toEqual([0,0,1.2]);
});

it('treats a witnessed object held by another actor as physical, while forgetting its local absence',()=>{
 const w=createWorld(createRegion()),r=w.residents[1],other=w.residents[0];w.seconds=10;w.source.home.parts=[];
 w.source.places=[{id:'target',label:'skraj',kind:'lookout',position:[30,130,36]}];
 r.position=[30,130.9,30];r.velocity=[0,0,0];r.holding=null;r.hunger=.1;r.fatigue=.1;r.knownParts=[];r.knownThings=[];
 r.known=[{id:'target',kind:'lookout',position:[30,130,36],seenAt:10,available:true,occupiedBy:null}];
 r.intent={goal:'wander',targetId:'target',reason:'Idę.',chosenAt:10};
 const block={...w.things[0],id:'barrier',heldBy:other.id,kind:'material' as const,size:[2,3,1] as [number,number,number],position:[30,131.5,33] as [number,number,number]};
 other.holding=block.id;other.position=[32,130.9,33];w.things=[block];
 expect(Math.abs(stepLife(w,.25).get(r.id)!.velocity[0])).toBeGreaterThan(.2);
 block.position=[100,131.5,100];w.seconds++;
 expect(stepLife(w,.25).get(r.id)!.velocity).toEqual([0,0,1.2]);
});
it('keeps a provisioning concern but backs off a locally blocked cache',()=>{
 const w=createWorld(createRegion()),r=w.residents[1],food=w.things[1],put=r.known.find(p=>p.kind==='put')!;w.seconds=10;
 r.hunger=.1;r.fatigue=.1;r.holding=food.id;food.heldBy=r.id;
 r.concern={kind:'provision',placeId:put.id,desiredUnits:2,startedAt:0,reason:'Na później.',satisfied:false};
 r.memories.push({kind:'blocked',target:put.id,time:10,detail:'Przejście zamknięte.'});
 expect(chooseIntent(w,r).goal).toBe('quiet');expect(r.concern.placeId).toBe(put.id);
 w.seconds+=19;expect(chooseIntent(w,r).goal).toBe('store');
});
