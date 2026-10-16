import type {Intent,Resident,WorldState} from '../world/types';
const distance=(a:number[],b:number[])=>Math.hypot(a[0]-b[0],a[2]-b[2]);

/** A remembered material reserve, not a list of prescribed steps or live world counts. */
export function concernIntent(state:WorldState,r:Resident):Intent|null {
 if(r.control==='player')return null;
 const puts=r.known.filter(p=>p.kind==='put'&&p.available!==false);
 if(!r.concern&&puts.length&&r.hunger<.65&&r.fatigue<.7){
  const preferred=r.known.find(p=>p.id===r.preferredRest)?.position??r.position;
  const place=[...puts].sort((a,b)=>distance(a.position,preferred)-distance(b.position,preferred))[0];
  r.concern={kind:'provision',placeId:place.id,desiredUnits:r.curiosity>.5?2:3,startedAt:state.seconds,
   reason:'Chcę mieć kilka porcji w miejscu, do którego wracam, zamiast szukać ich dopiero z głodu.',satisfied:false};
 }
 const c=r.concern;if(!c)return null;
 let put=puts.find(p=>p.id===c.placeId);
 if(!put&&puts.length){put=[...puts].sort((a,b)=>distance(a.position,r.position)-distance(b.position,r.position))[0];c.placeId=put.id;}
 if(!put)return null;
 const reserve=r.knownThings.filter(t=>t.kind==='food'&&t.available&&distance(t.position,put!.position)<2.1);
 c.satisfied=reserve.length>=c.desiredUnits;
 if(r.hunger>.54)return null;
 const make=(goal:Intent['goal'],targetId:Intent['targetId'],reason:string):Intent=>({goal,targetId,reason,chosenAt:state.seconds});
 const blocked=(id:string)=>r.memories.some(m=>m.kind==='blocked'&&m.target===id&&state.seconds-m.time<18);
 const held=state.things.find(t=>t.id===r.holding&&t.heldBy===r.id&&!t.consumed);
 if(blocked(put.id))return held?.kind==='food'?make('quiet',null,'Nie udało mi się dojść do zapasu. Zaczekam z porcją przed ponowną próbą.'):null;
 if(held?.kind==='food')return make('store',put.id,`Odkładam porcję na później. Pamiętam ${reserve.length} z ${c.desiredUnits} potrzebnych porcji.`);
 if(held||c.satisfied||r.fatigue>.58)return null;
 const trip=(position:number[])=>distance(position,r.position)+distance(position,put!.position);
 const loose=r.knownThings.filter(t=>t.kind==='food'&&t.available&&distance(t.position,put!.position)>=2.1&&!blocked(t.id))
  .sort((a,b)=>trip(a.position)-trip(b.position))[0];
 const site=r.knownResources?.filter(s=>s.available&&!blocked(s.id)).sort((a,b)=>trip(a.position)-trip(b.position))[0];
 if(loose&&(!site||trip(loose.position)<trip(site.position)+2.88))return make('fetch',loose.id,'Widziałem dostępną porcję. Jej przeniesienie wydaje mi się bliższe niż nowy zbiór.');
 return site?make('gather',site.id,`Chcę uzupełnić zapas na później: pamiętam ${reserve.length} z ${c.desiredUnits} porcji.`):null;
}
