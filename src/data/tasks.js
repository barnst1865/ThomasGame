// Every job the dog can be given. Which part of the day each one happens in
// is set in src/data/day.js. `reward.friendship` is in friendship points
// (10 points = 1 heart).

import { NAMES } from './characters.js';

const FARMER = NAMES.farmer;

export const TASKS = {
  sheepOut: {
    title: 'Herd the sheep out to the meadow',
    reward: { treats: 3, friendship: 2 },
  },
  collectEggs: {
    title: 'Bring the eggs to the basket',
    reward: { treats: 4, friendship: 3 },
  },
  buryBone: {
    title: 'Hide your bone',
    reward: { treats: 1, friendship: 1 },
  },
  fetch: {
    title: `Play fetch with ${FARMER}`,
    reward: { treats: 2, friendship: 4 },
  },
  herdSheep: {
    title: 'Herd the sheep back into the pen',
    reward: { treats: 5, friendship: 4 },
  },
  chaseCrows: {
    title: 'Chase the crows off the crops',
    reward: { treats: 4, friendship: 3 },
  },
  dinner: {
    title: 'Have dinner on the porch',
    reward: { treats: 0, friendship: 5 },
  },
  guardWeasel: {
    title: 'Keep the weasel away',
    reward: { treats: 6, friendship: 5 },
  },
  guardRaccoon: {
    title: 'Chase the raccoon away',
    reward: { treats: 6, friendship: 5 },
  },
  guardCoyote: {
    title: 'Keep the coyote away from the sheep',
    reward: { treats: 8, friendship: 6 },
  },
  guardWolf: {
    title: 'Stand up to the wolf',
    reward: { treats: 12, friendship: 8 },
  },
  popWisps: {
    title: 'Pop the mischief wisps',
    reward: { treats: 6, friendship: 4 },
  },
  lostThing: {
    title: `Find ${FARMER}'s lost thing`,
    reward: { treats: 4, friendship: 4 },
  },
  runawayHen: {
    title: 'Bring the runaway hen home',
    reward: { treats: 3, friendship: 3 },
  },
  butterflies: {
    title: 'Catch butterflies',
    reward: { treats: 3, friendship: 3 },
  },
  pondSticks: {
    title: 'Fetch the sticks from the pond',
    reward: { treats: 2, friendship: 2 },
  },
  shakeOff: {
    title: `Shake off next to ${FARMER}`,
    reward: { treats: 1, friendship: 2 },
  },
  hawk: {
    title: 'Scare the hawk away from the hens',
    reward: { treats: 5, friendship: 4 },
  },
  lostLamb: {
    title: 'Find the lost lamb and pen it with the sheep',
    reward: { treats: 4, friendship: 4 },
  },
  mail: {
    title: `Bring the package to ${FARMER}`,
    reward: { treats: 2, friendship: 2 },
  },
  shopVisit: {
    title: `Pick a reward at the ${NAMES.shop}`,
    reward: { treats: 0, friendship: 3 },
  },
  findBowl: {
    title: 'Find your dinner bowl and put it back',
    reward: { treats: 3, friendship: 2 },
  },
  // Mischief from Sir Cluckington: just for fun, and worth a feather.
  mischiefSheets: {
    title: 'Mischief: drag a clean sheet into the mud',
    reward: { treats: 0, friendship: 0 },
  },
  mischiefHat: {
    title: `Mischief: snatch ${FARMER}'s hat`,
    reward: { treats: 0, friendship: 0 },
  },
  mischiefMud: {
    title: `Mischief: muddy paw prints on the porch`,
    reward: { treats: 0, friendship: 0 },
  },
  goToBed: {
    title: 'Go to bed',
    reward: { treats: 0, friendship: 0 },
  },
};
