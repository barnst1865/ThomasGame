# Paws & Pastures — Game Design

A cozy farming game where you play as the farmer's dog.

## Core decisions

| Topic | Decision |
|---|---|
| Platform | Web browser |
| Art style | Top-down pixel art |
| Player | The farmer's dog |
| Controls | Keyboard, plus an on-screen joystick and buttons on phones and tablets |
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

- **Treats:** earned for jobs. The total unlocks shelves at the shop on wheels; treats are never spent.
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

| Part | Every day | Plus one of (taking turns) |
|---|---|---|
| Morning | Herd the sheep out to the meadow, bring the eggs to the basket | Hide your bone; find Farmer Hazel's lost hat, glove or key (sniff, dig, return it); bring a runaway hen home |
| Fun break | | Fetch (catch it in the air for a bonus); catch butterflies; pond day (swim for sticks, then shake off next to Farmer Hazel) |
| Afternoon | Herd the sheep back into the pen | Chase the crows off the crops; scare a hawk away from the hens; pen a lost lamb from next door; find the dinner bowl Pickles the cat hid (follow her paw prints) |
| Dinner | Dinner on the porch with Farmer Hazel at sunset | |
| Night | Deal with tonight's visitors, then go to bed | |

The specials come round in shuffled turns, so each one shows up before any
repeats, and the same one never happens two days in a row. Day 1 is always
bone, fetch and crows.

You can only go to bed after the night's visitors are dealt with. Sleeping
saves the game and starts the next day.

## Nights

| Night | Visitors |
|---|---|
| 1 | Weasel (after the eggs in the coop) |
| 2 | Raccoon (after the egg basket; comes back once) |
| 3 | Coyote (scares the sheep in the pen) |
| 4 | First mystical night: mischief wisps, plus the friendly golden wisp |
| 5 | Raccoon, with the golden wisp |
| 6 | Weasel and mischief wisps |
| 7 | Wolf (the golden wisp helps) |
| 8+ | A mix, the same for the same night number |

Prowlers get tougher as they get bigger: more health, harder lunges, and
they shrug off barks for longer. If one reaches its target, the job is
missed but nobody is hurt.

**Mystical beings (will-o'-wisps):**

- **Mischief wisps (green, threat):** drift out of the woods to the coop
  and lure a hen out to follow them around. They dart away if the dog gets
  close, so bark to pop them; the hen then goes back to bed.
- **Golden wisp (friendly):** waits by the dog bed. Say hello and it
  follows the dog for the night, lights the way, drifts toward the nearest
  trouble, and makes the dog's bark carry 50% farther.

## Visitors and rewards

| Who | When | What happens |
|---|---|---|
| Mo the mail carrier | Every 3 days from day 3 (not day 15, saved for a special letter) | Leaves a package by the mailbox. Bring it to Farmer Hazel; she opens a present that helps with jobs |
| The Wagtail Wagon (Penny) | Every 4 days from day 4, at sunset | After dinner, Farmer Hazel buys the dog one reward |

- **Presents (in order):** Squeaky Ball, Zoomy Booties, Super Sniffer,
  Herding Bell, Magnifying Glass, Glow Tag, Bark Booster, Digging Mitts.
  After the last one, packages hold a box of treats.
- **Shop shelves** open by total treats earned (treats are never spent):
  collars (0), bandanas and dog beds (100), hats and doghouse roof paint
  (250), fancy things (450).
- **The toy box** by the doghouse changes what the dog wears and shows the
  presents.
- All character names live in one file (`src/data/characters.js`) so the
  class can rename them.

## Story plan

1. Visitors and rewards (built: mail, shop, toy box).
2. Farm friends (built): Pickles the cat hides your dinner bowl up a tree
   or underground; Sir Cluckington the rooster hands out optional mischief
   (washing line, Farmer Hazel's hat, muddy paw prints) worth feathers,
   and three feathers make a Feather Cap.
3. Duke, the show dog from next door, arrives on day 3. Four contests on
   days 5, 8, 11 and 14 (fetch race, egg hunt, treasure dig-off, herding
   trial). Duke becomes a friend win or lose.
4. The Goldsby plan (days 15 to 28): a letter, a weird truck to
   investigate, Mr. Goldsby's plans for the farm, missions to stop him,
   and a finale where all your friends help.

## Status

**Version 0.4 is built.** Mail, presents, the shop on wheels and the toy
box work. The task-driven day above works from start to finish, with nine special activities taking turns, four kinds of prowler,
and the will-o'-wisps from night 4 on. The game pauses
with a "Click to keep playing" button when it loses keyboard focus, and any
key or a click wakes the dog up in the morning. Seasons change the farm's
colors and crops (pumpkins in fall, snow in winter).

Phones and tablets get an on-screen joystick and Use, Bark, Dig and Pounce
buttons. The site asks search engines and AI crawlers to stay away
(`robots.txt` and `noindex`).

## Ideas for next versions

- More fun-break activities to choose from: free time to explore.
- New areas: the woods trail on the east edge and the town at the end of
  the road.
- More animals: cows, pigs and the farm cat.
- More mystical beings, like a forest spirit that protects the farm.
- Friendship with the golden wisp that grows over many nights.
- Tug and nip moves to go with pounce.
- Music.
