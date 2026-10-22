import { expect, it } from 'vitest';
import { createWorld } from '../src/world/state';
import { createRegion } from '../src/world/source';
import { heightAt } from '../src/world/geography';
import { createSession } from '../src/session';
import { decodeCheckpoint } from '../src/world/checkpoint';
import { ensurePlayer } from '../src/actors/player';
import { executeAction } from '../src/actors/actions';
import { observeResident } from '../src/life';
import { concernIntent } from '../src/life/concerns';
import type { Vec3, WorldState } from '../src/world/types';

const dist2 = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[2] - b[2]);

/**
 * Source-world experiment, not a user playtest. Mira builds a physical reserve
 * through the ordinary native physics. The matched fork places a player at one
 * reachable portion by a DIAGNOSTIC FIXTURE, then B uses the game's real pickup
 * action. Mira is moved far away and back to isolate private witnesses; that
 * relocation also is a fixture, not demonstrated walking/navigation.
 *
 * Distinguishes physical state, private belief, and concern-driven next options.
 */
it('return to a changed reserve: lawful player removal changes the future only after a witness', async () => {
  const world = createWorld(createRegion());
  world.source.extent = [200, 200];
  const mira = world.residents.find(r => r.name === 'Mira')!;
  mira.hunger = .15;
  mira.fatigue = .1;
  mira.position = [1.7, heightAt(1.7, 8) + .9, 8];
  const session = await createSession(world, heightAt);
  let checkpoint: string;
  try {
    let completed = false;
    for (let i = 0; i < 3600; i++) {
      session.advance(.1);
      if (session.state.residents.find(r => r.id === mira.id)?.concern?.satisfied) {
        completed = true;
        break;
      }
    }
    expect(completed, 'ordinary resident failed to establish its reserve').toBe(true);
    checkpoint = session.save();
  } finally { session.dispose(); }

  const origin = decodeCheckpoint(checkpoint!);
  const residentId = mira.id;
  const resident = origin.residents.find(r => r.id === residentId)!;
  const reserve = resident.known.find(p => p.id === resident.concern!.placeId)!;
  const portions = origin.things.filter(t => t.kind === 'food' && !t.consumed && t.heldBy === null && dist2(t.position, reserve.position) < 2.1);
  expect(portions.length).toBeGreaterThanOrEqual(resident.concern!.desiredUnits);
  const selected = portions.find(t => t.id !== 'thing:food') ?? portions[0];
  expect(resident.knownThings.find(t => t.id === selected.id)?.available).toBe(true);

  // Find a lawful reach using the ordinary game action, but only to prepare a
  // matched diagnostic pose; it does NOT establish a walkable player path.
  let legalPose: Vec3 | undefined;
  const offsets: Array<[number, number]> = [
    [0, .7], [0, -.7], [.7, 0], [-.7, 0],
    [.45, .55], [-.45, .55], [.45, -.55], [-.45, -.55],
    [0, 1.2], [0, -1.2], [1.2, 0], [-1.2, 0],
  ];
  for (const [x, z] of offsets) {
    const candidate = structuredClone(origin);
    const player = ensurePlayer(candidate);
    player.position = [selected.position[0] + x, selected.position[1], selected.position[2] + z];
    if (executeAction(candidate, player.id, { kind: 'pickup', targetId: selected.id }).accepted) {
      legalPose = [...player.position];
      break;
    }
  }
  expect(legalPose, 'no lawful reach from the test poses; diagnose geometry rather than force pickup').toBeDefined();

  const fork = (take: boolean) => {
    const w: WorldState = decodeCheckpoint(checkpoint!);
    const r = w.residents.find(p => p.id === residentId)!;
    const player = ensurePlayer(w);
    player.position = [...legalPose!];
    // Deliberately isolate off-screen knowledge from navigation.
    r.position = [55, heightAt(55, 55) + .9, 55];
    r.velocity = [0, 0, 0];
    if (take) {
      const action = executeAction(w, player.id, { kind: 'pickup', targetId: selected.id });
      expect(action.accepted, action.reason).toBe(true);
    }
    const actual = w.things.find(t => t.id === selected.id)!;
    const privateBefore = structuredClone(r.knownThings.find(t => t.id === selected.id));
    const distantConcern = concernIntent(w, r);
    observeResident(w, r);
    expect(r.knownThings.find(t => t.id === selected.id)).toEqual(privateBefore);
    // A matched witness at the former store location. Not a movement claim.
    r.position = [selected.position[0] + .2, selected.position[1], selected.position[2] + .2];
    observeResident(w, r);
    const after = r.knownThings.find(t => t.id === selected.id);
    const next = concernIntent(w, r);
    return { actualAvailable: !actual.consumed && actual.heldBy === null,
      privateBefore: privateBefore?.available, privateAfter: after?.available,
      satisfied: r.concern?.satisfied, next: next?.goal ?? null,
      distant: distantConcern?.goal ?? null,
      sawChange: r.memories.some(m => m.kind === 'saw' && m.target === selected.id && m.time > resident.concern!.startedAt),
    };
  };

  const A = fork(false), B = fork(true);
  expect(A.actualAvailable).toBe(true);
  expect(B.actualAvailable).toBe(false);
  expect(A.privateBefore).toBe(true);
  expect(B.privateBefore).toBe(true); // remote information did not teleport
  expect(A.privateAfter).toBe(true);
  expect(B.privateAfter).toBe(false);
  expect(A.satisfied).toBe(true);
  expect(B.satisfied).toBe(false);
  console.info('OWNER_RETURN_AB', JSON.stringify({ reserve: reserve.id, portion: selected.id, A, B,
    caveat: 'controlled player and witness placement; real walking and subjective play remain untested' }));
}, 30_000);
