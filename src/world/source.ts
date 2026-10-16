import { createChannels, heightAt, REGION_SEED, TERRAIN_VERSION } from './geography';
import type { Material, PartSource, Place, RegionSource, Vec3 } from './types';
import {adoptRegionForms,createFormSource,syncFormProjection} from './forms';

export function createRegion(): RegionSource {
  const ground = heightAt(0, 0), floor = ground + .9, parts: PartSource[] = [];
  const part = (id: string, label: string, position: Vec3, size: Vec3, role: PartSource['role'], material: Material, solid = true, yaw = 0) => parts.push({ id, label, position, size, role, material, solid, yaw });
  part('home-floor', 'Kamienna posadzka', [0, floor - .12, 0], [10, .24, 7], 'floor', 'stone');
  part('home-foundation', 'Podmurówka', [0, ground + .33, 0], [10, .66, 7], 'floor', 'stone');
  part('home-wall-west', 'Zachodnia ściana', [-4.85, floor + 1.3, 0], [.3, 2.6, 7], 'wall', 'plaster');
  part('home-wall-east', 'Wschodnia ściana', [4.85, floor + 1.3, 0], [.3, 2.6, 7], 'wall', 'plaster');
  part('home-wall-back', 'Tylna ściana', [0, floor + 1.3, -3.35], [9.4, 2.6, .3], 'wall', 'plaster');
  part('home-wall-front-left', 'Ściana przy wejściu', [-2.925, floor + 1.3, 3.5], [4.15, 2.6, .3], 'wall', 'plaster');
  part('home-wall-front-right', 'Ściana przy wejściu', [2.925, floor + 1.3, 3.5], [4.15, 2.6, .3], 'wall', 'plaster');
  part('home-door-lintel', 'Nadproże', [0, floor + 2.42, 3.5], [1.7, .36, .3], 'wall', 'timber');
  for (let i = 0; i < 6; i++) {
    const rise = .15 * (6 - i);
    part(`home-step-${i + 1}`, `Stopień wejścia ${6 - i}`, [0, ground + rise / 2, 3.64 + i * .28], [1.7, rise, .28], 'step', 'stone');
  }
  for (const x of [-4.7, 4.7]) for (const z of [-3.2, 3.35]) part(`home-post-${x < 0 ? 'w' : 'e'}-${z < 0 ? 'n' : 's'}`, 'Słup dębowy', [x, floor + 1.4, z], [.22, 2.8, .22], 'beam', 'timber');
  part('home-eave-front', 'Belka okapu', [0, floor + 2.65, 3.65], [10.7, .2, .22], 'beam', 'timber');
  part('home-eave-back', 'Belka okapu', [0, floor + 2.65, -3.65], [10.7, .2, .22], 'beam', 'timber');
  part('home-roof', 'Dach kryty strzechą', [0, floor + 3.68, 0], [11, 2.04, 8.3], 'roof', 'thatch');
  part('home-table', 'Stół roboczy', [2.6, floor + .78, -.65], [1.8, .14, 1.05], 'table', 'timber');
  for (const x of [1.9, 3.3]) for (const z of [-1.02, -.28]) part(`home-table-leg-${x}-${z}`, 'Noga stołu', [x, floor + .355, z], [.11, .71, .11], 'beam', 'timber');
  part('home-bench', 'Ława pod zachodnią ścianą', [-3.55, floor + .45, -1], [.52, .13, 2.25], 'bench', 'timber');
  for (const z of [-1.8, -.2]) part(`home-bench-leg-${z}`, 'Noga ławy', [-3.55, floor + .2, z], [.4, .4, .13], 'beam', 'timber');
  const place = (id: string, label: string, x: number, z: number, kind: Place['kind'], inside = false): Place => ({ id, label, position: [x, inside ? floor : heightAt(x, z), z], kind });
  const source:RegionSource={
    id: 'kraina-jaworowa', revision: 1, seed: REGION_SEED, terrainVersion: TERRAIN_VERSION, extent: [6000, 4000],
    home: { id: 'home:jaworowa', position: [0, floor, 0], yaw: 0, parts }, channels: createChannels(),
    places: [place('home', 'Dom na polanie', 0, 1, 'home', true), place('put-bag', 'Miejsce obok stołu', 1.15, -.65, 'put', true), place('rest-inside', 'Odpoczynek przy ławie', -2.9, -1, 'rest', true), place('rest-outside', 'Odpoczynek pod jabłonią', -9, 8, 'rest'), place('food', 'Posiłek przy stole', 2.6, .65, 'food', true), place('lookout-near', 'Skraj polany', -16, 24, 'lookout'), place('lookout-ridge', 'Jaworowy grzbiet', -600, -240, 'lookout')],
  };
  adoptRegionForms(source);
  const yard=createFormSource('table','form:yard-table',[-7,heightAt(-7,14),14],.15);
  yard.label='Stół na skraju polany';source.forms!.push(yard);
  const stones=createFormSource('arch','form:old-waystone',[-66,heightAt(-66,62),62],-.45);
  stones.label='Kamienny próg przy trakcie';
  stones.parts.push({id:'waystone:low-wall',label:'Niska kamienna ściana',position:[-2.4,.4,0],size:[2.4,.8,.65],yaw:.08,material:'stone',role:'wall',solid:true});
  stones.uses.push({id:'waystone:lookout',label:'Widok za kamiennym progiem',position:[0,0,3],kind:'lookout'});
  source.forms!.push(stones);syncFormProjection(source);return source;
}
