import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createTerrain } from '../src/view/landscape';
import { createRegion } from '../src/world/source';
import { ecologyAt, heightAt, TERRAIN_VERSION } from '../src/world/geography';

describe('authored geography', () => {
  it('prepares a stable 6 by 4 kilometre drainage graph with strictly falling reaches', () => {
    const a = createRegion(), b = createRegion();
    expect(a).toEqual(b); expect(a.extent).toEqual([6000, 4000]);
    expect(a.channels.length).toBeGreaterThan(2);
    for (const channel of a.channels) {
      for (let i = 1; i < channel.points.length; i++) expect(channel.points[i][1]).toBeLessThan(channel.points[i - 1][1]);
      for (const [x, y, z] of channel.points) expect(heightAt(x, z)).toBeLessThan(y);
    }
  });
  it('keeps rendered upstream beds near their water instead of carving from remote outlets', () => {
    const source = createRegion(), terrain = createTerrain(source);
    terrain.updateMatrixWorld(true);
    const ray = new THREE.Raycaster();
    for (const channel of source.channels) for (let i = 1; i < channel.points.length; i++) {
      const a = channel.points[i - 1], b = channel.points[i], x = (a[0] + b[0]) / 2, z = (a[2] + b[2]) / 2, water = (a[1] + b[1]) / 2;
      ray.set(new THREE.Vector3(x, 800, z), new THREE.Vector3(0, -1, 0));
      const hit = ray.intersectObject(terrain)[0];
      expect(hit, `${channel.id} reach ${i}`).toBeDefined();
      expect(hit.point.y, `${channel.id} reach ${i}`).toBeLessThan(water);
      expect(hit.point.y, `${channel.id} reach ${i}`).toBeGreaterThan(water - 6);
    }
    terrain.geometry.dispose(); (terrain.material as THREE.Material).dispose();
  });
  it('builds a human scale floor, clear front doorway and six real stairs', () => {
    const s = createRegion(), h = s.home.position[1];
    const floor = s.home.parts.find(p => p.id === 'home-floor')!;
    expect(floor.size[0]).toBe(10); expect(floor.size[2]).toBe(7);
    expect(floor.position[1] + floor.size[1] / 2).toBeCloseTo(h);
    const steps = s.home.parts.filter(p => p.role === 'step').sort((a, b) => b.position[2] - a.position[2]);
    expect(steps).toHaveLength(6);
    steps.forEach((p, i) => {
      expect(p.size[2]).toBeCloseTo(.28);
      expect(p.position[1] + p.size[1] / 2).toBeCloseTo(h - .9 + .15 * (i + 1));
    });
    for (const p of s.home.parts.filter(p => p.role === 'wall')) {
      if (Math.abs(p.position[2] - 3.5) < .2 && p.position[1] - p.size[1] / 2 < h + 2.15)
        expect(Math.abs(p.position[0]) - p.size[0] / 2).toBeGreaterThanOrEqual(.8);
    }
    expect(heightAt(0, 5.4)).toBeCloseTo(h - .9);
    const rest = s.places.find(p => p.id === 'rest-inside')!;
    expect(rest.position[1]).toBeCloseTo(h);
    expect(s.home.parts.filter(p => p.role === 'bench').every(p => Math.abs(rest.position[0] - p.position[0]) > p.size[0] / 2 || Math.abs(rest.position[2] - p.position[2]) > p.size[2] / 2)).toBe(true);
  });
  it('has recognisable distant ridges and different ecological conditions', () => {
    const samples: number[] = [], habitats = new Set<string>();
    for (let x = -2800; x <= 2800; x += 400) for (let z = -1800; z <= 1800; z += 400) {
      samples.push(heightAt(x, z)); habitats.add(ecologyAt(x, z).habitat);
    }
    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(180);
    expect(habitats.size).toBeGreaterThanOrEqual(4);
    expect(new Set(createRegion().home.parts.map(p => p.id)).size).toBe(createRegion().home.parts.length);
  });
  it('opens broad walkable ground from the home to the lookout and western meadow', () => {
    expect(TERRAIN_VERSION).toBe('jaworowa-living-3');
    expect(heightAt(0, 0)).toBeCloseTo(128.58432008301136, 8);
    for (const [ax, az, bx, bz] of [[-9, 8, -16, 24], [-10, 8, -40, 8], [0, -10, 0, -40]]) {
      for (let i = 0; i <= 80; i++) {
        const t = i / 80, x = ax + (bx-ax)*t, z = az + (bz-az)*t;
        // A broad corridor, including its shoulders, rather than one lucky centreline.
        for (const offset of [-2, 0, 2]) {
          const dx = (heightAt(x+offset+.25,z)-heightAt(x+offset-.25,z))/.5;
          const dz = (heightAt(x+offset,z+.25)-heightAt(x+offset,z-.25))/.5;
          expect(Math.hypot(dx,dz), `${x},${z}, shoulder ${offset}`).toBeLessThan(.3);
        }
      }
    }
    expect(ecologyAt(-16,24).path).toBeGreaterThan(.9);
    expect(ecologyAt(-40,8).path).toBeGreaterThan(.9);
  });
  it('rounds the inhabited terrace into the valley without a rectangular steep collar', () => {
    for (let x = -50; x <= 50; x += 2) for (let z = -45; z <= 45; z += 2) {
      const dx=(heightAt(x+.25,z)-heightAt(x-.25,z))/.5;
      const dz=(heightAt(x,z+.25)-heightAt(x,z-.25))/.5;
      expect(Math.hypot(dx,dz), `${x},${z}`).toBeLessThan(.45);
    }
    expect(heightAt(-120,10)-heightAt(0,0)).toBeGreaterThan(8);
  });
});

it('keeps the witnessed watershed divide continuous', () => {
  const x = -26.4470043033;
  expect(Math.abs(heightAt(x-.001, 0)-heightAt(x+.001, 0))).toBeLessThan(.01);
});
