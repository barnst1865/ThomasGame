// "Choose your dog": pick a breed and coat color, then give your dog a name.

import { GAME_WIDTH as W, GAME_HEIGHT as H, COLORS } from '../config.js';
import { BREEDS } from '../data/breeds.js';
import { buildDogTexture } from '../art/textures.js';
import { createNewSave } from '../systems/saveGame.js';
import { Controls } from '../input/controls.js';
import { sfx } from '../systems/sfx.js';
import { textStyle, drawPanel, UI } from '../ui/widgets.js';

const NAME_MAX = 12;
const NAME_CHARS = /^[a-zA-Z0-9 '\-]$/;

export class ChooseDogScene extends Phaser.Scene {
  constructor() {
    super('ChooseDog');
  }

  create() {
    this.controls = new Controls(this);
    this.breedIndex = 0;
    this.coatIndex = 0;
    this.mode = 'pick';

    this.drawBackground();
    this.add
      .text(W / 2, 40, 'Choose your dog', textStyle(40, COLORS.paper, { fontStyle: 'bold' }))
      .setOrigin(0.5)
      .setStroke(COLORS.woodDark, 8);

    // The dog on its patch of grass.
    this.add.image(250, 372, 'shadow').setScale(12, 8).setAlpha(0.9);
    this.dog = this.add.sprite(250, 376, 'pixel').setOrigin(0.5, 1).setScale(11);
    this.arrowLeft = this.arrowButton(80, 290, -1, () => this.changeBreed(-1));
    this.arrowRight = this.arrowButton(420, 290, 1, () => this.changeBreed(1));
    this.dots = this.add.graphics();

    // Info card.
    const g = this.add.graphics();
    drawPanel(g, 470, 92, 450, 350, { radius: 12 });
    this.nameText = this.add.text(500, 116, '', textStyle(30, COLORS.ink, { fontStyle: 'bold', wordWrap: { width: 400 } }));
    this.blurbText = this.add.text(500, 166, '', textStyle(18, COLORS.ink, { wordWrap: { width: 400 }, lineSpacing: 4 }));
    this.perkBox = this.add.graphics();
    this.perkText = this.add.text(516, 0, '', textStyle(17, COLORS.woodDark, { wordWrap: { width: 370 }, lineSpacing: 3 }));
    this.add.text(500, 374, 'Coat color', textStyle(16, COLORS.woodDark));
    this.coatText = this.add.text(695, 404, '', textStyle(22, COLORS.ink, { fontStyle: 'bold' })).setOrigin(0.5);
    this.coatLeft = this.arrowButton(530, 404, -1, () => this.changeCoat(-1), 0.6);
    this.coatRight = this.arrowButton(860, 404, 1, () => this.changeCoat(1), 0.6);

    this.add
      .text(W / 2, H - 52, 'Left / Right: breed     Up / Down: coat color     Enter: choose', textStyle(17, COLORS.paper))
      .setOrigin(0.5)
      .setShadow(0, 2, '#1d2a1f', 0, false, true);
    this.add
      .text(W / 2, H - 24, 'Each dog is good at something different!', textStyle(15, COLORS.paperDark))
      .setOrigin(0.5)
      .setShadow(0, 2, '#1d2a1f', 0, false, true);

    this.input.keyboard.on('keydown', (event) => this.onKey(event));
    this.refresh();
    this.time.addEvent({ delay: 3500, loop: true, callback: () => this.showOff() });
    this.cameras.main.fadeIn(400);
  }

  drawBackground() {
    const g = this.add.graphics();
    g.fillStyle(0x9fd3e6, 1).fillRect(0, 0, W, H);
    g.fillStyle(0xc4e6f0, 1).fillRect(0, 0, W, 60);
    g.fillStyle(0x7cc061, 1).fillRect(0, 250, W, H - 250);
    g.fillStyle(0x62a64f, 1);
    for (let i = 0; i < 160; i++) {
      const x = (i * 97) % W;
      const y = 262 + ((i * 53) % (H - 270));
      g.fillRect(x, y, 4, 4);
    }
    // A fence along the back of the field.
    g.fillStyle(UI.woodDark, 1).fillRect(0, 236, W, 4).fillRect(0, 250, W, 4);
    for (let x = 10; x < W; x += 48) g.fillStyle(UI.wood, 1).fillRect(x, 222, 8, 40);
  }

  arrowButton(x, y, dir, onClick, scale = 1) {
    const g = this.add.graphics({ x, y });
    g.fillStyle(UI.woodDark, 1).fillCircle(0, 0, 26 * scale);
    g.fillStyle(UI.paper, 1).fillCircle(0, 0, 22 * scale);
    g.fillStyle(UI.woodDark, 1).fillTriangle(dir * 10 * scale, 0, -dir * 7 * scale, -11 * scale, -dir * 7 * scale, 11 * scale);
    const zone = this.add.zone(x, y, 60 * scale, 60 * scale).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      if (this.mode === 'pick') onClick();
    });
    return g;
  }

  get breed() {
    return BREEDS[this.breedIndex];
  }

  get coat() {
    return this.breed.coats[this.coatIndex];
  }

  changeBreed(step) {
    this.breedIndex = (this.breedIndex + step + BREEDS.length) % BREEDS.length;
    this.coatIndex = 0;
    sfx.blip();
    this.refresh();
    this.tweens.add({ targets: this.dog, scaleY: { from: 9.5, to: 11 }, duration: 220, ease: 'Back.Out' });
  }

  changeCoat(step) {
    const n = this.breed.coats.length;
    this.coatIndex = (this.coatIndex + step + n) % n;
    sfx.blip();
    this.refresh();
  }

  refresh() {
    const breed = this.breed;
    this.dogKey = buildDogTexture(this, breed, this.coat);
    this.dog.setTexture(this.dogKey, 'side-stand-0').play(`${this.dogKey}:idle-side`);
    this.nameText.setText(breed.name);
    this.blurbText.setY(this.nameText.y + this.nameText.height + 10).setText(breed.blurb);
    const perkY = this.blurbText.y + this.blurbText.height + 18;
    this.perkText.setY(perkY + 12).setText(breed.perk);
    this.perkBox.clear();
    this.perkBox.fillStyle(UI.paperDark, 1).fillRoundedRect(500, perkY, 400, this.perkText.height + 24, 8);
    this.coatText.setText(this.coat.name);
    const many = breed.coats.length > 1;
    this.coatLeft.setVisible(many);
    this.coatRight.setVisible(many);

    this.dots.clear();
    const gap = 22;
    const x0 = 250 - ((BREEDS.length - 1) * gap) / 2;
    BREEDS.forEach((b, i) => {
      this.dots.fillStyle(UI.woodDark, 1).fillCircle(x0 + i * gap, 420, 7);
      this.dots.fillStyle(i === this.breedIndex ? UI.paper : UI.wood, 1).fillCircle(x0 + i * gap, 420, 5);
    });
  }

  // Every few seconds the dog shows off: a wag, a bark, a little trot.
  showOff() {
    if (this.mode !== 'pick') return;
    const key = this.dogKey;
    const roll = Math.random();
    if (roll < 0.4) {
      this.dog.play(`${key}:walk-side`);
      this.time.delayedCall(900, () => this.dog.play(`${key}:idle-side`));
    } else if (roll < 0.7) {
      this.dog.play(`${key}:idle-down`);
      this.time.delayedCall(1400, () => this.dog.play(`${key}:idle-side`));
    }
  }

  // ------------------------------------------------------------ naming

  openNaming() {
    this.mode = 'name';
    this.dogName = this.breed.defaultName;
    this.nameEdited = false;
    sfx.chime();
    const dim = this.add.rectangle(0, 0, W, H, UI.ink, 0.6).setOrigin(0);
    const g = this.add.graphics();
    drawPanel(g, W / 2 - 260, 150, 520, 240, { radius: 12 });
    const ask = this.add.text(W / 2, 188, "What's your dog's name?", textStyle(28, COLORS.ink, { fontStyle: 'bold' })).setOrigin(0.5);
    const field = this.add.graphics();
    field.fillStyle(UI.woodDark, 1).fillRoundedRect(W / 2 - 180, 230, 360, 60, 8);
    field.fillStyle(0xffffff, 1).fillRoundedRect(W / 2 - 176, 234, 352, 52, 6);
    this.nameField = this.add.text(W / 2, 260, '', textStyle(30, COLORS.ink)).setOrigin(0.5);
    const help = this.add
      .text(W / 2, 330, 'Type a name, then press Enter.\nBackspace erases. Esc goes back.', textStyle(16, COLORS.woodDark, { align: 'center' }))
      .setOrigin(0.5);
    this.namingParts = [dim, g, ask, field, this.nameField, help];
    this.updateNameField();
  }

  closeNaming() {
    this.namingParts.forEach((p) => p.destroy());
    this.mode = 'pick';
    this.skipFrame = true; // so the same Esc press doesn't also leave this screen
  }

  updateNameField() {
    const cursor = Math.floor(this.time.now / 450) % 2 === 0 ? '_' : ' ';
    this.nameField.setText(`${this.dogName}${this.dogName.length < NAME_MAX ? cursor : ''}`);
  }

  onKey(event) {
    if (this.mode !== 'name' || event.repeat) return;
    if (event.key === 'Enter') {
      const name = this.dogName.trim() || this.breed.defaultName;
      this.startGame(name);
    } else if (event.key === 'Escape') {
      this.closeNaming();
    } else if (event.key === 'Backspace') {
      this.dogName = this.nameEdited ? this.dogName.slice(0, -1) : '';
      this.nameEdited = true;
    } else if (NAME_CHARS.test(event.key)) {
      if (!this.nameEdited) this.dogName = '';
      this.nameEdited = true;
      if (this.dogName.length < NAME_MAX) {
        const first = this.dogName.length === 0;
        this.dogName += first ? event.key.toUpperCase() : event.key;
      }
    }
    this.updateNameField();
  }

  startGame(name) {
    this.mode = 'starting';
    const save = createNewSave({ name, breedId: this.breed.id, coatId: this.coat.id });
    sfx.bark(this.breed.barkPitch ?? 1);
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Farm', { save }));
  }

  update() {
    const c = this.controls;
    c.update();
    if (this.mode === 'name') {
      this.updateNameField();
      return;
    }
    if (this.mode !== 'pick') return;
    if (this.skipFrame) {
      this.skipFrame = false;
      return;
    }
    if (c.justPressed('left')) this.changeBreed(-1);
    if (c.justPressed('right')) this.changeBreed(1);
    if (c.justPressed('up')) this.changeCoat(-1);
    if (c.justPressed('down')) this.changeCoat(1);
    if (c.justPressed('interact') || c.justPressed('pounce')) this.openNaming();
    if (c.justPressed('pause')) this.scene.start('Title');
  }
}
