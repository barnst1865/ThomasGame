// Turns key presses into game actions ("bark", "dig", ...). The game only
// ever asks about actions, never about specific keys, so other inputs can
// be added later: a touch-screen joystick and buttons just need to call
// `setVirtual(action, isDown)` and `setVirtualMove(x, y)`.

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

// Shown on the help screen and in prompts.
export const KEY_LABELS = {
  move: 'WASD / Arrows',
  run: 'Shift',
  interact: 'E',
  pounce: 'Space',
  bark: 'Q',
  dig: 'F',
  pause: 'Esc',
  help: 'H',
  mute: 'M',
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
    this.raw = {};
    this.down = {};
    this.pressed = {};
    this.enabled = true;
  }

  // Call once per frame before reading actions, even while disabled, so a
  // key that is still held when controls come back doesn't count as a new press.
  update() {
    for (const action of Object.keys(BINDINGS)) {
      const raw = this.keys[action].some((k) => k.isDown) || Boolean(this.virtual[action]);
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
    let x = (this.isDown('right') ? 1 : 0) - (this.isDown('left') ? 1 : 0) + this.virtualMove.x;
    let y = (this.isDown('down') ? 1 : 0) - (this.isDown('up') ? 1 : 0) + this.virtualMove.y;
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
