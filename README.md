# Paws & Pastures

A cozy farming game where you play as the farmer's dog. Pick your breed,
help Farmer Hazel around the farm, hide bones in secret spots, and keep the
farm safe at night from weasels, raccoons, coyotes, wolves, and some very
strange little lights.

It runs in any web browser with no install and no build step.

## How to play

There's no clock. Each day is made of parts, and the next part starts as
soon as you finish the jobs in this one. The everyday jobs are always
there, and each part also has one special activity that changes from day
to day (the same one never comes two days in a row):

1. **Morning:** herd the sheep out of their pen to graze and bring the
   hens' eggs to the basket on the porch. Plus one of:
   - **Hide your bone:** dig a hole and bury it.
   - **Farmer Hazel's lost thing:** her hat, glove or gate key is buried
     somewhere. Get close and wavy lines of scent rise from the spot. Dig
     there and bring it back to her.
   - **A runaway hen:** find her and shoo her back to the coop yard.
2. **Fun break,** one of:
   - **Fetch:** catch the ball right as it lands for a bonus treat.
   - **Butterflies:** pounce to catch them (and let them go again).
   - **Pond day:** swim out for the sticks Farmer Hazel throws, then shake
     off right next to her.
3. **Afternoon:** herd the sheep back into the pen. Plus one of:
   - **Crows on the crops:** barking makes a crow hop away; bark again or
     run at it and it flies off for good.
   - **A hawk over the hens:** when it swoops down low, bark to scare it
     back up. Three frights and it gives up.
   - **A lost lamb from next door:** find it and herd it into the pen.
4. **Dinner:** sit down with Farmer Hazel on the porch as the sun sets.
5. **Night:** something comes out of the woods (see below). Bark to
   startle prowlers, then pounce to chase them off. Watch out for the
   lunge!
6. **Bed:** once the night's visitors are dealt with, curl up in your bed.
   The game saves and a new day begins.

**The first week of nights** builds up:

| Night | Who comes                                                        |
| ----- | ---------------------------------------------------------------- |
| 1     | A weasel, after the eggs in the coop                             |
| 2     | A raccoon, after the egg basket (it comes back for a second try) |
| 3     | A coyote, prowling around the sheep pen                          |
| 4     | Will-o'-wisps! Plus a friendly golden wisp                       |
| 5     | The raccoon again, with the golden wisp                          |
| 6     | A weasel and more wisps                                          |
| 7     | A wolf (the golden wisp comes to help)                           |

After that, every night mixes them up. **Mischief wisps** (green) drift to
the coop and lure the hens out to follow them. Bark to pop a wisp and its
hen goes back to bed. The **golden wisp** waits by your bed: say hello and
it follows you all night, lighting the way, floating toward trouble, and
making your bark carry farther.

If a prowler gets what it came for, the job is missed, but nobody gets
hurt and there's always tomorrow night. Arrows at the edge of the screen
point to trouble you can't see.

Sheep (and runaway hens) walk away from you, so to herd them, get on the
far side and push.
Your buried bones stay hidden day after day. Jobs earn treats and
friendship hearts. Your jobs for the current part of the day are always
listed in the top right corner.

If you click outside the game, it pauses and shows a "Click to keep playing"
button (the game can only hear the keyboard while it has focus).

| Action                   | Keyboard       | Phone or tablet                    |
| ------------------------ | -------------- | ---------------------------------- |
| Move                     | WASD or arrows | Joystick (put a thumb on the left) |
| Run                      | hold Shift     | Push the joystick all the way      |
| Pick up, talk, sleep     | E (or Enter)   | Use                                |
| Bark                     | Q (or B)       | Bark                               |
| Dig or bury              | F              | Dig                                |
| Pounce                   | Space          | Pounce                             |
| Controls / pause / sound | H / Esc / M    | ? / II / (none)                    |

On a phone or tablet, tap to move dialogue along and to pick things in
menus. The game is easiest to see with the device turned sideways. The
on-screen buttons appear by themselves once you touch the screen and hide
again if you press a key on a keyboard.

### The dogs

| Breed                 | Coats                 | Special                                   |
| --------------------- | --------------------- | ----------------------------------------- |
| Australian Cattle Dog | Blue, Red             | Pounces hit threats twice as hard         |
| Border Collie         | Black & White, Red    | Sheep notice you from farther away        |
| Golden Retriever      | Golden, Cream         | Runs faster while carrying things         |
| Corgi                 | Red & White, Tricolor | Barks reach much farther                  |

## Running it on your computer

You need [Node.js](https://nodejs.org) 20 or newer.

```sh
npm start      # then open http://localhost:8080
npm test       # runs the automated tests
```

Any static web server works too (for example `python3 -m http.server`). The
page has to be served over http, because browsers won't load the game's
JavaScript modules straight from a file.

## Changing the day

The parts of the day, their everyday jobs and the special activities that
take turns are listed in `src/data/day.js`. Who visits at night (and how
tough each prowler is) is in `src/data/nights.js`. The jobs themselves
(names and rewards) are in `src/data/tasks.js`. Numbers like how many crows
come or how many times Farmer Hazel throws the ball are in `src/config.js`.

## Adding a new dog breed

Open `src/data/breeds.js`, copy one of the breeds, and change it. You give it
a name, ear shape (`pointy` or `floppy`), tail (`long`, `fluffy` or `none`),
one or more coat colors, and its stats. The "Choose your dog" screen picks it
up automatically. The tests in `test/breeds.test.js` check that it has
everything it needs.

To see how a new coat looks, run `npm start` and open
http://localhost:8080/tools/preview.html. It shows every sprite, big.

## How the code is organized

```
index.html, style.css   the page
src/main.js             starts Phaser
src/config.js           numbers for tuning (speeds, day length, ...)
src/scenes/             title, choose your dog, the farm, the HUD on top
src/entities/           the dog, sheep, hens, farmer, prowlers, crows, hawk,
                        butterflies, wisps, items
src/activities/         each special activity (fetch, butterflies, pond day,
                        lost things, strays, crows, hawk, dinner) and the
                        night watch
src/systems/            the day plan, seasons, saving, jobs, sounds, movement math
src/data/               breeds, the parts of the day, nights, jobs, the farmer's lines
src/world/              the farm's layout and building it on screen
src/art/                all the pixel art, drawn with code
src/input/controls.js   keys mapped to actions
test/                   automated tests (node --test)
vendor/                 Phaser 3.90 (MIT license)
assets/fonts/           Pixelify Sans (SIL Open Font License)
```

The art is drawn in code: characters are small text grids where each letter
is a color (see `src/art/dogSprites.js` and `src/art/creatures.js`).
Scenery is drawn pixel by pixel in `src/art/scenery.js`.

### Keyboard and touch controls

The game never reads keys directly. It asks `Controls`
(`src/input/controls.js`) for actions like "bark" or "dig". The on-screen
joystick and buttons (`src/ui/touchControls.js`) feed the same actions
through `src/input/touch.js`, so every scene works with either. Names
shown to the player ("press F" or "tap Dig") come from
`src/input/labels.js`.

## Keeping it out of search engines

`robots.txt` asks every search engine and AI crawler not to visit the site,
and each page has a `noindex` tag. Well-behaved crawlers (Google, Bing,
OpenAI, Anthropic, Common Crawl and others) follow these. Nothing can stop a
badly behaved scraper from reading a public website, though, and the code
itself is on GitHub, which this file can't control.

## Credits

- Game engine: [Phaser](https://phaser.io) 3.90, MIT license (`vendor/PHASER_LICENSE.md`)
- Font: [Pixelify Sans](https://github.com/eifetx/Pixelify-Sans), SIL Open Font License (`assets/fonts/OFL.txt`)
