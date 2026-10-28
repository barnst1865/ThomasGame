// Pixel pictures for the story characters and their props: Pickles the
// cat, Sir Cluckington the rooster, the washing line, the mud puddle, the
// contest prizes, the clues in the Goldsby plan, and more. Same style as sprites.js: each letter is one pixel of the color
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

export const BEE_COLORS = { o: '#2a2014', y: '#f2c84b', k: '#2a2014', w: '#e8f6ff' };
export const BEE = {
  a: [
    '...o.o...',
    '..owowo..',
    '..owwwo..',
    '..ooooo..',
    '.oykykyo.',
    '.oykykyo.',
    '.oykykyo.',
    '..ooooo..',
  ],
  b: [
    '.........',
    '.........',
    '..oo.oo..',
    '.owwowwo.',
    '.oykykyo.',
    '.oykykyo.',
    '.oykykyo.',
    '..ooooo..',
  ],
};

export const DRONE_COLORS = { o: '#1a1a22', k: '#3a3a44', K: '#5a5a66', r: '#e25d6a', g: '#7fe08a', p: '#c8c8d0', P: '#e8e8f0' };
export const DRONE = {
  a: [
    '......................',
    '.ooooooo......ooooooo.',
    'oPpppppPo....oPpppppPo',
    '.oooKooo......oooKooo.',
    '..okkkkooooooookkkko..',
    '...ooookKKKkkkkoooo...',
    '......okkkkkkkko......',
    '......okkkrrkkko......',
    '......okkkkkkkko......',
    '.......ooggggoo.......',
    '.........oooo.........',
    '......................',
  ],
  b: [
    '...ooo..........ooo...',
    '..opPpo........opPpo..',
    '..opppo........opppo..',
    '..opKpo........opKpo..',
    '..okkkkooooooookkkko..',
    '...ooookKKKkkkkoooo...',
    '......okkkkkkkko......',
    '......okkkrrkkko......',
    '......okkkkkkkko......',
    '.......ooggggoo.......',
    '.........oooo.........',
    '......................',
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

export const EGG_PAINTED = {
  rows: [
    '..ooo..',
    '.oyyyo.',
    'obbbbbo',
    'owpwpwo',
    'obbbbbo',
    'oyyyyyo',
    '.opppo.',
    '..ooo..',
  ],
  colors: { o: '#5a4a6a', y: '#f2d23a', b: '#7fb8e6', p: '#f28ac0', w: '#fbf6ea' },
};

export const TREASURE = {
  rows: [
    '.oooooooo.',
    'oyYYYYYYyo',
    'oybbbbbbyo',
    'oooooooooo',
    'obbbyybbbo',
    'obbbyybbbo',
    'obbbbbbbbo',
    '.oooooooo.',
  ],
  colors: { o: '#3a2414', y: '#f2c84b', Y: '#fff3b0', b: '#9a6534' },
};

export const TROPHY = {
  rows: [
    '...o........o...',
    '..oYooooooooyo..',
    '.oyoyYYyyyyyoyo.',
    '.oyoyyyyyyyyoyo.',
    '..oyooooooooyo..',
    '...oooooooooo...',
    '..oyyyyyyyyyyo..',
    '.oyoyYYyyyssoyo.',
    '..ooyYyyyyssoo..',
    '...oyyyyyyyyo...',
    '....oyyyyyyo....',
    '....oyyyysyo....',
    '.....ooyyoo.....',
    '......oyyo......',
    '....oooyyooo....',
    '...obbbbbbbbo...',
    '...obbbbbbbbo...',
    '..obbbbbbbbbbo..',
    '..obbwwwwwwbbo..',
    '..obbbbbbbbbbo..',
    '...oooooooooo...',
    '................',
  ],
  colors: { o: '#5c3a10', y: '#f2c84b', Y: '#fff3b0', s: '#c99a2a', b: '#8a5a35', w: '#f6ecd2' },
};

export const RIBBON = {
  rows: [
    '....oooo....',
    '..ooBBBBoo..',
    '.oBBBBBBBBo.',
    '.oBBBBBBBBo.',
    'oBBBYYyyBBBo',
    'oBBByyyyBBBo',
    'oBBByyyyBBBo',
    'oBBByyyyBBBo',
    '.oBBBBBBBBo.',
    '.oBBBBBBBBo.',
    '..ooBBBBoo..',
    '..obboobbo..',
    '..obboobbo..',
    '..obboobbo..',
    '..obboobbo..',
    '..obboobbo..',
    '...oboobo...',
    '....o..o....',
  ],
  colors: { o: '#1f2a4a', B: '#3f6fd4', b: '#2f4f9f', y: '#f2c84b', Y: '#fff3b0' },
};

export const LETTER = {
  rows: [
    '.oooooooooooo.',
    'owwwwwwwwwwwwo',
    'owWwwwwwwwwWwo',
    'owwWwwwwwwWwwo',
    'owwwWwwwwWwwwo',
    'owwwwWYyWwwwwo',
    'owwwwwyywwwwwo',
    'owwwwrwwrwwwwo',
    'owwwwwwwwwwwwo',
    '.oooooooooooo.',
  ],
  colors: { o: '#4a3a2a', w: '#fbf6ea', W: '#d9cfb4', y: '#e0a92a', Y: '#fff3b0', r: '#b5473f' },
};

export const BLUEPRINT = {
  rows: [
    '.oooooooooooo.',
    'obbbbbbbbbbbbo',
    'obBbbBbbBbbBbo',
    'obBwwwwwBwwBbo',
    'obBwbbbwBwbBbo',
    'obBwbbbwBbwBbo',
    'obBwwwwwBwbBbo',
    'obBbbBbbBbwBbo',
    'obBwwwwwwbbBbo',
    'obbbbbbbbbbbbo',
    '.oooooooooooo.',
  ],
  colors: { o: '#1f2a4a', b: '#3f6fd4', B: '#5a86e0', w: '#e8f0ff' },
};

export const SAMPLE_BAG = {
  rows: [
    '...ooooo...',
    '..orrrrro..',
    '..orrrrro..',
    '.oWcccccco.',
    '.oWwkkkwco.',
    '.ocwkkwwco.',
    '.occccccco.',
    '.odddddddo.',
    '.oddddDddo.',
    '.odDdddddo.',
    '.odddddDdo.',
    '.oddDddddo.',
    '..ooooooo..',
  ],
  colors: { o: '#3a3036', c: '#d8ecf2', W: '#ffffff', d: '#7a4f2e', D: '#5a3820', r: '#e25d6a', w: '#fbf6ea', k: '#4a4a5a' },
};

export const FARM_MAP = {
  rows: [
    '.oooooooooooo.',
    'oppppPpppPpppo',
    'opgggPpppPpppo',
    'opgggPrrpPpppo',
    'opppprRRrPpppo',
    'opppprRRrPpppo',
    'oppppPrrpPbbpo',
    'opgppPpggPbbpo',
    'oppgpPpppPbbpo',
    'oppppPpppPpppo',
    '.oooooooooooo.',
  ],
  colors: { o: '#5a3a1a', p: '#f2e2b8', P: '#d9c49a', g: '#7fb069', b: '#7fb8e6', r: '#e25d6a', R: '#b5473f' },
};

export const FLAG = {
  rows: [
    '.oooooo..',
    'offffffo.',
    'ofYYfffo.',
    'offffffo.',
    'oFfffFfo.',
    'ofFFFfFo.',
    'osooooo..',
    'oso......',
    'oso......',
    'oso......',
    'oso......',
    'oso......',
    'oso......',
    'oso......',
    'oso......',
    '.o.......',
  ],
  colors: { o: '#4a2a14', f: '#ff8a2a', F: '#d9661a', Y: '#ffd27a', s: '#c49056' },
};

export const KEYS = {
  rows: [
    '.oooo......',
    'oyyyyo.....',
    'oyooyooooo.',
    'oyooyMMmmmo',
    'oyyyyomomo.',
    'ottto.o.omo',
    'ottto....o.',
    'ottto......',
    '.ooo.......',
  ],
  colors: { o: '#3a3036', y: '#c8c8d0', m: '#e6e6ee', M: '#ffffff', t: '#f2c84b' },
};

export const NEST = {
  rows: [
    '................',
    '....oo.oo.oo....',
    '.o.oEeoEeoEeo.o.',
    'obooeeoeeoeeoobo',
    'obbbeebeebeebbbo',
    '.oBbbbBbbbBbbBo.',
    '.obbBbbbBbbbBbo.',
    '.obBbbbBbbbBbbo.',
    '..oooooooooooo..',
  ],
  colors: { o: '#4a2a14', b: '#a8774a', B: '#7a4f2e', e: '#9fd8f0', E: '#e0f6ff' },
};

export const NATURE_SIGN = {
  rows: [
    '.oooooooooooooooooooooo.',
    'owwwwwwwwwwwwwwwwwwwwwwo',
    'owccccccccccccccccccccwo',
    'owccccccccccccccccccccwo',
    'owcccccccccggcccccccccwo',
    'owccccccccggggccccccccwo',
    'owcccrcrcggGgggcrcrcccwo',
    'owccrrrrrgggGggrrrrrccwo',
    'owcccrrrggGGggggrrrcccwo',
    'owccccrcggggGGggcrccccwo',
    'owcccccccGgGgggcccccccwo',
    'owccccccccggGgGcccccccwo',
    'owcccccccccGgcccccccccwo',
    'owccccccccccccccccccccwo',
    'owccGGGGGGGGGGGGGGGGccwo',
    'owccccccccccccccccccccwo',
    'owwwwwwwwwwwwwwwwwwwwwwo',
    '.ooooooooooppoooooooooo.',
    '..........oppo..........',
    '..........oppo..........',
    '..........oppo..........',
    '..........oppo..........',
    '..........oppo..........',
    '..........oppo..........',
    '..........oppo..........',
    '..........oppo..........',
    '..........oppo..........',
    '..........oppo..........',
    '..........oppo..........',
    '...........oo...........',
  ],
  colors: { o: '#3a2414', w: '#8a5a35', c: '#f6ecd2', p: '#7a4f2e', g: '#5fae4f', G: '#3f8a3a', r: '#e25d6a' },
};

export const FROG = {
  rows: [
    '............',
    '............',
    '...oo..oo...',
    '..oweooewo..',
    '..oggGGggo..',
    '..oggggggo..',
    '..oGggggGo..',
    '.oggyyyyggo.',
    'ogggyyyygggo',
    '.oooooooooo.',
  ],
  colors: { o: '#1f3a1a', g: '#6fbf4a', G: '#4a9a34', y: '#e8f0a0', e: '#1f2a1a', w: '#ffffff' },
};

export const RABBIT = {
  rows: [
    '.........ooro.',
    '........oropo.',
    '........opopo.',
    '........ororo.',
    '.......orrrrro',
    '.......orrrrro',
    '...ooooorrerro',
    '..orrrrrrrrrpo',
    '.owwrRrrrrrrro',
    '.owrrrRrrrooo.',
    '..orrrrrrro...',
    '..orRRrrRRo...',
    '...orrrrrro...',
    '....oooooo....',
  ],
  colors: { o: '#3a2a20', r: '#b89a7a', R: '#9a7a5a', w: '#fbf6ea', p: '#e8a0a0', e: '#1f1a14' },
};
