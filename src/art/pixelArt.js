// Turns text pictures into pixels. Each character in a sprite is one pixel;
// '.' means see-through. A palette maps the other characters to colors.

export function spriteSize(rows) {
  const width = rows[0]?.length ?? 0;
  for (const [i, row] of rows.entries()) {
    if (row.length !== width) {
      throw new Error(`Sprite row ${i} is ${row.length} wide, expected ${width}: "${row}"`);
    }
  }
  return { width, height: rows.length };
}

// Lays overlays on top of a base picture. Any non-'.' overlay pixel wins.
export function compose(base, ...overlays) {
  const out = base.map((row) => row.split(''));
  for (const overlay of overlays) {
    if (!overlay) continue;
    overlay.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] !== '.' && out[y]) out[y][x] = row[x];
      }
    });
  }
  return out.map((row) => row.join(''));
}

// Mirrors a picture left-to-right.
export function flipX(rows) {
  return rows.map((row) => row.split('').reverse().join(''));
}

// Calls draw(x, y, color) for every visible pixel. `colorFor` may be a
// palette object or a function (char, x, y) => color.
export function forEachPixel(rows, colorFor, draw) {
  const lookup = typeof colorFor === 'function' ? colorFor : (ch) => colorFor[ch];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const color = lookup(ch, x, y);
      if (color) draw(x, y, color);
    }
  });
}

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

// Mixes two hex colors. t=0 gives a, t=1 gives b.
export function mix(a, b, t) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex({ r: ca.r + (cb.r - ca.r) * t, g: ca.g + (cb.g - ca.g) * t, b: ca.b + (cb.b - ca.b) * t });
}

export const darken = (hex, t) => mix(hex, '#000000', t);
export const lighten = (hex, t) => mix(hex, '#ffffff', t);
