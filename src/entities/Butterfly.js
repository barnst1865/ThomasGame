// A butterfly flutters about the garden and drifts away from the dog.
// A well-aimed pounce catches it (it's let go again right away).

import { normalize, clampToRect } from '../systems/steering.js';

const SPEED = 22;
const SHY_DISTANCE = 30;
const SHY_SPEED = 46;

export class Butterfly extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, area) {
    const color = Math.floor(Math.random() * 4);
    super(scene, x, y, `butterfly-${color}`, 'open');
    scene.add.existing(this);
    this.color = color;
    this.area = area;
    this.ground = { x, y }; // where it is over the ground
    this.lift = 10;
    this.bob = Math.random() * 10;
    this.target = null;
    this.caught = false;
    this.done = false;
    this.shadow = scene.add.image(x, y, 'shadow').setScale(0.4).setAlpha(0.5);
    this.anims.play(`butterfly-${color}-flap`);
    this.anims.timeScale = 0.6 + Math.random() * 0.4;
  }

  get feet() {
    return this.ground;
  }

  // Caught! It sits on the dog's nose for a moment, then flies off high.
  catchBy(dog) {
    this.caught = true;
    this.ground = { x: dog.x, y: dog.y };
    this.lift = 14;
    this.scene.tweens.add({
      targets: this,
      lift: 120,
      delay: 500,
      duration: 1800,
      ease: 'Sine.In',
      onComplete: () => (this.done = true),
    });
  }

  update(dt, dog) {
    this.bob += dt * 4;
    if (!this.caught) {
      const g = this.ground;
      const dx = g.x - dog.feet.x;
      const dy = g.y - dog.feet.y;
      const dogDist = Math.hypot(dx, dy);
      let vx;
      let vy;
      if (dogDist < SHY_DISTANCE && dog.mode !== 'sleep') {
        const away = normalize(dx, dy);
        vx = away.x * SHY_SPEED;
        vy = away.y * SHY_SPEED;
        this.target = null;
      } else {
        if (!this.target || Math.hypot(this.target.x - g.x, this.target.y - g.y) < 4) {
          this.target = clampToRect({ x: g.x + (Math.random() - 0.5) * 90, y: g.y + (Math.random() - 0.5) * 60 }, this.area);
        }
        const dir = normalize(this.target.x - g.x, this.target.y - g.y);
        vx = dir.x * SPEED;
        vy = dir.y * SPEED;
      }
      // Butterflies zig-zag as they go.
      vx += Math.cos(this.bob * 1.7) * 14;
      vy += Math.sin(this.bob * 2.3) * 10;
      this.ground = clampToRect({ x: g.x + vx * dt, y: g.y + vy * dt }, this.area);
      this.lift = 9 + Math.sin(this.bob) * 3;
      if (Math.abs(vx) > 3) this.setFlipX(vx < 0);
    }
    this.setPosition(this.ground.x, this.ground.y - this.lift);
    this.setDepth(this.ground.y + 20);
    this.shadow.setPosition(this.ground.x, this.ground.y).setDepth(this.ground.y - 0.5).setVisible(!this.caught);
  }

  destroy(fromScene) {
    this.shadow?.destroy();
    super.destroy(fromScene);
  }
}
