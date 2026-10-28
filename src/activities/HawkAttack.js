// An afternoon visitor: a hawk circling over the hens. Each time it swoops,
// bark (or pounce) while it's low to scare it off. After a few frights it
// gives up and flies away.

import { TILE } from '../config.js';
import { AREAS } from '../world/farmMap.js';
import { Hawk } from '../entities/Hawk.js';
import { sfx } from '../systems/sfx.js';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export class HawkAttack {
  constructor(scene) {
    this.scene = scene;
    this.hawk = null;
    this.arriveIn = null;
  }

  start() {
    this.arriveIn = 2.5;
  }

  // The afternoon is over: off it goes.
  stop() {
    this.arriveIn = null;
    this.hawk?.leave();
  }

  get pointer() {
    const hawk = this.hawk;
    return hawk && ['warn', 'dive'].includes(hawk.state) ? hawk.ground : null;
  }

  hearBark(bark) {
    const hawk = this.hawk;
    if (!hawk || distance(hawk.ground, bark) > bark.radius) return;
    if (!hawk.scare() && ['circle', 'warn', 'arrive'].includes(hawk.state)) {
      this.scene.hintOnce('hawk-high', 'The hawk is too high up to hear you. Wait until it swoops down low, then bark!');
    }
  }

  update(dt) {
    const { scene } = this;
    if (this.arriveIn !== null) {
      this.arriveIn -= dt;
      if (this.arriveIn <= 0) {
        this.arriveIn = null;
        const yard = AREAS.coopYard;
        this.hawk = new Hawk(scene, { x: (yard.x + yard.w / 2) * TILE, y: (yard.y + yard.h / 2) * TILE });
        sfx.screech();
        scene.hud.toast('A hawk is circling over the coop! When it swoops down at a hen, bark to scare it off.', 'warn');
      }
    }
    const hawk = this.hawk;
    if (!hawk) return;
    hawk.update(dt, { hens: scene.chickens });
    const dog = scene.dog;
    if (dog.mode === 'pounce' && hawk.low && distance(dog.feet, hawk.ground) < 18) hawk.scare();

    for (const event of hawk.events.splice(0)) {
      if (event === 'warn') {
        sfx.screech();
        scene.hud.bubble(hawk.target, 'Bawk?', 1, 16);
      } else if (event === 'swooped') {
        const hen = hawk.target;
        if (hen) {
          hen.scare(hawk.ground);
          scene.hud.bubble(hen, 'BAWK!', 1.2, 16);
        }
        sfx.flap();
        sfx.cluck();
        scene.hintOnce('hawk-missed', 'Phew, the hen is fine, just ruffled. Bark when the hawk swoops low!');
      } else if (event === 'scared') {
        sfx.screech();
        scene.hud.bubble(dog, 'Woof! Shoo!', 1, 18);
        scene.save.stats.hawksScared += 1;
        scene.progressTask('hawk', 1);
        if (!scene.tasks.isActive('hawk')) hawk.leave();
      }
    }
    if (hawk.done) {
      hawk.destroy();
      this.hawk = null;
    }
  }
}
