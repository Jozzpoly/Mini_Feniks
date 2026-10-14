import type { Resident, Vec3, WorldState } from '../world/types';

/** A control source changes intent; its body remains in the same native world. */
export function ensurePlayer(state: WorldState): Resident {
  const existing = state.residents.filter(r => r.control === 'player');
  if (existing.length > 1) throw new Error('Zapis zawiera więcej niż jedną postać gracza.');
  if (existing.length) return existing[0];
  if (state.residents.some(r => r.id === 'player:jozz') || state.things.some(t => t.id === 'player:jozz'))
    throw new Error('Tożsamość postaci gracza jest już zajęta.');
  const floor = state.source.home.position;
  const preferredRest = state.source.places.find(p => p.id === 'rest-outside') ?? state.source.places.find(p => p.kind === 'rest');
  if (!preferredRest) throw new Error('Brakuje miejsca pierwszego odpoczynku gracza.');
  const player: Resident = {
    id: 'player:jozz', name: 'Jozz', control: 'player',
    position: [floor[0] + 5.5, floor[1], floor[2] + 8], rotation: [0, 0, 0, 1],
    velocity: [0, 0, 0], angularVelocity: [0, 0, 0],
    fatigue: .15, hunger: .1, sociability: .35, curiosity: .3,
    preferredRest: preferredRest.id, known: [], knownParts: [], knownThings: [],
    knownResources: [], knownPeople: [], memories: [],
    intent: { goal: 'quiet', targetId: null, reason: 'Rozglądam się po krainie.', chosenAt: state.seconds },
    posture: 0, holding: null, blockedFor: 0, restUntil: 0, reconsiderAt: state.seconds,
  };
  state.residents.push(player);
  return player;
}

export function playerVelocity(input: Vec3, speed = 2.2): Vec3 {
  if (input.length !== 3 || input.some(n => !Number.isFinite(n))) return [0, 0, 0];
  const magnitude = Math.hypot(input[0], input[2]), scale = speed / Math.max(1, magnitude);
  return [input[0] * scale, 0, input[2] * scale];
}
