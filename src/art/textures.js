// Turns the pixel art and scenery drawings into Phaser textures and
// animations. Runs once when the game boots (and again for a new dog).

import { TILE } from '../config.js';
import { forEachPixel, spriteSize } from './pixelArt.js';
import { DOG_FRAMES, DOG_FRAME, dogFrameName, dogPicture, dogColors, lookOf } from './dogSprites.js';
import {
  SHEEP,
  SHEEP_COLORS,
  CHICKEN,
  CHICKEN_COLORS,
  FARMER,
  FARMER_COLORS,
  MAIL_CARRIER,
  MAIL_CARRIER_COLORS,
  SHOPKEEPER,
  SHOPKEEPER_COLORS,
  WEASEL,
  WEASEL_COLORS,
  CROW,
  CROW_COLORS,
  BALL,
  BOWL,
  BOWL_EMPTY,
  SUNRISE,
  SUNSET,
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
  RACCOON,
  RACCOON_COLORS,
  COYOTE,
  COYOTE_COLORS,
  WOLF,
  WOLF_COLORS,
  HAWK,
  HAWK_COLORS,
  LAMB,
  LAMB_COLORS,
  BUTTERFLY,
  BUTTERFLY_COLORS,
  WISP,
  WISP_COLORS,
  STICK,
  HAT,
  GLOVE,
  KEY,
  RIPPLE,
  SPARKLE,
  SCENT,
  PACKAGE,
  TOY_BOX,
  GIFT_ICONS,
  BED_COLORS,
} from './creatures.js';
import {
  drawGround,
  drawTree,
  drawHouse,
  drawCoop,
  drawDoghouse,
  drawVanBack,
  drawVanSide,
  ROOF_COLORS,
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

// `look` is what the dog wears: { collar, neck, hat } (or just a collar color).
export function dogTextureKey(breedId, coatId, look = 'red') {
  const { collar, neck, hat } = lookOf(look);
  return `dog:${breedId}:${coatId}:${collar}${neck ? `:n-${neck}` : ''}${hat ? `:h-${hat}` : ''}`;
}

// Builds the sprite sheet and animations for one dog (breed + coat + what it wears).
export function buildDogTexture(scene, breed, coat, look = 'red') {
  const key = dogTextureKey(breed.id, coat.id, look);
  if (scene.textures.exists(key)) return key;
  const colors = dogColors(coat, look);
  const worn = lookOf(look);
  const frames = DOG_FRAMES.map(([dir, pose, tail]) => [dogFrameName(dir, pose, tail), dogPicture(breed, dir, pose, tail, worn), colors]);
  sheetTexture(scene, key, frames, DOG_FRAME, DOG_FRAME);
  for (const dir of ['down', 'up', 'side']) {
    anim(scene, `${key}:idle-${dir}`, key, [`${dir}-stand-0`, `${dir}-stand-1`], 3);
    anim(scene, `${key}:walk-${dir}`, key, [`${dir}-walk1-0`, `${dir}-stand-0`, `${dir}-walk2-1`, `${dir}-stand-1`], 10);
  }
  return key;
}

// A single picture of the dog facing you, for menus (like the shop).
export function buildDogPortrait(scene, breed, coat, look = 'red') {
  const key = `${dogTextureKey(breed.id, coat.id, look)}:portrait`;
  if (!scene.textures.exists(key)) pixelTexture(scene, key, dogPicture(breed, 'down', 'stand', 0, lookOf(look)), dogColors(coat, look));
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
  const items = {
    egg: EGG,
    bone: BONE,
    treat: TREAT,
    ball: BALL,
    bowl: BOWL,
    'bowl-empty': BOWL_EMPTY,
    heart: HEART,
    'heart-empty': HEART_EMPTY,
    hole: HOLE,
    mound: MOUND,
    'dog-bed': DOG_BED,
    exclaim: EXCLAIM,
    question: QUESTION,
    zzz: ZZZ,
    sun: SUN,
    sunrise: SUNRISE,
    sunset: SUNSET,
    moon: MOON,
    stick: STICK,
    hat: HAT,
    glove: GLOVE,
    key: KEY,
    ripple: RIPPLE,
    sparkle: SPARKLE,
    scent: SCENT,
    package: PACKAGE,
    'toy-box': TOY_BOX,
  };
  for (const [key, item] of Object.entries(items)) pixelTexture(scene, key, item.rows, item.colors);
  for (const [id, icon] of Object.entries(GIFT_ICONS)) pixelTexture(scene, `gift-${id}`, icon.rows, icon.colors);
  for (const [look, colors] of Object.entries(BED_COLORS)) pixelTexture(scene, `dog-bed-${look}`, DOG_BED.rows, colors);
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

  // Grown-ups: Farmer Hazel and the visitors. Each walks the same way.
  const people = { farmer: [FARMER, FARMER_COLORS], 'mail-carrier': [MAIL_CARRIER, MAIL_CARRIER_COLORS], shopkeeper: [SHOPKEEPER, SHOPKEEPER_COLORS] };
  for (const [key, [frames, colors]] of Object.entries(people)) {
    sheetTexture(scene, key, Object.entries(frames).map(([name, rows]) => [name, rows, colors]), 16, 24);
    for (const dir of ['down', 'up', 'side']) {
      anim(scene, `${key}-walk-${dir}`, key, [`${dir}-walk1`, `${dir}-stand`, `${dir}-walk2`, `${dir}-stand`], 7);
    }
  }

  sheetTexture(scene, 'weasel', Object.entries(WEASEL).map(([pose, rows]) => [pose, rows, WEASEL_COLORS]), 16, 16);
  anim(scene, 'weasel-run', 'weasel', ['walk1', 'walk2'], 10);

  // Night prowlers: each has walk1, walk2 and crouch frames.
  const prowlers = { raccoon: [RACCOON, RACCOON_COLORS, 16, 16], coyote: [COYOTE, COYOTE_COLORS, 20, 16], wolf: [WOLF, WOLF_COLORS, 24, 18] };
  for (const [name, [frames, colors, w, h]] of Object.entries(prowlers)) {
    sheetTexture(scene, name, Object.entries(frames).map(([pose, rows]) => [pose, rows, colors]), w, h);
    anim(scene, `${name}-run`, name, ['walk1', 'walk2'], name === 'wolf' ? 8 : 10);
  }

  sheetTexture(scene, 'hawk', Object.entries(HAWK).map(([pose, rows]) => [pose, rows, HAWK_COLORS]), 16, 15);
  anim(scene, 'hawk-flap', 'hawk', ['glide', 'flap'], 6);

  sheetTexture(scene, 'lamb', Object.entries(LAMB).map(([pose, rows]) => [pose, rows, LAMB_COLORS]), 12, 12);
  anim(scene, 'lamb-walk', 'lamb', ['walk1', 'walk2'], 6);

  BUTTERFLY_COLORS.forEach(([a, A], i) => {
    const key = `butterfly-${i}`;
    sheetTexture(scene, key, Object.entries(BUTTERFLY).map(([pose, rows]) => [pose, rows, { a, A, o: '#2b2024', b: '#4a3326' }]), 11, 9);
    anim(scene, `${key}-flap`, key, ['open', 'closed'], 10);
  });

  for (const [kind, colors] of Object.entries(WISP_COLORS)) {
    const key = `wisp-${kind}`;
    sheetTexture(scene, key, Object.entries(WISP).map(([pose, rows]) => [pose, rows, colors]), 9, 10);
    anim(scene, `${key}-float`, key, ['a', 'b'], 4);
  }

  sheetTexture(scene, 'crow', Object.entries(CROW).map(([pose, rows]) => [pose, rows, CROW_COLORS]), 16, 16);
  anim(scene, 'crow-fly', 'crow', ['fly1', 'fly2'], 8);
  anim(scene, 'crow-peck', 'crow', ['perch', 'peck', 'perch', 'peck'], 5, 0);

  canvasTexture(scene, 'house', 112, 96, (canvas) => drawHouse(canvas));
  canvasTexture(scene, 'coop', 64, 58, (canvas) => drawCoop(canvas));
  canvasTexture(scene, 'doghouse', 32, 42, (canvas) => drawDoghouse(canvas, 'name'));
  for (const roof of Object.keys(ROOF_COLORS)) canvasTexture(scene, `doghouse-${roof}`, 32, 42, (canvas) => drawDoghouse(canvas, 'name', roof));
  canvasTexture(scene, 'van-back', 40, 36, (canvas) => drawVanBack(canvas));
  canvasTexture(scene, 'van-side', 64, 44, (canvas) => drawVanSide(canvas));
  canvasTexture(scene, 'trough', 32, 16, (canvas) => drawTrough(canvas));
  canvasTexture(scene, 'scarecrow', 16, 28, (canvas) => drawScarecrow(canvas));
  canvasTexture(scene, 'sign', 16, 20, (canvas) => drawSign(canvas));
  canvasTexture(scene, 'mailbox', 12, 18, (canvas) => drawMailbox(canvas));
  for (let mask = 0; mask < 16; mask++) canvasTexture(scene, `fence-${mask}`, 16, 16, (canvas) => drawFence(canvas, mask));
  canvasTexture(scene, 'gate-closed', 16, 48, (canvas) => drawGate(canvas, false));
  canvasTexture(scene, 'gate-open', 44, 16, (canvas) => drawGate(canvas, true));
  // Lights are drawn into the night layer at quarter size (see FarmScene.updateNight).
  for (const size of [8, 16, 32, 48]) canvasTexture(scene, `glow-${size}`, size, size, (canvas) => drawGlow(canvas));

  // Tiny helpers: a blank tileset for collisions, a pixel for particles, a shadow.
  canvasTexture(scene, 'collision', TILE * 4, TILE, () => {});
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
