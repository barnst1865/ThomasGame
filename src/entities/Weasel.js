// The night-time threat. It sneaks toward the coop to steal an egg. The
// dog can bark to startle it and pounce to chase it off. It fights back
// with quick lunges that knock the dog over (no one gets hurt).

import { WEASEL } from '../config.js';
import { normalize } from '../systems/steering.js';

const NOTICE_RANGE = 72;
const GIVE_UP_RANGE = 120;

export class Weasel extends Phaser.GameObjects.Sprite {
  constructor(scene, path, exitPath) {
    const start = path[0];
    super(scene, start.x, start.y, 'weasel', 'walk1');
    scene.add.existing(this);
    this.setOrigin(0.5, 1);
    this.shadow = scene.add.image(this.x, this.y, 'shadow');
    this.pips = scene.add.graphics();
    this.icon = scene.add.image(this.x, this.y, 'exclaim').setVisible(false);
    this.hp = WEASEL.health;
    this.maxHp = WEASEL.health;
    this.route = path.slice(1);
    this.exitPath = exitPath;
    this.state = 'sneak';
    this.timer = 0;
    this.invulnerable = 0;
    this.vel = { x: 0, y: 0 };
    this.stealProgress = 0;
    this.startleCooldown = 0;
    this.seenDog = false;
    this.done = false;
    this.stoleEgg = false;
    this.events = []; // things the farm scene should react to
  }

  get feet() {
    return { x: this.x, y: this.y - 3 };
  }

  setState(state, timer = 0) {
    this.state = state;
    this.timer = timer;
    this.setFrame(state === 'windup' ? 'crouch' : 'walk1');
    this.icon.setVisible(state === 'windup' || state === 'startled');
    if (state === 'windup') this.icon.setTexture('exclaim');
    if (state === 'startled') this.icon.setTexture('question');
  }

  startle() {
    // After a scare it gets used to barking for a moment, so barking alone can't win.
    if (['flee', 'lunge'].includes(this.state) || this.startleCooldown > 0) return false;
    this.startleCooldown = 2.6;
    this.setState('startled', 1.1);
    this.seenDog = true;
    return true;
  }

  hit(damage, fromX, fromY) {
    if (this.invulnerable > 0 || this.state === 'flee') return false;
    this.hp = Math.max(0, this.hp - damage);
    this.invulnerable = 0.6;
    const away = normalize(this.x - fromX, this.y - fromY);
    this.vel = { x: away.x * 120, y: away.y * 120 };
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(110, () => this.active && this.clearTint());
    this.seenDog = true;
    if (this.hp <= 0) {
      this.startFleeing();
      this.events.push('defeated');
    } else {
      this.setState('hurt', 0.35);
    }
    return true;
  }

  startFleeing() {
    this.setState('flee');
    this.route = this.exitPath.slice();
  }

  moveToward(point, speed, dt) {
    const dx = point.x - this.x;
    const dy = point.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return true;
    const dir = normalize(dx, dy);
    this.tryMove(dir.x * Math.min(speed * dt, dist), dir.y * Math.min(speed * dt, dist));
    return false;
  }

  // Moves unless that would put the weasel inside a wall or a building.
  tryMove(dx, dy) {
    const blocked = this.scene.isSolidAt.bind(this.scene);
    if (!blocked(this.x + dx, this.y - 3)) this.x += dx;
    if (!blocked(this.x, this.y - 3 + dy)) this.y += dy;
    if (Math.abs(dx) > 0.01) this.setFlipX(dx < 0);
  }

  // ctx: { dog, coopDoor }
  update(dt, ctx) {
    const dog = ctx.dog;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.startleCooldown = Math.max(0, this.startleCooldown - dt);
    this.timer -= dt;
    const dx = dog.x - this.x;
    const dy = dog.y - this.y;
    const dist = Math.hypot(dx, dy);
    const dogAwake = dog.mode !== 'sleep';
    let moving = false;

    switch (this.state) {
      case 'sneak': {
        if (dogAwake && dist < NOTICE_RANGE) {
          this.seenDog = true;
          this.setState('confront', 0.8 + Math.random() * 0.8);
          this.events.push('noticed');
          break;
        }
        const next = this.route[0];
        if (!next) {
          this.setState('steal');
          break;
        }
        if (this.moveToward(next, WEASEL.sneakSpeed, dt)) this.route.shift();
        moving = true;
        break;
      }
      case 'confront': {
        if (!dogAwake || dist > GIVE_UP_RANGE) {
          this.route = [ctx.coopDoor];
          this.setState('sneak');
          break;
        }
        // Circle around the dog at a safe-ish distance.
        const away = normalize(-dx, -dy);
        const side = { x: -away.y, y: away.x };
        const want = dist < 30 ? 1 : dist > 46 ? -1 : 0;
        this.tryMove((away.x * want * 40 + side.x * 18) * dt, (away.y * want * 40 + side.y * 18) * dt);
        this.setFlipX(dx < 0);
        moving = true;
        if (this.timer <= 0 && dist < 64) this.setState('windup', 0.45);
        break;
      }
      case 'windup':
        this.setFlipX(dx < 0);
        this.x += Math.sin(this.timer * 60) * 0.3;
        if (this.timer <= 0) {
          const dir = normalize(dx, dy);
          this.vel = { x: dir.x * WEASEL.lungeSpeed, y: dir.y * WEASEL.lungeSpeed };
          this.setState('lunge', 0.3);
        }
        break;
      case 'lunge':
        this.tryMove(this.vel.x * dt, this.vel.y * dt);
        moving = true;
        if (dist < 11 && dog.mode === 'normal') {
          this.events.push('bitDog');
          this.setState('recover', 0.6);
        } else if (this.timer <= 0) {
          this.setState('recover', 0.4);
        }
        break;
      case 'recover': {
        const away = normalize(-dx, -dy);
        this.tryMove(away.x * 35 * dt, away.y * 35 * dt);
        moving = true;
        if (this.timer <= 0) this.setState('confront', 1.2 + Math.random() * 1.2);
        break;
      }
      case 'startled':
        if (this.timer <= 0) this.setState('confront', 0.9 + Math.random());
        break;
      case 'hurt':
        this.tryMove(this.vel.x * dt, this.vel.y * dt);
        this.vel.x *= 0.85;
        this.vel.y *= 0.85;
        if (this.timer <= 0) this.setState('confront', 0.7 + Math.random() * 0.8);
        break;
      case 'steal':
        if (dogAwake && dist < NOTICE_RANGE * 0.8) {
          this.setState('confront', 0.6);
          break;
        }
        this.stealProgress += dt;
        this.x += Math.sin(this.stealProgress * 30) * 0.2;
        if (this.stealProgress >= WEASEL.stealTime) {
          this.stoleEgg = true;
          this.events.push('stole');
          this.startFleeing();
        }
        break;
      case 'flee': {
        const next = this.route[0];
        if (!next) {
          this.done = true;
          break;
        }
        const dx2 = next.x - this.x;
        const dy2 = next.y - this.y;
        const d2 = Math.hypot(dx2, dy2);
        if (d2 < 3) this.route.shift();
        else {
          // Fleeing ignores walls so it can never get stuck.
          const step = Math.min(d2, WEASEL.fleeSpeed * dt);
          this.x += (dx2 / d2) * step;
          this.y += (dy2 / d2) * step;
          this.setFlipX(dx2 < 0);
        }
        moving = true;
        break;
      }
      default:
        break;
    }

    if (moving && this.state !== 'windup') this.anims.play('weasel-run', true);
    else if (this.anims.isPlaying) this.anims.stop();
    this.setAlpha(this.invulnerable > 0 && Math.floor(this.invulnerable * 20) % 2 === 0 ? 0.5 : 1);
    this.setDepth(this.y);
    this.shadow.setPosition(this.x, this.y - 1).setDepth(this.y - 0.5);
    this.icon.setPosition(this.x, this.y - 18).setDepth(this.y + 1);
    this.drawPips();
  }

  drawPips() {
    const g = this.pips;
    g.clear();
    g.setDepth(this.y + 1);
    if (!this.seenDog && this.state !== 'steal') return;
    const w = 3;
    const gap = 1;
    const total = this.maxHp * (w + gap) - gap;
    const x0 = Math.round(this.x - total / 2);
    const y0 = Math.round(this.y - 15);
    for (let i = 0; i < this.maxHp; i++) {
      g.fillStyle(0x2a1a12, 1).fillRect(x0 + i * (w + gap) - 1, y0 - 1, w + 2, 4);
      g.fillStyle(i < this.hp ? 0xe25d6a : 0x6b5a5a, 1).fillRect(x0 + i * (w + gap), y0, w, 2);
    }
    if (this.state === 'steal') {
      const pct = Math.min(1, this.stealProgress / WEASEL.stealTime);
      g.fillStyle(0x2a1a12, 1).fillRect(x0 - 1, y0 - 6, total + 2, 4);
      g.fillStyle(0xf2a93b, 1).fillRect(x0, y0 - 5, Math.round(total * pct), 2);
    }
  }

  destroy(fromScene) {
    this.shadow?.destroy();
    this.pips?.destroy();
    this.icon?.destroy();
    super.destroy(fromScene);
  }
}
