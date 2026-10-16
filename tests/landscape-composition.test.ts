import {expect,it} from 'vitest';
import * as THREE from 'three';
import {createWater} from '../src/view/landscape';
import {createRegion} from '../src/world/source';

it('keeps a continuous darker water centre between lighter shallow margins after clipping',()=>{
  const source=createRegion();source.extent=[100,100];
  source.channels=[{id:'crossing',width:8,points:[[-60,12,0],[60,10,0]]}];
  const water=createWater(source),mesh=water.children[0] as THREE.Mesh;
  try{
    const positions=mesh.geometry.getAttribute('position'),colors=mesh.geometry.getAttribute('color');
    const centre:number[]=[],shore:number[]=[];
    for(let i=0;i<positions.count;i++){
      expect(Math.abs(positions.getX(i))).toBeLessThanOrEqual(50);
      expect(positions.getY(i)).toBeCloseTo(11.02-positions.getX(i)/60,4);
      if(Math.abs(positions.getZ(i))<.001)centre.push(colors.getX(i));
      if(Math.abs(positions.getZ(i))>3.99)shore.push(colors.getX(i));
    }
    expect(centre.length).toBeGreaterThan(0);
    expect(shore.length).toBeGreaterThan(0);
    expect(Math.max(...centre)).toBeLessThan(Math.min(...shore));
  }finally{mesh.geometry.dispose();(mesh.material as THREE.Material).dispose();}
});
