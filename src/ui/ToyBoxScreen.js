// The dog's toy box by the doghouse: change what you're wearing, the color
// of your bed and your doghouse roof, and look at the presents from the
// mail. Changes show up right away.

import { GAME_WIDTH as W, COLORS } from '../config.js';
import { ALL_ITEMS, STARTER_LOOK } from '../data/shop.js';
import { GIFTS } from '../data/gifts.js';
import { buildDogPortrait } from '../art/textures.js';
import { touchInput } from '../input/touch.js';
import { UI, textStyle, drawPanel, textButton } from './widgets.js';

const PANEL = { x: 90, y: 34, w: 780, h: 472 };
const SLOTS = [
  { slot: 'collar', label: 'Collar' },
  { slot: 'neck', label: 'Bandana' },
  { slot: 'hat', label: 'Hat' },
  { slot: 'bed', label: 'Dog bed' },
  { slot: 'house', label: 'Doghouse roof' },
];
const STARTER_NAMES = { collar: 'Red Collar', neck: 'None', hat: 'None', bed: 'Red Dog Bed', house: 'Red Roof' };
const ROW = { x: 400, y: 118, h: 46, valueX: 690 };

// Everything you could wear in a slot: the starter look plus what you own.
function optionsFor(slot, owned) {
  const starter = { look: STARTER_LOOK[slot], name: STARTER_NAMES[slot] };
  const mine = ALL_ITEMS.filter((item) => item.slot === slot && owned.includes(item.id)).map((item) => ({ look: item.look, name: item.name }));
  return [starter, ...mine];
}

export class ToyBoxScreen {
  // data: { owned, gifts, breed, coat, look: { collar, neck, hat, bed, house } }
  // onChange(slot, look) is called for every change; onClose() at the end.
  constructor(scene, data, onChange, onClose) {
    this.scene = scene;
    this.data = data;
    this.look = { ...data.look };
    this.onChange = onChange;
    this.onClose = onClose;
    this.parts = [];
    this.row = 0;
    this.giftIndex = 0;
    this.build();
    this.render();
  }

  add(obj) {
    this.parts.push(obj);
    return obj.setDepth?.(42) ?? obj;
  }

  get rows() {
    return SLOTS.length + 1; // the last row is the presents
  }

  build() {
    const { scene, data } = this;
    const P = PANEL;
    this.add(scene.add.rectangle(0, 0, W, 540, UI.ink, 0.6).setOrigin(0).setInteractive());
    this.add(drawPanel(scene.add.graphics(), P.x, P.y, P.w, P.h, { radius: 12 }));
    this.add(scene.add.text(W / 2, P.y + 28, 'Your toy box', textStyle(28, COLORS.ink, { fontStyle: 'bold' })).setOrigin(0.5));
    this.highlight = this.add(scene.add.graphics());
    this.portrait = this.add(scene.add.image(P.x + 140, P.y + 170, '__DEFAULT').setScale(7));
    this.bedIcon = this.add(scene.add.image(P.x + 100, P.y + 300, 'dog-bed').setScale(2));
    this.houseIcon = this.add(scene.add.image(P.x + 200, P.y + 292, 'doghouse').setScale(1.5));

    this.values = SLOTS.map(({ slot, label }, i) => {
      const y = ROW.y + i * ROW.h;
      this.add(scene.add.text(ROW.x - 60, y, label, textStyle(18, COLORS.ink)).setOrigin(0, 0.5));
      const value = this.add(scene.add.text(ROW.valueX, y, '', textStyle(17, COLORS.ink, { fontStyle: 'bold' })).setOrigin(0.5));
      for (const [dir, x] of [[-1, ROW.valueX - 130], [1, ROW.valueX + 130]]) {
        this.add(scene.add.text(x, y, dir < 0 ? '<' : '>', textStyle(24, COLORS.woodDark, { fontStyle: 'bold' })).setOrigin(0.5));
        const zone = this.add(scene.add.zone(x, y, 44, 40).setInteractive({ useHandCursor: true }));
        zone.on('pointerdown', () => {
          this.row = i;
          this.change(dir);
        });
      }
      return value;
    });

    // The presents from the mail.
    const gy = ROW.y + SLOTS.length * ROW.h + 14;
    this.add(scene.add.text(ROW.x - 60, gy, 'Presents from the mail', textStyle(18, COLORS.ink)).setOrigin(0, 0.5));
    this.giftIcons = GIFTS.map((gift, i) => {
      const x = ROW.x - 40 + i * 52;
      const has = data.gifts.includes(gift.id);
      const icon = this.add(scene.add.image(x, gy + 40, `gift-${gift.id}`).setScale(3));
      if (!has) icon.setTintFill(0x8a7a62).setAlpha(0.4);
      const zone = this.add(scene.add.zone(x, gy + 40, 46, 46).setInteractive({ useHandCursor: true }));
      zone.on('pointerdown', () => {
        this.row = SLOTS.length;
        this.giftIndex = i;
        this.render();
      });
      return icon;
    });
    this.giftText = this.add(scene.add.text(ROW.x - 60, gy + 74, '', textStyle(14, COLORS.woodDark, { wordWrap: { width: 470 } })));

    for (const part of textButton(scene, P.x + 140, P.y + P.h - 40, 'Done', () => this.close(), { width: 160, height: 40, size: 20 })) this.add(part);
    const how = touchInput.active ? 'Tap the arrows to change' : 'Arrow keys to change\nE or Esc when done';
    this.add(scene.add.text(P.x + 140, P.y + 370, how, textStyle(13, COLORS.woodDark, { align: 'center' })).setOrigin(0.5));
  }

  option(slot) {
    const options = optionsFor(slot, this.data.owned);
    const index = Math.max(0, options.findIndex((o) => o.look === this.look[slot]));
    return { options, index };
  }

  change(step) {
    if (this.row >= SLOTS.length) {
      this.giftIndex = (this.giftIndex + step + GIFTS.length) % GIFTS.length;
      this.render();
      return;
    }
    const { slot } = SLOTS[this.row];
    const { options, index } = this.option(slot);
    if (options.length < 2) {
      this.render();
      return;
    }
    const next = options[(index + step + options.length) % options.length];
    this.look[slot] = next.look;
    this.onChange(slot, next.look);
    this.render();
  }

  render() {
    const { scene, data } = this;
    const look = this.look;
    this.portrait.setTexture(buildDogPortrait(scene, data.breed, data.coat, { collar: look.collar, neck: look.neck, hat: look.hat }));
    this.bedIcon.setTexture(`dog-bed-${look.bed}`);
    this.houseIcon.setTexture(`doghouse-${look.house}`);
    SLOTS.forEach(({ slot }, i) => {
      const { options, index } = this.option(slot);
      this.values[i].setText(options[index].name);
      this.values[i].setColor(options.length > 1 ? COLORS.ink : COLORS.woodDark);
    });
    const g = this.highlight.clear();
    if (this.row < SLOTS.length) {
      g.fillStyle(0xfff3c4, 1).fillRoundedRect(ROW.x - 72, ROW.y + this.row * ROW.h - 20, 470, 40, 8);
      const { options } = this.option(SLOTS[this.row].slot);
      if (options.length < 2) this.giftText.setText(`Find more at the shop on wheels!`);
      else this.giftText.setText('');
    } else {
      const icon = this.giftIcons[this.giftIndex];
      g.lineStyle(3, 0xd9822b, 1).strokeRoundedRect(icon.x - 24, icon.y - 24, 48, 48, 8);
      const gift = GIFTS[this.giftIndex];
      this.giftText.setText(data.gifts.includes(gift.id) ? `${gift.name}: ${gift.about}` : 'Not here yet. Watch for the mail!');
    }
  }

  close() {
    for (const part of this.parts) part.destroy();
    this.parts = [];
    this.onClose();
  }

  // c: the HUD's controls
  update(c) {
    if (c.justPressed('up')) this.row = (this.row - 1 + this.rows) % this.rows;
    if (c.justPressed('down')) this.row = (this.row + 1) % this.rows;
    if (c.justPressed('left')) this.change(-1);
    else if (c.justPressed('right')) this.change(1);
    else if (c.justPressed('up') || c.justPressed('down')) this.render();
    if (c.justPressed('interact') || c.justPressed('pause') || c.justPressed('pounce')) this.close();
  }
}
