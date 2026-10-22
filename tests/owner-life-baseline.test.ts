import {expect,it} from 'vitest';
import {createWorld} from '../src/world/state';
import {createRegion} from '../src/world/source';
import {heightAt} from '../src/world/geography';
import {createSession} from '../src/session';
import type {Resident, WorldEvent} from '../src/world/types';

/**
 * Descriptive, non-normative field notes about the *actual native runtime*.
 * No intervention, no injected tasks, no edited needs or actor positions.
 * Reports quiet/movement/intent/event timelines; PASS does NOT mean "alive".
 *
 * Sparse completed-tick samples deliberately avoid relying on capped memory
 * arrays (96 per resident, 256 events world-wide) to reconstruct long history.
 */
it('observes unprompted NPC time budgets across ten game minutes without awarding a life score', async () => {
  const session=await createSession(createWorld(createRegion()),heightAt);
  try {
    const dt=.1, steps=6000, names=['Mira','Radom'];
    const byName=Object.fromEntries(names.map(name=>[name,{
      intentSeconds:{} as Record<string,number>,movingSeconds:0,quietSeconds:0,
      longestQuiet:0,currentQuiet:0,pathLength:0,lastPosition:null as number[]|null,
      events:{} as Record<string,number>,consecutiveIdleIntervals:0,
      phases:[] as Array<{from:number,to:number,quietPct:number,movingPct:number,materialActions:number,goals:string[],gathered:number}>,
      sampledPhase:null as {quiet:number,moving:number,material:number,goals:Set<string>}|null
    }]));
    const materialKinds=new Set(['picked','placed','gathered','ate']);
    const increments = (r:Resident,dt:number) => {
      const p=byName[r.name];if(!p)return;
      const goal=r.intent.goal;
      p.intentSeconds[goal]=(p.intentSeconds[goal]??0)+dt;
      const q=goal==='quiet';if(q){p.quietSeconds+=dt;p.currentQuiet+=dt;}else{p.longestQuiet=Math.max(p.longestQuiet,p.currentQuiet);p.currentQuiet=0;}
      const velocity=Math.hypot(r.velocity[0],r.velocity[2]);
      const moving=velocity>.14;if(moving)p.movingSeconds+=dt;
      if(p.lastPosition)p.pathLength+=Math.hypot(r.position[0]-p.lastPosition[0],r.position[2]-p.lastPosition[2]);
      p.lastPosition=[...r.position];
      p.sampledPhase??={quiet:0,moving:0,material:0,goals:new Set()};
      if(q)p.sampledPhase.quiet+=dt;if(moving)p.sampledPhase.moving+=dt;
      p.sampledPhase.goals.add(goal);
    };
    let lastScanned=-1;
    const milestones:unknown[]=[];
    const eventCountByActor:Record<string,Record<string,number>>={};
    for(let step=0;step<steps;step++){
      session.advance(dt);
      for(const r of session.state.residents)if(r.control!=='player')increments(r,dt);
      const newest=session.state.events.filter((e:WorldEvent)=>e.time>lastScanned+1e-8);
      if(newest.length)lastScanned=Math.max(...newest.map(e=>e.time));
      for(const event of newest){
        const owner=session.state.residents.find(r=>r.id===event.actor);
        if(!owner||owner.control==='player')continue;
        const counts=eventCountByActor[owner.name]??(eventCountByActor[owner.name]={});
        counts[event.kind]=(counts[event.kind]??0)+1;
        if(materialKinds.has(event.kind)&&byName[owner.name]?.sampledPhase)
          byName[owner.name].sampledPhase!.material++;
      }
      if((step+1)%600===0){
        for(const name of names){
          const p=byName[name],phase=p.sampledPhase!;
          p.phases.push({from:(step+1)/10-60,to:(step+1)/10,
            quietPct:+(phase.quiet/60*100).toFixed(1),
            movingPct:+(phase.moving/60*100).toFixed(1),
            materialActions:phase.material,
            goals:[...phase.goals].sort(),
            gathered:eventCountByActor[name]?.gathered??0});
          p.sampledPhase=null;
        }
        milestones.push({minute:(step+1)/600,residents:names.map(name=>{
          const r=session.state.residents.find(x=>x.name===name)!;
          return {name,goal:r.intent.goal,concern:r.concern?.satisfied??null,holding:r.holding,hunger:+r.hunger.toFixed(3),fatigue:+r.fatigue.toFixed(3)}
        })});
      }
    }
    const report=names.map(name=>{
      const p=byName[name];
      return {name,
        quietPct:+(p.quietSeconds/600*100).toFixed(1),
        movingPct:+(p.movingSeconds/600*100).toFixed(1),
        longestQuiet:+Math.max(p.longestQuiet,p.currentQuiet).toFixed(1),
        pathMeters:+p.pathLength.toFixed(1),
        intentSeconds:Object.fromEntries(Object.entries(p.intentSeconds).map(([k,v])=>[k,+v.toFixed(1)])),
        actionEvents:eventCountByActor[name]??{},
        phases:p.phases
      };
    });
    console.info('OWNER_NPC_LIFE_BASELINE',JSON.stringify({
      durationSeconds:600,simulationSteps:session.physics.metrics.steps,
      classification:'Descriptive activity budget, not a life score',
      report,milestones,
      limits:['no Owner playtest','no actor social interpretation','goals and movement are not quality',
        'actions counted only for world events, memory is capped','one authored initial world'],
    }));
    expect(session.state.seconds).toBeCloseTo(600,4);
    expect(session.physics.metrics.steps).toBe(36000);
    expect(report).toHaveLength(2);
    for(const row of report){
      expect(row.phases).toHaveLength(10);
      expect(row.quietPct).toBeGreaterThanOrEqual(0);
      expect(row.quietPct).toBeLessThanOrEqual(100);
    }
  }finally{session.dispose();}
},60_000);
