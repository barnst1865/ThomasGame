import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNewSave, parseSave, loadSave, writeSave, deleteSave, SAVE_KEY } from '../src/systems/saveGame.js';

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    data,
  };
}

test('a new save starts on day 1 with the chosen dog', () => {
  const save = createNewSave({ name: 'Ranger', breedId: 'cattle-dog', coatId: 'blue' });
  assert.equal(save.day, 1);
  assert.equal(save.treats, 0);
  assert.deepEqual(save.dog, { name: 'Ranger', breedId: 'cattle-dog', coatId: 'blue', collar: 'red' });
});

test('saves round-trip through storage', () => {
  const storage = memoryStorage();
  const save = createNewSave({ name: 'Skye', breedId: 'border-collie', coatId: 'black-white' });
  save.day = 4;
  save.treats = 17;
  save.buried.push({ tx: 20, ty: 25, item: 'bone' });
  assert.equal(writeSave(save, storage), true);
  assert.deepEqual(loadSave(storage), save);
});

test('broken or missing save data loads as null', () => {
  assert.equal(parseSave(''), null);
  assert.equal(parseSave('not json'), null);
  assert.equal(parseSave('{"version":1}'), null);
  assert.equal(parseSave('{"version":999,"dog":{"name":"A","breedId":"corgi"}}'), null);
  assert.equal(loadSave(memoryStorage()), null);
});

test('bad fields are cleaned up instead of crashing', () => {
  const text = JSON.stringify({
    version: 1,
    dog: { name: 'Waffles', breedId: 'corgi', coatId: 'red' },
    day: -3,
    treats: 'lots',
    buried: [{ tx: 1, ty: 2, item: 'bone' }, { tx: 'x' }, null],
    stats: { bonesBuried: 3, eggsCollected: 'many' },
  });
  const save = parseSave(text);
  assert.equal(save.day, 1);
  assert.equal(save.treats, 0);
  assert.deepEqual(save.buried, [{ tx: 1, ty: 2, item: 'bone' }]);
  assert.equal(save.stats.bonesBuried, 3);
  assert.equal(save.stats.eggsCollected, 0);
});

test('storage that throws does not break the game', () => {
  const angry = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
    removeItem() { throw new Error('blocked'); },
  };
  assert.equal(loadSave(angry), null);
  assert.equal(writeSave(createNewSave({ name: 'A', breedId: 'corgi' }), angry), false);
  assert.doesNotThrow(() => deleteSave(angry));
  assert.equal(loadSave(null), null);
});

test('deleteSave removes the save', () => {
  const storage = memoryStorage();
  writeSave(createNewSave({ name: 'A', breedId: 'corgi' }), storage);
  deleteSave(storage);
  assert.equal(storage.data.has(SAVE_KEY), false);
});
