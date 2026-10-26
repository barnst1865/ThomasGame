import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dateFromDay, formatClock, formatDate, isNight, canSleep, lighting } from '../src/systems/calendar.js';

test('day 1 is the first day of spring, year 1', () => {
  assert.deepEqual(dateFromDay(1, 28), { day: 1, dayOfSeason: 1, seasonIndex: 0, season: 'Spring', year: 1 });
});

test('seasons roll over after 28 days and years after four seasons', () => {
  assert.equal(dateFromDay(28, 28).season, 'Spring');
  assert.equal(dateFromDay(29, 28).season, 'Summer');
  assert.equal(dateFromDay(29, 28).dayOfSeason, 1);
  assert.equal(dateFromDay(85, 28).season, 'Winter');
  assert.equal(dateFromDay(113, 28).year, 2);
  assert.equal(dateFromDay(113, 28).season, 'Spring');
  assert.equal(formatDate(30, 28), 'Summer 2, Year 1');
});

test('clock shows 12-hour time in 10-minute steps', () => {
  assert.equal(formatClock(6 * 60), '6:00 AM');
  assert.equal(formatClock(6 * 60 + 47), '6:40 AM');
  assert.equal(formatClock(12 * 60 + 5), '12:00 PM');
  assert.equal(formatClock(20 * 60 + 30), '8:30 PM');
  assert.equal(formatClock(24 * 60), '12:00 AM');
});

test('night starts at 8 PM and bedtime is allowed from 6 PM', () => {
  assert.equal(isNight(19 * 60 + 59), false);
  assert.equal(isNight(20 * 60), true);
  assert.equal(canSleep(17 * 60), false);
  assert.equal(canSleep(18 * 60), true);
});

test('lighting is bright at noon and dark at night', () => {
  assert.equal(lighting(12 * 60).darkness, 0);
  assert.ok(lighting(22 * 60).darkness > 0.5);
  assert.ok(lighting(18 * 60 + 30).dusk > 0);
  assert.ok(lighting(6 * 60).darkness > 0);
});
