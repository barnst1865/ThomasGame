// The player: the farmer's dog.

import { DOG } from '../config.js';
import { buildDogTexture } from '../art/textures.js';

// Where a carried item sits, relative to the dog's feet.
const MOUTH = {
  down: { x: 0, y: -4, behind: false },
  up: { x: 0, y: -13, behind: true },
  left: { x: -8, y: -7, behind: false },
  right: { x: 8, y: -7, behind: false },
};

export const FACING_VECTORS = {
  down: { x: 0, y: 1 },
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export class Dog extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, breed, coat, collar) {
    const key = buildDogTexture(scene, breed, coat, collar);
    super(scene, x, y, key, 'down-stand-0');
    this.texKey = key;
    this.breed = breed;
    this.stats = breed.stats;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.body.setSize(10, 6).setOffset(3, 10);
    this.body.setCollideWorldBounds(true);
    this.shadow = scene.add.image(x, y, 'shadow').setOrigin(0.5, 0.5);

    this.facing = 'down';
    this.mode = 'normal';
    this.modeTime = 0;
    this.modeDone = null;
    this.carrying = null;
    this.barkCooldown = 0;
    this.pounceCooldown = 0;
    this.pounceHits = new Set();
    this.swimming = false;
    this.wet = 0; // seconds of dripping left after a swim
    this.ripple = scene.add.image(x, y, 'ripple').setVisible(false);
  }

  get feet() {
    return { x: this.x, y: this.y - 3 };
  }

  // A point just in front of the dog's nose.
  ahead(distance = 10) {
    const v = FACING_VECTORS[this.facing];
    return { x: this.x + v.x * distance, y: this.y - 3 + v.y * distance };
  }

  setMode(mode, duration = 0, onDone = null) {
    this.mode = mode;
    this.modeTime = duration;
    this.modeDone = onDone;
  }

  update(dt, controls) {
    this.barkCooldown = Math.max(0, this.barkCooldown - dt);
    this.pounceCooldown = Math.max(0, this.pounceCooldown - dt);

    if (this.modeTime > 0) {
      this.modeTime -= dt;
      if (this.modeTime <= 0) {
        const done = this.modeDone;
        this.modeDone = null;
        this.mode = 'normal';
        this.setScale(1);
        done?.();
      }
    }

    switch (this.mode) {
      case 'normal':
        this.updateWalking(controls);
        break;
      case 'pounce':
        break; // velocity was set when the pounce started
      case 'stunned':
        this.body.velocity.scale(0.85);
        break;
      case 'dig': {
        this.setVelocity(0, 0);
        const frame = Math.floor(this.modeTime * 14) % 2 === 0 ? 'walk1-0' : 'walk2-1';
        this.anims.stop();
        this.setFrame(`${this.animDir()}-${frame}`);
        break;
      }
      default:
        this.setVelocity(0, 0);
    }

    this.setDepth(this.y);
    this.shadow.setPosition(this.x, this.y - 1).setDepth(this.y - 0.5).setVisible(this.mode !== 'sleep' && !this.swimming);
    this.ripple.setPosition(this.x, this.y - 4).setDepth(this.y + 0.1).setVisible(this.swimming);
    this.updateCarried();
  }

  // In the water only the dog's head and back show above the surface.
  setSwimming(swimming) {
    if (swimming === this.swimming) return;
    this.swimming = swimming;
    if (swimming) this.setCrop(0, 0, this.frame.width, this.frame.height - 6);
    else this.setCrop();
  }

  updateWalking(controls) {
    const move = controls.moveVector();
    const moving = move.x !== 0 || move.y !== 0;
    let speed = (controls.isDown('run') ? DOG.runSpeed : DOG.walkSpeed) * this.stats.speed;
    if (this.carrying) speed *= 0.85 * this.stats.carrySpeed;
    if (this.swimming) speed *= DOG.swimSpeed;
    this.setVelocity(move.x * speed, move.y * speed);

    if (moving) {
      if (Math.abs(move.x) > Math.abs(move.y) + 0.01) this.facing = move.x > 0 ? 'right' : 'left';
      else if (move.y !== 0) this.facing = move.y > 0 ? 'down' : 'up';
    }
    this.setFlipX(this.facing === 'left');
    const key = `${this.texKey}:${moving ? 'walk' : 'idle'}-${this.animDir()}`;
    this.anims.play(key, true);
    if (moving) this.anims.timeScale = controls.isDown('run') ? 1.5 : 1;
    else this.anims.timeScale = 1;
  }

  animDir() {
    return this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing;
  }

  pounce() {
    if (this.mode !== 'normal' || this.pounceCooldown > 0) return false;
    const v = FACING_VECTORS[this.facing];
    const speed = DOG.pounceDistance / DOG.pounceTime;
    this.pounceHits.clear();
    this.setMode('pounce', DOG.pounceTime);
    this.setVelocity(v.x * speed, v.y * speed);
    this.anims.stop();
    this.setFrame(`${this.animDir()}-walk1-0`);
    this.setScale(v.x !== 0 ? 1.15 : 0.9, v.x !== 0 ? 0.9 : 1.15);
    this.pounceCooldown = DOG.pounceCooldown + DOG.pounceTime;
    return true;
  }

  // Knocked over by a lunge. Bigger animals push harder.
  stun(fromX, fromY, force = 160) {
    if (this.mode === 'sleep') return;
    const dx = this.x - fromX;
    const dy = this.y - fromY;
    const len = Math.hypot(dx, dy) || 1;
    this.setMode('stunned', DOG.stunTime);
    this.setVelocity((dx / len) * force, (dy / len) * force);
    this.setTint(0xffb0b0);
    this.scene.time.delayedCall(DOG.stunTime * 1000, () => this.clearTint());
  }

  dig(onDone) {
    if (this.mode !== 'normal') return false;
    this.setMode('dig', DOG.digTime, onDone);
    return true;
  }

  sleep(x, y) {
    this.setMode('sleep');
    this.setVelocity(0, 0);
    this.setPosition(x, y);
    this.anims.stop();
    this.setFrame('sleep');
    this.setFlipX(false);
  }

  carry(item) {
    this.carrying = item;
    item.carried = true;
    this.updateCarried();
  }

  dropCarried() {
    const item = this.carrying;
    if (!item) return null;
    this.carrying = null;
    item.carried = false;
    const spot = this.ahead(6);
    item.setPosition(spot.x, spot.y + 3);
    item.setDepth(item.y);
    return item;
  }

  updateCarried() {
    const item = this.carrying;
    if (!item) return;
    const m = MOUTH[this.facing];
    item.setPosition(this.x + m.x, this.y + m.y);
    item.setDepth(this.depth + (m.behind ? -0.2 : 0.2));
  }

  destroy(fromScene) {
    this.shadow?.destroy();
    this.ripple?.destroy();
    super.destroy(fromScene);
  }
}
