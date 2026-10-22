import { expect, it } from 'vitest';
import { createWorld } from '../src/world/state';
import { createRegion } from '../src/world/source';
import { createSession } from '../src/session';
import { heightAt } from '../src/world/geography';
import { decodeCheckpoint } from '../src/world/checkpoint';
import type { Thing, Vec3 } from '../src/world/types';

/**
 * A perceived opportunity is not automatically an agent's interest.
 *
 * Native 60Hz Box3D, unchanged cognition, identical checkpoint at t=120s.
 * A: untouched; B: new reachable-looking material things appear nearby;
 * C: same as B, plus a diagnostic increase in hunger as a positive
 * sensitivity control. Not a player action, not a believability benchmark.
 */
it('perceived material novelty versus actual intention during otherwise quiet life', async () => {
  const initial=await createSession(createWorld(createRegion()),heightAt);
  let checkpoint='';
  try {
    for(let i=0;i<1200;i++) initial.advance(.1);
    checkpoint=initial.save();
  } finally { initial.dispose(); }
  const root=decodeCheckpoint(checkpoint);
  const resident=root.residents.find(r=>r.name==='Mira')!;
  expect(resident.intent.goal).toBe('quiet');

  const arm=async (mode:'A-control'|'B-material'|'C-hunger')=>{
    const state=decodeCheckpoint(checkpoint);
    const mira=state.residents.find(r=>r.name==='Mira')!;
    const created:string[]=[];
    if(mode!=='A-control'){
      const template=state.things.find(t=>t.id==='material:wood-block')!;
      const offsets:[number,number][]=[[2.0,.75],[3.4,.2],[-1.2,2.7]];
      for(let i=0;i<offsets.length;i++){
        const [dx,dz]=offsets[i],x=mira.position[0]+dx,z=mira.position[2]+dz;
        const thing:Thing={...structuredClone(template),
          id:'study:wood:'+i,label:'Nowy materiał '+i,kind:'material',
          position:[x,heightAt(x,z)+template.size[1]/2+.06,z],
          velocity:[0,0,0] as Vec3,angularVelocity:[0,0,0] as Vec3,
          heldBy:null,consumed:false};
        state.things.push(thing);created.push(thing.id);
      }
    }
    if(mode==='C-hunger') mira.hunger=.9; // NOT comparable biology; sensitivity control only.
    const initialHunger=+mira.hunger.toFixed(3);
    const s=await createSession(state,heightAt);
    try{
      let quietTicks=0,movementTicks=0,goalTargetsNew=0;
      const goals=new Set<string>(),progress:unknown[]=[];
      let newWitnessed=false;
      for(let i=0;i<1200;i++){
        s.advance(.1);
        const r=s.state.residents.find(x=>x.name==='Mira')!;
        if(r.intent.goal==='quiet')quietTicks++;
        if(Math.hypot(r.velocity[0],r.velocity[2])>.14)movementTicks++;
        if(created.includes(r.intent.targetId??''))goalTargetsNew++;
        goals.add(r.intent.goal);
        const witnesses=created.filter(id=>r.knownThings.some(k=>k.id===id&&k.present!==false));
        if(witnesses.length)newWitnessed=true;
        if([9,299,599,1199].includes(i))progress.push({
          elapsed:+((i+1)*.1).toFixed(1),goal:r.intent.goal,knownMaterial:witnesses.length,
          hunger:+r.hunger.toFixed(3),position:r.position.map(n=>+n.toFixed(2))
        });
      }
      const r=s.state.residents.find(x=>x.name==='Mira')!;
      return {
        mode,initialHunger,
        quietPct:+(quietTicks/12).toFixed(1),movingPct:+(movementTicks/12).toFixed(1),
        sawMaterial:newWitnessed,knownNewMaterials:created.filter(id=>r.knownThings.some(k=>k.id===id)).length,
        goalTargetsNew,newMaterialActions:s.state.events.filter(e=>e.actor===r.id&&created.includes(e.target)&&['picked','placed','gathered'].includes(e.kind)).length,
        goals:[...goals].sort(),events:s.state.events.filter(e=>e.actor===r.id&&['gathered','placed','met','ate'].includes(e.kind)).map(e=>e.kind),
        progress
      };
    }finally{s.dispose();}
  };
  const a=await arm('A-control'), b=await arm('B-material'), c=await arm('C-hunger');
  console.info('OWNER_OPPORTUNITY_GAP',JSON.stringify({startSeconds:120,
    initialMira:{position:resident.position,goal:resident.intent.goal,hunger:resident.hunger,
      knownMaterials:resident.knownThings.filter(t=>t.kind==='material').length},a,b,c,
    interpretation:'One world, source cognition. Seeing wood does not supply intention to use it. Extra objects are diagnostic fixture, not normal player placement.'}));
  expect(b.sawMaterial).toBe(true);
  expect(b.knownNewMaterials).toBeGreaterThan(0);
  expect(b.goalTargetsNew).toBe(0);
  expect(b.newMaterialActions).toBe(0);
  expect(a.quietPct).toBeGreaterThan(75);
  expect(b.quietPct).toBeGreaterThan(75);
  expect(c.goals.some(g=>g==='eat'||g==='gather')).toBe(true);
},60_000);
