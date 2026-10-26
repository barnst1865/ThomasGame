import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flee, separation, cohesion, insideRect, clampToRect } from '../src/systems/steering.js';

test('flee points away from the threat and fades with distance', () => {
  const near = flee({ x: 10, y: 0 }, { x: 0, y: 0 }, 50);
  assert.equal(near.x, 1);
  assert.equal(near.y, 0);
  assert.ok(Math.abs(near.strength - 0.8) < 1e-9);
  assert.equal(flee({ x: 60, y: 0 }, { x: 0, y: 0 }, 50).strength, 0);
});

test('separation pushes apart, cohesion pulls together', () => {
  const me = { x: 0, y: 0 };
  const other = { x: 5, y: 0 };
  assert.ok(separation(me, [me, other], 10).x < 0);
  assert.ok(cohesion(me, [me, other], 10).x > 0);
  assert.deepEqual(cohesion(me, [me], 10), { x: 0, y: 0 });
});

test('rect helpers', () => {
  const r = { x: 0, y: 0, w: 10, h: 10 };
  assert.equal(insideRect({ x: 5, y: 5 }, r), true);
  assert.equal(insideRect({ x: 11, y: 5 }, r), false);
  assert.deepEqual(clampToRect({ x: 20, y: -4 }, r), { x: 10, y: 0 });
});
