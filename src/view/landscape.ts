import * as THREE from 'three';
import { drainageAt, ecologyAt, hash, heightAt, noise } from '../world/geography';
import type { RegionSource } from '../world/types';

const earth = new THREE.Color('#728250'), meadow = new THREE.Color('#92945a'), woods = new THREE.Color('#526343'), heath = new THREE.Color('#858361'), rock = new THREE.Color('#8a8a79'), bank = new THREE.Color('#77785b');
interface TerrainCell { x: number; z: number; size: number }
export function createTerrain(source: RegionSource): THREE.Mesh {
  const halfX = source.extent[0] / 2, halfZ = source.extent[1] / 2, cells: TerrainCell[] = [];
  const subdivide = (x: number, z: number, size: number) => {
    const cx = x + size / 2, cz = z + size / 2, d = drainageAt(cx, cz);
    const nearHome = Math.abs(cx) < 55 + size / 2 && Math.abs(cz) < 55 + size / 2;
    const minimum = d.width <= 7 && d.distance < 12 ? 1.5625 : 3.125;
    if (size > minimum && (d.distance < size * .74 + d.width * .75 + 8 || nearHome)) {
      const h = size / 2; subdivide(x, z, h); subdivide(x + h, z, h); subdivide(x, z + h, h); subdivide(x + h, z + h, h);
    } else cells.push({ x, z, size });
  };
  for (let z = -halfZ; z < halfZ; z += 50) for (let x = -halfX; x < halfX; x += 50) subdivide(x, z, 50);
  // Shared perimeter samples stitch fine river cells to their coarser neighbours without cracks.
  const horizontal = new Map<number, Set<number>>(), vertical = new Map<number, Set<number>>();
  const add = (map: Map<number, Set<number>>, line: number, point: number) => { if (!map.has(line)) map.set(line, new Set()); map.get(line)!.add(point); };
  for (const { x, z, size: s } of cells) for (const px of [x, x + s]) for (const pz of [z, z + s]) { add(horizontal, pz, px); add(vertical, px, pz); }
  const horizontalLines = new Map([...horizontal].map(([line, points]) => [line, [...points].sort((a, b) => a - b)]));
  const verticalLines = new Map([...vertical].map(([line, points]) => [line, [...points].sort((a, b) => a - b)]));
  const vertices: number[] = [], colors: number[] = [], indices: number[] = [], vertexIds = new Map<string, number>();
  const sample = (x: number, z: number) => {
    const key = `${x},${z}`, previous = vertexIds.get(key); if (previous !== undefined) return previous;
    const y = heightAt(x, z), e = ecologyAt(x, z), d = drainageAt(x, z);
    const c = (e.habitat === 'woodland' ? woods : e.habitat === 'heath' ? heath : e.habitat === 'rock' ? rock : e.habitat === 'riverbank' ? bank : meadow).clone();
    c.lerp(earth, noise(x, z, 47, 51) * .35); c.multiplyScalar(.88 + noise(x, z, 22, 52) * .22);
    if (e.path > .15) c.lerp(new THREE.Color('#b6a383'), e.path * .7);
    if (d.distance < d.width * .5) c.multiplyScalar(.65);
    const id = vertices.length / 3; vertices.push(x, y, z); colors.push(c.r, c.g, c.b); vertexIds.set(key, id); return id;
  };
  for (const { x, z, size: s } of cells) {
    const perimeter: number[] = [];
    for (const p of verticalLines.get(x)!) if (p >= z && p < z + s) perimeter.push(sample(x, p));
    for (const p of horizontalLines.get(z + s)!) if (p >= x && p < x + s) perimeter.push(sample(p, z + s));
    for (const p of [...verticalLines.get(x + s)!].reverse()) if (p <= z + s && p > z) perimeter.push(sample(x + s, p));
    for (const p of [...horizontalLines.get(z)!].reverse()) if (p <= x + s && p > x) perimeter.push(sample(p, z));
    const centre = sample(x + s / 2, z + s / 2);
    for (let i = 0; i < perimeter.length; i++) indices.push(centre, perimeter[i], perimeter[(i + 1) % perimeter.length]);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); g.setIndex(indices); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })); mesh.receiveShadow = true; mesh.userData = { kind: 'ground', id: 'ground' }; return mesh;
}
export function createWater(source: RegionSource): THREE.Group {
  const group = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: '#638b86', roughness: .26, metalness: .12, transparent: true, opacity: .86, side: THREE.DoubleSide });
  for (const channel of source.channels) {
    const v: number[] = [], indices: number[] = [];
    channel.points.forEach((p, i) => {
      const a = channel.points[Math.max(0, i - 1)], b = channel.points[Math.min(channel.points.length - 1, i + 1)], len = Math.hypot(b[0] - a[0], b[2] - a[2]), dx = -(b[2] - a[2]) / len * channel.width / 2, dz = (b[0] - a[0]) / len * channel.width / 2;
      v.push(p[0] + dx, p[1] + .02, p[2] + dz, p[0] - dx, p[1] + .02, p[2] - dz);
      if (i) { const n = i * 2; indices.push(n - 2, n, n - 1, n - 1, n, n + 1); }
    });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setIndex(indices); g.computeVertexNormals(); group.add(new THREE.Mesh(g, mat));
  }
  return group;
}
interface Tree { x: number; z: number; height: number; type: number; hue: number }
export function createVegetation(source: RegionSource): { group: THREE.Group; detail: THREE.Group; update(camera: THREE.Camera): void } {
  const group = new THREE.Group(), detail = new THREE.Group(), broad: Tree[] = [], firs: Tree[] = [];
  const halfX = source.extent[0] / 2, halfZ = source.extent[1] / 2;
  // Fixed world-coordinate sampling, ecological acceptance, coherent patches, bounded instances.
  for (let gx = -Math.ceil(halfX / 38); gx <= Math.ceil(halfX / 38); gx++) for (let gz = -Math.ceil(halfZ / 38); gz <= Math.ceil(halfZ / 38); gz++) {
    const x = gx * 38 + hash(gx, gz, 61) * 32, z = gz * 38 + hash(gx, gz, 62) * 32;
    if (Math.abs(x) > halfX || Math.abs(z) > halfZ || Math.hypot(x, z) < 260) continue;
    const e = ecologyAt(x, z), d = drainageAt(x, z);
    if (hash(gx, gz, 63) > e.density || d.distance < d.width + 5) continue;
    const t = { x, z, height: 11 + hash(gx, gz, 65) * 14, type: e.habitat === 'heath' || heightAt(x, z) > 210 ? 1 : 0, hue: hash(gx, gz, 66) };
    (t.type ? firs : broad).push(t);
  }
  for (let gx = -17; gx <= 17; gx++) for (let gz = -17; gz <= 17; gz++) {
    const x = gx * 16 + hash(gx, gz, 67) * 12, z = gz * 16 + hash(gx, gz, 68) * 12;
    if (Math.hypot(x, z) > 275 || Math.hypot(x, z) < 20) continue;
    if (hash(gx, gz, 69) > ecologyAt(x, z).density || drainageAt(x, z).distance < 14) continue;
    broad.push({ x, z, height: 7 + hash(gx, gz, 70) * 9, type: 0, hue: hash(gx, gz, 71) });
  }
  // Deliberately placed shade trees preserve the home's open approach.
  broad.push({ x: -12, z: 8, height: 6.5, type: 0, hue: .7 }, { x: 16, z: -13, height: 10, type: 0, hue: .5 }, { x: -20, z: -9, height: 11, type: 0, hue: .3 });
  const dummy = new THREE.Object3D();
  for (const [trees, conifer] of [[broad, false], [firs, true]] as const) {
    const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.11, .17, 1, 5), new THREE.MeshStandardMaterial({ color: '#665342', roughness: 1 }), trees.length);
    const crown = new THREE.InstancedMesh(conifer ? new THREE.ConeGeometry(1, 1, 6) : new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ roughness: 1 }), trees.length);
    trees.forEach((t, i) => {
      const y = heightAt(t.x, t.z), h = t.height;
      dummy.position.set(t.x, y + h * .3, t.z); dummy.rotation.set(0, t.hue * Math.PI, .03 * (t.hue - .5)); dummy.scale.set(h * .14, h * .6, h * .14); dummy.updateMatrix(); trunk.setMatrixAt(i, dummy.matrix);
      dummy.position.y = y + h * (conifer ? .62 : .72); dummy.scale.set(h * (conifer ? .24 : .32), h * (conifer ? .9 : .36), h * (conifer ? .24 : .3)); dummy.updateMatrix(); crown.setMatrixAt(i, dummy.matrix);
      crown.setColorAt(i, new THREE.Color().setHSL(conifer ? .29 : .22 + t.hue * .07, .19 + t.hue * .15, .19 + t.hue * .11));
    });
    trunk.receiveShadow = true; crown.receiveShadow = true; group.add(trunk, crown);
  }
  const bushData: [number, number, number][] = [], rocks: [number, number, number][] = [];
  for (let i = 0; i < 1500; i++) {
    const x = (hash(i, 0, 80) - .5) * 800, z = (hash(i, 0, 81) - .5) * 800, e = ecologyAt(x, z);
    if (Math.hypot(x, z) < 9 || (Math.abs(x) < 2 && z > 0 && z < 12) || e.path > .3 || drainageAt(x, z).distance < 10) continue;
    (i % 6 ? bushData : rocks).push([x, z, .25 + hash(i, 0, 82) * .75]);
  }
  for (const [data, isRock] of [[bushData, false], [rocks, true]] as const) {
    const m = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, isRock ? 0 : 1), new THREE.MeshStandardMaterial({ color: isRock ? '#939485' : '#607148', roughness: 1 }), data.length);
    data.forEach(([x, z, s], i) => { dummy.position.set(x, heightAt(x, z) + s * .23, z); dummy.rotation.set(.2, i * .4, .1); dummy.scale.set(s, s * .48, s * .75); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); }); detail.add(m);
  }
  group.add(detail);
  return { group, detail, update(camera) { detail.visible = camera.position.distanceTo(new THREE.Vector3(0, heightAt(0, 0), 0)) < 1600; } };
}
