import type { WorldState } from './types';

type Data = Record<string, unknown>;
function requireValue(ok: boolean, where: string): asserts ok {
  if (!ok) throw new Error(`Nieprawidłowy checkpoint: ${where}.`);
}
function object(value: unknown, keys: string, where: string): Data {
  requireValue(value !== null && typeof value === 'object' && !Array.isArray(value), where);
  const record = value as Data, allowed = keys.split(' ');
  requireValue(Object.keys(record).length === allowed.length && allowed.every(key => Object.hasOwn(record, key)), where);
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
  value.forEach(v => number(v, where, positive ? Number.MIN_VALUE : -Infinity));
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
  number(p.yaw, 'obrót części'); choice(p.role, roles, 'rola części');
  choice(p.material, 'stone plaster timber thatch earth water cloth', 'materiał');
  requireValue(typeof p.solid === 'boolean', 'kolizja części'); return p;
}
function samePart(a: Data | undefined, b: Data): boolean {
  return a !== undefined && Object.keys(b).every(key => Array.isArray(b[key])
    ? JSON.stringify(a[key]) === JSON.stringify(b[key]) : a[key] === b[key]);
}

/** Validate semantic data before rebuilding any rendering or solver representation. */
function validate(value: unknown): asserts value is WorldState {
  const w = object(value, 'schema worldId tick seconds source residents things events revisions', 'świat');
  requireValue(w.schema === 1, 'wersja schematu');
  text(w.worldId, 'ID świata'); integer(w.tick, 'zakończony krok'); number(w.seconds, 'zakończony czas', 0);
  const now = w.seconds;
  const source = object(w.source, 'id revision seed terrainVersion extent home places channels', 'źródło regionu');
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
  const places = list(source.places, 'miejsca').map(value => {
    const p = object(value, 'id label position kind', 'miejsce');
    register(p.id); text(p.label, 'nazwa miejsca'); vector(p.position, 3, 'położenie miejsca');
    choice(p.kind, 'rest food lookout home put', 'rodzaj miejsca'); return p;
  });
  const placeIds = new Set(places.map(p => p.id));
  list(source.channels, 'cieki').forEach(value => {
    const c = object(value, 'id points width', 'ciek'); register(c.id); number(c.width, 'szerokość cieku', Number.MIN_VALUE);
    const points = list(c.points, 'punkty cieku'); requireValue(points.length >= 2, 'ciąg cieku');
    points.forEach(p => vector(p, 3, 'punkt cieku'));
  });
  const residents = list(w.residents, 'mieszkańcy').map(value => {
    const p = object(value, 'id name position rotation velocity angularVelocity fatigue hunger sociability curiosity preferredRest known knownParts knownThings memories intent posture holding blockedFor restUntil reconsiderAt', 'mieszkaniec');
    register(p.id); text(p.name, 'imię');
    vector(p.position, 3, 'położenie osoby'); quaternion(p.rotation, 'orientacja osoby');
    vector(p.velocity, 3, 'prędkość osoby'); vector(p.angularVelocity, 3, 'prędkość kątowa osoby');
    for (const field of ['fatigue', 'hunger', 'sociability', 'curiosity', 'posture']) number(p[field], field, 0, 1);
    for (const field of ['blockedFor', 'restUntil', 'reconsiderAt']) number(p[field], field, 0);
    text(p.preferredRest, 'preferowany odpoczynek');
    requireValue(places.some(place => place.id === p.preferredRest && place.kind === 'rest'), 'powiązanie odpoczynku');
    nullableId(p.holding, 'trzymana rzecz');
    const knownIds = new Set<unknown>();
    list(p.known, 'wiedza miejsc').forEach(value => {
      const k = object(value, 'id kind position seenAt occupiedBy', 'znane miejsce');
      requireValue(placeIds.has(k.id) && !knownIds.has(k.id), 'powiązanie znanego miejsca'); knownIds.add(k.id);
      choice(k.kind, 'rest food lookout home put', 'zapamiętany rodzaj miejsca');
      vector(k.position, 3, 'znane położenie'); number(k.seenAt, 'czas obserwacji', 0, now);
      nullableId(k.occupiedBy, 'poznany mieszkaniec');
    });
    const knownPartIds = new Set<unknown>();
    list(p.knownParts, 'wiedza części').forEach(value => {
      const k = object(value, 'id position size yaw role seenAt', 'znana część');
      requireValue(partIds.has(k.id) && !knownPartIds.has(k.id), 'powiązanie znanej części'); knownPartIds.add(k.id);
      vector(k.position, 3, 'zapamiętane położenie'); vector(k.size, 3, 'zapamiętane wymiary', true);
      number(k.yaw, 'zapamiętany obrót'); choice(k.role, roles, 'zapamiętana rola');
      number(k.seenAt, 'czas obserwacji części', 0, now);
    });
    const knownThingIds = new Set<unknown>();
    list(p.knownThings, 'wiedza rzeczy').forEach(value => {
      const k = object(value, 'id kind position seenAt available', 'znana rzecz');
      text(k.id, 'ID znanej rzeczy'); requireValue(!knownThingIds.has(k.id), 'powtórzona znana rzecz'); knownThingIds.add(k.id);
      choice(k.kind, 'bag food stool', 'zapamiętany rodzaj rzeczy'); vector(k.position, 3, 'zapamiętane położenie rzeczy');
      number(k.seenAt, 'czas obserwacji rzeczy', 0, now); requireValue(typeof k.available === 'boolean', 'zapamiętana dostępność');
    });
    list(p.memories, 'pamięć').forEach(value => {
      const m = object(value, 'time kind target detail', 'wspomnienie');
      number(m.time, 'czas wspomnienia', 0, now); choice(m.kind, 'saw arrived blocked rested ate placed', 'rodzaj wspomnienia');
      text(m.target, 'cel wspomnienia'); text(m.detail, 'treść wspomnienia', true);
    });
    const intent = object(p.intent, 'goal targetId reason chosenAt', 'zamiar');
    choice(intent.goal, 'carry-home rest eat wander quiet', 'cel zamiaru'); nullableId(intent.targetId, 'ID celu');
    text(intent.reason, 'powód', true); number(intent.chosenAt, 'czas decyzji', 0, now);
    return p;
  });
  requireValue(residents.length > 0, 'ta wersja krainy wymaga co najmniej jednego mieszkańca');
  const residentIds = new Set(residents.map(p => p.id));
  const things = list(w.things, 'rzeczy').map(value => {
    const t = object(value, 'id label kind size mass position rotation velocity angularVelocity heldBy consumed', 'rzecz');
    register(t.id); text(t.label, 'nazwa rzeczy'); choice(t.kind, 'bag food stool', 'rodzaj rzeczy');
    vector(t.size, 3, 'wymiary rzeczy', true); number(t.mass, 'masa', Number.MIN_VALUE);
    vector(t.position, 3, 'położenie rzeczy'); quaternion(t.rotation, 'orientacja rzeczy');
    vector(t.velocity, 3, 'prędkość rzeczy'); vector(t.angularVelocity, 3, 'prędkość kątowa rzeczy');
    nullableId(t.heldBy, 'nosiciel'); requireValue(typeof t.consumed === 'boolean', 'zużycie rzeczy');
    requireValue(!t.consumed || t.heldBy === null, 'chwyt zużytej rzeczy'); return t;
  });
  for (const person of residents) {
    const held = things.filter(t => t.heldBy === person.id);
    requireValue(person.holding === null ? held.length === 0 : held.length === 1 && held[0].id === person.holding, 'zgodność chwytu');
    const intent = person.intent as Data;
    requireValue(intent.targetId === null || identities.has(intent.targetId as string), 'powiązanie celu zamiaru');
    for (const k of person.known as Data[]) requireValue(k.occupiedBy === null || residentIds.has(k.occupiedBy), 'powiązanie poznanej osoby');
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
    number(r.time, 'czas rewizji', 0, now); requireValue(partIds.has(r.partId), 'powiązanie poprawionej części');
    const before = part(r.before), after = part(r.after);
    requireValue(before.id === r.partId && after.id === r.partId, 'tożsamość poprawionej części');
    if (latest.has(r.partId)) requireValue(samePart(latest.get(r.partId), before), 'ciągłość rewizji części');
    latest.set(r.partId, after);
  });
  if (previous) requireValue(previous === source.revision, 'końcowa rewizja źródła');
  for (const [id, after] of latest) requireValue(samePart(parts.find(p => p.id === id), after), 'końcowy kształt części');
}

export function encodeCheckpoint(state: WorldState): string {
  validate(state);
  return JSON.stringify(state);
}
export function decodeCheckpoint(text: string): WorldState {
  const parsed: unknown = JSON.parse(text);
  validate(parsed);
  return parsed;
}
