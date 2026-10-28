// The parts of every day, in order. There's no clock: each part ends as soon
// as its jobs are done, and the next one begins.
//
//   jobs:   job ids from src/data/tasks.js that happen every day
//   sky:    how the sky looks, as a time of day in minutes (6 * 60 = 6 AM).
//           It moves from the first time to the second as the jobs get done.
//   farmer: where Farmer Hazel spends this part of the day
//   icon:   picture shown next to the name at the top of the screen
//
// On top of the everyday jobs, most parts pick one "special" activity from
// SPECIALS below, so days feel different. Visitors on a schedule (the mail
// and the shop on wheels) add their own jobs; see src/data/events.js. What
// happens at night is planned in src/data/nights.js.

import { createRng } from '../systems/rng.js';
import { NAMES } from './characters.js';
import { nightPlan, nightJobs, nightIntro } from './nights.js';
import { eventsFor } from './events.js';

export const DAY_PARTS = [
  {
    id: 'morning',
    name: 'Morning',
    intro: 'Let the sheep out and gather the eggs.',
    icon: 'sunrise',
    sky: [6 * 60, 10 * 60],
    jobs: ['sheepOut', 'collectEggs'],
    farmer: 'field',
  },
  {
    id: 'break',
    name: 'Fun break',
    intro: '',
    icon: 'sun',
    sky: [11 * 60, 13 * 60],
    jobs: [],
    farmer: 'yard',
  },
  {
    id: 'afternoon',
    name: 'Afternoon',
    intro: 'Bring the sheep home.',
    icon: 'sun',
    sky: [13 * 60 + 30, 17 * 60 + 15],
    jobs: ['herdSheep'],
    farmer: 'porch',
  },
  {
    id: 'dinner',
    name: 'Dinner',
    intro: 'Dinner is ready on the porch.',
    icon: 'sunset',
    sky: [18 * 60 + 20, 19 * 60 + 10],
    jobs: ['dinner'],
    farmer: 'dinner',
  },
  {
    id: 'night',
    name: 'Night',
    intro: '',
    icon: 'moon',
    sky: [20 * 60 + 45, 21 * 60 + 30],
    jobs: [],
    farmer: 'inside',
  },
];

// The activities that take turns. Add a new one here (and its job in
// src/data/tasks.js) to put it into the rotation.
export const SPECIALS = {
  morning: [
    { id: 'bone', jobs: ['buryBone'], intro: 'And there is a bone for you to hide!' },
    { id: 'lostThing', jobs: ['lostThing'], intro: `${NAMES.farmer} lost something, too.` },
    { id: 'runawayHen', jobs: ['runawayHen'], intro: 'Oh no, a hen got out of the yard!' },
  ],
  break: [
    { id: 'fetch', jobs: ['fetch'], intro: `${NAMES.farmer} wants to play fetch!` },
    { id: 'butterflies', jobs: ['butterflies'], intro: 'Butterflies in the garden! Pounce to catch them.' },
    { id: 'pond', jobs: ['pondSticks', 'shakeOff'], intro: 'Pond day! Time for a swim.', farmer: 'pond' },
  ],
  afternoon: [
    { id: 'crows', jobs: ['chaseCrows'], intro: 'Keep the crows off the crops!' },
    { id: 'hawk', jobs: ['hawk'], intro: 'A hawk is circling over the hens!' },
    { id: 'lamb', jobs: ['lostLamb'], intro: 'And a lost lamb from next door has wandered onto the farm!' },
  ],
};

// The first day is always the same, so Farmer Hazel's welcome makes sense.
const FIRST_DAY = { morning: 'bone', break: 'fetch', afternoon: 'crows' };
const PART_SEEDS = { morning: 11, break: 23, afternoon: 37 };

// Specials come round in shuffled turns, so every one shows up before any
// repeats, and the same one never happens two days in a row.
function turnOrder(partId, turn) {
  const n = SPECIALS[partId].length;
  const rng = createRng(9000 + turn * 131 + PART_SEEDS[partId]);
  const order = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

function firstDayIndex(partId) {
  return SPECIALS[partId].findIndex((s) => s.id === FIRST_DAY[partId]);
}

export function specialFor(day, partId) {
  const list = SPECIALS[partId];
  if (day <= 1) return list[firstDayIndex(partId)];
  const n = list.length;
  const step = day - 2;
  const turn = Math.floor(step / n);
  const order = turnOrder(partId, turn);
  const before = turn === 0 ? firstDayIndex(partId) : turnOrder(partId, turn - 1)[n - 1];
  if (order[0] === before) [order[0], order[1]] = [order[1], order[0]];
  return list[order[step % n]];
}

// Jobs (and a line for the banner) that visitors add to a part of the day.
const VISITS = {
  morning: { event: 'mail', jobs: ['mail'], intro: `${NAMES.mailCarrier} is bringing a package!` },
  dinner: { event: 'shop', jobs: ['shopVisit'], intro: `The ${NAMES.shop} is coming!` },
};

// Everything that happens on a given day, part by part.
export function planDay(day) {
  const events = eventsFor(day);
  return DAY_PARTS.map((base) => {
    if (base.id === 'night') {
      const night = nightPlan(day);
      return { ...base, jobs: nightJobs(night), intro: nightIntro(night), night };
    }
    const special = SPECIALS[base.id] ? specialFor(day, base.id) : null;
    const visit = VISITS[base.id] && events[VISITS[base.id].event] ? VISITS[base.id] : null;
    return {
      ...base,
      jobs: [...base.jobs, ...(special?.jobs ?? []), ...(visit?.jobs ?? [])],
      intro: [base.intro, special?.intro, visit?.intro].filter(Boolean).join(' '),
      farmer: special?.farmer ?? base.farmer,
      special: special?.id,
      events,
    };
  });
}
