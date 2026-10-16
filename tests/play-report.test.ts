import { describe,it,expect } from 'vitest';
import { createPlayReport } from '../src/ui/play-report';
import { createWorld } from '../src/world/state';
import { createRegion } from '../src/world/source';
import { ensurePlayer } from '../src/actors/player';

describe('a small gameplay trace',()=>{
 it('exports current actor experience and bounded events without the authored world or a checkpoint',()=>{
  const state=createWorld(createRegion());ensurePlayer(state);state.seconds=37;state.tick=2220;
  const player=state.residents.find(r=>r.control==='player')!;
  Object.assign(player,{carryYaw:.5,carryHeight:.15,activity:{kind:'eat',targetId:'portion:1',elapsed:1,duration:3,startedAt:36,origin:[1,2,3]}});
  const resident=state.residents.find(r=>r.control!=='player')!;
  Object.assign(resident,{concern:{kind:'provision',placeId:'table',desiredUnits:2,startedAt:12,reason:'Zachowam posiłek na później.',satisfied:false}});
  state.events=Array.from({length:90},(_,i)=>({time:i,kind:'walked',actor:player.id,target:'path',detail:`zdarzenie ${i}`}));
  Object.assign(state,{secret:'never-export'});Object.assign(player,{secret:'never-export'});
  const report=createPlayReport(state),json=JSON.stringify(report);
  expect(report.version).toBe(1);expect(report.time).toBe(37);expect(report.player.id).toBe(player.id);
  expect(report.player.activity).toMatchObject({kind:'eat',elapsed:1,duration:3});
  expect(report.residents.find(r=>r.id===resident.id)?.concern).toMatchObject({placeId:'table',satisfied:false});
  expect(report.recentEvents).toHaveLength(48);expect(report.recentEvents.at(-1)?.detail).toBe('zdarzenie 89');
  expect(json).not.toContain('never-export');expect(json).not.toContain('terrainVersion');expect(json).not.toContain('home-bench');expect(report).not.toHaveProperty('source');
  report.player.position[0]+=10;expect(report.player.position).not.toEqual(player.position);
 });
});
