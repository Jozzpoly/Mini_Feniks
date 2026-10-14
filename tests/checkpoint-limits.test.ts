import {describe,it,expect} from 'vitest';
import {createWorld} from '../src/world/state';
import {createRegion} from '../src/world/source';
import {encodeCheckpoint,decodeCheckpoint} from '../src/world/checkpoint';
import {establishResourceSites} from '../src/world/resources';

const saved=()=>{const s=createWorld(createRegion());establishResourceSites(s);return JSON.parse(encodeCheckpoint(s));};
describe('rejecting inconsistent or unrepresentable persisted sources',()=>{
  it('rejects the same resource definition appearing twice',()=>{
    const s=saved();s.source.resourceSites.push(structuredClone(s.source.resourceSites[0]));
    expect(()=>decodeCheckpoint(JSON.stringify(s))).toThrow();
  });
  it('rejects an active identity also marked retired',()=>{
    const s=saved();s.source.retiredIds.push('home-bench');
    expect(()=>decodeCheckpoint(JSON.stringify(s))).toThrow();
  });
  it('rejects finite numeric overflow before native construction',()=>{
    const s=saved();s.source.forms[0].position[0]=1e300;
    expect(()=>decodeCheckpoint(JSON.stringify(s))).toThrow();
  });
  it('rejects a physically degenerate size before native construction',()=>{
    const s=saved();s.source.forms[0].parts[0].size[0]=1e-20;
    expect(()=>decodeCheckpoint(JSON.stringify(s))).toThrow();
  });
});
