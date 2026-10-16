import type {Vec3,Quat,WorldState} from '../world/types';
type Solid={position:Vec3;size:Vec3;rotation?:Quat;yaw?:number};
function rotate(v:Vec3,q:Quat):Vec3{
 const [x,y,z,w]=q,[a,b,c]=v,tx=2*(y*c-z*b),ty=2*(z*a-x*c),tz=2*(x*b-y*a);
 return [a+w*tx+y*tz-z*ty,b+w*ty+z*tx-x*tz,c+w*tz+x*ty-y*tx];
}
function rotation(box:Solid):Quat{return box.rotation??[0,Math.sin((box.yaw??0)/2),0,Math.cos((box.yaw??0)/2)];}
/** Same oriented boxes as the native adapter. Art geometry is not collision truth. */
export function segmentHitsSolid(a:Vec3,b:Vec3,box:Solid):boolean {
 const q=rotation(box),inverse:Quat=[-q[0],-q[1],-q[2],q[3]];
 const local=(p:Vec3)=>rotate(p.map((v,i)=>v-box.position[i]) as Vec3,inverse);
 const start=local(a),end=local(b);let lo=0,hi=1;
 for(let i=0;i<3;i++){
  const d=end[i]-start[i],half=box.size[i]/2;
  if(Math.abs(d)<1e-9){if(Math.abs(start[i])>half)return false;continue;}
  let u=(-half-start[i])/d,v=(half-start[i])/d;if(u>v)[u,v]=[v,u];lo=Math.max(lo,u);hi=Math.min(hi,v);if(lo>hi)return false;
 }
 return lo<.998&&hi>.002;
}
export function occluded(state:WorldState,a:Vec3,b:Vec3,omit:ReadonlyArray<string>=[]):boolean {
 return state.source.home.parts.some(p=>p.solid&&!omit.includes(p.id)&&segmentHitsSolid(a,b,p))||
  state.things.some(t=>!t.consumed&&t.kind!=='food'&&!omit.includes(t.id)&&segmentHitsSolid(a,b,t));
}
export function solidBounds(box:Solid):{position:Vec3;size:Vec3}{
 const points:Vec3[]=[];for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])points.push(rotate([x*box.size[0]/2,y*box.size[1]/2,z*box.size[2]/2],rotation(box)));
 const low=[0,1,2].map(i=>Math.min(...points.map(p=>p[i]))),high=[0,1,2].map(i=>Math.max(...points.map(p=>p[i])));
 return {position:box.position.map((v,i)=>v+(low[i]+high[i])/2) as Vec3,size:high.map((v,i)=>v-low[i]) as Vec3};
}
