// Everything that happens after dark: prowlers sneaking in from the woods,
// mischief wisps luring hens out of the coop, and sometimes a friendly
// golden wisp that keeps the dog company. Who comes on which night is
// planned in src/data/nights.js.

import { DAY, DOG } from '../config.js';
import { POINTS, areaPx } from '../world/farmMap.js';
import { PROWLERS } from '../data/nights.js';
import { Prowler } from '../entities/Prowler.js';
import { Wisp } from '../entities/Wisp.js';
import { LINES, fill } from '../data/dialogue.js';
import { sfx } from '../systems/sfx.js';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const offMap = (p) => ({ x: p.x + 40, y: p.y });

// The way each prowler sneaks in, depending on what it's after.
const ROUTES = {
  coop: [POINTS.trailEnd, POINTS.coopPath, POINTS.coopDoor],
  basket: [POINTS.trailEnd, POINTS.porchPath, POINTS.porchStep, POINTS.basketSteal],
  pen: [POINTS.trailEnd, POINTS.meadowPath, POINTS.penGateOutside],
};

const GROWLS = { weasel: 'Hssss!', raccoon: 'Chitter!', coyote: 'Grrr!', wolf: 'GRRRR!' };
const WISP_STARTS = [
  { x: 760, y: 200 },
  { x: 760, y: 300 },
  { x: 700, y: 520 },
  { x: 620, y: 30 },
];
const WISP_GAP = 9; // seconds between mischief wisps

export class NightWatch {
  constructor(scene) {
    this.scene = scene;
    this.plan = null;
    this.clock = 0;
    this.queue = []; // { at, run } things still to happen tonight
    this.prowlers = [];
    this.wisps = [];
    this.friend = null;
  }

  start(plan) {
    this.plan = plan;
    let at = DAY.firstVisitor;
    for (const name of plan.threats) {
      this.later(at, () => this.spawnProwler(name, 1));
      at += 5;
    }
    if (plan.wisps > 0) {
      const first = plan.threats.length > 0 ? at + 10 : at;
      for (let i = 0; i < plan.wisps; i++) this.later(first + i * WISP_GAP, () => this.spawnWisp(i));
    }
    if (plan.friendly) this.spawnFriend();
  }

  later(delay, run) {
    this.queue.push({ at: this.clock + delay, run });
  }

  // ------------------------------------------------------------ visitors

  spawnProwler(name, visit) {
    const { scene } = this;
    const kind = PROWLERS[name];
    const path = ROUTES[kind.target];
    const exit = [...path.slice(1, -1).reverse(), path[0], offMap(path[0])];
    const prowler = new Prowler(scene, kind, path, exit);
    prowler.visit = visit;
    this.prowlers.push(prowler);
    if (kind.howl) {
      sfx.howl();
      scene.cameras.main.shake(400, 0.003);
    } else {
      sfx.hiss();
    }
    scene.hud.toast(visit > 1 ? kind.back : kind.arrive, 'warn');
  }

  spawnWisp(i) {
    const start = WISP_STARTS[i % WISP_STARTS.length];
    this.wisps.push(new Wisp(this.scene, 'mischief', start.x, start.y));
    sfx.giggle();
    if (i === 0) this.scene.hud.toast('A little green light is drifting toward the coop...', 'warn');
  }

  spawnFriend() {
    const bed = POINTS.dogBed;
    this.friend = new Wisp(this.scene, 'friendly', bed.x - 18, bed.y + 6);
  }

  // ------------------------------------------------------------ the dog

  // The golden wisp makes the dog's bark carry further.
  get barkBoost() {
    return this.friend?.state === 'follow' ? 1.5 : 1;
  }

  hearBark(bark) {
    const { scene } = this;
    for (const prowler of this.prowlers) {
      if (distance(bark, prowler.feet) < bark.radius && prowler.startle()) scene.hud.bubble(prowler, '?!', 1, prowler.tall);
    }
    for (const wisp of this.wisps) {
      if (distance(bark, wisp.ground) < bark.radius) this.popWisp(wisp);
    }
  }

  // Say hello to the golden wisp.
  interaction(p) {
    const friend = this.friend;
    if (!friend || friend.state !== 'waiting' || distance(friend.ground, p) > 24) return null;
    return { label: 'Say hello to the golden wisp', action: () => this.befriend() };
  }

  befriend() {
    const { scene } = this;
    const name = scene.save.dog.name;
    this.friend.befriend();
    sfx.twinkle();
    scene.floatIcon('heart', this.friend.x, this.friend.y - 8);
    if (scene.save.flags.metWisp) {
      scene.hud.toast(fill(LINES.wispAgain, name), 'good');
      return;
    }
    scene.save.flags.metWisp = true;
    scene.hud.dialogue(null, LINES.wispHello.map((l) => ({ speaker: null, text: fill(l, name) })));
  }

  // ------------------------------------------------------------ helpers

  // The most pressing trouble right now (for the HUD arrow and the golden wisp).
  get threats() {
    return [...this.prowlers.filter((p) => p.state !== 'flee'), ...this.wisps.filter((w) => !w.popped)];
  }

  nearestThreat() {
    const dog = this.scene.dog;
    let best = null;
    for (const t of this.threats) {
      const spot = t.feet;
      if (!best || distance(spot, dog.feet) < distance(best, dog.feet)) best = spot;
    }
    return best;
  }

  get lights() {
    return [...this.wisps, this.friend].filter(Boolean).map((w) => w.light).filter(Boolean);
  }

  // ------------------------------------------------------------ update

  update(dt) {
    if (!this.plan) return;
    this.clock += dt;
    const due = this.queue.filter((q) => q.at <= this.clock);
    this.queue = this.queue.filter((q) => q.at > this.clock);
    for (const q of due) q.run();

    this.updateProwlers(dt);
    this.updateWisps(dt);
  }

  updateProwlers(dt) {
    const { scene } = this;
    const dog = scene.dog;
    for (const prowler of this.prowlers) {
      const kind = prowler.kind;
      const route = ROUTES[kind.target];
      prowler.update(dt, { dog, target: route[route.length - 1] });

      if (dog.mode === 'pounce' && !dog.pounceHits.has(prowler) && distance(dog.feet, prowler.feet) < kind.hitRadius) {
        dog.pounceHits.add(prowler);
        if (prowler.hit(DOG.pounceDamage * scene.breed.stats.pounceDamage, dog.x, dog.y)) {
          sfx.hit();
          scene.cameras.main.shake(90, 0.004);
        }
      }

      for (const event of prowler.events.splice(0)) {
        if (event === 'noticed') {
          if (kind.howl) sfx.howl();
          else sfx.hiss();
          scene.hud.bubble(prowler, GROWLS[kind.name], 1.2, prowler.tall);
        } else if (event === 'bitDog') {
          dog.stun(prowler.x, prowler.y, kind.knockback);
          sfx.yelp();
          scene.hud.bubble(dog, 'Yip!', 0.9, 18);
          scene.hintOnce('lunge', 'Watch out for the lunge! Back away when you see the "!", then pounce.');
        } else if (event === 'defeated') {
          this.chased(prowler);
        } else if (event === 'stole') {
          this.stole(prowler);
        }
      }
    }
    this.prowlers = this.prowlers.filter((p) => {
      if (p.done) p.destroy();
      return !p.done;
    });
  }

  chased(prowler) {
    const { scene } = this;
    const kind = prowler.kind;
    const stat = `${kind.name}sChased`;
    scene.save.stats[stat] = (scene.save.stats[stat] ?? 0) + 1;
    scene.progressTask(kind.job, 1);
    if (prowler.visit < kind.visits) {
      scene.hud.toast(`The ${kind.name} ran off... for now.`);
      this.later(8, () => this.spawnProwler(kind.name, prowler.visit + 1));
    }
  }

  stole(prowler) {
    const { scene } = this;
    const kind = prowler.kind;
    scene.tasks.fail(kind.job);
    sfx.sad();
    scene.hud.toast(`${kind.stole} Better luck tomorrow night.`, 'warn');
    if (kind.target === 'basket') scene.emptyBasket();
    if (kind.target === 'pen') scene.frightenSheep(prowler);
  }

  updateWisps(dt) {
    const { scene } = this;
    const dog = scene.dog;
    const roam = areaPx({ x: 22, y: 10, w: 23, h: 20 });
    const door = POINTS.coopDoor;
    const threat = this.nearestThreat();
    for (const wisp of this.wisps) {
      wisp.update(dt, { dog, door, roam });
      if (dog.mode === 'pounce' && distance(dog.feet, wisp.ground) < 16) this.popWisp(wisp);
      for (const event of wisp.events.splice(0)) {
        if (event === 'giggle') {
          sfx.giggle();
          scene.hud.bubble(wisp, 'Hee hee!', 0.9, 14);
        } else if (event === 'lure') {
          const hen = scene.chickens.find((h) => h.state === 'inside');
          if (hen) {
            hen.followLure(wisp, door);
            wisp.hen = hen;
            sfx.cluck();
            scene.hud.bubble(hen, 'Bawk...?', 1.4, 16);
            scene.hintOnce('wisp', 'The green light lured a hen out of the coop! Bark to pop it and the hen will go back to bed.');
          }
        }
      }
    }
    this.wisps = this.wisps.filter((w) => {
      if (w.done) w.destroy();
      return !w.done;
    });
    this.friend?.update(dt, { dog, threat });
  }

  popWisp(wisp) {
    const { scene } = this;
    if (!wisp.pop()) return;
    sfx.pop();
    scene.save.stats.wispsPopped += 1;
    if (wisp.hen) {
      wisp.hen.goToBed(POINTS.coopDoor);
      scene.hud.bubble(wisp.hen, 'Bawk?', 1, 16);
    }
    scene.progressTask('popWisps', 1);
  }
}
