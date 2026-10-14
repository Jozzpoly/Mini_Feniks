import { describe, expect, it } from 'vitest';
import { createSession } from '../src/session';
import { createWorld } from '../src/world/state';
import { createRegion } from '../src/world/source';
import { heightAt } from '../src/world/geography';
import { ensurePlayer } from '../src/actors/player';
import { establishResourceSites } from '../src/world/resources';
import { chooseIntent, observeResident } from '../src/life';

describe('life after the opening meal', () => {
  it('lets a hungry resident acquire finite food through its own witnesses and real body', async () => {
    const state=createWorld(createRegion()),mira=state.residents[1];
    state.things.find(t=>t.kind==='food')!.consumed=true;
    mira.hunger=.85;mira.fatigue=.15;mira.curiosity=.1;
    const s=await createSession(state,heightAt);
    try {
      const initial=s.state.resources!.reduce((n,r)=>n+r.units,0);
      for(let i=0;i<600;i++)s.advance(.1);
      expect(mira.memories.some(m=>m.kind==='gathered')).toBe(true);
      expect(mira.memories.some(m=>m.kind==='ate'&&m.target!=='thing:food')).toBe(true);
      expect(mira.hunger).toBeLessThan(.65);
      expect(s.state.resources!.reduce((n,r)=>n+r.units,0)).toBeLessThan(initial);
      expect(mira.knownResources?.length).toBeGreaterThan(0);
      expect(s.state.things.filter(t=>t.foodFlavor).every(t=>t.consumed||s.physics.bodies.has(t.id))).toBe(true);
      await s.load(s.save());
      expect(s.state.resources!.reduce((n,r)=>n+r.units,0)).toBeLessThan(initial);
      expect(s.state.things.find(t=>t.id==='thing:food')!.consumed).toBe(true);
    } finally {s.dispose();}
  },30000);

  it('does not learn a remote stock change until it witnesses that place again', () => {
    const state=createWorld(createRegion());establishResourceSites(state);
    const r=state.residents[1],site=state.source.resourceSites![0];
    r.position=[site.position[0]+1,site.position[1],site.position[2]+1];r.hunger=.8;r.fatigue=.1;r.curiosity=.1;
    state.things.filter(t=>t.kind==='food').forEach(t=>t.consumed=true);r.knownThings=[];observeResident(state,r);
    expect(r.knownResources?.find(k=>k.id===site.id)?.available).toBe(true);
    const witness=structuredClone(r.knownResources!.find(k=>k.id===site.id));
    r.position=[100,site.position[1],100];state.resources!.find(s=>s.id===site.id)!.units=0;state.seconds+=10;
    observeResident(state,r);
    expect(r.knownResources!.find(k=>k.id===site.id)).toEqual(witness);
    expect(chooseIntent(state,r).goal).toBe('gather');
    r.position=[site.position[0]+1,site.position[1],site.position[2]+1];observeResident(state,r);
    expect(r.knownResources!.find(k=>k.id===site.id)!.available).toBe(false);
    expect(chooseIntent(state,r).targetId).not.toBe(site.id);
  });

  it('makes a player portion a solver body and preserves its debit, grip and needs through load', async () => {
    const state=createWorld(createRegion());establishResourceSites(state);const p=ensurePlayer(state),site=state.source.resourceSites![0];
    p.position=[site.position[0]+.7,site.position[1],site.position[2]+.7];p.hunger=.75;
    const s=await createSession(state,heightAt);
    try {
      expect(s.act({kind:'gather',targetId:site.id}).accepted).toBe(true);
      const held=s.player.holding!,remaining=s.state.resources![0].units;
      expect(s.physics.bodies.has(held)).toBe(true);
      for(let i=0;i<10;i++)s.advance(.1);
      expect(s.player.holding).toBe(held);
      expect(s.player.hunger).toBeGreaterThan(.75);
      await s.load(s.save());
      expect(s.player.holding).toBe(held);expect(s.physics.bodies.has(held)).toBe(true);
      expect(s.state.resources![0].units).toBe(remaining);
      expect(s.act({kind:'eat',targetId:held}).accepted).toBe(true);
      expect(s.physics.bodies.has(held)).toBe(false);
      expect(s.player.hunger).toBeLessThan(.6);
      expect(s.act({kind:'eat',targetId:held}).accepted).toBe(false);
    }finally{s.dispose();}
  },20000);

  it('continues for twenty world minutes without refilling food or receiving operator jobs', async () => {
    const s=await createSession(createWorld(createRegion()),heightAt);
    try{
      const initial=s.state.resources!.reduce((n,r)=>n+r.units,0),moments:number[]=[],rested=new Set<string>();
      for(let i=0;i<12000;i++){
        s.advance(.1);
        for(const r of s.state.residents)if(r.memories.some(m=>m.kind==='rested'))rested.add(r.id);
        if(i===2999||i===5999||i===8999)moments.push(s.state.resources!.reduce((n,r)=>n+r.units,0));
      }
      const residents=s.state.residents.filter(r=>r.control!=='player');
      console.info(JSON.stringify({worldMinutes:s.state.seconds/60,remaining:s.state.resources!.reduce((n,r)=>n+r.units,0),stockAt5_10_15:moments,inhabitants:residents.map(r=>({name:r.name,hunger:r.hunger,fatigue:r.fatigue,goal:r.intent.goal,position:r.position,posture:r.posture,recentRest:r.memories.filter(m=>m.kind==='rested'),memoryCount:r.memories.length,foraged:r.memories.filter(m=>m.kind==='gathered').length}))}));
      expect(s.state.seconds).toBeCloseTo(1200,5);expect(s.physics.metrics.steps).toBe(72000);
      expect(residents.every(r=>r.memories.some(m=>m.kind==='ate'&&m.target!=='thing:food'))).toBe(true);
      expect(residents.every(r=>r.hunger<.95)).toBe(true);
      expect(residents.every(r=>rested.has(r.id))).toBe(true);
      const remaining=s.state.resources!.reduce((n,r)=>n+r.units,0);
      expect(remaining).toBeLessThan(initial);expect(remaining).toBeLessThan(moments.at(-1)!);
      const portions=s.state.things.filter(t=>t.foodFlavor);
      expect(portions).toHaveLength(initial-remaining);
      expect(new Set(portions.map(p=>p.id)).size).toBe(portions.length);
      expect(s.state.things.find(t=>t.id==='thing:bag')!.consumed).toBe(false);
      const snapshot=s.save();await s.load(snapshot);
      expect(s.save()).toBe(snapshot);
    }finally{s.dispose();}
  },60000);
});
