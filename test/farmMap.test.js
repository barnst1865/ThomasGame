import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFarm, reachableFrom, tileAt, isSolid, T, AREAS, POINTS, MAP_W, MAP_H, openTilesIn } from '../src/world/farmMap.js';
import { TILE } from '../src/config.js';

const tiles = buildFarm();
const toTile = (p) => ({ x: Math.floor(p.x / TILE), y: Math.floor(p.y / TILE) });

test('the map has the expected size', () => {
  assert.equal(tiles.length, MAP_H);
  assert.ok(tiles.every((row) => row.length === MAP_W));
});

test('every walk-to point is on a walkable tile', () => {
  for (const [name, point] of Object.entries(POINTS)) {
    const t = toTile(point);
    assert.ok(!isSolid(tileAt(tiles, t.x, t.y)), `${name} at ${t.x},${t.y} is blocked`);
  }
});

test('the dog can reach the coop, meadow, woods trail and pen from its bed', () => {
  const reach = reachableFrom(tiles, toTile(POINTS.dogWake));
  const has = (p) => reach.has(`${p.x},${p.y}`);
  assert.ok(has(toTile(POINTS.coopDoor)), 'coop door');
  assert.ok(has({ x: AREAS.meadow.x + 3, y: AREAS.meadow.y + 3 }), 'meadow');
  assert.ok(has(toTile(POINTS.weaselEntry)), 'woods trail');
  assert.ok(has({ x: AREAS.penInside.x + 4, y: AREAS.penInside.y + 4 }), 'inside the pen');
});

test('the pen is closed off when the gate is shut', () => {
  const reach = reachableFrom(tiles, toTile(POINTS.dogWake), { gateOpen: false });
  assert.equal(reach.has(`${AREAS.penInside.x + 4},${AREAS.penInside.y + 4}`), false);
});

test('the pen gate is on the fence line', () => {
  const g = AREAS.penGate;
  for (let y = g.y; y < g.y + g.h; y++) assert.equal(tiles[y][g.x], T.GATE);
  assert.equal(tiles[g.y - 1][g.x], T.FENCE);
  assert.equal(tiles[g.y + g.h][g.x], T.FENCE);
});

test('there is room for eggs in the coop yard and sheep in the meadow', () => {
  assert.ok(openTilesIn(tiles, AREAS.coopYard, { diggableOnly: true }).length > 20);
  assert.ok(openTilesIn(tiles, AREAS.meadow, { diggableOnly: true }).length > 60);
});
