// What the on-screen touch controls are doing right now. Every Controls
// object reads this, so touch works in every scene.

export const touchInput = {
  active: false, // true while the player is using a touch screen
  move: { x: 0, y: 0 }, // the joystick, each axis from -1 to 1
  buttons: {}, // action name -> held down?
  pressedAt: {}, // action name -> when it was last pressed
};

// A quick tap can start and end between two frames of the game. Counting
// every press as held for a moment makes sure the game always notices it.
const TAP_HOLD_MS = 100;

export function pressButton(action, down) {
  touchInput.buttons[action] = down;
  if (down) touchInput.pressedAt[action] = performance.now();
}

export function isButtonDown(action) {
  return Boolean(touchInput.buttons[action]) || performance.now() - (touchInput.pressedAt[action] ?? -Infinity) < TAP_HOLD_MS;
}

const listeners = new Set();

export function onTouchModeChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function setActive(on) {
  if (touchInput.active === on) return;
  touchInput.active = on;
  if (!on) releaseAll();
  listeners.forEach((fn) => fn(on));
}

export function releaseAll() {
  touchInput.move = { x: 0, y: 0 };
  touchInput.buttons = {};
  touchInput.pressedAt = {};
}

// Touch mode turns on when the screen is touched and off when a key is
// pressed, so a laptop with a touch screen works either way.
export function watchForTouch() {
  if (globalThis.matchMedia?.('(pointer: coarse)').matches) setActive(true);
  globalThis.addEventListener('touchstart', () => setActive(true), { passive: true, capture: true });
  globalThis.addEventListener(
    'keydown',
    (event) => {
      if (event.target?.tagName !== 'INPUT') setActive(false); // typing a name doesn't count
    },
    { capture: true },
  );
}
