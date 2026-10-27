// Dinner on the porch: a little scene at sunset where Farmer Hazel talks
// about the day and the dog gets its dinner.

import { POINTS } from '../world/farmMap.js';
import { FARMER_NAME, LINES, fill } from '../data/dialogue.js';
import { sfx } from '../systems/sfx.js';

export class DinnerScene {
  constructor(scene) {
    this.scene = scene;
    this.bowl = null;
    this.started = false;
  }

  // The table is set: the dog's bowl appears on the porch.
  prepare() {
    this.bowl = this.scene.add.image(POINTS.bowl.x, POINTS.bowl.y, 'bowl').setOrigin(0.5, 1).setDepth(POINTS.bowl.y - 4);
  }

  get ready() {
    const { farmer } = this.scene;
    return !this.started && this.bowl && farmer.activity === 'dinner' && farmer.arrived;
  }

  start() {
    const { scene } = this;
    const dog = scene.dog;
    this.started = true;
    scene.cutscene = true;
    scene.hud.letterbox(true);
    const spot = { x: POINTS.bowl.x + 11, y: POINTS.bowl.y + 2 };
    dog.setVelocity(0, 0);
    dog.facing = 'left';
    dog.setFlipX(true);
    dog.anims.play(`${dog.texKey}:walk-side`, true);
    const dist = Math.hypot(spot.x - dog.x, spot.y - dog.y);
    scene.tweens.add({
      targets: dog,
      x: spot.x,
      y: spot.y,
      duration: Math.max(200, dist * 14),
      onUpdate: () => {
        dog.setDepth(dog.y);
        dog.shadow.setPosition(dog.x, dog.y - 1).setDepth(dog.y - 0.5);
      },
      onComplete: () => {
        dog.anims.play(`${dog.texKey}:idle-side`);
        this.talk();
      },
    });
  }

  talk() {
    const { scene } = this;
    const name = scene.save.dog.name;
    const done = (id) => scene.tasks.get(id)?.status === 'done';
    const lines = [LINES.dinnerStart];
    if (done('herdSheep')) lines.push(LINES.dinnerSheep);
    if (done('chaseCrows')) lines.push(LINES.dinnerCrows);
    if (done('fetch')) lines.push(LINES.dinnerFetch);
    if (scene.fetch.catches > 0) lines.push(LINES.dinnerCatch);
    lines.push(LINES.dinnerServe);
    scene.hud.dialogue(
      FARMER_NAME,
      lines.map((l) => fill(l, name)),
      () => this.eat(),
    );
  }

  eat() {
    const { scene } = this;
    const dog = scene.dog;
    dog.anims.stop();
    let bites = 0;
    scene.time.addEvent({
      delay: 280,
      repeat: 7,
      callback: () => {
        bites += 1;
        dog.setFrame(bites % 2 ? 'side-walk1-0' : 'side-stand-0');
        if (bites % 2) sfx.munch();
        if (bites === 3) scene.hud.bubble(dog, 'Crunch crunch!', 1.2, 18);
        if (bites === 8) {
          this.bowl.setTexture('bowl-empty');
          this.finish();
        }
      },
    });
  }

  finish() {
    const { scene } = this;
    const name = scene.save.dog.name;
    scene.hud.dialogue(
      FARMER_NAME,
      [{ speaker: null, text: fill(LINES.dinnerEat, name) }, fill(LINES.dinnerEnd, name)],
      () => {
        scene.hud.letterbox(false);
        scene.cutscene = false;
        scene.dog.setVelocity(0, 0);
        scene.progressTask('dinner', 1);
      },
    );
  }
}
