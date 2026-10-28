// Pixel pictures for everything that isn't the dog: farm animals, the
// farmer, the weasel, items and little icons.

import { flipX, compose } from './pixelArt.js';

// ---------------------------------------------------------------- sheep
export const SHEEP_COLORS = {
  o: '#4b4147',
  w: '#f6f3ec',
  s: '#d9d1c2',
  f: '#3b3136',
  e: '#f6f3ec',
  n: '#c98f8f',
  L: '#3b3136',
};

const SHEEP_SIDE_TOP = [
  '................',
  '................',
  '................',
  '...oo.oo.oo.....',
  '..owwowwowwo.oo.',
  '.owwwwwwwwwwoffo',
  'owwwwwwwwwwoffef',
  'owwwwwwwwwwfffff',
  'owwwwwwwwwwwfffo',
  'owwwwwwwwwwwwoo.',
  '.osswwwwwwwssso.',
  '..osssssssssso..',
];

const SHEEP_FRONT_TOP = [
  '................',
  '................',
  '................',
  '....oo.oo.oo....',
  '...owwowwowwo...',
  '..owwwwwwwwwwo..',
  '.owwwwoooowwwwo.',
  'offwwoeffeowwffo',
  '.oowwoffffowwoo.',
  '.owwwoffffowwwo.',
  '.owwwwonnowwwwo.',
  '.osswwwoowwwsso.',
  '..osssssssssso..',
];

const SHEEP_BACK_TOP = [
  '................',
  '................',
  '................',
  '....oo.oo.oo....',
  '...owwowwowwo...',
  '.offowwwwwwoffo.',
  '..ooowwwwwwooo..',
  '..owwwwwwwwwwo..',
  '.owwwwwwwwwwwwo.',
  '.owwwwwwwwwwwwo.',
  '.owwwwwwwwwwwwo.',
  '.osswwwwwwwwsso.',
  '..osssswwsssso..',
];

const SHEEP_LEGS = [
  ['...oLo....oLo...', '...oLo....oLo...', '...ooo....ooo...'],
  ['...oLo....oLo...', '..oLo......oLo..', '..ooo......ooo..'],
];

export const SHEEP = {
  side: SHEEP_LEGS.map((legs) => [...SHEEP_SIDE_TOP, ...legs, '................']),
  down: SHEEP_LEGS.map((legs) => [...SHEEP_FRONT_TOP, ...legs]),
  up: SHEEP_LEGS.map((legs) => [...SHEEP_BACK_TOP, ...legs]),
};

// --------------------------------------------------------------- chicken
export const CHICKEN_COLORS = {
  white: { o: '#3d2b26', w: '#fbf6ee', s: '#ddd2bf', r: '#d6453d', y: '#f0a830', e: '#1a1a1a' },
  brown: { o: '#3a2418', w: '#c98a52', s: '#a86d3c', r: '#d6453d', y: '#f0a830', e: '#1a1a1a' },
};

const CHICKEN_BODY = [
  '.oo.....owwwro..',
  'owwo...owwwwo...',
  'owwwoooowwwwo...',
  '.owwwwwwwswwo...',
  '.owwwwwwsswwo...',
  '..owwwwssswo....',
  '...oooooooo.....',
];

export const CHICKEN = {
  walk1: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '.........oro....',
    '........owwwo...',
    '........owweyy..',
    ...CHICKEN_BODY,
    '.....y..y.......',
  ],
  walk2: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '.........oro....',
    '........owwwo...',
    '........owweyy..',
    ...CHICKEN_BODY,
    '....y....y......',
  ],
  peck: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '.oo.......oro...',
    'owwo.....owwwo..',
    'owwwooooowweyy..',
    '.owwwwwwwwwwro..',
    '.owwwwwwsswwo...',
    '..owwwwssswo....',
    '...oooooooo.....',
    '.....y..y.......',
  ],
};

// ---------------------------------------------------------------- farmer
export const FARMER_COLORS = {
  o: '#2e2220',
  H: '#e8c66c',
  h: '#c9a24a',
  r: '#c0504d',
  a: '#7a4a2a',
  s: '#e9b48a',
  S: '#cf9670',
  e: '#2e2220',
  p: '#e8907f',
  c: '#ece6d4',
  C: '#cfc6ad',
  b: '#4f78b0',
  B: '#3d5f8e',
  u: '#e8c66c',
  k: '#5c3a28',
};

const FARMER_HAT = [
  '................',
  '................',
  '......oooo......',
  '.....oHHHHo.....',
  '....oHHHHHHo....',
  '....orrrrrro....',
  '.oohhHHHHHHhhoo.',
];

const FARMER_FRONT_BODY = [
  '..oooaaaaaaooo..',
  '....oassssao....',
  '....osesseso....',
  '....opsssspo....',
  '.....oossoo.....',
  '...occcccccco...',
  '..occbccccbcco..',
  '..ocbbbbbbbbco..',
  '..ocbbubbubbco..',
  '..osbbbbbbbbso..',
  '..oobbbbbbbboo..',
  '....obbbbbbo....',
];

const FARMER_BACK_BODY = [
  '..oooaaaaaaooo..',
  '....oaaaaaao....',
  '....oaaaaaao....',
  '....oaaaaaao....',
  '.....oSSSSo.....',
  '...occcccccco...',
  '..occbccccbcco..',
  '..occcbccbccco..',
  '..ocbbbbbbbbco..',
  '..osbbbbbbbbso..',
  '..oobbbbbbbboo..',
  '....obbbbbbo....',
];

const FARMER_SIDE_HAT = [
  '................',
  '................',
  '......oooo......',
  '.....oHHHHo.....',
  '....oHHHHHHo....',
  '....orrrrrro....',
  '..oohhHHHHHhhoo.',
];

const FARMER_SIDE_BODY = [
  '....oooaaassoo..',
  '.....oaaassso...',
  '.....oaasseso...',
  '.....oassspsso..',
  '......ossssoo...',
  '.....occcbcco...',
  '.....ocCbbbbo...',
  '.....ocCbbbbo...',
  '.....osSbbbbo...',
  '.....oobbbbbo...',
  '......obbbbbo...',
  '......obbbbbo...',
];

const FARMER_SIDE_TOP = [...FARMER_SIDE_HAT, ...FARMER_SIDE_BODY];

const FARMER_FACING_LEGS = {
  stand: ['....obboobbo....', '....obboobbo....', '....okkookko....', '...okkkookkko...', '...oooo..oooo...'],
  walk1: ['....obboobbo....', '....okkoobbo....', '...okkkookko....', '...oooo.okkko...', '........oooo....'],
  walk2: ['....obboobbo....', '....obbookko....', '....okkookkko...', '...okkko.oooo...', '...oooo.........'],
};

const FARMER_SIDE_LEGS = {
  stand: ['......obbbbo....', '......obbbbo....', '......okkkko....', '......okkkkko...', '......oooooo....'],
  walk1: ['.....obbobbo....', '....obbo.obbo...', '....okko.okko...', '...okkko.okkko..', '...oooo..oooo...'],
  walk2: ['......obbbbo....', '......obbbbo....', '......okkkko....', '......okkkkko...', '......oooooo....'],
};

// Every grown-up shares the farmer's body and walk. They differ in what's
// on their head (7 rows: front/back and side views, or 8 rows to replace
// the hair just under the hat too), their colors, and sometimes something
// extra drawn on top, like a mail bag.
function person({ head = FARMER_HAT, sideHead = FARMER_SIDE_HAT, backHead = head, extras = {} } = {}) {
  const join = (top, body) => [...top, ...body.slice(top.length - 7)];
  const frames = {};
  for (const pose of ['stand', 'walk1', 'walk2']) {
    frames[`down-${pose}`] = compose([...join(head, FARMER_FRONT_BODY), ...FARMER_FACING_LEGS[pose]], extras.down);
    frames[`up-${pose}`] = compose([...join(backHead, FARMER_BACK_BODY), ...FARMER_FACING_LEGS[pose]], extras.up);
    frames[`side-${pose}`] = compose([...join(sideHead, FARMER_SIDE_BODY), ...FARMER_SIDE_LEGS[pose]], extras.side);
  }
  return frames;
}

export const FARMER = person();

// Farmer Hazel without her hat (a certain rooster's idea).
const HAIR = ['................', '................', '................', '.....oooooo.....', '....oaaaaaao....', '...oaaaaaaaao...', '...oaaaaaaaao...', '...oaaaaaaaao...'];
const HAIR_SIDE = ['................', '................', '................', '.....oooooo.....', '....oaaaaaao....', '...oaaaaaaaao...', '...oaaaaaaaao...', '....oooaaassoo..'];
export const FARMER_NOHAT = person({ head: HAIR, backHead: HAIR, sideHead: HAIR_SIDE });

// ---------------------------------------------------------- mail carrier
// A cap with a badge, and a mail bag on a strap.
const CAP = ['................', '................', '................', '.....oooooo.....', '....oHHHHHHo....', '....oHHrrHHo....', '...ohhhhhhhho...'];
const CAP_BACK = ['................', '................', '................', '.....oooooo.....', '....oHHHHHHo....', '....oHHHHHHo....', '....ohhhhhho....'];
const CAP_SIDE = ['................', '................', '................', '.....oooooo.....', '....oHHHHHHo....', '....oHHHHHrHo...', '....ohhhhhhhhhoo'];
const blankPerson = () => Array(24).fill('................');
const at = (rows, y, line) => rows.map((r, i) => (i === y ? line : r));
let bagFront = blankPerson();
bagFront = at(bagFront, 12, '...........m....');
bagFront = at(bagFront, 13, '..........m.....');
bagFront = at(bagFront, 14, '.........m......');
bagFront = at(bagFront, 15, '.oooooo.m.......');
bagFront = at(bagFront, 16, '.oMMMMom........');
bagFront = at(bagFront, 17, '.ommmmmo........');
bagFront = at(bagFront, 18, '.ommmmmo........');
bagFront = at(bagFront, 19, '..ooooo.........');
let bagSide = blankPerson();
bagSide = at(bagSide, 15, '...oooo.........');
bagSide = at(bagSide, 16, '...oMMo.........');
bagSide = at(bagSide, 17, '...ommo.........');
bagSide = at(bagSide, 18, '....oo..........');
let bagBack = blankPerson();
bagBack = at(bagBack, 12, '....m...........');
bagBack = at(bagBack, 13, '.....m..........');
bagBack = at(bagBack, 14, '......m.........');
bagBack = at(bagBack, 15, '.......m.oooooo.');
bagBack = at(bagBack, 16, '........moMMMMo.');
bagBack = at(bagBack, 17, '.........ommmmo.');
bagBack = at(bagBack, 18, '.........ommmmo.');
bagBack = at(bagBack, 19, '..........oooo..');

export const MAIL_CARRIER = person({ head: CAP, backHead: CAP_BACK, sideHead: CAP_SIDE, extras: { down: bagFront, side: bagSide, up: bagBack } });
export const MAIL_CARRIER_COLORS = {
  ...FARMER_COLORS,
  H: '#2f4f8f',
  h: '#24407a',
  r: '#f2c84b',
  a: '#3a2a20',
  s: '#b07a52',
  S: '#946140',
  c: '#a9cbea',
  C: '#86aacb',
  b: '#2f4f8f',
  B: '#24407a',
  u: '#f2c84b',
  k: '#2e2220',
  m: '#8a5a35',
  M: '#b07a4a',
};

// ------------------------------------------------------------ shopkeeper
// Red bobbed hair with a headband, and an apron.
const BOB = [
  '................',
  '................',
  '................',
  '.....oooooo.....',
  '....oaaaaaao....',
  '...oaWWWWWWao...',
  '...oaaaaaaaao...',
  '...oaaaaaaaao...',
];
const BOB_SIDE = [
  '................',
  '................',
  '................',
  '.....oooooo.....',
  '....oaaaaaao....',
  '...oaWWWWWWWo...',
  '...oaaaaaaaao...',
  '...oaaaaaaasoo..',
];
let apron = blankPerson();
apron = at(apron, 13, '....owwwwwwo....');
apron = at(apron, 14, '....owwwwwwo....');
apron = at(apron, 15, '....owwwwwwo....');
apron = at(apron, 16, '....owWWWWwo....');
apron = at(apron, 17, '....owwwwwwo....');
apron = at(apron, 18, '....owwwwwwo....');
let apronSide = blankPerson();
apronSide = at(apronSide, 13, '.........wwo....');
apronSide = at(apronSide, 14, '.........wwo....');
apronSide = at(apronSide, 15, '.........wwo....');
apronSide = at(apronSide, 16, '.........wwo....');
apronSide = at(apronSide, 17, '.........wwo....');

export const SHOPKEEPER = person({ head: BOB, backHead: BOB, sideHead: BOB_SIDE, extras: { down: apron, side: apronSide } });
export const SHOPKEEPER_COLORS = {
  ...FARMER_COLORS,
  a: '#c0504d',
  s: '#f0c8a0',
  S: '#d9a983',
  c: '#f2a93b',
  C: '#d98a2b',
  b: '#5a9cf0',
  B: '#4a80cc',
  u: '#f6ecd2',
  k: '#5c3a28',
  w: '#fbf7ee',
  W: '#e25d6a',
};

// ---------------------------------------------------------------- weasel
export const WEASEL_COLORS = {
  o: '#2a1a12',
  c: '#8a5a34',
  b: '#f0e2c8',
  e: '#111111',
  n: '#111111',
  T: '#2a1a12',
};

const WEASEL_TOP = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '...........o.o..',
  'oo........occeco',
  'Tccooooooocccbbn',
  '.occcccccccccbbo',
  '..obbbbbbbbbbo..',
];

export const WEASEL = {
  walk1: [...WEASEL_TOP, '...oco....oco...', '...oo.....oo....', '................'],
  walk2: [...WEASEL_TOP, '..oco......oco..', '..oo.......oo...', '................'],
  crouch: [
    ...WEASEL_TOP.slice(1).map((r, i) => (i === 7 ? '...........oo...' : r)),
    '..oooo....oooo..',
    '................',
    '................',
    '................',
  ],
};

// ----------------------------------------------------------------- items
export const EGG = {
  rows: ['..ooo..', '.owwwo.', 'owwwwwo', 'owwwwwo', 'owwwwso', 'owwwsso', '.ossso.', '..ooo..'],
  colors: { o: '#6b5a4a', w: '#fbf6ea', s: '#e3d7bd' },
};

const BONE_ROWS = ['.oo......oo.', 'owwoooooowwo', '.owwwwwwwwo.', '.owssssssso.', 'owsoooooosso', '.oo......oo.'];

export const BONE = {
  rows: BONE_ROWS,
  colors: { o: '#6b5a4a', w: '#f6efdf', s: '#ddd1b8' },
};

export const TREAT = {
  rows: BONE_ROWS,
  colors: { o: '#5c3a22', w: '#e0a86a', s: '#b77b45' },
};

export const HEART = {
  rows: ['.oo.oo.', 'orwrrro', 'orrrrro', '.orrro.', '..oro..', '...o...'],
  colors: { o: '#5a1e26', r: '#e25d6a', w: '#ffd6da' },
};

export const HEART_EMPTY = {
  rows: HEART.rows,
  colors: { o: '#5a1e26', r: '#8c6a6e', w: '#a88a8d' },
};

export const HOLE = {
  rows: [
    '....dddddd....',
    '..ddmmmmmmdd..',
    '.dmkkkkkkkkmd.',
    'dmkkkkkkkkkkmd',
    'dkkkkkkkkkkkkd',
    '.dkkkkkkkkkkd.',
    '..ddkkkkkkdd..',
    '....dddddd....',
  ],
  colors: { d: '#9b6b40', m: '#5c3b22', k: '#3e2718' },
};

export const MOUND = {
  rows: ['....dddd....', '..ddlllldd..', '.dlllllllld.', 'dllllllllssd', '.dddddddddd.'],
  colors: { d: '#8a5a35', l: '#b88552', s: '#9b6b40' },
};

export const BASKET = {
  rows: [
    '....oooooo....',
    '...o......o...',
    '..o........o..',
    '.oooooooooooo.',
    'oBbBbBbBbBbBbo',
    'obBbBbBbBbBbBo',
    'oBbBbBbBbBbBbo',
    '.obBbBbBbBbBo.',
    '..oooooooooo..',
  ],
  colors: { o: '#4a2f1c', B: '#c48a4a', b: '#9a6534' },
};

export const DOG_BED = {
  rows: [
    '....oooooooooooooooo....',
    '..ooRRRRRRRRRRRRRRRRoo..',
    '.oRRrrrrrrrrrrrrrrrrRRo.',
    'oRRrrccccccccccccccrrRRo',
    'oRrrccccccccccccccccrrRo',
    'oRrrccccccccccccccccrrRo',
    'oRRrrccccccccccccccrrRRo',
    '.oRRrrrrrrrrrrrrrrrrRRo.',
    '..ooRRRRRRRRRRRRRRRRoo..',
    '....oooooooooooooooo....',
  ],
  colors: { o: '#4a2320', R: '#b5473f', r: '#d9645a', c: '#efe2c4' },
};

export const EXCLAIM = {
  rows: ['ooo', 'oyo', 'oyo', 'oyo', 'oyo', 'ooo', 'oyo', 'ooo'],
  colors: { o: '#3a2a10', y: '#ffd84a' },
};

export const QUESTION = {
  rows: ['.ooo.', 'oyyyo', 'oo.yo', '..oyo', '.oyo.', '.ooo.', '.oyo.', '.ooo.'],
  colors: { o: '#3a2a10', y: '#ffffff' },
};

export const ZZZ = {
  rows: ['ooooooo', 'owwwwwo', 'oooowwo', '.owwoo.', 'owwoooo', 'owwwwwo', 'ooooooo'],
  colors: { o: '#2b2f5a', w: '#ffffff' },
};

export const SUN = {
  rows: [
    '....y....',
    '.y.....y.',
    '...yyy...',
    '..yYYYy..',
    'y.yYYYy.y',
    '..yYYYy..',
    '...yyy...',
    '.y.....y.',
    '....y....',
  ],
  colors: { y: '#f2a93b', Y: '#ffd84a' },
};

export const MOON = {
  rows: [
    '...mmmm..',
    '.mmmm....',
    '.mmm.....',
    'mmm......',
    'mmm......',
    'mmm......',
    '.mmm....m',
    '.mmmmmmmm',
    '...mmmmm.',
  ],
  colors: { m: '#7d86c9' },
};

// ------------------------------------------------------------------ crow
export const CROW_COLORS = { o: '#141218', c: '#2e2b3b', s: '#4a4766', e: '#f2e8c8', b: '#9a9488', y: '#6b5f55' };

export const CROW = {
  perch: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '..........ooo...',
    '.........occco..',
    '.........ocecbb.',
    'ooo.....occcco..',
    'occoooooccccco..',
    '.occccccsssccco.',
    '..oocsssscccoo..',
    '....ooyoooyo....',
  ],
  peck: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    'ooo.............',
    'occooooooooo....',
    '.occccccsscccooo',
    '..occcsssscocecb',
    '...oocccccco.ob.',
    '....ooyoooyo....',
  ],
  fly1: [
    '................',
    '................',
    '..oo......oo....',
    '.ocso....osco...',
    '..ocso..oscco...',
    '...ocsoosccoooo.',
    'oo..occcccocceb.',
    'occooccccccooo..',
    '.ooo.oooooo.....',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  fly2: [
    '................',
    '................',
    '................',
    '................',
    '..........oooo..',
    'oo...oooooocceb.',
    'occooccccccooo..',
    '.ooocsssscco....',
    '...ocssooscco...',
    '..ocso....osco..',
    '..oo.......oo...',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
};

// ----------------------------------------------------------- more items
export const BALL = {
  rows: ['..ooo..', '.orrwo.', 'orrrrwo', 'orrrrro', 'oRrrrro', '.oRRro.', '..ooo..'],
  colors: { o: '#5a1e1a', r: '#e2483d', R: '#b5302a', w: '#ffd6d0' },
};

const BOWL_COLORS = { o: '#3a1f1a', R: '#c8473e', r: '#a83a33', k: '#a8693a', K: '#7a4826', d: '#5a2a24' };

export const BOWL = {
  rows: ['...kKkkKkkk...', '.okkKkkKkkKko.', 'oRRRRRRRRRRRRo', 'oRrrrrrrrrrrRo', '.oRrrrrrrrrRo.', '..oooooooooo..'],
  colors: BOWL_COLORS,
};

export const BOWL_EMPTY = {
  rows: ['..............', '..oooooooooo..', 'oRddddddddddRo', 'oRrrrrrrrrrrRo', '.oRrrrrrrrrRo.', '..oooooooooo..'],
  colors: BOWL_COLORS,
};

const HORIZON_ROWS = [
  '.....y.....',
  '..y.....y..',
  '....YYY....',
  '...YYYYY...',
  'y.YYYYYYY.y',
  'ggggggggggg',
  '.ggggggggg.',
];

export const SUNRISE = {
  rows: HORIZON_ROWS,
  colors: { y: '#f2a93b', Y: '#ffd84a', g: '#5f9e4f' },
};

export const SUNSET = {
  rows: HORIZON_ROWS,
  colors: { y: '#e2483d', Y: '#ff9a4a', g: '#4a6a3f' },
};

// Everything above, for the sprite preview tool.
export function PREVIEW() {
  const list = [];
  for (const [dir, frames] of Object.entries(SHEEP)) frames.forEach((f, i) => list.push([`sheep ${dir}${i}`, f, SHEEP_COLORS]));
  for (const [pose, rows] of Object.entries(CHICKEN)) {
    list.push([`hen ${pose}`, rows, CHICKEN_COLORS.white]);
    list.push([`hen ${pose}`, flipX(rows), CHICKEN_COLORS.brown]);
  }
  for (const [name, rows] of Object.entries(FARMER)) list.push([`farmer ${name}`, rows, FARMER_COLORS]);
  for (const [name, rows] of Object.entries(FARMER_NOHAT)) list.push([`no hat ${name}`, rows, FARMER_COLORS]);
  for (const [name, rows] of Object.entries(MAIL_CARRIER)) list.push([`mail ${name}`, rows, MAIL_CARRIER_COLORS]);
  for (const [name, rows] of Object.entries(SHOPKEEPER)) list.push([`shop ${name}`, rows, SHOPKEEPER_COLORS]);
  for (const [pose, rows] of Object.entries(WEASEL)) list.push([`weasel ${pose}`, rows, WEASEL_COLORS]);
  for (const [pose, rows] of Object.entries(CROW)) list.push([`crow ${pose}`, rows, CROW_COLORS]);
  for (const [name, item] of Object.entries({ EGG, BONE, TREAT, BALL, BOWL, BOWL_EMPTY, HEART, HEART_EMPTY, HOLE, MOUND, BASKET, DOG_BED, EXCLAIM, QUESTION, ZZZ, SUN, SUNRISE, SUNSET, MOON })) {
    list.push([name.toLowerCase(), item.rows, item.colors]);
  }
  return list;
}
