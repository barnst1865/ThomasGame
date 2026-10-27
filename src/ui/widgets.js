// Shared look for panels, buttons and text on every screen.

import { FONT, COLORS } from '../config.js';

const hex = (color) => Phaser.Display.Color.HexStringToColor(color).color;

export const UI = {
  ink: hex(COLORS.ink),
  paper: hex(COLORS.paper),
  paperDark: hex(COLORS.paperDark),
  wood: hex(COLORS.wood),
  woodDark: hex(COLORS.woodDark),
  leaf: hex('#5f9e4f'),
  good: hex('#4f9a3c'),
  warn: hex('#d9822b'),
  night: hex('#2b2f5a'),
};

export function textStyle(size, color = COLORS.ink, extra = {}) {
  return { fontFamily: FONT, fontSize: `${size}px`, color, ...extra };
}

// A wooden-framed paper panel, drawn into a Graphics object.
export function drawPanel(g, x, y, w, h, { fill = UI.paper, border = UI.woodDark, alpha = 1, radius = 8 } = {}) {
  g.fillStyle(UI.ink, 0.35 * alpha).fillRoundedRect(x + 2, y + 4, w, h, radius);
  g.fillStyle(border, alpha).fillRoundedRect(x, y, w, h, radius);
  g.fillStyle(fill, alpha).fillRoundedRect(x + 3, y + 3, w - 6, h - 6, Math.max(2, radius - 3));
  g.lineStyle(1, UI.paperDark, alpha).strokeRoundedRect(x + 5, y + 5, w - 10, h - 10, Math.max(2, radius - 5));
  return g;
}

export function drawCheckbox(g, x, y, state) {
  g.fillStyle(UI.woodDark, 1).fillRect(x, y, 14, 14);
  g.fillStyle(UI.paper, 1).fillRect(x + 2, y + 2, 10, 10);
  if (state === 'done') {
    g.fillStyle(UI.good, 1);
    g.fillRect(x + 3, y + 7, 2, 2);
    g.fillRect(x + 5, y + 9, 2, 2);
    g.fillRect(x + 7, y + 7, 2, 2);
    g.fillRect(x + 9, y + 5, 2, 2);
    g.fillRect(x + 11, y + 3, 2, 2);
  } else if (state === 'failed') {
    g.fillStyle(UI.warn, 1);
    for (let i = 0; i < 8; i++) {
      g.fillRect(x + 3 + i, y + 3 + i, 2, 2);
      g.fillRect(x + 10 - i, y + 3 + i, 2, 2);
    }
  }
}

// A row of menu options picked with up/down + Enter, or by clicking.
export class Menu {
  constructor(scene, x, y, options, { size = 24, gap = 40, width = 320 } = {}) {
    this.scene = scene;
    this.options = options;
    this.index = 0;
    this.items = options.map((opt, i) => {
      const bg = scene.add.graphics();
      const label = scene.add.text(x, y + i * gap, opt.label, textStyle(size)).setOrigin(0.5);
      const zone = scene.add.zone(x, y + i * gap, width, gap - 4).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => this.select(i));
      zone.on('pointerdown', () => {
        this.select(i);
        this.choose();
      });
      return { bg, label, zone, x, y: y + i * gap, width, height: gap - 6 };
    });
    this.render();
  }

  select(i) {
    this.index = (i + this.options.length) % this.options.length;
    this.render();
  }

  move(step) {
    this.select(this.index + step);
  }

  choose() {
    this.options[this.index].action();
  }

  render() {
    this.items.forEach((item, i) => {
      item.bg.clear();
      const on = i === this.index;
      if (on) drawPanel(item.bg, item.x - item.width / 2, item.y - item.height / 2, item.width, item.height, { fill: UI.paper, radius: 6 });
      item.label.setColor(on ? '#2b2024' : '#f6ecd2');
    });
  }

  setDepth(depth) {
    this.items.forEach((item) => {
      item.bg.setDepth(depth);
      item.label.setDepth(depth + 1);
    });
    return this;
  }

  destroy() {
    this.items.forEach((item) => {
      item.bg.destroy();
      item.label.destroy();
      item.zone.destroy();
    });
  }
}
