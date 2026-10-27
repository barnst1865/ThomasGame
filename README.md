# Paws & Pastures

A cozy farming game where you play as the farmer's dog. Pick your breed,
help Farmer Hazel around the farm, hide bones in secret spots, and keep the
hens safe from sneaky weasels at night.

It runs in any web browser with no install and no build step.

## How to play

There's no clock. Each day is made of parts, and the next part starts as
soon as you finish the jobs in this one:

1. **Morning:** herd the sheep out of their pen to graze, bring the hens'
   eggs to the basket on the porch, and hide your bone by digging a hole.
2. **Fun break:** play fetch with Farmer Hazel. Catch the ball right as it
   lands for a bonus treat.
3. **Afternoon:** herd the sheep back into the pen, and chase the crows off
   the crops. Barking makes a crow hop away; bark again or run at it and it
   flies off for good.
4. **Dinner:** sit down with Farmer Hazel on the porch as the sun sets.
5. **Night:** a weasel sneaks toward the coop. Bark to startle it, then
   pounce to chase it off. Watch out for its lunge!
6. **Bed:** once the night job is done, curl up in your bed. The game saves
   and a new day begins.

Sheep walk away from you, so to herd them, get on the far side and push.
Your buried bones stay hidden day after day. Jobs earn treats and
friendship hearts. Your jobs for the current part of the day are always
listed in the top right corner.

If you click outside the game, it pauses and shows a "Click to keep playing"
button (the game can only hear the keyboard while it has focus).

| Action                   | Keys              |
| ------------------------ | ----------------- |
| Move                     | WASD or arrows    |
| Run                      | hold Shift        |
| Pick up, talk, sleep     | E (or Enter)      |
| Bark                     | Q (or B)          |
| Dig or bury              | F                 |
| Pounce                   | Space             |
| Controls / pause / sound | H / Esc / M       |

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

The parts of the day and their jobs are listed in `src/data/day.js`, and the
jobs themselves (names and rewards) in `src/data/tasks.js`. Numbers like how
many crows come or how many times Farmer Hazel throws the ball are in
`src/config.js`.

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
src/entities/           the dog, sheep, hens, farmer, weasel, crows, items
src/activities/         fetch, the crow raid, dinner on the porch
src/systems/            the day plan, seasons, saving, jobs, sounds, movement math
src/data/               breeds, the parts of the day, jobs, the farmer's lines
src/world/              the farm's layout and building it on screen
src/art/                all the pixel art, drawn with code
src/input/controls.js   keys mapped to actions
test/                   automated tests (node --test)
vendor/                 Phaser 3.90 (MIT license)
assets/fonts/           Pixelify Sans (SIL Open Font License)
```

The art is drawn in code: characters are small text grids where each letter
is a color (see `src/art/dogSprites.js`). Scenery is drawn pixel by pixel in
`src/art/scenery.js`.

### Adding touch controls later

The game never reads keys directly. It asks `Controls` for actions like
"bark" or "dig". A touch-screen joystick and buttons only need to call
`controls.setVirtualMove(x, y)` and `controls.setVirtual('bark', true)`.

## Credits

- Game engine: [Phaser](https://phaser.io) 3.90, MIT license (`vendor/PHASER_LICENSE.md`)
- Font: [Pixelify Sans](https://github.com/eifetx/Pixelify-Sans), SIL Open Font License (`assets/fonts/OFL.txt`)
