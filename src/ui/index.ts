import * as THREE from 'three';
import type { Session } from '../session';
import type { WorldView, ViewMode } from '../view';
import type { FormSource, Vec3 } from '../world/types';
import type { ActorAction } from '../actors/actions';
import type { AuthoringOperation } from '../world/authoring';
import { actionSight } from '../actors/actions';
import { createFormSource, formForPart, worldToFormPose } from '../world/forms';

const STORAGE='mini-feniks:checkpoint';
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const icon=(path:string)=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
const pauseIcon=icon('M8 5v14M16 5v14');
const homeIcon=icon('M3 11 12 3l9 8M5 10v11h14V10M9 21v-7h6v7');
const modes:ViewMode[]=['play','observe','author'];
const kit:ReadonlyArray<[Exclude<FormSource['kind'],'house'|'custom'>,string]>=[['bench','Ława'],['table','Stół'],['wall','Ściana'],['platform','Podest'],['arch','Brama'],['rock','Skała']];
const movementCodes=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','ShiftLeft','ShiftRight','ControlLeft','ControlRight']);
const isTextEntry=(target:EventTarget|null)=>target instanceof HTMLElement&&(target.matches('input,textarea,select')||target.isContentEditable);

export function createInterface(container:HTMLElement,session:Session,view:WorldView){
  let mode:ViewMode='play',selected=session.player.id,selectedThing:string|null=null,lastUpdate=-1,disposed=false;
  let formId=session.state.source.forms?.find(f=>f.kind==='bench')?.id??session.state.source.forms?.[0]?.id??'';
  let draft:AuthoringOperation|null=null,placing:FormSource['kind']|null=null,pausedBeforeAuthor=false,tool:'translate'|'rotate'='translate';
  let crouched=session.player.posture>.5,toastTimer:number|undefined,creationSerial=0;
  const held=new Set<string>(),forward=new THREE.Vector3(),right=new THREE.Vector3();
  container.innerHTML=`<header class="topbar"><div class="wordmark"><strong>MiniFeniks</strong><span>Żywa Kraina</span></div><nav class="mode-switch" aria-label="Sposób uczestnictwa"><button data-action="play" class="active">Graj</button><button data-action="observe">Oglądaj</button><button data-action="author">Twórz</button></nav><div class="world-actions"><button data-action="home" title="Ogląd osady">${homeIcon}<span>Osada</span></button><button data-action="realm" class="less">Kraina</button><button data-action="pause">${pauseIcon}<span>Pauza</span></button><details class="save-menu"><summary>Zapis</summary><div><button data-action="save">Zapisz</button><button data-action="load">Wczytaj</button><button data-action="export">Pobierz plik</button><button data-action="import">Otwórz plik</button></div></details><input type="file" accept="application/json,.json" data-import hidden></div></header><aside class="inspector"><div class="people" aria-label="Mieszkańcy"></div><div class="person-details"></div><div class="author-details" hidden></div></aside><div class="player-hud" aria-label="Twoja postać"></div><div class="interaction" aria-live="polite"></div><div class="touch-controls" aria-label="Sterowanie postacią"><button data-move="KeyW" aria-label="Idź naprzód">↑</button><div><button data-move="KeyA" aria-label="Idź w lewo">←</button><button data-move="KeyS" aria-label="Idź wstecz">↓</button><button data-move="KeyD" aria-label="Idź w prawo">→</button></div></div><footer><div class="hint"></div><div class="clock"><i></i><span class="time" aria-live="off"></span></div></footer><div class="toast" role="status" aria-live="polite"></div>`;
  const query=<T extends HTMLElement=HTMLElement>(s:string)=>container.querySelector<T>(s)!;
  const button=(name:string)=>query<HTMLButtonElement>(`[data-action="${name}"]`);
  const notify=(text:string)=>{query('.toast').textContent=text;query('.toast').classList.add('show');if(toastTimer!==undefined)window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>query('.toast').classList.remove('show'),4500);};
  const clearInput=()=>{held.clear();session.clearPlayerInput();};
  const updateMovement=()=>{
    if(mode!=='play'||session.paused||document.hidden||isTextEntry(document.activeElement)){session.clearPlayerInput();return;}
    const x=Number(held.has('KeyD')||held.has('ArrowRight'))-Number(held.has('KeyA')||held.has('ArrowLeft'));
    const z=Number(held.has('KeyW')||held.has('ArrowUp'))-Number(held.has('KeyS')||held.has('ArrowDown'));
    if(!x&&!z){session.clearPlayerInput();return;}
    if(view.camera?.getWorldDirection){view.camera.getWorldDirection(forward);forward.y=0;if(forward.lengthSq()<1e-8)forward.set(0,0,-1);else forward.normalize();}
    else forward.set(0,0,-1);
    right.set(-forward.z,0,forward.x);
    const input:Vec3=[forward.x*z+right.x*x,0,forward.z*z+right.z*x];
    const speed=crouched?.9:held.has('ControlLeft')||held.has('ControlRight')?1.1:held.has('ShiftLeft')||held.has('ShiftRight')?2.8:2.2;
    session.setPlayerInput(input,speed);
  };
  const currentForm=()=>session.state.source.forms?.find(f=>f.id===formId);
  const clearPreview=()=>{draft=null;placing=null;view.previewAuthor?.(null);view.setSelection?.(mode==='author'?formId:null);};
  const updatePreview=()=>{view.previewAuthor?.(draft);view.setAuthorTool?.(tool);};
  const draftPose=()=>draft?.kind==='create'?draft.form:draft?.kind==='transform'?{...currentForm()!,...draft}:currentForm();
  const showAuthor=()=>{
    const form=currentForm(),pose=draftPose();
    query('.author-details').innerHTML=`<div class="person-head"><h2>Twórz krainę</h2><span class="mode-note">Czas zatrzymany</span></div><div class="form-history"><button data-action="undo" ${session.canUndo?'':'disabled'} title="Cofnij ostatnią formę, zachowując historię życia">↶ Cofnij</button><button data-action="redo" ${session.canRedo?'':'disabled'}>↷ Ponów</button></div><label class="select-label">Wybrana forma<select data-form>${(session.state.source.forms??[]).map(f=>`<option value="${escape(f.id)}" ${f.id===formId?'selected':''}>${escape(f.label)}</option>`).join('')}</select></label><div class="transform-tools"><button data-tool="translate" class="${tool==='translate'?'active':''}">Przesuń</button><button data-tool="rotate" class="${tool==='rotate'?'active':''}">Obróć</button></div><p class="author-note">Wybierz formę w krainie. Przeciągnij uchwyt — jasny podgląd czeka na przyjęcie.</p><div class="draft-status">${draft?'Nieprzyjęty podgląd':placing?'Kliknij ziemię, aby postawić formę':'Obraz i materialny świat są zgodne'}</div>${pose?`<details class="precision"><summary>Dokładne położenie ${draft?.kind==='create'?'nowej formy':form?.parentId?'względem rodzica':'w krainie'}</summary><div class="fields">${pose.position.map((v,i)=>`<label>${['Wschód','Góra','Południe'][i]}<input type="number" step="0.1" data-field="position-${i}" value="${v}"></label>`).join('')}</div><label class="angle-label">Obrót · stopnie<input type="number" step="15" data-field="yaw" value="${pose.yaw*180/Math.PI}"></label></details>`:''}<div class="draft-actions"><button data-action="apply" class="primary" ${draft?'':'disabled'}>Przyjmij</button><button data-action="cancel" ${draft||placing?'':'disabled'}>Anuluj</button></div><details class="creation-kit" open><summary>Dodaj do krainy</summary><div class="kit-grid">${kit.map(([kind,label])=>`<button data-create="${kind}">${label}</button>`).join('')}</div></details><button data-action="remove" class="remove-form" ${form?'':'disabled'}>Usuń wybraną formę</button><p class="author-note">Zmiana dotyczy całej formy, jej części i miejsc używania. Zajęta przestrzeń odrzuci przyjęcie. Cofnięcie nie cofa życia.</p>`;
    query<HTMLSelectElement>('[data-form]').onchange=e=>{clearPreview();formId=(e.target as HTMLSelectElement).value;view.setSelection?.(formId);showAuthor();};
    query('.transform-tools').querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.tool as typeof tool;view.setAuthorTool?.(tool);showAuthor();});
    const fields=query('.precision');
    if(fields)fields.querySelectorAll<HTMLInputElement>('input').forEach(input=>input.oninput=()=>{
      const inputs=[...fields.querySelectorAll<HTMLInputElement>('input')];
      if(inputs.some(field=>field.value.trim()===''||!Number.isFinite(Number(field.value)))){button('apply').disabled=true;button('cancel').disabled=false;query('.draft-status').textContent='Uzupełnij prawidłowe liczby — zmiana nie jest przyjęta';return;}
      const position=[0,1,2].map(i=>Number(query<HTMLInputElement>(`[data-field="position-${i}"]`).value)) as Vec3,yaw=Number(query<HTMLInputElement>('[data-field="yaw"]').value)*Math.PI/180;
      if(draft?.kind==='create')draft={kind:'create',form:{...draft.form,position,yaw}};
      else draft={kind:'transform',formId,position,yaw};
      updatePreview();query('.draft-status').textContent='Nieprzyjęty podgląd';button('apply').disabled=false;button('cancel').disabled=false;
    });
    button('apply').onclick=()=>{
      if(!draft)return;clearInput();const result=session.author(draft);notify(result.reason);
      if(result.accepted){if(draft.kind==='create')formId=draft.form.id;clearPreview();view.update(session.state);}
      showAuthor();update(true);
    };
    button('cancel').onclick=()=>{clearPreview();showAuthor();};
    button('remove').onclick=()=>{
      if(!form)return;clearPreview();const result=session.author({kind:'remove',formId});notify(result.reason);
      if(result.accepted){formId=session.state.source.forms?.find(f=>f.kind==='bench')?.id??session.state.source.forms?.[0]?.id??'';view.update(session.state);view.setSelection?.(formId);}
      showAuthor();update(true);
    };
    for(const [name,run] of [['undo',()=>session.undoAuthor()],['redo',()=>session.redoAuthor()]] as const)button(name).onclick=()=>{clearPreview();const result=run();notify(result.reason);view.update(session.state);if(!currentForm())formId=session.state.source.forms?.[0]?.id??'';view.setSelection?.(formId);showAuthor();update(true);};
    query('.kit-grid').querySelectorAll<HTMLButtonElement>('[data-create]').forEach(b=>b.onclick=()=>{clearPreview();placing=b.dataset.create as FormSource['kind'];query('.draft-status').textContent='Kliknij ziemię, aby postawić formę';button('cancel').disabled=false;notify('Kliknij ziemię. Potem dopracuj podgląd i przyjmij formę.');});
  };
  const changeMode=(next:ViewMode)=>{
    if(!modes.includes(next))return;
    clearInput();clearPreview();
    if(mode==='author'&&next!=='author')session.paused=pausedBeforeAuthor;
    if(mode!=='author'&&next==='author'){pausedBeforeAuthor=session.paused;session.paused=true;}
    mode=next;view.setMode?.(mode,session.player.id);view.setSelection?.(mode==='author'?formId:null);
    if(mode==='author')showAuthor();
    query('.inspector').classList.toggle('play-inspector',mode==='play');
    updatePeople();update(true);
    // Returning from a form field to play requires a fresh key press.
    if(mode==='play'&&isTextEntry(document.activeElement))(document.activeElement as HTMLElement).blur();
  };
  const updatePeople=()=>{
    query('.people').innerHTML=session.state.residents.map(r=>`<button data-person="${escape(r.id)}" class="${selectedThing===null&&r.id===selected?'active':''}">${escape(r.name)}${r.control==='player'?'<span>Ty</span>':''}</button>`).join('');
    query('.people').querySelectorAll<HTMLButtonElement>('[data-person]').forEach(b=>b.onclick=()=>{selected=b.dataset.person!;selectedThing=null;if(mode==='author')changeMode('observe');updatePeople();update(true);const r=session.state.residents.find(r=>r.id===selected);if(r){if(mode==='play'&&r.id!==session.player.id)changeMode('observe');view.focus(r.position,9,r.id);}});
  };
  const candidates=():Array<{action:ActorAction;label:string;distance:number}>=>{
    const p=session.player,near=(v:Vec3)=>Math.hypot(p.position[0]-v[0],p.position[1]-v[1],p.position[2]-v[2]),found:Array<{action:ActorAction;label:string;distance:number}>=[];
    const heldThing=session.state.things.find(t=>t.id===p.holding&&!t.consumed&&t.heldBy===p.id);
    if(heldThing?.kind==='food')found.push({action:{kind:'eat',targetId:heldThing.id},label:`Zjedz: ${heldThing.label}`,distance:-3});
    if(heldThing)found.push({action:{kind:'put-down'},label:'Odłóż trzymaną rzecz',distance:-2});
    if(!heldThing){
      for(const thing of session.state.things)if(!thing.consumed&&!thing.heldBy&&near(thing.position)<1.8&&actionSight(session.state,p,thing.position))found.push({action:{kind:thing.kind==='food'?'eat':'pickup',targetId:thing.id},label:thing.kind==='food'?`Zjedz: ${thing.label}`:`Podnieś: ${thing.label}`,distance:near(thing.position)});
      for(const site of session.state.source.resourceSites??[])if((session.state.resources?.find(s=>s.id===site.id)?.units??0)>0&&near(site.position)<1.8&&actionSight(session.state,p,site.position))found.push({action:{kind:'gather',targetId:site.id},label:`Zbierz: ${site.label}`,distance:near(site.position)});
      for(const place of session.state.source.places)if(place.kind==='rest'&&near(place.position)<1.8&&actionSight(session.state,p,place.position))found.push({action:{kind:'rest',targetId:place.id},label:'Odpocznij w tym miejscu',distance:near(place.position)+.5});
    }
    for(const other of session.state.residents)if(other.id!==p.id&&near(other.position)<3.5&&actionSight(session.state,p,other.position))found.push({action:{kind:'greet',targetId:other.id},label:`Pozdrów: ${other.name}`,distance:near(other.position)+1});
    return found.sort((a,b)=>a.distance-b.distance).slice(0,3);
  };
  const act=(action:ActorAction)=>{clearInput();if(session.paused){notify('Wznów czas, aby działać jako postać.');return;}const result=session.act(action);notify(result.reason);if(result.accepted&&action.kind==='rest'){crouched=true;session.setPlayerPosture(1);}view.update(session.state);update(true);};
  const update=(force=false)=>{
    if(disposed)return;
    updateMovement();
    if(!force&&session.state.seconds-lastUpdate<.15)return;lastUpdate=session.state.seconds;
    const seconds=Math.floor(session.state.seconds),clock=`${String(Math.floor(seconds/3600)).padStart(2,'0')}:${String(Math.floor(seconds/60)%60).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
    query('.time').textContent=`${session.paused?'Czas zatrzymany':'Świat płynie'} · ${clock}`;query('.clock').classList.toggle('running',!session.paused);
    button('pause').innerHTML=`${pauseIcon}<span>${session.paused?'Wznów':'Pauza'}</span>`;button('pause').disabled=mode==='author';
    for(const m of modes)button(m).classList.toggle('active',mode===m);
    query('.hint').textContent=mode==='play'?'WASD / strzałki · E działaj · C niska postura · przeciągnij, aby obrócić kamerę':mode==='author'?'Wybierz formę · uchwyty przesuwają i obracają · Esc anuluje podgląd':'Przeciągnij, aby obracać · kółko przybliża · prawy przycisk przesuwa';
    query('.person-details').hidden=mode==='author';query('.author-details').hidden=mode!=='author';query('.people').hidden=mode==='author';
    query('.player-hud').hidden=mode!=='play';query('.interaction').hidden=mode!=='play';query('.touch-controls').hidden=mode!=='play';
    const player=session.player;
    query('.player-hud').innerHTML=`<strong>${escape(player.name)} <span>Ty w krainie</span></strong><div class="need"><span>Głód</span><div><i style="width:${Math.max(0,Math.min(100,player.hunger*100))}%"></i></div></div><div class="need"><span>Zmęczenie</span><div><i style="width:${Math.max(0,Math.min(100,player.fatigue*100))}%"></i></div></div><div class="held-thing">${player.holding?escape(session.state.things.find(t=>t.id===player.holding)?.label??'Trzymana rzecz'):crouched?'Niska postura · C, aby wstać':'Wolne ręce'}</div>`;
    if(mode==='play'){
      const available=candidates();query('.interaction').innerHTML=available.length?available.map((c,i)=>`<button data-interact="${i}" ${session.paused?'disabled':''}>${i===0?'<kbd>E</kbd>':''}${escape(c.label)}</button>`).join(''):'<span>Podejdź do osoby, rzeczy lub rośliny, aby działać.</span>';
      query('.interaction').querySelectorAll<HTMLButtonElement>('[data-interact]').forEach(b=>b.onclick=()=>act(available[Number(b.dataset.interact)].action));
    }
    if(mode==='author')return;
    const thing=session.state.things.find(t=>t.id===selectedThing);
    if(thing){
      const holder=session.state.residents.find(r=>r.id===thing.heldBy);
      query('.person-details').innerHTML=`<div class="person-head"><h2>${escape(thing.label)}</h2><button data-action="near">Przybliż</button></div><p class="own-reason">${thing.consumed?'Zużyta porcja.':holder?`Przenosi: ${escape(holder.name)}.`:'Spoczywa lub porusza się w krainie.'}</p><dl class="thing-properties"><dt>Masa</dt><dd>${thing.mass.toFixed(2)} kg</dd><dt>Wymiary</dt><dd>${thing.size.map(v=>v.toFixed(2)).join(' × ')} m</dd><dt>Położenie</dt><dd>${thing.position.map(v=>v.toFixed(2)).join(' · ')} m</dd></dl>`;
      button('near').onclick=()=>{if(mode==='play')changeMode('observe');view.focus(thing.position,5,thing.id);};return;
    }
    selectedThing=null;const resident=session.state.residents.find(r=>r.id===selected)??player;
    query('.person-details').innerHTML=`<div class="person-head"><h2>${escape(resident.name)}</h2><button data-action="near">Przybliż</button></div><p class="own-reason">${escape(resident.intent.reason)}</p><div class="need"><span>Zmęczenie</span><div><i style="width:${resident.fatigue*100}%"></i></div></div><div class="need"><span>Głód</span><div><i style="width:${resident.hunger*100}%"></i></div></div><h3>Pamięta</h3><ol class="memory">${resident.memories.slice(-4).reverse().map(m=>`<li>${escape(m.detail)}</li>`).join('')||'<li>Własne miejsca i wcześniejsza droga.</li>'}</ol>`;
    button('near').onclick=()=>{if(mode==='play'&&resident.id!==session.player.id)changeMode('observe');view.focus(resident.position,7,resident.id);};
  };
  for(const m of modes)button(m).onclick=()=>changeMode(m);
  button('home').onclick=()=>{changeMode('observe');view.focus(session.state.source.home.position,35);};
  button('realm').onclick=()=>{changeMode('observe');view.focus([0,session.state.source.home.position[1],0],1800);};
  button('pause').onclick=()=>{clearInput();session.paused=!session.paused;update(true);};
  const autosave=()=>{try{localStorage.setItem(STORAGE,session.save());return true;}catch{return false;}};
  button('save').onclick=()=>notify(autosave()?'Zachowano historię tej krainy.':'Nie udało się zapisać w przeglądarce. Możesz zachować plik.');
  const load=async(text:string)=>{
    const paused=session.paused;clearInput();clearPreview();session.paused=true;
    try{await session.load(text);selected=session.player.id;selectedThing=null;crouched=session.player.posture>.5;formId=session.state.source.forms?.find(f=>f.kind==='bench')?.id??session.state.source.forms?.[0]?.id??'';pausedBeforeAuthor=true;view.update(session.state);view.setMode?.(mode,session.player.id);view.setSelection?.(mode==='author'?formId:null);updatePeople();if(mode==='author')showAuthor();update(true);notify('Wczytano historię. Wznów czas, gdy zechcesz.');}
    catch(error){session.paused=paused;notify(error instanceof Error?error.message:'Nie udało się wczytać historii.');update(true);}
  };
  button('load').onclick=()=>{const text=localStorage.getItem(STORAGE);if(text)void load(text);else notify('Nie ma jeszcze zapisu w tej przeglądarce.');};
  button('export').onclick=()=>{try{const url=URL.createObjectURL(new Blob([session.save()],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='MiniFeniks-kraina.json';a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);}catch{notify('Nie udało się przygotować pliku historii.');}};
  button('import').onclick=()=>query<HTMLInputElement>('[data-import]').click();
  query<HTMLInputElement>('[data-import]').onchange=async e=>{const input=e.target as HTMLInputElement,file=input.files?.[0];if(file){if(file.size>4_000_000){notify('Plik jest zbyt duży dla tego zapisu.');input.value='';return;}await load(await file.text());input.value='';}};
  const onKeyDown=(e:KeyboardEvent)=>{
    if(isTextEntry(e.target)||e.altKey)return;
    if(e.code==='Escape'&&mode==='author'){e.preventDefault();clearPreview();showAuthor();return;}
    if(mode==='author'&&(e.ctrlKey||e.metaKey)&&e.code==='KeyZ'){e.preventDefault();button(e.shiftKey?'redo':'undo').click();return;}
    if(e.metaKey||mode!=='play'||session.paused)return;
    if(movementCodes.has(e.code)){e.preventDefault();held.add(e.code);updateMovement();}
    if(!e.repeat&&e.code==='KeyE'){e.preventDefault();const first=candidates()[0];if(first)act(first.action);else notify('Podejdź do dostępnej osoby, rzeczy lub rośliny.');}
    if(!e.repeat&&e.code==='KeyC'){e.preventDefault();crouched=!crouched;session.setPlayerPosture(crouched?1:0);update(true);}
  };
  const onKeyUp=(e:KeyboardEvent)=>{if(held.delete(e.code)){e.preventDefault();updateMovement();}};
  const onFocus=(e:FocusEvent)=>{if(isTextEntry(e.target))clearInput();};
  const onVisibility=()=>{if(document.hidden)clearInput();};
  window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);window.addEventListener('blur',clearInput);document.addEventListener('focusin',onFocus);document.addEventListener('visibilitychange',onVisibility);
  const land=view.renderer.domElement;let down=[0,0],dragWasActive=false;
  const onDown=(e:PointerEvent)=>{down=[e.clientX,e.clientY];dragWasActive=!!view.isAuthorDragging?.();};
  const onUp=(e:PointerEvent)=>{
    if(e.button!==0||dragWasActive||view.isAuthorDragging?.()||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;
    const hit=view.pick(e.clientX,e.clientY);if(!hit)return;
    if(mode==='author'){
      if(placing&&hit.kind==='ground'){
        let id:string;do{id=`form:authored:${session.state.worldId}:${session.state.tick}:${++creationSerial}`;}while(session.state.source.retiredIds?.includes(id)||session.state.source.forms?.some(f=>f.id===id));
        draft={kind:'create',form:createFormSource(placing as Exclude<FormSource['kind'],'house'|'custom'>,id,[hit.position[0],hit.position[1],hit.position[2]])};placing=null;updatePreview();showAuthor();return;
      }
      if(hit.kind==='part'){const form=formForPart(session.state.source,hit.id);if(form){clearPreview();formId=form.id;view.setSelection?.(formId);showAuthor();}}
      return;
    }
    if(hit.kind==='resident'){selected=hit.id;selectedThing=null;updatePeople();update(true);}
    if(hit.kind==='thing'){selectedThing=hit.id;updatePeople();update(true);}
  };
  land.addEventListener('pointerdown',onDown as EventListener);land.addEventListener('pointerup',onUp as EventListener);
  view.onAuthorGesture?.(pose=>{
    if(mode!=='author')return;
    if(draft?.kind==='create')draft={kind:'create',form:{...draft.form,position:[...pose.position],yaw:pose.yaw}};
    else {const local=worldToFormPose(session.state.source,formId,pose.position,pose.yaw);draft={kind:'transform',formId,...local};}
    updatePreview();showAuthor();
  });
  query('.touch-controls').querySelectorAll<HTMLButtonElement>('[data-move]').forEach(b=>{
    b.onpointerdown=e=>{e.preventDefault();if(mode==='play'&&!session.paused){b.setPointerCapture?.(e.pointerId);held.add(b.dataset.move!);updateMovement();}};
    b.onpointerup=b.onpointercancel=()=>{held.delete(b.dataset.move!);updateMovement();};
  });
  view.setMode?.(mode,session.player.id);query('.inspector').classList.add('play-inspector');updatePeople();update(true);
  const interval=window.setInterval(()=>{if(!disposed&&session.state.tick>0)autosave();},30000);
  return {update,autosave,dispose(){disposed=true;clearInput();clearPreview();view.onAuthorGesture?.(null);window.clearInterval(interval);if(toastTimer!==undefined)window.clearTimeout(toastTimer);window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);window.removeEventListener('blur',clearInput);document.removeEventListener('focusin',onFocus);document.removeEventListener('visibilitychange',onVisibility);land.removeEventListener('pointerdown',onDown as EventListener);land.removeEventListener('pointerup',onUp as EventListener);}};
}
