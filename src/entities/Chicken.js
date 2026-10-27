// Hens peck around the coop yard, flap away from the dog, and go inside
// the coop in the evening.

import { normalize, clampToRect, flee } from '../systems/steering.js';

export class Chicken extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, color) {
    super(scene, x, y, `hen-${color}`, 'walk1');
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
    if (this.state !== 'wander') return false;
    const away = flee(this.feet, from, 1000);
    this.fleeDir = normalize(away.x + (Math.random() - 0.5) * 0.6, away.y + (Math.random() - 0.5) * 0.6);
    this.flutter = 0.6;
    return true;
  }

  goToBed(door) {
    if (this.state === 'inside') return;
    this.state = 'toBed';
    this.door = door;
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
    } else {
      const dogDist = Math.hypot(ctx.dog.feet.x - me.x, ctx.dog.feet.y - me.y);
      if (dogDist < 22 && this.flutter <= 0 && ctx.dog.mode !== 'sleep') this.scare(ctx.dog.feet);
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
          this.target = clampToRect({ x: me.x + (Math.random() - 0.5) * 70, y: me.y + (Math.random() - 0.5) * 50 }, ctx.yardRect);
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

    this.setVelocity(vx, vy);
    if (Math.abs(vx) > 1) this.setFlipX(vx < 0);
    const key = `hen-${this.color}`;
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

  destroy(fromScene) {
    this.shadow?.destroy();
    super.destroy(fromScene);
  }
}
