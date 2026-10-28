// Sheep wander and graze, and move away from the dog. That's all herding is:
// get on the far side of a sheep and it walks where you want it to go.
//
// Each day a sheep goes: 'inPen' (morning) -> 'grazing' -> 'penned' (afternoon).

import { SHEEP } from '../config.js';
import { flee, separation, cohesion, normalize, clampToRect } from '../systems/steering.js';

export class Sheep extends Phaser.Physics.Arcade.Sprite {
  // A lamb is a smaller sheep that only has side-on pictures.
  constructor(scene, x, y, { lamb = false } = {}) {
    super(scene, x, y, lamb ? 'lamb' : 'sheep', lamb ? 'walk1' : 'side-0');
    this.lamb = lamb;
    this.roam = null; // a lost lamb stays near where it got lost until it's found
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.shadow = scene.add.image(x, y, 'shadow').setScale(lamb ? 0.7 : 1);
    this.state = 'inPen';
    this.target = null;
    this.wait = Math.random() * 3;
    this.panic = 0;
    this.panicDir = { x: 0, y: 0 };
    this.dir = 'side';
  }

  setupBody() {
    if (this.lamb) this.body.setSize(8, 5).setOffset(2, 7);
    else this.body.setSize(10, 6).setOffset(3, 10);
    this.body.setCollideWorldBounds(true);
    this.body.setMass(0.6);
  }

  get feet() {
    return { x: this.x, y: this.y - 3 };
  }

  // Sheep know the way: near the open gate they head through it on their own,
  // out to the meadow in the morning and home to the pen in the afternoon.
  pull(me, ctx) {
    const p = ctx.pull;
    if (!p || p.appliesTo !== this.state) return null;
    if (Math.hypot(me.x - p.gate.x, me.y - p.gate.y) > 72) return null;
    return normalize(p.toward.x - me.x, p.toward.y - me.y);
  }

  // Where to wander next. Now and then a sheep strolls toward the gate by
  // itself (they like to graze in the morning and go home in the evening).
  pickTarget(me, ctx, pull) {
    const p = ctx.pull;
    if (pull) return { x: p.toward.x + (Math.random() - 0.5) * 40, y: p.toward.y + (Math.random() - 0.5) * 40 };
    if (p && p.appliesTo === this.state && Math.random() < p.wanderChance) {
      return { x: p.approach.x + (Math.random() - 0.5) * 16, y: p.approach.y + (Math.random() - 0.5) * 24 };
    }
    return clampToRect({ x: me.x + (Math.random() - 0.5) * 80, y: me.y + (Math.random() - 0.5) * 60 }, this.wanderArea(ctx));
  }

  wanderArea(ctx) {
    if (this.roam) return this.roam;
    return this.state === 'grazing' ? ctx.roamRect : ctx.penRect;
  }

  // ctx: { dog, herders, flock, herdRadius, bark, penRect, roamRect, pull }
  // herders: the dogs sheep move away from (usually just yours)
  // pull: { appliesTo, gate, toward, approach, wanderChance } or null
  update(dt, ctx) {
    const me = this.feet;
    let vx = 0;
    let vy = 0;
    let scare = { strength: 0 };
    for (const herder of ctx.herders ?? [ctx.dog]) {
      if (herder.mode === 'sleep' || herder.mode === 'watch') continue;
      const s = flee(me, herder.feet, ctx.herdRadius);
      if (s.strength > scare.strength) scare = s;
    }

    if (ctx.bark) {
      const away = flee(me, ctx.bark, ctx.bark.radius);
      if (away.strength > 0) {
        this.panic = 0.9;
        this.panicDir = { x: away.x, y: away.y };
      }
    }
    this.panic = Math.max(0, this.panic - dt);

    const sep = separation(me, ctx.flock.map((s) => s.feet), 14);
    const pull = this.pull(me, ctx);
    if (scare.strength > 0 || this.panic > 0) {
      // Stick with the sheep on the same side of the fence.
      const coh = cohesion(me, ctx.flock.filter((s) => s.state === this.state).map((s) => s.feet), 48);
      const push = scare.strength > 0 ? scare : this.panicDir;
      const home = pull ?? { x: 0, y: 0 };
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
      if (!this.target) this.target = this.pickTarget(me, ctx, pull);
      const dx = this.target.x - me.x;
      const dy = this.target.y - me.y;
      const stuck = !this.body.blocked.none && !pull;
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

    if (this.state === 'penned') {
      const inside = clampToRect(this.feet, ctx.penRect);
      this.setPosition(inside.x, inside.y + 3);
    }

    const speed = Math.hypot(vx, vy);
    if (this.lamb) {
      if (speed > 4) {
        if (Math.abs(vx) > 1) this.setFlipX(vx < 0);
        this.anims.play('lamb-walk', true);
        this.anims.timeScale = speed > 40 ? 2 : 1;
      } else {
        this.anims.stop();
        this.setFrame('walk1');
      }
    } else if (speed > 4) {
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
