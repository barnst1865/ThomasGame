// A visitor who walks around the farm: Mo the mail carrier, Penny from the
// shop, and others later. Give it a route and it walks there; it faces the
// dog when the dog comes close.

import { normalize } from '../systems/steering.js';

const SPEED = 44;

export class Walker extends Phaser.GameObjects.Sprite {
  // key: a person texture from src/art/textures.js (e.g. 'mail-carrier')
  constructor(scene, key, x, y) {
    super(scene, x, y, key, 'down-stand');
    this.key = key;
    scene.add.existing(this);
    this.setOrigin(0.5, 1);
    this.shadow = scene.add.image(x, y, 'shadow');
    this.route = [];
    this.onArrive = null;
    this.facing = 'down';
    this.watchDog = true;
  }

  get feet() {
    return { x: this.x, y: this.y - 3 };
  }

  get arrived() {
    return this.route.length === 0;
  }

  walkTo(points, onArrive = null) {
    this.route = points.map((p) => ({ x: p.x, y: p.y }));
    this.onArrive = onArrive;
  }

  face(dir) {
    this.facing = dir;
    const view = dir === 'left' || dir === 'right' ? 'side' : dir;
    this.setFlipX(dir === 'left');
    this.anims.stop();
    this.setFrame(`${view}-stand`);
  }

  faceToward(point) {
    const dx = point.x - this.x;
    const dy = point.y - this.y;
    if (Math.abs(dx) > Math.abs(dy)) this.face(dx > 0 ? 'right' : 'left');
    else this.face(dy > 0 ? 'down' : 'up');
  }

  // A startled little hop (the dog barked right at them).
  jump() {
    this.scene.tweens.add({ targets: this, y: this.y - 6, yoyo: true, duration: 120, ease: 'Quad.Out' });
  }

  update(dt, dog) {
    if (this.route.length > 0) {
      const next = this.route[0];
      const dx = next.x - this.x;
      const dy = next.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 2) {
        this.route.shift();
        if (this.route.length === 0) {
          this.anims.stop();
          this.face(this.facing);
          const done = this.onArrive;
          this.onArrive = null;
          done?.();
        }
      } else {
        const dir = normalize(dx, dy);
        const step = Math.min(dist, SPEED * dt);
        this.x += dir.x * step;
        this.y += dir.y * step;
        const view = Math.abs(dx) > Math.abs(dy) ? 'side' : dy > 0 ? 'down' : 'up';
        this.facing = view === 'side' ? (dx > 0 ? 'right' : 'left') : view;
        this.setFlipX(this.facing === 'left');
        this.anims.play(`${this.key}-walk-${view}`, true);
      }
    } else if (this.watchDog && dog && Math.hypot(dog.x - this.x, dog.y - this.y) < 48) {
      this.faceToward(dog);
    }
    this.setDepth(this.y);
    this.shadow.setPosition(this.x, this.y - 1).setDepth(this.y - 0.5);
  }

  destroy(fromScene) {
    this.shadow?.destroy();
    super.destroy(fromScene);
  }
}
