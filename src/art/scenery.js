// Draws the farm's ground, trees and buildings with code, one pixel at a
// time, onto ordinary 2D canvases. Colors change with the season.

import { TILE } from '../config.js';
import { T, MAP_W, MAP_H, tileAt } from '../world/farmMap.js';
import { hash2 } from '../systems/rng.js';
import { darken, lighten, hexToRgb } from './pixelArt.js';

export const SEASON_COLORS = [
  {
    name: 'Spring',
    grass: '#7cc061',
    grassDark: '#62a64f',
    grassLight: '#98d677',
    flowers: ['#f7a8c4', '#fff1a1', '#ffffff', '#c3b0f7'],
    leaf: '#5aa64c',
    leafDark: '#3e7f3b',
    leafLight: '#86c968',
    crop: 'sprout',
  },
  {
    name: 'Summer',
    grass: '#6db552',
    grassDark: '#55983f',
    grassLight: '#8acb69',
    flowers: ['#ffd23f', '#ff8a5b', '#ffffff', '#6fb7ff'],
    leaf: '#47994a',
    leafDark: '#2f7438',
    leafLight: '#73bf5e',
    crop: 'tomato',
  },
  {
    name: 'Fall',
    grass: '#a9b45c',
    grassDark: '#8f9a47',
    grassLight: '#c4c777',
    flowers: ['#e0703a', '#f2b33d', '#a8483a'],
    leaf: '#d4843b',
    leafDark: '#a65a2b',
    leafLight: '#ebab58',
    crop: 'pumpkin',
  },
  {
    name: 'Winter',
    grass: '#e6eef3',
    grassDark: '#cad7e1',
    grassLight: '#ffffff',
    flowers: ['#c5d4de', '#ffffff'],
    leaf: '#4f7a62',
    leafDark: '#355a48',
    leafLight: '#e9f1f5',
    crop: 'bare',
  },
];

const OUTLINE = '#2e2420';

function pixel(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function box(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// Fills a circle with crisp pixel edges.
function disc(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y + r * 0.8));
    ctx.fillRect(cx - half, cy + y, half * 2 + 1, 1);
  }
}

// Adds a dark outline around everything already drawn on a canvas.
export function outlineCanvas(canvas, color = OUTLINE) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const img = ctx.getImageData(0, 0, width, height);
  const solid = (x, y) => x >= 0 && y >= 0 && x < width && y < height && img.data[(y * width + x) * 4 + 3] > 0;
  const rgb = hexToRgb(color);
  const out = ctx.createImageData(width, height);
  out.data.set(img.data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (solid(x, y)) continue;
      if (solid(x + 1, y) || solid(x - 1, y) || solid(x, y + 1) || solid(x, y - 1)) {
        const i = (y * width + x) * 4;
        out.data[i] = rgb.r;
        out.data[i + 1] = rgb.g;
        out.data[i + 2] = rgb.b;
        out.data[i + 3] = 255;
      }
    }
  }
  ctx.putImageData(out, 0, 0);
}

// ---------------------------------------------------------------- ground

export function drawGround(ctx, tiles, seasonIndex = 0) {
  const pal = SEASON_COLORS[seasonIndex] ?? SEASON_COLORS[0];
  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      const t = tiles[ty][tx];
      const x0 = tx * TILE;
      const y0 = ty * TILE;
      drawGrass(ctx, x0, y0, tx, ty, pal);
      if (t === T.FLOWERS) drawFlowers(ctx, x0, y0, tx, ty, pal);
      else if (t === T.PATH) drawPath(ctx, tiles, x0, y0, tx, ty, pal);
      else if (t === T.CROP) drawCrop(ctx, tiles, x0, y0, tx, ty, pal);
      else if (t === T.WATER) drawWater(ctx, tiles, x0, y0, tx, ty, seasonIndex);
      else if (t === T.PORCH) drawPorch(ctx, x0, y0, tx);
      else if (t === T.TREE) drawForestFloor(ctx, x0, y0, tx, ty, pal);
    }
  }
}

function drawGrass(ctx, x0, y0, tx, ty, pal) {
  box(ctx, x0, y0, TILE, TILE, pal.grass);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const h = hash2(x0 + x, y0 + y, 3);
      if (h < 0.06) pixel(ctx, x0 + x, y0 + y, pal.grassDark);
      else if (h < 0.09) pixel(ctx, x0 + x, y0 + y, pal.grassLight);
    }
  }
  // Little tufts of grass.
  if (hash2(tx, ty, 11) < 0.35) {
    const x = x0 + 2 + Math.floor(hash2(tx, ty, 12) * 11);
    const y = y0 + 4 + Math.floor(hash2(tx, ty, 13) * 9);
    pixel(ctx, x, y, pal.grassDark);
    pixel(ctx, x + 2, y, pal.grassDark);
    pixel(ctx, x + 1, y + 1, pal.grassDark);
    pixel(ctx, x, y + 1, pal.grassDark);
    pixel(ctx, x + 2, y + 1, pal.grassDark);
  }
}

function drawFlowers(ctx, x0, y0, tx, ty, pal) {
  const n = 2 + Math.floor(hash2(tx, ty, 21) * 2);
  for (let i = 0; i < n; i++) {
    const x = x0 + 2 + Math.floor(hash2(tx, ty, 30 + i) * 11);
    const y = y0 + 2 + Math.floor(hash2(tx, ty, 40 + i) * 11);
    const color = pal.flowers[Math.floor(hash2(tx, ty, 50 + i) * pal.flowers.length)];
    pixel(ctx, x, y + 2, pal.grassDark);
    pixel(ctx, x - 1, y, color);
    pixel(ctx, x + 1, y, color);
    pixel(ctx, x, y - 1, color);
    pixel(ctx, x, y + 1, color);
    pixel(ctx, x, y, '#ffd84a');
  }
}

const isPathLike = (t) => t === T.PATH || t === T.PORCH || t === T.GATE;

function drawPath(ctx, tiles, x0, y0, tx, ty, pal) {
  const base = '#c9a271';
  box(ctx, x0, y0, TILE, TILE, base);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const h = hash2(x0 + x, y0 + y, 5);
      if (h < 0.08) pixel(ctx, x0 + x, y0 + y, '#b38a5b');
      else if (h < 0.13) pixel(ctx, x0 + x, y0 + y, '#dbbd8f');
    }
  }
  // Soft, bumpy grass edges where the path meets the grass.
  const edges = [
    [0, -1, (i, d) => [i, d]],
    [0, 1, (i, d) => [i, TILE - 1 - d]],
    [-1, 0, (i, d) => [d, i]],
    [1, 0, (i, d) => [TILE - 1 - d, i]],
  ];
  for (const [dx, dy, place] of edges) {
    const n = tileAt(tiles, tx + dx, ty + dy);
    if (isPathLike(n) || n === T.FENCE) continue;
    for (let i = 0; i < TILE; i++) {
      const depth = 1 + Math.floor(hash2(x0 + i * (dy !== 0 ? 1 : 0), y0 + i * (dx !== 0 ? 1 : 0), 9 + dx * 3 + dy) * 2);
      for (let d = 0; d < depth; d++) {
        const [x, y] = place(i, d);
        pixel(ctx, x0 + x, y0 + y, d === depth - 1 ? pal.grassDark : pal.grass);
      }
    }
  }
}

function drawCrop(ctx, tiles, x0, y0, tx, ty, pal) {
  const soil = pal.crop === 'bare' ? '#9c8571' : '#8a5a3a';
  box(ctx, x0, y0, TILE, TILE, soil);
  // Furrows.
  for (let y = 3; y < TILE; y += 5) box(ctx, x0, y0 + y, TILE, 1, darken(soil, 0.18));
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      if (hash2(x0 + x, y0 + y, 6) < 0.06) pixel(ctx, x0 + x, y0 + y, lighten(soil, 0.12));
    }
  }
  if (pal.crop === 'bare') {
    // Snow lies over the field, with the furrows just showing through.
    box(ctx, x0, y0, TILE, TILE, '#e3ebf0');
    for (let y = 3; y < TILE; y += 5) box(ctx, x0, y0 + y, TILE, 1, '#c3cfd8');
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        if (hash2(x0 + x, y0 + y, 8) < 0.05) pixel(ctx, x0 + x, y0 + y, '#9c8571');
      }
    }
    return;
  }
  // A plant in the middle of every crop tile.
  const cx = x0 + 8;
  const cy = y0 + 9;
  const leaf = '#4f9a3c';
  const leafDark = '#2f6a2a';
  if (pal.crop === 'sprout') {
    pixel(ctx, cx, cy + 1, leafDark);
    pixel(ctx, cx, cy, leaf);
    pixel(ctx, cx - 1, cy - 1, leaf);
    pixel(ctx, cx - 2, cy - 1, leaf);
    pixel(ctx, cx + 1, cy - 1, leaf);
    pixel(ctx, cx + 2, cy - 2, leaf);
    pixel(ctx, cx + 1, cy - 2, '#7cc061');
  } else if (pal.crop === 'tomato') {
    disc(ctx, cx, cy - 2, 3, leaf);
    pixel(ctx, cx - 2, cy, leafDark);
    pixel(ctx, cx + 2, cy, leafDark);
    pixel(ctx, cx - 1, cy - 3, '#e2483d');
    pixel(ctx, cx + 1, cy - 1, '#e2483d');
    pixel(ctx, cx + 2, cy - 3, '#e2483d');
  } else if (pal.crop === 'pumpkin') {
    pixel(ctx, cx - 3, cy - 3, leaf);
    pixel(ctx, cx + 3, cy - 3, leaf);
    disc(ctx, cx, cy - 1, 3, '#e8822f');
    box(ctx, cx - 1, cy - 4, 1, 6, '#c9671f');
    box(ctx, cx + 1, cy - 4, 1, 6, '#c9671f');
    box(ctx, cx, cy - 5, 1, 2, '#5c7a2a');
  }
}

function drawWater(ctx, tiles, x0, y0, tx, ty, seasonIndex) {
  const frozen = seasonIndex === 3;
  const base = frozen ? '#bfe3f2' : '#4c9fd6';
  box(ctx, x0, y0, TILE, TILE, base);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const h = hash2(x0 + x, y0 + y, 4);
      if (h < 0.025) {
        box(ctx, x0 + x, y0 + y, Math.min(3, TILE - x), 1, frozen ? '#ffffff' : '#9ad6f5');
      }
    }
  }
  const bank = frozen ? '#9ec6d8' : '#3a7fb0';
  const foam = frozen ? '#ffffff' : '#bfe9fb';
  if (tileAt(tiles, tx, ty - 1) !== T.WATER) {
    box(ctx, x0, y0, TILE, 2, '#6f8f4a');
    box(ctx, x0, y0 + 2, TILE, 1, bank);
  }
  if (tileAt(tiles, tx, ty + 1) !== T.WATER) box(ctx, x0, y0 + TILE - 1, TILE, 1, foam);
  if (tileAt(tiles, tx - 1, ty) !== T.WATER) box(ctx, x0, y0, 1, TILE, foam);
  if (tileAt(tiles, tx + 1, ty) !== T.WATER) box(ctx, x0 + TILE - 1, y0, 1, TILE, foam);
}

function drawPorch(ctx, x0, y0, tx) {
  box(ctx, x0, y0, TILE, TILE, '#b07a4a');
  for (let y = 0; y < TILE; y += 4) box(ctx, x0, y0 + y, TILE, 1, '#8a5a35');
  const seam = (tx * 7) % 12;
  for (let y = 0; y < TILE; y += 4) box(ctx, x0 + ((seam + y * 3) % 16), y0 + y + 1, 1, 3, '#8a5a35');
  box(ctx, x0, y0 + TILE - 2, TILE, 2, '#6e4428');
}

function drawForestFloor(ctx, x0, y0, tx, ty, pal) {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      if (hash2(x0 + x, y0 + y, 14) < 0.25) pixel(ctx, x0 + x, y0 + y, pal.grassDark);
    }
  }
}

// ----------------------------------------------------------------- trees

export const TREE_W = 32;
export const TREE_H = 40;

export function drawTree(canvas, variant, seasonIndex) {
  const pal = SEASON_COLORS[seasonIndex] ?? SEASON_COLORS[0];
  const ctx = canvas.getContext('2d');
  // Trunk.
  box(ctx, 13, 26, 6, 13, '#7a4f2e');
  box(ctx, 13, 26, 2, 13, '#916139');
  box(ctx, 17, 26, 2, 13, '#5e3b21');
  box(ctx, 11, 37, 10, 2, '#5e3b21');
  // Leafy top, built from a few overlapping circles.
  const blobs =
    variant % 2 === 0
      ? [
          [16, 15, 12],
          [9, 19, 7],
          [23, 19, 7],
          [16, 8, 8],
        ]
      : [
          [16, 16, 11],
          [8, 17, 7],
          [24, 15, 7],
          [15, 7, 7],
        ];
  for (const [x, y, r] of blobs) disc(ctx, x, y, r, pal.leafDark);
  for (const [x, y, r] of blobs) disc(ctx, x - 1, y - 1, r - 1, pal.leaf);
  for (const [x, y, r] of blobs) disc(ctx, x - 3, y - 3, Math.max(1, Math.floor(r / 2.5)), pal.leafLight);
  // A few leaf speckles.
  for (let i = 0; i < 14; i++) {
    const x = 6 + Math.floor(hash2(i, variant, 2) * 20);
    const y = 4 + Math.floor(hash2(i, variant, 3) * 20);
    pixel(ctx, x, y, pal.leafDark);
  }
  if (seasonIndex === 3) {
    for (const [x, y, r] of blobs) box(ctx, x - r + 3, y - r + 1, r * 2 - 6, 2, '#ffffff');
  }
  outlineCanvas(canvas);
}

// ------------------------------------------------------------- buildings

export function drawHouse(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width; // 112
  // Walls.
  box(ctx, 4, 40, W - 8, 56, '#f1e4c6');
  for (let y = 44; y < 96; y += 6) box(ctx, 4, y, W - 8, 1, '#d9c7a1');
  box(ctx, 4, 40, 3, 56, '#d9c7a1');
  box(ctx, W - 7, 40, 3, 56, '#c9b48b');
  // Door.
  box(ctx, 47, 66, 18, 30, '#7a4a2c');
  box(ctx, 49, 68, 14, 28, '#9a5f38');
  box(ctx, 55, 68, 2, 28, '#7a4a2c');
  pixel(ctx, 60, 82, '#e8c66c');
  pixel(ctx, 61, 82, '#e8c66c');
  // Windows with flower boxes.
  for (const wx of [14, 78]) {
    box(ctx, wx, 56, 20, 16, '#7a4a2c');
    box(ctx, wx + 2, 58, 16, 12, '#a8d8ea');
    box(ctx, wx + 2, 58, 16, 4, '#c8ecf6');
    box(ctx, wx + 9, 58, 2, 12, '#7a4a2c');
    box(ctx, wx + 2, 63, 16, 2, '#7a4a2c');
    box(ctx, wx - 1, 72, 22, 5, '#8a5a35');
    for (let i = 0; i < 6; i++) {
      pixel(ctx, wx + 1 + i * 3, 71, ['#f7a8c4', '#fff1a1', '#e25d6a'][i % 3]);
      pixel(ctx, wx + 2 + i * 3, 71, '#4f9a3c');
    }
  }
  // Roof: rows of red shingles.
  const roofTop = 6;
  const roofBottom = 48;
  for (let y = roofTop; y < roofBottom; y++) {
    const inset = Math.max(0, Math.floor((roofTop + 10 - y) * 0.9));
    const row = Math.floor((y - roofTop) / 5);
    box(ctx, inset, y, W - inset * 2, 1, row % 2 === 0 ? '#c4544a' : '#b54a41');
    if ((y - roofTop) % 5 === 4) box(ctx, inset, y, W - inset * 2, 1, '#8f3a33');
  }
  for (let y = roofTop; y < roofBottom; y += 5) {
    const offset = (Math.floor((y - roofTop) / 5) % 2) * 4;
    for (let x = offset; x < W; x += 8) box(ctx, x, y, 1, 4, '#a5443c');
  }
  box(ctx, 0, roofBottom - 2, W, 3, '#8f3a33');
  // Chimney.
  box(ctx, 84, 0, 12, 16, '#9a8a80');
  box(ctx, 84, 0, 12, 3, '#7c6e66');
  for (let y = 5; y < 16; y += 4) box(ctx, 84, y, 12, 1, '#7c6e66');
  outlineCanvas(canvas);
}

export function drawCoop(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width; // 64
  box(ctx, 3, 22, W - 6, 34, '#c75a48');
  for (let x = 6; x < W - 3; x += 5) box(ctx, x, 22, 1, 34, '#a84a3b');
  box(ctx, 3, 22, W - 6, 2, '#f3ead6');
  // Door with a white X.
  box(ctx, 24, 38, 16, 18, '#f3ead6');
  box(ctx, 26, 40, 12, 16, '#8a3a2f');
  for (let i = 0; i < 12; i++) {
    pixel(ctx, 26 + i, 40 + Math.floor(i * 1.3), '#f3ead6');
    pixel(ctx, 37 - i, 40 + Math.floor(i * 1.3), '#f3ead6');
  }
  // Little window.
  box(ctx, 9, 30, 10, 8, '#f3ead6');
  box(ctx, 10, 31, 8, 6, '#3b2b2a');
  box(ctx, 45, 30, 10, 8, '#f3ead6');
  box(ctx, 46, 31, 8, 6, '#3b2b2a');
  // Roof.
  for (let y = 2; y < 26; y++) {
    const inset = Math.max(0, Math.floor((12 - y) * 1.2));
    box(ctx, inset, y, W - inset * 2, 1, (Math.floor(y / 4) % 2 === 0) ? '#6b4a3a' : '#5c3f31');
  }
  box(ctx, 0, 24, W, 2, '#4a3127');
  outlineCanvas(canvas);
}

// Roof colors you can pick at the shop: [stripe, stripe, eave].
export const ROOF_COLORS = {
  red: ['#c4544a', '#b54a41', '#8f3a33'],
  blue: ['#4f78c0', '#3f66a8', '#2f4f8f'],
  yellow: ['#e2b33c', '#cf9f2a', '#a87f1f'],
};

export function drawDoghouse(canvas, name = '', roof = 'red') {
  const [roofA, roofB, eave] = ROOF_COLORS[roof] ?? ROOF_COLORS.red;
  const ctx = canvas.getContext('2d');
  box(ctx, 3, 16, 26, 24, '#c49056');
  for (let y = 19; y < 40; y += 4) box(ctx, 3, y, 26, 1, '#a8774a');
  // Round doorway.
  disc(ctx, 16, 32, 6, '#2e2018');
  box(ctx, 10, 32, 13, 8, '#2e2018');
  // Roof.
  for (let y = 2; y < 20; y++) {
    const inset = Math.max(0, Math.floor((14 - y) * 1.1));
    box(ctx, inset, y, 32 - inset * 2, 1, y % 4 < 2 ? roofA : roofB);
  }
  box(ctx, 0, 18, 32, 2, eave);
  if (name) box(ctx, 9, 21, 14, 4, '#f1e4c6');
  outlineCanvas(canvas);
}

// The Wagtail Wagon, a shop on wheels. Seen from behind while it drives up
// the road, and from the side once it's parked.
const VAN = { body: '#5aa9a0', dark: '#3f8a82', stripe: '#f6ecd2', awningA: '#e25d6a', awningB: '#fbf7ee', tire: '#2b2024', hub: '#9a9aa4' };

function pawPrint(ctx, x, y, color) {
  disc(ctx, x, y + 3, 3, color);
  for (const [dx, dy] of [[-3, -1], [-1, -3], [1, -3], [3, -1]]) pixel(ctx, x + dx, y + dy, color);
}

export function drawVanBack(canvas) {
  const ctx = canvas.getContext('2d');
  box(ctx, 6, 29, 6, 6, VAN.tire);
  box(ctx, 28, 29, 6, 6, VAN.tire);
  box(ctx, 3, 3, 34, 27, VAN.body);
  box(ctx, 3, 3, 34, 3, VAN.dark);
  for (let x = 3; x < 37; x += 4) box(ctx, x, 6, 2, 3, VAN.awningA);
  for (let x = 5; x < 37; x += 4) box(ctx, x, 6, 2, 3, VAN.awningB);
  box(ctx, 19, 10, 1, 17, VAN.dark);
  box(ctx, 3, 18, 34, 2, VAN.stripe);
  pawPrint(ctx, 12, 11, VAN.stripe);
  pawPrint(ctx, 27, 11, VAN.stripe);
  box(ctx, 4, 22, 3, 4, '#e25d6a');
  box(ctx, 33, 22, 3, 4, '#e25d6a');
  box(ctx, 1, 27, 38, 3, VAN.hub);
  outlineCanvas(canvas);
}

export function drawVanSide(canvas) {
  const ctx = canvas.getContext('2d');
  // Cargo box (the shop) on the left, the cab on the right.
  box(ctx, 2, 6, 44, 30, VAN.body);
  box(ctx, 46, 14, 16, 22, VAN.body);
  box(ctx, 49, 16, 11, 8, '#bfe3f2');
  box(ctx, 50, 17, 3, 2, '#ffffff');
  box(ctx, 46, 26, 16, 1, VAN.dark);
  box(ctx, 2, 6, 44, 2, VAN.dark);
  // The shop window, full of goodies, under a striped awning.
  box(ctx, 6, 13, 36, 13, '#3a3036');
  for (const [x, color] of [[9, '#3f6fd4'], [15, '#f2c84b'], [21, '#e25d6a'], [27, '#3f9c55'], [33, '#8a5ad4']]) {
    box(ctx, x, 20, 4, 5, color);
    box(ctx, x + 1, 17, 2, 3, color);
  }
  for (let x = 4; x < 44; x += 4) {
    box(ctx, x, 9, 2, 4, VAN.awningA);
    box(ctx, x + 2, 9, 2, 4, VAN.awningB);
    pixel(ctx, x, 13, VAN.awningA);
    pixel(ctx, x + 2, 13, VAN.awningB);
  }
  box(ctx, 2, 28, 44, 3, VAN.stripe);
  pawPrint(ctx, 54, 30, VAN.stripe);
  box(ctx, 0, 34, 64, 3, VAN.hub);
  for (const cx of [13, 52]) {
    disc(ctx, cx, 37, 5, VAN.tire);
    disc(ctx, cx, 37, 2, VAN.hub);
  }
  outlineCanvas(canvas);
}

export function drawTrough(canvas) {
  const ctx = canvas.getContext('2d');
  box(ctx, 1, 3, 30, 12, '#8a5a35');
  box(ctx, 3, 5, 26, 6, '#e8c86a');
  for (let x = 4; x < 28; x += 3) pixel(ctx, x, 6 + (x % 2), '#c9a24a');
  box(ctx, 1, 11, 30, 2, '#6e4428');
  outlineCanvas(canvas);
}

export function drawScarecrow(canvas) {
  const ctx = canvas.getContext('2d');
  box(ctx, 7, 8, 2, 20, '#7a4f2e');
  box(ctx, 1, 12, 14, 2, '#7a4f2e');
  box(ctx, 4, 10, 8, 9, '#4f78b0');
  box(ctx, 4, 13, 8, 1, '#3d5f8e');
  disc(ctx, 8, 6, 3, '#e8c66c');
  pixel(ctx, 7, 6, '#2e2220');
  pixel(ctx, 9, 6, '#2e2220');
  box(ctx, 3, 2, 10, 2, '#8a5a35');
  box(ctx, 5, 0, 6, 3, '#8a5a35');
  pixel(ctx, 1, 14, '#e8c66c');
  pixel(ctx, 14, 14, '#e8c66c');
  outlineCanvas(canvas);
}

export function drawSign(canvas) {
  const ctx = canvas.getContext('2d');
  box(ctx, 7, 10, 2, 10, '#7a4f2e');
  box(ctx, 1, 2, 14, 9, '#c49056');
  box(ctx, 1, 9, 14, 2, '#a8774a');
  box(ctx, 3, 4, 9, 1, '#5e3b21');
  box(ctx, 3, 6, 6, 1, '#5e3b21');
  // Arrow pointing down the road.
  pixel(ctx, 12, 6, '#5e3b21');
  pixel(ctx, 11, 7, '#5e3b21');
  pixel(ctx, 13, 7, '#5e3b21');
  outlineCanvas(canvas);
}

export function drawMailbox(canvas) {
  const ctx = canvas.getContext('2d');
  box(ctx, 5, 8, 2, 10, '#7a4f2e');
  box(ctx, 1, 2, 10, 7, '#3f6fd4');
  box(ctx, 1, 2, 10, 2, '#5a86e0');
  box(ctx, 9, 0, 1, 4, '#d4483f');
  box(ctx, 10, 0, 2, 2, '#d4483f');
  outlineCanvas(canvas);
}

// ----------------------------------------------------------------- fences

const FENCE_WOOD = '#a8774a';
const FENCE_DARK = '#6e4a2c';
const FENCE_LIGHT = '#c99a64';

// mask bits: 1 = up, 2 = right, 4 = down, 8 = left
export function drawFence(canvas, mask) {
  const ctx = canvas.getContext('2d');
  const rail = (x, y, w, h) => {
    box(ctx, x, y, w, h, FENCE_WOOD);
    box(ctx, x, y, w, 1, FENCE_LIGHT);
  };
  if (mask & 8) {
    rail(0, 5, 8, 2);
    rail(0, 10, 8, 2);
  }
  if (mask & 2) {
    rail(8, 5, 8, 2);
    rail(8, 10, 8, 2);
  }
  if (mask & 1) box(ctx, 7, 0, 2, 4, FENCE_WOOD);
  if (mask & 4) box(ctx, 7, 12, 2, 4, FENCE_WOOD);
  // Post.
  box(ctx, 6, 2, 4, 12, FENCE_WOOD);
  box(ctx, 6, 2, 4, 2, FENCE_LIGHT);
  box(ctx, 9, 4, 1, 10, FENCE_DARK);
  outlineCanvas(canvas);
}

export function drawGate(canvas, open) {
  const ctx = canvas.getContext('2d');
  if (open) {
    // The gate swung open and lies along the fence outside the pen.
    for (const y of [5, 10]) {
      box(ctx, 2, y, canvas.width - 4, 2, FENCE_WOOD);
      box(ctx, 2, y, canvas.width - 4, 1, FENCE_LIGHT);
    }
    for (let x = 4; x < canvas.width - 2; x += 10) box(ctx, x, 4, 2, 9, FENCE_DARK);
  } else {
    box(ctx, 5, 0, 6, canvas.height, FENCE_WOOD);
    box(ctx, 5, 0, 1, canvas.height, FENCE_LIGHT);
    box(ctx, 10, 0, 1, canvas.height, FENCE_DARK);
    for (let y = 3; y < canvas.height; y += 8) box(ctx, 4, y, 8, 2, FENCE_DARK);
  }
  outlineCanvas(canvas);
}

// A soft round light, used to cut holes in the night darkness.
export function drawGlow(canvas) {
  const ctx = canvas.getContext('2d');
  const r = canvas.width / 2;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.7)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
