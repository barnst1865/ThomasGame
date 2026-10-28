// Pickles the cat. Most days she naps somewhere sunny (you can pet her).
// On her special afternoons she runs off with your dinner bowl, leaving a
// trail of paw prints, and hides it: either up a tree (bark until she
// drops it) or buried in the grass (dig it up). Then put it back on the
// porch.

import { TILE } from '../config.js';
import { AREAS, POINTS, openTilesIn } from '../world/farmMap.js';
import { Cat } from '../entities/Cat.js';
import { createRng } from '../systems/rng.js';
import { NAMES } from '../data/characters.js';
import { LINES, fill, pick } from '../data/dialogue.js';
import { sfx } from '../systems/sfx.js';

const NAP_SPOTS = [
  { x: 118, y: 143 }, // the west end of the porch
  { x: 282, y: 127 }, // beside the doghouse
  { x: 250, y: 214 }, // in the shade of the tree by the yard
  { x: 586, y: 236 }, // by the coop
];
// Shade trees she likes to climb (in tiles; see buildFarm in farmMap.js).
const TREES = [
  [16, 12],
  [29, 12],
  [6, 13],
  [43, 27],
  [36, 29],
];
const PRINT_GAP = 9;
const POINT_AFTER = 45; // seconds before the HUD starts pointing at her hiding place

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export class Pickles {
  constructor(scene) {
    this.scene = scene;
    const day = scene.save.day;
    this.napSpot = NAP_SPOTS[day % NAP_SPOTS.length];
    this.cat = new Cat(scene, this.napSpot.x, this.napSpot.y);
    this.state = 'napping';
    this.prints = [];
    this.printSide = 1;
    this.hide = null;
    this.barks = 0;
    this.elapsed = 0;
    this.bowl = null;
    this.rng = createRng(day * 53 + 9);
    this.grumpy = 0;
  }

  // ------------------------------------------------------- the chase

  // Afternoon: she grabs the bowl from the porch and runs off to hide it.
  startChase() {
    const { scene, cat } = this;
    this.state = 'stealing';
    this.hide = this.pickHidingPlace();
    cat.setPosition(POINTS.bowl.x + 6, POINTS.bowl.y + 2);
    cat.carried = scene.add.image(cat.x, cat.y, 'dinner-bowl').setOrigin(0.5, 1);
    const via = [{ x: 168, y: 152 }, { x: 168, y: 264 }, { x: this.hide.ground.x, y: 264 }, this.hide.ground];
    scene.hud.bubble(cat, 'Mrrp!', 1.2, 16);
    sfx.meow();
    cat.runTo(via, () => this.arrived());
    if (!scene.save.flags.metPickles && scene.farmer.available) {
      scene.save.flags.metPickles = true;
      scene.time.delayedCall(1500, () => scene.hud.bubble(scene.farmer, fill(LINES.picklesIntro, scene.save.dog.name), 3.4, 26));
    }
    scene.hintOnce('bowl', `${NAMES.cat} ran off with your dinner bowl! Follow her paw prints from the porch.`);
  }

  pickHidingPlace() {
    const rng = this.rng;
    if (rng.chance(0.5)) {
      const [tx, ty] = TREES[rng.int(0, TREES.length - 1)];
      const base = { x: tx * TILE + 8, y: ty * TILE + 16 };
      return { kind: 'tree', base, ground: { x: base.x, y: base.y + 6 }, perch: { x: base.x, y: base.y - 20 } };
    }
    const spots = openTilesIn(this.scene.tiles, AREAS.lostThings, { diggableOnly: true }).filter((t) => t.y >= 12);
    const t = spots[rng.int(0, spots.length - 1)];
    return { kind: 'buried', tile: t, ground: { x: t.x * TILE + 8, y: t.y * TILE + 12 } };
  }

  arrived() {
    const { scene, cat, hide } = this;
    if (hide.kind === 'tree') {
      // Up she goes.
      this.state = 'climbing';
      cat.perchDepth = hide.base.y + 2;
      scene.tweens.add({
        targets: cat,
        x: hide.perch.x,
        y: hide.perch.y,
        duration: 500,
        ease: 'Quad.Out',
        onComplete: () => {
          this.state = 'perched';
          cat.sit();
          scene.hud.bubble(cat, 'Mew!', 1.2, 16);
        },
      });
      return;
    }
    // Buried: a little digging, then off she goes for a nap.
    this.state = 'burying';
    scene.time.addEvent({ delay: 120, repeat: 4, callback: () => scene.spawnDirt(cat.x, cat.y - 2) });
    scene.time.delayedCall(700, () => {
      cat.carried.destroy();
      cat.carried = null;
      scene.addMound(hide.tile.x, hide.tile.y);
      this.state = 'buried';
      this.goNap();
    });
  }

  goNap() {
    const { cat } = this;
    cat.runTo([{ x: cat.x, y: 264 }, { x: this.napSpot.x, y: 264 }, this.napSpot], () => cat.nap());
  }

  // Barking under her tree makes her drop the bowl (the second time).
  hearBark(bark) {
    const { scene, cat } = this;
    if (this.state === 'perched' && distance(bark, this.hide.base) < bark.radius && distance(scene.dog.feet, this.hide.base) < 70) {
      this.barks += 1;
      if (this.barks === 1) {
        scene.hud.bubble(cat, 'Hsss!', 1.2, 16);
        scene.tweens.add({ targets: cat, x: cat.x + 1, yoyo: true, repeat: 3, duration: 50 });
        sfx.hiss();
        return;
      }
      this.dropBowl();
      return;
    }
    // Barking at her nap wakes her up, and she finds somewhere quieter.
    if (this.state === 'napping' && !cat.running && distance(bark, cat) < bark.radius * 0.6 && this.grumpy <= 0) {
      this.grumpy = 4;
      cat.jump();
      scene.hud.bubble(cat, pick(LINES.picklesGrumpy), 1, 16);
      sfx.meow();
      this.napSpot = NAP_SPOTS[(NAP_SPOTS.indexOf(this.napSpot) + 1) % NAP_SPOTS.length];
      this.goNap();
    }
  }

  dropBowl() {
    const { scene, cat, hide } = this;
    this.state = 'dropped';
    sfx.meow();
    scene.hud.bubble(cat, 'Mrrrow!', 1.2, 16);
    const falling = cat.carried;
    cat.carried = null;
    const land = { x: hide.base.x + 10, y: hide.base.y + 10 };
    scene.tweens.add({
      targets: falling,
      x: land.x,
      y: land.y,
      duration: 450,
      ease: 'Bounce.Out',
      onComplete: () => {
        falling.destroy();
        this.bowl = scene.spawnItem('dinner-bowl', land.x, land.y);
        sfx.drop();
      },
    });
    scene.tweens.add({
      targets: cat,
      x: hide.ground.x - 12,
      y: hide.ground.y,
      duration: 400,
      ease: 'Quad.In',
      onComplete: () => {
        cat.perchDepth = null;
        this.goNap();
      },
    });
  }

  // Dug up the bowl she buried?
  digFinds(tx, ty) {
    return this.state === 'buried' && Math.abs(tx - this.hide.tile.x) <= 1 && Math.abs(ty - this.hide.tile.y) <= 1;
  }

  found(tx, ty) {
    const { scene } = this;
    const { tile } = this.hide;
    scene.removeMound(`${tile.x},${tile.y}`);
    scene.addHole(tx, ty);
    this.state = 'dropped';
    this.bowl = scene.spawnItem('dinner-bowl', tx * TILE + 8, ty * TILE + 12);
    if (!scene.dog.carrying) scene.dog.carry(this.bowl);
    sfx.chime();
    scene.hud.bubble(scene.dog, 'My bowl!', 1.4, 18);
  }

  owns(item) {
    return Boolean(item) && item === this.bowl;
  }

  // Back on the porch where it belongs.
  putBack() {
    const { scene } = this;
    const item = scene.dog.carrying;
    scene.dog.carrying = null;
    scene.removeItem(item);
    this.bowl = null;
    this.state = 'napping';
    sfx.pickup();
    scene.progressTask('findBowl', 1);
    if (scene.farmer.available) scene.hud.bubble(scene.farmer, fill(LINES.bowlBack, scene.save.dog.name), 2.6, 26);
    for (const p of this.prints) scene.tweens.add({ targets: p, alpha: 0, duration: 1500, onComplete: () => p.destroy() });
    this.prints = [];
  }

  interaction(p, carried) {
    if (carried && this.owns(carried) && distance(POINTS.bowl, p) < 26) {
      return { label: 'Put your bowl back', action: () => this.putBack() };
    }
    const { cat } = this;
    if (!carried && this.state === 'napping' && !cat.running && distance(cat.feet, p) < 18) {
      return { label: `Pet ${NAMES.cat}`, action: () => this.pet() };
    }
    return null;
  }

  pet() {
    const { scene, cat } = this;
    scene.hud.bubble(cat, pick(LINES.picklesPurr), 1.4, 16);
    scene.floatIcon('heart', cat.x, cat.y - 14);
    sfx.purr();
  }

  // The HUD points at her hiding place if it's taking a while.
  get pointer() {
    if (!['perched', 'buried'].includes(this.state) || this.elapsed < POINT_AFTER) return null;
    return this.hide.kind === 'tree' ? this.hide.base : this.hide.ground;
  }

  update(dt) {
    const { scene, cat } = this;
    this.grumpy = Math.max(0, this.grumpy - dt);
    if (['perched', 'buried'].includes(this.state)) this.elapsed += dt;
    if (this.state === 'perched' && distance(scene.dog.feet, this.hide.base) < 60) {
      scene.hintOnce('cat-tree', `${NAMES.cat} is up the tree with your bowl! Bark at her until she drops it.`);
    }
    const before = cat.moved;
    cat.update(dt);
    // Paw prints while she runs off with the bowl.
    if (this.state === 'stealing' && Math.floor(cat.moved / PRINT_GAP) > Math.floor(before / PRINT_GAP)) this.leavePrint();
  }

  leavePrint() {
    const { scene, cat } = this;
    const next = cat.route[0] ?? cat;
    const angle = Math.atan2(next.y - cat.y, next.x - cat.x);
    this.printSide *= -1;
    const off = this.printSide * 2;
    const print = scene.add
      .image(cat.x - Math.sin(angle) * off, cat.y - 2 + Math.cos(angle) * off, 'paw-cat')
      .setRotation(angle + Math.PI / 2)
      .setAlpha(0.8)
      .setDepth(-480);
    this.prints.push(print);
  }
}
