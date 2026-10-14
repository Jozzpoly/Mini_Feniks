import { describe,it,expect,vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { createInterface } from '../src/ui';
import { createSession } from '../src/session';
import { createWorld } from '../src/world/state';
import { createRegion } from '../src/world/source';
import { heightAt } from '../src/world/geography';
import type { WorldView, AuthorPose } from '../src/view';
import type { WorldState } from '../src/world/types';
import { ensurePlayer } from '../src/actors/player';
import { createFormSource } from '../src/world/forms';

async function setup(initialise?:(state:WorldState)=>void){
 const dom=new JSDOM('<div id="land"></div><div id="ui"></div>',{url:'https://feniks.test',pretendToBeVisual:true});
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,localStorage:dom.window.localStorage});
 const state=createWorld(createRegion());ensurePlayer(state);initialise?.(state);
 const session=await createSession(state,heightAt);
 let gestureCallback:((pose:AuthorPose)=>void)|null=null;
 const view={focus:()=>{},pick:()=>null,update:()=>{},onAuthorGesture:(callback:((pose:AuthorPose)=>void)|null)=>{gestureCallback=callback;},renderer:{domElement:dom.window.document.querySelector('#land')}} as unknown as WorldView;
 const ui=createInterface(document.querySelector<HTMLElement>('#ui')!,session,view);
 return {session,ui,dom,view,gesture:(pose:AuthorPose)=>{if(!gestureCallback)throw new Error('No gesture consumer');gestureCallback(pose);}};
}
describe('usable world interface',()=>{
 it('near on a selected thing switches to observation and identifies the camera subject',async()=>{
  const {session,ui,dom,view}=await setup(),bag=session.state.things.find(t=>t.kind==='bag')!,modes:string[]=[],focus=vi.fn();view.focus=focus;view.setMode=(mode)=>{modes.push(mode);};
  try {
   view.pick=()=>({kind:'thing',id:bag.id,position:bag.position});
   for(const type of ['pointerdown','pointerup'])view.renderer.domElement.dispatchEvent(new dom.window.MouseEvent(type,{button:0,clientX:4,clientY:4}));
   document.querySelector<HTMLButtonElement>('[data-action="near"]')!.click();
   expect(modes.at(-1)).toBe('observe');expect(focus).toHaveBeenLastCalledWith(bag.position,5,bag.id);
  }finally{ui.dispose();session.dispose();dom.window.close();}
 });
 it('pause stops actual life and the person inspector shows their own reason',async()=>{
  const {session,ui,dom}=await setup();
  const before=session.state.seconds;
  document.querySelector<HTMLButtonElement>('[data-action="pause"]')!.click();session.advance(.1);ui.update();
  expect(session.paused).toBe(true);expect(session.state.seconds).toBe(before);
  expect(document.body.textContent).toContain(session.state.residents[0].name);
  expect(document.body.textContent).toContain(session.player.intent.reason);
  ui.dispose();session.dispose();dom.window.close();
 });
 it('save stores the actual completed world checkpoint',async()=>{
  const {session,ui,dom}=await setup();session.advance(.1);
  document.querySelector<HTMLButtonElement>('[data-action="save"]')!.click();
  const saved=JSON.parse(localStorage.getItem('mini-feniks:checkpoint')!);
  expect(saved.tick).toBe(session.state.tick);expect(saved.residents[0].holding).toBe(session.state.residents[0].holding);
  ui.dispose();session.dispose();dom.window.close();
 });
 it('a whole-form preview is cancellable and accepting it moves its legs and use without resetting time',async()=>{
  const {session,ui,dom}=await setup();
  document.querySelector<HTMLButtonElement>('[data-action="author"]')!.click();
  const before=session.save(),input=document.querySelector<HTMLInputElement>('[data-field="position-0"]')!;
  input.value='-18';input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  expect(session.save()).toBe(before);
  document.querySelector<HTMLButtonElement>('[data-action="cancel"]')!.click();expect(session.save()).toBe(before);
  const fresh=document.querySelector<HTMLInputElement>('[data-field="position-0"]')!;
  fresh.value='-18';fresh.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  document.querySelector<HTMLButtonElement>('[data-action="apply"]')!.click();
  expect(session.state.source.home.parts.find(p=>p.id==='home-bench')!.position[0]).toBe(-18);
  expect(session.state.source.places.find(p=>p.id==='rest-inside')!.position[0]).toBeCloseTo(-17.35);
  expect(session.state.source.home.parts.find(p=>p.id==='home-bench-leg--1.8')!.position[0]).toBe(-18);
  expect(session.state.source.revision).toBe(2);expect(session.state.seconds).toBe(0);
  ui.dispose();session.dispose();dom.window.close();
 });
 it('an unsupported empty-world import keeps the actual running history and pause state',async()=>{
  const {session,ui,dom}=await setup(),before=session.state,snapshot=session.save();
  const bad=JSON.parse(snapshot);bad.residents=[];bad.events=[];
  bad.things.forEach((t:{heldBy:string|null})=>{t.heldBy=null;});
  localStorage.setItem('mini-feniks:checkpoint',JSON.stringify(bad));
  document.querySelector<HTMLButtonElement>('[data-action="load"]')!.click();
  await vi.waitFor(()=>expect(document.querySelector('.toast')!.textContent).toContain('checkpoint'));
  expect(session.state).toBe(before);expect(session.save()).toBe(snapshot);expect(session.paused).toBe(false);
  ui.dispose();session.dispose();dom.window.close();
 });
 it('clicking a material thing shows its current holder and size, then permits person selection',async()=>{
  const {session,ui,dom,view}=await setup(),bag=session.state.things.find(t=>t.kind==='bag')!;
  view.pick=()=>({kind:'thing',id:bag.id,position:bag.position});
  const canvas=view.renderer.domElement;
  for(const type of ['pointerdown','pointerup'])canvas.dispatchEvent(new dom.window.MouseEvent(type,{button:0,clientX:4,clientY:4}));
  const details=document.querySelector('.person-details')!;
  expect(details.querySelector('h2')!.textContent).toBe(bag.label);
  expect(details.textContent).toContain(session.state.residents[0].name);
  expect(details.textContent).toContain('0.45 × 0.50 × 0.30 m');
  document.querySelector<HTMLButtonElement>(`[data-person="${session.state.residents[1].id}"]`)!.click();
  expect(details.querySelector('h2')!.textContent).toBe(session.state.residents[1].name);
  ui.dispose();session.dispose();dom.window.close();
 });
 it('direct manipulation converts world gestures through the actual rotated parent before acceptance',async()=>{
  const {session,ui,dom,gesture}=await setup();
  try{
   const ground=heightAt(30,30),host=createFormSource('wall','test:host',[30,ground,30],Math.PI/2),child=createFormSource('bench','test:child',[2,0,0]);child.parentId=host.id;
   expect(session.author({kind:'create',form:host}).accepted).toBe(true);
   expect(session.author({kind:'create',form:child}).accepted).toBe(true);
   document.querySelector<HTMLButtonElement>('[data-action="author"]')!.click();
   const select=document.querySelector<HTMLSelectElement>('[data-form]')!;select.value=child.id;select.dispatchEvent(new dom.window.Event('change'));
   const before=session.save();gesture({position:[35,ground,25],yaw:Math.PI*.75});expect(session.save()).toBe(before);
   document.querySelector<HTMLButtonElement>('[data-action="apply"]')!.click();
   const current=session.state.source.forms!.find(f=>f.id===child.id)!;
   expect(current.position[0]).toBeCloseTo(5);expect(current.position[1]).toBe(0);expect(current.position[2]).toBeCloseTo(5);expect(current.yaw).toBeCloseTo(Math.PI/4);
   expect(session.state.source.forms!.find(f=>f.id===host.id)!.position).toEqual([30,ground,30]);
  }finally{ui.dispose();session.dispose();dom.window.close();}
 });
 it('a kit form remains preview-only until accepted and author undo preserves later life',async()=>{
  const {session,ui,dom,view}=await setup();
  try{
   document.querySelector<HTMLButtonElement>('[data-action="author"]')!.click();
   document.querySelector<HTMLButtonElement>('[data-create="bench"]')!.click();
   view.pick=()=>({kind:'ground',id:'land',position:[20,heightAt(20,20),20]});
   const canvas=view.renderer.domElement,before=session.save();
   for(const type of ['pointerdown','pointerup'])canvas.dispatchEvent(new dom.window.MouseEvent(type,{button:0,clientX:4,clientY:4}));
   expect(session.save()).toBe(before);
   document.querySelector<HTMLButtonElement>('[data-action="apply"]')!.click();
   const authored=session.state.source.forms!.find(f=>f.id.startsWith('form:authored:'))!;expect(authored.parts).toHaveLength(3);
   document.querySelector<HTMLButtonElement>('[data-action="play"]')!.click();session.advance(.2);const tick=session.state.tick;
   document.querySelector<HTMLButtonElement>('[data-action="author"]')!.click();document.querySelector<HTMLButtonElement>('[data-action="undo"]')!.click();
   expect(session.state.source.forms!.some(f=>f.id===authored.id)).toBe(false);expect(session.state.tick).toBe(tick);
   expect(session.state.source.retiredIds).toContain(authored.id);
  }finally{ui.dispose();session.dispose();dom.window.close();}
 });
 it('E gathers a real finite portion and E eats that held portion without refilling the plant',async()=>{
  const {session,ui,dom}=await setup(state=>{state.residents.find(r=>r.control==='player')!.position=[-10.9,heightAt(-10.9,8.65)+.9,9.4];});
  try{
   const units=session.state.resources!.find(s=>s.id==='resource:apple')!.units;
   window.dispatchEvent(new dom.window.KeyboardEvent('keydown',{code:'KeyE'}));
   const held=session.player.holding;expect(held).not.toBeNull();expect(session.state.things.find(t=>t.id===held)!.heldBy).toBe(session.player.id);
   expect(session.state.resources!.find(s=>s.id==='resource:apple')!.units).toBe(units-1);
   const hunger=session.player.hunger;window.dispatchEvent(new dom.window.KeyboardEvent('keydown',{code:'KeyE'}));
   expect(session.player.holding).toBeNull();expect(session.state.things.find(t=>t.id===held)!.consumed).toBe(true);expect(session.player.hunger).toBeLessThan(hunger);
   expect(session.state.resources!.find(s=>s.id==='resource:apple')!.units).toBe(units-1);
  }finally{ui.dispose();session.dispose();dom.window.close();}
 });

 it('an empty numeric field cannot accidentally become a committed zero coordinate',async()=>{
  const {session,ui,dom}=await setup();
  try{
   document.querySelector<HTMLButtonElement>('[data-action="author"]')!.click();const before=session.save();
   const input=document.querySelector<HTMLInputElement>('[data-field="position-0"]')!;input.value='';input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
   document.querySelector<HTMLButtonElement>('[data-action="apply"]')!.click();expect(session.save()).toBe(before);
  }finally{ui.dispose();session.dispose();dom.window.close();}
 });

});
