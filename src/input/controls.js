// Turns key presses and the on-screen touch controls into game actions
// ("bark", "dig", ...). The game only ever asks about actions, never about
// specific keys or buttons.

import { touchInput, isButtonDown } from './touch.js';

export const BINDINGS = {
  up: ['W', 'UP'],
  down: ['S', 'DOWN'],
  left: ['A', 'LEFT'],
  right: ['D', 'RIGHT'],
  run: ['SHIFT'],
  interact: ['E', 'ENTER'],
  pounce: ['SPACE'],
  bark: ['Q', 'B'],
  dig: ['F'],
  pause: ['ESC', 'P'],
  help: ['H'],
  mute: ['M'],
};

export class Controls {
  constructor(scene) {
    const KeyCodes = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {};
    for (const [action, names] of Object.entries(BINDINGS)) {
      this.keys[action] = names.map((name) => scene.input.keyboard.addKey(KeyCodes[name], true, false));
    }
    this.virtual = {};
    this.virtualMove = { x: 0, y: 0 };
    this.keyDown = {};
    this.raw = {};
    this.down = {};
    this.pressed = {};
    this.enabled = true;
  }

  // Call once per frame before reading actions, even while disabled, so a
  // key that is still held when controls come back doesn't count as a new press.
  update() {
    // The joystick also counts as the arrow keys (for menus), and pushing
    // it all the way means run.
    const stick = touchInput.move;
    const fromStick = {
      up: stick.y < -0.5,
      down: stick.y > 0.5,
      left: stick.x < -0.5,
      right: stick.x > 0.5,
      run: Math.hypot(stick.x, stick.y) > 0.92,
    };
    for (const action of Object.keys(BINDINGS)) {
      const key = this.keys[action].some((k) => k.isDown) || Boolean(this.virtual[action]);
      const raw = key || isButtonDown(action) || Boolean(fromStick[action]);
      this.keyDown[action] = key;
      this.pressed[action] = this.enabled && raw && !this.raw[action];
      this.down[action] = this.enabled && raw;
      this.raw[action] = raw;
    }
  }

  isDown(action) {
    return Boolean(this.down[action]);
  }

  justPressed(action) {
    return Boolean(this.pressed[action]);
  }

  // Forget a press so two things don't both react to it.
  consume(action) {
    this.pressed[action] = false;
  }

  moveVector() {
    if (!this.enabled) return { x: 0, y: 0 };
    // The joystick is analog: push it a little to walk slowly.
    const stick = touchInput.move;
    if (Math.hypot(stick.x, stick.y) > 0.2) return this.limit(stick.x, stick.y);
    const k = this.keyDown;
    const x = (k.right ? 1 : 0) - (k.left ? 1 : 0) + this.virtualMove.x;
    const y = (k.down ? 1 : 0) - (k.up ? 1 : 0) + this.virtualMove.y;
    return this.limit(x, y);
  }

  limit(x, y) {
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  setVirtual(action, isDown) {
    this.virtual[action] = isDown;
  }

  setVirtualMove(x, y) {
    this.virtualMove = { x, y };
  }
}
