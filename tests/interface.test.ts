import { describe,it,expect,vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { createInterface } from '../src/ui';
import { createSession } from '../src/session';
import { createWorld } from '../src/world/state';
import { createRegion } from '../src/world/source';
import { heightAt } from '../src/world/geography';
import type { WorldView } from '../src/view';

async function setup(){
 const dom=new JSDOM('<div id="land"></div><div id="ui"></div>',{url:'https://feniks.test'});
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,localStorage:dom.window.localStorage});
 const session=await createSession(createWorld(createRegion()),heightAt);
 const view={focus:()=>{},pick:()=>null,update:()=>{},renderer:{domElement:dom.window.document.querySelector('#land')}} as unknown as WorldView;
 const ui=createInterface(document.querySelector<HTMLElement>('#ui')!,session,view);
 return {session,ui,dom,view};
}
describe('usable world interface',()=>{
 it('pause stops actual life and the person inspector shows their own reason',async()=>{
  const {session,ui,dom}=await setup();
  const before=session.state.seconds;
  document.querySelector<HTMLButtonElement>('[data-action="pause"]')!.click();session.advance(.1);ui.update();
  expect(session.paused).toBe(true);expect(session.state.seconds).toBe(before);
  expect(document.body.textContent).toContain(session.state.residents[0].name);
  expect(document.body.textContent).toContain(session.state.residents[0].intent.reason);
  ui.dispose();session.dispose();dom.window.close();
 });
 it('save stores the actual completed world checkpoint',async()=>{
  const {session,ui,dom}=await setup();session.advance(.1);
  document.querySelector<HTMLButtonElement>('[data-action="save"]')!.click();
  const saved=JSON.parse(localStorage.getItem('mini-feniks:checkpoint')!);
  expect(saved.tick).toBe(session.state.tick);expect(saved.residents[0].holding).toBe(session.state.residents[0].holding);
  ui.dispose();session.dispose();dom.window.close();
 });
 it('form editing alters the same source part while preserving world time',async()=>{
  const {session,ui,dom}=await setup();
  document.querySelector<HTMLButtonElement>('[data-action="author"]')!.click();
  const input=document.querySelector<HTMLInputElement>('[data-field="size-1"]')!;
  input.value='2.9';document.querySelector<HTMLButtonElement>('[data-action="apply"]')!.click();
  expect(session.state.source.home.parts.find(p=>p.id==='home-wall-west')!.size[1]).toBe(2.9);
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
});
