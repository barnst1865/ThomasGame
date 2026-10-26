// Pixel pictures of the dog. Every breed shares these shapes; breeds only
// change the colors (see src/data/breeds.js), the ears and the tail.
//
// Letters:
//   o outline     c coat      s coat shade   h head     m muzzle
//   b chest       g legs      G far legs     e eye      n nose
//   p tongue      k collar    a ear          i inner ear
//   t tail        T tail tip
//
// The "side" pictures face right; facing left is the same picture mirrored.

import { compose, darken } from './pixelArt.js';
import { hash2 } from '../systems/rng.js';

const SIDE_BODY_TOP = [
  '................',
  '................',
  '..........oooo..',
  '.........ohhhho.',
  '.........ohhhhho',
  '.........ohhewho',
  '.........ohhhmmn',
  '..ooooooohhmmmo.',
  '.occcccccckkbbo.',
  '.occcccccccbbo..',
  '.occcccccccbbo..',
  '.ossccccccsbbo..',
  '..osssssssssso..',
];

const SIDE = {
  stand: [
    ...SIDE_BODY_TOP,
    '..ogGo...oGgo...',
    '..ogGo...oGgo...',
    '..oooo...oooo...',
  ],
  walk1: [
    ...SIDE_BODY_TOP,
    '.ogGo.....oGgo..',
    '.ogo.......ogo..',
    '.oo.........oo..',
  ],
  walk2: [
    ...SIDE_BODY_TOP,
    '...oGgo.oGgo....',
    '....ogo.ogo.....',
    '....oo..oo......',
  ],
};

const FRONT_HEAD = [
  '................',
  '................',
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohhhhhhhho...',
  '...ohewhhhewo...',
  '...ohhmnnmhho...',
  '....ohmmmmho....',
  '....okmppmko....',
  '...ocbbbbbbco...',
  '..occbbbbbbcco..',
  '..oscggbbggcso..',
  '..ossggooggsso..',
];

const LEGS_FACING = {
  stand: ['....oggooggo....', '....oggooggo....', '.....oo..oo.....'],
  walk1: ['....oggooggo....', '.....oo.oggo....', '.........oo.....'],
  walk2: ['....oggooggo....', '....oggo.oo.....', '.....oo.........'],
};

const FRONT = {
  stand: [...FRONT_HEAD, ...LEGS_FACING.stand],
  walk1: [...FRONT_HEAD, ...LEGS_FACING.walk1],
  walk2: [...FRONT_HEAD, ...LEGS_FACING.walk2],
};

const BACK_TOP = [
  '................',
  '................',
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '....ohhhhhho....',
  '....okkkkkko....',
  '...occcccccco...',
  '..occcccccccco..',
  '..occcccccccco..',
  '..oscccccccsso..',
];

const BACK = {
  stand: [...BACK_TOP, ...LEGS_FACING.stand],
  walk1: [...BACK_TOP, ...LEGS_FACING.walk1],
  walk2: [...BACK_TOP, ...LEGS_FACING.walk2],
};

// Ears drawn on top of the head.
const EARS = {
  pointy: {
    side: [
      '.........o......',
      '........oao.....',
      '........oaio....',
      '.........o......',
    ],
    front: [
      '....o......o....',
      '...oao....oao...',
      '...oai....iao...',
      '...oa......ao...',
    ],
    back: [
      '....o......o....',
      '...oao....oao...',
      '...oaa....aao...',
      '...oa......ao...',
    ],
  },
  floppy: {
    side: [
      '................',
      '................',
      '................',
      '........oaa.....',
      '........oaaa....',
      '........oaaa....',
      '.........oaa....',
      '..........oo....',
    ],
    front: [
      '................',
      '................',
      '....o......o....',
      '...oa......ao...',
      '..oaa......aao..',
      '..oaa......aao..',
      '..oaa......aao..',
      '...oo......oo...',
    ],
    back: [
      '................',
      '................',
      '....o......o....',
      '...oa......ao...',
      '..oaa......aao..',
      '..oaa......aao..',
      '..oaa......aao..',
      '...oo......oo...',
    ],
  },
};

// Tails come in two wag positions (0 and 1).
const pad = (rows, before) => [...Array(before).fill('................'), ...rows];
const TAILS = {
  long: {
    side: [
      pad(['.oo.............', 'oTo.............', 'ott.............'], 5),
      pad(['oo..............', 'Tt..............', 'oo..............'], 7),
    ],
    front: [
      pad(['.............oo.', '............otTo', '............oo..'], 8),
      pad(['.oo.............', 'oTto............', '..oo............'], 8),
    ],
    back: [
      pad(['.....oo.........', '.....oTo........', '......oto.......', '......oto.......'], 8),
      pad(['.........oo.....', '........oTo.....', '.......oto......', '.......oto......'], 8),
    ],
  },
  fluffy: {
    side: [
      pad(['.oo.............', 'oTto............', 'otto............', '.ott............'], 4),
      pad(['ooo.............', 'Ttto............', 'ott.............', '.oo.............'], 6),
    ],
    front: [
      pad(['............ooo.', '...........ottTo', '............ooo.'], 8),
      pad(['.ooo............', 'oTtto...........', '.ooo............'], 8),
    ],
    back: [
      pad(['....ooo.........', '....oTto........', '.....ottto......', '......otto......'], 7),
      pad(['.........ooo....', '........otTo....', '......ottto.....', '......otto......'], 7),
    ],
  },
  none: { side: [null, null], front: [null, null], back: [null, null] },
};

// A dog curled up asleep, used for the dog bed.
const SLEEP = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '.......oooooo...',
  '.....oocccccsoo.',
  '..oo.occcccccsso',
  '.oaaocccccccccso',
  'ohhaahcccccccsso',
  'ohoohhcccccccsso',
  'ommhhgccccccsso.',
  'onmmggttttTTso..',
  '.ooooooooooooo..',
  '................',
  '................',
];

const BLANK = Array(16).fill('................');
const DIRS = { side: SIDE, down: FRONT, up: BACK };
const VIEW = { side: 'side', down: 'front', up: 'back' };

export const DOG_FRAME = 16;

// Every frame the game uses, in order. Each is [direction, pose, tailPosition].
export const DOG_FRAMES = [];
for (const dir of ['down', 'up', 'side']) {
  DOG_FRAMES.push([dir, 'stand', 0], [dir, 'stand', 1], [dir, 'walk1', 0], [dir, 'walk2', 1]);
}
DOG_FRAMES.push(['sleep', 'sleep', 0]);

export function dogFrameName(dir, pose, tail) {
  return pose === 'sleep' ? 'sleep' : `${dir}-${pose}-${tail}`;
}

export function dogPicture(breed, dir, pose, tailPos) {
  if (pose === 'sleep') {
    return breed.tail === 'none' ? SLEEP.map((r) => r.replaceAll('t', 'c')) : SLEEP;
  }
  const view = VIEW[dir];
  const ears = EARS[breed.ears]?.[view];
  const tail = TAILS[breed.tail]?.[view]?.[tailPos];
  // Tails sit behind the body in front view, on top otherwise.
  if (view === 'front') return compose(BLANK, tail, DIRS[dir][pose], ears);
  return compose(DIRS[dir][pose], ears, tail);
}

const FIXED = {
  e: '#17161d',
  n: '#1c1a20',
  p: '#e5737d',
  w: '#ffffff',
};

export const COLLARS = { red: '#d4483f', blue: '#3f6fd4', green: '#3f9c55', yellow: '#e2b33c' };

// Builds the color lookup for one breed + coat.
export function dogColors(coat, collar = 'red') {
  const p = coat.palette;
  const c = p.coat;
  const map = {
    o: p.outline ?? darken(c, 0.75),
    c,
    s: p.shade ?? darken(c, 0.2),
    h: p.head ?? c,
    m: p.muzzle ?? c,
    b: p.chest ?? c,
    g: p.legs ?? c,
    G: darken(p.legs ?? c, 0.2),
    a: p.ear ?? p.head ?? c,
    i: p.earInner ?? darken(p.ear ?? c, 0.25),
    t: p.tail ?? c,
    T: p.tailTip ?? p.tail ?? c,
    k: COLLARS[collar] ?? COLLARS.red,
    ...FIXED,
  };
  const speckle = coat.speckle;
  return (ch, x, y) => {
    if (speckle && (ch === 'c' || ch === 'h' || ch === 't') && hash2(x, y, 7) < speckle.chance) {
      return speckle.color;
    }
    return map[ch];
  };
}
