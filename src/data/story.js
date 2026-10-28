// The story of the first season, as a calendar.
//
//   Duke (days 3 to 14): the show dog from next door arrives, and four
//   contests decide who's the better farm dog.
//   The Goldsby plan (days 15 to 28): a letter, a weird truck, a rich man
//   with plans for the farm, and a finale where your friends help.
//
// Each story starts on a set day for a new game. A save from before the
// story existed starts it on the day it's next played instead (see
// ensureStory), so nobody misses it. Story beats replace that part of
// the day's usual special activity (see planDay in day.js).

import { NAMES } from './characters.js';

const DUKE = NAMES.rival;
const FARMER = NAMES.farmer;

export const RIVAL_START = 3;
export const GOLDSBY_START = 15;

// Chapters that are ready to play.
export const CHAPTERS = { rival: true, goldsby: false };

// Days after the rival story starts.
const RIVAL_BEATS = [
  { at: 0, part: 'afternoon', add: ['meetDuke'], intro: `Someone is coming up the road with a fancy-looking dog...` },
  { at: 2, part: 'break', jobs: ['contestFetch'], farmer: 'yard', intro: `Contest day! The Fetch Race against ${DUKE}!` },
  { at: 5, part: 'break', jobs: ['contestEggs'], farmer: 'yard', intro: `Contest day! The Painted Egg Hunt against ${DUKE}!` },
  { at: 8, part: 'break', jobs: ['contestDig'], farmer: 'yard', intro: `Contest day! The Treasure Dig-Off against ${DUKE}!` },
  { at: 11, part: 'afternoon', jobs: ['herdTrial'], farmer: 'porch', intro: `The final contest: the Herding Trial! Can you beat ${DUKE}'s time?` },
];

// Days after the Goldsby story starts.
const GOLDSBY_BEATS = [
  { at: 0, part: 'morning', add: ['letter'], intro: `${NAMES.mailCarrier} is bringing a very fancy letter...` },
  { at: 1, part: 'afternoon', jobs: ['truckClues'], intro: 'A weird black truck is parked by the woods. What is it doing here?' },
  { at: 2, part: 'morning', jobs: ['truckCall'], intro: 'The weird truck is back! Sneak close and listen in.' },
  { at: 3, part: 'afternoon', jobs: ['followGoldsby'], intro: `${NAMES.richGuy} has come to visit. Keep an eye on him!` },
  { at: 5, part: 'morning', jobs: ['surveyFlags'], intro: 'Orange flags have popped up all over the meadow overnight!' },
  { at: 7, part: 'afternoon', jobs: ['drone'], intro: `A buzzing drone is spraying something over ${FARMER}'s crops!` },
  { at: 9, part: 'morning', jobs: ['rallyFriends'], intro: 'Time to ask your friends to help save the farm!' },
  { at: 11, part: 'break', jobs: ['natureTour'], farmer: 'yard', intro: `${NAMES.inspector} the nature inspector is here!` },
  { at: 13, part: 'night', jobs: ['finaleWake'], intro: 'Something big is rumbling up the road in the dark...' },
];

export const RIVAL_DAYS = RIVAL_BEATS.map((b) => b.at);
export const GOLDSBY_DAYS = GOLDSBY_BEATS.map((b) => b.at);

// Fills in when each story starts, for new and old saves alike. Returns
// the save's story record.
export function ensureStory(save) {
  const story = save.story ?? (save.story = {});
  if (!Number.isInteger(story.rivalStart)) story.rivalStart = Math.max(RIVAL_START, save.day);
  if (!Number.isInteger(story.goldsbyStart)) {
    story.goldsbyStart = Math.max(GOLDSBY_START, save.day, story.rivalStart + (GOLDSBY_START - RIVAL_START));
  }
  if (!Array.isArray(story.contests)) story.contests = [];
  return story;
}

export const NEW_STORY = { rivalStart: RIVAL_START, goldsbyStart: GOLDSBY_START, contests: [] };

// The story beats on a given day: { morning: beat, break: beat, ... }.
export function storyBeats(day, story = NEW_STORY) {
  const beats = {};
  for (const [start, list, arc] of [
    [story.rivalStart, RIVAL_BEATS, 'rival'],
    [story.goldsbyStart, GOLDSBY_BEATS, 'goldsby'],
  ]) {
    if (!CHAPTERS[arc]) continue;
    for (const beat of list) {
      if (day - start === beat.at) beats[beat.part] = { ...beat, arc, step: list.indexOf(beat) };
    }
  }
  return beats;
}

// The day the special letter comes (no present in the mail that day).
export function letterDay(story = NEW_STORY) {
  return story.goldsbyStart;
}

// Which contest (0 to 3) is on this day, or -1.
export function contestOn(day, story = NEW_STORY) {
  const at = day - story.rivalStart;
  return RIVAL_BEATS.slice(1).findIndex((b) => b.at === at);
}

export const CONTESTS = [
  { id: 'fetch', job: 'contestFetch', name: 'the Fetch Race' },
  { id: 'eggs', job: 'contestEggs', name: 'the Painted Egg Hunt' },
  { id: 'dig', job: 'contestDig', name: 'the Treasure Dig-Off' },
  { id: 'herd', job: 'herdTrial', name: 'the Herding Trial' },
];
