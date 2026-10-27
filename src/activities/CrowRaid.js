// The afternoon crow raid: crows land on the crops a couple at a time
// until the dog has chased enough of them away.

import { CROWS, TILE } from '../config.js';
import { AREAS } from '../world/farmMap.js';
import { Crow } from '../entities/Crow.js';
import { sfx } from '../systems/sfx.js';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export class CrowRaid {
  constructor(scene) {
    this.scene = scene;
    this.crows = [];
    this.spawned = 0;
    this.active = false;
    this.nextSpawn = 0;
    const f = AREAS.field;
    this.field = { x: f.x * TILE + 8, y: f.y * TILE + 12, w: f.w * TILE - 16, h: f.h * TILE - 16 };
  }

  start() {
    this.active = true;
    this.nextSpawn = 1;
  }

  // A random spot on the crops, nudged in the `away` direction if given.
  findSpot(crow, away) {
    const f = this.field;
    for (let i = 0; i < 12; i++) {
      const spot = { x: f.x + Math.random() * f.w, y: f.y + Math.random() * f.h };
      if (!away || !crow) return spot;
      const dx = spot.x - crow.x;
      const dy = spot.y - crow.y;
      if (dx * away.x + dy * away.y > 20) return spot;
    }
    return { x: f.x + Math.random() * f.w, y: f.y + Math.random() * f.h };
  }

  spawnCrow() {
    this.spawned += 1;
    const land = this.findSpot();
    const side = Math.random() < 0.5 ? -1 : 1;
    const from = { x: land.x + side * 260, y: land.y - 180 };
    this.crows.push(new Crow(this.scene, from, land, (crow, away) => this.findSpot(crow, away)));
    sfx.caw();
    if (this.spawned === 1) this.scene.hud.toast('Crows are landing on the crops! Run at them or bark to chase them off.', 'warn');
  }

  // The afternoon is over: any crows still around fly home.
  shoo() {
    this.spawned = CROWS.total;
    for (const crow of this.crows) {
      if (crow.state !== 'leaving') {
        crow.leave(this.scene.dog);
        crow.events.length = 0;
      }
    }
  }

  // The dog barked: every crow in earshot gets a fright.
  hearBark(bark) {
    for (const crow of this.crows) {
      if (crow.state !== 'leaving' && distance(crow.feet, bark) < bark.radius) crow.startle(bark);
    }
  }

  update(dt) {
    if (!this.active) return;
    const { scene } = this;
    const dog = scene.dog;
    const visiting = this.crows.filter((c) => c.state !== 'leaving').length;
    if (this.spawned < CROWS.total && visiting < CROWS.atOnce) {
      this.nextSpawn -= dt;
      if (this.nextSpawn <= 0) {
        this.spawnCrow();
        this.nextSpawn = 2.2;
      }
    }
    for (const crow of this.crows) {
      crow.update(dt, dog);
      if (dog.mode === 'pounce' && crow.perched && distance(dog.feet, crow.feet) < 18) crow.leave(dog);
      for (const event of crow.events.splice(0)) {
        if (event === 'chased') {
          sfx.flap();
          sfx.caw();
          scene.save.stats.crowsChased += 1;
          scene.progressTask('chaseCrows', 1);
        } else if (event === 'caw') {
          sfx.caw();
        } else if (event === 'hop') {
          sfx.flap();
          scene.hud.bubble(crow, 'Caw?!', 0.8, 14);
        }
      }
    }
    this.crows = this.crows.filter((crow) => {
      if (crow.done) crow.destroy();
      return !crow.done;
    });
    if (this.spawned >= CROWS.total && this.crows.length === 0) this.active = false;
  }
}
