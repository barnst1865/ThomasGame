// Fetch with Farmer Hazel: she throws, the dog brings it back. On a fun
// break it's a ball in the yard; on pond day it's a stick into the pond.
// Catching the ball right as it lands earns a bonus treat.

import { FETCH, TILE } from '../config.js';
import { AREAS, T, openTilesIn, tileAt } from '../world/farmMap.js';
import { FARMER_NAME, LINES, fill, pick } from '../data/dialogue.js';
import { sfx } from '../systems/sfx.js';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Water tiles with water all around, so the stick lands well out in the pond.
function pondSpots(tiles) {
  const water = (x, y) => tileAt(tiles, x, y) === T.WATER;
  const spots = [];
  const { pond } = AREAS;
  for (let y = pond.y; y < pond.y + pond.h; y++) {
    for (let x = pond.x; x < pond.x + pond.w; x++) {
      if (water(x, y) && water(x + 1, y) && water(x - 1, y) && water(x, y + 1) && water(x, y - 1)) {
        spots.push({ x: x * TILE + 8, y: y * TILE + 10 });
      }
    }
  }
  return spots;
}

export class FetchGame {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.ball = null;
    this.wait = 0;
    this.catches = 0;
    this.modes = {
      ball: {
        kind: 'ball',
        job: 'fetch',
        spots: openTilesIn(scene.tiles, AREAS.fetchField).map((t) => ({ x: t.x * TILE + 8, y: t.y * TILE + 10 })),
        range: [56, 140],
        lines: { start: LINES.fetchStart, thanks: LINES.fetchThanks, done: LINES.fetchDone },
      },
      stick: {
        kind: 'stick',
        job: 'pondSticks',
        spots: pondSpots(scene.tiles),
        range: [36, 120],
        lines: { start: LINES.pondStart, thanks: LINES.pondThanks, done: LINES.pondDone },
      },
    };
    this.mode = this.modes.ball;
  }

  start(mode = 'ball') {
    this.mode = this.modes[mode];
    this.active = true;
    this.announced = false;
  }

  owns(item) {
    return item === this.ball;
  }

  // Break's over: the ball goes back in the farmer's pocket.
  putAway() {
    this.active = false;
    if (!this.ball) return;
    if (this.scene.dog.carrying === this.ball) this.scene.dog.carrying = null;
    this.scene.removeItem(this.ball);
    this.ball = null;
  }

  update(dt) {
    if (!this.active) return;
    const { farmer, hud } = this.scene;
    if (!farmer.arrived) return; // still walking out to the yard
    if (!this.announced) {
      this.announced = true;
      hud.bubble(farmer, this.mode.lines.start, 2.2, 26);
      this.wait = 1.6;
      return;
    }
    if (this.ball) return; // the ball is out there somewhere
    this.wait -= dt;
    if (this.wait <= 0) this.throwBall();
  }

  throwBall() {
    const { scene } = this;
    const farmer = scene.farmer;
    const { spots, range } = this.mode;
    const choices = spots.filter((s) => {
      const d = distance(s, farmer);
      return d > range[0] && d < range[1];
    });
    const target = Phaser.Utils.Array.GetRandom(choices.length ? choices : spots);
    farmer.throwToward(target);
    sfx.throw();

    const ball = scene.spawnItem(this.mode.kind, farmer.x, farmer.y - 14);
    ball.inFlight = true;
    this.ball = ball;
    const shadow = scene.add.image(farmer.x, farmer.y, 'shadow').setScale(0.6);
    const start = { x: farmer.x, y: farmer.y };
    const dist = distance(start, target);
    const height = 16 + dist * 0.25;
    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 550 + dist * 4,
      onUpdate: (tween) => {
        const t = tween.getValue();
        const gx = start.x + (target.x - start.x) * t;
        const gy = start.y + (target.y - start.y) * t;
        ball.setPosition(gx, gy - Math.sin(Math.PI * t) * height - 2).setDepth(9400);
        shadow.setPosition(gx, gy - 1).setDepth(gy - 0.5);
      },
      onComplete: () => {
        shadow.destroy();
        ball.inFlight = false;
        ball.setPosition(target.x, target.y).setDepth(target.y);
        this.landed(ball);
      },
    });
  }

  landed(ball) {
    const { scene } = this;
    const dog = scene.dog;
    const reach = FETCH.catchDistance * scene.perks.catchDistance;
    if (!dog.carrying && dog.mode === 'normal' && distance(dog.feet, ball) < reach) {
      dog.carry(ball);
      this.catches += 1;
      scene.save.stats.ballsCaught += 1;
      scene.giveTreats(1);
      sfx.chime();
      scene.hud.bubble(scene.farmer, pick(LINES.fetchCatch), 1.8, 26);
    } else if (scene.pond.isWater(ball.x, ball.y - 2)) {
      // It floats, bobbing gently.
      scene.pond.splash(ball.x, ball.y - 2);
      scene.tweens.add({ targets: ball, y: ball.y - 1, yoyo: true, repeat: -1, duration: 500 });
    } else {
      scene.tweens.add({ targets: ball, y: ball.y - 4, yoyo: true, duration: 120 });
      sfx.drop();
    }
  }

  // The dog hands the ball back to the farmer.
  returnBall() {
    const { scene } = this;
    const ball = scene.dog.carrying;
    scene.dog.carrying = null;
    scene.removeItem(ball);
    this.ball = null;
    sfx.pickup();
    const { job, lines } = this.mode;
    scene.progressTask(job, 1);
    if (scene.tasks.get(job).status === 'done') {
      this.active = false;
      scene.hud.bubble(scene.farmer, fill(lines.done, scene.save.dog.name), 2.6, 26);
    } else {
      scene.hud.bubble(scene.farmer, pick(lines.thanks), 1.4, 26);
      this.wait = 0.9;
    }
  }

  get giveLabel() {
    return `Give the ${this.mode.kind} to ${FARMER_NAME}`;
  }
}
