import type { RegionSource, WorldState } from './types';
import { syncFormProjection } from './forms';

type Data = Record<string, unknown>;
function requireValue(ok: boolean, where: string): asserts ok {
  if (!ok) throw new Error(`Nieprawidłowy checkpoint: ${where}.`);
}
function object(value: unknown, keys: string, where: string, optional = ''): Data {
  requireValue(value !== null && typeof value === 'object' && !Array.isArray(value), where);
  const record = value as Data, required = keys.split(' '), allowed = [...required, ...optional.split(' ').filter(Boolean)];
  requireValue(Object.keys(record).every(key=>allowed.includes(key)) && required.every(key => Object.hasOwn(record, key)), where);
  return record;
}
function text(value: unknown, where: string, empty = false): asserts value is string {
  requireValue(typeof value === 'string' && (empty || value.trim().length > 0), where);
}
function number(value: unknown, where: string, min = -Infinity, max = Infinity): asserts value is number {
  requireValue(typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max, where);
}
function integer(value: unknown, where: string, min = 0): asserts value is number {
  number(value, where, min); requireValue(Number.isSafeInteger(value), where);
}
function vector(value: unknown, length: number, where: string, positive = false): asserts value is number[] {
  requireValue(Array.isArray(value) && value.length === length, where);
  value.forEach(v => number(v, where, positive ? Number.MIN_VALUE : -1e7, 1e7));
}
function quaternion(value: unknown, where: string): void {
  vector(value, 4, where);
  requireValue(Math.abs(Math.hypot(...value) - 1) < .01, where);
}
function list(value: unknown, where: string): unknown[] {
  requireValue(Array.isArray(value), where); return value;
}
function choice(value: unknown, values: string, where: string): void {
  requireValue(typeof value === 'string' && values.split(' ').includes(value), where);
}
function nullableId(value: unknown, where: string): void { if (value !== null) text(value, where); }
const roles = 'wall floor roof step table bench beam';

function part(value: unknown): Data {
  const p = object(value, 'id label position size yaw material role solid', 'część');
  text(p.id, 'ID części'); text(p.label, 'nazwa części');
  vector(p.position, 3, 'położenie części'); vector(p.size, 3, 'wymiary części', true);
  requireValue((p.size as number[]).every(v=>v>=.02&&v<=200),'wymiary części poza zakresem wykonawcy');
  number(p.yaw, 'obrót części'); choice(p.role, roles, 'rola części');
  choice(p.material, 'stone plaster timber thatch earth water cloth leaves', 'materiał');
  requireValue(typeof p.solid === 'boolean', 'kolizja części'); return p;
}
function samePart(a: Data | undefined, b: Data): boolean {
  return a !== undefined && Object.keys(b).every(key => Array.isArray(b[key])
    ? JSON.stringify(a[key]) === JSON.stringify(b[key]) : a[key] === b[key]);
}

/** Validate semantic data before rebuilding any rendering or solver representation. */
function validate(value: unknown): asserts value is WorldState {
  const w = object(value, 'schema worldId tick seconds source residents things events revisions', 'świat', 'resources');
  requireValue(w.schema === 1 || w.schema === 2, 'wersja schematu');
  text(w.worldId, 'ID świata'); integer(w.tick, 'zakończony krok'); number(w.seconds, 'zakończony czas', 0);
  const now = w.seconds;
  const source = object(w.source, 'id revision seed terrainVersion extent home places channels', 'źródło regionu', 'forms freePlaces retiredIds resourceSites');
  text(source.terrainVersion, 'wersja reguły geografii');
  text(source.id, 'ID regionu'); integer(source.revision, 'rewizja źródła'); integer(source.seed, 'ziarno', -Number.MAX_SAFE_INTEGER);
  vector(source.extent, 2, 'zasięg regionu', true);
  requireValue(w.worldId === `world:${source.id}`, 'powiązanie świata i źródła');
  const identities = new Set<string>();
  const register = (id: unknown) => {
    text(id, 'trwałe ID'); requireValue(!identities.has(id), `powtórzone ID ${id}`); identities.add(id);
  };
  register(w.worldId); register(source.id);
  const home = object(source.home, 'id position yaw parts', 'dom');
  register(home.id); vector(home.position, 3, 'położenie domu'); number(home.yaw, 'obrót domu');
  const parts = list(home.parts, 'części domu').map(p => part(p));
  parts.forEach(p => register(p.id));
  const partIds = new Set(parts.map(p => p.id));
  const retired = new Set<unknown>();
  if(source.retiredIds!==undefined)for(const id of list(source.retiredIds,'wycofane tożsamości')){
    text(id,'wycofana tożsamość');requireValue(!retired.has(id),'powtórzona wycofana tożsamość');retired.add(id);
  }
  if(w.schema===2){
    requireValue(Array.isArray(source.forms)&&Array.isArray(source.freePlaces)&&Array.isArray(source.retiredIds),'źródło form');
    for(const raw of list(source.forms,'formy')){
      const f=object(raw,'id label kind parentId position yaw parts uses','forma');
      if(f.id!==home.id)register(f.id);
      text(f.label,'nazwa formy');choice(f.kind,'house bench table wall platform arch rock custom','rodzaj formy');
      nullableId(f.parentId,'rodzic formy');vector(f.position,3,'lokalne położenie formy');number(f.yaw,'lokalny obrót formy');
      list(f.parts,'lokalne części').forEach(p=>part(p));
      list(f.uses,'lokalne użycia').forEach(raw=>{
        const u=object(raw,'id label position kind','lokalne użycie');text(u.id,'ID użycia');text(u.label,'nazwa użycia');
        vector(u.position,3,'lokalne położenie użycia');choice(u.kind,'rest food lookout home put gather','rodzaj użycia');
      });
    }
    const projected=structuredClone(w.source) as RegionSource;syncFormProjection(projected);
    requireValue(JSON.stringify(projected.home)===JSON.stringify(source.home)&&JSON.stringify(projected.places)===JSON.stringify(source.places),'zgodność projekcji ze źródłem form');
  }
  const places = list(source.places, 'miejsca').map(value => {
    const p = object(value, 'id label position kind', 'miejsce');
    register(p.id); text(p.label, 'nazwa miejsca'); vector(p.position, 3, 'położenie miejsca');
    choice(p.kind, 'rest food lookout home put gather', 'rodzaj miejsca'); return p;
  });
  const placeIds = new Set(places.map(p => p.id));
  list(source.channels, 'cieki').forEach(value => {
    const c = object(value, 'id points width', 'ciek'); register(c.id); number(c.width, 'szerokość cieku', Number.MIN_VALUE);
    const points = list(c.points, 'punkty cieku'); requireValue(points.length >= 2, 'ciąg cieku');
    points.forEach(p => vector(p, 3, 'punkt cieku'));
  });
  const sites=new Map<unknown,Data>();
  if(source.resourceSites!==undefined)for(const raw of list(source.resourceSites,'miejsca zasobów')){
    const s=object(raw,'id label position capacity kind','miejsce zasobu');
    const use=places.find(p=>p.id===s.id&&p.kind==='gather');
    requireValue(!!use&&!sites.has(s.id),'jedno powiązanie używania zasobu');text(s.label,'nazwa zasobu');
    vector(s.position,3,'położenie zasobu');integer(s.capacity,'pojemność zasobu');number(s.capacity,'pojemność zasobu',0,100000);
    requireValue(JSON.stringify(s.position)===JSON.stringify(use.position),'położenie zasobu jest projekcją własnego użycia');
    choice(s.kind,'berries apple','rodzaj zasobu');sites.set(s.id,s);
  }
  if(w.resources!==undefined){
    const stocks=new Set<unknown>();
    for(const raw of list(w.resources,'zasoby')){
      const r=object(raw,'id units','zasób');requireValue((sites.has(r.id)||retired.has(r.id))&&!stocks.has(r.id),'powiązanie zasobu');stocks.add(r.id);
      integer(r.units,'pozostałe jednostki');number(r.units,'pozostałe jednostki',0,(sites.get(r.id)?.capacity as number|undefined)??100000);
    }
    requireValue([...sites.keys()].every(id=>stocks.has(id)),'kompletność zasobów');
  }else requireValue(sites.size===0,'brak stanu zasobów');
  const residents = list(w.residents, 'mieszkańcy').map(value => {
    const p = object(value, 'id name position rotation velocity angularVelocity fatigue hunger sociability curiosity preferredRest known knownParts knownThings memories intent posture holding blockedFor restUntil reconsiderAt', 'mieszkaniec', 'control knownResources knownPeople carryYaw carryHeight activity concern');
    if(p.carryYaw!==undefined)number(p.carryYaw,'obrót chwytu',-Math.PI,Math.PI);
    if(p.carryHeight!==undefined)number(p.carryHeight,'wysokość chwytu',-.4,1.1);
    if(p.activity!==undefined){
      const a=object(p.activity,'kind targetId elapsed duration startedAt origin','czynność');
      choice(a.kind,'eat gather','rodzaj czynności');text(a.targetId,'cel czynności');
      number(a.duration,'czas wykonania',.01,60);number(a.elapsed,'postęp',0,a.duration as number);number(a.startedAt,'początek czynności',0,now);vector(a.origin,3,'początek pracy');
    }
    if(p.concern!==undefined){
      const c=object(p.concern,'kind placeId desiredUnits startedAt reason satisfied','własna sprawa');
      choice(c.kind,'provision','rodzaj sprawy');text(c.placeId,'miejsce sprawy');integer(c.desiredUnits,'oczekiwany zapas',1);number(c.desiredUnits,'rozmiar zapasu',1,20);
      number(c.startedAt,'początek sprawy',0,now);text(c.reason,'powód sprawy');requireValue(typeof c.satisfied==='boolean','stan sprawy');
    }
    register(p.id); text(p.name, 'imię');
    if(p.control!==undefined)choice(p.control,'player resident','źródło kontroli');
    if(p.knownResources!==undefined){
      const ids=new Set<unknown>();
      for(const raw of list(p.knownResources,'poznane zasoby')){
        const k=object(raw,'id position seenAt available','poznany zasób');requireValue((sites.has(k.id)||retired.has(k.id))&&!ids.has(k.id),'powiązanie poznanego zasobu');ids.add(k.id);
        vector(k.position,3,'poznane położenie zasobu');number(k.seenAt,'czas poznania zasobu',0,now);requireValue(typeof k.available==='boolean','poznana dostępność zasobu');
      }
    }
    if(p.knownPeople!==undefined){
      const ids=new Set<unknown>();
      for(const raw of list(p.knownPeople,'poznane osoby')){
        const k=object(raw,'id position seenAt','poznana osoba');text(k.id,'ID poznanej osoby');requireValue(!ids.has(k.id),'powtórzona poznana osoba');ids.add(k.id);
        vector(k.position,3,'poznane położenie osoby');number(k.seenAt,'czas poznania osoby',0,now);
      }
    }
    vector(p.position, 3, 'położenie osoby'); quaternion(p.rotation, 'orientacja osoby');
    vector(p.velocity, 3, 'prędkość osoby'); vector(p.angularVelocity, 3, 'prędkość kątowa osoby');
    for (const field of ['fatigue', 'hunger', 'sociability', 'curiosity', 'posture']) number(p[field], field, 0, 1);
    for (const field of ['blockedFor', 'restUntil', 'reconsiderAt']) number(p[field], field, 0);
    text(p.preferredRest, 'preferowany odpoczynek');
    requireValue(places.some(place => place.id === p.preferredRest && place.kind === 'rest') || retired.has(p.preferredRest), 'powiązanie odpoczynku');
    nullableId(p.holding, 'trzymana rzecz');
    const knownIds = new Set<unknown>();
    list(p.known, 'wiedza miejsc').forEach(value => {
      const k = object(value, 'id kind position seenAt occupiedBy', 'znane miejsce','available');
      if(k.available!==undefined)requireValue(typeof k.available==='boolean','poznana dostępność miejsca');
      requireValue((placeIds.has(k.id)||retired.has(k.id)) && !knownIds.has(k.id), 'powiązanie znanego miejsca'); knownIds.add(k.id);
      choice(k.kind, 'rest food lookout home put gather', 'zapamiętany rodzaj miejsca');
      vector(k.position, 3, 'znane położenie'); number(k.seenAt, 'czas obserwacji', 0, now);
      nullableId(k.occupiedBy, 'poznany mieszkaniec');
    });
    const knownPartIds = new Set<unknown>();
    list(p.knownParts, 'wiedza części').forEach(value => {
      const k = object(value, 'id position size yaw role seenAt', 'znana część','present');
      if(k.present!==undefined)requireValue(typeof k.present==='boolean','poznana obecność części');
      requireValue((partIds.has(k.id)||retired.has(k.id)) && !knownPartIds.has(k.id), 'powiązanie znanej części'); knownPartIds.add(k.id);
      vector(k.position, 3, 'zapamiętane położenie'); vector(k.size, 3, 'zapamiętane wymiary', true);
      number(k.yaw, 'zapamiętany obrót'); choice(k.role, roles, 'zapamiętana rola');
      number(k.seenAt, 'czas obserwacji części', 0, now);
    });
    const knownThingIds = new Set<unknown>();
    list(p.knownThings, 'wiedza rzeczy').forEach(value => {
      const k = object(value, 'id kind position seenAt available', 'znana rzecz','size rotation present');
      if(k.size!==undefined)vector(k.size,3,'poznane wymiary',true);if(k.rotation!==undefined)quaternion(k.rotation,'poznana orientacja');
      text(k.id, 'ID znanej rzeczy'); requireValue(!knownThingIds.has(k.id), 'powtórzona znana rzecz'); knownThingIds.add(k.id);
      if(k.present!==undefined)requireValue(typeof k.present==='boolean','zapamiętana obecność rzeczy');
      choice(k.kind, 'bag food stool material', 'zapamiętany rodzaj rzeczy'); vector(k.position, 3, 'zapamiętane położenie rzeczy');
      number(k.seenAt, 'czas obserwacji rzeczy', 0, now); requireValue(typeof k.available === 'boolean', 'zapamiętana dostępność');
    });
    list(p.memories, 'pamięć').forEach(value => {
      const m = object(value, 'time kind target detail', 'wspomnienie');
      number(m.time, 'czas wspomnienia', 0, now); choice(m.kind, 'saw arrived blocked rested ate placed picked gathered met', 'rodzaj wspomnienia');
      text(m.target, 'cel wspomnienia'); text(m.detail, 'treść wspomnienia', true);
    });
    const intent = object(p.intent, 'goal targetId reason chosenAt', 'zamiar');
    choice(intent.goal, 'carry-home rest eat wander quiet gather meet store fetch', 'cel zamiaru'); nullableId(intent.targetId, 'ID celu');
    text(intent.reason, 'powód', true); number(intent.chosenAt, 'czas decyzji', 0, now);
    return p;
  });
  requireValue(residents.length > 0, 'ta wersja krainy wymaga co najmniej jednego mieszkańca');
  const residentIds = new Set(residents.map(p => p.id));
  requireValue(residents.filter(r=>r.control==='player').length<=1,'jedna postać gracza');
  const things = list(w.things, 'rzeczy').map(value => {
    const t = object(value, 'id label kind size mass position rotation velocity angularVelocity heldBy consumed', 'rzecz','foodFlavor material');
    register(t.id); text(t.label, 'nazwa rzeczy'); choice(t.kind, 'bag food stool material', 'rodzaj rzeczy');
    if(t.material!==undefined)choice(t.material,'stone plaster timber thatch earth water cloth leaves','materiał rzeczy');
    if(t.foodFlavor!==undefined)choice(t.foodFlavor,'bread berries apple','rodzaj żywności');
    vector(t.size, 3, 'wymiary rzeczy', true);requireValue((t.size as number[]).every(v=>v>=.02&&v<=200),'wymiary rzeczy poza zakresem wykonawcy');number(t.mass, 'masa', .001, 1e7);
    vector(t.position, 3, 'położenie rzeczy'); quaternion(t.rotation, 'orientacja rzeczy');
    vector(t.velocity, 3, 'prędkość rzeczy'); vector(t.angularVelocity, 3, 'prędkość kątowa rzeczy');
    nullableId(t.heldBy, 'nosiciel'); requireValue(typeof t.consumed === 'boolean', 'zużycie rzeczy');
    requireValue(!t.consumed || t.heldBy === null, 'chwyt zużytej rzeczy'); return t;
  });
  for(const id of retired)requireValue(!identities.has(id as string)||(id===home.id&&!(source.forms as Data[]|undefined)?.some(f=>f.id===home.id)),'tożsamość nie może być jednocześnie czynna i wycofana');
  for (const person of residents) {
    const held = things.filter(t => t.heldBy === person.id);
    requireValue(person.holding === null ? held.length === 0 : held.length === 1 && held[0].id === person.holding, 'zgodność chwytu');
    const intent = person.intent as Data;
    const activity=person.activity as Data|undefined,concern=person.concern as Data|undefined;
    if(activity)requireValue(identities.has(activity.targetId as string)||retired.has(activity.targetId),'powiązanie czynności');
    if(concern)requireValue(placeIds.has(concern.placeId)||retired.has(concern.placeId),'powiązanie własnej sprawy');
    requireValue(intent.targetId === null || identities.has(intent.targetId as string)||retired.has(intent.targetId), 'powiązanie celu zamiaru');
    for (const k of person.known as Data[]) requireValue(k.occupiedBy === null || residentIds.has(k.occupiedBy), 'powiązanie poznanej osoby');
    if(person.knownPeople!==undefined)for(const k of person.knownPeople as Data[])requireValue(residentIds.has(k.id),'powiązanie poznanej osoby');
  }
  for (const thing of things) requireValue(thing.heldBy === null || residentIds.has(thing.heldBy), 'powiązanie nosiciela');
  list(w.events, 'zdarzenia').forEach(value => {
    const e = object(value, 'time kind actor target detail', 'zdarzenie');
    number(e.time, 'czas zdarzenia', 0, now); text(e.kind, 'rodzaj zdarzenia'); nullableId(e.actor, 'aktor zdarzenia');
    requireValue(e.actor === null || residentIds.has(e.actor), 'powiązanie aktora');
    text(e.target, 'cel zdarzenia'); text(e.detail, 'treść zdarzenia', true);
  });
  let previous = 0;
  const latest = new Map<unknown, Data>();
  list(w.revisions, 'historia rewizji').forEach(value => {
    const r = object(value, 'revision time partId before after', 'rewizja');
    integer(r.revision, 'numer rewizji', 1);
    requireValue(r.revision > previous && r.revision <= (source.revision as number), 'kolejność rewizji'); previous = r.revision;
    number(r.time, 'czas rewizji', 0, now); requireValue(partIds.has(r.partId)||retired.has(r.partId), 'powiązanie poprawionej części');
    const before = part(r.before), after = part(r.after);
    requireValue(before.id === r.partId && after.id === r.partId, 'tożsamość poprawionej części');
    if (latest.has(r.partId)) requireValue(samePart(latest.get(r.partId), before), 'ciągłość rewizji części');
    latest.set(r.partId, after);
  });
  if(w.schema===1){
    if (previous) requireValue(previous === source.revision, 'końcowa rewizja źródła');
    for (const [id, after] of latest) requireValue(samePart(parts.find(p => p.id === id), after), 'końcowy kształt części');
  }
}

export function encodeCheckpoint(state: WorldState): string {
  validate(state);
  const saved=structuredClone(state);
  if(saved.schema===2){
    // These arrays are derived. Saving them twice would create competing authorities.
    delete (saved.source.home as unknown as Data).parts;
    delete (saved.source as unknown as Data).places;
    for(const site of saved.source.resourceSites??[])delete (site as unknown as Data).position;
  }
  return JSON.stringify(saved);
}
export function decodeCheckpoint(text: string): WorldState {
  const parsed: unknown = JSON.parse(text);
  if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed)&&(parsed as Data).schema===2){
    const source=(parsed as Data).source;
    requireValue(!!source&&typeof source==='object'&&!Array.isArray(source),'źródło regionu');
    const s=source as Data;
    requireValue(!!s.home&&typeof s.home==='object'&&!Array.isArray(s.home),'dom');
    const home=s.home as Data;
    requireValue(!Object.hasOwn(home,'parts')&&!Object.hasOwn(s,'places'),'zapis nie może zawierać konkurencyjnej projekcji');
    home.parts=[];s.places=[];
    syncFormProjection(s as unknown as RegionSource);
  }
  validate(parsed);
  return parsed;
}
