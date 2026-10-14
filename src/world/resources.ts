import { heightAt } from './geography';
import { adoptRegionForms, syncFormProjection } from './forms';
import type { FormSource, ResourceSite, WorldState } from './types';

/** Finite harvest already present in this season. Loading does not replenish it. */
export function establishResourceSites(state:WorldState):void {
  if(!state.source.resourceSites){
    adoptRegionForms(state.source);
    const site=(id:string,label:string,x:number,z:number,capacity:number,kind:ResourceSite['kind']):ResourceSite=>
      ({id,label,position:[x,heightAt(x,z)+.9,z],capacity,kind});
    state.source.resourceSites=[
      site('resource:bramble-west','Jeżyny przy skraju polany',-11,13,12,'berries'),
      site('resource:apple','Jabłoń na polanie',-10.9,8.65,18,'apple'),
      site('resource:bramble-east','Jeżyny przy leśnej ścieżce',13,20,12,'berries'),
    ];
    for(const s of state.source.resourceSites){
      const ground=heightAt(s.position[0],s.position[2]),apple=s.kind==='apple';
      const form:FormSource={id:`plant:${s.id}`,label:s.label,kind:'custom',parentId:null,
        position:[s.position[0]-(apple?1.1:.65),ground,s.position[2]-.65],yaw:0,
        parts:[{id:`${s.id}:stem`,label:s.label,position:[0,apple?1.15:.35,0],size:apple?[.28,2.3,.28]:[.08,.7,.08],yaw:0,role:'beam',material:'timber',solid:true},
          {id:`${s.id}:leaves`,label:s.label,position:[0,apple?2.4:.7,0],size:apple?[3.3,2.6,3.3]:[1.7,1.15,1.7],yaw:0,role:'beam',material:'leaves',solid:false}],
        uses:[{id:s.id,label:s.label,kind:'gather',position:[apple?1.1:.65,.9,.65]}]};
      state.source.forms!.push(form);
    }
    syncFormProjection(state.source);
  }
  state.resources??=state.source.resourceSites.map(s=>({id:s.id,units:s.capacity}));
}
