// Developer tool: shows every sprite big so the pixel art can be checked.
// Open http://localhost:8080/tools/preview.html after `npm start`.
import { BREEDS } from '../src/data/breeds.js';
import { DOG_FRAMES, dogPicture, dogColors } from '../src/art/dogSprites.js';
import { forEachPixel, flipX, spriteSize } from '../src/art/pixelArt.js';

const SCALE = Number(new URLSearchParams(location.search).get('scale')) || 5;
const out = document.getElementById('out');
const extra = await import('../src/art/sprites.js').catch((e) => { console.error(e); return null; });
const creatures = await import('../src/art/creatures.js').catch((e) => { console.error(e); return null; });

function draw(rows, colors, label, parent) {
  const { width, height } = spriteSize(rows);
  const canvas = document.createElement('canvas');
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext('2d');
  forEachPixel(rows, colors, (x, y, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
  });
  const fig = document.createElement('figure');
  fig.append(canvas);
  if (label) {
    const cap = document.createElement('figcaption');
    cap.textContent = label;
    fig.append(cap);
  }
  parent.append(fig);
}

for (const breed of BREEDS) {
  for (const coat of breed.coats) {
    const row = document.createElement('div');
    row.className = 'row';
    out.append(row);
    const colors = dogColors(coat);
    for (const [dir, pose, tail] of DOG_FRAMES) {
      draw(dogPicture(breed, dir, pose, tail), colors, `${dir} ${pose}${tail}`, row);
    }
    draw(flipX(dogPicture(breed, 'side', 'stand', 0)), colors, 'left', row);
    // Everything the dog can wear from the shop.
    for (const [neck, hat] of [['red', 'straw'], ['blue', 'beanie'], ['green', 'party'], ['rainbow', 'crown']]) {
      const look = { collar: 'gold', neck, hat };
      for (const dir of ['down', 'side', 'up']) draw(dogPicture(breed, dir, 'stand', 0, look), dogColors(coat, look), `${hat} ${dir}`, row);
    }
    const label = document.createElement('span');
    label.textContent = `${breed.name} (${coat.name})`;
    row.append(label);
  }
}

if (extra?.PREVIEW) {
  const row = document.createElement('div');
  row.className = 'row';
  out.append(row);
  for (const [name, rows, colors] of extra.PREVIEW()) draw(rows, colors, name, row);
}
if (creatures?.PREVIEW_CREATURES) {
  const row = document.createElement('div');
  row.className = 'row';
  out.append(row);
  for (const [name, rows, colors] of creatures.PREVIEW_CREATURES()) draw(rows, colors, name, row);
}
document.body.dataset.ready = '1';
