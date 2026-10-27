# Paws & Pastures — Game Design

A cozy farming game where you play as the farmer's dog.

## Core decisions

| Topic | Decision |
|---|---|
| Platform | Web browser |
| Art style | Top-down pixel art |
| Player | The farmer's dog |
| Controls | Keyboard first, built so mobile/touch controls can be added later |
| Time | No clock: each day is a series of parts that end when their jobs are done, plus four seasons |
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

## A day on the farm

Days are driven by jobs, not a clock. Each part of the day ends as soon as
its jobs are done, and the sky moves on as you work.

| Part | Jobs |
|---|---|
| Morning | Herd the sheep out to the meadow, bring the eggs to the basket, hide your bone |
| Fun break | Play fetch with Farmer Hazel (catch it in the air for a bonus) |
| Afternoon | Herd the sheep back into the pen, chase the crows off the crops |
| Dinner | Dinner on the porch with Farmer Hazel at sunset |
| Night | Keep the weasel away from the coop, then go to bed |

You can only go to bed after the night job is finished. Sleeping saves the
game and starts the next day.

## Status

**Version 0.2 is built.** The task-driven day above works from start to
finish, including fetch, crows, and dinner on the porch. The game pauses
with a "Click to keep playing" button when it loses keyboard focus, and any
key or a click wakes the dog up in the morning. Seasons change the farm's
colors and crops (pumpkins in fall, snow in winter).

## Ideas for next versions

- More fun-break activities to choose from: chase butterflies, splash in
  the pond, free time to explore.
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
