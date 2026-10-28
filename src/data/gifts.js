// Presents Farmer Hazel orders by mail. Mo the mail carrier brings one
// every few days (see src/data/events.js), in this order. Each one makes
// a job a little easier for the rest of the game.
//
// `perk` multiplies one of the dog's abilities:
//   catchDistance  how close you must be to catch the ball as it lands
//   runSpeed       running speed
//   scentRange     how far away you can smell buried things
//   herdRadius     how far away sheep notice you
//   light          how much you can see around you at night
//   barkRadius     how far your bark reaches
//   digTime        how long digging takes (smaller is faster)
// and `sparkle: true` makes hidden things twinkle when you're close.

export const GIFTS = [
  { id: 'squeakyBall', name: 'Squeaky Ball', about: 'Catching the ball in the air is easier.', perk: { catchDistance: 1.6 } },
  { id: 'zoomyBooties', name: 'Zoomy Booties', about: 'You run faster.', perk: { runSpeed: 1.15 } },
  { id: 'superSniffer', name: 'Super Sniffer', about: 'You smell buried things from farther away.', perk: { scentRange: 1.6 } },
  { id: 'herdingBell', name: 'Herding Bell', about: 'Sheep notice you from farther away.', perk: { herdRadius: 1.2 } },
  { id: 'magnifyingGlass', name: 'Magnifying Glass', about: 'Hidden things sparkle when you get close.', perk: { sparkle: true } },
  { id: 'glowTag', name: 'Glow Tag', about: 'You can see farther at night.', perk: { light: 1.5 } },
  { id: 'barkBooster', name: 'Bark Booster', about: 'Your bark reaches farther.', perk: { barkRadius: 1.25 } },
  { id: 'diggingMitts', name: 'Digging Mitts', about: 'You dig twice as fast.', perk: { digTime: 0.5 } },
];

const BASE = { catchDistance: 1, runSpeed: 1, scentRange: 1, herdRadius: 1, light: 1, barkRadius: 1, digTime: 1, sparkle: false };

export function getGift(id) {
  return GIFTS.find((g) => g.id === id) ?? null;
}

// The next present to send, or null once every one has arrived.
export function nextGift(owned) {
  return GIFTS.find((g) => !owned.includes(g.id)) ?? null;
}

// All the dog's abilities, with every present it owns applied.
export function perksFor(owned) {
  const perks = { ...BASE };
  for (const id of owned) {
    const perk = getGift(id)?.perk ?? {};
    for (const [key, value] of Object.entries(perk)) {
      perks[key] = typeof value === 'boolean' ? perks[key] || value : perks[key] * value;
    }
  }
  return perks;
}
