import type { PartSource, RevisionResult, Vec3, WorldState } from './types';

interface Bounds { min: Vec3; max: Vec3; }
const vector = (v: unknown): v is Vec3 => Array.isArray(v) && v.length === 3 && v.every(n => typeof n === 'number' && Number.isFinite(n));

/** Conservative world AABB of the actual yaw-rotated source geometry. */
function bounds(part: Pick<PartSource, 'position' | 'size' | 'yaw'>): Bounds {
  const c = Math.abs(Math.cos(part.yaw)), s = Math.abs(Math.sin(part.yaw));
  const half: Vec3 = [(c * part.size[0] + s * part.size[2]) / 2, part.size[1] / 2,
    (s * part.size[0] + c * part.size[2]) / 2];
  return { min: part.position.map((p, i) => p - half[i]) as Vec3,
    max: part.position.map((p, i) => p + half[i]) as Vec3 };
}
function overlaps(a: Bounds, b: Bounds): boolean {
  return a.min.every((min, i) => min <= b.max[i] + .04 && a.max[i] + .04 >= b.min[i]);
}

/** Called at a completed-step boundary; rejection leaves every record untouched. */
export function revisePart(state: WorldState, partId: string,
  changes: Partial<Pick<PartSource, 'position' | 'size' | 'yaw'>>): RevisionResult {
  const reject = (reason: string): RevisionResult => ({ accepted: false, reason, partId });
  const index = state.source.home.parts.findIndex(part => part.id === partId);
  if (index < 0) return reject('Nie ma części o tym ID.');
  if (!changes || Object.keys(changes).some(key => !['position', 'size', 'yaw'].includes(key)))
    return reject('Poprawka może zmienić tylko położenie, rozmiar lub obrót.');
  const before = state.source.home.parts[index];
  const candidate = { ...before, ...changes };
  if (!vector(candidate.position) || candidate.position.some(v => Math.abs(v) > 1e7) ||
    !vector(candidate.size) || candidate.size.some(v => v < .02 || v > 200) ||
    typeof candidate.yaw !== 'number' || !Number.isFinite(candidate.yaw) || Math.abs(candidate.yaw) > Math.PI * 2)
    return reject('Nieprawidłowe lub zbyt rozległe wymiary części.');
  const current = bounds(before), proposed = bounds(candidate);
  for (const person of state.residents) {
    // Reserve standing clearance even while the resident is folded into a rest posture.
    const body = bounds({ position: person.position, size: [.9, 1.9, .9], yaw: 0 });
    if (overlaps(current, body) || overlaps(proposed, body))
      return reject(`Zajęta przestrzeń lub podparcie: ${person.name}.`);
    const target = state.source.places.find(place => place.id === person.intent.targetId);
    if (person.intent.goal === 'rest' && target && overlaps(current,
      bounds({ position: target.position, size: [1.2, 1, 1.2], yaw: 0 })))
      return reject(`Część jest używana przez odpoczynek: ${person.name}.`);
  }
  for (const thing of state.things) {
    if (thing.consumed) continue;
    // A sphere around an arbitrary quaternion box is conservative for held and placed things.
    const diameter = Math.hypot(...thing.size);
    const occupied = bounds({ position: thing.position, size: [diameter, diameter, diameter], yaw: 0 });
    if (overlaps(current, occupied) || overlaps(proposed, occupied))
      return reject(`Zajęta przestrzeń lub podparcie rzeczy: ${thing.label}.`);
  }
  const after = structuredClone(candidate);
  const revision = state.source.revision + 1;
  state.source.home.parts[index] = after;
  state.source.revision = revision;
  state.revisions.push({ revision, time: state.seconds, partId, before: structuredClone(before), after: structuredClone(after) });
  return { accepted: true, reason: 'Przyjęto miejscową poprawkę.', partId };
}
