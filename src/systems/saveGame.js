// Saving and loading. The game auto-saves when the dog goes to sleep.
// Progress is kept in the browser's localStorage.

import { GIFTS } from '../data/gifts.js';
import { ALL_ITEMS, STARTER_LOOK } from '../data/shop.js';

export const SAVE_KEY = 'paws-and-pastures/save';
export const SAVE_VERSION = 1;

export function createNewSave({ name, breedId, coatId }) {
  return {
    version: SAVE_VERSION,
    // What the dog is wearing: a collar color, a bandana and a hat (see src/data/shop.js).
    dog: { name, breedId, coatId, collar: STARTER_LOOK.collar, neck: STARTER_LOOK.neck, hat: STARTER_LOOK.hat },
    day: 1,
    treats: 0, // every treat ever earned; they unlock shelves at the shop and are never spent
    friendship: { farmer: 0 },
    gifts: [], // presents from the mail (ids from src/data/gifts.js)
    owned: [], // things picked at the shop (ids from src/data/shop.js)
    home: { bed: STARTER_LOOK.bed, house: STARTER_LOOK.house },
    buried: [], // { tx, ty, item } for everything the dog has hidden underground
    stats: {
      bonesBuried: 0,
      eggsCollected: 0,
      sheepPenned: 0,
      weaselsChased: 0,
      raccoonsChased: 0,
      coyotesChased: 0,
      wolvesChased: 0,
      wispsPopped: 0,
      crowsChased: 0,
      hawksScared: 0,
      ballsCaught: 0,
      butterfliesCaught: 0,
      lostThingsFound: 0,
    },
    flags: { metFarmer: false },
  };
}

// Returns a clean save object, or null if the data is missing or broken.
export function parseSave(text) {
  if (typeof text !== 'string' || text.length === 0) return null;
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  return migrate(data);
}

function migrate(data) {
  if (!data || typeof data !== 'object') return null;
  if (data.version !== SAVE_VERSION) return null; // future versions add upgrade steps here
  const dog = data.dog;
  if (!dog || typeof dog.name !== 'string' || typeof dog.breedId !== 'string') return null;

  const fresh = createNewSave({ name: dog.name, breedId: dog.breedId, coatId: dog.coatId });
  return {
    ...fresh,
    dog: { ...fresh.dog, ...dog },
    day: toCount(data.day, 1),
    treats: toCount(data.treats, 0),
    friendship: { ...fresh.friendship, ...cleanNumbers(data.friendship) },
    gifts: knownIds(data.gifts, GIFTS),
    owned: knownIds(data.owned, ALL_ITEMS),
    home: { ...fresh.home, ...cleanStrings(data.home) },
    buried: Array.isArray(data.buried)
      ? data.buried.filter((b) => b && Number.isInteger(b.tx) && Number.isInteger(b.ty) && typeof b.item === 'string')
      : [],
    stats: { ...fresh.stats, ...cleanNumbers(data.stats) },
    flags: { ...fresh.flags, ...(data.flags && typeof data.flags === 'object' ? data.flags : {}) },
  };
}

// Keeps only ids the game knows about, once each.
function knownIds(list, known) {
  if (!Array.isArray(list)) return [];
  const ids = new Set(known.map((k) => k.id));
  return [...new Set(list.filter((id) => ids.has(id)))];
}

function cleanStrings(obj) {
  const out = {};
  if (!obj || typeof obj !== 'object') return out;
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') out[key] = value;
  }
  return out;
}

function toCount(value, min) {
  return Number.isFinite(value) ? Math.max(min, Math.floor(value)) : min;
}

function cleanNumbers(obj) {
  const out = {};
  if (!obj || typeof obj !== 'object') return out;
  for (const [key, value] of Object.entries(obj)) {
    if (Number.isFinite(value)) out[key] = value;
  }
  return out;
}

// localStorage can be missing or throw (private windows, blocked storage),
// so every access is guarded. The game still plays, it just won't remember.
export function browserStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadSave(storage = browserStorage()) {
  try {
    return parseSave(storage?.getItem(SAVE_KEY) ?? '');
  } catch {
    return null;
  }
}

export function writeSave(save, storage = browserStorage()) {
  try {
    storage?.setItem(SAVE_KEY, JSON.stringify(save));
    return Boolean(storage);
  } catch {
    return false;
  }
}

export function deleteSave(storage = browserStorage()) {
  try {
    storage?.removeItem(SAVE_KEY);
  } catch {
    // nothing to do
  }
}
