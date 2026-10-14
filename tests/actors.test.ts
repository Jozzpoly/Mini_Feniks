import { describe, expect, it } from 'vitest';
import { createSession } from '../src/session';
import { createWorld } from '../src/world/state';
import { createRegion } from '../src/world/source';
import { heightAt } from '../src/world/geography';
import {decodeCheckpoint} from '../src/world/checkpoint';

describe('one embodied participant in the inhabited realm', () => {
  it('establishes one player beside independent residents and preserves that actor on load', async () => {
    const session = await createSession(createWorld(createRegion()), heightAt);
    try {
      const players = session.state.residents.filter(r => r.control === 'player');
      expect(players).toHaveLength(1);
      expect(session.state.residents.filter(r => r.control !== 'player').map(r => r.name)).toEqual(['Radom', 'Mira']);
      const player = players[0];
      const saved = session.save();
      await session.load(saved);
      expect(session.state.residents.filter(r => r.control === 'player').map(r => r.id)).toEqual([player.id]);
    } finally { session.dispose(); }
  },20000);

  it('keeps player motion through multiple NPC decisions and stops its input under pause', async () => {
    const session = await createSession(createWorld(createRegion()), heightAt);
    try {
      const player = session.state.residents.find(r => r.control === 'player');
      expect(player).toBeDefined();
      const start = [...player!.position];
      session.setPlayerInput([1, 0, 0]);
      for (let i = 0; i < 30; i++) session.advance(.1);
      expect(player!.position[0] - start[0]).toBeGreaterThan(2);
      expect(Math.abs(player!.position[2] - start[2])).toBeLessThan(.15);
      session.paused = true;
      const paused = session.save();
      session.advance(5);
      expect(session.save()).toBe(paused);
      session.setPlayerInput([0, 0, 0]);
    } finally { session.dispose(); }
  });
  it('keeps the saved player posture when reopening the history, until new input changes it',async()=>{
    const first=await createSession(createWorld(createRegion()),heightAt);
    let saved;
    try{first.setPlayerPosture(1);for(let i=0;i<20;i++)first.advance(.1);expect(first.player.posture).toBeGreaterThan(.95);saved=decodeCheckpoint(first.save());}
    finally{first.dispose();}
    const reopened=await createSession(saved,heightAt);
    try{
      for(let i=0;i<20;i++)reopened.advance(.1);
      expect(reopened.player.posture).toBeGreaterThan(.95);
      reopened.setPlayerPosture(0);for(let i=0;i<20;i++)reopened.advance(.1);
      expect(reopened.player.posture).toBeLessThan(.05);
    }finally{reopened.dispose();}
  },20000);
});
