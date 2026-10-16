import type {WorldState} from '../world/types';
import {executeAction, actionSight, type ActorAction,type ActionResult} from './actions';
export function requestAction(state:WorldState,actorId:string,action:ActorAction):ActionResult {
 const actor=state.residents.find(r=>r.id===actorId);
 if(action.kind!=='gather'&&action.kind!=='eat'){
  const result=executeAction(state,actorId,action);if(result.accepted&&actor)delete actor.activity;return result;
 }
 const targetId=action.targetId;
 if(actor?.activity){
  const same=actor.activity.kind===action.kind&&actor.activity.targetId===targetId;
  return {accepted:same,actorId,kind:action.kind,targetId,reason:same?'Czynność trwa.':'Najpierw przerwij obecną czynność.'};
 }
 // Validate the ordinary shared attempt without applying its material effects yet.
 const check=executeAction(structuredClone(state),actorId,action);if(!check.accepted||!actor)return check;
 actor.activity={kind:action.kind,targetId,elapsed:0,duration:action.kind==='gather'?2.4:3.2,startedAt:state.seconds,origin:[...actor.position]};
 return {...check,reason:action.kind==='gather'?'Zbierasz owoce. Zostań w zasięgu rośliny.':'Jesz porcję. Możesz przerwać czynność.'};
}
export function advanceActivities(state:WorldState,dt:number):void {
 if(!Number.isFinite(dt)||dt<0)throw new RangeError('Czas czynności musi być skończony i nieujemny.');
 for(const actor of state.residents){
  const work=actor.activity;if(!work)continue;
  const target=work.kind==='gather'?state.source.resourceSites?.find(s=>s.id===work.targetId):state.things.find(t=>t.id===work.targetId&&!t.consumed);
  const own=work.kind==='eat'&&actor.holding===work.targetId;
  const moved=Math.hypot(...actor.position.map((v,i)=>v-work.origin[i]))>.85;
  const accessible=target&&(own||Math.hypot(...actor.position.map((v,i)=>v-target.position[i]))<=1.8&&actionSight(state,actor,target.position));
  if(moved||!accessible){delete actor.activity;continue;}
  work.elapsed+=dt;
  if(work.elapsed+1e-9<work.duration)continue;
  delete actor.activity;
  const result=executeAction(state,actor.id,{kind:work.kind,targetId:work.targetId});
  if(!result.accepted){
   actor.memories.push({time:state.seconds,kind:'blocked',target:work.targetId,detail:result.reason});
   if(actor.memories.length>96)actor.memories.splice(0,actor.memories.length-96);
  }
 }
}
