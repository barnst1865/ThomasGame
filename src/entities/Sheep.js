// Sheep wander and graze, and move away from the dog. That's all herding is:
// get on the far side of a sheep and it walks where you want it to go.

import { SHEEP } from '../config.js';
import { flee, separation, cohesion, normalize, clampToRect } from '../systems/steering.js';

export class Sheep extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'sheep', 'side-0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.shadow = scene.add.image(x, y, 'shadow');
    this.penned = false;
    this.target = null;
    this.wait = Math.random() * 3;
    this.panic = 0;
    this.panicDir = { x: 0, y: 0 };
    this.dir = 'side';
  }

  setupBody() {
    this.body.setSize(10, 6).setOffset(3, 10);
    this.body.setCollideWorldBounds(true);
    this.body.setMass(0.6);
  }

  get feet() {
    return { x: this.x, y: this.y - 3 };
  }

  // Sheep know where home is: close to the open gate they head inside.
  homePull(me, ctx) {
    if (this.penned || !ctx.gate) return null;
    const d = Math.hypot(me.x - ctx.gate.x, me.y - ctx.gate.y);
    if (d > 64) return null;
    return normalize(ctx.home.x - me.x, ctx.home.y - me.y);
  }

  // ctx: { dog, flock, herdRadius, bark, penRect, roamRect, gate, home }
  update(dt, ctx) {
    const me = this.feet;
    let vx = 0;
    let vy = 0;
    const scare = ctx.dog.mode === 'sleep' ? { strength: 0 } : flee(me, ctx.dog.feet, ctx.herdRadius);

    if (ctx.bark) {
      const away = flee(me, ctx.bark, ctx.bark.radius);
      if (away.strength > 0) {
        this.panic = 0.9;
        this.panicDir = { x: away.x, y: away.y };
      }
    }
    this.panic = Math.max(0, this.panic - dt);

    const sep = separation(me, ctx.flock.map((s) => s.feet), 14);
    if (scare.strength > 0 || this.panic > 0) {
      const coh = cohesion(me, ctx.flock.map((s) => s.feet), 48);
      const push = scare.strength > 0 ? scare : this.panicDir;
      const home = this.homePull(me, ctx) ?? { x: 0, y: 0 };
      const dir = normalize(push.x + coh.x * 0.3 + sep.x * 0.8 + home.x * 0.9, push.y + coh.y * 0.3 + sep.y * 0.8 + home.y * 0.9);
      const speed = this.panic > 0 ? SHEEP.barkFleeSpeed : SHEEP.fleeSpeed * (0.45 + 0.55 * scare.strength);
      vx = dir.x * speed;
      vy = dir.y * speed;
      this.target = null;
      this.wait = 0.5 + Math.random();
    } else if (this.wait > 0) {
      this.wait -= dt;
      vx = sep.x * 10;
      vy = sep.y * 10;
    } else {
      if (!this.target) {
        const home = this.homePull(me, ctx);
        const area = this.penned ? ctx.penRect : ctx.roamRect;
        this.target = home
          ? { x: ctx.home.x + (Math.random() - 0.5) * 40, y: ctx.home.y + (Math.random() - 0.5) * 40 }
          : clampToRect({ x: me.x + (Math.random() - 0.5) * 80, y: me.y + (Math.random() - 0.5) * 60 }, area);
      }
      const dx = this.target.x - me.x;
      const dy = this.target.y - me.y;
      const stuck = !this.body.blocked.none && !this.homePull(me, ctx);
      if (Math.hypot(dx, dy) < 3 || stuck) {
        this.target = null;
        this.wait = 1.5 + Math.random() * 3;
      } else {
        const dir = normalize(dx, dy);
        vx = dir.x * SHEEP.wanderSpeed + sep.x * 10;
        vy = dir.y * SHEEP.wanderSpeed + sep.y * 10;
      }
    }

    // Slide along fences instead of pushing straight into them.
    const blocked = this.body.blocked;
    if ((blocked.left && vx < 0) || (blocked.right && vx > 0)) vy += (vy >= 0 ? 1 : -1) * Math.abs(vx) * 0.7;
    if ((blocked.up && vy < 0) || (blocked.down && vy > 0)) vx += (vx >= 0 ? 1 : -1) * Math.abs(vy) * 0.7;
    this.setVelocity(vx, vy);

    if (this.penned) {
      const inside = clampToRect(this.feet, ctx.penRect);
      this.setPosition(inside.x, inside.y + 3);
    }

    const speed = Math.hypot(vx, vy);
    if (speed > 4) {
      this.dir = Math.abs(vx) > Math.abs(vy) ? 'side' : vy > 0 ? 'down' : 'up';
      if (this.dir === 'side') this.setFlipX(vx < 0);
      this.anims.play(`sheep-walk-${this.dir}`, true);
      this.anims.timeScale = speed > 40 ? 2 : 1;
    } else {
      this.anims.stop();
      this.setFrame(`${this.dir}-0`);
    }
    this.setDepth(this.y);
    this.shadow.setPosition(this.x, this.y - 1).setDepth(this.y - 0.5);
  }

  destroy(fromScene) {
    this.shadow?.destroy();
    super.destroy(fromScene);
  }
}
