// What Farmer Hazel says. `{name}` is replaced with your dog's name, and
// `{press dig}` with "press F" or "tap Dig" (keyboard or touch screen).

import { fillControls } from '../input/labels.js';

export const FARMER_NAME = 'Farmer Hazel';

export const LINES = {
  firstMorning: [
    'Good morning, {name}! Did you sleep well?',
    "Every morning we let the sheep out to graze. Run up behind them and they'll walk away from you, right out the gate!",
    'The hens lay eggs by the coop. {Press interact} to pick one up and bring it to the basket on the porch.',
    'And here is a bone, just for you. {Press dig} to dig a hole and hide it!',
    "Once the morning jobs are done, it's play time. Your jobs are always listed in the corner. If you get stuck, {press help} to see the controls.",
  ],
  goodMorning: [
    ['Morning, {name}! Sheep out, eggs in, and a bone for you to hide.'],
    ['Rise and shine, {name}! The sheep are waiting by the gate.'],
    ['Good morning! I left a fresh bone by your bed, {name}.'],
    ["Hello, sleepyhead! Let's have a good day on the farm."],
  ],
  pet: [
    '{name} gets a scratch behind the ears.',
    '{name} gets a belly rub. Best day ever!',
    'Farmer Hazel pats {name} on the head.',
  ],
  hints: {
    sheepOut: "The sheep want to graze! Go into the pen, get behind them, and push them out through the gate.",
    collectEggs: 'There are still eggs by the coop. Bring them to the basket on the porch.',
    buryBone: "Don't forget your bone! Pick it up, then {press dig} on some grass to bury it.",
    fetch: 'Bring the ball back and I will throw it again!',
    herdSheep: 'Time for the sheep to come home. Get behind them and push them back through the gate. Barking helps!',
    chaseCrows: 'Crows on my crops! Run at them or bark to scare them off.',
    dinner: "Dinner's ready! Come sit with me on the porch.",
    guardCoop: 'Be careful out there. Bark at the weasel, then pounce on it!',
    goToBed: "You've done everything. Off to bed, {name}!",
  },
  allDone: ['All done for now. You are the best dog on the farm!', "What a helper! I should get you a little hat."],
  fetchStart: "Look what I've got! Ready? Fetch!",
  fetchThanks: ['Good dog!', 'Again? Again!', 'Here it comes!', 'Wow, you are fast!'],
  fetchCatch: ['Nice catch!', 'What a catch!', 'Right out of the air!'],
  fetchDone: "Whew! That was fun. Back to work, {name}!",
  eggThanks: ['Thank you! Another egg for the basket.', 'Ooh, still warm. Good dog!', 'Careful with that one... perfect!'],
  taskDone: {
    sheepOut: 'Look at them munching that grass!',
    collectEggs: "That's every egg! Thank you, {name}.",
    buryBone: 'Your bone is hidden away. Nobody will ever find it!',
    herdSheep: 'All the sheep are home safe. Good dog!',
    chaseCrows: "Those crows won't be back in a hurry!",
    guardCoop: 'You chased that weasel right off the farm! The hens are safe.',
  },
  dinnerStart: 'What a day, {name}.',
  dinnerSheep: 'The sheep had a lovely graze, and now they are tucked in for the night.',
  dinnerCrows: "And my crops are safe thanks to you. Those crows didn't stand a chance!",
  dinnerFetch: 'And that game of fetch! You are getting faster every day.',
  dinnerCatch: 'That catch in the air was amazing.',
  dinnerServe: 'Here is your dinner. You earned it!',
  dinnerEat: '{name} munches happily while the sun goes down.',
  dinnerEnd: "It's getting dark. I'm heading inside. Keep the hens safe tonight!",
  bedtimeNow: 'Time for bed! Head to your dog bed by the doghouse.',
};

export function fill(text, name) {
  return fillControls(text.replaceAll('{name}', name));
}

export function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}
