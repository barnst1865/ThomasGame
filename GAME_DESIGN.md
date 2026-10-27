# Paws & Pastures — Game Design

A cozy farming game where you play as the farmer's dog.

## Core decisions

| Topic | Decision |
|---|---|
| Platform | Web browser |
| Art style | Top-down pixel art |
| Player | The farmer's dog |
| Controls | Keyboard first, built so mobile/touch controls can be added later |
| Time | Day/night cycle plus four seasons |
| Saving | Auto-save each night when the dog goes to sleep (stored in the browser) |

## The dog

- The player chooses their dog's breed at the start.
- **Australian Cattle Dog** must be one of the options.
- Breeds are data-driven so new ones can be added later without code changes.

## The dog's jobs

- **Dig and hide:** dig holes to bury and hide things (bones, treasures, etc.), not to plant.
- **Herd animals:** round up farm animals and get them back to their pens.
- **Fetch and deliver:** carry items around the farm (eggs, tools, lost things).
- **Guard the farm:** protect the farm and animals from threats.

## The farmer

- The farmer does the farming and gives the dog tasks ("Can you bring the sheep in?").
- Finishing tasks earns rewards.

## Rewards

- **Treats:** currency, spent or saved.
- **Dog gear:** collars, bandanas, hats, dog beds.
- **New areas:** pond, woods, town, etc.
- **Friendship:** the farmer and animals grow fond of the dog over time.

## Farm animals

Sheep, chickens, cows, pigs, and a cat.

## Threats

- **Early:** coyotes, weasels, hawks.
- **Later:** wolves and mystical beings.
- **Combat is light action:** the dog can pounce, tug, and nip. Threats have a small health bar and flee when it runs out. Simple, not scary.

## Mystical beings

A mix: some are threats, others can become friends or helpers (e.g., a forest spirit that protects the farm).

## First playable version: the tiny farm loop

1. Pick your dog.
2. Run around one small farm.
3. Herd sheep into a pen.
4. Fetch eggs.
5. Dig to bury a bone.
6. Chase off a weasel at night.
7. Sleep (auto-save) and repeat.

## Status

**Version 0.1 (first playable) is built.** Everything in the tiny farm loop
above works: choosing a breed and coat, naming your dog, herding, eggs,
burying and digging up bones, the weasel at night, sleeping, and auto-saving.
Seasons already change the farm's colors and crops (pumpkins in fall, snow
in winter).

## Ideas for next versions

- A shop where treats buy dog gear (collars, bandanas, hats, beds).
  Collar colors are already supported in the dog sprites.
- New areas: the woods trail on the east edge and the road to town (the
  gate on the south fence is already there).
- More animals: cows, pigs and the farm cat.
- More threats: hawks swooping at the hens, coyotes, then wolves.
- Mystical beings, some friendly (a forest spirit) and some not.
- Tug and nip moves to go with pounce.
- Digging up the farmer's lost things to deliver for rewards.
- Touch controls for tablets and phones (the input layer is ready for it).
- Music.
