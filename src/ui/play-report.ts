import type { Resident, WorldState } from '../world/types';

/** A small diagnostic excerpt. It cannot restore the world or its authored source. */
export function createPlayReport(state:WorldState){
 const actor=(r:Resident)=>({
  id:r.id,name:r.name,control:r.control??'resident',position:[...r.position],velocity:[...r.velocity],
  posture:r.posture,hunger:r.hunger,fatigue:r.fatigue,holding:r.holding,
  carryYaw:r.carryYaw??0,carryHeight:r.carryHeight??0,
  intent:{goal:r.intent.goal,targetId:r.intent.targetId,reason:r.intent.reason,chosenAt:r.intent.chosenAt},
  activity:r.activity?{kind:r.activity.kind,targetId:r.activity.targetId,elapsed:r.activity.elapsed,duration:r.activity.duration,startedAt:r.activity.startedAt,origin:[...r.activity.origin]}:null,
  concern:r.concern?{kind:r.concern.kind,placeId:r.concern.placeId,desiredUnits:r.concern.desiredUnits,startedAt:r.concern.startedAt,reason:r.concern.reason,satisfied:r.concern.satisfied}:null,
 });
 const player=state.residents.find(r=>r.control==='player');
 if(!player)throw new Error('Brak postaci gracza w śladzie gry.');
 const held=state.things.find(t=>t.id===player.holding&&!t.consumed);
 return {
  version:1,time:state.seconds,tick:state.tick,player:actor(player),
  heldThing:held?{id:held.id,kind:held.kind,mass:held.mass,size:[...held.size],position:[...held.position],rotation:[...held.rotation],velocity:[...held.velocity]}:null,
  residents:state.residents.filter(r=>r.id!==player.id).map(actor),
  recentEvents:state.events.slice(-48).map(e=>({time:e.time,kind:e.kind,actor:e.actor,target:e.target,detail:e.detail})),
 };
}
