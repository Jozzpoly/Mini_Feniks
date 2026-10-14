import type { FormSource, PartSource, RegionSource, Vec3 } from './types';
type Pose = { position: Vec3; yaw: number };
export function composePose(parent: Pose, local: Pose): Pose {
 const c=Math.cos(parent.yaw),s=Math.sin(parent.yaw),[x,y,z]=local.position;
 return {position:[parent.position[0]+c*x+s*z,parent.position[1]+y,parent.position[2]-s*x+c*z],yaw:parent.yaw+local.yaw};
}
function relative(parent:Pose, world:Pose):Pose { const [x,y,z]=world.position.map((v,i)=>v-parent.position[i]),c=Math.cos(parent.yaw),s=Math.sin(parent.yaw); return {position:[c*x-s*z,y,s*x+c*z],yaw:world.yaw-parent.yaw}; }
function transforms(source:RegionSource):Map<string,Pose> {
 const forms=source.forms??[],byId=new Map<string,FormSource>(),poses=new Map<string,Pose>(),visiting=new Set<string>(),ids=new Set<string>();
 const claim=(id:string)=>{if(!id||ids.has(id))throw new Error('Duplicate or empty form/part/use identity.');ids.add(id);};
 for(const form of forms){claim(form.id);byId.set(form.id,form);for(const part of form.parts)claim(part.id);for(const use of form.uses)claim(use.id);}
 for(const place of source.freePlaces??[])claim(place.id);
 const resolve=(id:string):Pose=>{const cached=poses.get(id);if(cached)return cached;const f=byId.get(id);if(!f)throw new Error('Missing parent form.');if(visiting.has(id))throw new Error('Cyclic form composition.');visiting.add(id);const p=f.parentId?composePose(resolve(f.parentId),f):{position:[...f.position] as Vec3,yaw:f.yaw};visiting.delete(id);poses.set(id,p);return p;};
 for(const f of forms)resolve(f.id);return poses;
}
export function resolveFormTransform(source:RegionSource,formId:string):Pose {const pose=transforms(source).get(formId);if(!pose)throw new Error('Unknown form.');return pose;}
/** The author writes local coordinates relative to the parent, not the form itself. */
export function worldToFormPose(source:RegionSource,formId:string,position:Vec3,yaw:number):Pose {const form=source.forms?.find(f=>f.id===formId);if(!form)throw new Error('Unknown form.');const local=form.parentId?relative(resolveFormTransform(source,form.parentId),{position,yaw}):{position:[...position] as Vec3,yaw};return {position:local.position,yaw:Math.atan2(Math.sin(local.yaw),Math.cos(local.yaw))};}
export function formForPart(source:RegionSource,partId:string):FormSource|undefined {return source.forms?.find(f=>f.parts.some(p=>p.id===partId));}
export function syncFormProjection(source:RegionSource):void {
 if(!source.forms)return;const poses=transforms(source),parts:PartSource[]=[],places=structuredClone(source.freePlaces??[]);
 for(const f of source.forms){const pose=poses.get(f.id)!;for(const p of f.parts)parts.push({...structuredClone(p),...composePose(pose,p)});for(const u of f.uses)places.push({...structuredClone(u),position:composePose(pose,{position:u.position,yaw:0}).position});}
 const home=poses.get(source.home.id);source.home.parts=parts;source.places=places;if(home){source.home.position=[...home.position];source.home.yaw=home.yaw;}
 if(source.resourceSites){
  source.resourceSites=source.resourceSites.filter(site=>!(source.retiredIds??[]).includes(site.id));
  for(const site of source.resourceSites){const use=places.find(p=>p.id===site.id&&p.kind==='gather');if(!use)throw new Error('Missing authored resource use.');site.position=[...use.position];}
 }
}
export function adoptRegionForms(source:RegionSource):void {
 if(source.forms){syncFormProjection(source);return;}
 const original=structuredClone(source),root:FormSource={id:source.home.id,label:'Dom',kind:'house',parentId:null,position:[...source.home.position],yaw:source.home.yaw,parts:[],uses:[]},forms=[root],hosted=new Set<string>();
 for(const kind of ['bench','table'] as const){const main=original.home.parts.find(p=>p.id===`home-${kind}`);if(!main)continue;const world={position:[main.position[0],original.home.position[1],main.position[2]] as Vec3,yaw:main.yaw};const f:FormSource={id:`form:${main.id}`,label:main.label,kind,parentId:root.id,...relative(root,world),parts:[],uses:[]};
  for(const p of original.home.parts.filter(p=>p.id===main.id||p.id.startsWith(`${main.id}-leg-`))){f.parts.push({...p,...relative(world,p)});hosted.add(p.id);}
  for(const u of original.places.filter(u=>kind==='bench'?u.id==='rest-inside':u.id==='food'||u.id==='put-bag')){f.uses.push({...u,position:relative(world,{position:u.position,yaw:0}).position});hosted.add(u.id);}forms.push(f);
 }
 root.parts=original.home.parts.filter(p=>!hosted.has(p.id)).map(p=>({...p,...relative(root,p)}));
 for(const use of original.places.filter(p=>p.id==='home'&&p.kind==='home')){root.uses.push({...use,position:relative(root,{position:use.position,yaw:0}).position});hosted.add(use.id);}
 source.forms=forms;source.freePlaces=original.places.filter(p=>!hosted.has(p.id));source.retiredIds??=[];syncFormProjection(source);
}
export function createFormSource(kind:Exclude<FormSource['kind'],'house'|'custom'>,id:string,position:Vec3,yaw=0):FormSource {
 const f:FormSource={id,label:{bench:'Ława',table:'Stół',wall:'Ściana',platform:'Podest',arch:'Brama',rock:'Skała'}[kind],kind,parentId:null,position:[...position],yaw,parts:[],uses:[]};
 const part=(suffix:string,p:Vec3,size:Vec3,role:PartSource['role'],material:PartSource['material']='timber')=>f.parts.push({id:`${id}:${suffix}`,label:f.label,position:p,size,yaw:0,role,material,solid:true});
 if(kind==='bench'){part('seat',[0,.45,0],[.52,.13,2.25],'bench');for(const z of [-.8,.8])part(`leg-${z}`,[0,.2,z],[.4,.4,.13],'beam');f.uses.push({id:`${id}:rest`,label:'Odpoczynek przy ławie',position:[.65,0,0],kind:'rest'});}
 if(kind==='table'){part('top',[0,.78,0],[1.8,.14,1.05],'table');for(const x of [-.7,.7])for(const z of [-.37,.37])part(`leg-${x}-${z}`,[x,.355,z],[.11,.71,.11],'beam');f.uses.push({id:`${id}:put`,label:'Miejsce przy stole',position:[-1.45,0,0],kind:'put'},{id:`${id}:food`,label:'Posiłek przy stole',position:[0,0,1.3],kind:'food'});}
 if(kind==='wall')part('wall',[0,1.3,0],[3,2.6,.3],'wall','plaster');
 if(kind==='platform')part('floor',[0,.15,0],[3,.3,3],'floor','stone');
 if(kind==='arch'){for(const x of [-1.05,1.05])part(`post-${x}`,[x,1.2,0],[.3,2.4,.4],'wall','stone');part('lintel',[0,2.45,0],[2.4,.3,.4],'beam','stone');}
 if(kind==='rock')part('rock',[0,.6,0],[1.7,1.2,1.3],'beam','stone');return f;
}
