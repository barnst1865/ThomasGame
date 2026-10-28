// Sir Cluckington the rooster's ideas for harmless mischief. They're
// optional: the day goes on whether or not you do them. Each one earns a
// fancy feather, and three feathers make a Feather Cap.

import { NAMES } from './characters.js';

const FARMER = NAMES.farmer;

export const MISCHIEF = {
  sheets: {
    job: 'mischiefSheets',
    pitch: [
      `Psst! ${FARMER} has hung her clean sheets on the washing line.`,
      'Pull one down and drag it through the mud puddle. Bawk bawk! Hilarious!',
    ],
  },
  hat: {
    job: 'mischiefHat',
    pitch: [
      `Psst! ${FARMER} is working in the field this morning.`,
      'Sneak up BEHIND her, snatch her hat, and bring it to me. She will never know!',
    ],
  },
  mud: {
    job: 'mischiefMud',
    pitch: ['Psst! Roll in the mud puddle until you are good and grubby...', `...then run all over ${FARMER}'s nice clean porch! Bawk!`],
  },
};

const ORDER = ['sheets', 'mud', 'hat'];

export const FEATHERS_FOR_CAP = 3;

// Today's idea (the same every time you play that day), or null on day 1.
// `lostThing` is what Farmer Hazel lost today, if anything: no snatching
// her hat on the day she's already lost it!
export function mischiefFor(day, lostThing = null) {
  if (day < 2) return null;
  let idea = ORDER[day % ORDER.length];
  if (idea === 'hat' && lostThing === 'hat') idea = ORDER[(day + 1) % ORDER.length];
  return idea;
}
