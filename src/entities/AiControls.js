// Steers a dog the way a player would, so another dog (Duke) can use the
// very same Dog class: it answers the same questions as Controls does.

import { normalize } from '../systems/steering.js';

export class AiControls {
  constructor() {
    this.move = { x: 0, y: 0 };
    this.running = false;
    this.pace = 1; // 1 is full speed; lower is slower
    this.stuck = 0;
    this.dodge = null;
  }

  moveVector() {
    return { x: this.move.x * this.pace, y: this.move.y * this.pace };
  }

  isDown(action) {
    return action === 'run' && this.running;
  }

  stop() {
    this.move = { x: 0, y: 0 };
    this.running = false;
  }

  // Head for a point. Returns how far away it still is. If the dog bumps
  // into something for a moment, it sidesteps around it.
  steer(dog, point, dt, { run = true, near = 4 } = {}) {
    const dx = point.x - dog.x;
    const dy = point.y - dog.y;
    const far = Math.hypot(dx, dy);
    if (far <= near) {
      this.stop();
      return far;
    }
    let dir = normalize(dx, dy);
    const blocked = dog.body && !dog.body.blocked.none;
    this.stuck = blocked ? this.stuck + dt : Math.max(0, this.stuck - dt);
    if (this.stuck > 0.3 && !this.dodge) this.dodge = { x: -dir.y, y: dir.x, time: 0.6 };
    if (this.dodge) {
      dir = normalize(dir.x * 0.3 + this.dodge.x, dir.y * 0.3 + this.dodge.y);
      this.dodge.time -= dt;
      if (this.dodge.time <= 0) {
        this.dodge = null;
        this.stuck = 0;
      }
    }
    this.move = dir;
    this.running = run && far > 30;
    return far;
  }
}
