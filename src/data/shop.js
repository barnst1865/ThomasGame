// The Wagtail Wagon, a shop on wheels that visits every few days. Farmer
// Hazel buys the dog one thing per visit. Treats are never spent: the more
// treats you've earned in total, the more shelves are open to choose from.
//
// slot:  collar, neck (bandanas), hat, bed (your dog bed) or house (the
//        doghouse roof)
// look:  which picture or color to use (see src/art/dogSprites.js and
//        src/art/scenery.js)

export const SHELVES = [
  {
    treats: 0,
    name: 'Collars',
    items: [
      { id: 'collar-blue', name: 'Blue Collar', slot: 'collar', look: 'blue' },
      { id: 'collar-green', name: 'Green Collar', slot: 'collar', look: 'green' },
      { id: 'collar-yellow', name: 'Yellow Collar', slot: 'collar', look: 'yellow' },
      { id: 'collar-purple', name: 'Purple Collar', slot: 'collar', look: 'purple' },
    ],
  },
  {
    treats: 100,
    name: 'Bandanas and beds',
    items: [
      { id: 'neck-red', name: 'Red Bandana', slot: 'neck', look: 'red' },
      { id: 'neck-blue', name: 'Blue Bandana', slot: 'neck', look: 'blue' },
      { id: 'neck-green', name: 'Green Bandana', slot: 'neck', look: 'green' },
      { id: 'bed-blue', name: 'Blue Dog Bed', slot: 'bed', look: 'blue' },
      { id: 'bed-green', name: 'Green Dog Bed', slot: 'bed', look: 'green' },
    ],
  },
  {
    treats: 250,
    name: 'Hats and paint',
    items: [
      { id: 'hat-straw', name: 'Straw Hat', slot: 'hat', look: 'straw' },
      { id: 'hat-beanie', name: 'Cozy Beanie', slot: 'hat', look: 'beanie' },
      { id: 'hat-party', name: 'Party Hat', slot: 'hat', look: 'party' },
      { id: 'house-blue', name: 'Blue Doghouse Roof', slot: 'house', look: 'blue' },
      { id: 'house-yellow', name: 'Yellow Doghouse Roof', slot: 'house', look: 'yellow' },
    ],
  },
  {
    treats: 450,
    name: 'Fancy',
    items: [
      { id: 'hat-crown', name: 'Golden Crown', slot: 'hat', look: 'crown' },
      { id: 'collar-gold', name: 'Gold Collar', slot: 'collar', look: 'gold' },
      { id: 'neck-rainbow', name: 'Rainbow Bandana', slot: 'neck', look: 'rainbow' },
      { id: 'bed-royal', name: 'Royal Dog Bed', slot: 'bed', look: 'royal' },
    ],
  },
];

// What every dog starts with (these are always yours).
export const STARTER_LOOK = { collar: 'red', neck: null, hat: null, bed: 'red', house: 'red' };

// Things you can't buy, only earn.
export const EARNED_ITEMS = [{ id: 'hat-feather', name: 'Feather Cap', slot: 'hat', look: 'feather' }];

export const ALL_ITEMS = [...SHELVES.flatMap((shelf) => shelf.items), ...EARNED_ITEMS];

export function getItem(id) {
  return ALL_ITEMS.find((item) => item.id === id) ?? null;
}

export function isShelfOpen(shelf, treats) {
  return treats >= shelf.treats;
}

// The next shelf that isn't open yet, or null when they all are.
export function nextShelf(treats) {
  return SHELVES.find((shelf) => !isShelfOpen(shelf, treats)) ?? null;
}

// Things you could pick today: on an open shelf and not yours yet.
export function choicesFor(treats, owned) {
  return SHELVES.filter((shelf) => isShelfOpen(shelf, treats)).flatMap((shelf) => shelf.items.filter((item) => !owned.includes(item.id)));
}
