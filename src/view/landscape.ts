import * as THREE from 'three';
import { drainageAt, ecologyAt, hash, heightAt, noise, channelRecipe } from '../world/geography';
import { sharedTerrainSurface } from '../world/terrain-surface';
import type { RegionSource } from '../world/types';

const earth = new THREE.Color('#728250'), meadow = new THREE.Color('#92945a'), woods = new THREE.Color('#526343'), heath = new THREE.Color('#858361'), rock = new THREE.Color('#8a8a79'), bank = new THREE.Color('#77785b');
/** Small generated mineral/leaf grain. No downloaded texture or random stream. */
function groundGrain():THREE.DataTexture{
  const size=128,data=new Uint8Array(size*size*4);
  for(let z=0;z<size;z++)for(let x=0;x<size;x++){
    const grain=hash(x,z,107),fleck=grain>.975?-.15:0;
    const value=Math.round(255*(.78+grain*.2+fleck)),i=(z*size+x)*4;
    data[i]=value;data[i+1]=value;data[i+2]=Math.round(value*.96);data[i+3]=255;
  }
  const texture=new THREE.DataTexture(data,size,size);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;
  return texture;
}
export function createTerrain(source: RegionSource): THREE.Mesh {
  const { vertices, indices } = sharedTerrainSurface(source, heightAt), colors = new Float32Array(vertices.length),uvs=new Float32Array(vertices.length/3*2);
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i], z = vertices[i + 2], e = ecologyAt(x, z, vertices[i+1]), d = drainageAt(x, z);
    const c = (e.habitat === 'woodland' ? woods : e.habitat === 'heath' ? heath : e.habitat === 'rock' ? rock : e.habitat === 'riverbank' ? bank : meadow).clone();
    c.lerp(earth, noise(x, z, 47, 51) * .35); c.multiplyScalar(.87 + noise(x, z, 9, 52) * .23);
    if (e.path > .05) c.lerp(new THREE.Color('#b4a083'), e.path * .83);
    if (d.distance < d.width * .5) c.multiplyScalar(.65);
    colors[i] = c.r; colors[i + 1] = c.g; colors[i + 2] = c.b;
    uvs[i/3*2]=x/3;uvs[i/3*2+1]=z/3;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(vertices, 3)); g.setAttribute('color', new THREE.BufferAttribute(colors, 3));g.setAttribute('uv',new THREE.BufferAttribute(uvs,2)); g.setIndex(new THREE.BufferAttribute(indices, 1)); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true,map:groundGrain(), roughness: 1 })); mesh.receiveShadow = true; mesh.userData = { kind: 'ground', id: 'ground' }; return mesh;
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
 const group=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:'#62877c',roughness:.3,metalness:.04,transparent:true,opacity:.91,side:THREE.DoubleSide,vertexColors:true});
 const halfX=source.extent[0]/2,halfZ=source.extent[1]/2;
 for(const channel of source.channels){
  const points:THREE.Vector3[]=[],original:number[]=[],vertices:number[]=[],indices:number[]=[];
  channel.points.forEach((p,i)=>{
   const a=channel.points[Math.max(0,i-1)],b=channel.points[Math.min(channel.points.length-1,i+1)],len=Math.hypot(b[0]-a[0],b[2]-a[2]);
   const dx=-(b[2]-a[2])/len*channel.width/2,dz=(b[0]-a[0])/len*channel.width/2;
   points.push(new THREE.Vector3(p[0]+dx,p[1]+.02,p[2]+dz),new THREE.Vector3(p[0],p[1]+.02,p[2]),new THREE.Vector3(p[0]-dx,p[1]+.02,p[2]-dz));
   if(i){const n=i*3;original.push(n-3,n,n-2,n-2,n,n+1,n-2,n+1,n-1,n-1,n+1,n+2);}
  });
  for(let i=0;i<original.length;i+=3){
   const polygon=clipWaterTriangle([points[original[i]],points[original[i+1]],points[original[i+2]]],halfX,halfZ),start=vertices.length/3;
   for(const point of polygon)vertices.push(point.x,point.y,point.z);
   for(let j=1;j<polygon.length-1;j++)indices.push(start,start+j,start+j+1);
  }
  if(!indices.length)continue;
  const colors:number[]=[];
  for(let i=0;i<vertices.length;i+=3){
   let distance=Infinity;
   for(let j=1;j<channel.points.length;j++){
    const a=channel.points[j-1],b=channel.points[j],dx=b[0]-a[0],dz=b[2]-a[2],length2=dx*dx+dz*dz;
    const t=length2?Math.max(0,Math.min(1,((vertices[i]-a[0])*dx+(vertices[i+2]-a[2])*dz)/length2)):0;
    distance=Math.min(distance,Math.hypot(vertices[i]-a[0]-dx*t,vertices[i+2]-a[2]-dz*t));
   }
   const shore=Math.min(1,distance/(channel.width*.5));
   const color=new THREE.Color('#4e706b').lerp(new THREE.Color('#afba8f'),shore*shore*.65);color.multiplyScalar(.92+noise(vertices[i],vertices[i+2],9,108)*.13);colors.push(color.r,color.g,color.b);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();group.add(new THREE.Mesh(geometry,mat));
 }
 if(!group.children.length)mat.dispose();return group;
}

interface Tree { x: number; z: number; height: number; type: number; hue: number }
interface Understory {x:number;z:number;size:number;hue:number}
/** Visual population only. Resource forms keep their own identity and material state. */
export function createVegetation(source: RegionSource): { group: THREE.Group; detail: THREE.Group; update(camera: THREE.Camera): void } {
  const group=new THREE.Group(),detail=new THREE.Group(),broad:Tree[]=[],firs:Tree[]=[];
  const halfX=source.extent[0]/2,halfZ=source.extent[1]/2;
  const inside=(x:number,z:number,radius=0)=>Math.abs(x)+radius<=halfX&&Math.abs(z)+radius<=halfZ;
  const acceptTree=(t:Tree)=>inside(t.x,t.z,t.height*.48)&&ecologyAt(t.x,t.z).path<.06;
  // Patch fields and per-coordinate hashes preserve composition independently of extent/order.
  const populate=(spacing:number,near:boolean)=>{
    const limitX=near?Math.min(halfX,270):halfX,limitZ=near?Math.min(halfZ,270):halfZ;
    for(let gx=-Math.ceil(limitX/spacing);gx<=Math.ceil(limitX/spacing);gx++)for(let gz=-Math.ceil(limitZ/spacing);gz<=Math.ceil(limitZ/spacing);gz++){
      const x=(gx+hash(gx,gz,61)*.8)*spacing,z=(gz+hash(gx,gz,62)*.8)*spacing,r=Math.hypot(x,z);
      if(!inside(x,z)||r<24||(near?r>275:r<260))continue;
      const e=ecologyAt(x,z),d=drainageAt(x,z),grove=noise(x,z,95,93);
      const density=e.density*(.45+grove*1.15);
      if(hash(gx,gz,near?69:63)>density||d.distance<d.width+5)continue;
      const t={x,z,height:(near?7:11)+hash(gx,gz,65)*(near?10:14),type:e.habitat==='heath'||heightAt(x,z)>210?1:0,hue:hash(gx,gz,66)};
      if(acceptTree(t))(t.type?firs:broad).push(t);
    }
  };
  populate(38,false);populate(13,true);
  // Unequal trees around the meadow, with open views and walking space between groves.
  const shade:Tree[]=[{x:14,z:-12,height:9,type:0,hue:.5},{x:-22,z:-15,height:12,type:0,hue:.3},
    {x:35,z:-28,height:14,type:0,hue:.72},{x:40,z:-34,height:10,type:0,hue:.45},
    {x:-40,z:37,height:13,type:0,hue:.16},{x:-46,z:43,height:9,type:0,hue:.58},
    {x:28,z:48,height:12,type:0,hue:.65},{x:34,z:53,height:8,type:0,hue:.36}];
  if(!source.resourceSites?.some(s=>s.id==='resource:apple')&&!source.retiredIds?.includes('resource:apple'))shade.push({x:-12,z:8,height:6.5,type:0,hue:.7});
  broad.push(...shade.filter(acceptTree));
  const dummy=new THREE.Object3D(),color=new THREE.Color(),trunkMaterial=new THREE.MeshStandardMaterial({color:'#63503e',roughness:1});
  const local=(t:Tree)=>Math.hypot(t.x,t.z)<275;
  for(const [trees,conifer,near] of [[broad.filter(local),false,true],[broad.filter(t=>!local(t)),false,false],[firs.filter(local),true,true],[firs.filter(t=>!local(t)),true,false]] as const){
    const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.1,.17,1,6),trunkMaterial,trees.length);
    const crownGeometry=conifer?new THREE.ConeGeometry(1,1,7):new THREE.IcosahedronGeometry(1,near?1:0);
    const crowns=new THREE.InstancedMesh(crownGeometry,new THREE.MeshStandardMaterial({roughness:1}),trees.length*3);
    const branches=new THREE.InstancedMesh(new THREE.CylinderGeometry(.035,.07,1,5),trunkMaterial,trees.length*2);
    trees.forEach((t,i)=>{
      const y=heightAt(t.x,t.z),h=t.height,angle=t.hue*Math.PI*2;
      dummy.position.set(t.x,y+h*.31,t.z);dummy.rotation.set(.025*(t.hue-.5),angle,.035*(t.hue-.5));dummy.scale.set(h*.16,h*.62,h*.16);dummy.updateMatrix();trunk.setMatrixAt(i,dummy.matrix);
      for(let lobe=0;lobe<3;lobe++){
        const a=angle+lobe*2.4,offset=conifer?0:h*(lobe===2?.04:.14),level=conifer?.48+lobe*.18:.66+lobe*.09;
        dummy.position.set(t.x+Math.cos(a)*offset,y+h*level,t.z+Math.sin(a)*offset);
        dummy.rotation.set(conifer?0:.12*Math.sin(a),a,conifer?0:.08*Math.cos(a));
        const spread=conifer?.26-lobe*.065:.25+(lobe===0?.025:0);
        dummy.scale.set(h*spread,h*(conifer?.48:.24+(lobe===2?.035:0)),h*spread*(.82+t.hue*.2));dummy.updateMatrix();crowns.setMatrixAt(i*3+lobe,dummy.matrix);
        color.setHSL(conifer?.29:.22+t.hue*.065,.21+t.hue*.12,(conifer?.19:.23)+t.hue*.07+lobe*.016);crowns.setColorAt(i*3+lobe,color);
      }
      for(let limb=0;limb<2;limb++){
        const a=angle+limb*2.6;dummy.position.set(t.x+Math.cos(a)*h*.07,y+h*(.5+limb*.085),t.z+Math.sin(a)*h*.07);
        dummy.rotation.set(.55*Math.sin(a),0,-.55*Math.cos(a));dummy.scale.set(h*.2,h*.25,h*.2);dummy.updateMatrix();branches.setMatrixAt(i*2+limb,dummy.matrix);
      }
    });
    for(const mesh of [trunk,branches,crowns]){mesh.receiveShadow=true;mesh.castShadow=near;group.add(mesh);}
  }
  const shrubs:Understory[]=[],stones:Understory[]=[],grass=new Map<string,Understory[]>();
  // Undergrowth follows clearings, forest edges and damp ground, with bare walking lines.
  const limitX=Math.min(halfX,280),limitZ=Math.min(halfZ,280);
  for(let gx=-Math.ceil(limitX/4);gx<=Math.ceil(limitX/4);gx++)for(let gz=-Math.ceil(limitZ/4);gz<=Math.ceil(limitZ/4);gz++){
    const x=(gx+hash(gx,gz,80)) *4,z=(gz+hash(gx,gz,81))*4,e=ecologyAt(x,z),d=drainageAt(x,z),hue=hash(gx,gz,82);
    if(!inside(x,z,1.5)||(Math.abs(x)<6&&Math.abs(z)<5)||Math.hypot(x,z)<8||e.path>.12||d.distance<d.width*.5+2)continue;
    const patch=noise(x,z,23,94);
    if(hash(gx,gz,83)<.12+e.density*.4&&patch>.42){
      const size=.4+hue*.9;shrubs.push({x,z,size,hue});
    }else if(hash(gx,gz,84)<.025&&patch<.5)stones.push({x,z,size:.25+hue*.65,hue});
  }
  for(const [data,isRock] of [[shrubs,false],[stones,true]] as const){
    const mesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,isRock?0:1),new THREE.MeshStandardMaterial({roughness:1}),data.length*(isRock?1:2));
    data.forEach((t,i)=>{
      const y=heightAt(t.x,t.z);
      for(let lobe=0;lobe<(isRock?1:2);lobe++){
        dummy.position.set(t.x+(lobe?.3*t.size:0),y+t.size*(lobe?.5:.3),t.z);dummy.rotation.set(.1,t.hue*6,.08);
        dummy.scale.set(t.size*(lobe?.6:1),t.size*(isRock?.48:lobe?.7:.55),t.size*.72);dummy.updateMatrix();const index=isRock?i:i*2+lobe;mesh.setMatrixAt(index,dummy.matrix);
        color.set(isRock?'#969287':'#657349').multiplyScalar(.8+t.hue*.3+lobe*.06);mesh.setColorAt(index,color);
      }
    });mesh.receiveShadow=true;detail.add(mesh);
  }
  // Tapered three-blade tufts: close geometry, grouped for camera-distance drawing.
  const bladeVertices:number[]=[],bladeColors:number[]=[];
  for(let blade=0;blade<3;blade++){
    const a=blade*Math.PI*2/3,dx=Math.cos(a),dz=Math.sin(a),sx=-dz*.09,sz=dx*.09;
    const points=[[-sx,0,-sz],[sx,0,sz],[dx*.14,.7,dz*.14],[dx*.14,.7,dz*.14],[sx,0,sz],[dx*.2,1,dz*.2]];
    for(const p of points){bladeVertices.push(...p);const c=new THREE.Color(p[1]>.5?'#a2a775':'#50633b');bladeColors.push(c.r,c.g,c.b);}
  }
  const bladeGeometry=new THREE.BufferGeometry();bladeGeometry.setAttribute('position',new THREE.Float32BufferAttribute(bladeVertices,3));bladeGeometry.setAttribute('color',new THREE.Float32BufferAttribute(bladeColors,3));bladeGeometry.computeVertexNormals();
  const bladeMaterial=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:1});
  const grassX=Math.min(halfX,155),grassZ=Math.min(halfZ,155);
  for(let gx=-Math.ceil(grassX/2.4);gx<=Math.ceil(grassX/2.4);gx++)for(let gz=-Math.ceil(grassZ/2.4);gz<=Math.ceil(grassZ/2.4);gz++){
    const x=(gx+hash(gx,gz,95))*2.4,z=(gz+hash(gx,gz,96))*2.4,e=ecologyAt(x,z),d=drainageAt(x,z);
    if(!inside(x,z,.65)||(Math.abs(x)<6&&Math.abs(z)<5)||Math.hypot(x,z)<7||e.path>.18||d.distance<d.width*.5+1.5||hash(gx,gz,97)>noise(x,z,14,98)*.8)continue;
    const key=`${Math.floor(x/32)},${Math.floor(z/32)}`,data=grass.get(key)??[];data.push({x,z,size:.18+hash(gx,gz,99)*.48,hue:hash(gx,gz,100)});grass.set(key,data);
  }
  const grassTiles:{mesh:THREE.InstancedMesh;centre:THREE.Vector3}[]=[];
  for(const [key,data] of grass){
    const mesh=new THREE.InstancedMesh(bladeGeometry,bladeMaterial,data.length),[tx,tz]=key.split(',').map(Number);
    data.forEach((t,i)=>{dummy.position.set(t.x,heightAt(t.x,t.z)-.015,t.z);dummy.rotation.set(0,t.hue*6.28,0);dummy.scale.set(.55+t.hue*.5,t.size,.55+t.hue*.5);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);color.setHSL(.19+t.hue*.08,.21,.7+t.hue*.15);mesh.setColorAt(i,color);});
    mesh.receiveShadow=true;detail.add(mesh);grassTiles.push({mesh,centre:new THREE.Vector3(tx*32+16,heightAt(tx*32+16,tz*32+16),tz*32+16)});
  }
  if(!grass.size){bladeGeometry.dispose();bladeMaterial.dispose();}
  group.add(detail);
  return {group,detail,update(camera){
    // Residency of visual detail does not define world state, resources or collision.
    for(const tile of grassTiles)tile.mesh.visible=camera.position.distanceToSquared(tile.centre)<220*220;
    detail.visible=camera.position.distanceToSquared(new THREE.Vector3(0,heightAt(0,0),0))<1100*1100;
  }};
}


interface LandscapeBundle {terrain:THREE.Mesh;water:THREE.Group;vegetation:ReturnType<typeof createVegetation>}
function disposeLandscapeObject(object:THREE.Object3D):void{
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
 object.traverse(node=>{if(node instanceof THREE.Mesh){geometries.add(node.geometry);for(const material of Array.isArray(node.material)?node.material:[node.material])materials.add(material);if(node instanceof THREE.InstancedMesh)node.dispose();}});
 for(const geometry of geometries)geometry.dispose();for(const material of materials){if(material instanceof THREE.MeshStandardMaterial&&material.map)textures.add(material.map);material.dispose();}for(const texture of textures)texture.dispose();object.removeFromParent();
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
