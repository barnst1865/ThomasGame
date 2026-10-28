import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mischiefFor, MISCHIEF } from '../src/data/mischief.js';
import { TASKS } from '../src/data/tasks.js';
import { planDay, SPECIALS } from '../src/data/day.js';
import { ALL_ITEMS, choicesFor } from '../src/data/shop.js';

test('the rooster has no mischief on day 1, and an idea every day after', () => {
  assert.equal(mischiefFor(1), null);
  for (let day = 2; day < 40; day++) assert.ok(MISCHIEF[mischiefFor(day)], `day ${day}`);
});

test('every kind of mischief comes round within a few days', () => {
  const seen = new Set();
  for (let day = 2; day <= 4; day++) seen.add(mischiefFor(day));
  assert.equal(seen.size, Object.keys(MISCHIEF).length);
});

test("no snatching Farmer Hazel's hat on the day she lost it", () => {
  for (let day = 2; day < 40; day++) assert.notEqual(mischiefFor(day, 'hat'), 'hat');
});

test('every mischief has a job', () => {
  for (const m of Object.values(MISCHIEF)) assert.ok(TASKS[m.job], m.job);
});

test('Pickles hides your bowl some afternoons', () => {
  assert.ok(SPECIALS.afternoon.some((s) => s.jobs.includes('findBowl')));
  const days = Array.from({ length: 30 }, (_, i) => i + 2);
  assert.ok(days.some((d) => planDay(d).find((p) => p.id === 'afternoon').jobs.includes('findBowl')));
});

test('the Feather Cap is earned, never sold', () => {
  assert.ok(ALL_ITEMS.some((i) => i.id === 'hat-feather'));
  assert.ok(!choicesFor(99999, []).some((i) => i.id === 'hat-feather'));
});
