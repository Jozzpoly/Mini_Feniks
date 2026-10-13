import { createRegion } from './source';
import { createWorld } from './state';
import { decodeCheckpoint } from './checkpoint';
import { REGION_SEED, TERRAIN_VERSION } from './geography';
import type { WorldState } from './types';

/** Invalid saved history stops startup; it is never silently replaced by a fresh world. */
export function readStartingWorld(storage:Pick<Storage,'getItem'>):WorldState{
  const saved=storage.getItem('mini-feniks:checkpoint');
  if(saved===null)return createWorld(createRegion());
  const state=decodeCheckpoint(saved);
  if(state.source.seed!==REGION_SEED||state.source.terrainVersion!==TERRAIN_VERSION)throw new Error('Zapis wymaga innej reguły geografii. Zachowano dotychczasową historię.');
  return state;
}
