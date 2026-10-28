// Will-o'-wisps: little floating lights from the woods.
//
//   mischief (green): drifts to the coop and lures a hen out to follow it
//                     around. A bark pops it, and the hen goes back to bed.
//   friendly (gold):  waits by the dog bed. Say hello and it follows the dog
//                     for the night, lighting the way and drifting toward
//                     trouble. The dog's bark carries further with it around.
//
// Like the hawk, a wisp floats above a spot on the ground (`ground`).

import { normalize, clampToRect } from '../systems/steering.js';

const LIFT = 12;
const DART_DISTANCE = 40;

export class Wisp extends Phaser.GameObjects.Sprite {
  constructor(scene, kind, x, y) {
    super(scene, x, y, `wisp-${kind}`, 'a');
    scene.add.existing(this);
    this.kind = kind;
    this.ground = { x, y };
    this.bob = Math.random() * 6;
    this.state = kind === 'friendly' ? 'waiting' : 'approach';
    this.timer = 0;
    this.dartDir = null;
    this.hen = null;
    this.target = null;
    this.done = false;
    this.events = [];
    this.anims.play(`wisp-${kind}-float`);
    this.shade = scene.add.image(x, y, 'shadow').setScale(0.5).setAlpha(0.35);
    // A soft halo so it glows against the dark.
    this.halo = scene.add
      .image(x, y, 'glow-16')
      .setTint(kind === 'friendly' ? 0xffd36b : 0x7dffa0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(1.6)
      .setAlpha(0.45);
  }

  get feet() {
    return this.ground;
  }

  get popped() {
    return this.state === 'popped';
  }

  // How much of the dark it lights up (see FarmScene.updateSky).
  get light() {
    if (this.popped) return null;
    return { x: this.ground.x, y: this.ground.y - LIFT, size: this.kind === 'friendly' && this.state === 'follow' ? 128 : 64 };
  }

  pop() {
    if (this.popped || this.kind !== 'mischief') return false;
    this.state = 'popped';
    this.scene.tweens.add({
      targets: this,
      scale: 2.4,
      alpha: 0,
      duration: 320,
      ease: 'Quad.Out',
      onComplete: () => (this.done = true),
    });
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      const s = this.scene.add.image(this.x, this.y, 'sparkle').setDepth(9003);
      this.scene.tweens.add({
        targets: s,
        x: this.x + Math.cos(a) * 18,
        y: this.y + Math.sin(a) * 14,
        alpha: 0,
        duration: 500,
        ease: 'Quad.Out',
        onComplete: () => s.destroy(),
      });
    }
    return true;
  }

  befriend() {
    this.state = 'follow';
  }

  move(point, speed, dt) {
    const dx = point.x - this.ground.x;
    const dy = point.y - this.ground.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.5) {
      const step = Math.min(dist, speed * dt);
      this.ground.x += (dx / dist) * step;
      this.ground.y += (dy / dist) * step;
      if (Math.abs(dx) > 1) this.setFlipX(dx < 0);
    }
    return dist;
  }

  // ctx: { dog, door, roam, threat }
  update(dt, ctx) {
    this.bob += dt * 3;
    this.timer -= dt;
    const dog = ctx.dog;
    const dogDist = Math.hypot(dog.feet.x - this.ground.x, dog.feet.y - this.ground.y);
    const awake = dog.mode !== 'sleep';

    if (this.kind === 'mischief' && !this.popped) {
      // Too close? It zips away with a giggle.
      if (awake && dogDist < DART_DISTANCE && this.state !== 'dart' && this.timer <= 0) {
        this.dartDir = normalize(this.ground.x - dog.feet.x, this.ground.y - dog.feet.y);
        this.resume = this.state;
        this.state = 'dart';
        this.timer = 0.5;
        this.events.push('giggle');
      }
      switch (this.state) {
        case 'approach': {
          const wobble = { x: ctx.door.x + Math.sin(this.bob) * 10, y: ctx.door.y + 6 };
          if (this.move(wobble, 24, dt) < 8) {
            this.state = 'luring';
            this.timer = 1.2;
          }
          break;
        }
        case 'luring':
          if (this.timer <= 0) {
            this.events.push('lure');
            this.state = 'roam';
            this.target = null;
          }
          break;
        case 'roam': {
          if (!this.target || this.move(this.target, 16, dt) < 4) {
            this.target = clampToRect(
              { x: this.ground.x + (Math.random() - 0.5) * 160, y: this.ground.y + (Math.random() - 0.5) * 120 },
              ctx.roam,
            );
          }
          break;
        }
        case 'dart': {
          const d = this.dartDir;
          this.ground = clampToRect({ x: this.ground.x + d.x * 110 * dt, y: this.ground.y + d.y * 110 * dt }, ctx.roam);
          if (this.timer <= 0) {
            this.state = this.resume === 'dart' ? 'roam' : this.resume;
            this.target = null;
            this.timer = 1.2; // won't dart again straight away
          }
          break;
        }
        default:
          break;
      }
    } else if (this.kind === 'friendly') {
      if (this.state === 'follow') {
        // Hover by the dog, or lead the way toward trouble.
        let spot = { x: dog.x - 10, y: dog.y - 2 };
        if (ctx.threat) {
          const dx = ctx.threat.x - dog.x;
          const dy = ctx.threat.y - dog.y;
          const dist = Math.hypot(dx, dy);
          const lead = Math.min(40, dist * 0.5);
          spot = { x: dog.x + (dx / dist) * lead, y: dog.y + (dy / dist) * lead };
        }
        const dist = Math.hypot(spot.x - this.ground.x, spot.y - this.ground.y);
        this.move(spot, Math.max(30, dist * 3), dt);
      }
    }

    this.setPosition(this.ground.x, this.ground.y - LIFT + Math.sin(this.bob) * 2);
    this.setDepth(9002); // above the darkness, so it glows
    if (!this.popped) this.setAlpha(0.8 + Math.sin(this.bob * 2.3) * 0.2);
    this.halo
      .setPosition(this.x, this.y)
      .setDepth(9001.5)
      .setVisible(!this.popped)
      .setAlpha(0.35 + Math.sin(this.bob * 2.3) * 0.12);
    this.shade.setPosition(this.ground.x, this.ground.y).setDepth(this.ground.y - 0.5).setVisible(!this.popped);
  }

  destroy(fromScene) {
    this.shade?.destroy();
    this.halo?.destroy();
    super.destroy(fromScene);
  }
}
