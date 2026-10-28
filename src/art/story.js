// Pixel pictures for the story characters and their props: Pickles the
// cat, Sir Cluckington the rooster, the washing line, the mud puddle and
// more. Same style as sprites.js: each letter is one pixel of the color
// listed next to it, and '.' is see-through.

export const CAT_COLORS = { o: '#4a2a14', c: '#f2a04a', s: '#d0702a', w: '#fbf3e4', e: '#2b3a20', n: '#e5737d', i: '#f2b8b0', b: '#9a6534' };
export const CAT = {
  walk1: [
    '................',
    '................',
    '................',
    '................',
    '..o.......o..o..',
    '.oso.....ocooco.',
    'oco......oiscico',
    'oso......occscco',
    'ocooooooooccecno',
    '.occcscscscccwwo',
    '..occscsccccwwwo',
    '..occccccccoooo.',
    '..ocwwwwwwco....',
    '...ocooooco.....',
    '...oco..oco.....',
    '....o....o......',
  ],
  walk2: [
    '................',
    '................',
    '................',
    '................',
    '..o.......o..o..',
    '.oso.....ocooco.',
    'oco......oiscico',
    'oso......occscco',
    'ocooooooooccecno',
    '.occcscscscccwwo',
    '..occscsccccwwwo',
    '..occccccccoooo.',
    '..ocwwwwwwco....',
    '..ocoocococo....',
    '..oco.oocoo.....',
    '...o....o.......',
  ],
  sit: [
    '................',
    '................',
    '.....o....o.....',
    '....ocooooco....',
    '....oicsscio....',
    '....occsccco....',
    '....ocecceco....',
    '....occnncco....',
    '....ocwwwwco....',
    '...occwwwwcco...',
    '...oscwwwwcsoo..',
    '...occwwwwccoso.',
    '...oscwwwwcsoco.',
    '...occwwwwcccco.',
    '...ocwwccwwcoo..',
    '....oooooooo....',
  ],
  sleep: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '.........o...o..',
    '...oooooocoooco.',
    '..ocscsccicscio.',
    '.occcscscccccco.',
    '.ocsccccccbcbco.',
    '.occsccccccncco.',
    '.occccccccwcwco.',
    'occsccscccwooo..',
    '.oooooooooo.....',
  ],
};

export const ROOSTER_COLORS = { o: '#3a2418', w: '#e0a050', s: '#b87a38', n: '#f07a30', r: '#d6453d', y: '#f0a830', e: '#1a1a1a', k: '#24323a', K: '#3f7a5a' };
export const ROOSTER = {
  walk1: [
    '................',
    '................',
    '.kk.......orro..',
    'kKko.....orrro..',
    'kKKko....onnno..',
    '.kKko...onnneyy.',
    '..kKko..onnnoyr.',
    '...kKooownnnro..',
    '...okwwwwwwwo...',
    '...owwwwwswwo...',
    '...owwwwsswwo...',
    '....owwssswo....',
    '.....oooooo.....',
    '.......y..y.....',
    '.......y..y.....',
    '......yy.yy.....',
  ],
  walk2: [
    '................',
    '................',
    '.kk.......orro..',
    'kKko.....orrro..',
    'kKKko....onnno..',
    '.kKko...onnneyy.',
    '..kKko..onnnoyr.',
    '...kKooownnnro..',
    '...okwwwwwwwo...',
    '...owwwwwswwo...',
    '...owwwwsswwo...',
    '....owwssswo....',
    '.....oooooo.....',
    '......y...y.....',
    '.....y.....y....',
    '....yy....yy....',
  ],
  crow: [
    '................',
    '..........orro..',
    '.kk......orrro..',
    'kKko.....onnno.y',
    'kKKko...onnneyy.',
    '.kKko...onnnoy..',
    '..kKko..onnnor..',
    '...kKooownnnro..',
    '...okwwwwwwwo...',
    '...owwwwwswwo...',
    '...owwwwsswwo...',
    '....owwssswo....',
    '.....oooooo.....',
    '.......y..y.....',
    '.......y..y.....',
    '......yy.yy.....',
  ],
};

export const SHEET_HANGING = {
  rows: [
    '.y........y.',
    'oWWWWWWWWWWo',
    'owwwwwwwwwwo',
    'obbbbbbbbbbo',
    'owwwwwwwwwwo',
    'owwwwwwwwwwo',
    'obbbbbbbbbbo',
    'owwwwwwwwwwo',
    'owwwwwwwwwwo',
    'owwwwwwwwwwo',
    '.owwwwwwwwo.',
    '..oooooooo..',
  ],
  colors: { o: '#5a6a7a', W: '#ffffff', w: '#f4f7fb', b: '#7fa3d6', y: '#c49056' },
};

export const SHEET = {
  rows: [
    '...oooooo.....',
    '..owwwwwwoo...',
    '.owbbbbwwwwo..',
    'owwwwwwwbbbwo.',
    'owbbwwwwwwwwwo',
    '.owwwwbbbwwwo.',
    '..ooowwwwooo..',
    '.....oooo.....',
  ],
  colors: { o: '#5a6a7a', w: '#f4f7fb', b: '#7fa3d6' },
};

export const SHEET_MUDDY = {
  rows: [
    '...oooooo.....',
    '..owmmwwwoo...',
    '.owbbmmwwmwo..',
    'owmmwwwmbmmwo.',
    'owbmwwmmwwmwwo',
    '.owwmmbmmwwmo.',
    '..ooowmmwooo..',
    '.....oooo.....',
  ],
  colors: { o: '#4a3a2a', w: '#d9d2c4', b: '#8a9ab6', m: '#7a5636' },
};

export const MUD = {
  rows: [
    '......oooooooooooooo......',
    '...oooMMMMMMMMMMMMMMooo...',
    '.ooMMMMmmmmmmmmmmmmMMMMoo.',
    'oMMMmmmmmmmmhhmmmmmmmmMMMo',
    'oMMmmmhhmmmmmmmmmmmmmmmMMo',
    'oMMMmmmmmmmmmmmmmhhmmmMMMo',
    '.ooMMMMmmmmmmmmmmmmMMMMoo.',
    '...oooMMMMMMMMMMMMMMooo...',
    '......oooooooooooooo......',
  ],
  colors: { o: '#3a2818', M: '#6a4a2c', m: '#54381e', h: '#8a6a4a' },
};

export const PAW_MUD = {
  rows: [
    '.m.m.',
    'm...m',
    '.mmm.',
    '.mmm.',
  ],
  colors: { m: '#5c3b22' },
};

export const PAW_CAT = {
  rows: [
    '.p.p',
    'p...',
    '.pp.',
  ],
  colors: { p: '#7a5a46' },
};

export const FEATHER = {
  rows: [
    '.......oo.',
    '......orro',
    '.....orrro',
    '....orrrro',
    '...orrRro.',
    '..orrRro..',
    '.orrRro...',
    '.orRro....',
    'oRrro.....',
    'oRoo......',
    'oo........',
  ],
  colors: { o: '#5a1a1a', r: '#e25d6a', R: '#b5473f' },
};
