// A truck or a car that drives along a route: the back view going up or
// down the screen, the side view going across. Parked, it's solid, so the
// dog walks around it.

const SPEED = 60; // pixels per second

export class Vehicle extends Phaser.GameObjects.Image {
  // kind: 'truck' or 'car' (textures `${kind}-back` and `${kind}-side`)
  constructor(scene, kind, x, y, { speed = SPEED, size = { w: 56, h: 14 } } = {}) {
    super(scene, x, y, `${kind}-back`);
    scene.add.existing(this);
    this.kind = kind;
    this.speed = speed;
    this.size = size;
    this.route = [];
    this.onArrive = null;
    this.blocker = null;
    this.setOrigin(0.5, 1).setDepth(y);
  }

  get moving() {
    return this.route.length > 0;
  }

  driveTo(points, onArrive = null) {
    this.unpark();
    this.route = points.map((p) => ({ x: p.x, y: p.y }));
    this.onArrive = onArrive;
  }

  park() {
    const { scene } = this;
    this.blocker = scene.add.zone(this.x, this.y - 8, this.size.w, this.size.h);
    scene.physics.add.existing(this.blocker, true);
    this.collider = scene.physics.add.collider(scene.dog, this.blocker);
  }

  unpark() {
    this.collider?.destroy();
    this.blocker?.destroy();
    this.collider = null;
    this.blocker = null;
  }

  update(dt) {
    if (this.route.length === 0) return;
    const next = this.route[0];
    const dx = next.x - this.x;
    const dy = next.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) {
      this.route.shift();
      if (this.route.length === 0) {
        const done = this.onArrive;
        this.onArrive = null;
        done?.();
      }
      return;
    }
    const step = Math.min(dist, this.speed * dt);
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
    const across = Math.abs(dx) > Math.abs(dy);
    this.setTexture(`${this.kind}-${across ? 'side' : 'back'}`).setFlipX(across && dx < 0);
    this.setDepth(this.y);
  }

  destroy(fromScene) {
    this.unpark();
    super.destroy(fromScene);
  }
}
