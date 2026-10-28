import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONTESTS, GOLDSBY_START, NEW_STORY, RIVAL_START, contestOn, ensureStory, letterDay, storyBeats } from '../src/data/story.js';
import { planDay } from '../src/data/day.js';
import { TASKS } from '../src/data/tasks.js';
import { createNewSave, parseSave } from '../src/systems/saveGame.js';
import { mailToday } from '../src/data/events.js';

const part = (day, id, story) => planDay(day, story).find((p) => p.id === id);

test('a new game meets Duke on day 3 and starts the Goldsby story on day 15', () => {
  const save = createNewSave({ name: 'Pepper', breedId: 'corgi' });
  const story = ensureStory(save);
  assert.equal(story.rivalStart, RIVAL_START);
  assert.equal(story.goldsbyStart, GOLDSBY_START);
  assert.deepEqual(story.contests, []);
  assert.ok(part(3, 'afternoon', story).jobs.includes('meetDuke'));
});

test('an old save starts the story on the day it is next played', () => {
  const save = createNewSave({ name: 'Pepper', breedId: 'corgi' });
  save.day = 9;
  const story = ensureStory(save);
  assert.equal(story.rivalStart, 9);
  assert.equal(story.goldsbyStart, 21);
  // Already started stories keep their days.
  save.day = 30;
  assert.equal(ensureStory(save).rivalStart, 9);
});

test('the four contests come in order, three days apart', () => {
  const days = [];
  for (let day = 1; day < 40; day++) if (contestOn(day, NEW_STORY) >= 0) days.push([day, contestOn(day, NEW_STORY)]);
  assert.deepEqual(days, [[5, 0], [8, 1], [11, 2], [14, 3]]);
  for (const [day, index] of days) {
    const job = CONTESTS[index].job;
    const parts = planDay(day).filter((p) => p.jobs.includes(job));
    assert.equal(parts.length, 1, `${job} on day ${day}`);
  }
});

test('contest days replace the special; the herding trial replaces the everyday herding', () => {
  const fetchBreak = part(5, 'break');
  assert.deepEqual(fetchBreak.jobs, ['contestFetch']);
  assert.equal(fetchBreak.farmer, 'yard');
  const trial = part(14, 'afternoon');
  assert.deepEqual(trial.jobs, ['herdTrial']);
  assert.equal(trial.story.arc, 'rival');
});

test('every story job is a real task', () => {
  for (let day = 1; day < 40; day++) {
    for (const p of planDay(day)) for (const job of p.jobs) assert.ok(TASKS[job], `${job} on day ${day}`);
  }
  for (const beats of [storyBeats(3), storyBeats(14)]) {
    for (const beat of Object.values(beats)) for (const job of [...(beat.jobs ?? []), ...(beat.add ?? [])]) assert.ok(TASKS[job], job);
  }
});

test('no present comes in the mail on the day of the big letter', () => {
  assert.equal(letterDay(NEW_STORY), GOLDSBY_START);
  assert.equal(mailToday(letterDay(NEW_STORY)), false);
});

test('the story record survives saving and loading', () => {
  const save = createNewSave({ name: 'Pepper', breedId: 'corgi' });
  ensureStory(save);
  save.story.contests[0] = 'won';
  save.story.contests[2] = 'lost';
  save.story.trophy = 'gold';
  save.story.dukeFriend = true;
  const back = parseSave(JSON.stringify(save));
  assert.deepEqual(back.story.contests, ['won', null, 'lost']);
  assert.equal(back.story.trophy, 'gold');
  assert.equal(back.story.dukeFriend, true);
  assert.equal(back.story.rivalStart, RIVAL_START);
  // Junk is dropped.
  const junk = parseSave(JSON.stringify({ ...save, story: { rivalStart: 'soon', contests: ['won', 'maybe', 7] } }));
  assert.deepEqual(junk.story.contests, ['won', null, null]);
});
