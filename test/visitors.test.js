import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mailToday, shopToday } from '../src/data/events.js';
import { GIFTS, nextGift, perksFor } from '../src/data/gifts.js';
import { SHELVES, ALL_ITEMS, nextShelf, choicesFor, isShelfOpen } from '../src/data/shop.js';
import { planDay } from '../src/data/day.js';
import { TASKS } from '../src/data/tasks.js';
import { createNewSave, parseSave } from '../src/systems/saveGame.js';

const days = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

test('Mo brings the mail every 3 days from day 3, but not on day 15', () => {
  assert.deepEqual(days(1, 28).filter((d) => mailToday(d)), [3, 6, 9, 12, 18, 21, 24, 27]);
});

test('there is a present for every mail day in the first season', () => {
  assert.equal(GIFTS.length, days(1, 28).filter((d) => mailToday(d)).length);
});

test('the Wagtail Wagon comes every 4 days from day 4', () => {
  // Not on day 28, the night of the big finale.
  assert.deepEqual(days(1, 32).filter((d) => shopToday(d)), [4, 8, 12, 16, 20, 24, 32]);
});

test('mail and shop days add their jobs to the right part of the day', () => {
  const day3 = planDay(3);
  assert.ok(day3.find((p) => p.id === 'morning').jobs.includes('mail'));
  assert.ok(!day3.find((p) => p.id === 'dinner').jobs.includes('shopVisit'));
  const day4 = planDay(4);
  assert.ok(day4.find((p) => p.id === 'dinner').jobs.includes('shopVisit'));
  assert.ok(!day4.find((p) => p.id === 'morning').jobs.includes('mail'));
  for (const job of ['mail', 'shopVisit']) assert.ok(TASKS[job], job);
});

test('presents arrive in order, one at a time', () => {
  assert.equal(nextGift([]).id, GIFTS[0].id);
  assert.equal(nextGift([GIFTS[0].id]).id, GIFTS[1].id);
  assert.equal(nextGift(GIFTS.map((g) => g.id)), null);
});

test('presents make the dog better at things', () => {
  const none = perksFor([]);
  assert.equal(none.runSpeed, 1);
  assert.equal(none.sparkle, false);
  const all = perksFor(GIFTS.map((g) => g.id));
  assert.ok(all.runSpeed > 1 && all.catchDistance > 1 && all.scentRange > 1 && all.light > 1);
  assert.ok(all.digTime < 1);
  assert.equal(all.sparkle, true);
});

test('shelves open as the treat total goes up, and treats are never spent', () => {
  assert.ok(isShelfOpen(SHELVES[0], 0));
  assert.equal(nextShelf(0).treats, 100);
  assert.equal(nextShelf(120).treats, 250);
  assert.equal(nextShelf(9999), null);
  const thresholds = SHELVES.map((s) => s.treats);
  assert.deepEqual(thresholds, [...thresholds].sort((a, b) => a - b));
});

test('you can only pick things from open shelves that you do not have yet', () => {
  const start = choicesFor(0, []);
  assert.ok(start.length > 0 && start.every((item) => SHELVES[0].items.includes(item)));
  const owned = start.map((i) => i.id);
  assert.equal(choicesFor(0, owned).length, 0);
  assert.equal(choicesFor(10000, ALL_ITEMS.map((i) => i.id)).length, 0);
});

test('shop items have unique ids', () => {
  const ids = ALL_ITEMS.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('old saves get the new things with safe defaults', () => {
  const old = createNewSave({ name: 'Rex', breedId: 'corgi', coatId: 'red' });
  delete old.gifts;
  delete old.owned;
  delete old.home;
  delete old.dog.neck;
  delete old.dog.hat;
  const loaded = parseSave(JSON.stringify(old));
  assert.deepEqual(loaded.gifts, []);
  assert.deepEqual(loaded.owned, []);
  assert.equal(loaded.dog.collar, 'red');
  assert.equal(loaded.dog.hat, null);
  assert.equal(loaded.home.bed, 'red');
});

test('saved presents and rewards survive a reload, and junk is dropped', () => {
  const save = createNewSave({ name: 'Rex', breedId: 'corgi', coatId: 'red' });
  save.gifts = ['squeakyBall', 42, 'nope'];
  save.owned = ['hat-straw', null];
  save.dog.hat = 'straw';
  const loaded = parseSave(JSON.stringify(save));
  assert.deepEqual(loaded.gifts, ['squeakyBall']);
  assert.deepEqual(loaded.owned, ['hat-straw']);
  assert.equal(loaded.dog.hat, 'straw');
});
