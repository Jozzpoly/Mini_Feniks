import {it,expect} from 'vitest';
import {createWorld} from '../src/world/state';import {createRegion} from '../src/world/source';
import {executeAction} from '../src/actors/actions';
it('uses the current rotated material body to block or free the same physical reach',()=>{
 const w=createWorld(createRegion()),r=w.residents[1],food=w.things[1];w.source.home.parts=[];
 r.position=[15,130,15];food.position=[16.4,130,15];
 const obstacle={...w.things[0],id:'obstacle',kind:'material' as const,heldBy:null,position:[15.7,130.3,15.6] as [number,number,number],size:[.1,2,2] as [number,number,number]};
 w.things.push(obstacle);
 expect(executeAction(w,r.id,{kind:'eat',targetId:food.id}).accepted).toBe(false);
 obstacle.rotation=[0,Math.SQRT1_2,0,Math.SQRT1_2];
 expect(executeAction(w,r.id,{kind:'eat',targetId:food.id}).accepted).toBe(true);
});
