import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DayPlan } from '../src/systems/dayPlan.js';
import { TaskBoard } from '../src/systems/taskBoard.js';
import { TASKS } from '../src/data/tasks.js';
import { DAY_PARTS } from '../src/data/day.js';

const targets = { sheepOut: 5, collectEggs: 3, fetch: 3, herdSheep: 5, chaseCrows: 4 };

function freshDay() {
  const board = new TaskBoard(TASKS);
  const plan = new DayPlan(board, DAY_PARTS, targets);
  plan.begin();
  return { board, plan };
}

test('every job in the day plan is a real task', () => {
  for (const part of DAY_PARTS) {
    for (const job of part.jobs) assert.ok(TASKS[job], `${part.id} has unknown job ${job}`);
  }
});

test('the day starts in the morning with the morning jobs', () => {
  const { board, plan } = freshDay();
  assert.equal(plan.part.id, 'morning');
  assert.deepEqual(board.tasks.map((t) => t.id), ['sheepOut', 'collectEggs', 'buryBone']);
  assert.equal(board.get('collectEggs').target, 3);
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
  const { board, plan } = freshDay();
  while (plan.part.id !== 'night') {
    for (const t of plan.jobs()) board.setProgress(t.id, t.target);
    plan.advance();
  }
  board.fail('guardCoop');
  assert.equal(plan.partDone(), true);
  assert.equal(plan.isLastPart, true);
  assert.equal(plan.advance(), null);
});

test('the parts come in order: morning, break, afternoon, dinner, night', () => {
  const { board, plan } = freshDay();
  const seen = [plan.part.id];
  while (!plan.isLastPart) {
    for (const t of plan.jobs()) board.setProgress(t.id, t.target);
    seen.push(plan.advance().id);
  }
  assert.deepEqual(seen, ['morning', 'break', 'afternoon', 'dinner', 'night']);
});

test('the sky moves along as jobs get done', () => {
  const { board, plan } = freshDay();
  const [from, to] = DAY_PARTS[0].sky;
  assert.equal(plan.skyTime(), from);
  board.setProgress('sheepOut', 5);
  assert.ok(plan.skyTime() > from && plan.skyTime() < to);
  board.setProgress('collectEggs', 3);
  board.advance('buryBone');
  assert.equal(plan.skyTime(), to);
});
