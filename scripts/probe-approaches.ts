import { createPhysics } from '../src/physics';
import { heightAt, legacyHeightAt } from '../src/world/geography';
import { createRegion } from '../src/world/source';
import { createWorld } from '../src/world/state';
import type { Vec3 } from '../src/world/types';

// Diagnostic, not a passing gameplay test. Isolate native locomotion and terrain:
// no props, other people, brain, author edits, checkpoint writes or teleport during a trial.
const trials = [
  { name: 'current-lookout', ground: heightAt, start: [-9, 8], target: [-16, 24] },
  { name: 'legacy-lookout', ground: legacyHeightAt, start: [-9, 8], target: [-16, 24] },
  { name: 'current-west', ground: heightAt, start: [-10, 8], target: [-40, 8] },
  { name: 'current-north', ground: heightAt, start: [0, -10], target: [0, -40] },
] as const;
for (const { name, ground, start, target } of trials) {
  const state = createWorld(createRegion());
  state.residents = state.residents.slice(0, 1); state.things = [];
  state.source.home.parts = []; // Deliberately isolated physics fixture, never saved as a game world.
  const actor = state.residents[0]; actor.holding = null;
  actor.position = [start[0], ground(...start) + .9, start[1]];
  const physics = await createPhysics(state, ground);
  try {
    const seconds = 90, step = 1 / 60;
    for (let tick = 0; tick < seconds * 60; tick++) {
      const dx = target[0] - actor.position[0], dz = target[1] - actor.position[2];
      const distance = Math.hypot(dx, dz);
      const velocity: Vec3 = distance < .3 ? [0, 0, 0] : [dx / distance * 1.2, 0, dz / distance * 1.2];
      physics.step(step, new Map([[actor.id, { velocity, posture: 0 }]]), state);
    }
    const remaining = Math.hypot(target[0] - actor.position[0], target[1] - actor.position[2]);
    process.stdout.write(JSON.stringify({ name, seconds, start, target, position: actor.position, remaining, withinArrival: remaining <= .6 }) + '\n');
  } finally { physics.dispose(); }
}
