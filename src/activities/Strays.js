// Animals that wander off: a runaway hen in the morning, or a lost lamb
// from next door in the afternoon. Find them and herd them home.

import { TILE } from '../config.js';
import { AREAS, STRAY_SPOTS } from '../world/farmMap.js';
import { Sheep } from '../entities/Sheep.js';
import { insideRect } from '../systems/steering.js';
import { sfx } from '../systems/sfx.js';

const FOUND_DISTANCE = 56;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const pickSpot = (list) => list[Math.floor(Math.random() * list.length)];

export class RunawayHen {
  constructor(scene) {
    this.scene = scene;
    this.hen = null;
    this.found = false;
  }

  start() {
    const { scene } = this;
    const yard = AREAS.coopYard;
    const home = { x: (yard.x + yard.w / 2) * TILE, y: (yard.y + yard.h / 2) * TILE };
    const spot = pickSpot(STRAY_SPOTS.hen);
    this.hen = scene.chickens[scene.chickens.length - 1];
    this.hen.runAway(spot.x, spot.y, home);
  }

  // The HUD points at her while she's off screen.
  get pointer() {
    return this.hen && this.hen.state === 'stray' && this.scene.tasks.isActive('runawayHen') ? this.hen : null;
  }

  update() {
    const { scene, hen } = this;
    if (!hen || hen.state !== 'stray') return;
    if (!this.found && distance(scene.dog.feet, hen.feet) < FOUND_DISTANCE) {
      this.found = true;
      sfx.cluck();
      scene.hud.bubble(hen, 'Bawk?!', 1.2, 16);
      scene.hintOnce('hen-found', 'There she is! Get on the far side of the hen and shoo her back to the coop yard.');
    }
    if (insideRect(hen.feet, scene.yardRect)) {
      hen.settle();
      sfx.cluck();
      scene.hud.bubble(hen, 'Bawk!', 1.2, 16);
      scene.progressTask('runawayHen', 1);
    }
  }
}

export class LostLamb {
  constructor(scene) {
    this.scene = scene;
    this.lamb = null;
    this.found = false;
  }

  start() {
    const { scene } = this;
    const spot = pickSpot(STRAY_SPOTS.lamb);
    const lamb = new Sheep(scene, spot.x, spot.y, { lamb: true });
    scene.sheepGroup.add(lamb);
    lamb.setupBody();
    lamb.state = 'grazing';
    lamb.roam = { x: spot.x - 40, y: spot.y - 36, w: 80, h: 48 };
    scene.sheep.push(lamb);
    this.lamb = lamb;
    this.bleat = 3;
  }

  get pointer() {
    return this.lamb && this.lamb.state !== 'penned' && this.scene.tasks.isActive('lostLamb') ? this.lamb : null;
  }

  update(dt) {
    const { scene, lamb } = this;
    if (!lamb || lamb.state === 'penned') return;
    if (!this.found) {
      // A little "baa" now and then so you can tell it's out there.
      this.bleat -= dt;
      if (this.bleat <= 0) {
        this.bleat = 5 + Math.random() * 3;
        sfx.baa();
        scene.hud.bubble(lamb, 'Meh-eh!', 1, 14);
      }
      if (distance(scene.dog.feet, lamb.feet) < FOUND_DISTANCE) {
        this.found = true;
        lamb.roam = null;
        scene.hintOnce('lamb-found', 'Found the lamb! Herd it home to the pen with the other sheep.');
      }
    }
  }
}
