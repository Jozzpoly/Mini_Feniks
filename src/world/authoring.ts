import type { FormSource, PartSource, RegionSource, ResourceSite, Vec3, WorldState } from './types';
import { adoptRegionForms, syncFormProjection } from './forms';
export type AuthoringOperation = {kind:'transform';formId:string;position?:Vec3;yaw?:number}|{kind:'create';form:FormSource}|{kind:'remove';formId:string};
export interface AuthoringResult {accepted:boolean;reason:string;formId:string;affectedParts:string[];removedParts:string[];}
interface Entry {formId:string;ids:string[];before:FormSource[];after:FormSource[];retiredBefore:string[];retiredAfter:string[];ancestors:FormSource[];resourceBefore:ResourceSite[];resourceAfter:ResourceSite[];}
const equal=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const vector=(v:unknown):v is Vec3=>Array.isArray(v)&&v.length===3&&v.every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e7);
function validate(source:RegionSource):void {
 for(const f of source.forms??[]){if(!vector(f.position)||!Number.isFinite(f.yaw)||Math.abs(f.yaw)>Math.PI*2)throw new Error('Nieprawidłowe położenie lub obrót formy.');
 for(const p of f.parts)if(!vector(p.position)||!vector(p.size)||p.size.some(n=>n<.02||n>200)||!Number.isFinite(p.yaw)||Math.abs(p.yaw)>Math.PI*2)throw new Error('Nieprawidłowe wymiary części.');for(const u of f.uses)if(!vector(u.position))throw new Error('Nieprawidłowe miejsce używania.');}
 syncFormProjection(source);for(const p of source.home.parts)if(!vector(p.position))throw new Error('Forma wykracza poza przestrzeń świata.');
}
function subtree(source:RegionSource,id:string):FormSource[]{const selected=new Set([id]);let changed=true;while(changed){changed=false;for(const f of source.forms??[])if(f.parentId&&selected.has(f.parentId)&&!selected.has(f.id)){selected.add(f.id);changed=true;}}return (source.forms??[]).filter(f=>selected.has(f.id));}
function ancestors(source:RegionSource,id:string):FormSource[]{const out:FormSource[]=[];let f=source.forms?.find(f=>f.id===id);while(f?.parentId){f=source.forms?.find(a=>a.id===f!.parentId);if(!f||out.some(a=>a.id===f!.id))throw new Error('Nieprawidłowy rodzic formy.');out.push(f);}return out;}
function identities(forms:FormSource[]):string[]{return forms.flatMap(f=>[f.id,...f.parts.map(p=>p.id),...f.uses.map(u=>u.id)]);}
function bounds(p:Pick<PartSource,'position'|'size'|'yaw'>){const c=Math.abs(Math.cos(p.yaw)),s=Math.abs(Math.sin(p.yaw)),half=[(c*p.size[0]+s*p.size[2])/2,p.size[1]/2,(s*p.size[0]+c*p.size[2])/2];return {min:p.position.map((v,i)=>v-half[i]),max:p.position.map((v,i)=>v+half[i])};}
const overlap=(a:ReturnType<typeof bounds>,b:ReturnType<typeof bounds>)=>a.min.every((n,i)=>n<=b.max[i]+.04&&a.max[i]+.04>=b.min[i]);
function occupied(state:WorldState,old:RegionSource,next:RegionSource,partIds:string[],useIds:string[]):string|null{
 const volumes=[...old.home.parts,...next.home.parts].filter(p=>partIds.includes(p.id)&&p.solid).map(bounds);
 for(const person of state.residents){const body=bounds({position:person.position,size:[.9,1.9,.9],yaw:0});if(volumes.some(v=>overlap(v,body)))return `Zajęta przestrzeń lub podparcie: ${person.name}.`;
 if(person.intent.goal==='rest'&&person.intent.targetId&&useIds.includes(person.intent.targetId))return `Forma jest używana przez odpoczynek: ${person.name}.`;}
 for(const thing of state.things){if(thing.consumed)continue;const d=Math.hypot(...thing.size),body=bounds({position:thing.position,size:[d,d,d],yaw:0});if(volumes.some(v=>overlap(v,body)))return `Zajęta przestrzeń lub podparcie rzeczy: ${thing.label}.`;}return null;
}
/** History contains scoped author source records; lived state is never captured or replaced. */
export class AuthoringHistory {
 private past:Entry[]=[];private future:Entry[]=[];
 capture(){return structuredClone({past:this.past,future:this.future});}
 restoreCapture(snapshot:{past:Entry[];future:Entry[]}){this.past=snapshot.past;this.future=snapshot.future;}
 get canUndo():boolean{return this.past.length>0;}get canRedo():boolean{return this.future.length>0;}
 apply(state:WorldState,operation:AuthoringOperation):AuthoringResult {
 const formId=operation.kind==='create'?operation.form.id:operation.formId,reject=(reason:string)=>({accepted:false,reason,formId,affectedParts:[],removedParts:[]});
 try {const old=structuredClone(state.source);adoptRegionForms(old);validate(old);const next=structuredClone(old),before=structuredClone(subtree(old,formId));
 if(operation.kind!=='create'&&!before.length)return reject('Nie ma formy o tym ID.');
 if(operation.kind==='create'){const claimed=identities([operation.form]),active=identities(old.forms??[]).concat((old.freePlaces??[]).map(p=>p.id));if(claimed.some(id=>active.includes(id)||(old.retiredIds??[]).includes(id)))return reject('Tożsamość jest już używana lub wycofana.');next.forms!.push(structuredClone(operation.form));}
 else if(operation.kind==='remove'){const ids=before.map(f=>f.id);next.forms=next.forms!.filter(f=>!ids.includes(f.id));next.retiredIds=[...new Set([...(next.retiredIds??[]),...identities(before)])];}
 else {const form=next.forms!.find(f=>f.id===formId)!;if(operation.position!==undefined)form.position=structuredClone(operation.position);if(operation.yaw!==undefined)form.yaw=operation.yaw;}
 validate(next);const after=structuredClone(subtree(next,formId));if(equal(before,after))return reject('Forma nie zmieniła się.');
 const scope=[...new Set([...before,...after].map(f=>f.id))],retireScope=identities([...before,...after]);
 const entry:Entry={formId,ids:scope,before,after,retiredBefore:(old.retiredIds??[]).filter(id=>retireScope.includes(id)),retiredAfter:(next.retiredIds??[]).filter(id=>retireScope.includes(id)),ancestors:structuredClone(ancestors(operation.kind==='create'?next:old,formId)),resourceBefore:structuredClone((old.resourceSites??[]).filter(s=>retireScope.includes(s.id))),resourceAfter:structuredClone((next.resourceSites??[]).filter(s=>retireScope.includes(s.id)))};
 const result=this.commit(state,old,next,entry);if(result.accepted){this.past.push(entry);this.future=[];}return result;
 }catch(error){return reject(error instanceof Error?error.message:'Nieprawidłowa operacja.');}
 }
 undo(state:WorldState):AuthoringResult{return this.restore(state,false);}
 redo(state:WorldState):AuthoringResult{return this.restore(state,true);}
 private restore(state:WorldState,redo:boolean):AuthoringResult {
 const stack=redo?this.future:this.past,entry=stack.at(-1),formId=entry?.formId??'',reject=(reason:string)=>({accepted:false,reason,formId,affectedParts:[],removedParts:[]});if(!entry)return reject('Brak zmiany do przywrócenia.');
 try {const old=structuredClone(state.source);adoptRegionForms(old);validate(old);const expected=redo?entry.before:entry.after,desired=redo?entry.after:entry.before;
 if(!equal(old.forms!.filter(f=>entry.ids.includes(f.id)),expected)||entry.ancestors.some(a=>!equal(old.forms!.find(f=>f.id===a.id),a)))return reject('Konflikt z późniejszą zmianą źródła.');
 const retireScope=identities([...entry.before,...entry.after]),expectedRetired=redo?entry.retiredBefore:entry.retiredAfter;
 if(!equal((old.retiredIds??[]).filter(id=>retireScope.includes(id)),expectedRetired))return reject('Konflikt historii tożsamości.');
 const next=structuredClone(old);next.forms=next.forms!.filter(f=>!entry.ids.includes(f.id));next.forms.push(...structuredClone(desired));next.retiredIds=[...(next.retiredIds??[]).filter(id=>!retireScope.includes(id)),...(redo?entry.retiredAfter:entry.retiredBefore)];
 const activeIds=new Set(identities(desired));next.retiredIds=[...new Set([...next.retiredIds,...retireScope.filter(id=>!activeIds.has(id))])];
 if(next.resourceSites)next.resourceSites=[...next.resourceSites.filter(s=>!retireScope.includes(s.id)),...structuredClone(redo?entry.resourceAfter:entry.resourceBefore)];validate(next);
 const result=this.commit(state,old,next,entry);if(result.accepted){
  // Undoing a birth does not make witnessed identities never have existed.
  if(redo)entry.retiredAfter=next.retiredIds.filter(id=>retireScope.includes(id));else entry.retiredBefore=next.retiredIds.filter(id=>retireScope.includes(id));
  stack.pop();(redo?this.past:this.future).push(entry);
 }return result;
 }catch(error){return reject(error instanceof Error?error.message:'Nie można przywrócić formy.');}
 }
 private commit(state:WorldState,old:RegionSource,next:RegionSource,entry:Entry):AuthoringResult {
 const affectedParts=[...new Set([...entry.before,...entry.after].flatMap(f=>f.parts.map(p=>p.id)))],useIds=[...new Set([...entry.before,...entry.after].flatMap(f=>f.uses.map(u=>u.id)))],reason=occupied(state,old,next,affectedParts,useIds);
 if(reason)return {accepted:false,reason,formId:entry.formId,affectedParts:[],removedParts:[]};
 next.revision=state.source.revision+1;state.source.forms=next.forms;state.source.freePlaces=next.freePlaces;state.source.retiredIds=next.retiredIds;if(next.resourceSites)state.source.resourceSites=next.resourceSites;state.source.home=next.home;state.source.places=next.places;state.source.revision=next.revision;
 return {accepted:true,reason:'Przyjęto zmianę formy.',formId:entry.formId,affectedParts,removedParts:affectedParts.filter(id=>!next.home.parts.some(p=>p.id===id))};
 }
}
