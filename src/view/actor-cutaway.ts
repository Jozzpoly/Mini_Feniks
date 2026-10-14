import { Material, Mesh, Object3D, Raycaster, Vector3 } from 'three';

type CutMaterial={original:Material|Material[];clones:Material[]};

/** Temporary presentation of intervening source parts. No source/collider edits. */
export class ActorCutaway {
  private materials=new Map<Mesh,CutMaterial>();
  private ray=new Raycaster();
  private direction=new Vector3();

  update(parts:Map<string,Object3D>,eye:Vector3,subject:Vector3[],enabled:boolean):void {
    if(!enabled||!subject.length){this.dispose();return;}
    const groups=[...parts.values()],roots=new Set(groups),blockers=new Set<Object3D>();
    for(const group of groups)group.updateWorldMatrix(true,true);
    for(const point of subject){
      const distance=this.direction.copy(eye).sub(point).length();if(distance<=.1)continue;
      // Start at the subject: an eye inside a wall still crosses its entry face.
      this.ray.set(point,this.direction.divideScalar(distance));this.ray.near=.05;this.ray.far=distance;
      for(const hit of this.ray.intersectObjects(groups,true)){
        let root:Object3D|null=hit.object;while(root&&!roots.has(root))root=root.parent;
        if(root)blockers.add(root);
      }
    }
    const wanted=new Set<Mesh>();
    for(const root of blockers)root.traverse(object=>{if(object instanceof Mesh)wanted.add(object);});
    for(const mesh of this.materials.keys())if(!wanted.has(mesh))this.restore(mesh);
    for(const mesh of wanted){
      if(this.materials.has(mesh))continue;
      const original=mesh.material,clones=(Array.isArray(original)?original:[original]).map(material=>{
        const clone=material.clone();clone.opacity=material.opacity*.14;clone.transparent=true;clone.depthWrite=false;return clone;
      });
      this.materials.set(mesh,{original,clones});mesh.material=Array.isArray(original)?clones:clones[0];
    }
  }

  private restore(mesh:Mesh):void {
    const entry=this.materials.get(mesh);if(!entry)return;
    mesh.material=entry.original;for(const clone of entry.clones)clone.dispose();this.materials.delete(mesh);
  }
  release(part:Object3D):void {part.traverse(object=>{if(object instanceof Mesh)this.restore(object);});}
  isCut(object:Object3D):boolean {return object instanceof Mesh&&this.materials.has(object);}
  dispose():void {for(const mesh of this.materials.keys())this.restore(mesh);}
}
