// Farmer Hazel follows a daily routine: porch in the morning, tending the
// crops all day, back to the porch in the evening, then inside at night.

import { TILE } from '../config.js';
import { AREAS, POINTS } from '../world/farmMap.js';
import { normalize } from '../systems/steering.js';

const SPEED = 38;
const FIELD_ENTRY = { x: AREAS.field.x * TILE - 6, y: (AREAS.field.y + AREAS.field.h) * TILE + 6 };

function activityAt(minutes) {
  if (minutes < 8 * 60 + 30) return 'porch';
  if (minutes < 17 * 60) return 'field';
  if (minutes < 19 * 60 + 45) return 'porch';
  return 'inside';
}

function randomFieldSpot() {
  const f = AREAS.field;
  return {
    x: (f.x + 0.5 + Math.random() * (f.w - 1)) * TILE,
    y: (f.y + 1 + Math.random() * (f.h - 1)) * TILE,
  };
}

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

  planRoute(activity) {
    const inField = this.x > AREAS.field.x * TILE - 8 && this.y < (AREAS.field.y + AREAS.field.h) * TILE + 2;
    if (activity === 'porch') this.route = inField ? [FIELD_ENTRY, POINTS.farmerPorch] : [POINTS.farmerPorch];
    else if (activity === 'field') this.route = inField ? [randomFieldSpot()] : [FIELD_ENTRY, randomFieldSpot()];
    else if (activity === 'inside') this.route = inField ? [FIELD_ENTRY, POINTS.houseDoor] : [POINTS.houseDoor];
  }

  update(dt, minutes, dog) {
    if (this.inside) return;
    const activity = activityAt(minutes);
    if (activity !== this.activity) {
      this.activity = activity;
      this.planRoute(activity);
      this.wait = 0;
    }

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
    } else {
      // Standing still: watch the dog when it's close, otherwise tend the crops.
      const dogDist = Math.hypot(dog.x - this.x, dog.y - this.y);
      if (dogDist < 48) this.faceToward(dog);
      else if (this.activity === 'field') this.face('up');
      else this.face('down');
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
