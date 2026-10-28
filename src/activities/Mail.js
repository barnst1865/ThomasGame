// Mo the mail carrier walks up the road and leaves a package by the
// mailbox. The dog brings it to Farmer Hazel, and she opens it: a present
// that makes a job easier (see src/data/gifts.js). Barking at Mo is
// allowed, but he jumps every time.

import { POINTS, ROAD_END } from '../world/farmMap.js';
import { Walker } from '../entities/Walker.js';
import { nextGift } from '../data/gifts.js';
import { NAMES } from '../data/characters.js';
import { FARMER_NAME, LINES, fill, pick } from '../data/dialogue.js';
import { sfx } from '../systems/sfx.js';

const ARRIVE_AFTER = 4; // seconds into the morning
const TREAT_BOX = 5; // once every present has come, the package is full of treats

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export class MailDelivery {
  constructor(scene) {
    this.scene = scene;
    this.mo = null;
    this.package = null;
    this.arriveIn = null;
    this.spooked = 0;
  }

  start() {
    this.arriveIn = ARRIVE_AFTER;
  }

  arrive() {
    const { scene } = this;
    const corner = { x: POINTS.roadIn.x, y: POINTS.mailStop.y };
    this.mo = new Walker(scene, 'mail-carrier', ROAD_END.x, ROAD_END.y);
    this.mo.walkTo([POINTS.roadIn, corner, POINTS.mailStop], () => this.dropOff(corner));
    scene.hud.toast(`${NAMES.mailCarrier} the mail carrier is coming up the road!`);
  }

  dropOff(corner) {
    const { scene, mo } = this;
    mo.face('left');
    this.package = scene.spawnItem('package', POINTS.packageDrop.x, POINTS.packageDrop.y);
    sfx.drop();
    scene.hud.bubble(mo, pick(LINES.moDrop), 2.4, 28);
    scene.hintOnce('package', `A package! Pick it up and bring it to ${FARMER_NAME}.`);
    scene.time.delayedCall(2600, () => {
      mo.walkTo([corner, POINTS.roadIn, ROAD_END], () => {
        mo.destroy();
        this.mo = null;
      });
    });
  }

  owns(item) {
    return Boolean(item) && item === this.package;
  }

  get giveLabel() {
    return `Give the package to ${FARMER_NAME}`;
  }

  // Nobody can resist barking at the mail carrier.
  hearBark(bark) {
    const { scene, mo } = this;
    if (!mo || this.spooked > 0 || distance(mo, bark) > bark.radius * 0.7) return;
    this.spooked = 3;
    this.barks = (this.barks ?? 0) + 1;
    mo.jump();
    scene.hud.bubble(mo, this.barks === 1 ? LINES.moSpooked[0] : pick(LINES.moSpooked), 1.6, 28);
    const farmer = scene.farmer;
    if (farmer.available && distance(farmer, mo) < 180) {
      scene.time.delayedCall(800, () => scene.hud.bubble(farmer, fill(LINES.beNiceToMo, scene.save.dog.name), 1.8, 26));
    }
  }

  // Farmer Hazel opens the package.
  open() {
    const { scene } = this;
    const dog = scene.dog;
    const item = dog.carrying;
    dog.carrying = null;
    scene.removeItem(item);
    this.package = null;
    sfx.pickup();
    const name = scene.save.dog.name;
    const gift = nextGift(scene.save.gifts);
    const lines = gift
      ? [fill(LINES.openGift, name), { speaker: null, text: `It's the ${gift.name}! ${gift.about}` }]
      : [fill(LINES.openTreats, name)];
    scene.farmer.talking = true;
    scene.hud.dialogue(FARMER_NAME, lines, () => {
      scene.farmer.talking = false;
      if (gift) {
        scene.save.gifts.push(gift.id);
        scene.refreshPerks();
        scene.hud.showCard(`gift-${gift.id}`, gift.name, gift.about);
        sfx.chime();
      } else {
        scene.giveTreats(TREAT_BOX);
      }
      scene.progressTask('mail', 1);
    });
  }

  update(dt) {
    this.spooked = Math.max(0, this.spooked - dt);
    if (this.arriveIn !== null) {
      this.arriveIn -= dt;
      if (this.arriveIn <= 0) {
        this.arriveIn = null;
        this.arrive();
      }
    }
    this.mo?.update(dt, this.scene.dog);
  }
}
