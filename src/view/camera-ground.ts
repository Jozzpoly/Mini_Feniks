import type { Vector3 } from 'three';

export function keepCameraAboveTerrain(eye:Vector3,heightAt:(x:number,z:number)=>number|null):void {
  // A small footprint protects the near plane as well as the eye on a slope.
  // Only Y changes: presentation recovery cannot rotate the player's WASD frame.
  const radius=.28,clearance=.55;
  for(const [dx,dz] of [[0,0],[-radius,-radius],[-radius,radius],[radius,-radius],[radius,radius]]){
    const height=heightAt(eye.x+dx,eye.z+dz);
    if(height!==null&&Number.isFinite(height))eye.y=Math.max(eye.y,height+clearance);
  }
}
