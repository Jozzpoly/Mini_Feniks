import type { Session } from '../session';
import type { WorldView } from '../view';
import type { PartSource, Vec3 } from '../world/types';

const STORAGE='mini-feniks:checkpoint';
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const icon=(path:string)=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
const pauseIcon=icon('M8 5v14M16 5v14');
const saveIcon=icon('M5 3h12l4 4v14H3V3h2m2 0v6h10V3M7 21v-8h10v8');
const homeIcon=icon('M3 11 12 3l9 8M5 10v11h14V10M9 21v-7h6v7');
const landIcon=icon('M2 20 8 8l5 9 3-6 6 9H2m3-10 4-7 4 7');
const editIcon=icon('m4 16 12-12 4 4-12 12-5 1 1-5m10-10 4 4');

export function createInterface(container:HTMLElement,session:Session,view:WorldView){
  let selected=session.state.residents[0].id,author=false,partId='home-wall-west',lastUpdate=-1,disposed=false;
  let selectedThing:string|null=null;
  container.innerHTML=`<header class="topbar"><div class="wordmark"><strong>MiniFeniks</strong><span>Żywa Kraina</span></div><nav aria-label="Ogląd i świat"><button data-action="home" title="Wróć do domu">${homeIcon}<span>Osada</span></button><button data-action="realm" title="Ogląd całej krainy">${landIcon}<span>Kraina</span></button><button data-action="author">${editIcon}<span>Twórz</span></button></nav><div class="world-actions"><button data-action="pause">${pauseIcon}<span>Pauza</span></button><button data-action="save">${saveIcon}<span>Zapisz</span></button><button data-action="load">Wczytaj</button><button data-action="export" class="less">Plik</button><input type="file" accept="application/json,.json" data-import hidden><button data-action="import" class="less">Otwórz plik</button></div></header><aside class="inspector"><div class="people" aria-label="Mieszkańcy"></div><div class="person-details"></div><div class="author-details" hidden></div></aside><footer><div class="hint">Przeciągnij, aby obracać · kółko przybliża · prawy przycisk przesuwa</div><div class="time" aria-live="off"></div></footer><div class="toast" role="status" aria-live="polite"></div>`;
  const query=<T extends HTMLElement=HTMLElement>(s:string)=>container.querySelector<T>(s)!;
  const notify=(text:string)=>{query('.toast').textContent=text;query('.toast').classList.add('show');window.setTimeout(()=>query('.toast').classList.remove('show'),5000);};
  const button=(name:string)=>query<HTMLButtonElement>(`[data-action="${name}"]`);
  const updatePeople=()=>{
    query('.people').innerHTML=session.state.residents.map(r=>`<button data-person="${escape(r.id)}" class="${selectedThing===null&&r.id===selected?'active':''}">${escape(r.name)}</button>`).join('');
    query('.people').querySelectorAll<HTMLButtonElement>('[data-person]').forEach(b=>b.onclick=()=>{selected=b.dataset.person!;selectedThing=null;author=false;updatePeople();update(true);const r=session.state.residents.find(r=>r.id===selected);if(r)view.focus(r.position,9);});
  };
  const updateAuthor=()=>{
    const parts=session.state.source.home.parts,part=parts.find(p=>p.id===partId)??parts[0];
    if(!part){query('.author-details').innerHTML='<p>Ten zapis nie zawiera części dostępnych do edycji.</p>';return;}
    partId=part.id;
    const fields=(key:'size'|'position')=>part[key].map((v,i)=>`<label>${key==='size'?['Szerokość','Wysokość','Głębokość'][i]:['Wschód','Wysokość','Południe'][i]}<input type="number" step="0.1" data-field="${key}-${i}" value="${v.toFixed(2)}" ${key==='size'?'min="0.02" max="200"':''}></label>`).join('');
    query('.author-details').innerHTML=`<h2>Własna forma</h2><label class="select-label">Część miejsca<select data-part>${session.state.source.home.parts.map(p=>`<option value="${escape(p.id)}" ${p.id===partId?'selected':''}>${escape(p.label)}</option>`).join('')}</select></label><p class="field-title">Wymiary w metrach</p><div class="fields">${fields('size')}</div><p class="field-title">Położenie w metrach</p><div class="fields">${fields('position')}</div><label class="angle-label">Obrót, stopnie<input type="number" data-field="yaw" step="5" value="${(part.yaw*180/Math.PI).toFixed(1)}"></label><button data-action="apply" class="primary">Przyjmij zmianę</button><p class="author-note">Zmieniasz tę samą część krainy. Zajęta przestrzeń i używana podpora mogą wstrzymać poprawkę.</p>`;
    query<HTMLSelectElement>('[data-part]').onchange=e=>{partId=(e.target as HTMLSelectElement).value;updateAuthor();};
    button('apply').onclick=()=>{
      session.paused=true;
      const values=(key:'size'|'position'):Vec3=>[0,1,2].map(i=>Number(query<HTMLInputElement>(`[data-field="${key}-${i}"]`).value)) as Vec3;
      const changes:Partial<Pick<PartSource,'position'|'size'|'yaw'>>={size:values('size'),position:values('position'),yaw:Number(query<HTMLInputElement>('[data-field="yaw"]').value)*Math.PI/180};
      const result=session.edit(partId,changes);notify(result.reason);view.update(session.state);update(true);
    };
  };
  const update=(force=false)=>{
    if(disposed)return;
    if(!force&&session.state.seconds-lastUpdate<.2)return;lastUpdate=session.state.seconds;
    query('.time').textContent=`${session.paused?'Pauza · ':''}${Math.floor(session.state.seconds/60)}:${String(Math.floor(session.state.seconds%60)).padStart(2,'0')} · ${session.state.residents.length} mieszkańców`;
    button('pause').innerHTML=`${pauseIcon}<span>${session.paused?'Wznów':'Pauza'}</span>`;
    query('.person-details').hidden=author;query('.author-details').hidden=!author;button('author').classList.toggle('active',author);
    if(author)return;
    const thing=session.state.things.find(t=>t.id===selectedThing);
    if(thing){
      const holder=session.state.residents.find(r=>r.id===thing.heldBy);
      query('.person-details').innerHTML=`<div class="person-head"><h2>${escape(thing.label)}</h2><button data-action="near" title="Przybliż rzecz">Podejdź bliżej</button></div><p class="own-reason">${thing.consumed?'Zużyta porcja.':holder?`Przenosi: ${escape(holder.name)}.`:'Spoczywa lub porusza się w krainie.'}</p><dl class="thing-properties"><dt>Masa</dt><dd>${thing.mass.toFixed(2)} kg</dd><dt>Wymiary</dt><dd>${thing.size.map(v=>v.toFixed(2)).join(' × ')} m</dd><dt>Położenie</dt><dd>${thing.position.map(v=>v.toFixed(2)).join(' · ')} m</dd></dl>`;
      button('near').onclick=()=>view.focus(thing.position,5);return;
    }
    selectedThing=null;
    const r=session.state.residents.find(r=>r.id===selected)??session.state.residents[0];
    query('.person-details').innerHTML=`<div class="person-head"><h2>${escape(r.name)}</h2><button data-action="near" title="Przybliż osobę">Podejdź bliżej</button></div><p class="own-reason">${escape(r.intent.reason)}</p><div class="need"><span>Zmęczenie</span><div><i style="width:${r.fatigue*100}%"></i></div></div><div class="need"><span>Głód</span><div><i style="width:${r.hunger*100}%"></i></div></div><h3>Pamięta</h3><ol class="memory">${r.memories.slice(-4).reverse().map(m=>`<li>${escape(m.detail)}</li>`).join('')||'<li>Znajome miejsca i wcześniejszą drogę.</li>'}</ol>`;
    button('near').onclick=()=>view.focus(r.position,7);
  };
  button('home').onclick=()=>view.focus(session.state.source.home.position,35);
  button('realm').onclick=()=>view.focus([0,session.state.source.home.position[1],0],1800);
  button('pause').onclick=()=>{session.paused=!session.paused;update(true);};
  button('author').onclick=()=>{author=!author;if(author){session.paused=true;updateAuthor();}update(true);};
  const autosave=()=>{try{localStorage.setItem(STORAGE,session.save());return true;}catch{return false;}};
  button('save').onclick=()=>notify(autosave()?'Zachowano historię tej krainy.':'Nie udało się zapisać w przeglądarce. Możesz zachować plik.');
  const load=async(text:string)=>{
    const paused=session.paused;session.paused=true;
    try{await session.load(text);view.update(session.state);updatePeople();if(author)updateAuthor();update(true);notify('Wczytano zachowaną historię. Świat pozostaje w pauzie.');}
    catch(error){session.paused=paused;notify(error instanceof Error?error.message:'Nie udało się wczytać historii.');}
  };
  button('load').onclick=()=>{const text=localStorage.getItem(STORAGE);if(text)void load(text);else notify('Nie ma jeszcze zapisu w tej przeglądarce.');};
  button('export').onclick=()=>{
    const url=URL.createObjectURL(new Blob([session.save()],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='MiniFeniks-kraina.json';a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  button('import').onclick=()=>query<HTMLInputElement>('[data-import]').click();
  query<HTMLInputElement>('[data-import]').onchange=async e=>{const file=(e.target as HTMLInputElement).files?.[0];if(file){if(file.size>4_000_000){notify('Plik jest zbyt duży dla tego zapisu.');return;}await load(await file.text());}};
  let down=[0,0];const land=view.renderer.domElement;
  const onDown=(e:PointerEvent)=>{down=[e.clientX,e.clientY];};
  const onUp=(e:PointerEvent)=>{
    if(e.button!==0||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;
    const hit=view.pick(e.clientX,e.clientY);if(!hit)return;
    if(hit.kind==='resident'){selected=hit.id;selectedThing=null;author=false;updatePeople();update(true);}
    if(hit.kind==='thing'){selectedThing=hit.id;author=false;updatePeople();update(true);}
    if(hit.kind==='part'&&author){partId=hit.id;updateAuthor();}
  };
  land.addEventListener('pointerdown',onDown as EventListener);land.addEventListener('pointerup',onUp as EventListener);
  updatePeople();update(true);
  const interval=window.setInterval(()=>{if(!disposed&&session.state.tick>0)autosave();},30000);
  return {update,autosave,dispose(){disposed=true;window.clearInterval(interval);land.removeEventListener('pointerdown',onDown as EventListener);land.removeEventListener('pointerup',onUp as EventListener);}};
}
