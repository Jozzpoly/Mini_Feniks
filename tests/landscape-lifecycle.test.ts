import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createVegetation, createWater, createLandscapeProjection } from '../src/view/landscape';
import { createRegion } from '../src/world/source';
import { sharedTerrainSurface } from '../src/world/terrain-surface';
import { heightAt } from '../src/world/geography';

function disposeTree(group:THREE.Object3D){group.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});}
function checkBounds(group:THREE.Object3D,halfX:number,halfZ:number){
 const matrix=new THREE.Matrix4(),point=new THREE.Vector3();
 group.traverse(o=>{
  if(!(o instanceof THREE.Mesh))return;
  const vertices=o.geometry.getAttribute('position');
  for(let instance=0;instance<(o instanceof THREE.InstancedMesh?o.count:1);instance++){
   if(o instanceof THREE.InstancedMesh)o.getMatrixAt(instance,matrix);else matrix.copy(o.matrix);
   for(let i=0;i<vertices.count;i++){point.fromBufferAttribute(vertices,i).applyMatrix4(matrix);expect(Math.abs(point.x)).toBeLessThanOrEqual(halfX+.00001);expect(Math.abs(point.z)).toBeLessThanOrEqual(halfZ+.00001);}
  }
 });
}

describe('derived landscape follows accepted source extent',()=>{
 it('keeps complete tree and local-detail geometry inside a shrunken physical extent',()=>{
  const source=createRegion();source.extent=[40,40];const vegetation=createVegetation(source);
  try{let instances=0;vegetation.group.traverse(o=>{if(o instanceof THREE.InstancedMesh)instances+=o.count;});expect(instances).toBeGreaterThan(0);checkBounds(vegetation.group,20,20);}finally{disposeTree(vegetation.group);}
 });
 it('clips the actual water ribbon to the accepted terrain bounds',()=>{
  const source=createRegion();source.extent=[400,400];const water=createWater(source);
  try{expect(water.children.length).toBeGreaterThan(0);checkBounds(water,200,200);}finally{disposeTree(water);}
 });
 it('replaces real scene geometry and disposes the previous projection after a recipe change',()=>{
  const source=createRegion();source.extent=[160,160];const scene=new THREE.Scene(),landscape=createLandscapeProjection(scene,source);
  try{
   const actor=new THREE.Object3D();actor.position.set(5,130,8);scene.add(actor);
   const old=landscape.terrain;let oldDisposed=false,instancesDisposed=0,oldInstances=0;old.geometry.addEventListener('dispose',()=>{oldDisposed=true;});
   landscape.group.traverse(node=>{if(node instanceof THREE.InstancedMesh){oldInstances++;node.addEventListener('dispose',()=>{instancesDisposed++;});}});
   const next=structuredClone(source);next.extent=[100,80];expect(landscape.sync(next)).toBe(true);
   expect(oldDisposed).toBe(true);expect(instancesDisposed).toBe(oldInstances);expect(old.parent).toBeNull();expect(landscape.terrain).not.toBe(old);
   const coordinates=landscape.terrain.geometry.getAttribute('position').array;
   expect(coordinates).toBe(sharedTerrainSurface(next,heightAt).vertices);
   checkBounds(landscape.group,50,40);expect(actor.parent).toBe(scene);expect(actor.position.toArray()).toEqual([5,130,8]);
   const ray=new THREE.Raycaster(new THREE.Vector3(70,900,0),new THREE.Vector3(0,-1,0));landscape.group.updateMatrixWorld(true);
   expect(ray.intersectObject(landscape.terrain)).toHaveLength(0);
   ray.set(new THREE.Vector3(25,900,0),new THREE.Vector3(0,-1,0));expect(ray.intersectObject(landscape.terrain).length).toBeGreaterThan(0);
  }finally{landscape.dispose();}
 });
 it('retains the current projection when staging fails and does not rebuild for ordinary form changes',()=>{
  const source=createRegion();source.extent=[100,100];const landscape=createLandscapeProjection(new THREE.Scene(),source);
  try{
   const original=landscape.terrain;let disposed=false;original.geometry.addEventListener('dispose',()=>{disposed=true;});
   const formOnly=structuredClone(source);formOnly.home.parts[0].position[0]+=2;formOnly.revision++;
   expect(landscape.sync(formOnly)).toBe(false);expect(landscape.terrain).toBe(original);
   const invalid=structuredClone(source);invalid.extent=[NaN,100];expect(()=>landscape.sync(invalid)).toThrow();
   expect(landscape.terrain).toBe(original);expect(original.parent).not.toBeNull();expect(disposed).toBe(false);
  }finally{landscape.dispose();}
 });
});
