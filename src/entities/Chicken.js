// Hens peck around the coop yard, flap away from the dog, and go inside
// the coop in the evening. A runaway hen ('stray') runs from the dog like a
// sheep, so the dog can herd her home. At night a mischief wisp can lure a
// hen out of the coop ('lured') and she follows it around.

import { normalize, clampToRect, flee } from '../systems/steering.js';

const STRAY_RADIUS = 50;

export class Chicken extends Phaser.Physics.Arcade.Sprite {
  // color: 'white' or 'brown' for a hen, or 'rooster' for Sir Cluckington.
  constructor(scene, x, y, color) {
    const key = color === 'rooster' ? 'rooster' : `hen-${color}`;
    super(scene, x, y, key, 'walk1');
    this.texKey = key;
    this.color = color;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.shadow = scene.add.image(x, y, 'shadow').setScale(0.7);
    this.state = 'wander';
    this.target = null;
    this.wait = Math.random() * 2;
    this.flutter = 0;
    this.fleeDir = { x: 0, y: 0 };
  }

  setupBody() {
    this.body.setSize(8, 5).setOffset(4, 11);
    this.body.setCollideWorldBounds(true);
  }

  get feet() {
    return { x: this.x, y: this.y - 2 };
  }

  scare(from) {
    if (this.state !== 'wander' && this.state !== 'stray') return false;
    const away = flee(this.feet, from, 1000);
    const home = this.state === 'stray' ? this.homeward() : { x: 0, y: 0 };
    this.fleeDir = normalize(away.x + home.x * 0.5 + (Math.random() - 0.5) * 0.6, away.y + home.y * 0.5 + (Math.random() - 0.5) * 0.6);
    this.flutter = 0.6;
    return true;
  }

  goToBed(door) {
    if (this.state === 'inside') return;
    this.state = 'toBed';
    this.door = door;
    this.lure = null;
  }

  // She got out! `home` is the middle of the coop yard.
  runAway(x, y, home) {
    this.setPosition(x, y);
    this.state = 'stray';
    this.home = home;
    this.roam = { x: x - 40, y: y - 30, w: 80, h: 60 };
    this.target = null;
  }

  // Back in the yard: an ordinary hen again.
  settle() {
    this.state = 'wander';
    this.home = null;
    this.target = null;
  }

  // A wisp tempts her out of the coop at night.
  followLure(lure, door) {
    this.state = 'lured';
    this.lure = lure;
    this.door = door;
    this.setPosition(door.x, door.y + 2);
    this.setVisible(true);
    this.shadow.setVisible(true);
    this.body.enable = true;
  }

  homeward() {
    return this.home ? normalize(this.home.x - this.x, this.home.y - this.y) : { x: 0, y: 0 };
  }

  // ctx: { dog, yardRect }
  update(dt, ctx) {
    if (this.state === 'inside') return;
    let vx = 0;
    let vy = 0;
    let peck = false;
    const me = this.feet;

    if (this.state === 'toBed') {
      const dx = this.door.x - me.x;
      const dy = this.door.y - me.y;
      if (Math.hypot(dx, dy) < 4) {
        this.state = 'inside';
        this.setVisible(false);
        this.shadow.setVisible(false);
        this.body.enable = false;
        return;
      }
      const dir = normalize(dx, dy);
      vx = dir.x * 30;
      vy = dir.y * 30;
    } else if (this.state === 'lured') {
      // Follow the wisp, a few steps behind, as if in a trance.
      const dx = this.lure.x - me.x;
      const dy = this.lure.y + 10 - me.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 14) {
        const dir = normalize(dx, dy);
        const speed = Math.min(40, 18 + dist * 0.3);
        vx = dir.x * speed;
        vy = dir.y * speed;
      }
    } else if (this.state === 'stray' && ctx.dog.mode !== 'sleep' && this.flutter <= 0 && this.nearDog(ctx.dog) < STRAY_RADIUS) {
      // Scurry away from the dog, leaning a little toward home.
      const d = this.nearDog(ctx.dog);
      const away = flee(me, ctx.dog.feet, STRAY_RADIUS);
      const home = this.homeward();
      const dir = normalize(away.x + home.x * 0.45, away.y + home.y * 0.45);
      const speed = 32 + 38 * (1 - d / STRAY_RADIUS);
      vx = dir.x * speed;
      vy = dir.y * speed;
      this.target = null;
      this.wait = 0.4;
      this.roam = null;
    } else {
      const dogDist = this.nearDog(ctx.dog);
      if (this.state === 'wander' && dogDist < 22 && this.flutter <= 0 && ctx.dog.mode !== 'sleep') this.scare(ctx.dog.feet);
      if (this.flutter > 0) {
        this.flutter -= dt;
        vx = this.fleeDir.x * 75;
        vy = this.fleeDir.y * 75;
        this.target = null;
      } else if (this.wait > 0) {
        this.wait -= dt;
        peck = true;
      } else {
        if (!this.target) {
          const area = this.state === 'stray' ? (this.roam ?? { x: me.x - 30, y: me.y - 20, w: 60, h: 40 }) : ctx.yardRect;
          this.target = clampToRect({ x: me.x + (Math.random() - 0.5) * 70, y: me.y + (Math.random() - 0.5) * 50 }, area);
        }
        const dx = this.target.x - me.x;
        const dy = this.target.y - me.y;
        if (Math.hypot(dx, dy) < 3 || this.body.blocked.none === false) {
          this.target = null;
          this.wait = 1 + Math.random() * 2.5;
        } else {
          const dir = normalize(dx, dy);
          vx = dir.x * 20;
          vy = dir.y * 20;
        }
      }
    }

    // Slide along fences and walls instead of pushing straight into them.
    const blocked = this.body.blocked;
    if ((blocked.left && vx < 0) || (blocked.right && vx > 0)) vy += (vy >= 0 ? 1 : -1) * Math.abs(vx) * 0.7;
    if ((blocked.up && vy < 0) || (blocked.down && vy > 0)) vx += (vx >= 0 ? 1 : -1) * Math.abs(vy) * 0.7;
    this.setVelocity(vx, vy);
    if (Math.abs(vx) > 1) this.setFlipX(vx < 0);
    const key = this.texKey;
    if (Math.hypot(vx, vy) > 2) {
      this.anims.play(`${key}-walk`, true);
    } else if (peck && !this.anims.isPlaying && Math.random() < 0.01) {
      this.anims.play(`${key}-peck`);
    } else if (!this.anims.isPlaying || this.anims.currentAnim?.key === `${key}-walk`) {
      this.anims.stop();
      this.setFrame('walk1');
    }
    this.setDepth(this.y);
    this.shadow.setPosition(this.x, this.y - 1).setDepth(this.y - 0.5);
  }

  nearDog(dog) {
    return Math.hypot(dog.feet.x - this.feet.x, dog.feet.y - this.feet.y);
  }

  destroy(fromScene) {
    this.shadow?.destroy();
    super.destroy(fromScene);
  }
}
