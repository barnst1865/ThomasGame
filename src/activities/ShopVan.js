// The Wagtail Wagon, a shop on wheels. It drives up the road at sunset and
// parks by the meadow. After dinner, Farmer Hazel walks over with the dog
// and buys it one thing (see src/data/shop.js and the shop screen in
// src/ui/ShopScreen.js).

import { POINTS, ROAD_END } from '../world/farmMap.js';
import { Walker } from '../entities/Walker.js';
import { NAMES } from '../data/characters.js';
import { FARMER_NAME, LINES, fill, pick } from '../data/dialogue.js';
import { sfx } from '../systems/sfx.js';
import { itemIcon } from '../ui/ShopScreen.js';

const DRIVE_TIME = 3200;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export class ShopVan {
  constructor(scene) {
    this.scene = scene;
    this.van = null;
    this.penny = null;
    this.blocker = null;
    this.ready = false; // dinner is over and it's time to shop
    this.done = false;
  }

  start() {
    const { scene } = this;
    const park = POINTS.vanPark;
    this.van = scene.add.image(ROAD_END.x, ROAD_END.y + 30, 'van-back').setOrigin(0.5, 1).setDepth(ROAD_END.y);
    sfx.honk();
    scene.tweens.add({
      targets: this.van,
      y: park.y,
      duration: DRIVE_TIME,
      ease: 'Sine.Out',
      onUpdate: () => this.van.setDepth(this.van.y),
      onComplete: () => this.parked(),
    });
  }

  parked() {
    const { scene, van } = this;
    const park = POINTS.vanPark;
    van.setTexture('van-side').setDepth(park.y);
    scene.tweens.add({ targets: van, y: park.y - 2, yoyo: true, duration: 120 });
    sfx.honk();
    // The van is solid, so the dog walks around it.
    this.blocker = scene.add.zone(park.x, park.y - 8, 60, 14);
    scene.physics.add.existing(this.blocker, true);
    scene.physics.add.collider(scene.dog, this.blocker);
    this.penny = new Walker(scene, 'shopkeeper', park.x + 22, park.y - 2);
    this.penny.walkTo([POINTS.shopkeeper], () => this.penny.face('left'));
    scene.hud.bubble(this.penny, pick(LINES.pennyHello), 2.4, 28);
    scene.hud.toast(`The ${NAMES.shop} is here! It's parked by the road.`, 'good');
  }

  // The HUD points at the shop while it's waiting for you.
  get pointer() {
    return this.ready && !this.done && this.penny ? this.penny : null;
  }

  interaction(p) {
    const { penny } = this;
    if (!penny || this.done || distance(penny.feet, p) > 28) return null;
    if (!this.ready) {
      return { label: `Say hi to ${NAMES.shopkeeper}`, action: () => this.scene.hud.bubble(penny, fill(LINES.pennyAfterDinner, this.scene.save.dog.name), 2.6, 28) };
    }
    return { label: `Pick a reward with ${FARMER_NAME}`, action: () => this.openShop() };
  }

  openShop() {
    const { scene } = this;
    scene.farmer.talking = true;
    scene.hud.openShop(
      { treats: scene.save.treats, owned: scene.save.owned, breed: scene.breed, coat: scene.coat, look: scene.look() },
      (item) => {
        scene.farmer.talking = false;
        if (item !== undefined) this.picked(item);
      },
    );
  }

  // `item` is what the dog picked, or null if there was nothing left to buy.
  picked(item) {
    const { scene, penny } = this;
    this.done = true;
    if (item) {
      scene.save.owned.push(item.id);
      scene.wear(item.slot, item.look);
      sfx.chime();
      const icon = itemIcon(scene, item, { breed: scene.breed, coat: scene.coat, look: scene.look() });
      scene.hud.showCard(icon.key, `New: ${item.name}!`, 'You can change what you wear at your toy box by the doghouse.');
      scene.hud.bubble(penny, pick(LINES.pennyThanks), 2.2, 28);
    } else {
      scene.hud.bubble(penny, fill(LINES.pennyEverything, scene.save.dog.name), 3, 28);
    }
    scene.progressTask('shopVisit', 1);
    scene.time.delayedCall(1400, () => scene.hud.bubble(scene.farmer, fill(scene.dinner.nightWarning(), scene.save.dog.name), 3, 26));
    scene.time.delayedCall(2600, () => this.leave());
  }

  leave() {
    const { scene, van } = this;
    const park = POINTS.vanPark;
    this.penny.walkTo([{ x: park.x + 22, y: park.y - 2 }], () => {
      this.penny.destroy();
      this.penny = null;
      this.blocker.destroy();
      this.blocker = null;
      van.setTexture('van-back');
      sfx.honk();
      scene.tweens.add({ targets: van, y: ROAD_END.y + 40, duration: DRIVE_TIME, ease: 'Sine.In', onUpdate: () => van.setDepth(van.y), onComplete: () => van.destroy() });
    });
  }

  update(dt) {
    const { scene } = this;
    this.penny?.update(dt, scene.dog);
    if (!this.ready && this.penny && scene.tasks.isActive('shopVisit') && scene.tasks.get('dinner')?.status === 'done') {
      this.ready = true;
      scene.farmer.setActivity('shop');
      scene.hintOnce('shop', `Go to the ${NAMES.shop} with ${FARMER_NAME} and pick a reward!`);
    }
  }
}
