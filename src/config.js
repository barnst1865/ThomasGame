// Game-wide constants. Tweak numbers here to tune how the game feels.

export const TILE = 16;

// The canvas is drawn at this size and scaled to fit the window.
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

// How much the farm camera zooms in on the pixel art.
export const WORLD_ZOOM = 2;

export const FONT = '"Pixelify Sans", ui-monospace, monospace';

export const COLORS = {
  ink: '#2b2024',
  paper: '#f6ecd2',
  paperDark: '#e3d3ae',
  wood: '#8a5a3b',
  woodDark: '#5e3a26',
  leaf: '#5f9e4f',
  sky: '#9fd3e6',
  treat: '#d9a066',
  heart: '#e25d6a',
  night: '#141a3a',
};

// Dog movement and abilities. Breeds scale these with their own stats.
export const DOG = {
  walkSpeed: 80,
  runSpeed: 135,
  herdRadius: 56, // sheep start to move away when the dog is this close
  barkRadius: 96,
  barkCooldown: 0.9,
  pounceDistance: 44,
  pounceTime: 0.22,
  pounceCooldown: 0.55,
  pounceDamage: 1,
  digTime: 0.7,
  reach: 16, // how close the dog must be to pick up or talk
  stunTime: 0.7,
};

export const SHEEP = {
  count: 5,
  wanderSpeed: 14,
  fleeSpeed: 62,
  barkFleeSpeed: 85,
};

export const CHICKENS = {
  count: 4,
  eggsPerDay: 3,
};

export const WEASEL = {
  health: 4,
  sneakSpeed: 24,
  lungeSpeed: 150,
  fleeSpeed: 130,
  stealTime: 6,
};

export const CROWS = {
  total: 4, // crows that come to the crops each afternoon
  atOnce: 2,
  courage: 1, // barks a crow ignores (it just hops) before it flies off
  scareDistance: 20, // running right up to a crow scares it off
};

export const FETCH = {
  throws: 3,
  catchDistance: 14, // catch the ball in the air if you're this close when it lands
};

// Days are made of parts (see src/data/day.js). These are the pauses between things.
export const DAY = {
  partPause: 1.2, // seconds between finishing a part and the next one starting
  weaselDelay: 6, // seconds after night falls before the weasel shows up
  daysPerSeason: 28,
};
