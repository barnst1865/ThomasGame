// Crows land on the crops in the afternoon. The first bark only makes a
// crow hop to another spot; bark again, run right up to it, or pounce, and
// it flies off for good.

import { CROWS } from '../config.js';
import { normalize } from '../systems/steering.js';

const FLY_SPEED = 95;

export class Crow extends Phaser.GameObjects.Sprite {
  // `findSpot(crow, awayFrom)` picks a new place on the crops to land.
  constructor(scene, from, landAt, findSpot) {
    super(scene, from.x, from.y, 'crow', 'fly1');
    this.findSpot = findSpot;
    scene.add.existing(this);
    this.setOrigin(0.5, 1);
    this.shadow = scene.add.image(from.x, from.y, 'shadow').setScale(0.7).setAlpha(0.6);
    this.courage = CROWS.courage;
    this.flyTo(landAt);
    this.chased = false; // flew away because of the dog
    this.done = false;
    this.events = [];
  }

  get feet() {
    return { x: this.x, y: this.y - 2 };
  }

  get perched() {
    return this.state === 'perched';
  }

  flyTo(point) {
    this.state = 'flying';
    this.target = point;
    this.anims.play('crow-fly', true);
  }

  // Called when the dog barks nearby. Returns true if this crow left for good.
  startle(from) {
    if (this.state === 'leaving') return false;
    if (this.courage > 0) {
      this.courage -= 1;
      this.hop(from);
      return false;
    }
    this.leave(from);
    return true;
  }

  hop(from) {
    const away = normalize(this.x - from.x, this.y - from.y);
    this.flyTo(this.findSpot(this, away));
    this.events.push('hop');
  }

  leave(from) {
    if (this.state === 'leaving') return;
    const away = normalize(this.x - from.x, this.y - from.y - 40);
    this.state = 'leaving';
    this.chased = true;
    this.target = { x: this.x + away.x * 400, y: this.y - 260 };
    this.anims.play('crow-fly', true);
    this.events.push('chased');
  }

  update(dt, dog) {
    if (this.state === 'flying' || this.state === 'leaving') {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.hypot(dx, dy);
      const speed = this.state === 'leaving' ? FLY_SPEED * 1.4 : FLY_SPEED;
      if (dist < 2) {
        if (this.state === 'leaving') {
          this.done = true;
        } else {
          this.state = 'perched';
          this.anims.stop();
          this.setFrame('perch');
          this.pecking = 0.5 + Math.random() * 2;
        }
      } else {
        const step = Math.min(dist, speed * dt);
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
        this.setFlipX(dx < 0);
      }
      this.setDepth(9500); // flying birds pass over everything
    } else {
      // Perched: peck at the crops now and then, and keep an eye on the dog.
      this.pecking -= dt;
      if (this.pecking <= 0) {
        this.anims.play('crow-peck');
        this.pecking = 1 + Math.random() * 2.5;
        if (Math.random() < 0.3) this.events.push('caw');
      }
      if (dog.mode !== 'sleep' && Math.hypot(dog.x - this.x, dog.y - this.y) < CROWS.scareDistance) this.leave(dog);
      this.setDepth(this.y);
    }
    this.shadow
      .setPosition(this.x, this.y - 1)
      .setVisible(this.state === 'perched')
      .setDepth(this.y - 0.5);
  }

  destroy(fromScene) {
    this.shadow?.destroy();
    super.destroy(fromScene);
  }
}
