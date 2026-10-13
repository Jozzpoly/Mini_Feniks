import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/world/state';
import { encodeCheckpoint, decodeCheckpoint } from '../src/world/checkpoint';
import { revisePart } from '../src/world/revisions';
import { createRegion } from '../src/world/source';
import type { RegionSource } from '../src/world/types';

function source(): RegionSource {
  return { id: 'region:fixture', revision: 0, seed: 42, terrainVersion: 'fixture-1', extent: [6000, 4000],
    home: { id: 'home:fixture', position: [0, 4, 0], yaw: 0, parts: [
      { id: 'wall:idle', label: 'wall', role: 'wall', material: 'plaster', position: [5, 5.5, 0], size: [.3, 3, 8], yaw: 0, solid: true },
      { id: 'table:idle', label: 'table', role: 'table', material: 'timber', position: [-3, 5, 0], size: [2, .2, 1], yaw: 0, solid: true },
    ] },
    places: [
      { id: 'rest-inside', label: 'inside', kind: 'rest', position: [2, 4.5, 0] },
      { id: 'rest-outside', label: 'outside', kind: 'rest', position: [-2, 4.5, 9] },
      { id: 'food-home', label: 'food', kind: 'food', position: [-3, 5.4, 0] },
      { id: 'far-lookout', label: 'unknown ridge', kind: 'lookout', position: [900, 20, 700] },
    ], channels: [{ id: 'river:fixture', width: 3, points: [[50, 3, 0], [50, 2, 100]] }] };
}

describe('persistent world history', () => {
  it('establishes stable people, a physically adjacent held bag and finite food', () => {
    const input = source(), state = createWorld(input), second = createWorld(source());
    expect(state.residents.map(p => p.name)).toEqual(['Radom', 'Mira']);
    expect(state.residents.map(p => p.id)).toEqual(second.residents.map(p => p.id));
    expect(state.residents[0].position).toEqual([0, 4, 7]);
    expect(state.residents[1].position).toEqual([1.7, 4, 8]);
    const bag = state.things.find(t => t.kind === 'bag')!;
    expect(bag.heldBy).toBe(state.residents[0].id);
    expect(state.residents[0].holding).toBe(bag.id);
    expect(Math.hypot(...bag.position.map((v, i) => v - state.residents[0].position[i]))).toBeLessThan(1);
    expect(state.things.filter(t => t.kind === 'food')).toHaveLength(1);
    expect(state.residents.map(p => p.preferredRest)).toEqual(['rest-inside', 'rest-outside']);
    expect(state.residents.every(p => p.known.every(k => k.id !== 'far-lookout'))).toBe(true);
    expect(state.residents[0].fatigue).not.toBe(state.residents[1].fatigue);
    expect(state.residents[0].knownParts.map(p => p.id)).toEqual(input.home.parts.map(p => p.id));
    expect(state.residents[0].known[0].kind).toBe('rest');
    const meal = state.things.find(t => t.kind === 'food')!;
    expect(meal.position[0]).toBe(-3); expect(meal.position[1]).toBeCloseTo(5.16); expect(meal.position[2]).toBe(0);
    state.source.home.parts[0].position[0] = 99;
    expect(input.home.parts[0].position[0]).toBe(5);
  });

  it('places outside bodies above the actual bottom of the entry steps', () => {
    const input = source();
    input.home.parts.push({ id: 'entry-step', label: 'step', role: 'step', material: 'stone',
      position: [0, 3.3, 5], size: [2, .2, 1], yaw: 0, solid: true });
    expect(createWorld(input).residents[0].position[1]).toBeCloseTo(4.1);
  });

  it('round trips the actual authored region without losing declared nearby curiosity', () => {
    const state = createWorld(createRegion());
    expect(decodeCheckpoint(encodeCheckpoint(state))).toEqual(state);
    expect(state.residents.every(p => p.known.some(k => k.id === 'lookout-near'))).toBe(true);
    expect(state.residents.every(p => p.known.every(k => k.id !== 'lookout-ridge'))).toBe(true);
    const food = state.things.find(t => t.kind === 'food')!;
    expect(food.position[1] - food.size[1] / 2).toBeGreaterThanOrEqual(state.source.home.position[1]);
  });

  it('round trips completed time, dropped things, transforms, private memories and revisions', () => {
    const state = createWorld(source()), person = state.residents[0], bag = state.things[0];
    state.tick = 144; state.seconds = 2.4;
    person.holding = null; bag.heldBy = null; bag.position = [-2, 5.3, 1];
    bag.rotation = [.1, .2, .3, Math.sqrt(.86)]; bag.velocity = [1, 0, -.5];
    person.memories.push({ time: 2, kind: 'placed', target: bag.id, detail: 'My place.' });
    expect(revisePart(state, 'wall:idle', { size: [.4, 3, 8] }).accepted).toBe(true);
    const text = encodeCheckpoint(state), restored = decodeCheckpoint(text);
    expect(restored).toEqual(state);
    restored.residents[0].memories[0].detail = 'Changed';
    expect(state.residents[0].memories[0].detail).toBe('My place.');
  });

  it.each([
    ['schema', (s: any) => { s.schema = 2; }],
    ['nonfinite vector', (s: any) => { s.residents[0].position[0] = null; }],
    ['vector length', (s: any) => { s.things[0].velocity = [0, 0]; }],
    ['duplicate identity', (s: any) => { s.things[0].id = s.residents[0].id; }],
    ['world linkage', (s: any) => { s.worldId = 'world:other'; }],
    ['held linkage', (s: any) => { s.residents[0].holding = null; }],
    ['unknown held person', (s: any) => { s.things[0].heldBy = 'nobody'; }],
    ['native handle', (s: any) => { s.things[0].body = 42; }],
    ['unknown familiarity', (s: any) => { s.residents[0].known[0].id = 'unknown'; }],
    ['nonfinite private part', (s: any) => { s.residents[0].knownParts[0].yaw = null; }],
    ['malformed private place kind', (s: any) => { s.residents[0].known[0].kind = 'wall'; }],
    ['malformed private thing', (s: any) => { s.residents[0].knownThings[0].available = 'yes'; }],
    ['negative completed time', (s: any) => { s.seconds = -1; }],
    ['invalid rotation', (s: any) => { s.things[0].rotation = [0, 0, 0, 0]; }],
    ['bad revision history', (s: any) => { s.source.revision = -1; }],
  ])('rejects malformed checkpoint: %s without changing live state', (_name, mutate) => {
    const state = createWorld(source()), before = JSON.stringify(state), bad = JSON.parse(before);
    mutate(bad);
    expect(() => decodeCheckpoint(JSON.stringify(bad))).toThrow();
    expect(JSON.stringify(state)).toBe(before);
  });

  it('rejects nonfinite data before JSON encoding can silently replace it', () => {
    const state = createWorld(source()); state.things[0].position[0] = Infinity;
    expect(() => encodeCheckpoint(state)).toThrow();
  });

  it('accepts semantically identical checkpoints with reordered object properties', () => {
    const state = createWorld(source());
    revisePart(state, 'wall:idle', { yaw: .1 });
    const encoded = JSON.parse(encodeCheckpoint(state));
    const reversed = (part: object) => Object.fromEntries(Object.entries(part).reverse());
    encoded.source.home.parts = encoded.source.home.parts.map(reversed);
    expect(decodeCheckpoint(JSON.stringify(encoded))).toEqual(state);
  });

  it('revises only an idle part while preserving every living instance and private memory', () => {
    const state = createWorld(source());
    state.things.find(t => t.kind === 'food')!.position = [-8, 4, 0];
    const before = structuredClone(state);
    expect(revisePart(state, 'table:idle', { yaw: .35, size: [2.2, .2, 1] }).accepted).toBe(true);
    expect(state.source.revision).toBe(1);
    expect(state.source.home.parts[1].id).toBe('table:idle');
    expect(state.residents).toEqual(before.residents); expect(state.things).toEqual(before.things);
    expect(state.source.home.parts[0]).toEqual(before.source.home.parts[0]);
    expect(state.seconds).toBe(before.seconds);
    expect(state.revisions[0].before).toEqual(before.source.home.parts[1]);
    expect(state.revisions[0].after).toEqual(state.source.home.parts[1]);
  });

  it.each([
    ['standing resident', (s: ReturnType<typeof createWorld>) => ({ position: [...s.residents[0].position] as [number, number, number] })],
    ['held bag', (s: ReturnType<typeof createWorld>) => ({ position: [...s.things[0].position] as [number, number, number], size: [.2, .2, .2] as [number, number, number] })],
    ['zero size', () => ({ size: [0, 2, 3] as [number, number, number] })],
    ['negative size', () => ({ size: [-1, 2, 3] as [number, number, number] })],
    ['nonfinite position', () => ({ position: [NaN, 0, 0] as [number, number, number] })],
    ['unbounded yaw', () => ({ yaw: Infinity })],
    ['excessive size', () => ({ size: [100000, 1, 1] as [number, number, number] })],
  ])('rejects revision conflict: %s atomically', (_name, changes) => {
    const state = createWorld(source()), before = structuredClone(state);
    expect(revisePart(state, 'wall:idle', changes(state)).accepted).toBe(false);
    expect(state).toEqual(before);
  });

  it('checks the yaw-rotated current volume before moving an occupied part away', () => {
    const state = createWorld(source()), part = state.source.home.parts[0];
    part.position = [0, 4.9, 3]; part.size = [8, 1, .3]; part.yaw = Math.PI / 2;
    const before = structuredClone(state);
    expect(revisePart(state, part.id, { position: [20, 5, 20] }).accepted).toBe(false);
    expect(state).toEqual(before);
  });

  it('rejects a supporting table and a part reserved by an active rest target', () => {
    const state = createWorld(source()), person = state.residents[1], table = state.source.home.parts[1];
    person.position = [-3, 6, 0];
    expect(revisePart(state, table.id, { size: [2.2, .2, 1] }).accepted).toBe(false);
    person.position = [1.7, 4.9, 8];
    person.intent = { goal: 'rest', targetId: 'rest-inside', chosenAt: 0, reason: 'tired' };
    state.source.places[0].position = [-3, 5.4, 0];
    expect(revisePart(state, table.id, { position: [-4, 5, 0] }).accepted).toBe(false);
  });
});
