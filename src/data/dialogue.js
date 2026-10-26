// What Farmer Hazel says. `{name}` is replaced with your dog's name.

export const FARMER_NAME = 'Farmer Hazel';

export const LINES = {
  firstMorning: [
    'Good morning, {name}! Did you sleep well?',
    "I've got a busy day ahead, and I could really use a helper.",
    'The sheep are out in the meadow. Can you herd them into their pen? Run up behind them and they will move away from you.',
    'The hens laid eggs by the coop. Press E to pick one up, then bring it to the basket on the porch.',
    'And here is a bone, just for you. Press F to dig a hole and hide it somewhere secret!',
    'When it gets dark, keep an eye on the chickens. Weasels like to sneak around at night.',
    'If you forget anything, press H. Have a lovely day!',
  ],
  goodMorning: [
    ['Morning, {name}! Same jobs as always: sheep, eggs, and your bone.'],
    ['Rise and shine, {name}! The sheep are already out grazing.'],
    ['Good morning! I left a fresh bone by your bed, {name}.'],
    ["Hello, sleepyhead! Let's have a good day on the farm."],
  ],
  pet: [
    '{name} gets a scratch behind the ears.',
    '{name} gets a belly rub. Best day ever!',
    'Farmer Hazel pats {name} on the head.',
  ],
  hints: {
    herdSheep: 'The sheep still need to go in the pen. Get behind them and push them through the gate. Barking (Q) scares them along faster!',
    collectEggs: "There are still eggs by the coop. Bring them here to the basket.",
    buryBone: "Don't forget your bone! Pick it up, then press F on some grass to bury it.",
    guardCoop: 'Be careful out there tonight. Bark at the weasel, then pounce with Space!',
  },
  allDone: [
    'You did everything today! You really are the best dog on the farm.',
    "All the jobs are done. Go have some fun, {name}!",
    'What a helper! I should get you a little hat.',
  ],
  eggThanks: ['Thank you! Another egg for the basket.', 'Ooh, still warm. Good dog!', 'Careful with that one... perfect!'],
  bedtime: "It's getting late, {name}. Time to head to your bed soon.",
  night: "I'm heading inside. Keep the chickens safe tonight!",
  taskDone: {
    herdSheep: 'All the sheep are in the pen. Good dog!',
    collectEggs: "That's every egg! Thank you, {name}.",
    buryBone: 'Your bone is hidden away. Nobody will ever find it!',
    guardCoop: 'You chased that weasel right off the farm! The hens are safe.',
  },
};

export function fill(text, name) {
  return text.replaceAll('{name}', name);
}

export function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}
