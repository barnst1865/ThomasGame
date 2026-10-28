// Farmer Hazel lost something (her hat, a glove or the gate key). It's
// buried somewhere around the yard. Little puffs of scent rise from the
// spot when the dog is close; dig there, then bring it back to her.

import { TILE } from '../config.js';
import { AREAS, POINTS, openTilesIn } from '../world/farmMap.js';
import { createRng } from '../systems/rng.js';
import { FARMER_NAME, LINES, fill } from '../data/dialogue.js';
import { sfx } from '../systems/sfx.js';

export const LOST_THINGS = ['hat', 'glove', 'key'];
const SCENT_RANGE = 130;

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// A wavy line of scent rising from something buried at `center`.
export function scentPuff(scene, center) {
  const puff = scene.add
    .image(center.x + (Math.random() - 0.5) * 8, center.y - 2, 'scent')
    .setOrigin(0.5, 1)
    .setAlpha(0)
    .setDepth(center.y + 20);
  scene.tweens.add({ targets: puff, y: center.y - 16 - Math.random() * 6, duration: 1300, ease: 'Sine.Out', onComplete: () => puff.destroy() });
  scene.tweens.add({ targets: puff, alpha: 0.95, duration: 300, yoyo: true, hold: 500 });
}

// A quick twinkle (with the magnifying glass, hidden things sparkle).
export function twinkle(scene, center) {
  const s = scene.add.image(center.x + (Math.random() - 0.5) * 10, center.y - Math.random() * 6, 'sparkle').setDepth(center.y + 21);
  scene.tweens.add({ targets: s, scale: 0, angle: 90, duration: 600, onComplete: () => s.destroy() });
}

// Which thing goes missing on a given day (the same every time you play it).
export function lostThingFor(day) {
  return LOST_THINGS[createRng(day * 31 + 5).int(0, LOST_THINGS.length - 1)];
}

export class LostThing {
  constructor(scene) {
    this.scene = scene;
    this.kind = lostThingFor(scene.save.day);
    this.spot = null;
    this.item = null;
    this.puffTimer = 0;
    this.noticed = false;
  }

  get title() {
    return `Find ${FARMER_NAME}'s ${this.kind}`;
  }

  start() {
    const { scene } = this;
    const buried = new Set(scene.save.buried.map((b) => `${b.tx},${b.ty}`));
    const spots = openTilesIn(scene.tiles, AREAS.lostThings, { diggableOnly: true }).filter((t) => {
      const center = { x: t.x * TILE + 8, y: t.y * TILE + 8 };
      return !buried.has(`${t.x},${t.y}`) && distance(center, POINTS.dogWake) > 90;
    });
    this.spot = spots[Math.floor(Math.random() * spots.length)];
  }

  get searching() {
    return Boolean(this.spot) && !this.item && this.scene.tasks.isActive('lostThing');
  }

  // Digging on the spot (or right next to it) finds it.
  digFinds(tx, ty) {
    return this.searching && Math.abs(tx - this.spot.x) <= 1 && Math.abs(ty - this.spot.y) <= 1;
  }

  found(tx, ty) {
    const { scene } = this;
    const dog = scene.dog;
    this.item = scene.spawnItem(this.kind, tx * TILE + 8, ty * TILE + 12);
    this.item.lostThing = true;
    if (!dog.carrying) dog.carry(this.item);
    sfx.chime();
    scene.addHole(tx, ty);
    scene.hud.bubble(dog, `${FARMER_NAME}'s ${this.kind}!`, 1.8, 18);
    scene.hintOnce('lost-found', `You found it! Bring the ${this.kind} back to ${FARMER_NAME}.`);
  }

  owns(item) {
    return item && item === this.item;
  }

  giveBack() {
    const { scene } = this;
    const item = scene.dog.carrying;
    scene.dog.carrying = null;
    scene.removeItem(item);
    sfx.pickup();
    scene.hud.bubble(scene.farmer, fill(LINES.lostThanks[this.kind], scene.save.dog.name), 2.6, 26);
    scene.progressTask('lostThing', 1);
  }

  get giveLabel() {
    return `Give the ${this.kind} to ${FARMER_NAME}`;
  }

  update(dt) {
    if (!this.searching) return;
    const { scene } = this;
    const dog = scene.dog;
    const center = { x: this.spot.x * TILE + 8, y: this.spot.y * TILE + 10 };
    const d = distance(dog.feet, center);
    const range = SCENT_RANGE * scene.perks.scentRange;
    if (d > range) return;
    // With the magnifying glass, the spot twinkles when you're close.
    this.twinkle = (this.twinkle ?? 0) - dt;
    if (scene.perks.sparkle && d < 48 && this.twinkle <= 0) {
      this.twinkle = 0.5;
      twinkle(scene, center);
    }
    if (!this.noticed) {
      this.noticed = true;
      scene.hud.bubble(dog, 'Sniff sniff...', 1.4, 18);
      scene.hintOnce('scent', `Something smells like ${FARMER_NAME}! Follow the little puffs of scent and dig where they rise.`);
    }
    // Puffs come faster the closer the dog gets.
    this.puffTimer -= dt;
    if (this.puffTimer > 0) return;
    this.puffTimer = 0.25 + (d / range) * 1.1;
    scentPuff(scene, center);
  }
}
