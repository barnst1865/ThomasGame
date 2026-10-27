// The fun break: Farmer Hazel throws the ball, the dog brings it back.
// Catching it right as it lands earns a bonus treat.

import { FETCH, TILE } from '../config.js';
import { AREAS, openTilesIn } from '../world/farmMap.js';
import { FARMER_NAME, LINES, fill, pick } from '../data/dialogue.js';
import { sfx } from '../systems/sfx.js';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export class FetchGame {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.ball = null;
    this.wait = 0;
    this.catches = 0;
    this.spots = openTilesIn(scene.tiles, AREAS.fetchField).map((t) => ({ x: t.x * TILE + 8, y: t.y * TILE + 10 }));
  }

  start() {
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
      hud.bubble(farmer, LINES.fetchStart, 2.2, 26);
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
    const choices = this.spots.filter((s) => {
      const d = distance(s, farmer);
      return d > 56 && d < 140;
    });
    const target = Phaser.Utils.Array.GetRandom(choices.length ? choices : this.spots);
    farmer.throwToward(target);
    sfx.throw();

    const ball = scene.spawnItem('ball', farmer.x, farmer.y - 14);
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
    if (!dog.carrying && dog.mode === 'normal' && distance(dog.feet, ball) < FETCH.catchDistance) {
      dog.carry(ball);
      this.catches += 1;
      scene.save.stats.ballsCaught += 1;
      scene.giveTreats(1);
      sfx.chime();
      scene.hud.bubble(scene.farmer, pick(LINES.fetchCatch), 1.8, 26);
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
    scene.progressTask('fetch', 1);
    if (scene.tasks.get('fetch').status === 'done') {
      this.active = false;
      scene.hud.bubble(scene.farmer, fill(LINES.fetchDone, scene.save.dog.name), 2.6, 26);
    } else {
      scene.hud.bubble(scene.farmer, pick(LINES.fetchThanks), 1.4, 26);
      this.wait = 0.9;
    }
  }

  get giveLabel() {
    return `Give the ball to ${FARMER_NAME}`;
  }
}
