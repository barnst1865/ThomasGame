// A hawk circles high over the coop yard, then swoops at a hen. While it's
// down low, a bark (or a pounce) scares it back up into the sky. It never
// actually catches a hen: a missed swoop just ruffles some feathers.
//
// The hawk keeps track of the spot on the ground below it (`ground`) and
// how high up it is (`alt`). Its shadow shows where it really is.
//
// Mr. Goldsby's spraying drone flies the same way (see Missions.js), with
// its own look: { key: 'drone', frame: 'a', flap: 'drone-spin', turns: false }.

import { normalize } from '../systems/steering.js';

const ORBIT = { rx: 72, ry: 40 };
const HIGH = 70;
const LOW = 40; // below this it can hear the dog bark
const SPEED = { circle: 75, dive: 115, climb: 70, scared: 130, leave: 110 };

export class Hawk extends Phaser.GameObjects.Sprite {
  // center: the middle of the coop yard
  constructor(scene, center, { key = 'hawk', frame = 'glide', flap = 'hawk-flap', turns = true } = {}) {
    const start = { x: center.x + 320, y: center.y - 160 };
    super(scene, start.x, start.y, key, frame);
    scene.add.existing(this);
    this.look = { frame, flap, turns };
    this.center = center;
    this.ground = { ...start };
    this.alt = 110;
    this.heading = Math.PI;
    this.orbit = 0;
    this.state = 'arrive';
    this.timer = 0;
    this.target = null; // the hen it's after
    this.done = false;
    this.events = [];
    this.shade = scene.add.image(start.x, start.y, key, frame).setTintFill(0x1e2814).setAlpha(0.22);
    this.icon = scene.add.image(0, 0, 'exclaim').setVisible(false).setDepth(8990);
  }

  get low() {
    return ['dive', 'climb'].includes(this.state) && this.alt < LOW;
  }

  get feet() {
    return this.ground;
  }

  setState(state, timer = 0) {
    this.state = state;
    this.timer = timer;
  }

  // Frightened by the dog: up and away, then back to circling.
  scare() {
    if (!this.low) return false;
    this.target = null;
    this.setState('scared', 1.6);
    this.events.push('scared');
    return true;
  }

  leave() {
    if (this.state === 'leave') return;
    this.target = null;
    this.setState('leave');
  }

  // Moves the ground spot toward a point. Returns the distance left.
  glideTo(point, speed, dt) {
    const dx = point.x - this.ground.x;
    const dy = point.y - this.ground.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.5) {
      const step = Math.min(dist, speed * dt);
      this.ground.x += (dx / dist) * step;
      this.ground.y += (dy / dist) * step;
      this.heading = Math.atan2(dy, dx);
    }
    return dist;
  }

  orbitPoint(angle) {
    return { x: this.center.x + Math.cos(angle) * ORBIT.rx, y: this.center.y + Math.sin(angle) * ORBIT.ry };
  }

  // ctx: { hens }
  update(dt, ctx) {
    this.timer -= dt;
    let flapping = false;
    switch (this.state) {
      case 'arrive': {
        this.alt += (HIGH - this.alt) * Math.min(1, dt);
        if (this.glideTo(this.orbitPoint(this.orbit), SPEED.circle * 1.4, dt) < 4) this.setState('circle', 3 + Math.random() * 2);
        flapping = true;
        break;
      }
      case 'circle': {
        this.orbit += dt * 1.0;
        this.glideTo(this.orbitPoint(this.orbit), SPEED.circle, dt);
        this.alt += (HIGH - this.alt) * Math.min(1, dt * 2);
        if (this.timer <= 0) {
          const hens = ctx.hens.filter((h) => h.visible && h.state === 'wander');
          if (hens.length) {
            this.target = hens[Math.floor(Math.random() * hens.length)];
            this.setState('warn', 1.3);
            this.events.push('warn');
          } else {
            this.timer = 2;
          }
        }
        break;
      }
      case 'warn':
        // One more slow turn while it picks its moment.
        this.orbit += dt * 0.6;
        this.glideTo(this.orbitPoint(this.orbit), SPEED.circle * 0.6, dt);
        if (this.timer <= 0) this.setState('dive');
        break;
      case 'dive': {
        const hen = this.target;
        const dist = this.glideTo(hen.feet, SPEED.dive, dt);
        this.alt = Math.max(5, Math.min(this.alt - dt * 30, dist * 0.55));
        if (dist < 6) {
          this.events.push('swooped');
          this.setState('climb', 1.4);
        }
        break;
      }
      case 'climb': {
        const dir = { x: Math.cos(this.heading), y: Math.sin(this.heading) };
        this.glideTo({ x: this.ground.x + dir.x * 20, y: this.ground.y + dir.y * 20 }, SPEED.climb, dt);
        this.alt = Math.min(HIGH, this.alt + dt * 45);
        flapping = true;
        if (this.timer <= 0) this.backToCircling();
        break;
      }
      case 'scared': {
        const away = normalize(this.ground.x - this.center.x || 1, this.ground.y - this.center.y - 30);
        this.glideTo({ x: this.ground.x + away.x * 40, y: this.ground.y + away.y * 40 }, SPEED.scared, dt);
        this.alt = Math.min(110, this.alt + dt * 90);
        flapping = true;
        if (this.timer <= 0) this.backToCircling();
        break;
      }
      case 'leave': {
        const far = { x: this.center.x + 420, y: this.center.y - 300 };
        this.alt = Math.min(140, this.alt + dt * 40);
        flapping = true;
        if (this.glideTo(far, SPEED.leave, dt) < 6) this.done = true;
        break;
      }
      default:
        break;
    }

    // A drone's propellers never stop.
    const { look } = this;
    if (flapping || !look.turns) this.anims.play(look.flap, true);
    else {
      this.anims.stop();
      this.setFrame(look.frame);
    }
    const turn = look.turns ? this.heading : 0;
    this.setPosition(this.ground.x, this.ground.y - this.alt);
    this.setRotation(turn);
    this.setScale(1 + Math.min(this.alt, 110) / 400);
    this.setDepth(8990);
    this.shade
      .setPosition(this.ground.x, this.ground.y)
      .setRotation(turn)
      .setAlpha(0.32 - Math.min(this.alt, 110) / 600)
      .setDepth(this.ground.y - 0.5);
    const hen = this.target;
    this.icon.setVisible(this.state === 'warn' && Boolean(hen));
    if (hen) this.icon.setPosition(hen.x, hen.y - 16);
  }

  backToCircling() {
    this.target = null;
    this.orbit = Math.atan2((this.ground.y - this.center.y) / ORBIT.ry, (this.ground.x - this.center.x) / ORBIT.rx);
    this.setState('arrive');
  }

  destroy(fromScene) {
    this.shade?.destroy();
    this.icon?.destroy();
    super.destroy(fromScene);
  }
}
