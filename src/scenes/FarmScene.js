// The farm. A day is a series of parts (morning, fun break, afternoon,
// dinner, night; see src/data/day.js). Each part ends when its jobs are
// done. Sleeping saves and restarts this scene for the next day.

import { TILE, WORLD_ZOOM, DOG, SHEEP, CHICKENS, CROWS, FETCH, DAY } from '../config.js';
import { buildFarm, T, MAP_W, MAP_H, AREAS, POINTS, areaPx, isSolid, isDiggable, tileAt, openTilesIn } from '../world/farmMap.js';
import { buildFarmView } from '../world/farmView.js';
import { Dog } from '../entities/Dog.js';
import { Sheep } from '../entities/Sheep.js';
import { Chicken } from '../entities/Chicken.js';
import { Farmer } from '../entities/Farmer.js';
import { Item, BURYABLE } from '../entities/Item.js';
import { FetchGame } from '../activities/Fetch.js';
import { CrowRaid } from '../activities/CrowRaid.js';
import { DinnerScene } from '../activities/Dinner.js';
import { LostThing } from '../activities/LostThing.js';
import { RunawayHen, LostLamb } from '../activities/Strays.js';
import { Butterflies } from '../activities/Butterflies.js';
import { PondDay } from '../activities/PondDay.js';
import { HawkAttack } from '../activities/HawkAttack.js';
import { NightWatch } from '../activities/NightWatch.js';
import { MailDelivery } from '../activities/Mail.js';
import { ShopVan } from '../activities/ShopVan.js';
import { perksFor } from '../data/gifts.js';
import { buildDogTexture } from '../art/textures.js';
import { getBreed, getCoat } from '../data/breeds.js';
import { TASKS } from '../data/tasks.js';
import { planDay } from '../data/day.js';
import { nightTargets } from '../data/nights.js';
import { FARMER_NAME, LINES, fill, pick } from '../data/dialogue.js';
import { TaskBoard } from '../systems/taskBoard.js';
import { DayPlan } from '../systems/dayPlan.js';
import { dateFromDay, formatDate, lighting } from '../systems/calendar.js';
import { writeSave } from '../systems/saveGame.js';
import { insideRect } from '../systems/steering.js';
import { sfx } from '../systems/sfx.js';
import { Controls } from '../input/controls.js';
import { keyLabel, howTo } from '../input/labels.js';
import { touchInput } from '../input/touch.js';
import { setTouchGameplay } from '../ui/touchControls.js';

const NIGHT_SCALE = 4;
const inset = (r, n) => ({ x: r.x + n, y: r.y + n, w: r.w - n * 2, h: r.h - n * 2 });
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const treatWord = (n) => `${n} ${n === 1 ? 'treat' : 'treats'}`;

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
    this.sleeping = false;
    this.cutscene = false;
    this.partChanging = false;
    this.flags = {};
    this.hintsShown = new Set();
    this.prompts = [];
    this.dayTreats = 0;
    this.treatFinds = 0;
    this.eggsInBasket = 0;
    this.items = [];
    this.holes = new Map();
    this.mounds = new Map();
    this.bark = null;
    this.barkTimer = 0;
    // What today holds: the parts of the day and who visits tonight.
    this.dayParts = planDay(save.day);
    this.tonight = this.dayParts.find((p) => p.id === 'night').night;

    this.view = buildFarmView(this, this.tiles, this.date.seasonIndex);
    this.view.toyBox = this.add.image(POINTS.toyBox.x, POINTS.toyBox.y, 'toy-box').setOrigin(0.5, 1).setDepth(POINTS.toyBox.y);
    this.applyHome();
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
    this.lostThing = new LostThing(this);
    this.plan = new DayPlan(this.tasks, this.dayParts, {
      targets: {
        sheepOut: SHEEP.count,
        collectEggs: CHICKENS.eggsPerDay,
        fetch: FETCH.throws,
        pondSticks: FETCH.sticks,
        butterflies: DAY.butterflies,
        herdSheep: SHEEP.count,
        chaseCrows: CROWS.total,
        hawk: DAY.hawkScares,
        ...nightTargets(this.tonight),
      },
      titles: { lostThing: this.lostThing.title },
    });
    this.plan.begin();
    this.sky = this.plan.skyTime();
    this.fetch = new FetchGame(this);
    this.crows = new CrowRaid(this);
    this.dinner = new DinnerScene(this);
    this.pond = new PondDay(this);
    this.butterflies = new Butterflies(this);
    this.hawk = new HawkAttack(this);
    this.runawayHen = new RunawayHen(this);
    this.lostLamb = new LostLamb(this);
    this.night = new NightWatch(this);
    this.mail = new MailDelivery(this);
    this.shopVan = new ShopVan(this);

    this.scene.launch('Hud', { farm: this });
    this.hud = this.scene.get('Hud');
    this.events.once('shutdown', () => {
      setTouchGameplay(false);
      this.anims.resumeAll();
      this.scene.stop('Hud');
    });
    this.time.delayedCall(500, () => this.morning());

    // Handy for poking at the game from the browser console.
    globalThis.pawsFarm = this;
  }

  // ------------------------------------------------------------- world

  // Collision tiles: 1 = walls, trees and buildings, 2 = the pen gate,
  // 3 = the pond (which the dog can swim in on pond day).
  buildCollision() {
    const data = this.tiles.map((row) => row.map((t) => (t === T.WATER ? 3 : isSolid(t) ? 1 : t === T.GATE ? 2 : 0)));
    const map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage('collision', 'collision', TILE, TILE, 0, 0);
    this.collisionLayer = map.createLayer(0, tileset, 0, 0).setVisible(false);
    this.collisionLayer.setCollision([1, 3]);
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
    this.dog = new Dog(this, POINTS.dogWake.x, POINTS.dogWake.y, this.breed, this.coat, this.look());
    this.refreshPerks();
    this.dog.body.setMass(3);
    this.physics.add.collider(this.dog, this.collisionLayer, null, (dog, tile) => !(tile.index === 3 && this.pond.open));

    // The sheep spend the night in their pen.
    this.sheepGroup = this.physics.add.group();
    const pen = Phaser.Utils.Array.Shuffle(openTilesIn(this.tiles, AREAS.penInside, { diggableOnly: true }));
    this.sheep = [];
    for (let i = 0; i < SHEEP.count; i++) {
      const spot = pen[i];
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
    if (this.dayParts.some((p) => p.jobs.includes('buryBone'))) this.spawnItem('bone', POINTS.bone.x, POINTS.bone.y);
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
    this.duskLayer = this.add.rectangle(0, 0, w, h, 0xff8a3d, 1).setOrigin(0).setDepth(9000).setAlpha(0);
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

  // The sky drifts toward the time of day that matches the jobs done so far.
  updateSky(dt) {
    this.sky += (this.plan.skyTime() - this.sky) * Math.min(1, dt * 0.8);
    const { darkness, dusk } = lighting(this.sky);
    this.duskLayer.setAlpha(dusk * 0.62);
    for (const win of this.view.windows) win.setAlpha(Math.min(1, darkness * 2.2));
    if (darkness <= 0.01) {
      this.nightLayer.setVisible(false);
      return;
    }
    const rt = this.nightLayer.setVisible(true).setAlpha(darkness);
    rt.clear();
    rt.fill(0x141a3a, 1);
    for (const light of [...this.view.lights, ...this.night.lights]) this.eraseLight(light.x, light.y, light.size);
    // A little moonlight around the dog so you can always see where you are.
    this.eraseLight(this.dog.x, this.dog.y - 6, 128 * this.perks.light);
  }

  // ------------------------------------------------------- day by parts

  morning() {
    const name = this.save.dog.name;
    if (touchInput.active && window.innerHeight > window.innerWidth) {
      this.hintOnce('sideways', 'Tip: turn your device sideways for a bigger view.');
    }
    if (!this.save.flags.metFarmer) {
      this.dog.facing = 'right';
      this.farmer.talking = true;
      this.hud.dialogue(FARMER_NAME, [...LINES.firstMorning.map((l) => fill(l, name)), { speaker: null, text: fill(pick(LINES.pet), name) }], () => {
        this.farmer.talking = false;
        this.save.flags.metFarmer = true;
        this.flags.petted = true;
        this.addFriendship(1);
        this.floatIcon('heart', this.dog.x, this.dog.y - 18);
        this.startPart(this.plan.part);
      });
    } else {
      this.startPart(this.plan.part);
      this.hud.toast(`Good morning, ${name}! It's ${formatDate(this.save.day)}.`);
      if (this.date.dayOfSeason === 1) this.hud.toast(`${this.date.season} is here!`, 'good');
    }
  }

  // Called once at the start of each part of the day.
  startPart(part) {
    this.hud.banner(part.name, part.intro);
    this.farmer.setActivity(part.farmer);
    const has = (job) => part.jobs.includes(job);
    if (has('fetch')) this.fetch.start('ball');
    else if (has('pondSticks')) {
      this.pond.start();
      this.fetch.start('stick');
    } else this.fetch.putAway();
    if (has('lostThing')) this.lostThing.start();
    if (has('runawayHen')) this.runawayHen.start();
    if (has('butterflies')) this.butterflies.start();
    if (has('chaseCrows')) this.crows.start();
    if (has('hawk')) this.hawk.start();
    if (has('lostLamb')) this.lostLamb.start();
    if (has('mail')) this.mail.start();
    if (has('shopVisit')) this.shopVan.start();
    if (part.id === 'dinner') {
      this.crows.shoo();
      this.hawk.stop();
      this.chickens.forEach((hen) => hen.goToBed(POINTS.coopDoor));
      this.dinner.prepare();
    }
    if (part.id === 'night') this.night.start(part.night);
  }

  checkPartDone() {
    if (this.partChanging || this.plan.isLastPart || !this.plan.partDone()) return;
    this.partChanging = true;
    this.time.delayedCall(DAY.partPause * 1000, () => {
      this.partChanging = false;
      this.startPart(this.plan.advance());
    });
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.controls.update();
    this.updateSky(dt);
    // Dialogue, menus and sleep freeze everything; little scenes (like
    // dinner) only take away the controls.
    const frozen = !this.hud?.sys.isActive() || this.hud.isBusy() || this.sleeping;
    const busy = frozen || this.cutscene;
    this.controls.enabled = !busy;
    setTouchGameplay(!busy);
    if (frozen !== Boolean(this.animsFrozen)) {
      if (frozen) this.anims.pauseAll();
      else this.anims.resumeAll();
      this.animsFrozen = frozen;
    }
    if (busy !== this.physics.world.isPaused) {
      if (busy) this.physics.world.pause();
      else this.physics.world.resume();
    }
    if (busy) {
      this.prompts = [];
      return;
    }

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
    this.farmer.update(dt, dog);
    this.fetch.update(dt);
    this.crows.update(dt);
    for (const activity of [this.pond, this.lostThing, this.runawayHen, this.butterflies, this.hawk, this.lostLamb, this.night, this.mail, this.shopVan]) {
      activity.update(dt);
    }

    this.barkTimer -= dt;
    if (this.barkTimer <= 0) this.bark = null;
    this.checkPartDone();
    // Once tonight's visitors are dealt with (one way or another), it's bedtime.
    if (this.plan.part.id === 'night' && this.plan.partDone() && !this.tasks.get('goToBed')) this.bedtime();
    this.prompts = this.buildPrompts(this.findInteraction());
  }

  // ---------------------------------------------------------- animals

  // Near the open gate, sheep head the way they're meant to go: out to the
  // meadow in the morning, home to the pen in the afternoon.
  sheepPull() {
    const part = this.plan.part?.id;
    const gate = this.gatePoint;
    if (part === 'morning') {
      return { appliesTo: 'inPen', gate, toward: POINTS.meadowGate, approach: { x: gate.x - 28, y: gate.y }, wanderChance: 0.3 };
    }
    if (part === 'afternoon' && !this.gateClosed) {
      return { appliesTo: 'grazing', gate, toward: this.penHome, approach: { x: gate.x + 30, y: gate.y }, wanderChance: 0.2 };
    }
    return null;
  }

  updateSheep(dt) {
    const part = this.plan.part?.id;
    const ctx = {
      dog: this.dog,
      flock: this.sheep,
      herdRadius: DOG.herdRadius * this.breed.stats.herdRadius * this.perks.herdRadius,
      bark: this.bark,
      penRect: this.penRect,
      roamRect: this.roamRect,
      pull: this.sheepPull(),
    };
    for (const sheep of this.sheep) {
      sheep.update(dt, ctx);
      if (sheep.state === 'inPen' && !insideRect(sheep.feet, this.penOuter)) {
        sheep.state = 'grazing';
        sheep.target = null;
        sfx.baa();
        this.hud.bubble(sheep, 'Baa!', 1.2, 16);
      } else if (sheep.state === 'grazing' && part === 'afternoon' && insideRect(sheep.feet, this.penRect)) {
        sheep.state = 'penned';
        sheep.target = null;
        this.save.stats.sheepPenned += 1;
        sfx.baa();
        this.hud.bubble(sheep, 'Baa!', 1.2, 16);
      }
    }
    const flock = this.sheep.filter((s) => !s.lamb);
    if (this.tasks.isActive('sheepOut')) {
      this.progressTask('sheepOut', flock.filter((s) => s.state !== 'inPen').length, true);
    }
    if (this.tasks.isActive('herdSheep')) {
      this.progressTask('herdSheep', flock.filter((s) => s.state === 'penned').length, true);
    }
    if (this.tasks.isActive('lostLamb') && this.sheep.some((s) => s.lamb && s.state === 'penned')) {
      this.progressTask('lostLamb', 1);
    }
    const allHome = part === 'afternoon' && this.sheep.every((s) => s.state === 'penned');
    if (allHome && !this.gateClosed) {
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

  // ------------------------------------------------------------- night

  // The raccoon got to the basket.
  emptyBasket() {
    this.eggsInBasket = 0;
    this.view.basket.setTexture('basket-0');
  }

  // A coyote or wolf reached the pen: the sheep panic (they'll be fine).
  frightenSheep(from) {
    for (const sheep of this.sheep) {
      const away = Math.atan2(sheep.y - from.y, sheep.x - from.x);
      sheep.panic = 1.4;
      sheep.panicDir = { x: Math.cos(away), y: Math.sin(away) };
    }
    sfx.baa();
    if (this.sheep[0]) this.hud.bubble(this.sheep[0], 'BAA!', 1.4, 16);
  }

  // Things the HUD points at when they're off screen.
  pointers() {
    const list = [];
    for (const p of this.night.prowlers) if (p.state !== 'flee') list.push({ x: p.x, y: p.y - 8, color: 0xe25d6a });
    for (const w of this.night.wisps) if (!w.popped) list.push({ x: w.x, y: w.y, color: 0x8fe36b });
    const hawk = this.hawk.pointer;
    if (hawk) list.push({ x: hawk.x, y: hawk.y, color: 0xe25d6a });
    const pkg = this.mail.package;
    const waiting = [this.runawayHen.pointer, this.lostLamb.pointer, this.shopVan.pointer, pkg && !pkg.carried ? pkg : null];
    for (const stray of waiting) {
      if (stray) list.push({ x: stray.x, y: stray.y - 8, color: 0xf2c84b });
    }
    return list;
  }

  // Tonight's visitors are dealt with: now the dog can go to bed.
  bedtime() {
    this.tasks.add('goToBed', 1, 'night');
    this.time.delayedCall(1200, () => this.hud.toast(LINES.bedtimeNow));
  }

  // ------------------------------------------------------ dog actions

  doBark() {
    const dog = this.dog;
    if (dog.barkCooldown > 0 || dog.mode !== 'normal') return;
    dog.barkCooldown = DOG.barkCooldown;
    const radius = DOG.barkRadius * this.breed.stats.barkRadius * this.night.barkBoost * this.perks.barkRadius;
    this.bark = { x: dog.x, y: dog.y - 3, radius };
    this.barkTimer = 0.15;
    sfx.bark(this.breed.barkPitch ?? 1);
    this.hud.bubble(dog, 'Woof!', 0.8, 18);

    const ring = this.add.circle(dog.x, dog.y - 6, 8).setStrokeStyle(1, 0xffffff, 0.9).setDepth(8999);
    this.tweens.add({ targets: ring, scale: radius / 8, alpha: 0, duration: 420, onComplete: () => ring.destroy() });

    this.night.hearBark(this.bark);
    this.hawk.hearBark(this.bark);
    this.crows.hearBark(this.bark);
    this.mail.hearBark(this.bark);
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
    if (dog.swimming) {
      this.hud.bubble(dog, 'Blub blub!', 0.8, 18);
      return;
    }
    if (!this.canDigAt(tx, ty)) {
      this.hud.bubble(dog, '?', 0.8, 18);
      this.hintOnce('hard', 'The ground is too hard here. Try digging in the grass.');
      return;
    }
    const carried = dog.carrying;
    if (carried && !BURYABLE.has(carried.kind)) {
      this.hud.bubble(dog, '...', 1, 18);
      if (carried.kind === 'egg') this.hintOnce('egg', 'Eggs go in the basket, not in the ground!');
      else if (carried.kind === 'package') this.hintOnce('keep-package', `That package is for ${FARMER_NAME}! Bring it to her.`);
      else this.hintOnce(`keep-${carried.kind}`, `${FARMER_NAME} wants that ${carried.label} back! Bring it to her.`);
      return;
    }
    const buried = this.save.buried.some((b) => b.tx === tx && b.ty === ty) || this.lostThing.digFinds(tx, ty);
    if (this.holes.has(key) && !buried && !dog.carrying) {
      this.hintOnce('dug', 'There is already a hole here. Nothing inside!');
      return;
    }
    dog.dig(() => this.finishDig(tx, ty));
    sfx.dig();
    this.time.addEvent({ delay: 110 * this.perks.digTime, repeat: 5, callback: () => this.spawnDirt(tx * TILE + 8, ty * TILE + 8) });
  }

  finishDig(tx, ty) {
    const dog = this.dog;
    const key = `${tx},${ty}`;
    if (!dog.carrying && this.lostThing.digFinds(tx, ty)) {
      this.lostThing.found(tx, ty);
      return;
    }
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
      this.giveTreats(1);
      sfx.chime();
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
    const farmerNear = this.farmer.available && distance(this.farmer.feet, p) < 26;
    const carried = dog.carrying;
    if (carried) {
      if (farmerNear && this.fetch.owns(carried)) {
        return { label: this.fetch.giveLabel, action: () => this.fetch.returnBall() };
      }
      if (farmerNear && this.mail.owns(carried)) {
        return { label: this.mail.giveLabel, action: () => this.mail.open() };
      }
      if (farmerNear && this.lostThing.owns(carried)) {
        return { label: this.lostThing.giveLabel, action: () => this.lostThing.giveBack() };
      }
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
      if (item.carried || item.inFlight) continue;
      const d = distance({ x: item.x, y: item.y - 3 }, p);
      if (d < bestDist) {
        best = item;
        bestDist = d;
      }
    }
    if (best) return { label: `Pick up the ${best.label}`, action: () => this.pickUp(best) };
    const atDinner = this.dinner.ready && (farmerNear || distance(POINTS.bowl, p) < 28);
    if (atDinner) return { label: 'Sit down for dinner', action: () => this.dinner.start() };
    const special = this.pond.interaction(farmerNear) ?? this.night.interaction(p) ?? this.shopVan.interaction(p);
    if (special) return special;
    if (farmerNear) return { label: `Talk to ${FARMER_NAME}`, action: () => this.talkToFarmer() };
    // The bed and the toy box are side by side: whichever is closer.
    const toBed = distance(POINTS.dogBed, p);
    const toBox = distance(POINTS.toyBox, p);
    if (toBox < 18 && toBox < toBed) return { label: 'Open your toy box', action: () => this.openToyBox() };
    if (toBed < 20) {
      return { label: this.tasks.isActive('goToBed') ? 'Go to sleep' : 'Lie down in your bed', action: () => this.trySleep() };
    }
    return null;
  }

  // ------------------------------------------------- looks and presents

  // What the dog is wearing, and its bed and doghouse colors.
  look() {
    const { dog, home } = this.save;
    return { collar: dog.collar, neck: dog.neck, hat: dog.hat, bed: home.bed, house: home.house };
  }

  // Puts something on (or changes the bed or roof color).
  wear(slot, look) {
    if (slot === 'bed' || slot === 'house') {
      this.save.home[slot] = look;
      this.applyHome();
      return;
    }
    this.save.dog[slot] = look;
    const { collar, neck, hat } = this.save.dog;
    this.dog.setLook(buildDogTexture(this, this.breed, this.coat, { collar, neck, hat }));
  }

  applyHome() {
    this.view.dogBed.setTexture(`dog-bed-${this.save.home.bed}`);
    this.view.doghouse.setTexture(`doghouse-${this.save.home.house}`);
  }

  openToyBox() {
    sfx.pickup();
    this.hud.openToyBox(
      { owned: this.save.owned, gifts: this.save.gifts, breed: this.breed, coat: this.coat, look: this.look() },
      (slot, look) => this.wear(slot, look),
    );
  }

  refreshPerks() {
    this.perks = perksFor(this.save.gifts);
    this.dog.perks = this.perks;
  }

  buildPrompts(interaction) {
    const prompts = [];
    if (interaction) prompts.push({ key: keyLabel('interact'), label: interaction.label });
    if (this.dog.carrying?.kind === 'bone' && this.dog.mode === 'normal') {
      const { tx, ty } = this.digTarget();
      if (this.canDigAt(tx, ty)) prompts.push({ key: keyLabel('dig'), label: 'Bury your bone here' });
    }
    return prompts;
  }

  pickUp(item) {
    this.tweens.killTweensOf(item); // a stick stops bobbing on the water
    this.dog.carry(item);
    sfx.pickup();
    if (item.kind === 'bone') this.hintOnce('bone', `Find a nice patch of grass and ${howTo('dig')} to bury your bone.`);
    if (item.kind === 'egg') this.hintOnce('egg-carry', 'Bring the egg to the basket on the porch.');
    if (item.kind === 'ball' || item.kind === 'stick') this.hintOnce(`${item.kind}-carry`, `Bring the ${item.kind} back to ${FARMER_NAME}.`);
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
    const next = this.plan.jobs().find((t) => t.status === 'active');
    lines.push(next ? LINES.hints[next.id] : pick(LINES.allDone));
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
    if (this.tasks.isActive('goToBed')) {
      this.endDay();
      return;
    }
    this.hud.bubble(this.dog, 'Not sleepy yet!', 1.6, 18);
    const next = this.plan.jobs().find((t) => t.status === 'active');
    if (this.plan.part.id === 'night' && next) this.hud.toast(`Not yet! First: ${next.title.toLowerCase()}.`);
    else this.hintOnce('sleep', 'Bedtime comes after the night job. There is lots to do first!');
  }

  // ------------------------------------------------- rewards and hints

  progressTask(id, amount, absolute = false) {
    const done = absolute ? this.tasks.setProgress(id, amount) : this.tasks.advance(id, amount);
    if (done) this.rewardTask(done);
  }

  rewardTask(task) {
    const { treats, friendship } = task.reward;
    if (task.id === 'goToBed') return;
    this.giveTreats(treats);
    this.addFriendship(friendship);
    sfx.chime();
    this.hud.toast(`Job done! ${task.title}.${treats > 0 ? `  +${treatWord(treats)}` : ''}`, 'good');
    const line = LINES.taskDone[task.id];
    if (line && this.farmer.available) this.hud.bubble(this.farmer, fill(line, this.save.dog.name), 3, 26);
  }

  giveTreats(count) {
    if (count <= 0) return;
    this.save.treats += count;
    this.dayTreats += count;
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

  // ------------------------------------------------------- end of day

  endDay() {
    if (this.sleeping) return;
    this.sleeping = true;
    this.progressTask('goToBed', 1);
    const dog = this.dog;
    const name = this.save.dog.name;
    if (dog.carrying) {
      const item = dog.carrying;
      dog.carrying = null;
      this.removeItem(item);
    }
    dog.sleep(POINTS.dogBed.x, POINTS.dogBed.y + 5);
    sfx.lullaby();

    const lines = this.tasks.tasks
      .filter((t) => t.id !== 'goToBed')
      .map((t) => ({
        text: t.title,
        right: t.status === 'done' ? (t.reward.treats > 0 ? `+${treatWord(t.reward.treats)}` : 'done') : t.status === 'failed' ? 'missed' : 'not done',
        color: t.status === 'done' ? '#2b2024' : '#8a6a5a',
      }));
    lines.push({ text: 'Treats earned today', right: String(this.dayTreats) });
    lines.push({ text: 'Bones in your secret stash', right: String(this.save.buried.filter((b) => b.item === 'bone').length) });

    this.save.day += 1;
    const saved = writeSave(this.save);
    const footer = saved ? 'Your farm has been saved.' : "This browser won't let the game save, so today won't be remembered.";
    this.time.delayedCall(700, () => {
      this.hud.showSleep({ title: `${name} curls up for the night.`, lines, footer }, () => this.scene.restart({ save: this.save }));
    });
  }

  quitToTitle() {
    this.scene.stop('Hud');
    this.scene.start('Title');
  }
}
