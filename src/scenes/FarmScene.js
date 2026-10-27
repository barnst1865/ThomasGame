// The farm: one full day of herding, fetching, digging and guarding.
// Each new day restarts this scene with the saved progress.

import { TILE, WORLD_ZOOM, TIME, DOG, SHEEP, CHICKENS } from '../config.js';
import { buildFarm, T, MAP_W, MAP_H, AREAS, POINTS, areaPx, isSolid, isDiggable, tileAt, openTilesIn } from '../world/farmMap.js';
import { buildFarmView } from '../world/farmView.js';
import { Dog } from '../entities/Dog.js';
import { Sheep } from '../entities/Sheep.js';
import { Chicken } from '../entities/Chicken.js';
import { Farmer } from '../entities/Farmer.js';
import { Weasel } from '../entities/Weasel.js';
import { Item } from '../entities/Item.js';
import { getBreed, getCoat } from '../data/breeds.js';
import { TASKS } from '../data/tasks.js';
import { FARMER_NAME, LINES, fill, pick } from '../data/dialogue.js';
import { TaskBoard } from '../systems/taskBoard.js';
import { dateFromDay, formatDate, lighting, canSleep } from '../systems/calendar.js';
import { writeSave } from '../systems/saveGame.js';
import { insideRect } from '../systems/steering.js';
import { sfx } from '../systems/sfx.js';
import { Controls, KEY_LABELS } from '../input/controls.js';

const NIGHT_SCALE = 4;
const inset = (r, n) => ({ x: r.x + n, y: r.y + n, w: r.w - n * 2, h: r.h - n * 2 });
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export class FarmScene extends Phaser.Scene {
  constructor() {
    super('Farm');
  }

  init(data) {
    this.save = data.save;
  }

  create() {
    const save = this.save;
    this.breed = getBreed(save.dog.breedId);
    this.coat = getCoat(this.breed, save.dog.coatId);
    this.date = dateFromDay(save.day);
    this.tiles = buildFarm();
    this.minutes = TIME.dayStart;
    this.timeScale = 1;
    this.sleeping = false;
    this.flags = {};
    this.hintsShown = new Set();
    this.prompts = [];
    this.dayTreats = 0;
    this.treatFinds = 0;
    this.eggsInBasket = 0;
    this.items = [];
    this.holes = new Map();
    this.mounds = new Map();
    this.weasel = null;
    this.bark = null;
    this.barkTimer = 0;

    this.view = buildFarmView(this, this.tiles, this.date.seasonIndex);
    this.buildCollision();
    this.physics.world.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    this.penRect = inset(areaPx(AREAS.penInside), 4);
    this.penOuter = inset(areaPx(AREAS.pen), -6);
    this.roamRect = areaPx(AREAS.pasture);
    const gate = AREAS.penGate;
    this.gatePoint = { x: (gate.x + 1) * TILE, y: (gate.y + gate.h / 2) * TILE };
    this.penHome = { x: (AREAS.penInside.x + AREAS.penInside.w / 2) * TILE, y: this.gatePoint.y };
    this.yardRect = inset(areaPx(AREAS.coopYard), 4);

    this.createCharacters();
    this.createItems();
    this.createNight();

    const cam = this.cameras.main;
    cam.setZoom(WORLD_ZOOM).setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    cam.startFollow(this.dog, true, 0.12, 0.12);
    cam.setBackgroundColor('#2f5a2c');
    cam.fadeIn(700, 20, 26, 58);

    this.controls = new Controls(this);
    this.tasks = new TaskBoard(TASKS);
    this.tasks.add('herdSheep', this.sheep.length);
    this.tasks.add('collectEggs', CHICKENS.eggsPerDay);
    this.tasks.add('buryBone');
    this.weaselTime = Phaser.Math.Between(TIME.weaselEarliest, TIME.weaselLatest);

    this.scene.launch('Hud', { farm: this });
    this.hud = this.scene.get('Hud');
    this.events.once('shutdown', () => {
      this.anims.resumeAll();
      this.scene.stop('Hud');
    });
    this.time.delayedCall(500, () => this.morning());

    // Handy for poking at the game from the browser console.
    globalThis.pawsFarm = this;
  }

  // ------------------------------------------------------------- world

  buildCollision() {
    const data = this.tiles.map((row) => row.map((t) => (isSolid(t) ? 1 : t === T.GATE ? 2 : 0)));
    const map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage('collision', 'collision', TILE, TILE, 0, 0);
    this.collisionLayer = map.createLayer(0, tileset, 0, 0).setVisible(false);
    this.collisionLayer.setCollision(1);
    this.setGate(false);
  }

  setGate(closed) {
    this.gateClosed = closed;
    this.collisionLayer.setCollision(2, closed);
    this.view.gateClosed.setVisible(closed);
    this.view.gateOpen.setVisible(!closed);
  }

  isSolidAt(x, y) {
    const t = tileAt(this.tiles, Math.floor(x / TILE), Math.floor(y / TILE));
    return isSolid(t) || (t === T.GATE && this.gateClosed);
  }

  createCharacters() {
    const save = this.save;
    this.dog = new Dog(this, POINTS.dogWake.x, POINTS.dogWake.y, this.breed, this.coat, save.dog.collar);
    this.dog.body.setMass(3);
    this.physics.add.collider(this.dog, this.collisionLayer);

    this.sheepGroup = this.physics.add.group();
    const meadow = Phaser.Utils.Array.Shuffle(openTilesIn(this.tiles, AREAS.meadow, { diggableOnly: true }));
    this.sheep = [];
    for (let i = 0; i < SHEEP.count; i++) {
      const spot = meadow[i];
      const sheep = new Sheep(this, spot.x * TILE + 8, spot.y * TILE + 14);
      this.sheepGroup.add(sheep);
      sheep.setupBody();
      this.sheep.push(sheep);
    }
    this.physics.add.collider(this.sheepGroup, this.collisionLayer);
    this.physics.add.collider(this.sheepGroup, this.sheepGroup);
    this.physics.add.collider(this.dog, this.sheepGroup);

    this.henGroup = this.physics.add.group();
    const yard = Phaser.Utils.Array.Shuffle(openTilesIn(this.tiles, AREAS.coopYard, { diggableOnly: true }));
    this.chickens = [];
    for (let i = 0; i < CHICKENS.count; i++) {
      const spot = yard[i];
      const hen = new Chicken(this, spot.x * TILE + 8, spot.y * TILE + 12, i % 2 === 0 ? 'white' : 'brown');
      this.henGroup.add(hen);
      hen.setupBody();
      this.chickens.push(hen);
    }
    this.physics.add.collider(this.henGroup, this.collisionLayer);

    const firstDay = !save.flags.metFarmer;
    const start = firstDay ? { x: POINTS.dogWake.x + 24, y: POINTS.dogWake.y + 2 } : POINTS.farmerPorch;
    this.farmer = new Farmer(this, start.x, start.y);
  }

  createItems() {
    const spots = Phaser.Utils.Array.Shuffle(openTilesIn(this.tiles, AREAS.coopYard, { diggableOnly: true }));
    for (let i = 0; i < CHICKENS.eggsPerDay; i++) {
      const s = spots[i];
      this.spawnItem('egg', s.x * TILE + 4 + Math.random() * 8, s.y * TILE + 10 + Math.random() * 4);
    }
    this.spawnItem('bone', POINTS.bone.x, POINTS.bone.y);
    for (const b of this.save.buried) this.addMound(b.tx, b.ty);
  }

  spawnItem(kind, x, y) {
    const item = new Item(this, x, y, kind);
    this.items.push(item);
    return item;
  }

  removeItem(item) {
    this.items = this.items.filter((i) => i !== item);
    item.destroy();
  }

  addHole(tx, ty) {
    const key = `${tx},${ty}`;
    if (this.holes.has(key)) return;
    this.holes.set(key, this.add.image(tx * TILE + 8, ty * TILE + 9, 'hole').setDepth(-500));
  }

  removeHole(key) {
    this.holes.get(key)?.destroy();
    this.holes.delete(key);
  }

  addMound(tx, ty) {
    const key = `${tx},${ty}`;
    if (this.mounds.has(key)) return;
    this.mounds.set(key, this.add.image(tx * TILE + 8, ty * TILE + 10, 'mound').setDepth(-499).setAlpha(0.9));
  }

  removeMound(key) {
    this.mounds.get(key)?.destroy();
    this.mounds.delete(key);
  }

  createNight() {
    const w = MAP_W * TILE;
    const h = MAP_H * TILE;
    this.duskLayer = this.add.rectangle(0, 0, w, h, 0xff9a4a, 0).setOrigin(0).setDepth(9000);
    // The darkness is drawn at quarter size and smoothly stretched, which
    // keeps it cheap to redraw every frame and makes the light edges soft.
    this.nightLayer = this.add
      .renderTexture(0, 0, w / NIGHT_SCALE, h / NIGHT_SCALE)
      .setOrigin(0)
      .setScale(NIGHT_SCALE)
      .setDepth(9001)
      .setAlpha(0);
    this.nightLayer.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }

  eraseLight(x, y, size) {
    const s = size / NIGHT_SCALE;
    this.nightLayer.erase(`glow-${s}`, x / NIGHT_SCALE - s / 2, y / NIGHT_SCALE - s / 2);
  }

  updateNight() {
    const { darkness, dusk } = lighting(this.minutes);
    this.duskLayer.setAlpha(dusk * 0.45);
    for (const win of this.view.windows) win.setAlpha(Math.min(1, darkness * 2.2));
    if (darkness <= 0.01) {
      this.nightLayer.setVisible(false);
      return;
    }
    const rt = this.nightLayer.setVisible(true).setAlpha(darkness);
    rt.clear();
    rt.fill(0x141a3a, 1);
    for (const light of this.view.lights) this.eraseLight(light.x, light.y, light.size);
    // A little moonlight around the dog so you can always see where you are.
    this.eraseLight(this.dog.x, this.dog.y - 6, 128);
  }

  // ---------------------------------------------------------- the day

  morning() {
    const name = this.save.dog.name;
    if (!this.save.flags.metFarmer) {
      this.dog.facing = 'right';
      this.farmer.talking = true;
      this.hud.dialogue(FARMER_NAME, [...LINES.firstMorning.map((l) => fill(l, name)), { speaker: null, text: fill(pick(LINES.pet), name) }], () => {
        this.farmer.talking = false;
        this.save.flags.metFarmer = true;
        this.flags.petted = true;
        this.addFriendship(1);
        this.floatIcon('heart', this.dog.x, this.dog.y - 18);
      });
    } else {
      this.hud.toast(`Good morning, ${name}! It's ${formatDate(this.save.day)}.`);
      if (this.date.dayOfSeason === 1) this.hud.toast(`${this.date.season} is here!`, 'good');
    }
  }

  updateSchedule() {
    const m = this.minutes;
    const f = this.flags;
    if (!f.dusk && m >= TIME.bedtimeAllowed) {
      f.dusk = true;
      this.hud.toast('The sun is going down. Your bed is ready whenever you are.');
    }
    if (!f.hensToBed && m >= TIME.chickensToBed) {
      f.hensToBed = true;
      this.chickens.forEach((c) => c.goToBed(POINTS.coopDoor));
      if (this.farmer.available) this.hud.bubble(this.farmer, fill(LINES.night, this.save.dog.name), 3.5, 26);
    }
    if (!f.night && m >= TIME.nightfall) {
      f.night = true;
      this.tasks.add('guardCoop');
      this.hud.toast('Night has fallen. Keep the hens safe from weasels!', 'warn');
    }
    if (!f.weasel && m >= this.weaselTime) {
      f.weasel = true;
      this.spawnWeasel();
    }
    if (!this.sleeping && m >= TIME.midnight) this.endDay('midnight');
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.controls.update();
    const busy = !this.hud?.sys.isActive() || this.hud.isBusy() || this.sleeping;
    this.controls.enabled = !busy;
    if (busy) {
      if (!this.physics.world.isPaused) {
        this.physics.world.pause();
        this.anims.pauseAll();
      }
      this.updateNight();
      return;
    }
    if (this.physics.world.isPaused) {
      this.physics.world.resume();
      this.anims.resumeAll();
    }

    this.minutes += dt * TIME.gameMinutesPerSecond * this.timeScale;
    this.updateSchedule();
    if (this.sleeping) return;

    const c = this.controls;
    const dog = this.dog;
    dog.update(dt, c);
    if (c.justPressed('pounce') && dog.pounce()) sfx.pounce();
    if (c.justPressed('bark')) this.doBark();
    if (c.justPressed('dig')) this.doDig();
    const interaction = this.findInteraction();
    if (c.justPressed('interact') && interaction) interaction.action();

    this.updateSheep(dt);
    this.updateChickens(dt);
    this.farmer.update(dt, this.minutes, dog);
    this.updateWeasel(dt);

    this.barkTimer -= dt;
    if (this.barkTimer <= 0) this.bark = null;
    this.prompts = this.buildPrompts(this.findInteraction());
    this.updateNight();
  }

  // ---------------------------------------------------------- animals

  updateSheep(dt) {
    const ctx = {
      dog: this.dog,
      flock: this.sheep,
      herdRadius: DOG.herdRadius * this.breed.stats.herdRadius,
      bark: this.bark,
      penRect: this.penRect,
      roamRect: this.roamRect,
      gate: this.gateClosed ? null : this.gatePoint,
      home: this.penHome,
    };
    let penned = 0;
    for (const sheep of this.sheep) {
      sheep.update(dt, ctx);
      if (!sheep.penned && insideRect(sheep.feet, this.penRect)) {
        sheep.penned = true;
        sheep.target = null;
        this.save.stats.sheepPenned += 1;
        sfx.baa();
        this.hud.bubble(sheep, 'Baa!', 1.2, 16);
      }
      if (sheep.penned) penned += 1;
    }
    if (penned !== this.tasks.get('herdSheep').progress) this.progressTask('herdSheep', penned, true);
    if (penned === this.sheep.length && !this.gateClosed) {
      // Wait until the dog is out of the way so it doesn't get shut in.
      if (insideRect(this.dog.feet, this.penOuter)) {
        this.hintOnce('gate', 'All the sheep are in! Step away from the pen and the gate will swing shut.');
      } else {
        this.setGate(true);
        sfx.drop();
      }
    }
  }

  updateChickens(dt) {
    const ctx = { dog: this.dog, yardRect: this.yardRect };
    for (const hen of this.chickens) hen.update(dt, ctx);
  }

  spawnWeasel() {
    const path = [POINTS.weaselEntry, POINTS.weaselTurn, POINTS.coopDoor];
    const exit = [POINTS.weaselTurn, POINTS.weaselEntry, { x: POINTS.weaselEntry.x + 40, y: POINTS.weaselEntry.y }];
    this.weasel = new Weasel(this, path, exit);
    this.tasks.add('guardCoop');
    sfx.hiss();
    this.hud.toast('Something is sneaking toward the coop!', 'warn');
  }

  updateWeasel(dt) {
    const weasel = this.weasel;
    if (!weasel) return;
    const dog = this.dog;
    weasel.update(dt, { dog, coopDoor: POINTS.coopDoor });

    if (dog.mode === 'pounce' && !dog.pounceHits.has(weasel) && distance(dog.feet, weasel.feet) < 15) {
      dog.pounceHits.add(weasel);
      if (weasel.hit(DOG.pounceDamage * this.breed.stats.pounceDamage, dog.x, dog.y)) {
        sfx.hit();
        this.cameras.main.shake(90, 0.004);
      }
    }

    for (const event of weasel.events.splice(0)) {
      if (event === 'noticed') {
        sfx.hiss();
        this.hud.bubble(weasel, 'Hssss!', 1.2, 16);
      } else if (event === 'bitDog') {
        dog.stun(weasel.x, weasel.y);
        sfx.yelp();
        this.hud.bubble(dog, 'Yip!', 0.9, 18);
        this.hintOnce('lunge', 'Watch out for the lunge! Back away when you see the "!", then pounce.');
      } else if (event === 'defeated') {
        this.save.stats.weaselsChased += 1;
        this.progressTask('guardCoop', 1);
      } else if (event === 'stole') {
        this.tasks.fail('guardCoop');
        sfx.sad();
        this.hud.toast('Oh no! The weasel snuck off with an egg. Better luck tomorrow night.', 'warn');
      }
    }
    if (weasel.done) {
      weasel.destroy();
      this.weasel = null;
    }
  }

  // ------------------------------------------------------ dog actions

  doBark() {
    const dog = this.dog;
    if (dog.barkCooldown > 0 || dog.mode !== 'normal') return;
    dog.barkCooldown = DOG.barkCooldown;
    const radius = DOG.barkRadius * this.breed.stats.barkRadius;
    this.bark = { x: dog.x, y: dog.y - 3, radius };
    this.barkTimer = 0.15;
    sfx.bark(this.breed.barkPitch ?? 1);
    this.hud.bubble(dog, 'Woof!', 0.8, 18);

    const ring = this.add.circle(dog.x, dog.y - 6, 8).setStrokeStyle(1, 0xffffff, 0.9).setDepth(8999);
    this.tweens.add({ targets: ring, scale: radius / 8, alpha: 0, duration: 420, onComplete: () => ring.destroy() });

    if (this.weasel && distance(dog.feet, this.weasel.feet) < radius && this.weasel.startle()) {
      this.hud.bubble(this.weasel, '?!', 1, 16);
    }
    let clucked = false;
    for (const hen of this.chickens) {
      if (hen.visible && distance(dog.feet, hen.feet) < radius * 0.7 && hen.scare(dog.feet) && !clucked) {
        clucked = true;
        sfx.cluck();
      }
    }
  }

  digTarget() {
    const spot = this.dog.ahead(10);
    return { tx: Math.floor(spot.x / TILE), ty: Math.floor(spot.y / TILE) };
  }

  canDigAt(tx, ty) {
    return isDiggable(tileAt(this.tiles, tx, ty));
  }

  doDig() {
    const dog = this.dog;
    if (dog.mode !== 'normal') return;
    const { tx, ty } = this.digTarget();
    const key = `${tx},${ty}`;
    if (!this.canDigAt(tx, ty)) {
      this.hud.bubble(dog, '?', 0.8, 18);
      this.hintOnce('hard', 'The ground is too hard here. Try digging in the grass.');
      return;
    }
    if (dog.carrying?.kind === 'egg') {
      this.hud.bubble(dog, '...', 1, 18);
      this.hintOnce('egg', 'Eggs go in the basket, not in the ground!');
      return;
    }
    const buried = this.save.buried.some((b) => b.tx === tx && b.ty === ty);
    if (this.holes.has(key) && !buried && !dog.carrying) {
      this.hintOnce('dug', 'There is already a hole here. Nothing inside!');
      return;
    }
    dog.dig(() => this.finishDig(tx, ty));
    sfx.dig();
    this.time.addEvent({ delay: 110, repeat: 5, callback: () => this.spawnDirt(tx * TILE + 8, ty * TILE + 8) });
  }

  finishDig(tx, ty) {
    const dog = this.dog;
    const key = `${tx},${ty}`;
    const found = this.save.buried.findIndex((b) => b.tx === tx && b.ty === ty);
    if (found >= 0) {
      const [thing] = this.save.buried.splice(found, 1);
      this.removeMound(key);
      this.addHole(tx, ty);
      const item = this.spawnItem(thing.item, tx * TILE + 8, ty * TILE + 12);
      if (!dog.carrying) dog.carry(item);
      sfx.pickup();
      this.hud.bubble(dog, `Found my ${item.label}!`, 1.6, 18);
      return;
    }
    if (dog.carrying) {
      const item = dog.carrying;
      dog.carrying = null;
      this.removeItem(item);
      this.save.buried.push({ tx, ty, item: item.kind });
      this.removeHole(key);
      this.addMound(tx, ty);
      sfx.drop();
      if (item.kind === 'bone') {
        this.save.stats.bonesBuried += 1;
        this.progressTask('buryBone', 1);
      }
      return;
    }
    this.addHole(tx, ty);
    if (this.treatFinds < 2 && Math.random() < 0.12) {
      this.treatFinds += 1;
      this.save.treats += 1;
      this.dayTreats += 1;
      sfx.chime();
      this.floatIcon('treat', dog.x, dog.y - 20);
      this.hud.toast('You dug up a buried treat! +1 treat', 'good');
    }
  }

  spawnDirt(x, y) {
    for (let i = 0; i < 3; i++) {
      const bit = this.add.rectangle(x, y, 2, 2, i % 2 ? 0x8a5a35 : 0x5c3b22).setDepth(y + 2);
      this.tweens.add({
        targets: bit,
        x: x + (Math.random() - 0.5) * 22,
        y: y - 6 - Math.random() * 8,
        alpha: 0,
        duration: 380,
        ease: 'Quad.Out',
        onComplete: () => bit.destroy(),
      });
    }
  }

  findInteraction() {
    const dog = this.dog;
    if (dog.mode !== 'normal') return null;
    const p = dog.feet;
    const farmerNear = this.farmer.available && distance(this.farmer.feet, p) < 24;
    const carried = dog.carrying;
    if (carried) {
      if (carried.kind === 'egg') {
        if (farmerNear) return { label: `Give the egg to ${FARMER_NAME}`, action: () => this.deliverEgg(true) };
        if (distance(POINTS.basket, p) < 22) return { label: 'Put the egg in the basket', action: () => this.deliverEgg(false) };
      }
      if (farmerNear) return { label: `Talk to ${FARMER_NAME}`, action: () => this.talkToFarmer() };
      return { label: `Drop the ${carried.label}`, action: () => this.dropItem() };
    }
    let best = null;
    let bestDist = DOG.reach;
    for (const item of this.items) {
      if (item.carried) continue;
      const d = distance({ x: item.x, y: item.y - 3 }, p);
      if (d < bestDist) {
        best = item;
        bestDist = d;
      }
    }
    if (best) return { label: `Pick up the ${best.label}`, action: () => this.pickUp(best) };
    if (farmerNear) return { label: `Talk to ${FARMER_NAME}`, action: () => this.talkToFarmer() };
    if (distance(POINTS.dogBed, p) < 20) {
      return { label: canSleep(this.minutes) ? 'Go to sleep' : 'Lie down in your bed', action: () => this.trySleep() };
    }
    return null;
  }

  buildPrompts(interaction) {
    const prompts = [];
    if (interaction) prompts.push({ key: KEY_LABELS.interact, label: interaction.label });
    if (this.dog.carrying?.kind === 'bone' && this.dog.mode === 'normal') {
      const { tx, ty } = this.digTarget();
      if (this.canDigAt(tx, ty)) prompts.push({ key: KEY_LABELS.dig, label: 'Bury your bone here' });
    }
    return prompts;
  }

  pickUp(item) {
    this.dog.carry(item);
    sfx.pickup();
    if (item.kind === 'bone') this.hintOnce('bone', `Find a nice patch of grass and press ${KEY_LABELS.dig} to bury your bone.`);
    if (item.kind === 'egg') this.hintOnce('egg-carry', 'Bring the egg to the basket on the porch.');
  }

  dropItem() {
    this.dog.dropCarried();
    sfx.drop();
  }

  deliverEgg(toFarmer) {
    const item = this.dog.carrying;
    this.dog.carrying = null;
    this.removeItem(item);
    this.eggsInBasket += 1;
    this.view.basket.setTexture(`basket-${Math.min(5, this.eggsInBasket)}`);
    this.save.stats.eggsCollected += 1;
    sfx.pickup();
    if (toFarmer) this.hud.bubble(this.farmer, pick(LINES.eggThanks), 2, 26);
    this.progressTask('collectEggs', 1);
  }

  talkToFarmer() {
    const name = this.save.dog.name;
    const first = !this.flags.petted;
    const lines = [];
    if (first) lines.push(...pick(LINES.goodMorning));
    const remaining = this.tasks.remaining();
    lines.push(remaining.length > 0 ? LINES.hints[remaining[0].id] : pick(LINES.allDone));
    if (this.minutes >= TIME.bedtimeAllowed) lines.push(LINES.bedtime);
    const entries = lines.map((l) => fill(l, name));
    if (first) entries.push({ speaker: null, text: fill(pick(LINES.pet), name) });
    this.farmer.talking = true;
    this.hud.dialogue(FARMER_NAME, entries, () => {
      this.farmer.talking = false;
      if (first) {
        this.flags.petted = true;
        this.addFriendship(1);
        this.floatIcon('heart', this.dog.x, this.dog.y - 18);
      }
    });
  }

  trySleep() {
    if (!canSleep(this.minutes)) {
      this.hud.bubble(this.dog, 'Not sleepy yet...', 1.6, 18);
      this.hintOnce('sleep', 'You can go to bed after 6 PM.');
      return;
    }
    this.endDay('bed');
  }

  // ------------------------------------------------- rewards and hints

  progressTask(id, amount, absolute = false) {
    const done = absolute ? this.tasks.setProgress(id, amount) : this.tasks.advance(id, amount);
    if (done) this.rewardTask(done);
  }

  rewardTask(task) {
    const { treats, friendship } = task.reward;
    this.save.treats += treats;
    this.dayTreats += treats;
    this.addFriendship(friendship);
    sfx.chime();
    this.hud.toast(`Job done! ${task.title}.  +${treats} treats`, 'good');
    const line = LINES.taskDone[task.id];
    if (line && this.farmer.available) this.hud.bubble(this.farmer, fill(line, this.save.dog.name), 3, 26);
    this.floatIcon('treat', this.dog.x, this.dog.y - 20);
  }

  addFriendship(points) {
    this.save.friendship.farmer = Math.min(100, this.save.friendship.farmer + points);
  }

  hintOnce(id, message) {
    if (this.hintsShown.has(id)) return;
    this.hintsShown.add(id);
    this.hud.toast(message);
  }

  floatIcon(key, x, y) {
    const icon = this.add.image(x, y, key).setDepth(9500);
    this.tweens.add({ targets: icon, y: y - 16, alpha: 0, duration: 900, ease: 'Quad.Out', onComplete: () => icon.destroy() });
  }

  // --------------------------------------------------------- night end

  endDay(reason) {
    if (this.sleeping) return;
    this.sleeping = true;
    const dog = this.dog;
    const name = this.save.dog.name;
    if (dog.carrying) {
      const item = dog.carrying;
      dog.carrying = null;
      this.removeItem(item);
    }
    if (reason === 'bed') dog.sleep(POINTS.dogBed.x, POINTS.dogBed.y + 5);
    else dog.sleep(dog.x, dog.y);
    sfx.lullaby();

    const lines = this.tasks.tasks.map((t) => ({
      text: t.title,
      right: t.status === 'done' ? `+${t.reward.treats} treats` : t.status === 'failed' ? 'missed' : 'not done',
      color: t.status === 'done' ? '#2b2024' : '#8a6a5a',
    }));
    if (this.treatFinds > 0) lines.push({ text: 'Treats found while digging', right: `+${this.treatFinds}` });
    lines.push({ text: 'Treats earned today', right: String(this.dayTreats) });
    lines.push({ text: 'Bones in your secret stash', right: String(this.save.buried.filter((b) => b.item === 'bone').length) });

    this.save.day += 1;
    const saved = writeSave(this.save);
    const title =
      reason === 'bed' ? `${name} curls up for the night.` : `${name} fell asleep outside! ${FARMER_NAME} carried you to bed.`;
    const footer = saved ? 'Your farm has been saved.' : "This browser won't let the game save, so today won't be remembered.";
    this.time.delayedCall(reason === 'bed' ? 700 : 200, () => {
      this.hud.showSleep({ title, lines, footer }, () => this.scene.restart({ save: this.save }));
    });
  }

  quitToTitle() {
    this.scene.stop('Hud');
    this.scene.start('Title');
  }
}
