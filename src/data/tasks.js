// Every job the dog can be given. Which part of the day each one happens in
// is set in src/data/day.js. `reward.friendship` is in friendship points
// (10 points = 1 heart).

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
    title: 'Play fetch with Farmer Hazel',
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
  guardCoop: {
    title: 'Keep the weasel away',
    reward: { treats: 6, friendship: 5 },
  },
  goToBed: {
    title: 'Go to bed',
    reward: { treats: 0, friendship: 0 },
  },
};
