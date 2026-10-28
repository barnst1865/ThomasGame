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
    ['Morning, {name}! Sheep out and eggs in, please.'],
    ['Rise and shine, {name}! The sheep are waiting by the gate.'],
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
    lostThing: "I can't find it anywhere! Can you sniff it out? Look for little puffs of scent, then {press dig} right there.",
    runawayHen: 'One of the hens got out! Find her, get on the far side, and shoo her back to the coop yard.',
    butterflies: 'Look at all the butterflies! Get close and {press pounce} to catch one. Gently!',
    pondSticks: 'Swim out and fetch the stick! Bring it back to me.',
    shakeOff: "You're soaking wet! Don't you dare shake off next to me... ha ha!",
    hawk: 'A hawk is after my hens! When it swoops down low, bark to scare it away.',
    lostLamb: "A lamb from next door wandered onto the farm. Find it and herd it into the pen with our sheep.",
    guardWeasel: 'Be careful out there. Bark at the weasel, then pounce on it!',
    guardRaccoon: 'Raccoons love eggs. Keep it away from the basket!',
    guardCoyote: 'Coyotes are tough. Bark, back away from the lunge, then pounce!',
    guardWolf: 'Stay brave, {name}. Bark, dodge, pounce!',
    popWisps: 'Strange lights by the coop! Bark at them.',
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
    runawayHen: 'There she is! Back with her sisters. Good dog!',
    hawk: "That hawk won't bother my hens again today!",
    lostLamb: 'The little lamb is safe with our sheep. Good dog!',
  },
  lostThanks: {
    hat: 'My hat! I looked everywhere for it. Thank you, {name}!',
    glove: "My glove! Now my hands won't get cold. Good dog!",
    key: 'The gate key! What would I do without you, {name}?',
  },
  butterfliesDone: 'Ha ha! You caught so many, {name}. And let them all go, too!',
  pondStart: 'Ready for a swim? Go get the stick!',
  pondThanks: ['Good swimmer!', 'Splash! Here comes another!', 'You paddle so fast!'],
  pondDone: "That's the last stick. Just don't shake off next to me, {name}!",
  shakeOff: ["Eek! Now I'm soaked too! Ha ha!", 'Brrr! Thanks a lot, {name}! Ha ha!'],
  wispHello: [
    'A little golden light is bobbing by your bed. It chimes softly when {name} comes near.',
    'It circles {name} happily. It wants to help!',
    'Its glow lights the way and drifts toward trouble, and your bark carries further with it around.',
  ],
  wispAgain: 'The golden wisp is back! It follows {name} with a happy chime.',
  dinnerStart: 'What a day, {name}.',
  dinnerSheep: 'The sheep had a lovely graze, and now they are tucked in for the night.',
  dinnerCrows: "And my crops are safe thanks to you. Those crows didn't stand a chance!",
  dinnerFetch: 'And that game of fetch! You are getting faster every day.',
  dinnerCatch: 'That catch in the air was amazing.',
  dinnerLost: 'And you found my {thing}! I really thought it was gone for good.',
  dinnerHen: 'That runaway hen is back with her sisters, thanks to you.',
  dinnerButterflies: 'I loved watching you chase those butterflies.',
  dinnerPond: 'And our swim at the pond! You are a natural.',
  dinnerHawk: 'You kept that hawk away from my hens. What a brave dog!',
  dinnerLamb: "The lamb's family will come and get it in the morning. It was lucky you found it.",
  dinnerLights: 'Funny... last night I saw little green lights by the woods. Fireflies, maybe?',
  dinnerServe: 'Here is your dinner. You earned it!',
  dinnerEat: '{name} munches happily while the sun goes down.',
  dinnerEnd: "It's getting dark. I'm heading inside.",
  dinnerNight: {
    weasel: 'Keep the hens safe tonight!',
    raccoon: 'Watch the egg basket tonight. Raccoons love eggs!',
    coyote: 'I heard a coyote yipping by the woods. Look after the sheep!',
    wolf: 'I heard howling in the woods. Be brave tonight, {name}!',
    wisps: 'If you see any funny little lights by the coop... keep an eye on them.',
  },
  bedtimeNow: 'Time for bed! Head to your dog bed by the doghouse.',
};

export function fill(text, name) {
  return fillControls(text.replaceAll('{name}', name));
}

export function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}
