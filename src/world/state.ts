import type { RegionSource, Resident, Thing, Vec3, WorldState } from './types';
import { adoptRegionForms } from './forms';
import {heightAt} from './geography';

/** The authored coordinates are already world coordinates; never re-centre them. */
export function createWorld(input: RegionSource): WorldState {
  const source = structuredClone(input);
  adoptRegionForms(source);
  const homeY = source.home.position[1];
  const steps = source.home.parts.filter(part => part.role === 'step');
  const outsideY = steps.length ? Math.min(...steps.map(part => part.position[1] - part.size[1] / 2)) : homeY - .9;
  const person = (name: string, position: Vec3, preferredRest: string): Resident => ({
    id: `resident:${name.toLowerCase()}`, name, position, rotation: [0, 0, 0, 1],
    velocity: [0, 0, 0], angularVelocity: [0, 0, 0],
    fatigue: name === 'Radom' ? .64 : .38, hunger: name === 'Radom' ? .22 : .35,
    sociability: name === 'Radom' ? .45 : .72, curiosity: name === 'Radom' ? .32 : .68,
    preferredRest,
    // These are declared previous familiarity, not a live copy of the region map.
    known: source.places.filter(p => p.id === preferredRest || p.id === 'lookout-near' || p.kind === 'home' ||
      ((p.kind === 'food' || p.kind === 'put') && Math.hypot(p.position[0], p.position[2]) < 25))
      .map(p => ({ id: p.id, kind: p.kind, position: [...p.position], seenAt: 0, occupiedBy: null })),
    knownParts: source.home.parts.filter(p=>Math.hypot(p.position[0]-position[0],p.position[2]-position[2])<20).map(p => ({ id: p.id, position: [...p.position], size: [...p.size],
      yaw: p.yaw, role: p.role, seenAt: 0 })),
    knownThings: [],
    memories: [], intent: { goal: name === 'Radom' ? 'carry-home' : 'quiet', targetId: null,
      reason: name === 'Radom' ? 'Odłożyć niesioną torbę i odpocząć.' : 'Spokojna chwila przed własnym wyborem.', chosenAt: 0 },
    posture: 0, holding: name === 'Radom' ? 'thing:bag' : null,
    blockedFor: 0, restUntil: 0, reconsiderAt: 0,
  });
  const residents = [person('Radom', [0, outsideY + .9, 7], 'rest-inside'),
    person('Mira', [1.7, outsideY + .9, 8], 'rest-outside')];
  const thing = (id: string, label: string, kind: Thing['kind'], size: Vec3, mass: number,
    position: Vec3, heldBy: string | null): Thing => ({ id, label, kind, size, mass, position,
      rotation: [0, 0, 0, 1], velocity: [0, 0, 0], angularVelocity: [0, 0, 0], heldBy, consumed: false });
  const foodPlace = source.places.find(p => p.kind === 'food');
  const table = source.home.parts.find(p => p.role === 'table');
  const things = [thing('thing:bag', 'Torba Radoma', 'bag', [.45, .5, .3], 3,
      [.56, outsideY + .72, 7], residents[0].id),
    thing('thing:food', 'Chleb na wspólnym stole', 'food', [.25, .12, .18], .45,
      table ? [table.position[0], table.position[1] + table.size[1] / 2 + .06, table.position[2]] :
        foodPlace ? [foodPlace.position[0], foodPlace.position[1] + .06, foodPlace.position[2]] : [-2, homeY + 1.15, 0], null)];
  const material=(id:string,label:string,size:Vec3,x:number,z:number,substance:'timber'|'stone',density:number)=>{
    const t=thing(id,label,'material',size,size[0]*size[1]*size[2]*density,[x,heightAt(x,z)+size[1]/2+.025,z],null);t.material=substance;return t;
  };
  things.push(material('material:plank-a','Sosnowa deska',[1.5,.035,.26],6.4,10,'timber',500),
    material('material:plank-b','Druga sosnowa deska',[1.5,.035,.26],6.4,10.55,'timber',500),
    material('material:wood-block','Dębowy klocek',[.3,.25,.4],7,11.4,'timber',650),
    material('material:stone-block','Ciężki kamień',[.35,.22,.4],7.3,12.2,'stone',2400));
  residents.forEach(p => { p.knownThings = things.filter(t => t.kind === 'food' || t.heldBy === p.id)
    .map(t => ({ id: t.id, kind: t.kind, position: [...t.position], seenAt: 0, available: t.heldBy === null })); });
  return { schema: 2, worldId: `world:${source.id}`, tick: 0, seconds: 0, source, residents, things,
    events: [], revisions: [] };
}
