import { afterEach, describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import * as THREE from 'three';
import { createView } from '../src/view';
import { createInterface } from '../src/ui';
import { createSession } from '../src/session';
import { createRegion } from '../src/world/source';
import { createWorld } from '../src/world/state';
import { heightAt } from '../src/world/geography';

// Only GPU output is unavailable here. OrbitControls, geometry, raycasts, UI and native physics are real.
vi.mock('three',async importOriginal=>{
 const actual=await importOriginal<typeof import('three')>();
 class RendererBoundary {
  domElement=document.createElement('canvas');shadowMap={enabled:false,type:0};
  setPixelRatio(){}setSize(){}render(scene:import('three').Scene,camera:import('three').Camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);}dispose(){}
 }
 return {...actual,WebGLRenderer:RendererBoundary};
});

async function setup(){
 const dom=new JSDOM('<div id="land"></div><div id="ui"></div>',{pretendToBeVisual:true,url:'https://feniks.test'});
 vi.stubGlobal('window',dom.window);vi.stubGlobal('document',dom.window.document);vi.stubGlobal('HTMLElement',dom.window.HTMLElement);vi.stubGlobal('localStorage',dom.window.localStorage);vi.stubGlobal('devicePixelRatio',1);
 const textureContext=(()=>({fillRect(){},fillStyle:''})) as unknown as typeof dom.window.HTMLCanvasElement.prototype.getContext;
 vi.spyOn(dom.window.HTMLCanvasElement.prototype,'getContext').mockImplementation(textureContext);
 vi.stubGlobal('ResizeObserver',class {observe(){}disconnect(){}});
 let draw:FrameRequestCallback=()=>{};
 vi.stubGlobal('requestAnimationFrame',(callback:FrameRequestCallback)=>{draw=callback;return 1;});vi.stubGlobal('cancelAnimationFrame',()=>{});
 const source=createRegion();source.extent=[200,200];const session=await createSession(createWorld(source),heightAt);
 const view=createView(document.querySelector<HTMLElement>('#land')!,session.state.source,(x,z)=>session.physics.terrainHeightAt(x,z));view.update(session.state);
 const ui=createInterface(document.querySelector<HTMLElement>('#ui')!,session,view);
 const part=(id:string)=>{let result:THREE.Group|undefined;view.scene.traverse(node=>{if(node.userData.id===id&&node.userData.kind==='part')result=node as THREE.Group;});if(!result)throw new Error('Missing part '+id);return result;};
 const frame=()=>draw(performance.now());
 const cleanup=()=>{ui.dispose();view.dispose();session.dispose();dom.window.close();};
 return {dom,session,view,ui,part,frame,cleanup};
}
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});

describe('actual view camera wiring and authoring boundary',()=>{
 it('protects a selected inhabitant focus against the native slope through the real UI',async()=>{
  const {session,view,frame,cleanup}=await setup();
  try {
   for(let step=0;step<52*60;step++)session.advance(1/60);view.update(session.state);
   const before=session.save();
   document.querySelector<HTMLButtonElement>('[data-person="resident:mira"]')!.click();frame();
   const ground=session.physics.terrainHeightAt(view.camera.position.x,view.camera.position.z)!;
   expect(view.camera.position.y-ground).toBeGreaterThanOrEqual(.5);expect(session.save()).toBe(before);
   view.camera.aspect=1860/914;view.camera.updateProjectionMatrix();view.camera.updateMatrixWorld(true);
   for(const x of [-1,1])for(const y of [-1,1]){
    const corner=new THREE.Vector3(x,y,-1).unproject(view.camera),height=session.physics.terrainHeightAt(corner.x,corner.z)!;
    expect(corner.y-height).toBeGreaterThan(.1);
   }
  }finally{cleanup();}
 },20000);
 it('reveals selected furniture through its parent, follows a preview, and restores the complete selected house',async()=>{
  const {session,view,part,frame,cleanup}=await setup();
  try {
   const floor=session.state.source.home.position[1];
   view.setMode?.('observe');view.focus([-2.9,floor+.52,-1],7,session.player.id);
   // The real player is brought beside the same bench by a checkpoint, not by the view.
   const checkpoint=JSON.parse(session.save()),player=checkpoint.residents.find((r:{control:string})=>r.control==='player');player.position=[-2.9,floor+.52,-1];player.posture=1;
   await session.load(JSON.stringify(checkpoint));view.update(session.state);frame();
   const wall=part('home-wall-front-right'),roof=part('home-roof'),original=(wall.children[0] as THREE.Mesh).material;
   view.camera.position.set(6,floor+1.25,8);frame();
   expect(((wall.children[0] as THREE.Mesh).material as THREE.Material).opacity).toBeLessThan(.2);
   const bench=part('home-bench'),benchMaterial=(bench.children[0] as THREE.Mesh).material;
   const roofMaterial=(roof.children[0] as THREE.Mesh).material;
   const saved=session.save();document.querySelector<HTMLButtonElement>('[data-action="author"]')!.click();frame();
   expect(((roof.children[0] as THREE.Mesh).material as THREE.Material).opacity).toBeLessThan(.2);
   expect((bench.children[0] as THREE.Mesh).material).toBe(benchMaterial);expect((benchMaterial as THREE.Material).opacity).toBe(1);expect(bench.visible).toBe(true);
   const benchCenter=new THREE.Box3().setFromObject(bench).getCenter(new THREE.Vector3());
   vi.spyOn(view.renderer.domElement,'getBoundingClientRect').mockReturnValue({left:0,top:0,right:800,bottom:400,width:800,height:400,x:0,y:0,toJSON(){return {};}});
   view.camera.aspect=2;view.camera.updateProjectionMatrix();frame();
   const point=bench.position.clone().project(view.camera);
   expect(view.pick((point.x+1)*400,(1-point.y)*200)?.id).toBe('home-bench');
   const input=document.querySelector<HTMLInputElement>('[data-field="position-0"]')!;input.value='-18';input.dispatchEvent(new window.Event('input',{bubbles:true}));frame();
   expect(session.save()).toBe(saved);expect(bench.visible).toBe(false);
   // Looking down at the moved draft outside the house must not keep cutting the old location.
   view.focus([-18,floor+.3,-1],7);view.camera.position.set(-18,floor+12,-1);frame();
   expect((roof.children[0] as THREE.Mesh).material).toBe(roofMaterial);
   document.querySelector<HTMLButtonElement>('[data-action="cancel"]')!.click();view.focus(benchCenter.toArray() as [number,number,number],7);frame();
   expect(((roof.children[0] as THREE.Mesh).material as THREE.Material).opacity).toBeLessThan(.2);
   expect(bench.visible).toBe(true);expect((bench.children[0] as THREE.Mesh).material).toBe(benchMaterial);expect(session.save()).toBe(saved);
   const select=document.querySelector<HTMLSelectElement>('[data-form]')!;select.value=session.state.source.home.id;select.dispatchEvent(new window.Event('change',{bubbles:true}));frame();
   expect((roof.children[0] as THREE.Mesh).material).toBe(roofMaterial);
   expect((wall.children[0] as THREE.Mesh).material).toBe(original);
   expect((bench.children[0] as THREE.Mesh).material).toBe(benchMaterial);expect(session.save()).toBe(saved);
  }finally{cleanup();}
 },20000);
 it('restores cutaway when switching to a wide view and releases a replaced source part',async()=>{
  const {session,view,part,frame,cleanup}=await setup();
  try {
   const floor=session.state.source.home.position[1],checkpoint=JSON.parse(session.save()),player=checkpoint.residents.find((r:{control:string})=>r.control==='player');player.position=[-2.9,floor+.52,-1];player.posture=1;
   await session.load(JSON.stringify(checkpoint));view.update(session.state);view.setMode?.('play',session.player.id);
   const wall=part('home-wall-front-right'),original=(wall.children[0] as THREE.Mesh).material;view.camera.position.set(6,floor+1.25,8);frame();
   expect((wall.children[0] as THREE.Mesh).material).not.toBe(original);
   document.querySelector<HTMLButtonElement>('[data-action="realm"]')!.click();frame();expect((wall.children[0] as THREE.Mesh).material).toBe(original);
   view.setMode?.('play',session.player.id);view.camera.position.set(6,floor+1.25,8);frame();
   let disposed=0;((wall.children[0] as THREE.Mesh).material as THREE.Material).addEventListener('dispose',()=>{disposed++;});
   const result=session.edit('home-wall-front-right',{position:[2.925,floor+1.3,4]});expect(result.accepted).toBe(true);view.update(session.state);
   expect(disposed).toBe(1);expect(wall.parent).toBeNull();expect(part('home-wall-front-right')).not.toBe(wall);
  }finally{cleanup();}
 },20000);
 it('lets the owner pick the player through a cutaway, while author mode without a selection picks the physical wall',async()=>{
  const {session,view,frame,cleanup}=await setup();
  try {
   const floor=session.state.source.home.position[1],checkpoint=JSON.parse(session.save()),player=checkpoint.residents.find((r:{control:string})=>r.control==='player');player.position=[-2.9,floor+.52,-1];player.posture=1;
   await session.load(JSON.stringify(checkpoint));view.update(session.state);view.setMode?.('play',session.player.id);
   const rect={left:0,top:0,right:800,bottom:400,width:800,height:400,x:0,y:0,toJSON(){return {};}};
   vi.spyOn(view.renderer.domElement,'getBoundingClientRect').mockReturnValue(rect);view.camera.aspect=2;view.camera.updateProjectionMatrix();
   view.camera.position.set(6,floor+1.25,8);frame();
   const point=new THREE.Vector3(...session.player.position).add(new THREE.Vector3(0,.25,0)).project(view.camera),x=(point.x+1)*400,y=(1-point.y)*200;
   expect(view.pick(x,y)?.id).toBe(session.player.id);
   view.setMode?.('author');frame();expect(view.pick(x,y)?.kind).toBe('part');
  }finally{cleanup();}
 },20000);
});
