// Sir Cluckington the rooster has an idea for some harmless mischief most
// days (see src/data/mischief.js). Talk to him to hear it. It's optional,
// earns a fancy feather, and Farmer Hazel always guesses whose idea it was.

import { TILE } from '../config.js';
import { POINTS, T, tileAt } from '../world/farmMap.js';
import { MISCHIEF, FEATHERS_FOR_CAP, mischiefFor } from '../data/mischief.js';
import { getItem } from '../data/shop.js';
import { NAMES } from '../data/characters.js';
import { LINES, pick } from '../data/dialogue.js';
import { buildDogPortrait } from '../art/textures.js';
import { sfx } from '../systems/sfx.js';

const MUDDY_TIME = 45; // seconds of muddy paws
const PORCH_PRINTS = 8; // muddy prints on the porch to finish the job
const PRINT_GAP = 9;
const SHEET_X = [-16, 0, 16]; // where the three sheets hang, from the middle of the line

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export class Mischief {
  // lostThing: what Farmer Hazel lost today (so he doesn't pick her hat that day)
  constructor(scene, lostThing) {
    this.scene = scene;
    this.idea = mischiefFor(scene.save.day, lostThing);
    this.offered = false;
    this.done = [];
    this.muddy = 0;
    this.walked = 0;
    this.lastSpot = null;
    this.printSide = 1;
    this.porchPrints = 0;
    this.carried = null;

    const line = POINTS.washingLine;
    scene.add.image(line.x, line.y, 'washing-line').setOrigin(0.5, 1).setDepth(line.y);
    this.sheets = SHEET_X.map((dx) => scene.add.image(line.x + dx, line.y - 24, 'sheet-hanging').setOrigin(0.5, 0).setDepth(line.y + 0.1));
    scene.add.image(POINTS.mud.x, POINTS.mud.y, 'mud').setDepth(-485);
    this.icon = scene.add.image(0, 0, 'exclaim').setVisible(false);
  }

  get rooster() {
    return this.scene.rooster;
  }

  get job() {
    return this.idea ? MISCHIEF[this.idea].job : null;
  }

  // A good loud crow to start the day.
  crow() {
    const { rooster, scene } = this;
    if (!rooster.visible) return;
    rooster.anims.play('rooster-peck');
    sfx.crow();
    scene.hud.bubble(rooster, 'Cock-a-doodle-doo!', 2, 18);
  }

  active(job) {
    return this.scene.tasks.isActive(job);
  }

  interaction(p, carried) {
    const { scene, rooster } = this;
    const nearRooster = rooster.visible && distance(rooster.feet, p) < 22;
    if (carried) {
      if (carried.kind === 'farmer-hat' && nearRooster) return { label: `Give the hat to ${NAMES.rooster}`, action: () => this.deliverHat() };
      if (carried.kind === 'sheet' && distance(POINTS.mud, p) < 26) return { label: 'Drag the sheet through the mud', action: () => this.muddySheet() };
      return null;
    }
    if (nearRooster) return { label: `Talk to ${NAMES.rooster}`, action: () => this.talk() };
    if (this.active('mischiefSheets') && distance(POINTS.washingLine, p) < 26 && this.sheets.some((s) => s.visible)) {
      return { label: 'Pull down a sheet', action: () => this.pullSheet() };
    }
    if (this.active('mischiefMud') && this.muddy <= 0 && distance(POINTS.mud, p) < 24) {
      return { label: 'Roll in the mud', action: () => this.rollInMud() };
    }
    if (this.active('mischiefHat') && this.behindFarmer(p)) return { label: 'Snatch her hat!', action: () => this.snatchHat() };
    return null;
  }

  talk() {
    const { scene } = this;
    const name = NAMES.rooster;
    if (this.idea && !this.offered && scene.plan.part.id !== 'night') {
      this.offered = true;
      const lines = [...(scene.save.flags.metRooster ? [] : [LINES.roosterHello]), ...MISCHIEF[this.idea].pitch];
      scene.save.flags.metRooster = true;
      scene.hud.dialogue(name, lines, () => {
        scene.tasks.add(this.job, 1, 'mischief');
        scene.hintOnce('mischief-optional', 'Mischief is just for fun. You can skip it!');
      });
      sfx.crow();
      return;
    }
    scene.hud.bubble(this.rooster, this.done.length ? pick(LINES.roosterDone) : pick(LINES.roosterIdle), 2, 18);
    sfx.cluck();
  }

  // -------------------------------------------------------- the sheets

  pullSheet() {
    const { scene } = this;
    const sheet = this.sheets.find((s) => s.visible);
    sheet.setVisible(false);
    const item = scene.spawnItem('sheet', sheet.x, sheet.y + 14);
    scene.dog.carry(item);
    sfx.flap();
    scene.hintOnce('sheet', 'Now drag it through the mud puddle! Bawk!');
  }

  muddySheet() {
    const { scene } = this;
    const item = scene.dog.carrying;
    scene.dog.carrying = null;
    scene.removeItem(item);
    scene.add.image(POINTS.mud.x + 4, POINTS.mud.y + 2, 'sheet-muddy').setDepth(-484);
    sfx.squelch();
    this.complete('mischiefSheets');
  }

  // ----------------------------------------------------------- the mud

  rollInMud() {
    const { scene } = this;
    const dog = scene.dog;
    this.muddy = MUDDY_TIME;
    dog.baseTint = 0xb08a6a;
    dog.restoreTint();
    sfx.squelch();
    scene.hud.bubble(dog, 'Squelch!', 1.2, 18);
    scene.hintOnce('mud', 'You are good and muddy! Now run back and forth across the porch.');
  }

  cleanUp() {
    const dog = this.scene.dog;
    this.muddy = 0;
    dog.baseTint = null;
    dog.restoreTint();
  }

  leavePrint() {
    const { scene } = this;
    const dog = scene.dog;
    const angle = Math.atan2(dog.y - this.lastSpot.y, dog.x - this.lastSpot.x);
    this.printSide *= -1;
    const off = this.printSide * 2;
    const x = dog.x - Math.sin(angle) * off;
    const y = dog.y - 2 + Math.cos(angle) * off;
    const print = scene.add.image(x, y, 'paw-mud').setRotation(angle + Math.PI / 2).setAlpha(0.85).setDepth(-470);
    const onPorch = tileAt(scene.tiles, Math.floor(x / TILE), Math.floor(y / TILE)) === T.PORCH;
    if (onPorch && this.active('mischiefMud')) {
      this.porchPrints += 1;
      if (this.porchPrints >= PORCH_PRINTS) this.complete('mischiefMud');
    }
    // Prints off the porch soon dry up and fade.
    if (!onPorch) scene.tweens.add({ targets: print, alpha: 0, delay: 8000, duration: 2000, onComplete: () => print.destroy() });
  }

  // ----------------------------------------------------------- the hat

  // Only while she's busy in the field, and only from behind.
  behindFarmer(p) {
    const farmer = this.scene.farmer;
    return (
      farmer.activity === 'field' &&
      farmer.arrived &&
      farmer.available &&
      !farmer.talking &&
      !farmer.hatless &&
      p.y > farmer.feet.y + 2 &&
      Math.abs(p.x - farmer.x) < 12 &&
      distance(p, farmer.feet) < 22
    );
  }

  snatchHat() {
    const { scene } = this;
    const farmer = scene.farmer;
    farmer.setHatless(true);
    const item = scene.spawnItem('farmer-hat', farmer.x, farmer.y - 20);
    scene.dog.carry(item);
    this.carried = item;
    sfx.pickup();
    scene.time.delayedCall(500, () => scene.hud.bubble(farmer, 'Hey! Where did my hat go?!', 2, 26));
    scene.hintOnce('hat', `Quick! Bring the hat to ${NAMES.rooster} in the coop yard.`);
  }

  deliverHat() {
    const { scene } = this;
    const item = scene.dog.carrying;
    scene.dog.carrying = null;
    scene.removeItem(item);
    this.carried = null;
    scene.hud.bubble(this.rooster, LINES.roosterHat, 2.4, 18);
    this.complete('mischiefHat');
  }

  // ----------------------------------------------------------- rewards

  complete(job) {
    const { scene } = this;
    if (!this.active(job)) return;
    scene.tasks.setProgress(job, 1);
    this.done.push(job);
    const save = scene.save;
    save.feathers += 1;
    sfx.chime();
    this.crow();
    if (save.feathers === FEATHERS_FOR_CAP) {
      const cap = getItem('hat-feather');
      if (!save.owned.includes(cap.id)) save.owned.push(cap.id);
      const icon = buildDogPortrait(scene, scene.breed, scene.coat, { ...scene.look(), hat: cap.look });
      scene.hud.showCard(icon, 'Feather Cap!', LINES.feathersCap);
    } else {
      const left = Math.max(0, FEATHERS_FOR_CAP - save.feathers);
      const text = left > 0 ? `Collect ${left} more for a surprise.` : 'What a fine collection of feathers!';
      scene.hud.showCard('feather', `Mischief managed! A fancy feather.`, text);
    }
  }

  // Dinner time: the hat finds its way home, and Farmer Hazel has things to say.
  atDinner() {
    const { scene } = this;
    if (scene.farmer.hatless) scene.farmer.setHatless(false);
    for (const item of scene.items.filter((i) => i.kind === 'farmer-hat')) {
      if (scene.dog.carrying === item) scene.dog.carrying = null;
      scene.removeItem(item);
    }
  }

  dinnerLines() {
    const lines = { mischiefSheets: LINES.dinnerSheets, mischiefHat: LINES.dinnerHat, mischiefMud: LINES.dinnerMud };
    return this.done.map((job) => lines[job]);
  }

  update(dt) {
    const { scene, rooster } = this;
    const waiting = this.idea && !this.offered && rooster.visible && scene.plan.part?.id !== 'night';
    this.icon.setVisible(Boolean(waiting));
    if (waiting) this.icon.setPosition(rooster.x, rooster.y - 18 + Math.sin(scene.time.now / 200) * 1.5).setDepth(rooster.y + 1);

    if (this.muddy > 0) {
      const dog = scene.dog;
      this.muddy -= dt;
      if (this.muddy <= 0 || dog.swimming) {
        this.cleanUp();
        return;
      }
      if (!this.lastSpot) this.lastSpot = { x: dog.x, y: dog.y };
      this.walked += distance(dog, this.lastSpot);
      if (this.walked >= PRINT_GAP) {
        this.walked = 0;
        this.leavePrint();
      }
      this.lastSpot = { x: dog.x, y: dog.y };
    }
  }
}

