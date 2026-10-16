import {it,expect} from 'vitest';
import {createWorld} from '../src/world/state';import {createRegion} from '../src/world/source';
import {ensurePlayer} from '../src/actors/player';import {stepLife} from '../src/life';
it('does not turn two minutes of ordinary walking into urgent exhaustion',()=>{
 const w=createWorld(createRegion()),p=ensurePlayer(w);w.residents=[p];p.velocity=[1.2,0,0];
 for(let i=0;i<120;i++){w.seconds++;stepLife(w,1);}
 expect(p.fatigue).toBeLessThan(.4);expect(p.hunger).toBeLessThan(.25);
});
