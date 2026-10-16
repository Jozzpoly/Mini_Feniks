import {createWorld} from '../src/world/state';
import {createRegion} from '../src/world/source';
import {createSession} from '../src/session';
import {heightAt} from '../src/world/geography';

for(const offset of [0,7]){
 const state=createWorld(createRegion());state.source.extent=[200,200];
 const mira=state.residents[1];mira.hunger=.15;mira.fatigue=.1;mira.position=[1.7+offset,heightAt(1.7+offset,8)+.9,8];
 const session=await createSession(state,heightAt);
 try{
  const moments=[];
  for(let i=0;i<3600;i++){
   session.advance(.1);
   if(i%600===599)moments.push({time:Math.round(state.seconds),actors:state.residents.filter(r=>r.control!=='player').map(r=>({name:r.name,goal:r.intent.goal,target:r.intent.targetId,position:r.position.map(n=>+n.toFixed(2)),holding:r.holding,activity:r.activity?.kind,concern:r.concern}))});
  }
  console.log(JSON.stringify({offset,moments,placed:state.events.filter(e=>e.kind==='placed'),food:state.things.filter(t=>t.kind==='food').map(t=>({id:t.id,consumed:t.consumed,heldBy:t.heldBy,position:t.position})),last:state.residents.filter(r=>r.control!=='player').map(r=>({name:r.name,memories:r.memories.slice(-8)}))}));
 }finally{session.dispose();}
}
