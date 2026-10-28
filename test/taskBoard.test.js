import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TaskBoard } from '../src/systems/taskBoard.js';
import { TASKS } from '../src/data/tasks.js';

test('tasks complete once progress reaches the target', () => {
  const board = new TaskBoard(TASKS);
  board.add('collectEggs', 3);
  assert.equal(board.advance('collectEggs'), null);
  assert.equal(board.advance('collectEggs'), null);
  const done = board.advance('collectEggs');
  assert.equal(done?.id, 'collectEggs');
  assert.equal(done.status, 'done');
  assert.equal(board.advance('collectEggs'), null, 'completing twice returns nothing');
});

test('setProgress can go down and up, and completes once', () => {
  const board = new TaskBoard(TASKS);
  board.add('herdSheep', 5);
  board.setProgress('herdSheep', 3);
  board.setProgress('herdSheep', 2);
  assert.equal(board.get('herdSheep').progress, 2);
  assert.equal(board.setProgress('herdSheep', 9)?.progress, 5);
});

test('labels show progress for multi-step tasks', () => {
  const board = new TaskBoard(TASKS);
  const eggs = board.add('collectEggs', 3);
  const bone = board.add('buryBone');
  board.advance('collectEggs');
  assert.equal(board.label(eggs), 'Bring the eggs to the basket (1/3)');
  assert.equal(board.label(bone), 'Hide your bone');
});

test('failed tasks stop counting', () => {
  const board = new TaskBoard(TASKS);
  board.add('guardWeasel');
  board.fail('guardWeasel');
  assert.equal(board.advance('guardWeasel'), null);
  assert.equal(board.remaining().length, 0);
});

test('adding a task twice keeps the first one, unknown tasks throw', () => {
  const board = new TaskBoard(TASKS);
  const a = board.add('buryBone');
  assert.equal(board.add('buryBone'), a);
  assert.throws(() => board.add('flyToTheMoon'));
});

test('tasks remember which part of the day they belong to', () => {
  const board = new TaskBoard(TASKS);
  board.add('collectEggs', 3, 'morning');
  board.add('fetch', 3, 'break');
  assert.deepEqual(board.forPart('morning').map((t) => t.id), ['collectEggs']);
  assert.equal(board.get('fetch').part, 'break');
});
