import * as THREE from 'three';
import { drainageAt, ecologyAt, hash, heightAt, noise, channelRecipe } from '../world/geography';
import { sharedTerrainSurface } from '../world/terrain-surface';
import type { RegionSource } from '../world/types';

const earth = new THREE.Color('#728250'), meadow = new THREE.Color('#92945a'), woods = new THREE.Color('#526343'), heath = new THREE.Color('#858361'), rock = new THREE.Color('#8a8a79'), bank = new THREE.Color('#77785b');
export function createTerrain(source: RegionSource): THREE.Mesh {
  const { vertices, indices } = sharedTerrainSurface(source, heightAt), colors = new Float32Array(vertices.length);
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i], z = vertices[i + 2], e = ecologyAt(x, z, vertices[i+1]), d = drainageAt(x, z);
    const c = (e.habitat === 'woodland' ? woods : e.habitat === 'heath' ? heath : e.habitat === 'rock' ? rock : e.habitat === 'riverbank' ? bank : meadow).clone();
    c.lerp(earth, noise(x, z, 47, 51) * .35); c.multiplyScalar(.88 + noise(x, z, 22, 52) * .22);
    if (e.path > .15) c.lerp(new THREE.Color('#b6a383'), e.path * .7);
    if (d.distance < d.width * .5) c.multiplyScalar(.65);
    colors[i] = c.r; colors[i + 1] = c.g; colors[i + 2] = c.b;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(vertices, 3)); g.setAttribute('color', new THREE.BufferAttribute(colors, 3)); g.setIndex(new THREE.BufferAttribute(indices, 1)); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })); mesh.receiveShadow = true; mesh.userData = { kind: 'ground', id: 'ground' }; return mesh;
}
/** Clip each ribbon triangle, interpolating its established elevation at the edge. */
function clipWaterTriangle(points:THREE.Vector3[],halfX:number,halfZ:number):THREE.Vector3[]{
 let polygon=points;
 for(const [axis,bound,sign] of [['x',halfX,1],['x',-halfX,-1],['z',halfZ,1],['z',-halfZ,-1]] as const){
  const next:THREE.Vector3[]=[];
  for(let i=0;i<polygon.length;i++){
   const a=polygon[i],b=polygon[(i+1)%polygon.length],insideA=sign*(a[axis]-bound)<=0,insideB=sign*(b[axis]-bound)<=0;
   if(insideA)next.push(a);
   if(insideA!==insideB){const t=(bound-a[axis])/(b[axis]-a[axis]);next.push(a.clone().lerp(b,t));}
  }
  polygon=next;if(!polygon.length)break;
 }
 return polygon;
}
export function createWater(source: RegionSource): THREE.Group {
 const group=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:'#638b86',roughness:.26,metalness:.12,transparent:true,opacity:.86,side:THREE.DoubleSide});
 const halfX=source.extent[0]/2,halfZ=source.extent[1]/2;
 for(const channel of source.channels){
  const points:THREE.Vector3[]=[],original:number[]=[],vertices:number[]=[],indices:number[]=[];
  channel.points.forEach((p,i)=>{
   const a=channel.points[Math.max(0,i-1)],b=channel.points[Math.min(channel.points.length-1,i+1)],len=Math.hypot(b[0]-a[0],b[2]-a[2]);
   const dx=-(b[2]-a[2])/len*channel.width/2,dz=(b[0]-a[0])/len*channel.width/2;
   points.push(new THREE.Vector3(p[0]+dx,p[1]+.02,p[2]+dz),new THREE.Vector3(p[0]-dx,p[1]+.02,p[2]-dz));
   if(i){const n=i*2;original.push(n-2,n,n-1,n-1,n,n+1);}
  });
  for(let i=0;i<original.length;i+=3){
   const polygon=clipWaterTriangle([points[original[i]],points[original[i+1]],points[original[i+2]]],halfX,halfZ),start=vertices.length/3;
   for(const point of polygon)vertices.push(point.x,point.y,point.z);
   for(let j=1;j<polygon.length-1;j++)indices.push(start,start+j,start+j+1);
  }
  if(!indices.length)continue;
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();group.add(new THREE.Mesh(geometry,mat));
 }
 if(!group.children.length)mat.dispose();return group;
}

interface Tree { x: number; z: number; height: number; type: number; hue: number }
export function createVegetation(source: RegionSource): { group: THREE.Group; detail: THREE.Group; update(camera: THREE.Camera): void } {
  const group = new THREE.Group(), detail = new THREE.Group(), broad: Tree[] = [], firs: Tree[] = [];
  const halfX = source.extent[0] / 2, halfZ = source.extent[1] / 2;
  const inside=(x:number,z:number,radius=0)=>Math.abs(x)+radius<=halfX&&Math.abs(z)+radius<=halfZ;
  const acceptTree=(tree:Tree)=>inside(tree.x,tree.z,tree.height*.35);
  // Fixed world-coordinate sampling, ecological acceptance, coherent patches, bounded instances.
  for (let gx = -Math.ceil(halfX / 38); gx <= Math.ceil(halfX / 38); gx++) for (let gz = -Math.ceil(halfZ / 38); gz <= Math.ceil(halfZ / 38); gz++) {
    const x = gx * 38 + hash(gx, gz, 61) * 32, z = gz * 38 + hash(gx, gz, 62) * 32;
    if (Math.abs(x) > halfX || Math.abs(z) > halfZ || Math.hypot(x, z) < 260) continue;
    const e = ecologyAt(x, z), d = drainageAt(x, z);
    if (hash(gx, gz, 63) > e.density || d.distance < d.width + 5) continue;
    const t = { x, z, height: 11 + hash(gx, gz, 65) * 14, type: e.habitat === 'heath' || heightAt(x, z) > 210 ? 1 : 0, hue: hash(gx, gz, 66) };
    if(acceptTree(t))(t.type ? firs : broad).push(t);
  }
  for (let gx = -17; gx <= 17; gx++) for (let gz = -17; gz <= 17; gz++) {
    const x = gx * 16 + hash(gx, gz, 67) * 12, z = gz * 16 + hash(gx, gz, 68) * 12;
    if (!inside(x,z)||Math.hypot(x, z) > 275 || Math.hypot(x, z) < 20) continue;
    if (hash(gx, gz, 69) > ecologyAt(x, z).density || drainageAt(x, z).distance < 14) continue;
    const tree={ x, z, height: 7 + hash(gx, gz, 70) * 9, type: 0, hue: hash(gx, gz, 71) };if(acceptTree(tree))broad.push(tree);
  }
  // Deliberately placed shade trees preserve the home's open approach.
  const shade:Tree[]=[{x:16,z:-13,height:10,type:0,hue:.5},{x:-20,z:-9,height:11,type:0,hue:.3}];
  if(!source.resourceSites?.some(s=>s.id==='resource:apple')&&!source.retiredIds?.includes('resource:apple'))shade.push({x:-12,z:8,height:6.5,type:0,hue:.7});
  broad.push(...shade.filter(acceptTree));
  const dummy = new THREE.Object3D();
  for (const [trees, conifer] of [[broad, false], [firs, true]] as const) {
    const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.11, .17, 1, 5), new THREE.MeshStandardMaterial({ color: '#665342', roughness: 1 }), trees.length);
    const crown = new THREE.InstancedMesh(conifer ? new THREE.ConeGeometry(1, 1, 6) : new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ roughness: 1 }), trees.length);
    trees.forEach((t, i) => {
      const y = heightAt(t.x, t.z), h = t.height;
      dummy.position.set(t.x, y + h * .3, t.z); dummy.rotation.set(0, t.hue * Math.PI, .03 * (t.hue - .5)); dummy.scale.set(h * .14, h * .6, h * .14); dummy.updateMatrix(); trunk.setMatrixAt(i, dummy.matrix);
      dummy.position.y = y + h * (conifer ? .62 : .72); dummy.scale.set(h * (conifer ? .24 : .32), h * (conifer ? .9 : .36), h * (conifer ? .24 : .3)); dummy.updateMatrix(); crown.setMatrixAt(i, dummy.matrix);
      crown.setColorAt(i, new THREE.Color().setHSL(conifer ? .29 : .22 + t.hue * .07, .19 + t.hue * .15, .19 + t.hue * .11));
    });
    trunk.receiveShadow = true; crown.receiveShadow = true; group.add(trunk, crown);
  }
  const bushData: [number, number, number][] = [], rocks: [number, number, number][] = [];
  for (let i = 0; i < 1500; i++) {
    const x = (hash(i, 0, 80) - .5) * 800, z = (hash(i, 0, 81) - .5) * 800, e = ecologyAt(x, z);
    if (Math.hypot(x, z) < 9 || (Math.abs(x) < 2 && z > 0 && z < 12) || e.path > .3 || drainageAt(x, z).distance < 10) continue;
    const size=.25+hash(i,0,82)*.75;if(inside(x,z,size))(i%6?bushData:rocks).push([x,z,size]);
  }
  for (const [data, isRock] of [[bushData, false], [rocks, true]] as const) {
    const m = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, isRock ? 0 : 1), new THREE.MeshStandardMaterial({ color: isRock ? '#939485' : '#607148', roughness: 1 }), data.length);
    data.forEach(([x, z, s], i) => { dummy.position.set(x, heightAt(x, z) + s * .23, z); dummy.rotation.set(.2, i * .4, .1); dummy.scale.set(s, s * .48, s * .75); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); }); detail.add(m);
  }
  group.add(detail);
  return { group, detail, update(camera) { detail.visible = camera.position.distanceTo(new THREE.Vector3(0, heightAt(0, 0), 0)) < 1600; } };
}


interface LandscapeBundle {terrain:THREE.Mesh;water:THREE.Group;vegetation:ReturnType<typeof createVegetation>}
function disposeLandscapeObject(object:THREE.Object3D):void{
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
 object.traverse(node=>{if(node instanceof THREE.Mesh){geometries.add(node.geometry);for(const material of Array.isArray(node.material)?node.material:[node.material])materials.add(material);if(node instanceof THREE.InstancedMesh)node.dispose();}});
 for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();object.removeFromParent();
}
function stageLandscape(source:RegionSource):LandscapeBundle{
 let terrain:THREE.Mesh|undefined,water:THREE.Group|undefined,vegetation:ReturnType<typeof createVegetation>|undefined;
 try{terrain=createTerrain(source);water=createWater(source);vegetation=createVegetation(source);return {terrain,water,vegetation};}
 catch(error){if(terrain)disposeLandscapeObject(terrain);if(water)disposeLandscapeObject(water);if(vegetation)disposeLandscapeObject(vegetation.group);throw error;}
}
function landscapeSignature(source:RegionSource):string{
 const legacyShadeSuppressed=!!source.resourceSites?.some(site=>site.id==='resource:apple')||!!source.retiredIds?.includes('resource:apple');
 return JSON.stringify([source.extent,channelRecipe(source.channels),source.seed,source.terrainVersion,legacyShadeSuppressed]);
}
/** A derived scene projection with one stable parent. Only accepted recipe changes replace it. */
export function createLandscapeProjection(scene:THREE.Scene,source:RegionSource){
 const group=new THREE.Group();let current=stageLandscape(source),signature=landscapeSignature(source),disposed=false;
 const attach=(bundle:LandscapeBundle)=>group.add(bundle.terrain,bundle.water,bundle.vegetation.group);
 const release=(bundle:LandscapeBundle)=>{disposeLandscapeObject(bundle.terrain);disposeLandscapeObject(bundle.water);disposeLandscapeObject(bundle.vegetation.group);};
 attach(current);scene.add(group);
 return {
  group,get terrain(){return current.terrain;},
  sync(nextSource:RegionSource):boolean{
   const nextSignature=landscapeSignature(nextSource);if(disposed||nextSignature===signature)return false;
   const next=stageLandscape(nextSource);attach(next);const previous=current;current=next;signature=nextSignature;release(previous);return true;
  },
  update(camera:THREE.Camera){if(!disposed)current.vegetation.update(camera);},
  dispose(){if(disposed)return;disposed=true;release(current);group.removeFromParent();},
 };
}
