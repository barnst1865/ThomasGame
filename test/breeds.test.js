import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BREEDS, getBreed, getCoat } from '../src/data/breeds.js';

test('the Australian Cattle Dog is one of the choices', () => {
  assert.ok(BREEDS.some((b) => b.name === 'Australian Cattle Dog'));
});

test('every breed is complete', () => {
  const ids = new Set();
  for (const breed of BREEDS) {
    assert.ok(!ids.has(breed.id), `duplicate id ${breed.id}`);
    ids.add(breed.id);
    assert.ok(breed.name && breed.blurb && breed.perk && breed.defaultName, breed.id);
    assert.ok(['pointy', 'floppy'].includes(breed.ears), breed.id);
    assert.ok(['long', 'fluffy', 'none'].includes(breed.tail), breed.id);
    assert.ok(breed.coats.length >= 1, breed.id);
    for (const coat of breed.coats) {
      assert.match(coat.palette.coat, /^#[0-9a-f]{6}$/i, `${breed.id}/${coat.id}`);
      for (const color of Object.values(coat.palette)) assert.match(color, /^#[0-9a-f]{6}$/i);
    }
    for (const key of ['speed', 'herdRadius', 'barkRadius', 'pounceDamage', 'carrySpeed']) {
      assert.equal(typeof breed.stats[key], 'number', `${breed.id} ${key}`);
    }
  }
});

test('unknown ids fall back to the first breed and coat', () => {
  assert.equal(getBreed('dragon'), BREEDS[0]);
  assert.equal(getCoat(BREEDS[0], 'plaid'), BREEDS[0].coats[0]);
});
