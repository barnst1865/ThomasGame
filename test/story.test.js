import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONTESTS, GOLDSBY_START, NEW_STORY, RIVAL_START, contestOn, ensureStory, finaleDay, letterDay, storyBeats } from '../src/data/story.js';
import { planDay } from '../src/data/day.js';
import { TASKS } from '../src/data/tasks.js';
import { createNewSave, parseSave } from '../src/systems/saveGame.js';
import { mailToday, shopToday } from '../src/data/events.js';

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

test('the Goldsby plan runs from the letter on day 15 to the finale on night 28', () => {
  const jobs = ['letter', 'truckClues', 'truckCall', 'followGoldsby', 'surveyFlags', 'drone', 'rallyFriends', 'natureTour', 'finaleWake'];
  const when = {};
  for (let day = 1; day <= 40; day++) {
    for (const p of planDay(day)) for (const job of p.jobs) if (jobs.includes(job)) when[job] = [day, p.id];
  }
  assert.deepEqual(when, {
    letter: [15, 'morning'],
    truckClues: [16, 'afternoon'],
    truckCall: [17, 'morning'],
    followGoldsby: [18, 'afternoon'],
    surveyFlags: [20, 'morning'],
    drone: [22, 'afternoon'],
    rallyFriends: [24, 'morning'],
    natureTour: [26, 'break'],
    finaleWake: [28, 'night'],
  });
});

test('Mo brings the letter on day 15 instead of a package', () => {
  const morning = part(15, 'morning');
  assert.ok(morning.jobs.includes('letter'));
  assert.ok(!morning.jobs.includes('mail'));
});

test('the finale night has no prowlers, and the shop stays away that day', () => {
  const night = part(finaleDay(NEW_STORY), 'night');
  assert.equal(finaleDay(NEW_STORY), 28);
  assert.deepEqual(night.night.threats, []);
  assert.equal(night.night.wisps, 0);
  assert.equal(night.night.finale, true);
  assert.equal(shopToday(28), false);
  assert.ok(!part(28, 'dinner').jobs.includes('shopVisit'));
  assert.ok(part(24, 'dinner').jobs.includes('shopVisit'));
});

test('an old save gets the whole Goldsby plan too, after Duke', () => {
  const save = createNewSave({ name: 'Pepper', breedId: 'corgi' });
  save.day = 20;
  const story = ensureStory(save);
  assert.equal(story.rivalStart, 20);
  assert.equal(story.goldsbyStart, 32);
  assert.ok(part(32, 'morning', story).jobs.includes('letter'));
  assert.ok(part(45, 'night', story).jobs.includes('finaleWake'));
});

test('a save that went past day 15 before the Goldsby plan existed starts it from the letter', () => {
  const save = createNewSave({ name: 'Pepper', breedId: 'corgi' });
  save.day = 19;
  save.story = { rivalStart: 3, goldsbyStart: 15, contests: ['won', 'won', 'lost', 'won'] };
  assert.equal(ensureStory(save).goldsbyStart, 19);
  // Once the letter has been read, the story stays where it is.
  save.story.letterRead = true;
  save.day = 25;
  assert.equal(ensureStory(save).goldsbyStart, 19);
});
