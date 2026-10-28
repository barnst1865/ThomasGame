// What comes to the farm at night. Night 1 is the night of day 1.
//
// Prowlers sneak in from the woods trail toward their target:
//   coop   - the hen house door (they want an egg)
//   basket - the egg basket on the porch
//   pen    - the sheep pen gate (they want to scare the sheep)
// `visits` is how many times it comes back before giving up for the night.

import { createRng } from '../systems/rng.js';

export const PROWLERS = {
  weasel: {
    name: 'weasel',
    job: 'guardWeasel',
    target: 'coop',
    health: 4,
    sneakSpeed: 24,
    lungeSpeed: 150,
    fleeSpeed: 130,
    stealTime: 6,
    visits: 1,
    startleCooldown: 2.6,
    knockback: 160,
    hitRadius: 15,
    arrive: 'Something is sneaking toward the coop!',
    stole: 'Oh no! The weasel snuck off with an egg.',
  },
  raccoon: {
    name: 'raccoon',
    job: 'guardRaccoon',
    target: 'basket',
    health: 2,
    sneakSpeed: 30,
    lungeSpeed: 140,
    fleeSpeed: 140,
    stealTime: 6,
    visits: 2,
    startleCooldown: 2.2,
    knockback: 140,
    hitRadius: 15,
    arrive: 'A raccoon is creeping toward the egg basket!',
    back: 'The raccoon is back for another try!',
    stole: 'The raccoon gobbled up the eggs in the basket!',
  },
  coyote: {
    name: 'coyote',
    job: 'guardCoyote',
    target: 'pen',
    health: 6,
    sneakSpeed: 32,
    lungeSpeed: 175,
    fleeSpeed: 150,
    stealTime: 7,
    visits: 1,
    startleCooldown: 3,
    knockback: 200,
    hitRadius: 18,
    arrive: 'A coyote is prowling toward the sheep pen!',
    stole: 'The coyote gave the sheep a terrible fright!',
  },
  wolf: {
    name: 'wolf',
    job: 'guardWolf',
    target: 'pen',
    health: 9,
    sneakSpeed: 30,
    lungeSpeed: 200,
    fleeSpeed: 160,
    stealTime: 8,
    visits: 1,
    startleCooldown: 4,
    knockback: 240,
    hitRadius: 20,
    howl: true,
    arrive: 'A wolf! It is heading for the sheep pen!',
    stole: 'The wolf scared the sheep half to death! They will be fine by morning.',
  },
};

const INTROS = {
  weasel: 'Keep the hens safe from the weasel.',
  raccoon: 'A raccoon is after the eggs!',
  coyote: 'A coyote is prowling around the sheep pen!',
  wolf: 'A wolf is howling in the woods...',
  wisps: 'Strange lights are drifting out of the woods...',
};

// The first week builds up: a new visitor most nights.
export const FIRST_NIGHTS = [
  { threats: ['weasel'], wisps: 0, friendly: false },
  { threats: ['raccoon'], wisps: 0, friendly: false },
  { threats: ['coyote'], wisps: 0, friendly: false },
  { threats: [], wisps: 4, friendly: true }, // the first mystical night
  { threats: ['raccoon'], wisps: 0, friendly: true },
  { threats: ['weasel'], wisps: 3, friendly: false },
  { threats: ['wolf'], wisps: 0, friendly: true },
];

// After the first week, nights mix things up (the same night number always
// gets the same visitors).
export function nightPlan(day) {
  if (day <= FIRST_NIGHTS.length) return FIRST_NIGHTS[Math.max(1, day) - 1];
  const rng = createRng(day * 7919 + 17);
  const roll = rng.next();
  const threat = roll < 0.15 ? 'wolf' : roll < 0.4 ? 'coyote' : roll < 0.7 ? 'raccoon' : 'weasel';
  const wisps = threat !== 'wolf' && rng.chance(0.4) ? rng.int(3, 4) : 0;
  const friendly = threat === 'wolf' || rng.chance(0.35);
  return { threats: [threat], wisps, friendly };
}

export function nightJobs(plan) {
  return [...plan.threats.map((t) => PROWLERS[t].job), ...(plan.wisps > 0 ? ['popWisps'] : [])];
}

export function nightIntro(plan) {
  const parts = [...plan.threats.map((t) => INTROS[t]), ...(plan.wisps > 0 ? [INTROS.wisps] : [])];
  return [...parts, 'Then off to bed.'].join(' ');
}

// How many of each night job there are (the raccoon comes back, there are
// several wisps to pop).
export function nightTargets(plan) {
  const targets = {};
  for (const t of plan.threats) targets[PROWLERS[t].job] = PROWLERS[t].visits;
  if (plan.wisps > 0) targets.popWisps = plan.wisps;
  return targets;
}
