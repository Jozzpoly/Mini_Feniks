import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createPhysics } from '../src/physics';
import { createRegion } from '../src/world/source';
import { createWorld } from '../src/world/state';
import { heightAt } from '../src/world/geography';
import { createTerrain } from '../src/view/landscape';
import { keepCameraAboveTerrain } from '../src/view/camera-ground';

describe('camera clearance over the established physical terrain',()=>{
 it('keeps the gameplay Mira focus above the rendered slope without changing the world',async()=>{
  const state=createWorld(createRegion()),before=JSON.stringify(state),physics=await createPhysics(state,heightAt),terrain=createTerrain(state.source);
  try {
   // Preserve the previous witness location; place the eye below this revision's actual mesh.
   const target=new THREE.Vector3(-12.426338195800781,130.30342712402344,15.49598217010498);
   const eye=new THREE.Vector3(-7.476338195800781,134.22342712402343,21.61598217010498);
   const x=eye.x,z=eye.z,ray=new THREE.Raycaster(new THREE.Vector3(x,900,z),new THREE.Vector3(0,-1,0));
   terrain.updateMatrixWorld(true);
   const rendered=ray.intersectObject(terrain)[0].point.y;
   eye.y=rendered-.414;
   expect(eye.y-rendered).toBeLessThan(-.4);
   keepCameraAboveTerrain(eye,(x,z)=>physics.terrainHeightAt(x,z));
   expect(eye.y-rendered).toBeGreaterThanOrEqual(.5);
   expect(eye.x).toBe(x);expect(eye.z).toBe(z);
   expect(target.toArray()).toEqual([-12.426338195800781,130.30342712402344,15.49598217010498]);
   expect(JSON.stringify(state)).toBe(before);expect(physics.metrics.steps).toBe(0);
  }finally{physics.dispose();terrain.geometry.dispose();(terrain.material as THREE.Material).dispose();}
 },20000);
 it('samples ground under the house, not the roof or authored support',async()=>{
  const state=createWorld(createRegion()),physics=await createPhysics(state,heightAt);
  try {
   const ground=physics.terrainHeightAt(0,0);
   expect(ground).toBeCloseTo(heightAt(0,0),4);
   expect(physics.groundHeightAt(0,0)!-ground!).toBeGreaterThan(3);
   const eye=new THREE.Vector3(0,heightAt(0,0)+1.7,0),before=eye.clone();
   keepCameraAboveTerrain(eye,(x,z)=>physics.terrainHeightAt(x,z));expect(eye.equals(before)).toBe(true);
  }finally{physics.dispose();}
 },20000);
 it('covers the near plane on steep ground, retains an already clear eye and tolerates an unprepared region',()=>{
  const eye=new THREE.Vector3(4,10,2);
  keepCameraAboveTerrain(eye,(x,z)=>x>4?11:9);expect(eye.y).toBeGreaterThanOrEqual(11.5);
  const clear=new THREE.Vector3(4,20,2),before=clear.clone();keepCameraAboveTerrain(clear,()=>9);expect(clear.equals(before)).toBe(true);
  const outside=new THREE.Vector3(4000,30,0);keepCameraAboveTerrain(outside,()=>null);expect(outside.toArray()).toEqual([4000,30,0]);
 });
});
