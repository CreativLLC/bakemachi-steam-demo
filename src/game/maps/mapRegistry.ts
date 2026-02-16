import type { GameMap } from './types';
import { TILED_TRAIN_STATION } from './chapter1/tiledTrainStation';

const ALL_MAPS: GameMap[] = [
  TILED_TRAIN_STATION,
];

const registry = new Map<string, GameMap>();
for (const map of ALL_MAPS) {
  registry.set(map.id, map);
}

export function getMap(id: string): GameMap | undefined {
  return registry.get(id);
}

export function getStartingMap(): GameMap {
  return TILED_TRAIN_STATION;
}
