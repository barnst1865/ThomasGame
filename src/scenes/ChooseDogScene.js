// "Choose your dog": pick a breed and coat color, then give your dog a name.

import { GAME_WIDTH as W, GAME_HEIGHT as H, COLORS } from '../config.js';
import { BREEDS } from '../data/breeds.js';
import { buildDogTexture } from '../art/textures.js';
import { createNewSave } from '../systems/saveGame.js';
import { Controls } from '../input/controls.js';
import { sfx } from '../systems/sfx.js';
import { textStyle, drawPanel, textButton, UI } from '../ui/widgets.js';
import { touchInput } from '../input/touch.js';

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

    textButton(this, 250, 462, 'Pick this dog', () => this.mode === 'pick' && this.openNaming(), { width: 230, fill: 0xf2c45a });
    this.hint = this.add.text(W / 2, H - 20, '', textStyle(16, COLORS.paper)).setOrigin(0.5).setShadow(0, 2, '#1d2a1f', 0, false, true);

    this.input.keyboard.on('keydown', (event) => this.onKey(event));
    this.events.once('shutdown', () => this.closeNameBox());
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
    const tip = touchInput.active ? 'Tap the box to type a name.' : 'Type a name, then press Enter.';
    const help = this.add.text(W / 2, 312, tip, textStyle(16, COLORS.woodDark)).setOrigin(0.5);
    const back = textButton(this, W / 2 - 110, 354, 'Back', () => this.closeNaming(), { width: 160, height: 38, size: 18 });
    const start = textButton(this, W / 2 + 110, 354, 'Start!', () => this.submitName(), { width: 160, height: 38, size: 18, fill: 0xf2c45a });
    this.namingParts = [dim, g, ask, field, this.nameField, help, ...back, ...start];
    if (touchInput.active) this.openNameBox();
    this.updateNameField();
  }

  // On touch screens a real text box brings up the on-screen keyboard.
  openNameBox() {
    const box = document.createElement('input');
    box.type = 'text';
    box.maxLength = NAME_MAX;
    box.value = this.dogName;
    box.autocomplete = 'off';
    box.enterKeyHint = 'go';
    box.setAttribute('aria-label', "Your dog's name");
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.submitName();
      }
    });
    document.body.append(box);
    this.nameBox = box;
    this.nameField.setVisible(false);
    // Let letters like W, A, S and D reach the text box.
    this.input.keyboard.disableGlobalCapture();
    this.placeNameBox();
    this.scale.on('resize', this.placeNameBox, this);
  }

  placeNameBox() {
    const box = this.nameBox;
    if (!box) return;
    const r = this.game.canvas.getBoundingClientRect();
    const s = r.width / W;
    Object.assign(box.style, {
      position: 'fixed',
      left: `${r.left + (W / 2 - 176) * s}px`,
      top: `${r.top + 234 * s}px`,
      width: `${352 * s}px`,
      height: `${52 * s}px`,
      boxSizing: 'border-box',
      border: '0',
      borderRadius: '6px',
      padding: '0',
      background: '#ffffff',
      color: '#2b2024',
      textAlign: 'center',
      font: `${Math.max(16, Math.round(28 * s))}px "Pixelify Sans", ui-monospace, monospace`,
      outline: 'none',
      zIndex: '6',
      // The page turns text selection off; a text box needs it back on
      // (Safari won't let you type otherwise).
      userSelect: 'text',
      webkitUserSelect: 'text',
    });
  }

  closeNameBox() {
    if (!this.nameBox) return;
    this.nameBox.remove();
    this.nameBox = null;
    this.scale.off('resize', this.placeNameBox, this);
    this.input.keyboard.enableGlobalCapture();
  }

  submitName() {
    const typed = this.nameBox ? this.nameBox.value : this.dogName;
    const clean = [...typed].filter((ch) => NAME_CHARS.test(ch)).join('').trim().slice(0, NAME_MAX);
    this.startGame(clean || this.breed.defaultName);
  }

  closeNaming() {
    this.closeNameBox();
    this.namingParts.forEach((p) => p.destroy());
    this.mode = 'pick';
    this.skipFrame = true; // so the same Esc press doesn't also leave this screen
  }

  updateNameField() {
    const cursor = Math.floor(this.time.now / 450) % 2 === 0 ? '_' : ' ';
    this.nameField.setText(`${this.dogName}${this.dogName.length < NAME_MAX ? cursor : ''}`);
  }

  onKey(event) {
    if (this.mode !== 'name' || event.repeat || this.nameBox) return;
    if (event.key === 'Enter') {
      this.submitName();
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
    this.closeNameBox();
    this.mode = 'starting';
    const save = createNewSave({ name, breedId: this.breed.id, coatId: this.coat.id });
    sfx.bark(this.breed.barkPitch ?? 1);
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Farm', { save }));
  }

  update() {
    const c = this.controls;
    c.update();
    const hint = touchInput.active
      ? 'Tap the arrows to meet each dog, then tap "Pick this dog".'
      : 'Left / Right: breed     Up / Down: coat color     Enter: pick this dog';
    if (this.hint.text !== hint) this.hint.setText(hint);
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
