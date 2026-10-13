import * as THREE from 'three';
import type { PartSource, Resident, Thing } from '../world/types';

export type PickKind = 'resident' | 'thing' | 'part' | 'ground';
const materials: Record<string, THREE.MeshStandardMaterial> = {};
function texture(kind: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d')!;
  const palette: Record<string, string> = { stone: '#a3a092', plaster: '#d6cab0', timber: '#73533b', thatch: '#a69560', cloth: '#81654b', earth: '#877559', water: '#628782' };
  context.fillStyle = palette[kind] ?? '#777777'; context.fillRect(0, 0, 128, 128);
  let seed = 37;
  const rand = () => { seed = Math.imul(seed, 1664525) + 1013904223 | 0; return (seed >>> 0) / 4294967295; };
  for (let i = 0; i < 1300; i++) {
    context.fillStyle = `rgba(${rand() > .5 ? '255,243,205' : '35,27,22'},${rand() * .13})`;
    const x = rand() * 128, y = rand() * 128;
    context.fillRect(x, y, kind === 'thatch' ? 1 : kind === 'timber' ? 1 : rand() * 3 + 1, kind === 'timber' ? 8 + rand() * 28 : kind === 'thatch' ? 9 + rand() * 19 : 1 + rand() * 4);
  }
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1, 1); return tex;
}
function material(kind: string): THREE.MeshStandardMaterial {
  if (!materials[kind]) materials[kind] = new THREE.MeshStandardMaterial({ map: texture(kind), roughness: 1, color: '#ffffff' });
  return materials[kind];
}
function box(x: number, y: number, z: number, color: string): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(x, y, z), new THREE.MeshStandardMaterial({ color, roughness: .92 })); m.castShadow = m.receiveShadow = true; return m;
}
function roofGeometry(part: PartSource): THREE.BufferGeometry {
  const [sx, sy, sz] = part.size, x = sx / 2, z = sz / 2, low = -sy / 2, high = sy / 2;
  const v = [-x,low,-z, x,low,-z, x,high,0, -x,high,0, -x,low,z, x,low,z];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.setIndex([0,2,1,0,3,2,3,5,2,3,4,5,0,4,3,1,2,5,0,1,5,0,5,4]); g.computeVertexNormals();
  const uv = new Float32Array([0,0,1,0,1,1,0,1,0,0,1,0]); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g;
}
export function createPart(part: PartSource): THREE.Group {
  const group = new THREE.Group(); group.position.fromArray(part.position); group.rotation.y = part.yaw;
  group.userData = { id: part.id, kind: 'part', signature: JSON.stringify(part) };
  const mesh = new THREE.Mesh(part.role === 'roof' ? roofGeometry(part) : new THREE.BoxGeometry(...part.size), material(part.material)); mesh.castShadow = mesh.receiveShadow = true; group.add(mesh);
  // Timber framing is visible structure attached to this source wall, not a second editable wall.
  if (part.role === 'wall' && part.material === 'plaster') {
    const [x, y, z] = part.size, front = z < x;
    for (const offset of [-.46, .46]) {
      const post = box(front ? .11 : x + .025, y, front ? z + .025 : .11, '#644c37');
      if (front) post.position.x = x * offset; else post.position.z = z * offset;
      group.add(post);
    }
    const sill = box(x + .035, .11, z + .035, '#644c37'); sill.position.y = -y / 2 + .11; group.add(sill);
    const header = sill.clone(); header.position.y = y / 2 - .08; group.add(header);
  }
  if (part.role === 'roof') {
    // Long thin strips make the pitched thatch legible even at ordinary viewing distance.
    const [x, y, z] = part.size;
    for (const side of [-1, 1]) for (let i = 1; i <= 7; i++) {
      const t = i / 8, strip = box(x + .04, .035, .055, i % 2 ? '#988456' : '#b09b68');
      strip.position.set(0, y / 2 - y * t + .035, side * z / 2 * t); group.add(strip);
    }
    const ridge = box(x + .12, .16, .21, '#877047'); ridge.position.y = y / 2 + .06; group.add(ridge);
  }
  return group;
}
interface HumanRig { group: THREE.Group; pelvis: THREE.Group; torso: THREE.Group; leftLeg: THREE.Group; rightLeg: THREE.Group; leftArm: THREE.Group; rightArm: THREE.Group; head: THREE.Mesh }
function limb(length: number, radius: number, color: string): THREE.Group {
  const g = new THREE.Group(), m = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length - radius * 2, 3, 6), new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  m.position.y = -length / 2; m.castShadow = true; g.add(m); return g;
}
export function createHuman(resident: Resident, index: number): HumanRig {
  const group = new THREE.Group(), pelvis = new THREE.Group(), torso = new THREE.Group(); group.add(pelvis); pelvis.add(torso);
  group.userData = { id: resident.id, kind: 'resident' };
  const shirt = index % 2 ? '#9d684e' : '#65745b', trouser = '#4b493f', skin = index % 2 ? '#cda07c' : '#d7b38a';
  const body = box(.42, .55, .25, shirt); body.position.y = .28; torso.add(body);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(.23, .29, .32, 8), new THREE.MeshStandardMaterial({ color: shirt, roughness: 1 })); skirt.position.y = .02; skirt.castShadow = true; torso.add(skirt);
  const belt = box(.44, .055, .27, '#624932'); belt.position.y = .08; torso.add(belt);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.065, .075, .13, 6), new THREE.MeshStandardMaterial({ color: skin })); neck.position.y = .63; torso.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.15, 10, 8), new THREE.MeshStandardMaterial({ color: skin, roughness: .92 })); head.scale.set(.9, 1.1, .9); head.position.y = .81; head.castShadow = true; torso.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(.153, 10, 7, 0, Math.PI * 2, 0, Math.PI * .55), new THREE.MeshStandardMaterial({ color: index % 2 ? '#513a2d' : '#564a37', roughness: 1 })); hair.position.y = .83; hair.scale.set(.92, 1.1, .94); torso.add(hair);
  const nose = box(.045, .06, .06, skin); nose.position.set(0, .8, .15); torso.add(nose);
  const leftLeg = limb(.72, .095, trouser), rightLeg = limb(.72, .095, trouser); leftLeg.position.x = -.12; rightLeg.position.x = .12; pelvis.add(leftLeg, rightLeg);
  for (const leg of [leftLeg, rightLeg]) { const boot = box(.16, .13, .25, '#49382b'); boot.position.set(0, -.69, .045); leg.add(boot); }
  const leftArm = limb(.58, .075, shirt), rightArm = limb(.58, .075, shirt); leftArm.position.set(-.28, .52, 0); rightArm.position.set(.28, .52, 0); torso.add(leftArm, rightArm);
  for (const arm of [leftArm, rightArm]) { const hand = new THREE.Mesh(new THREE.SphereGeometry(.075, 6, 5), new THREE.MeshStandardMaterial({ color: skin })); hand.position.y = -.59; hand.castShadow = true; arm.add(hand); }
  return { group, pelvis, torso, leftLeg, rightLeg, leftArm, rightArm, head };
}
export function poseHuman(rig: HumanRig, resident: Resident, seconds: number): void {
  const p = Math.max(0, Math.min(1, resident.posture)), speed = Math.hypot(resident.velocity[0], resident.velocity[2]), stride = Math.sin(seconds * 6.5 + resident.id.length) * Math.min(.42, speed * .23) * (1 - p);
  rig.group.position.set(resident.position[0], resident.position[1] - (.9 - .38 * p), resident.position[2]);
  const q = new THREE.Quaternion().fromArray(resident.rotation); const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(q); rig.group.rotation.y = Math.atan2(forward.x, forward.z);
  rig.pelvis.position.y = .76 - p * .34; rig.torso.rotation.x = p * .12;
  rig.leftLeg.rotation.x = stride - p * 1.12; rig.rightLeg.rotation.x = -stride - p * 1.12;
  rig.leftArm.rotation.x = -stride * .65 - (resident.holding ? .7 : p * .22); rig.rightArm.rotation.x = stride * .65 - (resident.holding ? .7 : p * .22);
}
export function createThing(thing: Thing): THREE.Group {
  const group = new THREE.Group(); group.userData = { id: thing.id, kind: 'thing' };
  if (thing.kind === 'bag') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(...thing.size), material('cloth')); body.castShadow = body.receiveShadow = true; group.add(body);
    const flap = box(thing.size[0] * .95, thing.size[1] * .3, .026, '#6d5038'); flap.position.set(0, thing.size[1] * .23, thing.size[2] / 2 + .005); group.add(flap);
    for (const x of [-.3, .3]) { const strap = box(.045, thing.size[1] * .95, .02, '#513c29'); strap.position.set(thing.size[0] * x, 0, thing.size[2] / 2 + .022); group.add(strap); }
    const handle = new THREE.Mesh(new THREE.TorusGeometry(thing.size[0] * .22, .022, 4, 10, Math.PI), new THREE.MeshStandardMaterial({ color: '#493827' })); handle.position.y = thing.size[1] / 2; group.add(handle);
  } else if (thing.kind === 'food') {
    const loaf = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 7), new THREE.MeshStandardMaterial({ color: '#b69159', roughness: 1 })); loaf.scale.set(thing.size[0] / 2, thing.size[1] / 2, thing.size[2] / 2); loaf.castShadow = true; group.add(loaf);
  } else group.add(box(...thing.size, '#8b6847'));
  return group;
}
export function disposeMaterials(): void {
  for (const key of Object.keys(materials)) { materials[key].map?.dispose(); materials[key].dispose(); delete materials[key]; }
}
