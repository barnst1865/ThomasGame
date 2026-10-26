// The jobs Farmer Hazel can ask the dog to do. `reward.friendship` is in
// friendship points (10 points = 1 heart).

export const TASKS = {
  herdSheep: {
    title: 'Herd the sheep into the pen',
    reward: { treats: 5, friendship: 4 },
  },
  collectEggs: {
    title: 'Bring the eggs to the basket',
    reward: { treats: 4, friendship: 3 },
  },
  buryBone: {
    title: 'Hide your bone',
    reward: { treats: 1, friendship: 1 },
  },
  guardCoop: {
    title: 'Keep the weasel away',
    reward: { treats: 6, friendship: 5 },
  },
};
