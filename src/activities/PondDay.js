// Pond day: the dog may swim! Farmer Hazel throws sticks into the pond
// (see Fetch.js), and afterwards the dog shakes off right next to her.
// Once the pond is open, the dog can swim for the rest of the day.

import { TILE } from '../config.js';
import { T, tileAt } from '../world/farmMap.js';
import { FARMER_NAME, LINES, fill, pick } from '../data/dialogue.js';
import { sfx } from '../systems/sfx.js';

const WET_TIME = 25; // seconds the dog stays dripping after a swim

export class PondDay {
  constructor(scene) {
    this.scene = scene;
    this.open = false;
    this.drip = 0;
  }

  start() {
    this.open = true;
  }

  isWater(x, y) {
    return tileAt(this.scene.tiles, Math.floor(x / TILE), Math.floor(y / TILE)) === T.WATER;
  }

  // A ring of ripples where something hits the water.
  splash(x, y) {
    const { scene } = this;
    const ring = scene.add.image(x, y, 'ripple').setDepth(y + 1).setScale(0.5);
    scene.tweens.add({ targets: ring, scale: 1.6, alpha: 0, duration: 600, onComplete: () => ring.destroy() });
    this.droplets(x, y - 2, 5, 0x9fd3e6);
    sfx.splash();
  }

  droplets(x, y, count, color) {
    const { scene } = this;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = 8 + Math.random() * 14;
      const bit = scene.add.image(x, y, 'pixel').setTint(color).setDepth(y + 30);
      scene.tweens.add({
        targets: bit,
        x: x + Math.cos(a) * d,
        y: y + Math.sin(a) * d * 0.6 - 4,
        alpha: 0,
        duration: 420,
        ease: 'Quad.Out',
        onComplete: () => bit.destroy(),
      });
    }
  }

  // Shake off next to Farmer Hazel (that's the job).
  interaction(farmerNear) {
    const { scene } = this;
    const dog = scene.dog;
    if (!farmerNear || dog.wet <= 0 || dog.swimming || !scene.tasks.isActive('shakeOff')) return null;
    return { label: 'Shake off!', action: () => this.shakeOff() };
  }

  shakeOff() {
    const { scene } = this;
    const dog = scene.dog;
    dog.wet = 0;
    dog.setVelocity(0, 0);
    dog.setMode('shake', 0.7);
    scene.tweens.add({ targets: dog, scaleX: 1.25, duration: 50, yoyo: true, repeat: 6 });
    sfx.shake();
    for (let i = 0; i < 4; i++) scene.time.delayedCall(i * 120, () => this.droplets(dog.x, dog.y - 8, 6, 0x9fd3e6));
    scene.time.delayedCall(350, () => {
      const farmer = scene.farmer;
      scene.tweens.add({ targets: farmer, y: farmer.y - 4, yoyo: true, duration: 90 });
      scene.hud.bubble(farmer, fill(pick(LINES.shakeOff), scene.save.dog.name), 2.6, 26);
      scene.progressTask('shakeOff', 1);
    });
  }

  update(dt) {
    if (!this.open) return;
    const { scene } = this;
    const dog = scene.dog;
    const inWater = dog.mode !== 'sleep' && this.isWater(dog.feet.x, dog.feet.y);
    if (inWater && !dog.swimming) {
      this.splash(dog.x, dog.y - 4);
      scene.hintOnce('swim', 'Splash! You can swim in the pond today.');
    }
    if (!inWater && dog.swimming && scene.tasks.isActive('shakeOff')) {
      scene.hintOnce('wet', `You're dripping wet! Shake off right next to ${FARMER_NAME}. She'll love it... probably.`);
    }
    dog.setSwimming(inWater);
    if (inWater) {
      dog.wet = WET_TIME;
      return;
    }
    if (dog.wet <= 0) return;
    dog.wet -= dt;
    this.drip -= dt;
    if (this.drip <= 0) {
      this.drip = 0.18;
      const bit = scene.add.image(dog.x + (Math.random() - 0.5) * 10, dog.y - 6, 'pixel').setTint(0x9fd3e6).setDepth(dog.depth + 1);
      scene.tweens.add({ targets: bit, y: bit.y + 6, alpha: 0, duration: 400, onComplete: () => bit.destroy() });
    }
  }
}
