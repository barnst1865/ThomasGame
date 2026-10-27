// Saving and loading. The game auto-saves when the dog goes to sleep.
// Progress is kept in the browser's localStorage.

export const SAVE_KEY = 'paws-and-pastures/save';
export const SAVE_VERSION = 1;

export function createNewSave({ name, breedId, coatId }) {
  return {
    version: SAVE_VERSION,
    dog: { name, breedId, coatId, collar: 'red' },
    day: 1,
    treats: 0,
    friendship: { farmer: 0 },
    buried: [], // { tx, ty, item } for everything the dog has hidden underground
    stats: {
      bonesBuried: 0,
      eggsCollected: 0,
      sheepPenned: 0,
      weaselsChased: 0,
      crowsChased: 0,
      ballsCaught: 0,
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
    buried: Array.isArray(data.buried)
      ? data.buried.filter((b) => b && Number.isInteger(b.tx) && Number.isInteger(b.ty) && typeof b.item === 'string')
      : [],
    stats: { ...fresh.stats, ...cleanNumbers(data.stats) },
    flags: { ...fresh.flags, ...(data.flags && typeof data.flags === 'object' ? data.flags : {}) },
  };
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
