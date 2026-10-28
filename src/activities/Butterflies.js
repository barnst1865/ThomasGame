// A fun break: butterflies in the garden. Pounce to catch them (and let
// them go again). New ones keep fluttering in until enough are caught.

import { TILE } from '../config.js';
import { AREAS } from '../world/farmMap.js';
import { Butterfly } from '../entities/Butterfly.js';
import { LINES, fill, pick } from '../data/dialogue.js';
import { sfx } from '../systems/sfx.js';

const AT_ONCE = 4;
const CATCH_DISTANCE = 12;

export class Butterflies {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.flock = [];
    const f = AREAS.fetchField;
    this.area = { x: f.x * TILE + 8, y: f.y * TILE + 8, w: f.w * TILE - 16, h: f.h * TILE - 8 };
  }

  start() {
    this.active = true;
    for (let i = 0; i < AT_ONCE; i++) this.spawn(true);
    this.scene.hintOnce('butterflies', 'Get close and pounce to catch a butterfly!');
  }

  spawn(inside = false) {
    const a = this.area;
    // New ones flutter in from the edge of the garden.
    const x = inside ? a.x + Math.random() * a.w : Math.random() < 0.5 ? a.x : a.x + a.w;
    const y = a.y + Math.random() * a.h;
    this.flock.push(new Butterfly(this.scene, x, y, a));
  }

  stop() {
    this.active = false;
    for (const b of this.flock) if (!b.caught) b.catchBy({ x: b.ground.x, y: b.ground.y });
  }

  update(dt) {
    const { scene } = this;
    const dog = scene.dog;
    for (const b of this.flock) {
      b.update(dt, dog);
      if (!this.active || b.caught || dog.mode !== 'pounce') continue;
      const nose = dog.ahead(4);
      if (Math.hypot(nose.x - b.ground.x, nose.y - b.ground.y) < CATCH_DISTANCE) this.caught(b);
    }
    this.flock = this.flock.filter((b) => {
      if (b.done) b.destroy();
      return !b.done;
    });
    if (this.active && this.flock.filter((b) => !b.caught).length < AT_ONCE) this.spawn();
  }

  caught(b) {
    const { scene } = this;
    b.catchBy(scene.dog);
    sfx.chime();
    scene.save.stats.butterfliesCaught += 1;
    scene.hud.bubble(scene.dog, pick(['Got one!', 'Gotcha!', 'Boop!']), 1, 18);
    scene.progressTask('butterflies', 1);
    if (!scene.tasks.isActive('butterflies')) {
      this.stop();
      scene.hud.bubble(scene.farmer, fill(LINES.butterfliesDone, scene.save.dog.name), 2.6, 26);
    }
  }
}
