import './ui/style.css';
import { readStartingWorld } from './world/startup';
import { heightAt } from './world/geography';
import { createSession } from './session';
import { createView } from './view';
import { createInterface } from './ui';

async function start(){
  const root=document.querySelector<HTMLElement>('#app')!;
  root.innerHTML='<div id="land" aria-label="Kraina w trzech wymiarach"></div><div id="interface"></div>';
  const state=readStartingWorld(localStorage),session=await createSession(state,heightAt);
  const view=createView(root.querySelector<HTMLElement>('#land')!,state.source);
  const ui=createInterface(root.querySelector<HTMLElement>('#interface')!,session,view);
  view.update(session.state);
  let previous=performance.now(),frame=0;
  const run=(now:number)=>{
    const dt=(now-previous)/1000;previous=now;
    session.advance(dt);view.update(session.state);ui.update();frame=requestAnimationFrame(run);
  };
  frame=requestAnimationFrame(run);
  document.addEventListener('visibilitychange',()=>{previous=performance.now();});
  window.addEventListener('pagehide',e=>{ui.autosave();if(!e.persisted){cancelAnimationFrame(frame);session.dispose();view.dispose();}});
}
start().catch(error=>{
  console.error(error);
  const root=document.querySelector<HTMLElement>('#app')!;root.replaceChildren();
  const panel=document.createElement('div');panel.className='loading';panel.textContent='Nie udało się otworzyć krainy. '+(error instanceof Error?error.message:String(error));root.append(panel);
});
