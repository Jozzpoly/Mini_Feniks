import { describe, expect, it } from 'vitest';
import { createSession } from '../src/session';
import { createWorld } from '../src/world/state';
import { createRegion } from '../src/world/source';
import { heightAt } from '../src/world/geography';
import { decodeCheckpoint, encodeCheckpoint } from '../src/world/checkpoint';
import { ensurePlayer } from '../src/actors/player';
import { establishResourceSites } from '../src/world/resources';

describe('authored source and lived material continuity', () => {
  it('saves local form source once and reconstructs projections on read', () => {
    const state = createWorld(createRegion());
    expect(state.source.forms?.some(f => f.kind === 'bench')).toBe(true);
    const saved = JSON.parse(encodeCheckpoint(state));
    expect(saved.schema).toBe(2);
    expect(saved.source.home.parts).toBeUndefined();
    expect(saved.source.places).toBeUndefined();
    expect(decodeCheckpoint(JSON.stringify(saved))).toEqual(state);
  });

  it('moves a complete bench and its physical parts without teaching the residents remotely', async () => {
    const session = await createSession(createWorld(createRegion()), heightAt);
    try {
      const beforeKnowledge = JSON.stringify(session.state.residents.map(r => r.known));
      const bench = session.state.source.forms!.find(f => f.kind === 'bench')!;
      const result = session.author({ kind: 'transform', formId: bench.id, position: [-18, 0, 8] });
      expect(result.accepted).toBe(true);
      expect(session.state.source.places.find(p => p.id === 'rest-inside')!.position[0]).toBeCloseTo(-17.35);
      for (const part of session.state.source.home.parts.filter(p => bench.parts.some(b => b.id === p.id))) {
        expect(session.physics.bodies.has(part.id)).toBe(true);
        expect(part.position[0]).toBeCloseTo(-18);
      }
      expect(JSON.stringify(session.state.residents.map(r => r.known))).toBe(beforeKnowledge);
      const saved = session.save();
      await session.load(saved);
      expect(session.save()).toBe(saved);
    } finally { session.dispose(); }
  },20000);

  it('keeps old memories loadable after removing an idle known form', async () => {
    const session = await createSession(createWorld(createRegion()), heightAt);
    try {
      const bench = session.state.source.forms!.find(f => f.kind === 'bench')!;
      const knowledge = JSON.stringify(session.state.residents[0].knownParts);
      expect(session.author({kind:'remove',formId:bench.id}).accepted).toBe(true);
      expect(session.state.source.retiredIds).toContain('home-bench');
      expect(session.state.source.home.parts.some(p => p.id === 'home-bench')).toBe(false);
      expect(session.physics.bodies.has('home-bench')).toBe(false);
      const saved = session.save(); await session.load(saved);
      expect(JSON.stringify(session.state.residents[0].knownParts)).toBe(knowledge);
    } finally { session.dispose(); }
  });

  it('moves and removes the same resource form without author undo refilling its lived harvest', async()=>{
    const state=createWorld(createRegion());establishResourceSites(state);const player=ensurePlayer(state),site=state.source.resourceSites![0];
    player.position=[site.position[0]+.7,site.position[1],site.position[2]+.7];
    const session=await createSession(state,heightAt);
    try{
      expect(session.act({kind:'gather',targetId:site.id}).accepted).toBe(true);
      const portion=session.player.holding!,plant=session.state.source.forms!.find(f=>f.uses.some(u=>u.id===site.id))!;
      expect(session.act({kind:'eat',targetId:portion}).accepted).toBe(true);
      const remaining=session.state.resources!.find(s=>s.id===site.id)!.units,original=structuredClone(plant);
      expect(session.author({kind:'transform',formId:plant.id,position:[-40,plant.position[1],40]}).accepted).toBe(true);
      expect(session.state.source.resourceSites!.find(s=>s.id===site.id)!.position[0]).toBeCloseTo(-39.35);
      expect(session.undoAuthor().accepted).toBe(true);
      expect(session.state.source.forms!.find(f=>f.id===plant.id)).toEqual(original);
      expect(session.author({kind:'remove',formId:plant.id}).accepted).toBe(true);
      expect(session.state.source.resourceSites!.some(s=>s.id===site.id)).toBe(false);
      expect(session.undoAuthor().accepted).toBe(true);
      expect(session.state.resources!.find(s=>s.id===site.id)!.units).toBe(remaining);
      expect(session.state.things.find(t=>t.id===portion)!.consumed).toBe(true);
      const snapshot=session.save();await session.load(snapshot);expect(session.save()).toBe(snapshot);
    }finally{session.dispose();}
  },20000);
});
