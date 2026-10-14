import { describe, expect, it } from 'vitest';
import { heightAt, legacyHeightAt } from '../src/world/geography';
import { createTerrainSurface } from '../src/world/terrain-surface';
import { createTerrain } from '../src/view/landscape';
import { createRegion } from '../src/world/source';

describe('continuous shared terrain', () => {
  it('removes the witnessed divide jump while retaining the old migration witness', () => {
    const x = -26.4470043033;
    expect(Math.abs(heightAt(x - .001, 0) - heightAt(x + .001, 0))).toBeLessThan(.01);
    expect(Math.abs(legacyHeightAt(x - .001, 0) - legacyHeightAt(x + .001, 0))).toBeGreaterThan(7);
    expect(heightAt(0, 0)).toBe(legacyHeightAt(0, 0));
    expect(heightAt(0, 5.4)).toBe(heightAt(0, 0));
  });
  it('has no sampled millimetre jumps across the realm or terrace blend', () => {
    for (let x = -2900; x <= 2900; x += 137) for (let z = -1900; z <= 1900; z += 113) {
      expect(Math.abs(heightAt(x-.001,z) - heightAt(x+.001,z))).toBeLessThan(.01);
      expect(Math.abs(heightAt(x,z-.001) - heightAt(x,z+.001))).toBeLessThan(.01);
    }
    for (const x of [12,24,-12,-24]) expect(Math.abs(heightAt(x-.001,0) - heightAt(x+.001,0))).toBeLessThan(.01);
  });
  it('keeps every reach shallow beneath its own water despite distant lower outlets', () => {
    for (const channel of createRegion().channels) for (let i = 1; i < channel.points.length; i++) {
      const a = channel.points[i - 1], b = channel.points[i];
      for (const t of [0, .125, .25, .375, .5, .625, .75, .875, 1]) {
        const water = a[1] + (b[1] - a[1]) * t;
        const bed = heightAt(a[0] + (b[0] - a[0]) * t, a[2] + (b[2] - a[2]) * t);
        expect(bed, `${channel.id} reach ${i}, t=${t}`).toBeLessThan(water);
        expect(bed, `${channel.id} reach ${i}, t=${t}`).toBeGreaterThan(water - 6);
      }
    }
  });
  it('uses identical typed geometry in the renderer and respects tiny rectangular extents', () => {
    const source = createRegion(); source.extent = [7.3, 5.1]; source.channels = [];
    const surface = createTerrainSurface(source, heightAt), mesh = createTerrain(source);
    expect(surface.vertices).toBeInstanceOf(Float32Array); expect(surface.indices).toBeInstanceOf(Uint32Array);
    expect(mesh.geometry.getAttribute('position').array).toEqual(surface.vertices);
    expect(mesh.geometry.index!.array).toEqual(surface.indices);
    const xs: number[] = [], zs: number[] = [];
    for (let i = 0; i < surface.vertices.length; i += 3) { xs.push(surface.vertices[i]); zs.push(surface.vertices[i + 2]); }
    expect(Math.min(...xs)).toBeCloseTo(-3.65); expect(Math.max(...xs)).toBeCloseTo(3.65);
    expect(Math.min(...zs)).toBeCloseTo(-2.55); expect(Math.max(...zs)).toBeCloseTo(2.55);
    mesh.geometry.dispose();
  });
  it('stitches every interior edge without hanging faces and samples the supplied ground', () => {
    const source = createRegion(); source.extent = [137, 83];
    source.channels = [{ id: 'fixture', width: 2, points: [[-68, 0, -30], [68, 0, 30]] }];
    const surface = createTerrainSurface(source, (x, z) => x * .1 + z * .2);
    const edges = new Map<string, number>();
    for (let i = 0; i < surface.indices.length; i += 3) for (let j = 0; j < 3; j++) {
      const a = surface.indices[i + j], b = surface.indices[i + (j + 1) % 3], key = [a, b].sort((a,b) => a-b).join(',');
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
    for (const [key, count] of edges) {
      const [a, b] = key.split(',').map(Number);
      const ax = surface.vertices[a*3], az = surface.vertices[a*3+2], bx = surface.vertices[b*3], bz = surface.vertices[b*3+2];
      const boundary = (ax === bx && Math.abs(ax) === 68.5) || (az === bz && Math.abs(az) === 41.5);
      expect(count, key).toBe(boundary ? 1 : 2);
    }
    for (let i = 0; i < surface.vertices.length; i += 3) expect(surface.vertices[i+1]).toBeCloseTo(surface.vertices[i]*.1 + surface.vertices[i+2]*.2, 4);
  });
});

it('retains the large realm with a bounded adaptive mesh budget', () => {
  const source = createRegion(), before = performance.now();
  const surface = createTerrainSurface(source, heightAt);
  console.info(`terrace: ${heightAt(0,0)}; terrain: ${surface.vertices.length / 3} vertices, ${surface.indices.length / 3} triangles, ${(performance.now() - before).toFixed(0)}ms`);
  expect(surface.vertices.length / 3).toBeLessThan(300_000);
  expect(surface.indices.length / 3).toBeLessThan(600_000);
  expect(surface.vertices.includes(-3000)).toBe(true);
  expect(surface.vertices.includes(3000)).toBe(true);
  expect(surface.vertices.includes(-2000)).toBe(true);
  expect(surface.vertices.includes(2000)).toBe(true);
});
