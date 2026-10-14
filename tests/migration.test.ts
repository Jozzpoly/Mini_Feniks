import { expect, it } from 'vitest';
import { createWorld } from '../src/world/state';
import { createRegion } from '../src/world/source';
import { readStartingWorld } from '../src/world/startup';
import { TERRAIN_VERSION, heightAt, legacyHeightAt } from '../src/world/geography';

it('upgrades first-campaign geography and source without replaying consumed things or private history', () => {
  const legacy=structuredClone(createWorld(createRegion())) as any;
  legacy.schema=1;legacy.source.terrainVersion='jaworowa-drainage-1';
  delete legacy.source.forms;delete legacy.source.freePlaces;delete legacy.source.retiredIds;
  legacy.tick=10800;legacy.seconds=180;legacy.things.find((t:any)=>t.kind==='food').consumed=true;
  const r=legacy.residents[1];r.position=[-85,legacyHeightAt(-85,81)+.9,81];
  r.memories.push({time:120,kind:'saw',target:'lookout-near',detail:'Moje wcześniejsze świadectwo.'});
  const remembered=JSON.stringify(r.known),memories=JSON.stringify(r.memories),encoded=JSON.stringify(legacy);
  const restored=readStartingWorld({getItem:()=>encoded});
  expect(restored.schema).toBe(2);expect(restored.source.terrainVersion).toBe(TERRAIN_VERSION);
  expect(restored.seconds).toBe(180);expect(restored.tick).toBe(10800);expect(restored.worldId).toBe(legacy.worldId);
  expect(restored.things.find(t=>t.kind==='food')!.consumed).toBe(true);
  expect(JSON.stringify(restored.residents[1].known)).toBe(remembered);
  expect(JSON.stringify(restored.residents[1].memories)).toBe(memories);
  expect(restored.residents[1].position[1]).toBeCloseTo(heightAt(-85,81)+.9);
  expect(restored.source.forms!.some(f=>f.kind==='bench')).toBe(true);
});
