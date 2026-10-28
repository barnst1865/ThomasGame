import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DayPlan } from '../src/systems/dayPlan.js';
import { TaskBoard } from '../src/systems/taskBoard.js';
import { TASKS } from '../src/data/tasks.js';
import { SPECIALS, planDay, specialFor } from '../src/data/day.js';
import { nightPlan, nightJobs, nightTargets, FIRST_NIGHTS, PROWLERS } from '../src/data/nights.js';

const targets = { sheepOut: 5, collectEggs: 3, fetch: 3, herdSheep: 5, chaseCrows: 4, guardRaccoon: 2 };

function freshDay(day = 1) {
  const board = new TaskBoard(TASKS);
  const plan = new DayPlan(board, planDay(day), { targets });
  plan.begin();
  return { board, plan };
}

function finishPart(board, plan) {
  for (const t of plan.jobs()) board.setProgress(t.id, t.target);
}

test('every job any day can give out is a real task', () => {
  for (let day = 1; day <= 60; day++) {
    for (const part of planDay(day)) {
      for (const job of part.jobs) assert.ok(TASKS[job], `day ${day} ${part.id} has unknown job ${job}`);
    }
  }
});

test('day 1 is the classic day: bone, fetch, crows, then the weasel', () => {
  const parts = planDay(1);
  assert.deepEqual(parts[0].jobs, ['sheepOut', 'collectEggs', 'buryBone']);
  assert.deepEqual(parts[1].jobs, ['fetch']);
  assert.deepEqual(parts[2].jobs, ['herdSheep', 'chaseCrows']);
  assert.deepEqual(parts[4].jobs, ['guardWeasel']);
});

test('the special activity never repeats two days in a row', () => {
  for (const partId of Object.keys(SPECIALS)) {
    let previous = specialFor(1, partId).id;
    for (let day = 2; day <= 80; day++) {
      const id = specialFor(day, partId).id;
      assert.notEqual(id, previous, `${partId} repeats on day ${day}`);
      previous = id;
    }
  }
});

test('every special shows up within a few days', () => {
  for (const [partId, list] of Object.entries(SPECIALS)) {
    const seen = new Set();
    for (let day = 2; day < 2 + list.length; day++) seen.add(specialFor(day, partId).id);
    assert.equal(seen.size, list.length, partId);
  }
});

test('plans are the same every time for the same day', () => {
  assert.deepEqual(planDay(17), planDay(17));
});

test('the first nights bring a new visitor, with wisps on night 4 and the wolf by night 7', () => {
  assert.deepEqual(nightPlan(1).threats, ['weasel']);
  assert.deepEqual(nightPlan(2).threats, ['raccoon']);
  assert.deepEqual(nightPlan(3).threats, ['coyote']);
  assert.equal(nightPlan(4).wisps > 0, true);
  assert.equal(nightPlan(4).friendly, true);
  assert.deepEqual(nightPlan(7).threats, ['wolf']);
  for (let day = 1; day <= 3; day++) assert.equal(nightPlan(day).wisps, 0, `no wisps before night 4 (night ${day})`);
});

test('later nights always have something to do', () => {
  for (let day = FIRST_NIGHTS.length + 1; day < 120; day++) {
    const plan = nightPlan(day);
    assert.ok(nightJobs(plan).length > 0, `night ${day}`);
    for (const t of plan.threats) assert.ok(PROWLERS[t], `night ${day}: ${t}`);
  }
});

test('the raccoon comes back, so chasing it off counts twice', () => {
  assert.deepEqual(nightTargets(nightPlan(2)), { guardRaccoon: 2 });
  assert.deepEqual(nightTargets(nightPlan(4)), { popWisps: 4 });
});

test('a part is done only when all its jobs are finished', () => {
  const { board, plan } = freshDay();
  board.setProgress('sheepOut', 5);
  board.setProgress('collectEggs', 3);
  assert.equal(plan.partDone(), false);
  board.advance('buryBone');
  assert.equal(plan.partDone(), true);
});

test('failed jobs still let the day move on', () => {
  const { board, plan } = freshDay(2);
  while (plan.part.id !== 'night') {
    finishPart(board, plan);
    plan.advance();
  }
  board.fail('guardRaccoon');
  assert.equal(plan.partDone(), true);
  assert.equal(plan.isLastPart, true);
  assert.equal(plan.advance(), null);
});

test('the parts come in order: morning, break, afternoon, dinner, night', () => {
  const { board, plan } = freshDay(5);
  const seen = [plan.part.id];
  while (!plan.isLastPart) {
    finishPart(board, plan);
    seen.push(plan.advance().id);
  }
  assert.deepEqual(seen, ['morning', 'break', 'afternoon', 'dinner', 'night']);
});

test('the sky moves along as jobs get done', () => {
  const { board, plan } = freshDay();
  const [from, to] = plan.part.sky;
  assert.equal(plan.skyTime(), from);
  board.setProgress('sheepOut', 5);
  assert.ok(plan.skyTime() > from && plan.skyTime() < to);
  board.setProgress('collectEggs', 3);
  board.advance('buryBone');
  assert.equal(plan.skyTime(), to);
});

test('a job can get a special title for the day', () => {
  const board = new TaskBoard(TASKS);
  const plan = new DayPlan(board, planDay(3), { titles: { lostThing: "Find Farmer Hazel's hat" } });
  plan.begin();
  const lost = board.get('lostThing');
  if (lost) assert.equal(lost.title, "Find Farmer Hazel's hat");
});
