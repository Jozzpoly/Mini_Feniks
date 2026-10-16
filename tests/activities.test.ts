import {describe,it,expect} from 'vitest';
import {createWorld} from '../src/world/state';
import {createRegion} from '../src/world/source';
import {establishResourceSites} from '../src/world/resources';
import {requestAction, advanceActivities} from '../src/actors/activities';
import {encodeCheckpoint,decodeCheckpoint} from '../src/world/checkpoint';

describe('work unfolds in the same material world',()=>{
 it('does not create or debit a portion before the gathering finishes',()=>{
  const w=createWorld(createRegion());establishResourceSites(w);const a=w.residents[1],site=w.source.resourceSites![0];
  a.position=[site.position[0],site.position[1],site.position[2]+.4];const stock=w.resources![0].units;
  expect(requestAction(w,a.id,{kind:'gather',targetId:site.id}).accepted).toBe(true);
  expect(a.holding).toBeNull();expect(w.resources![0].units).toBe(stock);
  w.seconds+=.5;advanceActivities(w,.5);expect(a.holding).toBeNull();
  const copy=decodeCheckpoint(encodeCheckpoint(w));
  copy.seconds+=3;advanceActivities(copy,3);
  expect(copy.residents[1].holding).not.toBeNull();expect(copy.resources![0].units).toBe(stock-1);
 });
 it('interrupts work after moving away without manufacturing a resource',()=>{
  const w=createWorld(createRegion());establishResourceSites(w);const a=w.residents[1],site=w.source.resourceSites![0];
  a.position=[...site.position];const stock=w.resources![0].units;
  requestAction(w,a.id,{kind:'gather',targetId:site.id});a.position[0]+=5;
  w.seconds+=4;advanceActivities(w,4);
  expect(a.activity).toBeUndefined();expect(a.holding).toBeNull();expect(w.resources![0].units).toBe(stock);
 });
 it('revalidates competing use instead of consuming another actor\'s held portion',()=>{
  const w=createWorld(createRegion()),a=w.residents[1],food=w.things[1];a.position=[...food.position];a.hunger=.8;
  requestAction(w,a.id,{kind:'eat',targetId:food.id});
  w.residents[0].holding=food.id;w.things[0].heldBy=null;food.heldBy=w.residents[0].id;
  w.seconds+=4;advanceActivities(w,4);
  expect(food.consumed).toBe(false);expect(a.hunger).toBe(.8);
 });
});
