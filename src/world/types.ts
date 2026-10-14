/** Right-handed physics/render coordinates in metres: X east, Y up, Z south. */
export type Vec3 = [number, number, number];
export type Quat = [number, number, number, number];
export type Material = 'stone' | 'plaster' | 'timber' | 'thatch' | 'earth' | 'water' | 'cloth' | 'leaves';
export interface PartSource {
  id: string; label: string; position: Vec3; size: Vec3; yaw: number; material: Material;
  role: 'wall' | 'floor' | 'roof' | 'step' | 'table' | 'bench' | 'beam';
  solid: boolean;
}
export interface Place { id: string; label: string; position: Vec3; kind: 'rest' | 'food' | 'lookout' | 'home' | 'put' | 'gather'; }
/** Authored parts and uses are LOCAL to their form. Flat runtime arrays are projections. */
export interface FormSource {
  id: string; label: string; kind: 'house' | 'bench' | 'table' | 'wall' | 'platform' | 'arch' | 'rock' | 'custom';
  parentId: string | null; position: Vec3; yaw: number; parts: PartSource[]; uses: Place[];
}
export interface ResourceSite { id: string; label: string; position: Vec3; capacity: number; kind: 'berries' | 'apple'; }
export interface ResourceStock { id: string; units: number; }
export interface Channel { id: string; points: Vec3[]; width: number; }
export interface RegionSource {
  id: string; revision: number; seed: number; terrainVersion: string; extent: [number, number];
  home: { id: string; position: Vec3; yaw: number; parts: PartSource[] };
  places: Place[]; channels: Channel[];
  forms?: FormSource[]; freePlaces?: Place[]; retiredIds?: string[]; resourceSites?: ResourceSite[];
}
export interface Thing {
  foodFlavor?: 'bread' | 'berries' | 'apple';
  id: string; label: string; kind: 'bag' | 'food' | 'stool'; size: Vec3; mass: number;
  position: Vec3; rotation: Quat; velocity: Vec3; angularVelocity: Vec3;
  heldBy: string | null; consumed: boolean;
}
export interface KnownPlace { id: string; kind: Place['kind']; position: Vec3; seenAt: number; occupiedBy: string | null; available?: boolean; }
export interface KnownPart { id: string; position: Vec3; size: Vec3; yaw: number; role: PartSource['role']; seenAt: number; present?: boolean; }
export interface KnownThing { id: string; kind: Thing['kind']; position: Vec3; seenAt: number; available: boolean; }
export interface KnownResource { id: string; position: Vec3; seenAt: number; available: boolean; }
export interface KnownPerson { id: string; position: Vec3; seenAt: number; }
export interface Memory { time: number; kind: 'saw' | 'arrived' | 'blocked' | 'rested' | 'ate' | 'placed' | 'picked' | 'gathered' | 'met'; target: string; detail: string; }
export type Goal = 'carry-home' | 'rest' | 'eat' | 'wander' | 'quiet' | 'gather' | 'meet';
export interface Intent { goal: Goal; targetId: string | null; reason: string; chosenAt: number; }
export interface Resident {
  control?: 'player' | 'resident'; knownResources?: KnownResource[]; knownPeople?: KnownPerson[];
  id: string; name: string; position: Vec3; rotation: Quat; velocity: Vec3; angularVelocity: Vec3;
  fatigue: number; hunger: number; sociability: number; curiosity: number;
  preferredRest: string; known: KnownPlace[]; knownParts: KnownPart[]; knownThings: KnownThing[]; memories: Memory[];
  intent: Intent; posture: number; holding: string | null; blockedFor: number;
  restUntil: number; reconsiderAt: number;
}
export interface WorldEvent { time: number; kind: string; actor: string | null; target: string; detail: string; }
export interface RevisionRecord { revision: number; time: number; partId: string; before: PartSource; after: PartSource; }
export interface WorldState {
  schema: 1 | 2; worldId: string; tick: number; seconds: number;
  source: RegionSource; residents: Resident[]; things: Thing[];
  events: WorldEvent[]; revisions: RevisionRecord[];
  resources?: ResourceStock[];
}
export interface RevisionResult { accepted: boolean; reason: string; partId: string; }
export interface Drive { velocity: Vec3; posture: number; }
