import {it,expect} from 'vitest';
import {createWorld} from '../src/world/state';
import {createRegion} from '../src/world/source';
import {heightAt} from '../src/world/geography';
import {createSession} from '../src/session';

it.each([0,7])('physically completes a reserve after a changed start (%s m), despite the other residents loose bag',async offset=>{
 const w=createWorld(createRegion());w.source.extent=[200,200];
 const mira=w.residents[1];mira.hunger=.15;mira.fatigue=.1;mira.position=[1.7+offset,heightAt(1.7+offset,8)+.9,8];
 const session=await createSession(w,heightAt);
 try{
  let completed=false;
  for(let i=0;i<3600;i++){
   session.advance(.1);
   if(mira.concern?.satisfied){completed=true;break;}
  }
  expect(completed).toBe(true);
  const cache=mira.known.find(p=>p.id===mira.concern!.placeId)!;
  const portions=w.things.filter(t=>t.kind==='food'&&!t.consumed&&!t.heldBy&&Math.hypot(t.position[0]-cache.position[0],t.position[2]-cache.position[2])<2.1);
  expect(portions.length).toBeGreaterThanOrEqual(mira.concern!.desiredUnits);
  expect(w.events.some(e=>e.actor===mira.id&&e.kind==='placed')).toBe(true);
  expect(mira.holding).toBeNull();
 }finally{session.dispose();}
},15000);
