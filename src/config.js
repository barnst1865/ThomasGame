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

// Time. The clock is measured in minutes since midnight.
export const TIME = {
  gameMinutesPerSecond: 2.8, // about 5 real minutes of daylight
  dayStart: 6 * 60,
  bedtimeAllowed: 18 * 60,
  chickensToBed: 19 * 60 + 30,
  nightfall: 20 * 60,
  weaselEarliest: 20 * 60 + 20,
  weaselLatest: 21 * 60,
  midnight: 24 * 60,
  daysPerSeason: 28,
};
