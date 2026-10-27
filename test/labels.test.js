import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keyLabel, howTo, fillControls } from '../src/input/labels.js';
import { touchInput } from '../src/input/touch.js';
import { fill } from '../src/data/dialogue.js';

test('control names follow the keyboard or the touch screen', () => {
  touchInput.active = false;
  assert.equal(keyLabel('dig'), 'F');
  assert.equal(howTo('interact'), 'press E');
  touchInput.active = true;
  assert.equal(keyLabel('dig'), 'Dig');
  assert.equal(howTo('interact'), 'tap Use');
  touchInput.active = false;
});

test('dialogue fills in the dog name and the right controls', () => {
  touchInput.active = false;
  assert.equal(fillControls('{Press dig} to dig, {name}.'), 'Press F to dig, {name}.');
  assert.equal(fill('{Press interact} to pick it up, {name}!', 'Ranger'), 'Press E to pick it up, Ranger!');
  touchInput.active = true;
  assert.equal(fill('Then {press dig} on the grass.', 'Ranger'), 'Then tap Dig on the grass.');
  touchInput.active = false;
});
