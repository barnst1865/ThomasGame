// The layout of the farm, built in code from simple shapes. All positions
// here are in tiles (16 pixels each) unless they say "px".

import { TILE } from '../config.js';
import { createRng } from '../systems/rng.js';

export const T = {
  GRASS: 0,
  FLOWERS: 1,
  PATH: 2,
  TREE: 3,
  WATER: 4,
  FENCE: 5,
  CROP: 6,
  BUILDING: 7,
  PORCH: 8,
  GATE: 9, // the sheep pen gate: open in the morning, closes when all sheep are in
};

export const MAP_W = 48;
export const MAP_H = 34;

const SOLID = new Set([T.TREE, T.WATER, T.FENCE, T.BUILDING]);
const DIGGABLE = new Set([T.GRASS, T.FLOWERS]);

export const isSolid = (tile) => SOLID.has(tile);
export const isDiggable = (tile) => DIGGABLE.has(tile);

const rect = (x, y, w, h) => ({ x, y, w, h });
const px = (tiles) => tiles * TILE;

// Areas the game logic cares about (in tiles).
export const AREAS = {
  house: rect(7, 4, 7, 4),
  porch: rect(7, 8, 7, 1),
  doghouse: rect(15, 6, 2, 2),
  field: rect(18, 4, 10, 6),
  pond: rect(32, 3, 11, 8),
  coop: rect(37, 11, 4, 3),
  coopYard: rect(32, 14, 13, 7),
  pen: rect(3, 20, 11, 10), // includes the fence
  penInside: rect(4, 21, 9, 8),
  penGate: rect(13, 23, 1, 3),
  trough: rect(4, 21, 2, 1),
  meadow: rect(17, 21, 17, 9),
  pasture: rect(14, 18, 22, 12), // where loose sheep like to wander
  southGate: rect(22, 32, 3, 1),
};

// Spots characters walk to or interact with (in pixels).
export const POINTS = {
  dogBed: { x: px(16), y: px(8) + 9 },
  dogWake: { x: px(16), y: px(9) + 6 },
  bone: { x: px(14) + 6, y: px(10) + 4 },
  houseDoor: { x: px(10) + 8, y: px(8) + 2 },
  farmerPorch: { x: px(11) + 8, y: px(9) },
  basket: { x: px(13) + 4, y: px(8) + 10 },
  coopDoor: { x: px(39), y: px(14) + 4 },
  weaselEntry: { x: px(MAP_W) - 4, y: px(16) + 8 },
  weaselTurn: { x: px(39), y: px(16) + 8 },
  sign: { x: px(21) + 8, y: px(31) + 8 },
  mailbox: { x: px(8) + 8, y: px(15) + 12 },
  scarecrow: { x: px(23), y: px(7) + 10 },
};

export function areaPx(area) {
  return { x: px(area.x), y: px(area.y), w: px(area.w), h: px(area.h) };
}

function fill(tiles, area, tile) {
  for (let y = area.y; y < area.y + area.h; y++) {
    for (let x = area.x; x < area.x + area.w; x++) {
      if (y >= 0 && y < MAP_H && x >= 0 && x < MAP_W) tiles[y][x] = tile;
    }
  }
}

export function buildFarm() {
  const tiles = Array.from({ length: MAP_H }, () => new Array(MAP_W).fill(T.GRASS));
  const set = (x, y, t) => {
    if (y >= 0 && y < MAP_H && x >= 0 && x < MAP_W) tiles[y][x] = t;
  };

  // Woods all around the farm, two trees deep.
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (x < 2 || x >= MAP_W - 2 || y < 2 || y >= MAP_H - 2) tiles[y][x] = T.TREE;
    }
  }

  // Paths: porch down to the main path, east to the woods trail, south to the road.
  fill(tiles, rect(10, 9, 1, 8), T.PATH);
  fill(tiles, rect(10, 16, MAP_W - 10, 1), T.PATH);
  fill(tiles, rect(MAP_W - 2, 15, 2, 3), T.PATH); // gap in the trees: the woods trail
  fill(tiles, rect(23, 17, 1, MAP_H - 17), T.PATH);
  fill(tiles, rect(38, 14, 2, 2), T.PATH); // up to the coop door

  // The farmer's crops.
  fill(tiles, AREAS.field, T.CROP);

  // The pond: an oval of water.
  const { pond } = AREAS;
  const cx = pond.x + pond.w / 2;
  const cy = pond.y + pond.h / 2;
  for (let y = pond.y; y < pond.y + pond.h; y++) {
    for (let x = pond.x; x < pond.x + pond.w; x++) {
      const dx = (x + 0.5 - cx) / (pond.w / 2);
      const dy = (y + 0.5 - cy) / (pond.h / 2);
      if (dx * dx + dy * dy <= 1) set(x, y, T.WATER);
    }
  }

  // Buildings.
  fill(tiles, AREAS.house, T.BUILDING);
  fill(tiles, AREAS.porch, T.PORCH);
  fill(tiles, AREAS.doghouse, T.BUILDING);
  fill(tiles, AREAS.coop, T.BUILDING);

  // Sheep pen: a ring of fence with a gate on the east side.
  const { pen } = AREAS;
  for (let x = pen.x; x < pen.x + pen.w; x++) {
    set(x, pen.y, T.FENCE);
    set(x, pen.y + pen.h - 1, T.FENCE);
  }
  for (let y = pen.y; y < pen.y + pen.h; y++) {
    set(pen.x, y, T.FENCE);
    set(pen.x + pen.w - 1, y, T.FENCE);
  }
  fill(tiles, AREAS.penGate, T.GATE);
  fill(tiles, AREAS.trough, T.BUILDING);

  // The road to town is fenced off for now (a future area!).
  fill(tiles, AREAS.southGate, T.FENCE);

  // A few shade trees around the yard.
  for (const [x, y] of [
    [16, 12],
    [29, 12],
    [43, 27],
    [6, 13],
    [36, 29],
    [14, 31],
  ]) {
    set(x, y, T.TREE);
  }

  // Wildflowers sprinkled over the grass (always in the same spots).
  const rng = createRng(1865);
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (tiles[y][x] === T.GRASS && rng.chance(0.07)) tiles[y][x] = T.FLOWERS;
    }
  }

  return tiles;
}

export function tileAt(tiles, x, y) {
  if (y < 0 || y >= MAP_H || x < 0 || x >= MAP_W) return T.TREE;
  return tiles[y][x];
}

// Tiles you can reach on foot from a starting tile (used by tests and spawns).
export function reachableFrom(tiles, start, { gateOpen = true } = {}) {
  const seen = new Set();
  const key = (x, y) => `${x},${y}`;
  const queue = [start];
  seen.add(key(start.x, start.y));
  while (queue.length) {
    const { x, y } = queue.shift();
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      const t = tileAt(tiles, nx, ny);
      const blocked = isSolid(t) || (t === T.GATE && !gateOpen);
      if (!blocked && !seen.has(key(nx, ny))) {
        seen.add(key(nx, ny));
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return seen;
}

// Grass tiles inside an area, for placing eggs and sheep.
export function openTilesIn(tiles, area, { diggableOnly = false } = {}) {
  const out = [];
  for (let y = area.y; y < area.y + area.h; y++) {
    for (let x = area.x; x < area.x + area.w; x++) {
      const t = tileAt(tiles, x, y);
      if (diggableOnly ? isDiggable(t) : !isSolid(t)) out.push({ x, y });
    }
  }
  return out;
}
