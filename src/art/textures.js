// Turns the pixel art and scenery drawings into Phaser textures and
// animations. Runs once when the game boots (and again for a new dog).

import { TILE } from '../config.js';
import { forEachPixel, spriteSize } from './pixelArt.js';
import { DOG_FRAMES, DOG_FRAME, dogFrameName, dogPicture, dogColors } from './dogSprites.js';
import {
  SHEEP,
  SHEEP_COLORS,
  CHICKEN,
  CHICKEN_COLORS,
  FARMER,
  FARMER_COLORS,
  WEASEL,
  WEASEL_COLORS,
  EGG,
  BONE,
  TREAT,
  HEART,
  HEART_EMPTY,
  HOLE,
  MOUND,
  BASKET,
  DOG_BED,
  EXCLAIM,
  QUESTION,
  ZZZ,
  SUN,
  MOON,
} from './sprites.js';
import {
  drawGround,
  drawTree,
  drawHouse,
  drawCoop,
  drawDoghouse,
  drawTrough,
  drawScarecrow,
  drawSign,
  drawMailbox,
  drawFence,
  drawGate,
  drawGlow,
  TREE_W,
  TREE_H,
} from './scenery.js';
import { MAP_W, MAP_H } from '../world/farmMap.js';

function canvasTexture(scene, key, width, height, draw) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, width, height);
  draw(tex.getCanvas(), tex.getContext());
  tex.refresh();
  return tex;
}

function paint(ctx, rows, colors, ox = 0, oy = 0) {
  forEachPixel(rows, colors, (x, y, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + x, oy + y, 1, 1);
  });
}

export function pixelTexture(scene, key, rows, colors) {
  const { width, height } = spriteSize(rows);
  return canvasTexture(scene, key, width, height, (canvas, ctx) => paint(ctx, rows, colors));
}

// Several same-sized pictures side by side, each one a named frame.
export function sheetTexture(scene, key, frames, width, height) {
  const tex = canvasTexture(scene, key, width * frames.length, height, (canvas, ctx) => {
    frames.forEach(([, rows, colors], i) => paint(ctx, rows, colors, i * width, 0));
  });
  frames.forEach(([name], i) => tex.add(name, 0, i * width, 0, width, height));
  return tex;
}

function anim(scene, key, texture, frames, frameRate, repeat = -1) {
  if (scene.anims.exists(key)) scene.anims.remove(key);
  scene.anims.create({ key, frames: frames.map((frame) => ({ key: texture, frame })), frameRate, repeat });
}

export function dogTextureKey(breedId, coatId, collar = 'red') {
  return `dog:${breedId}:${coatId}:${collar}`;
}

// Builds the sprite sheet and animations for one dog (breed + coat + collar).
export function buildDogTexture(scene, breed, coat, collar = 'red') {
  const key = dogTextureKey(breed.id, coat.id, collar);
  if (scene.textures.exists(key)) return key;
  const colors = dogColors(coat, collar);
  const frames = DOG_FRAMES.map(([dir, pose, tail]) => [dogFrameName(dir, pose, tail), dogPicture(breed, dir, pose, tail), colors]);
  sheetTexture(scene, key, frames, DOG_FRAME, DOG_FRAME);
  for (const dir of ['down', 'up', 'side']) {
    anim(scene, `${key}:idle-${dir}`, key, [`${dir}-stand-0`, `${dir}-stand-1`], 3);
    anim(scene, `${key}:walk-${dir}`, key, [`${dir}-walk1-0`, `${dir}-stand-0`, `${dir}-walk2-1`, `${dir}-stand-1`], 10);
  }
  return key;
}

export function buildGroundTexture(scene, tiles, seasonIndex) {
  const key = `ground-${seasonIndex}`;
  canvasTexture(scene, key, MAP_W * TILE, MAP_H * TILE, (canvas, ctx) => drawGround(ctx, tiles, seasonIndex));
  return key;
}

export function buildTreeTextures(scene, seasonIndex) {
  for (const variant of [0, 1]) {
    canvasTexture(scene, `tree-${seasonIndex}-${variant}`, TREE_W, TREE_H, (canvas) => drawTree(canvas, variant, seasonIndex));
  }
}

function basketWithEggs(count) {
  const rows = BASKET.rows.map((r) => r.split(''));
  const spots = [3, 6, 9, 5, 8];
  for (let i = 0; i < Math.min(count, spots.length); i++) {
    const x = spots[i];
    const y = i < 3 ? 2 : 1;
    rows[y][x] = 'e';
    rows[y][x + 1] = 'e';
    rows[y + 1][x] = 'e';
    rows[y + 1][x + 1] = 'E';
  }
  return rows.map((r) => r.join(''));
}

// Everything that doesn't depend on which dog you picked.
export function buildBaseTextures(scene) {
  const items = { egg: EGG, bone: BONE, treat: TREAT, heart: HEART, 'heart-empty': HEART_EMPTY, hole: HOLE, mound: MOUND, 'dog-bed': DOG_BED, exclaim: EXCLAIM, question: QUESTION, zzz: ZZZ, sun: SUN, moon: MOON };
  for (const [key, item] of Object.entries(items)) pixelTexture(scene, key, item.rows, item.colors);
  for (let n = 0; n <= 5; n++) {
    pixelTexture(scene, `basket-${n}`, basketWithEggs(n), { ...BASKET.colors, e: EGG.colors.w, E: EGG.colors.s });
  }

  sheetTexture(
    scene,
    'sheep',
    Object.entries(SHEEP).flatMap(([dir, frames]) => frames.map((rows, i) => [`${dir}-${i}`, rows, SHEEP_COLORS])),
    16,
    16,
  );
  anim(scene, 'sheep-walk-side', 'sheep', ['side-0', 'side-1'], 5);
  anim(scene, 'sheep-walk-down', 'sheep', ['down-0', 'down-1'], 5);
  anim(scene, 'sheep-walk-up', 'sheep', ['up-0', 'up-1'], 5);

  for (const [color, colors] of Object.entries(CHICKEN_COLORS)) {
    const key = `hen-${color}`;
    sheetTexture(scene, key, Object.entries(CHICKEN).map(([pose, rows]) => [pose, rows, colors]), 16, 16);
    anim(scene, `${key}-walk`, key, ['walk1', 'walk2'], 8);
    anim(scene, `${key}-peck`, key, ['walk1', 'peck', 'walk1', 'peck'], 4, 0);
  }

  sheetTexture(scene, 'farmer', Object.entries(FARMER).map(([name, rows]) => [name, rows, FARMER_COLORS]), 16, 24);
  for (const dir of ['down', 'up', 'side']) {
    anim(scene, `farmer-walk-${dir}`, 'farmer', [`${dir}-walk1`, `${dir}-stand`, `${dir}-walk2`, `${dir}-stand`], 7);
  }

  sheetTexture(scene, 'weasel', Object.entries(WEASEL).map(([pose, rows]) => [pose, rows, WEASEL_COLORS]), 16, 16);
  anim(scene, 'weasel-run', 'weasel', ['walk1', 'walk2'], 10);

  canvasTexture(scene, 'house', 112, 96, (canvas) => drawHouse(canvas));
  canvasTexture(scene, 'coop', 64, 58, (canvas) => drawCoop(canvas));
  canvasTexture(scene, 'doghouse', 32, 42, (canvas) => drawDoghouse(canvas, 'name'));
  canvasTexture(scene, 'trough', 32, 16, (canvas) => drawTrough(canvas));
  canvasTexture(scene, 'scarecrow', 16, 28, (canvas) => drawScarecrow(canvas));
  canvasTexture(scene, 'sign', 16, 20, (canvas) => drawSign(canvas));
  canvasTexture(scene, 'mailbox', 12, 18, (canvas) => drawMailbox(canvas));
  for (let mask = 0; mask < 16; mask++) canvasTexture(scene, `fence-${mask}`, 16, 16, (canvas) => drawFence(canvas, mask));
  canvasTexture(scene, 'gate-closed', 16, 48, (canvas) => drawGate(canvas, false));
  canvasTexture(scene, 'gate-open', 44, 16, (canvas) => drawGate(canvas, true));
  canvasTexture(scene, 'glow', 128, 128, (canvas) => drawGlow(canvas));

  // Tiny helpers: a blank tileset for collisions, a pixel for particles, a shadow.
  canvasTexture(scene, 'collision', TILE * 3, TILE, () => {});
  canvasTexture(scene, 'pixel', 2, 2, (canvas, ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 2, 2);
  });
  canvasTexture(scene, 'shadow', 12, 4, (canvas, ctx) => {
    ctx.fillStyle = 'rgba(30, 40, 20, 0.28)';
    ctx.fillRect(2, 0, 8, 4);
    ctx.fillRect(0, 1, 12, 2);
  });
}
