import type { RegionSource } from './types';

interface TerrainCell { x: number; z: number; width: number; depth: number }
type Surface={vertices:Float32Array;indices:Uint32Array};
const surfaces=new WeakMap<RegionSource,{signature:string;ground:(x:number,z:number)=>number;surface:Surface}>();
/** Display and collision share an immutable compilation, not independently sampled terrain. */
export function sharedTerrainSurface(source:RegionSource,ground:(x:number,z:number)=>number):Surface {
  const signature=JSON.stringify([source.extent,source.channels,source.terrainVersion]);
  const cached=surfaces.get(source);
  if(cached&&cached.signature===signature&&cached.ground===ground)return cached.surface;
  const surface=createTerrainSurface(source,ground);surfaces.set(source,{signature,ground,surface});return surface;
}
/** One dependency-free triangulation for display and native collision. Coarse
 * uplands, finer inhabited ground and stream beds, with shared stitched edges. */
export function createTerrainSurface(source: RegionSource, ground: (x: number, z: number) => number): { vertices: Float32Array; indices: Uint32Array } {
  const halfX = source.extent[0] / 2, halfZ = source.extent[1] / 2, cells: TerrainCell[] = [];
  if (!(halfX > 0 && halfZ > 0 && Number.isFinite(halfX) && Number.isFinite(halfZ))) throw new Error('Terrain extent must be finite and positive');
  if(Math.ceil(halfX*2/50)*Math.ceil(halfZ*2/50)>200_000)throw new Error('Zasięg przekracza obecny budżet siatki terenu. Historia pozostała zachowana.');
  const channelAt = (x: number, z: number) => {
    let distance = Infinity, width = 0;
    for (const channel of source.channels) for (let i = 1; i < channel.points.length; i++) {
      const a = channel.points[i - 1], b = channel.points[i], dx = b[0] - a[0], dz = b[2] - a[2], length2 = dx * dx + dz * dz;
      const t = length2 ? Math.max(0, Math.min(1, ((x-a[0])*dx + (z-a[2])*dz)/length2)) : 0;
      const d = Math.hypot(x-a[0]-dx*t, z-a[2]-dz*t);
      if (d < distance) { distance = d; width = channel.width; }
    }
    return { distance, width };
  };
  const subdivide = (x: number, z: number, width: number, depth: number) => {
    const cx = x + width / 2, cz = z + depth / 2, d = channelAt(cx, cz);
    const radius = Math.hypot(width, depth) / 2;
    const nearHome = Math.abs(cx) < 55 + width / 2 && Math.abs(cz) < 55 + depth / 2;
    const minimum = d.width <= 7 && d.distance < 12 ? 1.5625 : 3.125;
    if (Math.max(width, depth) > minimum && (d.distance < radius + d.width * .75 + 8 || nearHome)) {
      const w = width / 2, h = depth / 2;
      subdivide(x, z, w, h); subdivide(x+w, z, w, h); subdivide(x, z+h, w, h); subdivide(x+w, z+h, w, h);
    } else {if(cells.length>=200_000)throw new Error('Zbyt wiele szczegółów terenu dla obecnego wykonawcy.');cells.push({ x, z, width, depth });}
  };
  for (let z = -halfZ; z < halfZ; z += 50) for (let x = -halfX; x < halfX; x += 50) subdivide(x, z, Math.min(50, halfX-x), Math.min(50, halfZ-z));
  const horizontal = new Map<number, Set<number>>(), vertical = new Map<number, Set<number>>();
  const add = (map: Map<number, Set<number>>, line: number, point: number) => { if (!map.has(line)) map.set(line, new Set()); map.get(line)!.add(point); };
  for (const { x, z, width, depth } of cells) for (const px of [x, x+width]) for (const pz of [z, z+depth]) { add(horizontal, pz, px); add(vertical, px, pz); }
  const hLines = new Map([...horizontal].map(([line, points]) => [line, [...points].sort((a,b) => a-b)]));
  const vLines = new Map([...vertical].map(([line, points]) => [line, [...points].sort((a,b) => a-b)]));
  // Binary range lookup keeps remote samples on the same line out of each face's work.
  const range = (points: number[], lo: number, hi: number) => {
    const lower = (value: number) => { let a=0, b=points.length; while(a<b) { const m=(a+b)>>>1; if(points[m]<value) a=m+1; else b=m; } return a; };
    return points.slice(lower(lo), lower(hi));
  };
  const vertices: number[] = [], indices: number[] = [], ids = new Map<string, number>();
  const sample = (x: number, z: number) => {
    const key = `${x},${z}`, previous = ids.get(key); if (previous !== undefined) return previous;
    const id = vertices.length / 3,elevation=ground(x,z);if(!Number.isFinite(elevation)||Math.abs(elevation)>1e7)throw new Error('Nieprawidłowa wysokość terenu.');vertices.push(x, elevation, z); ids.set(key,id); return id;
  };
  for (const { x, z, width: w, depth: h } of cells) {
    const perimeter: number[] = [];
    for (const p of range(vLines.get(x)!, z, z+h)) perimeter.push(sample(x,p));
    for (const p of range(hLines.get(z+h)!, x, x+w)) perimeter.push(sample(p,z+h));
    // Reverse sides include their leading corner and omit their trailing corner.
    const right = range(vLines.get(x+w)!, z, z+h).filter(p => p > z); right.push(z+h);
    for (const p of right.reverse()) perimeter.push(sample(x+w,p));
    const bottom = range(hLines.get(z)!, x, x+w).filter(p => p > x); bottom.push(x+w);
    for (const p of bottom.reverse()) perimeter.push(sample(p,z));
    const centre = sample(x+w/2,z+h/2);
    for (let i=0;i<perimeter.length;i++) indices.push(centre,perimeter[i],perimeter[(i+1)%perimeter.length]);
  }
  return { vertices: new Float32Array(vertices), indices: new Uint32Array(indices) };
}
