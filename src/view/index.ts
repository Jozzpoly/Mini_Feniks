import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createTerrain, createVegetation, createWater } from './landscape';
import { createHuman, createPart, createThing, disposeMaterials, poseHuman, type PickKind } from './objects';
import type { RegionSource, Vec3, WorldState } from '../world/types';

export interface PickResult { id: string; kind: PickKind; position: Vec3 }
export interface WorldView {
  camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer; scene: THREE.Scene;
  update(state: WorldState): void; resize(): void; focus(position: Vec3, distance?: number): void;
  pick(clientX: number, clientY: number): PickResult | null; dispose(): void;
}
/** Projection of published state. Camera animation and redraw never execute world time. */
export function createView(container: HTMLElement, source: RegionSource): WorldView {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#c1d0cd'); scene.fog = new THREE.FogExp2('#c1d0cd', .00019);
  const camera = new THREE.PerspectiveCamera(47, 1, .1, 14000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%'; renderer.domElement.style.display = 'block'; container.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = .09; controls.minDistance = 2.5; controls.maxDistance = 6000; controls.maxPolarAngle = Math.PI * .485; controls.screenSpacePanning = false;
  controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
  const hemi = new THREE.HemisphereLight('#dce8df', '#596346', 2); scene.add(hemi);
  const sunlight = new THREE.DirectionalLight('#fff0d1', 3.1); sunlight.position.set(-90, source.home.position[1] + 125, 70); sunlight.target.position.fromArray(source.home.position); scene.add(sunlight, sunlight.target);
  sunlight.castShadow = true; sunlight.shadow.mapSize.set(2048, 2048); sunlight.shadow.camera.left = -55; sunlight.shadow.camera.right = 55; sunlight.shadow.camera.top = 55; sunlight.shadow.camera.bottom = -55; sunlight.shadow.camera.near = 1; sunlight.shadow.camera.far = 300; sunlight.shadow.bias = -.0002; sunlight.shadow.normalBias = .025;
  const terrain = createTerrain(source), water = createWater(source), vegetation = createVegetation(source); scene.add(terrain, water, vegetation.group);
  const architecture = new THREE.Group(), living = new THREE.Group(); scene.add(architecture, living);
  const partMeshes = new Map<string, THREE.Group>(), people = new Map<string, ReturnType<typeof createHuman>>(), things = new Map<string, THREE.Group>();
  const pickables: THREE.Object3D[] = [terrain, architecture, living], raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  let snapshot: WorldState | null = null, frame = 0, disposed = false;
  const disposeObject = (obj: THREE.Object3D) => {
    obj.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); const mats = Array.isArray(o.material) ? o.material : [o.material]; for (const mat of mats) if (!('map' in mat) || !(mat as THREE.MeshStandardMaterial).map) mat.dispose(); } }); obj.removeFromParent();
  };
  const syncParts = (region: RegionSource) => {
    const ids = new Set(region.home.parts.map(p => p.id));
    for (const [id, mesh] of partMeshes) if (!ids.has(id)) { disposeObject(mesh); partMeshes.delete(id); }
    for (const part of region.home.parts) {
      const previous = partMeshes.get(part.id);
      if (previous?.userData.signature === JSON.stringify(part)) continue;
      if (previous) disposeObject(previous);
      const mesh = createPart(part); architecture.add(mesh); partMeshes.set(part.id, mesh);
    }
  };
  syncParts(source);
  const resize = () => { const { width, height } = container.getBoundingClientRect(); if (!width || !height) return; renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); };
  const focus = (position: Vec3, distance = 35) => { controls.target.set(position[0], position[1] + 1, position[2]); camera.position.set(position[0] + distance * .55, position[1] + distance * .48, position[2] + distance * .68); controls.update(); };
  focus(source.home.position); resize();
  const observer = new ResizeObserver(resize); observer.observe(container);
  const draw = () => {
    if (disposed) return;
    controls.update(); vegetation.update(camera);
    if (snapshot) for (const resident of snapshot.residents) { const rig = people.get(resident.id); if (rig) poseHuman(rig, resident, snapshot.seconds); }
    // Only the home's roof opens when the eye approaches its interior, keeping ordinary views whole.
    const roof = partMeshes.get('home-roof');
    if (roof) { const h = snapshot?.source.home.position ?? source.home.position; roof.visible = !(camera.position.distanceTo(new THREE.Vector3(...h)) < 13 && camera.position.y < h[1] + 8); }
    renderer.render(scene, camera); frame = requestAnimationFrame(draw);
  };
  frame = requestAnimationFrame(draw);
  return {
    camera, renderer, scene, resize, focus,
    update(state) {
      snapshot = state; syncParts(state.source);
      const residents = new Set(state.residents.map(r => r.id)), thingIds = new Set(state.things.filter(t => !t.consumed).map(t => t.id));
      for (const [id, rig] of people) if (!residents.has(id)) { disposeObject(rig.group); people.delete(id); }
      state.residents.forEach((resident, i) => { if (!people.has(resident.id)) { const rig = createHuman(resident, i); people.set(resident.id, rig); living.add(rig.group); } poseHuman(people.get(resident.id)!, resident, state.seconds); });
      for (const [id, mesh] of things) if (!thingIds.has(id)) { disposeObject(mesh); things.delete(id); }
      for (const thing of state.things) {
        if (thing.consumed) continue;
        if (!things.has(thing.id)) { const mesh = createThing(thing); things.set(thing.id, mesh); living.add(mesh); }
        const mesh = things.get(thing.id)!; mesh.position.fromArray(thing.position); mesh.quaternion.fromArray(thing.rotation);
      }
    },
    pick(clientX, clientY) {
      const rect = renderer.domElement.getBoundingClientRect(); pointer.set((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1); raycaster.setFromCamera(pointer, camera);
      for (const hit of raycaster.intersectObjects(pickables, true)) {
        let node: THREE.Object3D | null = hit.object; while (node && !node.userData.kind) node = node.parent;
        if (node?.userData.kind && node.visible) return { id: node.userData.id, kind: node.userData.kind, position: hit.point.toArray() as Vec3 };
      }
      return null;
    },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); controls.dispose();
      scene.traverse(obj => { if (obj instanceof THREE.Mesh) { obj.geometry.dispose(); const mats = Array.isArray(obj.material) ? obj.material : [obj.material]; for (const mat of mats) mat.dispose(); } });
      disposeMaterials(); renderer.dispose(); renderer.domElement.remove();
    },
  };
}
