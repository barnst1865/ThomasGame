// The parts of every day, in order. There's no clock: each part ends as soon
// as its jobs are done, and the next one begins.
//
//   jobs:   job ids from src/data/tasks.js
//   sky:    how the sky looks, as a time of day in minutes (6 * 60 = 6 AM).
//           It moves from the first time to the second as the jobs get done.
//   farmer: where Farmer Hazel spends this part of the day
//   icon:   picture shown next to the name at the top of the screen

export const DAY_PARTS = [
  {
    id: 'morning',
    name: 'Morning',
    intro: 'Let the sheep out, gather the eggs, and hide your bone.',
    icon: 'sunrise',
    sky: [6 * 60, 10 * 60],
    jobs: ['sheepOut', 'collectEggs', 'buryBone'],
    farmer: 'field',
  },
  {
    id: 'break',
    name: 'Fun break',
    intro: 'Farmer Hazel wants to play fetch!',
    icon: 'sun',
    sky: [11 * 60, 13 * 60],
    jobs: ['fetch'],
    farmer: 'yard',
  },
  {
    id: 'afternoon',
    name: 'Afternoon',
    intro: 'Bring the sheep home and keep the crows off the crops.',
    icon: 'sun',
    sky: [13 * 60 + 30, 17 * 60 + 15],
    jobs: ['herdSheep', 'chaseCrows'],
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
    intro: 'Keep the hens safe, then off to bed.',
    icon: 'moon',
    sky: [20 * 60 + 45, 21 * 60 + 30],
    jobs: ['guardCoop'],
    farmer: 'inside',
  },
];
