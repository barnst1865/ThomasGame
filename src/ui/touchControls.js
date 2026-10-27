// On-screen controls for phones and tablets: a joystick on the left (it
// follows your thumb) and action buttons on the right. They only show while
// the dog is out on the farm and the player is using a touch screen.
// Menus and dialogue are tapped directly instead.

import { touchInput, onTouchModeChange, releaseAll, pressButton } from '../input/touch.js';

const STICK_REACH = 46; // how far (px) the knob moves for a full push
const FONT = '"Pixelify Sans", ui-monospace, monospace';

// Action buttons sit under the right thumb. Centers are measured in px
// from the bottom-right corner.
const ACTIONS = [
  { action: 'interact', label: 'Use', size: 78, right: 58, bottom: 62, font: 20, color: '#f2c45a' },
  { action: 'pounce', label: 'Pounce', size: 62, right: 152, bottom: 46, font: 13, color: '#f6ecd2' },
  { action: 'bark', label: 'Bark', size: 62, right: 52, bottom: 156, font: 16, color: '#f6ecd2' },
  { action: 'dig', label: 'Dig', size: 56, right: 134, bottom: 132, font: 16, color: '#f6ecd2' },
];

// Pause and help are small and tucked into the top-right corner.
const MENU = [
  { action: 'help', label: '?', size: 38, right: 23, bottom: 23, font: 16, color: '#e3d3ae' },
  { action: 'pause', label: 'II', size: 38, right: 69, bottom: 23, font: 16, color: '#e3d3ae' },
];

const ARIA = { interact: 'Use', pounce: 'Pounce', bark: 'Bark', dig: 'Dig', help: 'Help', pause: 'Pause' };

let root = null;
let showOnFarm = false;
let resetStick = () => {};

function el(tag, style, parent) {
  const node = document.createElement(tag);
  Object.assign(node.style, style);
  parent?.append(node);
  return node;
}

function circle(size, extra) {
  return {
    position: 'absolute',
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    boxSizing: 'border-box',
    ...extra,
  };
}

function refresh() {
  if (!root) return;
  const show = touchInput.active && showOnFarm;
  root.style.display = show ? 'block' : 'none';
  if (!show) {
    releaseAll();
    resetStick();
  }
}

// The farm calls this every frame: true while the dog can be moved around.
export function setTouchGameplay(on) {
  if (on === showOnFarm) return;
  showOnFarm = on;
  refresh();
}

export function installTouchControls() {
  root = el('div', {
    position: 'fixed',
    inset: '0',
    display: 'none',
    pointerEvents: 'none',
    zIndex: '5',
    userSelect: 'none',
    webkitUserSelect: 'none',
    webkitTouchCallout: 'none',
    touchAction: 'none',
  });
  root.addEventListener('contextmenu', (e) => e.preventDefault());
  document.body.append(root);

  // ------------------------------------------------------------ joystick
  const zone = el('div', { position: 'absolute', left: '0', top: '0', bottom: '0', width: '45%', pointerEvents: 'auto', touchAction: 'none' }, root);
  const base = el(
    'div',
    circle(120, { border: '3px solid rgba(94, 58, 38, 0.8)', background: 'rgba(246, 236, 210, 0.25)', transform: 'translate(-50%, -50%)' }),
    zone,
  );
  const knob = el(
    'div',
    circle(54, {
      left: '50%',
      top: '50%',
      marginLeft: '-27px',
      marginTop: '-27px',
      background: 'rgba(246, 236, 210, 0.9)',
      border: '3px solid #5e3a26',
      boxShadow: '0 3px 0 rgba(94, 58, 38, 0.6)',
    }),
    base,
  );

  let stickId = null;
  let origin = { x: 0, y: 0 };
  const rest = () => {
    // When nobody is touching it, the joystick waits faintly in the corner.
    base.style.left = 'calc(86px + env(safe-area-inset-left, 0px))';
    base.style.top = 'calc(100% - 86px - env(safe-area-inset-bottom, 0px))';
    base.style.opacity = '0.45';
    knob.style.transform = 'translate(0, 0)';
  };
  resetStick = () => {
    stickId = null;
    rest();
  };
  rest();

  const moveKnob = (e) => {
    let dx = e.clientX - origin.x;
    let dy = e.clientY - origin.y;
    const len = Math.hypot(dx, dy);
    if (len > STICK_REACH) {
      dx = (dx / len) * STICK_REACH;
      dy = (dy / len) * STICK_REACH;
    }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    touchInput.move = { x: dx / STICK_REACH, y: dy / STICK_REACH };
  };
  zone.addEventListener('pointerdown', (e) => {
    if (stickId !== null) return;
    e.preventDefault();
    stickId = e.pointerId;
    zone.setPointerCapture?.(e.pointerId);
    const box = zone.getBoundingClientRect();
    origin = { x: e.clientX, y: e.clientY };
    base.style.left = `${e.clientX - box.left}px`;
    base.style.top = `${e.clientY - box.top}px`;
    base.style.opacity = '1';
    moveKnob(e);
  });
  zone.addEventListener('pointermove', (e) => {
    if (e.pointerId === stickId) moveKnob(e);
  });
  const release = (e) => {
    if (e.pointerId !== stickId) return;
    touchInput.move = { x: 0, y: 0 };
    resetStick();
  };
  zone.addEventListener('pointerup', release);
  zone.addEventListener('pointercancel', release);

  // ------------------------------------------------------------- buttons
  const cluster = el(
    'div',
    {
      position: 'absolute',
      right: 'max(10px, env(safe-area-inset-right, 0px))',
      bottom: 'max(10px, env(safe-area-inset-bottom, 0px))',
      width: '200px',
      height: '190px',
      transformOrigin: '100% 100%',
    },
    root,
  );
  const corner = el(
    'div',
    {
      position: 'absolute',
      right: 'max(6px, env(safe-area-inset-right, 0px))',
      top: 'max(6px, env(safe-area-inset-top, 0px))',
      width: '92px',
      height: '46px',
      transformOrigin: '100% 0%',
    },
    root,
  );
  const buttons = [...ACTIONS.map((b) => [b, cluster]), ...MENU.map((b) => [b, corner])];
  for (const [b, parent] of buttons) {
    const button = el(
      'div',
      circle(b.size, {
        right: `${b.right - b.size / 2}px`,
        bottom: `${b.bottom - b.size / 2}px`,
        background: b.color,
        border: '3px solid #5e3a26',
        boxShadow: '0 4px 0 #5e3a26',
        color: '#2b2024',
        font: `700 ${b.font}px ${FONT}`,
        display: 'grid',
        placeItems: 'center',
        pointerEvents: 'auto',
        touchAction: 'none',
        opacity: '0.88',
      }),
      parent,
    );
    button.textContent = b.label;
    button.setAttribute('role', 'button');
    button.setAttribute('aria-label', ARIA[b.action]);
    const press = (down) => {
      pressButton(b.action, down);
      button.style.transform = down ? 'translateY(3px)' : '';
      button.style.boxShadow = down ? '0 1px 0 #5e3a26' : '0 4px 0 #5e3a26';
    };
    button.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      button.setPointerCapture?.(e.pointerId);
      press(true);
    });
    button.addEventListener('pointerup', () => press(false));
    button.addEventListener('pointercancel', () => press(false));
  }

  // Bigger screens get bigger buttons; short phone screens (sideways)
  // get smaller ones so they don't cover the farm.
  const fit = () => {
    const s = Math.min(1.1, Math.max(0.62, Math.min(window.innerHeight / 520, window.innerWidth / 420)));
    cluster.style.transform = `scale(${s})`;
    corner.style.transform = `scale(${Math.max(0.8, s)})`;
    base.style.scale = String(s);
  };
  fit();
  window.addEventListener('resize', fit);
  onTouchModeChange(refresh);
  refresh();
}
