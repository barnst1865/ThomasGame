// Dog breeds the player can choose from.
//
// To add a new breed, copy one of the entries below and change it:
//   - id:      a unique lowercase name with dashes (used in save files)
//   - ears:    'pointy' or 'floppy'
//   - tail:    'long', 'fluffy' or 'none'
//   - coats:   one or more color options. Each palette colors a part of the
//              dog sprite (see src/art/sprites.js). Any color you leave out
//              falls back to `coat`.
//   - stats:   multipliers on the base numbers in src/config.js (1 = normal)
//   - barkPitch: how high the bark sounds (1 = normal, bigger = higher)
//   - perk:    a short sentence telling the player what is special
// Nothing else needs to change. The breed shows up on the "Choose your dog"
// screen automatically.

export const BREEDS = [
  {
    id: 'cattle-dog',
    name: 'Australian Cattle Dog',
    blurb: 'Tough, clever and never tired. Born to boss the herd around.',
    perk: 'Fearless: pounces hit threats twice as hard.',
    defaultName: 'Ranger',
    barkPitch: 1,
    ears: 'pointy',
    tail: 'long',
    coats: [
      {
        id: 'blue',
        name: 'Blue',
        palette: {
          outline: '#23232c',
          coat: '#6f8199',
          shade: '#4d5a70',
          head: '#46506a',
          muzzle: '#c98a4b',
          chest: '#a3afc0',
          legs: '#c98a4b',
          ear: '#3b4357',
          earInner: '#c98a4b',
          tailTip: '#3b4357',
        },
        speckle: { color: '#b7c2d2', chance: 0.28 },
      },
      {
        id: 'red',
        name: 'Red',
        palette: {
          outline: '#2c1d1a',
          coat: '#b0674a',
          shade: '#874a34',
          head: '#8e4b33',
          muzzle: '#e3c3a3',
          chest: '#ddb497',
          legs: '#d9a47a',
          ear: '#7a3f2b',
          earInner: '#e3a98a',
          tailTip: '#7a3f2b',
        },
        speckle: { color: '#e2b8a0', chance: 0.28 },
      },
    ],
    stats: { speed: 1, herdRadius: 1, barkRadius: 1, pounceDamage: 2, carrySpeed: 1 },
  },
  {
    id: 'border-collie',
    name: 'Border Collie',
    blurb: 'The smartest dog on the farm. Sheep listen to a collie.',
    perk: 'Herding Eye: sheep notice you from farther away.',
    defaultName: 'Skye',
    barkPitch: 1.08,
    ears: 'floppy',
    tail: 'fluffy',
    coats: [
      {
        id: 'black-white',
        name: 'Black & White',
        palette: {
          outline: '#121117',
          coat: '#2e2d36',
          shade: '#1f1e25',
          head: '#2e2d36',
          muzzle: '#f2efe8',
          chest: '#f2efe8',
          legs: '#f2efe8',
          ear: '#26252d',
          earInner: '#4a4854',
          tailTip: '#f2efe8',
        },
      },
      {
        id: 'red-white',
        name: 'Red & White',
        palette: {
          outline: '#2a1812',
          coat: '#9a5536',
          shade: '#753f27',
          head: '#9a5536',
          muzzle: '#f4eee4',
          chest: '#f4eee4',
          legs: '#f4eee4',
          ear: '#83472d',
          earInner: '#b8735a',
          tailTip: '#f4eee4',
        },
      },
    ],
    stats: { speed: 1, herdRadius: 1.35, barkRadius: 1, pounceDamage: 1, carrySpeed: 1 },
  },
  {
    id: 'golden-retriever',
    name: 'Golden Retriever',
    blurb: 'Sunny, gentle and fluffy. Would fetch all day if you let it.',
    perk: 'Soft Mouth: runs faster while carrying things.',
    defaultName: 'Honey',
    barkPitch: 0.88,
    ears: 'floppy',
    tail: 'fluffy',
    coats: [
      {
        id: 'golden',
        name: 'Golden',
        palette: {
          outline: '#3a2414',
          coat: '#dba253',
          shade: '#b77f36',
          head: '#e0ad62',
          muzzle: '#f0cf91',
          chest: '#ecc37c',
          legs: '#d39a4c',
          ear: '#c48a3e',
          earInner: '#b07733',
          tailTip: '#f0cf91',
        },
      },
      {
        id: 'cream',
        name: 'Cream',
        palette: {
          outline: '#3d2c1d',
          coat: '#ecd3a4',
          shade: '#cfb07c',
          head: '#f0dab0',
          muzzle: '#faf0d9',
          chest: '#f7e7c5',
          legs: '#e6c995',
          ear: '#dcbb84',
          earInner: '#cba86f',
          tailTip: '#faf0d9',
        },
      },
    ],
    stats: { speed: 1, herdRadius: 1, barkRadius: 1, pounceDamage: 1, carrySpeed: 1.3 },
  },
  {
    id: 'corgi',
    name: 'Corgi',
    blurb: 'Short legs, huge heart. Corgis were bred to herd cattle!',
    perk: 'Big Bark: barks reach much farther.',
    defaultName: 'Waffles',
    barkPitch: 1.25,
    ears: 'pointy',
    tail: 'none',
    coats: [
      {
        id: 'red',
        name: 'Red & White',
        palette: {
          outline: '#2f1a10',
          coat: '#d27b3b',
          shade: '#a95e2a',
          head: '#d27b3b',
          muzzle: '#f7efe3',
          chest: '#f7efe3',
          legs: '#f7efe3',
          ear: '#c46c2f',
          earInner: '#f0b49a',
        },
      },
      {
        id: 'tricolor',
        name: 'Tricolor',
        palette: {
          outline: '#141218',
          coat: '#2f2c35',
          shade: '#211f26',
          head: '#c97b3e',
          muzzle: '#f7efe3',
          chest: '#f7efe3',
          legs: '#f7efe3',
          ear: '#2f2c35',
          earInner: '#c97b3e',
        },
      },
    ],
    stats: { speed: 1, herdRadius: 1, barkRadius: 1.5, pounceDamage: 1, carrySpeed: 1 },
  },
];

export function getBreed(id) {
  return BREEDS.find((b) => b.id === id) ?? BREEDS[0];
}

export function getCoat(breed, coatId) {
  return breed.coats.find((c) => c.id === coatId) ?? breed.coats[0];
}
