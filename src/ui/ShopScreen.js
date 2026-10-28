// The Wagtail Wagon's shelves. Farmer Hazel buys the dog one thing from
// any open shelf. Shelves open as the dog's treat total grows (treats are
// never spent). Arrow keys or taps pick a reward.

import { GAME_WIDTH as W, COLORS } from '../config.js';
import { SHELVES, isShelfOpen, nextShelf, choicesFor } from '../data/shop.js';
import { NAMES } from '../data/characters.js';
import { buildDogPortrait } from '../art/textures.js';
import { UI, textStyle, drawPanel, textButton } from './widgets.js';

const PANEL = { x: 70, y: 28, w: 820, h: 484 };
const ROW_Y = 128;
const ROW_H = 86;
const CARD = { x: 286, w: 110, h: 80, gap: 8 };

// The little picture on each card: the dog wearing it, or the bed or roof.
export function itemIcon(scene, item, { breed, coat, look }) {
  if (item.slot === 'bed') return { key: `dog-bed-${item.look}`, scale: 2 };
  if (item.slot === 'house') return { key: `doghouse-${item.look}`, scale: 1 };
  return { key: buildDogPortrait(scene, breed, coat, { ...look, [item.slot]: item.look }), scale: 2 };
}

export class ShopScreen {
  // data: { treats, owned, breed, coat, look }; onDone(item | null | undefined)
  // gets the pick, null if there was nothing left, or undefined for "maybe later".
  constructor(scene, data, onDone) {
    this.scene = scene;
    this.data = data;
    this.onDone = onDone;
    this.parts = [];
    this.cards = [];
    this.choices = choicesFor(data.treats, data.owned);
    this.build();
    this.selected = this.cards.find((c) => c.pickable) ?? null;
    this.render();
  }

  add(obj) {
    this.parts.push(obj);
    return obj.setDepth?.(42) ?? obj;
  }

  build() {
    const { scene, data } = this;
    const P = PANEL;
    this.add(scene.add.rectangle(0, 0, W, 540, UI.ink, 0.6).setOrigin(0).setInteractive());
    this.add(drawPanel(scene.add.graphics(), P.x, P.y, P.w, P.h, { radius: 12 }));
    this.add(scene.add.text(W / 2, P.y + 28, `The ${NAMES.shop}`, textStyle(28, COLORS.ink, { fontStyle: 'bold' })).setOrigin(0.5));
    this.add(scene.add.text(W / 2, P.y + 56, `${NAMES.farmer} will buy you one thing. Pick anything from an open shelf!`, textStyle(15, COLORS.woodDark)).setOrigin(0.5));
    const next = nextShelf(data.treats);
    const progress = next ? `You've earned ${data.treats} treats. The next shelf opens at ${next.treats}.` : `You've earned ${data.treats} treats. Every shelf is open!`;
    this.add(scene.add.text(W / 2, P.y + 78, progress, textStyle(15, COLORS.ink)).setOrigin(0.5));

    this.cardLayer = this.add(scene.add.graphics());
    SHELVES.forEach((shelf, row) => {
      const y = ROW_Y + row * ROW_H;
      const open = isShelfOpen(shelf, data.treats);
      this.add(scene.add.text(P.x + 30, y + 14, shelf.name, textStyle(17, COLORS.ink, { fontStyle: 'bold', wordWrap: { width: 170 } })));
      this.add(scene.add.text(P.x + 30, y + 40, open ? 'Open!' : `Opens at ${shelf.treats} treats`, textStyle(13, open ? '#3f7a32' : COLORS.woodDark)));
      shelf.items.forEach((item, col) => {
        const x = CARD.x + col * (CARD.w + CARD.gap);
        const owned = data.owned.includes(item.id);
        const card = { item, row, col, x, y, open, owned, pickable: open && !owned };
        const icon = itemIcon(scene, item, data);
        card.icon = this.add(scene.add.image(x + CARD.w / 2, y + 26, icon.key).setScale(icon.scale));
        card.label = this.add(
          scene.add
            .text(x + CARD.w / 2, y + 50, item.name, textStyle(12, COLORS.ink, { align: 'center', wordWrap: { width: CARD.w - 8 } }))
            .setOrigin(0.5, 0),
        );
        if (!open || owned) {
          card.icon.setAlpha(0.35);
          card.label.setAlpha(0.5);
        }
        if (owned) this.add(scene.add.text(x + CARD.w - 8, y + 6, 'Yours', textStyle(11, '#3f7a32', { fontStyle: 'bold' })).setOrigin(1, 0));
        const zone = this.add(scene.add.zone(x + CARD.w / 2, y + CARD.h / 2, CARD.w, CARD.h).setInteractive({ useHandCursor: card.pickable }));
        zone.on('pointerdown', () => {
          if (!card.pickable) return;
          if (this.selected === card) this.pick();
          else this.select(card);
        });
        this.cards.push(card);
      });
    });

    const by = P.y + P.h - 30;
    if (this.choices.length === 0) {
      this.add(scene.add.text(W / 2, by - 34, "You have everything you can pick right now! Earn more treats to open the next shelf.", textStyle(14, COLORS.woodDark)).setOrigin(0.5));
      for (const part of textButton(scene, W / 2, by, 'Thank you!', () => this.finish(null), { width: 180, height: 38, size: 18 })) this.add(part);
      return;
    }
    for (const part of textButton(scene, W / 2 - 130, by, 'Maybe later', () => this.finish(undefined), { width: 180, height: 38, size: 18 })) this.add(part);
    for (const part of textButton(scene, W / 2 + 130, by, 'Pick it!', () => this.pick(), { width: 180, height: 38, size: 18, fill: 0xf2d28a })) this.add(part);
  }

  render() {
    const g = this.cardLayer.clear();
    for (const card of this.cards) {
      const on = card === this.selected;
      if (card.open && !card.owned) {
        drawPanel(g, card.x, card.y, CARD.w, CARD.h, { fill: on ? 0xfff3c4 : UI.paper, border: on ? 0xd9822b : UI.wood, radius: 6 });
      } else {
        g.fillStyle(UI.paperDark, 0.6).fillRoundedRect(card.x, card.y, CARD.w, CARD.h, 6);
        if (!card.open) drawLock(g, card.x + CARD.w - 16, card.y + 8);
      }
    }
  }

  select(card) {
    this.selected = card;
    this.render();
  }

  // Arrow keys hop between the things you can pick.
  move(dx, dy) {
    const from = this.selected;
    const pickable = this.cards.filter((c) => c.pickable);
    if (!from || pickable.length === 0) return;
    let best = null;
    let bestScore = Infinity;
    for (const c of pickable) {
      if (c === from) continue;
      const dr = c.row - from.row;
      const dc = c.col - from.col;
      if ((dx !== 0 && (Math.sign(dc) !== dx || dr !== 0)) || (dy !== 0 && Math.sign(dr) !== dy)) continue;
      const score = Math.abs(dr) * 10 + Math.abs(dc);
      if (score < bestScore) {
        best = c;
        bestScore = score;
      }
    }
    if (best) this.select(best);
  }

  pick() {
    if (this.selected?.pickable) this.finish(this.selected.item);
  }

  finish(result) {
    this.destroy();
    this.onDone(result);
  }

  // c: the HUD's controls
  update(c) {
    if (c.justPressed('left')) this.move(-1, 0);
    if (c.justPressed('right')) this.move(1, 0);
    if (c.justPressed('up')) this.move(0, -1);
    if (c.justPressed('down')) this.move(0, 1);
    if (c.justPressed('interact') || c.justPressed('pounce')) {
      if (this.choices.length === 0) this.finish(null);
      else this.pick();
    } else if (c.justPressed('pause')) {
      this.finish(this.choices.length === 0 ? null : undefined);
    }
  }

  destroy() {
    for (const part of this.parts) part.destroy();
    this.parts = [];
  }
}

function drawLock(g, x, y) {
  g.lineStyle(2, UI.woodDark, 1).strokeRoundedRect(x + 2, y, 6, 7, 3);
  g.fillStyle(UI.woodDark, 1).fillRect(x, y + 5, 10, 8);
}
