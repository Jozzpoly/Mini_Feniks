import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { ActorCutaway } from '../src/view/actor-cutaway';

function part(shared:THREE.Material,x=0,y=1.3,z=3.5){
 const group=new THREE.Group(),wall=new THREE.Mesh(new THREE.BoxGeometry(4.15,2.6,.3),shared),frame=new THREE.Mesh(new THREE.BoxGeometry(.11,2.6,.34),shared);
 frame.position.x=1;group.add(wall,frame);group.position.set(x,y,z);group.updateMatrixWorld(true);return {group,wall,frame};
}
describe('cutaway reveals a focused actor without rewriting the material world',()=>{
 it('cuts only an intervening part, including its framing, and never mutates a shared material',()=>{
  const shared=new THREE.MeshStandardMaterial({color:'#987655'}),front=part(shared),behind=part(shared,0,1.3,-3.5),parts=new Map([['front',front.group],['back',behind.group]]),cutaway=new ActorCutaway();
  const eye=new THREE.Vector3(0,1.4,8),subject=[new THREE.Vector3(0,1.3,0)];
  try {
   cutaway.update(parts,eye,subject,true);
   expect(front.wall.material).not.toBe(shared);expect((front.wall.material as THREE.Material).opacity).toBeLessThan(.2);
   expect(front.frame.material).not.toBe(shared);expect((front.wall.material as THREE.Material).depthWrite).toBe(false);
   expect(behind.wall.material).toBe(shared);expect(shared.opacity).toBe(1);expect(shared.transparent).toBe(false);expect(shared.depthWrite).toBe(true);
   expect(front.group.visible).toBe(true);expect(front.group.position.toArray()).toEqual([0,1.3,3.5]);
   cutaway.update(parts,eye,subject,true);expect((front.wall.material as THREE.Material).opacity).toBeLessThan(.2);
  }finally{cutaway.dispose();for(const p of [front,behind])p.group.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});shared.dispose();}
 });
 it('restores original materials and frees its own clones when the view clears or authoring starts',()=>{
  const shared=new THREE.MeshStandardMaterial(),front=part(shared),parts=new Map([['front',front.group]]),cutaway=new ActorCutaway();
  try {
   cutaway.update(parts,new THREE.Vector3(0,1.4,8),[new THREE.Vector3(0,1.3,0)],true);
   let freed=0;(front.wall.material as THREE.Material).addEventListener('dispose',()=>{freed++;});
   cutaway.update(parts,new THREE.Vector3(0,1.4,-8),[new THREE.Vector3(0,1.3,0)],true);
   expect(front.wall.material).toBe(shared);expect(freed).toBe(1);
   cutaway.update(parts,new THREE.Vector3(0,1.4,8),[new THREE.Vector3(0,1.3,0)],true);
   front.group.visible=false; // a preview owns its visibility; camera does not change it.
   cutaway.update(parts,new THREE.Vector3(0,1.4,8),[new THREE.Vector3(0,1.3,0)],false);
   expect(front.wall.material).toBe(shared);expect(front.group.visible).toBe(false);
  }finally{cutaway.dispose();front.group.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});shared.dispose();}
 });
 it('uses actual rotated geometry, handles an eye inside a wall and releases a removed part',()=>{
  const shared=new THREE.MeshStandardMaterial(),front=part(shared,3.5,1.3,0),parts=new Map([['east',front.group]]),cutaway=new ActorCutaway();front.group.rotation.y=Math.PI/2;front.group.updateMatrixWorld(true);
  try {
   cutaway.update(parts,new THREE.Vector3(3.5,1.4,0),[new THREE.Vector3(0,1.3,0)],true);
   expect((front.wall.material as THREE.Material).opacity).toBeLessThan(.2);
   cutaway.release(front.group);expect(front.wall.material).toBe(shared);
   parts.clear();cutaway.update(parts,new THREE.Vector3(8,1.4,0),[new THREE.Vector3(0,1.3,0)],true);expect(shared.opacity).toBe(1);
  }finally{cutaway.dispose();front.group.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});shared.dispose();}
 });
});
