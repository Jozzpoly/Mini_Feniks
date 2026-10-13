import { stepLife } from './life';
import { createPhysics, type WorldPhysics } from './physics';
import { decodeCheckpoint, encodeCheckpoint } from './world/checkpoint';
import { revisePart } from './world/revisions';
import type { Drive, PartSource, RevisionResult, WorldState } from './world/types';

const STEP=1/60, THINK=1/4;
const initialDrives=(state:WorldState)=>new Map<string,Drive>(state.residents.map(r=>[r.id,{velocity:[r.velocity[0],0,r.velocity[2]],posture:r.posture}]));
export async function createSession(state:WorldState,ground:(x:number,z:number)=>number){
  return new Session(state,await createPhysics(state,ground),ground);
}

/** Completed fixed steps own time. Camera, UI and dropped wall time cannot execute life. */
export class Session {
  paused=false;
  private accumulator=0;
  private thinking=0;
  private drives:Map<string,Drive>;
  constructor(public state:WorldState,public physics:WorldPhysics,private ground:(x:number,z:number)=>number){this.drives=initialDrives(state);}

  advance(wallSeconds:number){
    if(this.paused||!Number.isFinite(wallSeconds)||wallSeconds<=0)return;
    this.accumulator+=Math.min(wallSeconds,.25);
    let count=0;
    while(this.accumulator+1e-10>=STEP&&count<15){
      const previous=this.state.residents.map(r=>[r.position[0],r.position[2]]);
      this.physics.step(STEP,this.drives,this.state);
      this.state.seconds+=STEP;this.state.tick++;this.accumulator-=STEP;count++;
      this.state.residents.forEach((r,i)=>{
        const desire=this.drives.get(r.id)?.velocity??[0,0,0];
        const moved=Math.hypot(r.position[0]-previous[i][0],r.position[2]-previous[i][1]);
        r.blockedFor=Math.hypot(desire[0],desire[2])>.2&&moved/STEP<.12?r.blockedFor+STEP:0;
        const target=r.known.find(p=>p.id===r.intent.targetId);
        if(r.holding&&r.intent.goal==='carry-home'&&target&&Math.hypot(r.position[0]-target.position[0],r.position[2]-target.position[2])<.6&&Math.hypot(...r.velocity)<.45)
          this.physics.release(r.id,this.state);
      });
      this.thinking+=STEP;
      if(this.thinking+1e-10>=THINK){this.drives=stepLife(this.state,this.thinking);this.thinking=0;}
    }
    // The unexecuted interval is not world time.
    if(count===15&&this.accumulator>=STEP)this.accumulator%=STEP;
  }

  save(){return encodeCheckpoint(this.state);}

  async load(text:string){
    const next=decodeCheckpoint(text);
    if(next.source.seed!==this.state.source.seed||next.source.terrainVersion!==this.state.source.terrainVersion)throw new Error('Zapis wymaga innej reguły geografii. Bieżąca historia pozostała zachowana.');
    const physics=await createPhysics(next,this.ground);
    this.physics.dispose();this.physics=physics;this.state=next;this.accumulator=0;this.thinking=0;this.drives=initialDrives(next);
  }

  edit(partId:string,changes:Partial<Pick<PartSource,'position'|'size'|'yaw'>>):RevisionResult{
    const next=decodeCheckpoint(this.save()),result=revisePart(next,partId,changes);
    if(!result.accepted)return result;
    try{this.physics.replacePart(next.source.home.parts.find(p=>p.id===partId)!);}
    catch{ return {accepted:false,partId,reason:'Nie przyjęto nowej reprezentacji fizycznej; poprzedni stan zachowany.'}; }
    this.state=next;return result;
  }

  dispose(){this.physics.dispose();}
}
