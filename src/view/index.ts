import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { createLandscapeProjection } from './landscape';
import { createHuman, createPart, createThing, disposeMaterials, poseHuman, type PickKind } from './objects';
import { ActorCutaway } from './actor-cutaway';
import { keepCameraAboveTerrain } from './camera-ground';
import { resolveFormTransform, syncFormProjection } from '../world/forms';
import type { AuthoringOperation } from '../world/authoring';
import type { RegionSource, Vec3, WorldState } from '../world/types';

export type ViewMode='play'|'observe'|'author';
export interface PickResult { id: string; kind: PickKind; position: Vec3 }
export interface AuthorPose {position:Vec3;yaw:number}
export interface WorldView {
  camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer; scene: THREE.Scene;
  update(state: WorldState): void; resize(): void; focus(position: Vec3, distance?: number, subjectId?:string): void;
  pick(clientX: number, clientY: number): PickResult | null; dispose(): void;
  setMode?(mode:ViewMode,playerId?:string):void;
  setSelection?(formId:string|null):void;
  previewAuthor?(operation:AuthoringOperation|null):void;
  setAuthorTool?(tool:'translate'|'rotate'):void;
  onAuthorGesture?(callback:((pose:AuthorPose)=>void)|null):void;
  isAuthorDragging?():boolean;
}

/** Projection of published state. Camera and author previews never execute world time. */
export function createView(container: HTMLElement, source: RegionSource, terrainHeight:(x:number,z:number)=>number|null): WorldView {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#c1d0cd'); scene.fog = new THREE.FogExp2('#c1d0cd', .00019);
  const camera = new THREE.PerspectiveCamera(47, 1, .1, 14000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%'; renderer.domElement.style.display = 'block'; renderer.domElement.tabIndex=0;container.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = .09; controls.minDistance = 2.5; controls.maxDistance = 6000; controls.maxPolarAngle = Math.PI * .485; controls.screenSpacePanning = false;
  controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
  const hemi = new THREE.HemisphereLight('#dce8df', '#596346', 2); scene.add(hemi);
  const sunlight = new THREE.DirectionalLight('#fff0d1', 3.1); sunlight.position.set(-90, source.home.position[1] + 125, 70); sunlight.target.position.fromArray(source.home.position); scene.add(sunlight, sunlight.target);
  sunlight.castShadow = true; sunlight.shadow.mapSize.set(2048, 2048); sunlight.shadow.camera.left = -55; sunlight.shadow.camera.right = 55; sunlight.shadow.camera.top = 55; sunlight.shadow.camera.bottom = -55; sunlight.shadow.camera.near = 1; sunlight.shadow.camera.far = 300; sunlight.shadow.bias = -.0002; sunlight.shadow.normalBias = .025;
  const landscape=createLandscapeProjection(scene,source);
  const architecture = new THREE.Group(), living = new THREE.Group(),preview = new THREE.Group(); scene.add(architecture, living,preview);
  const partMeshes = new Map<string, THREE.Group>(), people = new Map<string, ReturnType<typeof createHuman>>(), things = new Map<string, THREE.Group>();
  const cutaway=new ActorCutaway();
  const pickables: THREE.Object3D[] = [landscape.terrain, architecture, living], raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const anchor=new THREE.Object3D();scene.add(anchor);
  const transform=new TransformControls(camera,renderer.domElement);transform.setSpace('world');transform.setTranslationSnap(.1);transform.setRotationSnap(Math.PI/12);scene.add(transform.getHelper());
  const selection=new THREE.Box3Helper(new THREE.Box3(),'#d3bc72');(selection.material as THREE.LineBasicMaterial).depthTest=false;selection.renderOrder=20;selection.visible=false;scene.add(selection);
  let snapshot: WorldState | null = null, frame = 0, disposed = false,mode:ViewMode='observe',playerId:string|null=null,selectedForm:string|null=null;
  let authorOperation:AuthoringOperation|null=null,authorCallback:((pose:AuthorPose)=>void)|null=null,updatingPreview=false,followPosition:THREE.Vector3|null=null;
  let focusedSubject:string|null=null;
  const disposeObject = (obj: THREE.Object3D) => {
    obj.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); const mats = Array.isArray(o.material) ? o.material : [o.material]; for (const mat of mats) if (mat.userData.authorPreview || !('map' in mat) || !(mat as THREE.MeshStandardMaterial).map) mat.dispose(); } }); obj.removeFromParent();
  };
  const currentSource=()=>snapshot?.source??source;
  const childrenOf=(region:RegionSource,id:string):Set<string>=>{
    const ids=new Set([id]);let added=true;while(added){added=false;for(const form of region.forms??[])if(form.parentId&&ids.has(form.parentId)&&!ids.has(form.id)){ids.add(form.id);added=true;}}return ids;
  };
  const partIdsOf=(region:RegionSource,id:string)=>{const forms=childrenOf(region,id);return new Set((region.forms??[]).filter(f=>forms.has(f.id)).flatMap(f=>f.parts.map(p=>p.id)));};
  const syncParts = (region: RegionSource) => {
    const ids = new Set(region.home.parts.map(p => p.id));
    for (const [id, mesh] of partMeshes) if (!ids.has(id)) { cutaway.release(mesh);disposeObject(mesh); partMeshes.delete(id); }
    for (const part of region.home.parts) {
      const previous = partMeshes.get(part.id);
      if (previous?.userData.signature === JSON.stringify(part)) continue;
      if (previous) {cutaway.release(previous);disposeObject(previous);}
      const mesh = createPart(part); architecture.add(mesh); partMeshes.set(part.id, mesh);
    }
  };
  const clearGhost=()=>{for(const child of [...preview.children])disposeObject(child);for(const mesh of partMeshes.values())mesh.visible=true;};
  const updateSelection=()=>{
    selection.visible=false;
    if(mode!=='author'){transform.detach();return;}
    const region=currentSource(),id=authorOperation?.kind==='create'?authorOperation.form.id:selectedForm;if(!id){transform.detach();return;}
    let pose:AuthorPose;
    if(authorOperation?.kind==='create')pose={position:authorOperation.form.position,yaw:authorOperation.form.yaw};
    else {
      if(!region.forms?.some(f=>f.id===id)){transform.detach();return;}
      const projected=structuredClone(region);
      if(authorOperation?.kind==='transform'){const f=projected.forms!.find(f=>f.id===id)!;if(authorOperation.position)f.position=[...authorOperation.position];if(authorOperation.yaw!==undefined)f.yaw=authorOperation.yaw;}
      pose=resolveFormTransform(projected,id);
    }
    const bounds=new THREE.Box3();
    if(preview.children.length)bounds.setFromObject(preview);
    else {for(const partId of partIdsOf(region,id)){const mesh=partMeshes.get(partId);if(mesh)bounds.union(new THREE.Box3().setFromObject(mesh));}}
    if(!bounds.isEmpty()){selection.box.copy(bounds);selection.visible=true;selection.updateMatrixWorld(true);}
    if(!transform.dragging){updatingPreview=true;anchor.position.fromArray(pose.position);anchor.rotation.set(0,pose.yaw,0);anchor.updateMatrixWorld(true);updatingPreview=false;}
    if(transform.object!==anchor)transform.attach(anchor);
  };
  const previewAuthor=(operation:AuthoringOperation|null)=>{
    if(!operation&&transform.dragging){transform.dragging=false;transform.axis=null;controls.enabled=true;}
    authorOperation=operation;clearGhost();
    if(operation&&operation.kind!=='remove'){
      const region=structuredClone(currentSource()),id=operation.kind==='create'?operation.form.id:operation.formId;
      if(operation.kind==='create')region.forms!.push(structuredClone(operation.form));
      else {const f=region.forms?.find(f=>f.id===id);if(!f){authorOperation=null;updateSelection();return;}if(operation.position)f.position=[...operation.position];if(operation.yaw!==undefined)f.yaw=operation.yaw;}
      try{
        syncFormProjection(region);const ids=partIdsOf(region,id);
        for(const part of region.home.parts)if(ids.has(part.id)){
          const mesh=createPart(part);mesh.traverse(o=>{if(o instanceof THREE.Mesh){const original=o.material as THREE.MeshStandardMaterial;o.material=original.clone();o.material.userData.authorPreview=true;if(!original.map)original.dispose();(o.material as THREE.MeshStandardMaterial).color.set('#e6d29a');(o.material as THREE.MeshStandardMaterial).transparent=true;(o.material as THREE.MeshStandardMaterial).opacity=.65;(o.material as THREE.MeshStandardMaterial).depthWrite=false;o.castShadow=false;}});preview.add(mesh);const original=partMeshes.get(part.id);if(original)original.visible=false;
        }
      }catch{clearGhost();authorOperation=null;}
    }
    updateSelection();
  };
  transform.addEventListener('dragging-changed',e=>{controls.enabled=!e.value;});
  transform.addEventListener('objectChange',()=>{
    if(updatingPreview||mode!=='author'||!authorCallback)return;
    const yaw=Math.atan2(Math.sin(anchor.rotation.y),Math.cos(anchor.rotation.y));
    authorCallback({position:anchor.position.toArray() as Vec3,yaw});
  });
  syncParts(source);
  const resize = () => { const { width, height } = container.getBoundingClientRect(); if (!width || !height) return; renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); };
  const protectGround=()=>{keepCameraAboveTerrain(camera.position,terrainHeight);camera.lookAt(controls.target);};
  const focus = (position: Vec3, distance = 35,subjectId?:string) => { focusedSubject=subjectId??null;controls.target.set(position[0], position[1] + .4, position[2]); camera.position.set(position[0] + distance * .55, position[1] + distance * .48, position[2] + distance * .68); controls.update();protectGround(); };
  focus(source.home.position); resize();
  const observer = new ResizeObserver(resize); observer.observe(container);
  const draw = () => {
    if (disposed) return;
    controls.update();protectGround();landscape.update(camera);
    if (snapshot) for (const resident of snapshot.residents) { const rig = people.get(resident.id); if (rig) poseHuman(rig, resident, snapshot.seconds); }
    const subjectId=mode==='play'?playerId:focusedSubject,resident=snapshot?.residents.find(r=>r.id===subjectId),thing=snapshot?.things.find(t=>t.id===subjectId&&!t.consumed);
    const samples:THREE.Vector3[]=[];
    let candidates:Map<string,THREE.Object3D>=partMeshes;
    if(mode==='author'&&selection.visible){
      // Reveal the actual selection (including its draft), never cut that form or its children.
      const id=authorOperation?.kind==='create'?authorOperation.form.id:selectedForm;
      const protectedParts=id?partIdsOf(currentSource(),id):new Set<string>();
      candidates=new Map([...partMeshes].filter(([partId,mesh])=>mesh.visible&&!protectedParts.has(partId)));
      const center=selection.box.getCenter(new THREE.Vector3()),height=selection.box.max.y-selection.box.min.y;
      samples.push(center,center.clone().add(new THREE.Vector3(0,height*.4,0)),center.clone().add(new THREE.Vector3(0,-height*.4,0)));
    }
    else if(mode!=='author'&&resident){const p=new THREE.Vector3(...resident.position),lift=.6-.2*resident.posture;samples.push(p,p.clone().add(new THREE.Vector3(0,lift,0)),p.clone().add(new THREE.Vector3(0,-.5+.2*resident.posture,0)));}
    else if(thing)samples.push(new THREE.Vector3(...thing.position));
    // Actual intervening groups are a visual cutaway; authored parts and native contact remain intact.
    cutaway.update(candidates,camera.position,samples,true);
    renderer.render(scene, camera); frame = requestAnimationFrame(draw);
  };
  frame = requestAnimationFrame(draw);
  return {
    camera, renderer, scene, resize, focus,
    setMode(next,id){
      mode=next;playerId=id??playerId;followPosition=null;focusedSubject=null;cutaway.dispose();
      if(mode==='play'){const player=snapshot?.residents.find(r=>r.id===playerId);if(player){focus(player.position,8,player.id);followPosition=new THREE.Vector3(...player.position);}controls.enablePan=false;controls.maxDistance=80;}
      else {controls.enablePan=true;controls.maxDistance=6000;}
      updateSelection();
    },
    setSelection(id){const changed=selectedForm!==id;selectedForm=id;updateSelection();if(changed&&id&&mode==='author'&&currentSource().forms?.some(f=>f.id===id)){const size=selection.box.getSize(new THREE.Vector3()),center=selection.box.getCenter(new THREE.Vector3());if(!selection.box.isEmpty())focus(center.toArray() as Vec3,Math.max(7,size.length()*1.3));}},previewAuthor,
    setAuthorTool(tool){transform.setMode(tool);transform.showX=tool==='translate';transform.showY=true;transform.showZ=tool==='translate';},
    onAuthorGesture(callback){authorCallback=callback;},isAuthorDragging(){return transform.dragging;},
    update(state) {
      landscape.sync(state.source);pickables[0]=landscape.terrain;
      const sourceChanged=snapshot?.source!==state.source;snapshot=state;syncParts(state.source);
      if(sourceChanged&&mode==='author'){if(authorOperation)previewAuthor(authorOperation);else updateSelection();}
      const residents = new Set(state.residents.map(r => r.id)), thingIds = new Set(state.things.filter(t => !t.consumed).map(t => t.id));
      for (const [id, rig] of people) if (!residents.has(id)) { disposeObject(rig.group); people.delete(id); }
      state.residents.forEach((resident, i) => { if (!people.has(resident.id)) { const rig = createHuman(resident, i); people.set(resident.id, rig); living.add(rig.group); } poseHuman(people.get(resident.id)!, resident, state.seconds); });
      for (const [id, mesh] of things) if (!thingIds.has(id)) { disposeObject(mesh); things.delete(id); }
      for (const thing of state.things) {
        if (thing.consumed) continue;
        if (!things.has(thing.id)) { const mesh = createThing(thing); things.set(thing.id, mesh); living.add(mesh); }
        const mesh = things.get(thing.id)!; mesh.position.fromArray(thing.position); mesh.quaternion.fromArray(thing.rotation);
      }
      if(mode==='play'){
        const player=state.residents.find(r=>r.id===playerId);
        if(player){const position=new THREE.Vector3(...player.position);if(followPosition){const delta=position.clone().sub(followPosition);camera.position.add(delta);controls.target.add(delta);}else focus(player.position,8,player.id);followPosition=position;}
      }
    },
    pick(clientX, clientY) {
      const rect = renderer.domElement.getBoundingClientRect();if(!rect.width||!rect.height)return null;pointer.set((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1); raycaster.setFromCamera(pointer, camera);
      for (const hit of raycaster.intersectObjects(pickables, true)) {
        if(cutaway.isCut(hit.object))continue;
        let node: THREE.Object3D | null = hit.object; while (node && !node.userData.kind) node = node.parent;
        if (node?.userData.kind && node.visible) return { id: node.userData.id, kind: node.userData.kind, position: hit.point.toArray() as Vec3 };
      }
      return null;
    },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();transform.dispose(); controls.dispose();cutaway.dispose();landscape.dispose();
      scene.traverse(obj => { if (obj instanceof THREE.Mesh) { obj.geometry.dispose(); const mats = Array.isArray(obj.material) ? obj.material : [obj.material]; for (const mat of mats) mat.dispose(); } });
      selection.geometry.dispose();(selection.material as THREE.LineBasicMaterial).dispose();disposeMaterials(); renderer.dispose(); renderer.domElement.remove();
    },
  };
}
