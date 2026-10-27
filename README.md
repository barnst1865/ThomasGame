# Paws & Pastures

A cozy farming game where you play as the farmer's dog. Pick your breed,
help Farmer Hazel around the farm, hide bones in secret spots, and keep the
hens safe from sneaky weasels at night.

It runs in any web browser with no install and no build step.

## How to play

Each day Farmer Hazel has jobs for you:

- **Herd the sheep into the pen.** Sheep walk away from you, so get on the
  far side of them and push them toward the gate. Barking scares them along
  faster.
- **Bring the eggs to the basket.** Pick up eggs near the coop and carry
  them to the basket on the porch (or straight to Farmer Hazel).
- **Hide your bone.** Pick it up, find some grass, and dig. Your buried
  bones stay hidden day after day. Remember where you put them!
- **Keep the weasel away.** After dark a weasel sneaks toward the coop.
  Bark to startle it, then pounce to chase it off. Watch out for its lunge.

Jobs earn treats and friendship hearts. After 6 PM you can sleep in your bed,
which saves the game and starts a new day. Stay up until midnight and you'll
fall asleep wherever you are.

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
src/entities/           the dog, sheep, hens, farmer, weasel, items
src/systems/            clock and seasons, saving, jobs, sounds, movement math
src/data/               breeds, jobs, the farmer's lines
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
