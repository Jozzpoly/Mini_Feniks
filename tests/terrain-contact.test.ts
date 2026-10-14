import { expect, it } from 'vitest';
import * as THREE from 'three';
import { createWorld } from '../src/world/state';
import { createRegion } from '../src/world/source';
import { createPhysics } from '../src/physics';
import { createTerrain } from '../src/view/landscape';
import { heightAt } from '../src/world/geography';

it('places native contact on the exact rendered terrain, including the old divide witness', async () => {
  const state=createWorld(createRegion()),physics=await createPhysics(state,heightAt),mesh=createTerrain(state.source);
  try {
    mesh.updateMatrixWorld(true);
    const ray=new THREE.Raycaster();
    for(const [x,z] of [[-26.447,0],[37.3,26.7],[-85.3,81.2],[172.3,-190.1]]){
      ray.set(new THREE.Vector3(x,900,z),new THREE.Vector3(0,-1,0));
      const hit=ray.intersectObject(mesh)[0];expect(hit).toBeDefined();
      const physical=physics.groundHeightAt(x,z);
      expect(physical).not.toBeNull();expect(physical!).toBeCloseTo(hit.point.y,3);
    }
  } finally {physics.dispose();mesh.geometry.dispose();(mesh.material as THREE.Material).dispose();}
},20000);
