import { stepLife } from './life';
import { createPhysics, type WorldPhysics } from './physics';
import { decodeCheckpoint, encodeCheckpoint } from './world/checkpoint';
import { revisePart } from './world/revisions';
import { ensurePlayer, playerVelocity } from './actors/player';
import { AuthoringHistory, type AuthoringOperation, type AuthoringResult } from './world/authoring';
import { upgradeWorldHistory } from './world/migration';
import { establishResourceSites } from './world/resources';
import { executeAction, type ActorAction, type ActionResult } from './actors/actions';
import { channelRecipe } from './world/geography';
import type { Drive, PartSource, RevisionResult, Vec3, WorldState } from './world/types';

const STEP=1/60, THINK=1/4;
const initialDrives=(state:WorldState)=>new Map<string,Drive>(state.residents.map(r=>[r.id,{velocity:[r.velocity[0],0,r.velocity[2]],posture:r.posture}]));
export async function createSession(state:WorldState,ground:(x:number,z:number)=>number){
  upgradeWorldHistory(state);ensurePlayer(state);establishResourceSites(state);
  return new Session(state,await createPhysics(state,ground),ground);
}

/** Completed fixed steps own time. Camera, UI and dropped wall time cannot execute life. */
export class Session {
  paused=false;
  private accumulator=0;
  private thinking=0;
  private drives:Map<string,Drive>;
  private playerInput:Vec3=[0,0,0];
  private playerSpeed=2.2;
  private playerPosture=0;
  private authoring=new AuthoringHistory();
  constructor(public state:WorldState,public physics:WorldPhysics,private ground:(x:number,z:number)=>number){this.drives=initialDrives(state);this.playerPosture=this.player.posture;}

  get player(){return this.state.residents.find(r=>r.control==='player')!;}
  setPlayerInput(input:Vec3,speed=2.2){
    this.playerInput=Array.isArray(input)&&input.length===3&&input.every(Number.isFinite)?[...input]:[0,0,0];
    this.playerSpeed=Number.isFinite(speed)?Math.max(.3,Math.min(3,speed)):2.2;
  }
  clearPlayerInput(){this.playerInput=[0,0,0];this.drives.set(this.player.id,{velocity:[0,0,0],posture:this.playerPosture});}
  setPlayerPosture(posture:number){this.playerPosture=Number.isFinite(posture)?Math.max(0,Math.min(1,posture)):0;}
  act(action:ActorAction):ActionResult{
    const next=decodeCheckpoint(this.save()),result=executeAction(next,this.player.id,action);
    if(!result.accepted)return result;
    try{encodeCheckpoint(next);this.physics.reconcileThings(next.things);}
    catch(error){return {...result,accepted:false,reason:error instanceof Error?error.message:'Nie przyjęto czynności.'};}
    this.state=next;
    if(action.kind==='rest'){this.clearPlayerInput();this.playerPosture=1;}
    return result;
  }
  get canUndo(){return this.authoring.canUndo;}
  get canRedo(){return this.authoring.canRedo;}
  author(operation:AuthoringOperation){return this.authorTransaction(next=>this.authoring.apply(next,operation));}
  undoAuthor(){return this.authorTransaction(next=>this.authoring.undo(next));}
  redoAuthor(){return this.authorTransaction(next=>this.authoring.redo(next));}
  private authorTransaction(change:(next:WorldState)=>AuthoringResult):AuthoringResult{
    this.clearPlayerInput();
    const next=decodeCheckpoint(this.save()),history=this.authoring.capture(),result=change(next);
    if(!result.accepted)return result;
    try{
      // Check durable data before touching the native representation.
      encodeCheckpoint(next);this.physics.reconcileParts(next.source.home.parts);
    }catch(error){
      this.authoring.restoreCapture(history);
      return {...result,accepted:false,affectedParts:[],removedParts:[],reason:error instanceof Error?error.message:'Nie przyjęto formy.'};
    }
    next.events.push({time:next.seconds,kind:'authored',actor:null,target:result.formId,detail:result.reason});
    if(next.events.length>256)next.events.splice(0,next.events.length-256);
    this.state=next;return result;
  }

  advance(wallSeconds:number){
    if(this.paused||!Number.isFinite(wallSeconds)||wallSeconds<=0)return;
    this.accumulator+=Math.min(wallSeconds,.25);
    let count=0;
    while(this.accumulator+1e-10>=STEP&&count<15){
      this.drives.set(this.player.id,{velocity:playerVelocity(this.playerInput,this.playerSpeed),posture:this.playerPosture});
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
      if(this.thinking+1e-10>=THINK){this.drives=stepLife(this.state,this.thinking);this.physics.reconcileThings(this.state.things);this.thinking=0;}
    }
    // The unexecuted interval is not world time.
    if(count===15&&this.accumulator>=STEP)this.accumulator%=STEP;
  }

  save(){return encodeCheckpoint(this.state);}

  async load(text:string){
    const next=upgradeWorldHistory(decodeCheckpoint(text));
    if(next.source.seed!==this.state.source.seed||next.source.terrainVersion!==this.state.source.terrainVersion||channelRecipe(next.source.channels)!==channelRecipe(this.state.source.channels))throw new Error('Zapis wymaga innej reguły geografii. Bieżąca historia pozostała zachowana.');
    ensurePlayer(next);establishResourceSites(next);const physics=await createPhysics(next,this.ground);
    this.physics.dispose();this.physics=physics;this.state=next;this.accumulator=0;this.thinking=0;this.drives=initialDrives(next);
    this.playerInput=[0,0,0];this.playerPosture=next.residents.find(r=>r.control==='player')!.posture;
    this.authoring=new AuthoringHistory();
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
