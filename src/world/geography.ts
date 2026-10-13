import type { Channel, Vec3 } from './types';

export const REGION_SEED = 130626;
export const TERRAIN_VERSION = 'jaworowa-drainage-1';
/** Hand-authored watershed. Branches end at exactly the main channel's confluences.
 * Y is water elevation; the northern and southern ends continue beyond prepared land. */
const DRAINAGE: Channel[] = [
  { id: 'river-alder', width: 16, points: [[-900, 164, -2000], [-550, 138, -1500], [-130, 108, -1000], [320, 79, -520], [165, 62, -120], [270, 50, 300], [-170, 39, 760], [-650, 28, 1200], [-420, 20, 1600], [-850, 12, 2000]] },
  { id: 'brook-west', width: 5, points: [[-2600, 265, -1300], [-2000, 220, -1000], [-1420, 169, -700], [-790, 123, -520], [-230, 98, -450], [165, 62, -120]] },
  { id: 'brook-east', width: 7, points: [[2600, 238, -1600], [1900, 181, -900], [1500, 125, -400], [930, 77, 60], [270, 50, 300]] },
  { id: 'brook-southwest', width: 4, points: [[-2750, 205, 500], [-2180, 151, 650], [-1570, 93, 930], [-650, 28, 1200]] },
];
export function createChannels(): Channel[] { return DRAINAGE.map(c => ({ ...c, points: c.points.map(p => [...p] as Vec3) })); }
export function hash(x: number, z: number, salt = 0): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(z | 0, 668265263) ^ REGION_SEED ^ salt;
  h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967295;
}
const smooth = (a: number) => a * a * (3 - 2 * a);
export function noise(x: number, z: number, scale: number, salt = 0): number {
  const px = x / scale, pz = z / scale, ix = Math.floor(px), iz = Math.floor(pz), tx = smooth(px - ix), tz = smooth(pz - iz);
  const a = hash(ix, iz, salt), b = hash(ix + 1, iz, salt), c = hash(ix, iz + 1, salt), d = hash(ix + 1, iz + 1, salt);
  return (a + (b - a) * tx) * (1 - tz) + (c + (d - c) * tx) * tz;
}
export function drainageAt(x: number, z: number): { distance: number; water: number; width: number; channel: string } {
  let result = { distance: Infinity, water: 0, width: 0, channel: '' };
  for (const channel of DRAINAGE) for (let i = 1; i < channel.points.length; i++) {
    const a = channel.points[i - 1], b = channel.points[i], dx = b[0] - a[0], dz = b[2] - a[2];
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[2]) * dz) / (dx * dx + dz * dz)));
    const distance = Math.hypot(x - a[0] - dx * t, z - a[2] - dz * t);
    if (distance < result.distance) result = { distance, water: a[1] + (b[1] - a[1]) * t, width: channel.width, channel: channel.id };
  }
  return result;
}
function naturalHeightAt(x: number, z: number): number {
  const d = drainageAt(x, z), beyond = Math.max(0, d.distance - d.width * .5);
  // Incised stream bed, gradual floodplain, steep wooded valley sides, broad uneven ridges.
  const bank = 1.8 * (1 - Math.exp(-beyond / 3.5));
  const valley = 140 * (1 - Math.exp(-Math.pow(beyond / 440, 1.5)));
  const ridge = 75 * noise(x, z, 1100, 11) + 45 * noise(x, z, 450, 12);
  const detail = (noise(x, z, 75, 13) - .5) * 12 + (noise(x, z, 18, 14) - .5) * 2;
  const reliefWeight = smooth(Math.min(1, beyond / 120));
  return d.water - 1.25 + bank + valley + (ridge + detail) * reliefWeight;
}
const TERRACE_GRADE = naturalHeightAt(0, 0);
export function heightAt(x: number, z: number): number {
  // Explicit authored house terrace; its boundary blends into the existing hillside.
  const distance = Math.max(Math.abs(x) / 12, Math.abs(z - 1) / 13);
  const blend = smooth(Math.max(0, Math.min(1, distance - 1)));
  return TERRACE_GRADE * (1 - blend) + naturalHeightAt(x, z) * blend;
}
export type Habitat = 'riverbank' | 'meadow' | 'woodland' | 'heath' | 'rock';
export function ecologyAt(x: number, z: number): { habitat: Habitat; density: number; moisture: number; path: number } {
  const d = drainageAt(x, z), y = heightAt(x, z), patch = noise(x, z, 280, 17);
  const path = Math.exp(-Math.pow((x + 9 + 13 * Math.sin(z / 72)) / 2.2, 2)) * (Math.abs(z) < 240 ? 1 : 0);
  const clearing = Math.exp(-(x * x / 2300 + z * z / 4600));
  const moisture = Math.exp(-d.distance / 140);
  let habitat: Habitat = d.distance < d.width + 12 ? 'riverbank' : y > 275 ? 'rock' : y > 220 || patch < .19 ? 'heath' : patch > .47 && clearing < .32 ? 'woodland' : 'meadow';
  const density = habitat === 'woodland' ? .74 : habitat === 'riverbank' ? .32 : habitat === 'heath' ? .13 : .04;
  return { habitat, density: density * (1 - clearing) * (1 - path), moisture, path };
}
