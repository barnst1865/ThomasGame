// Farmer Hazel. The farm scene tells her what she's doing (see `farmer` in
// src/data/day.js) and she walks there: the field, the yard for fetch, the
// porch, dinner on the porch, or inside for the night.

import { TILE } from '../config.js';
import { AREAS, POINTS } from '../world/farmMap.js';
import { normalize } from '../systems/steering.js';

const SPEED = 42;
const FIELD_ENTRY = { x: AREAS.field.x * TILE - 6, y: (AREAS.field.y + AREAS.field.h) * TILE + 6 };

function randomFieldSpot() {
  const f = AREAS.field;
  return {
    x: (f.x + 0.5 + Math.random() * (f.w - 1)) * TILE,
    y: (f.y + 1 + Math.random() * (f.h - 1)) * TILE,
  };
}

const DESTINATIONS = {
  field: () => randomFieldSpot(),
  yard: () => POINTS.fetchSpot,
  porch: () => POINTS.farmerPorch,
  dinner: () => POINTS.dinnerFarmer,
  inside: () => POINTS.houseDoor,
};

export class Farmer extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'farmer', 'down-stand');
    scene.add.existing(this);
    this.setOrigin(0.5, 1);
    this.shadow = scene.add.image(x, y, 'shadow');
    this.activity = null;
    this.route = [];
    this.wait = 0;
    this.facing = 'down';
    this.talking = false;
    this.inside = false;
  }

  get feet() {
    return { x: this.x, y: this.y - 3 };
  }

  get available() {
    return !this.inside && this.visible;
  }

  // True once she has reached where she's going.
  get arrived() {
    return this.route.length === 0;
  }

  setActivity(activity) {
    if (activity === this.activity) return;
    this.activity = activity;
    this.wait = 0;
    const inField = this.x > AREAS.field.x * TILE - 8 && this.y < (AREAS.field.y + AREAS.field.h) * TILE + 2;
    const goingToField = activity === 'field';
    const destination = DESTINATIONS[activity]();
    this.route = inField !== goingToField ? [FIELD_ENTRY, destination] : [destination];
  }

  goInside() {
    this.inside = true;
    this.setVisible(false);
    this.shadow.setVisible(false);
  }

  face(dir) {
    this.facing = dir;
    const view = dir === 'left' || dir === 'right' ? 'side' : dir;
    this.setFlipX(dir === 'left');
    this.anims.stop();
    this.setFrame(`${view}-stand`);
  }

  faceToward(point) {
    const dx = point.x - this.x;
    const dy = point.y - this.y;
    if (Math.abs(dx) > Math.abs(dy)) this.face(dx > 0 ? 'right' : 'left');
    else this.face(dy > 0 ? 'down' : 'up');
  }

  // A little hop while throwing the ball.
  throwToward(point) {
    this.faceToward(point);
    this.scene.tweens.add({ targets: this, y: this.y - 3, yoyo: true, duration: 90 });
  }

  update(dt, dog) {
    if (this.inside) return;

    if (this.talking) {
      this.faceToward(dog);
    } else if (this.route.length > 0) {
      const next = this.route[0];
      const dx = next.x - this.x;
      const dy = next.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 2) {
        this.route.shift();
        if (this.route.length === 0) {
          if (this.activity === 'inside') this.goInside();
          else this.wait = 4 + Math.random() * 5;
        }
      } else {
        const dir = normalize(dx, dy);
        const step = Math.min(dist, SPEED * dt);
        this.x += dir.x * step;
        this.y += dir.y * step;
        const view = Math.abs(dx) > Math.abs(dy) ? 'side' : dy > 0 ? 'down' : 'up';
        this.facing = view === 'side' ? (dx > 0 ? 'right' : 'left') : view;
        this.setFlipX(this.facing === 'left');
        this.anims.play(`farmer-walk-${view}`, true);
      }
    } else if (this.activity === 'dinner') {
      this.face('down');
    } else {
      // Standing still: watch the dog when it's close, otherwise get on with work.
      const dogDist = Math.hypot(dog.x - this.x, dog.y - this.y);
      if (dogDist < 56 || this.activity === 'yard') this.faceToward(dog);
      else this.face(this.activity === 'field' ? 'up' : 'down');
      if (this.activity === 'field') {
        this.wait -= dt;
        if (this.wait <= 0) this.route = [randomFieldSpot()];
      }
    }

    this.setDepth(this.y);
    this.shadow.setPosition(this.x, this.y - 1).setDepth(this.y - 0.5);
  }

  destroy(fromScene) {
    this.shadow?.destroy();
    super.destroy(fromScene);
  }
}
