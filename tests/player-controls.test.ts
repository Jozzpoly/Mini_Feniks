import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import * as THREE from 'three';
import { createInterface } from '../src/ui';
import { createSession } from '../src/session';
import { createWorld } from '../src/world/state';
import { createRegion } from '../src/world/source';
import { heightAt } from '../src/world/geography';
import type { WorldView } from '../src/view';
import type { WorldState } from '../src/world/types';
import { ensurePlayer } from '../src/actors/player';

async function setup(initialise?:(state:WorldState)=>void){
 const dom=new JSDOM('<div id="land"></div><div id="ui"></div>',{url:'https://feniks.test',pretendToBeVisual:true});
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,localStorage:dom.window.localStorage});
 const state=createWorld(createRegion());ensurePlayer(state);initialise?.(state);
 const session=await createSession(state,heightAt),camera=new THREE.PerspectiveCamera();
 camera.position.set(session.player.position[0]-10,session.player.position[1]+5,session.player.position[2]);camera.lookAt(...session.player.position);
 const view={camera,focus:()=>{},pick:()=>null,update:()=>{},renderer:{domElement:document.querySelector('#land')}} as unknown as WorldView;
 const ui=createInterface(document.querySelector<HTMLElement>('#ui')!,session,view);
 const key=(type:string,code:string,shiftKey=false)=>window.dispatchEvent(new dom.window.KeyboardEvent(type,{code,bubbles:true,shiftKey}));
 const run=(seconds:number)=>{for(let i=0;i<seconds*60;i++){ui.update();session.advance(1/60);}};
 const cleanup=()=>{ui.dispose();session.dispose();dom.window.close();};
 return {session,ui,dom,key,run,cleanup};
}

describe('player controls in the same physical world',()=>{
 it('W follows the horizontal camera direction and window blur releases the drive',async()=>{
  const {session,key,run,cleanup}=await setup();
  try{
   const before=[...session.player.position];key('keydown','KeyW');run(1);
   expect(session.player.position[0]-before[0]).toBeGreaterThan(1);
   expect(Math.abs(session.player.position[2]-before[2])).toBeLessThan(.25);
   window.dispatchEvent(new window.Event('blur'));run(1);const stopped=[...session.player.position];run(.5);
   expect(Math.hypot(session.player.position[0]-stopped[0],session.player.position[2]-stopped[2])).toBeLessThan(.12);
  }finally{cleanup();}
 });
 it('editing a field releases a held movement key and exiting author mode restores the earlier clock',async()=>{
  const {session,key,run,cleanup}=await setup();
  try{
   key('keydown','KeyW');document.querySelector<HTMLButtonElement>('[data-action="author"]')!.click();
   expect(session.paused).toBe(true);
   document.querySelector<HTMLInputElement>('[data-field="position-0"]')!.focus();
   document.querySelector<HTMLButtonElement>('[data-action="play"]')!.click();expect(session.paused).toBe(false);
   run(.4);const stopped=[...session.player.position];run(.5);
   expect(Math.hypot(session.player.position[0]-stopped[0],session.player.position[2]-stopped[2])).toBeLessThan(.12);
   key('keydown','KeyW');run(.5);expect(session.player.position[0]-stopped[0]).toBeGreaterThan(.25);
  }finally{cleanup();}
 });
 it('author mode preserves an existing owner pause instead of resuming it on exit',async()=>{
  const {session,cleanup}=await setup();
  try{
   document.querySelector<HTMLButtonElement>('[data-action="pause"]')!.click();
   document.querySelector<HTMLButtonElement>('[data-action="author"]')!.click();
   document.querySelector<HTMLButtonElement>('[data-action="observe"]')!.click();
   expect(session.paused).toBe(true);
  }finally{cleanup();}
 });
 it('R and Shift R rotate the held item while T and G adjust its carrying height',async()=>{
  const {session,key,cleanup}=await setup(state=>{
   const p=state.residents.find(r=>r.control==='player')!,bag=state.things.find(t=>t.kind==='bag')!;
   state.residents.forEach(r=>{if(r.holding===bag.id)r.holding=null;});p.holding=bag.id;bag.heldBy=p.id;
  });
  try{
   const yaw=session.player.carryYaw??0,height=session.player.carryHeight??0;
   key('keydown','KeyR');expect(session.player.carryYaw).toBeCloseTo(yaw+Math.PI/12);
   key('keydown','KeyR',true);expect(session.player.carryYaw).toBeCloseTo(yaw);
   key('keydown','KeyT');expect(session.player.carryHeight).toBeCloseTo(height+.15);
   key('keydown','KeyG');expect(session.player.carryHeight).toBeCloseTo(height);
   document.querySelector<HTMLButtonElement>('[data-action="author"]')!.click();key('keydown','KeyT');
   expect(session.player.carryHeight).toBeCloseTo(height);
  }finally{cleanup();}
 });
 it('shows a timed activity and Escape cancels it without material reward',async()=>{
  const {session,key,ui,run,cleanup}=await setup(state=>{
   const p=state.residents.find(r=>r.control==='player')!,food=state.things.find(t=>t.kind==='food')!;
   p.position=[30,heightAt(30,30)+.9,30];food.position=[30,heightAt(30,30)+.3,30.5];food.heldBy=null;
  });
  try{
   const eat=[...document.querySelectorAll<HTMLButtonElement>('[data-interact]')].find(b=>b.textContent?.includes('Zjedz:'))!;
   eat.click();expect(session.player.activity?.kind).toBe('eat');expect(document.querySelector('progress')).not.toBeNull();
   const target=session.player.activity!.targetId;run(.2);ui.update();expect(Number(document.querySelector('progress')!.value)).toBeGreaterThan(0);
   key('keydown','Escape');expect(session.player.activity).toBeUndefined();expect(session.state.things.find(t=>t.id===target)!.consumed).toBe(false);
  }finally{cleanup();}
 });

});
