// Names for the controls, for the keyboard or the touch screen, whichever
// the player is using.

import { touchInput } from './touch.js';

const KEYS = {
  move: 'WASD / Arrows',
  run: 'hold Shift',
  interact: 'E',
  pounce: 'Space',
  bark: 'Q',
  dig: 'F',
  pause: 'Esc',
  help: 'H',
  mute: 'M',
};

const TOUCH = {
  move: 'Joystick (left side)',
  run: 'Push the stick all the way',
  interact: 'Use',
  pounce: 'Pounce',
  bark: 'Bark',
  dig: 'Dig',
  pause: 'II',
  help: '?',
  mute: '',
};

// A short name for a control, like "E" or "Use".
export function keyLabel(action) {
  return (touchInput.active ? TOUCH : KEYS)[action];
}

// For sentences: "press F" or "tap Dig".
export function howTo(action) {
  return touchInput.active ? `tap ${TOUCH[action]}` : `press ${KEYS[action]}`;
}

// Fills "{press dig}" or "{Press dig}" placeholders in a sentence.
export function fillControls(text) {
  return text.replace(/\{(press|Press) (\w+)\}/g, (_, word, action) => {
    const phrase = howTo(action);
    return word === 'Press' ? phrase[0].toUpperCase() + phrase.slice(1) : phrase;
  });
}
