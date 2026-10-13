import Box3D, { type Box3DModule, type b3BodyId, type b3ShapeId, type b3MeshData } from 'box3d.js/inline';
import type { Drive, PartSource, Quat, Resident, Vec3, WorldState } from '../world/types';

const MASS=80, GRAVITY=9.81, MAX_LEG_FORCE=1800, MAX_DRIVE_FORCE=240, MAX_GRIP_FORCE=120;
let modulePromise: Promise<Box3DModule>|undefined;
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const length=(v:Vec3)=>Math.hypot(...v);
const scaled=(v:Vec3,limit:number):Vec3=>{const s=Math.min(1,limit/(length(v)||1));return [v[0]*s,v[1]*s,v[2]*s];};
const yawQuat=(a:number):Quat=>[0,Math.sin(a/2),0,Math.cos(a/2)];
const yawOf=(q:Quat)=>Math.atan2(2*(q[3]*q[1]+q[0]*q[2]),1-2*(q[1]*q[1]+q[2]*q[2]));
const capsule=(posture:number)=>({center1:[0,-(.59-.38*posture),0] as Vec3,center2:[0,.59-.38*posture,0] as Vec3,radius:.31});
const bodyKey=(b:b3BodyId)=>`${b.index1}:${b.world0}:${b.generation}`;

/** One solver. Transforms come from native bodies; finite virtual legs are an explicit idealization. */
export async function createPhysics(state:WorldState, ground:(x:number,z:number)=>number):Promise<WorldPhysics>{
  modulePromise??=Box3D();
  return new WorldPhysics(await modulePromise,state,ground);
}

export class WorldPhysics {
  readonly bodies=new Map<string,b3BodyId>();
  readonly metrics={maxSupportForce:0,maxGripForce:0,lastSupportForce:new Map<string,number>(),steps:0};
  private shapes=new Map<string,b3ShapeId>();
  private meshes:b3MeshData[]=[];
  private halfHeights=new Map<string,number>();
  private groundFilter;
  private world;
  private disposed=false;
  private gripStrain=new Map<string,number>();

  constructor(private b3:Box3DModule,state:WorldState,ground:(x:number,z:number)=>number){
    const def=b3.b3DefaultWorldDef();def.gravity=[0,-GRAVITY,0];def.enableSleep=true;
    this.world=b3.b3CreateWorld(def);
    this.groundFilter=b3.b3DefaultQueryFilter();this.groundFilter.maskBits=3n;
    this.installGround(state.source.extent,ground);
    for(const part of state.source.home.parts)if(part.solid)this.installPart(part);
    for(const a of state.residents){
      const d=b3.b3DefaultBodyDef();d.type=b3.b3BodyType.b3_dynamicBody;d.position=[...a.position];d.rotation=[...a.rotation];
      d.enableSleep=false;d.motionLocks.angularX=true;d.motionLocks.angularZ=true;d.angularDamping=3;
      const body=b3.b3CreateBody(this.world,d), cap=capsule(a.posture), s=b3.b3DefaultShapeDef();
      s.density=MASS/b3.b3ComputeCapsuleMass(cap,1).mass;s.baseMaterial.friction=.12;s.baseMaterial.restitution=0;s.filter.categoryBits=4n;
      this.shapes.set(a.id,b3.b3CreateCapsuleShape(body,s,cap));this.bodies.set(a.id,body);this.halfHeights.set(a.id,.9-.38*a.posture);
      b3.b3Body_SetTransform(body,a.position,a.rotation);
      b3.b3Body_SetLinearVelocity(body,a.velocity);b3.b3Body_SetAngularVelocity(body,a.angularVelocity);
    }
    for(const t of state.things){
      if(t.consumed)continue;
      const d=b3.b3DefaultBodyDef();d.type=b3.b3BodyType.b3_dynamicBody;d.position=[...t.position];d.rotation=[...t.rotation];d.linearDamping=.03;d.angularDamping=.05;
      const body=b3.b3CreateBody(this.world,d), s=b3.b3DefaultShapeDef();s.filter.categoryBits=2n;
      s.density=t.mass/(t.size[0]*t.size[1]*t.size[2]);s.baseMaterial.friction=.6;s.baseMaterial.restitution=0;
      this.shapes.set(t.id,b3.b3CreateBoxShape(body,s,t.size[0]/2,t.size[1]/2,t.size[2]/2));this.bodies.set(t.id,body);
      b3.b3Body_SetTransform(body,t.position,t.rotation);
      b3.b3Body_SetLinearVelocity(body,t.velocity);b3.b3Body_SetAngularVelocity(body,t.angularVelocity);
    }
  }

  private installGround(extent:[number,number],height:(x:number,z:number)=>number){
    // Sampling geometry is not a world occupancy grid. Refine the inhabited neighbourhood.
    const axis=(span:number)=>Array.from(new Set([...Array.from({length:Math.ceil(span/40)+1},(_,i)=>-span/2+i*40),...Array.from({length:129},(_,i)=>-128+i*2),span/2])).sort((a,b)=>a-b);
    const xs=axis(extent[0]),zs=axis(extent[1]),v=new Float32Array(xs.length*zs.length*3),idx:number[]=[];
    for(let j=0;j<zs.length;j++)for(let i=0;i<xs.length;i++){
      const n=j*xs.length+i;v.set([xs[i],height(xs[i],zs[j]),zs[j]],n*3);
      if(j<zs.length-1&&i<xs.length-1){const b=n+xs.length;idx.push(n,b,n+1,n+1,b,b+1);}
    }
    const mesh=this.b3.b3CreateMesh(v,new Uint32Array(idx));if(!mesh)throw new Error('Nie udało się utworzyć geometrii terenu');
    this.meshes.push(mesh);const d=this.b3.b3DefaultBodyDef(),body=this.b3.b3CreateBody(this.world,d),s=this.b3.b3DefaultShapeDef();s.baseMaterial.friction=.7;
    this.b3.b3CreateMeshShape(body,s,mesh,[1,1,1]);this.bodies.set('terrain',body);
  }

  private installPart(part:PartSource){
    const d=this.b3.b3DefaultBodyDef();d.position=[...part.position];d.rotation=yawQuat(part.yaw);
    const body=this.b3.b3CreateBody(this.world,d),s=this.b3.b3DefaultShapeDef();s.baseMaterial.friction=.65;
    this.shapes.set(part.id,this.b3.b3CreateBoxShape(body,s,...part.size.map(n=>n/2) as Vec3));this.bodies.set(part.id,body);
  }

  /** Called at a paused completed-step boundary. No solve occurs with duplicate geometry. */
  replacePart(part:PartSource){
    const body=this.bodies.get(part.id),old=this.shapes.get(part.id);
    if(!body||!old)throw new Error('Nieznana część fizyczna');
    const def=this.b3.b3DefaultShapeDef();def.updateBodyMass=false;def.baseMaterial.friction=.65;
    const next=this.b3.b3CreateBoxShape(body,def,...part.size.map(n=>n/2) as Vec3);
    if(!this.b3.b3Shape_IsValid(next))throw new Error('Nie udało się przygotować nowego kształtu');
    this.b3.b3DestroyShape(old,false);this.b3.b3Body_SetTransform(body,part.position,yawQuat(part.yaw));this.shapes.set(part.id,next);
  }

  private support(a:Resident,desired:Vec3){
    const half=this.halfHeights.get(a.id)??.9,feet=a.position[1]-half;
    const speed=Math.hypot(desired[0],desired[2]);
    const offsets:Vec3[]=[[0,0,0]];
    if(speed>.05)offsets.push([desired[0]/speed*.4,0,desired[2]/speed*.4]);
    let best: {body:b3BodyId;point:Vec3;normal:Vec3}|null=null;
    for(const o of offsets){
      const hit=this.b3.b3World_CastRayClosest(this.world,[a.position[0]+o[0],feet+.22,a.position[2]+o[2]],[0,-.49,0],this.groundFilter);
      if(!hit.hit||hit.normal[1]<.6)continue;
      // A held bag cannot be its carrier's floor.
      const body=this.b3.b3Shape_GetBody(hit.shapeId);
      if(a.holding&&bodyKey(body)===bodyKey(this.bodies.get(a.holding)!))continue;
      const point=[...hit.point] as Vec3;
      if(!best||point[1]>best.point[1])best={body,point,normal:[...hit.normal] as Vec3};
    }
    return best;
  }

  private drive(a:Resident,drive:Drive,dt:number){
    const body=this.bodies.get(a.id)!,b=this.b3;
    const target=clamp(drive.posture,0,1),posture=a.posture+clamp(target-a.posture,-dt*.65,dt*.65);
    if(Math.abs(posture-a.posture)>.0001){
      const newHalf=.9-.38*posture;
      // Expansion must not grow into somebody or a wall. Current occupancy is checked before accepting it.
      const expanded=newHalf>(this.halfHeights.get(a.id)??.9);
      let blocked=false;
      if(expanded){
        const q=b.b3DefaultQueryFilter();q.maskBits=7n;
        // Narrow phase: the whole terrain's broad-phase bounds are not a ceiling.
        b.b3World_OverlapShape(this.world,[a.position[0],a.position[1]+newHalf-.31,a.position[2]],new Float32Array([0,0,0]),.30,q,(shape:b3ShapeId)=>{
          if(bodyKey(b.b3Shape_GetBody(shape))!==bodyKey(body))blocked=true;return true;
        });
      }
      if(!blocked){
        const shape=this.shapes.get(a.id)!,cap=capsule(posture);
        b.b3Shape_SetCapsule(shape,cap);b.b3Shape_SetDensity(shape,MASS/b.b3ComputeCapsuleMass(cap,1).mass,false);b.b3Body_ApplyMassFromShapes(body);
        a.posture=posture;this.halfHeights.set(a.id,newHalf);
      }
    }
    const desired=drive.velocity,support=this.support(a,desired);
    this.metrics.lastSupportForce.set(a.id,0);
    if(support){
      const supportV:Vec3=[0,0,0];b.b3Body_GetWorldPointVelocity(supportV,support.body,support.point);
      const half=this.halfHeights.get(a.id)??.9,error=support.point[1]+half+.008-a.position[1];
      const fy=clamp(MASS*GRAVITY+8500*error-650*(a.velocity[1]-supportV[1]),0,MAX_LEG_FORCE);
      const delta:Vec3=[(desired[0]+supportV[0]-a.velocity[0])*MASS*8,0,(desired[2]+supportV[2]-a.velocity[2])*MASS*8];
      const horizontal=scaled(delta,MAX_DRIVE_FORCE),impulse:Vec3=[horizontal[0]*dt,fy*dt,horizontal[2]*dt];
      b.b3Body_ApplyLinearImpulseToCenter(body,impulse,true);
      b.b3Body_ApplyLinearImpulse(support.body,[-impulse[0],-impulse[1],-impulse[2]],support.point,true);
      this.metrics.lastSupportForce.set(a.id,fy);this.metrics.maxSupportForce=Math.max(this.metrics.maxSupportForce,fy);
    }
    if(Math.hypot(desired[0],desired[2])>.1){
      const want=Math.atan2(desired[0],desired[2]),angle=Math.atan2(Math.sin(want-yawOf(a.rotation)),Math.cos(want-yawOf(a.rotation)));
      const torque=clamp(angle*100-a.angularVelocity[1]*25,-80,80);b.b3Body_ApplyTorque(body,[0,torque,0],true);
    }
  }

  private grips(state:WorldState,dt:number){
    for(const a of state.residents){
      if(!a.holding)continue;const t=state.things.find(t=>t.id===a.holding);
      const actor=this.bodies.get(a.id),body=t&&this.bodies.get(t.id);if(!t||!actor||!body)continue;
      const point:Vec3=[0,0,0],velocity:Vec3=[0,0,0];
      this.b3.b3Body_GetWorldPoint(point,actor,[0,.22,.62]);this.b3.b3Body_GetWorldPointVelocity(velocity,actor,point);
      const raw:Vec3=point.map((n,i)=>(n-t.position[i])*600+(velocity[i]-t.velocity[i])*75) as Vec3;
      const force=scaled(raw,MAX_GRIP_FORCE),impulse=force.map(n=>n*dt) as Vec3;
      this.b3.b3Body_ApplyLinearImpulseToCenter(body,impulse,true);
      this.b3.b3Body_ApplyLinearImpulse(actor,impulse.map(n=>-n) as Vec3,point,true);
      this.metrics.maxGripForce=Math.max(this.metrics.maxGripForce,length(force));
      const strain=length(raw)>MAX_GRIP_FORCE*1.8?(this.gripStrain.get(a.id)??0)+dt:0;this.gripStrain.set(a.id,strain);
      if(strain>1.2)this.release(a.id,state,'Chwyt przekroczył wytrzymałość');
    }
  }

  release(id:string,state:WorldState,detail='Odłożył własną torbę'){
    const a=state.residents.find(r=>r.id===id),t=state.things.find(t=>t.id===a?.holding);if(!a||!t)return false;
    a.holding=null;t.heldBy=null;this.gripStrain.delete(id);
    state.events.push({time:state.seconds,kind:'placed',actor:id,target:t.id,detail});
    a.memories.push({time:state.seconds,kind:'placed',target:t.id,detail});return true;
  }

  step(dt:number,drives:Map<string,Drive>,state:WorldState){
    if(this.disposed)throw new Error('Zamknięta fizyka');
    this.sync(state);
    for(const a of state.residents)this.drive(a,drives.get(a.id)??{velocity:[0,0,0],posture:a.posture},dt);
    this.grips(state,dt);this.b3.b3World_Step(this.world,dt,4);this.metrics.steps++;this.sync(state);
    for(const t of state.things)if(t.consumed&&this.bodies.has(t.id)){
      this.b3.b3DestroyBody(this.bodies.get(t.id)!);this.bodies.delete(t.id);this.shapes.delete(t.id);
    }
  }

  sync(state:WorldState){
    for(const a of [...state.residents,...state.things]){
      const body=this.bodies.get(a.id);if(!body)continue;
      this.b3.b3Body_GetPosition(a.position,body);this.b3.b3Body_GetRotation(a.rotation,body);
      this.b3.b3Body_GetLinearVelocity(a.velocity,body);this.b3.b3Body_GetAngularVelocity(a.angularVelocity,body);
    }
  }

  dispose(){if(this.disposed)return;this.disposed=true;this.b3.b3DestroyWorld(this.world);for(const m of this.meshes)this.b3.b3DestroyMesh(m);this.bodies.clear();this.shapes.clear();}
}
