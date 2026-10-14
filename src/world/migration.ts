import { REGION_SEED, TERRAIN_VERSION, heightAt, legacyHeightAt } from './geography';
import { adoptRegionForms } from './forms';
import type { Vec3, WorldState } from './types';

/** Upgrade the same history. An authored support and its occupants keep their altitude. */
export function upgradeWorldHistory(state:WorldState):WorldState {
  const oldTerrain=state.source.seed===REGION_SEED&&state.source.terrainVersion==='jaworowa-drainage-1';
  if(oldTerrain){
    const supported=(position:Vec3,half:number)=>state.source.home.parts.some(p=>{
      if(!p.solid)return false;
      const dx=position[0]-p.position[0],dz=position[2]-p.position[2],c=Math.cos(p.yaw),s=Math.sin(p.yaw);
      return Math.abs(c*dx-s*dz)<p.size[0]/2+.05&&Math.abs(s*dx+c*dz)<p.size[2]/2+.05&&Math.abs(position[1]-half-p.position[1]-p.size[1]/2)<.2;
    });
    const shift=(p:Vec3)=>heightAt(p[0],p[2])-legacyHeightAt(p[0],p[2]);
    const moved=new Map<string,number>();
    for(const r of state.residents){const delta=supported(r.position,.9-.38*r.posture)?0:shift(r.position);r.position[1]+=delta;moved.set(r.id,delta);}
    for(const t of state.things)if(!t.consumed)t.position[1]+=t.heldBy?(moved.get(t.heldBy)??0):supported(t.position,t.size[1]/2)?0:shift(t.position);
    // These are authored outdoor places, not anybody's remembered coordinates.
    for(const p of state.source.places)if(p.kind==='lookout'||p.id==='rest-outside')p.position[1]+=shift(p.position);
    state.source.terrainVersion=TERRAIN_VERSION;
    state.events.push({time:state.seconds,kind:'world-upgraded',actor:null,target:state.source.id,detail:'Uzgodniono dawne podłoże z nową geografią. Zachowano przeżytą historię.'});
  }
  if(state.schema===1){adoptRegionForms(state.source);state.schema=2;}
  return state;
}
