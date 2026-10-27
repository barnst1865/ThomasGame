// The title screen, with the farm slowly drifting by behind it.

import { GAME_WIDTH as W, GAME_HEIGHT as H, COLORS, TILE } from '../config.js';
import { buildFarm, POINTS, MAP_W } from '../world/farmMap.js';
import { buildFarmView } from '../world/farmView.js';
import { getBreed, getCoat } from '../data/breeds.js';
import { buildDogTexture } from '../art/textures.js';
import { loadSave, deleteSave } from '../systems/saveGame.js';
import { dateFromDay } from '../systems/calendar.js';
import { Controls } from '../input/controls.js';
import { sfx } from '../systems/sfx.js';
import { touchInput } from '../input/touch.js';
import { textStyle, drawPanel, Menu } from '../ui/widgets.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    this.save = loadSave();
    this.controls = new Controls(this);
    this.buildBackdrop();

    this.add.rectangle(0, 0, W, H, 0x1d2a1f, 0.4).setOrigin(0);
    this.add.rectangle(W / 2, 178, 560, 34, 0x1d2a1f, 0.55);
    const title = this.add
      .text(W / 2, 112, 'Paws & Pastures', textStyle(72, COLORS.paper, { fontStyle: 'bold' }))
      .setOrigin(0.5)
      .setStroke(COLORS.woodDark, 10)
      .setShadow(0, 6, '#1d2a1f', 0, true, true);
    this.tweens.add({ targets: title, y: 118, yoyo: true, repeat: -1, duration: 1800, ease: 'Sine.InOut' });
    this.add
      .text(W / 2, 178, "A cozy farm game where you're the farmer's dog", textStyle(20, COLORS.paper))
      .setOrigin(0.5)
      .setShadow(0, 2, '#1d2a1f', 0, false, true);

    const dog = this.save ? this.save.dog : { breedId: 'cattle-dog', coatId: 'blue', collar: 'red' };
    const breed = getBreed(dog.breedId);
    const key = buildDogTexture(this, breed, getCoat(breed, dog.coatId), dog.collar);
    this.add.image(W / 2, 290, 'shadow').setScale(6, 5).setAlpha(0.8);
    this.add.sprite(W / 2, 292, key, 'side-stand-0').setOrigin(0.5, 1).setScale(6).play(`${key}:idle-side`);

    this.showMainMenu();
    this.hint = this.add.text(W / 2, H - 22, '', textStyle(15, COLORS.paperDark)).setOrigin(0.5).setShadow(0, 2, '#1d2a1f', 0, false, true);
    this.cameras.main.fadeIn(500);
  }

  buildBackdrop() {
    const season = this.save ? dateFromDay(this.save.day).seasonIndex : 0;
    const box = this.add.container(0, 0);
    buildFarmView(this, buildFarm(), season, (obj) => {
      box.add(obj);
      return obj;
    });
    for (let i = 0; i < 4; i++) {
      const sheep = this.add.sprite(330 + i * 26, 400 + (i % 2) * 18, 'sheep', 'side-0').setOrigin(0.5, 1);
      sheep.setDepth(sheep.y).setFlipX(i % 2 === 0);
      box.add(sheep);
    }
    box.sort('depth');
    box.setScale(2);
    // Drift from the left edge of the farm to the right edge and back.
    const farthest = W - MAP_W * TILE * 2;
    box.setPosition(0, -(POINTS.houseDoor.y * 2 - H / 2) - 40);
    this.tweens.add({ targets: box, x: farthest, duration: 70000, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  clearMenu() {
    this.menu?.destroy();
    this.menuExtras?.forEach((o) => o.destroy());
    this.menu = null;
    this.menuExtras = [];
  }

  showMainMenu() {
    this.clearMenu();
    const options = [];
    if (this.save) {
      const date = dateFromDay(this.save.day);
      const label = `Continue with ${this.save.dog.name} (${date.season} ${date.dayOfSeason})`;
      options.push({ label, action: () => this.startFarm(this.save) });
    }
    options.push({ label: 'New game', action: () => (this.save ? this.confirmNewGame() : this.scene.start('ChooseDog')) });
    this.menu = new Menu(this, W / 2, 360, options, { width: 440, gap: 50, size: 24 });
  }

  confirmNewGame() {
    this.clearMenu();
    const g = this.add.graphics();
    drawPanel(g, W / 2 - 250, 318, 500, 66, { radius: 10 });
    const text = this.add
      .text(W / 2, 351, `Start over? ${this.save.dog.name}'s farm will be replaced.`, textStyle(18))
      .setOrigin(0.5);
    this.menuExtras = [g, text];
    this.menu = new Menu(
      this,
      W / 2,
      418,
      [
        { label: 'No, go back', action: () => this.showMainMenu() },
        { label: 'Yes, start over', action: () => this.newGame() },
      ],
      { width: 300, gap: 46, size: 22 },
    );
  }

  newGame() {
    deleteSave();
    this.scene.start('ChooseDog');
  }

  startFarm(save) {
    sfx.chime();
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Farm', { save }));
  }

  update() {
    const c = this.controls;
    c.update();
    const hint = touchInput.active ? 'Tap a button to start.' : 'Arrow keys to choose, Enter to pick. You can click too.';
    if (this.hint.text !== hint) this.hint.setText(hint);
    if (!this.menu) return;
    if (c.justPressed('up')) {
      this.menu.move(-1);
      sfx.blip();
    }
    if (c.justPressed('down')) {
      this.menu.move(1);
      sfx.blip();
    }
    if (c.justPressed('interact') || c.justPressed('pounce')) this.menu.choose();
  }
}
