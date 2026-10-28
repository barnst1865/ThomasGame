// Pickles the farm cat. She naps in sunny spots, runs off with things,
// and climbs trees (the dog can't). She never collides with anything:
// cats go where they like.

import { normalize } from '../systems/steering.js';

const SPEED = 80;

export class Cat extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'cat', 'sleep');
    scene.add.existing(this);
    this.setOrigin(0.5, 1);
    this.shadow = scene.add.image(x, y, 'shadow').setScale(0.8);
    this.route = [];
    this.onArrive = null;
    this.carried = null; // an image held in her mouth
    this.perchDepth = null; // set while she sits up a tree
    this.moved = 0; // distance walked, for leaving paw prints
  }

  get feet() {
    return { x: this.x, y: this.y - 2 };
  }

  get running() {
    return this.route.length > 0;
  }

  runTo(points, onArrive = null) {
    this.route = points.map((p) => ({ x: p.x, y: p.y }));
    this.onArrive = onArrive;
    this.perchDepth = null;
  }

  nap() {
    this.route = [];
    this.anims.stop();
    this.setFrame('sleep');
  }

  sit() {
    this.anims.stop();
    this.setFrame('sit');
  }

  // A startled jump on the spot.
  jump() {
    this.scene.tweens.add({ targets: this, y: this.y - 8, yoyo: true, duration: 140, ease: 'Quad.Out' });
  }

  update(dt) {
    if (this.route.length > 0) {
      const next = this.route[0];
      const dx = next.x - this.x;
      const dy = next.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 2) {
        this.route.shift();
        if (this.route.length === 0) {
          this.sit();
          const done = this.onArrive;
          this.onArrive = null;
          done?.();
        }
      } else {
        const dir = normalize(dx, dy);
        const step = Math.min(dist, SPEED * dt);
        this.x += dir.x * step;
        this.y += dir.y * step;
        this.moved += step;
        if (Math.abs(dx) > 1) this.setFlipX(dx < 0);
        this.anims.play('cat-walk', true);
      }
    }
    this.setDepth(this.perchDepth ?? this.y);
    this.shadow.setPosition(this.x, this.y - 1).setDepth(this.y - 0.5).setVisible(this.perchDepth === null);
    if (this.carried) {
      this.carried.setPosition(this.x + (this.flipX ? -8 : 8), this.y - 3).setDepth(this.depth + 0.1);
    }
  }

  destroy(fromScene) {
    this.shadow?.destroy();
    this.carried?.destroy();
    super.destroy(fromScene);
  }
}
