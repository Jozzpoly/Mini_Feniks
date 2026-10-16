import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/world/state';
import { createRegion } from '../src/world/source';
import { executeAction } from '../src/actors/actions';
import { establishResourceSites } from '../src/world/resources';
import { encodeCheckpoint, decodeCheckpoint } from '../src/world/checkpoint';

describe('shared material attempts', () => {
  it('lets a busy recipient keep its own state rather than forcing a social benefit',()=>{
    const state=createWorld(createRegion()),a=state.residents[0],other=state.residents[1];
    a.position=[10,130,10];other.position=[11,130,10];other.sociability=.8;
    other.activity={kind:'gather',targetId:'busy',startedAt:0,elapsed:0,duration:2,origin:[...other.position]};
    expect(executeAction(state,a.id,{kind:'greet',targetId:other.id}).accepted).toBe(true);
    expect(other.sociability).toBe(.8);expect(other.activity).toBeDefined();
  });
  it('rejects remote pickup, then lets one actor acquire the same released bag', () => {
    const state=createWorld(createRegion()),a=state.residents[1],bag=state.things[0];
    state.residents[0].holding=null;bag.heldBy=null;
    a.position=[50,a.position[1],50];const before=JSON.stringify(state);
    expect(executeAction(state,a.id,{kind:'pickup',targetId:bag.id}).accepted).toBe(false);
    expect(JSON.stringify(state)).toBe(before);
    a.position=[bag.position[0]-.3,bag.position[1],bag.position[2]];
    expect(executeAction(state,a.id,{kind:'pickup',targetId:bag.id}).accepted).toBe(true);
    expect(a.holding).toBe(bag.id);expect(bag.heldBy).toBe(a.id);
    expect(executeAction(state,state.residents[0].id,{kind:'pickup',targetId:bag.id}).accepted).toBe(false);
  });
  it('consumes a finite portion once and rejects the next attempt', () => {
    const state=createWorld(createRegion()),a=state.residents[1],food=state.things.find(t=>t.kind==='food')!;
    a.position=[food.position[0],food.position[1]+.5,food.position[2]+.5];a.hunger=.8;
    expect(executeAction(state,a.id,{kind:'eat',targetId:food.id}).accepted).toBe(true);
    const hunger=a.hunger;
    expect(food.consumed).toBe(true);
    expect(executeAction(state,a.id,{kind:'eat',targetId:food.id}).accepted).toBe(false);
    expect(a.hunger).toBe(hunger);
    expect(state.events.filter(e=>e.kind==='ate')).toHaveLength(1);
  });
  it('gathers a real held portion while debiting and preserving finite local stock', () => {
    const state=createWorld(createRegion());establishResourceSites(state);
    const site=state.source.resourceSites![0],stock=state.resources![0],a=state.residents[1];
    a.position=[site.position[0],site.position[1],site.position[2]+.6];
    const initial=stock.units;
    expect(executeAction(state,a.id,{kind:'gather',targetId:site.id}).accepted).toBe(true);
    expect(stock.units).toBe(initial-1);expect(a.holding).not.toBeNull();
    const food=state.things.find(t=>t.id===a.holding)!;
    expect(food.kind).toBe('food');expect(food.heldBy).toBe(a.id);
    expect(executeAction(state,a.id,{kind:'eat',targetId:food.id}).accepted).toBe(true);
    const restored=decodeCheckpoint(encodeCheckpoint(state));
    establishResourceSites(restored);
    expect(restored.resources![0].units).toBe(initial-1);
    expect(restored.things.find(t=>t.id===food.id)!.consumed).toBe(true);
  });
  it('rejects a hand reach through a solid wall and an unknown action without an effect',()=>{
    const state=createWorld(createRegion()),r=state.residents[1],food=state.things.find(t=>t.kind==='food')!;
    r.position=[15,130,15];food.position=[16,130,15];
    state.source.home.parts.push({id:'reach-wall',label:'Przeszkoda',position:[15.5,130.3,15],size:[.2,2,2],yaw:0,material:'stone',role:'wall',solid:true});
    const before=JSON.stringify(state);
    expect(executeAction(state,r.id,{kind:'eat',targetId:food.id}).accepted).toBe(false);
    expect(executeAction(state,r.id,{kind:'invented',targetId:food.id} as never).accepted).toBe(false);
    expect(JSON.stringify(state)).toBe(before);
  });
});
