// The last night of the Goldsby plan. While everyone sleeps, Mr. Goldsby
// rumbles up the road in a bulldozer to start his MegaFarm. The dog wakes
// up Sir Cluckington (whose crowing wakes up Farmer Hazel), barks at the
// bulldozer until Duke comes to help and Pickles sneaks off with the keys,
// then asks the golden wisp for help. It lights up the whole farm, and Mr.
// Goldsby finally sees how special the farm is.

import { TILE } from '../config.js';
import { POINTS, ROAD_END } from '../world/farmMap.js';
import { Wisp } from '../entities/Wisp.js';
import { Mission, MAIN_PATH_Y } from './Missions.js';
import { NAMES } from '../data/characters.js';
import { FARMER_NAME, LINES, pick } from '../data/dialogue.js';
import { sfx } from '../systems/sfx.js';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const ROAD_X = POINTS.roadIn.x;
const DOZER_SPEED = { woods: 30, meadow: 5 }; // pixels per second: out of the woods, then slow and noisy
const DOZER_STOP = 25 * TILE; // it waits here, at the edge of the meadow
const WOODS_EDGE = 29 * TILE + 8;
const DOZER_HEIGHT = 44;
const BARKS_TO_STOP = 3;
const WISP_SPOT = { x: 44 * TILE, y: MAIN_PATH_Y };
const FIREFLIES = 40;
const MAP = { x: 40, y: 70, w: 700, h: 420 };

export class Finale extends Mission {
  start() {
    const { scene } = this;
    this.step = 'rumble';
    this.barks = 0;
    this.pause = 0;
    this.barkGap = 0;
    this.shake = 3;
    this.engineOn = true;
    this.fireflies = [];
    this.dozer = scene.add.image(ROAD_X, ROAD_END.y + DOZER_HEIGHT, 'bulldozer').setOrigin(0.5, 1);
    // The bulldozer is solid, so the dog barks at it instead of walking through.
    this.blocker = scene.add.zone(ROAD_X, this.dozer.y - 12, 40, 18);
    scene.physics.add.existing(this.blocker, true);
    this.collider = scene.physics.add.collider(scene.dog, this.blocker);
    scene.time.delayedCall(1500, () => {
      scene.hud.toast(LINES.finaleRumble, 'warn');
      scene.cameras.main.shake(500, 0.004);
    });
    scene.time.delayedCall(4500, () => scene.hintOnce('finale-wake', LINES.finaleWakeHint));
  }

  // Out of the woods, where everyone can see it.
  get inTheOpen() {
    return this.dozer.y <= WOODS_EDGE;
  }

  // Where Mr. Goldsby sits (for speech bubbles, which follow anything active).
  get driver() {
    this.seat ??= { active: true };
    return Object.assign(this.seat, { x: this.dozer.x, y: this.dozer.y - DOZER_HEIGHT + 22 });
  }

  hearBark(bark) {
    const atDozer = distance(bark, { x: this.dozer.x, y: this.dozer.y - 10 }) < bark.radius + 20;
    if (this.step === 'rumble') {
      if (distance(bark, POINTS.coopDoor) < bark.radius + 24) this.wake();
      else if (atDozer) this.scene.hintOnce('finale-first', LINES.finaleWakeFirst);
    } else if (this.step === 'stop' && this.barkGap <= 0 && this.inTheOpen && atDozer) this.barkedAt();
  }

  // ------------------------------------------- step 1: wake everyone up

  wake() {
    const { scene } = this;
    this.step = 'waking';
    const rooster = scene.rooster;
    const door = POINTS.coopDoor;
    rooster.setPosition(door.x, door.y + 8);
    rooster.setVisible(true);
    rooster.shadow.setVisible(true);
    rooster.body.enable = true;
    rooster.settle();
    rooster.anims.play('rooster-peck');
    sfx.crow();
    scene.time.delayedCall(600, () => sfx.crow());
    scene.hud.bubble(rooster, LINES.finaleCrow, 2.6, 18);
    scene.cameras.main.shake(300, 0.003);
    // Loud enough to wake up the neighbors, too.
    this.callDuke();
    // Farmer Hazel comes out to see what all the noise is about.
    scene.time.delayedCall(2000, () => {
      const farmer = scene.farmer;
      farmer.inside = false;
      farmer.setVisible(true);
      farmer.shadow.setVisible(true);
      farmer.setPosition(POINTS.houseDoor.x, POINTS.houseDoor.y + 4);
      farmer.setActivity('porch');
      this.talk([[FARMER_NAME, LINES.finaleHazel], [NAMES.richGuy, LINES.finaleGoldsby]], () => {
        scene.tasks.add('finaleStop', 1, 'night');
        scene.progressTask('finaleWake', 1);
        this.step = 'stop';
        scene.hintOnce('finale-stop', LINES.finaleStopHint);
      });
    });
  }

  // ---------------------------------------- step 2: stop the bulldozer

  barkedAt() {
    const { scene } = this;
    this.barks += 1;
    this.barkGap = 0.5;
    this.pause = 1.6;
    scene.hud.bubble(this.driver, pick(LINES.finaleBarkedAt), 1.6, 0);
    if (this.barks >= BARKS_TO_STOP) {
      this.step = 'stopped';
      scene.time.delayedCall(900, () => this.stealKeys());
    }
  }

  // Duke and Gus heard the commotion from next door.
  callDuke() {
    const { scene } = this;
    const y = DOZER_STOP + 8;
    const onArrive = () => {
      if (!['waking', 'stop'].includes(this.step)) return;
      scene.hud.toast(LINES.finaleDuke, 'good');
      this.dukeBarks = 0.5;
    };
    scene.rival.arrive({ x: ROAD_X - 40, y }, { x: ROAD_X + 36, y: y - 6 }, onArrive, { direct: true });
  }

  stealKeys() {
    const { scene } = this;
    this.step = 'keys';
    this.dukeBarks = null;
    scene.hud.dialogue(null, [{ speaker: null, text: LINES.finaleKeys }], () => {
      scene.cutscene = true;
      const cat = scene.pickles.cat;
      const { x, y } = this.dozer;
      cat.route = [];
      cat.setPosition(x - 80, y + 4).setVisible(true).setFlipX(false);
      cat.anims.play('cat-walk', true);
      const keys = scene.add.image(x, y - 30, 'keys').setVisible(false);
      scene.tweens.chain({
        targets: cat,
        tweens: [
          { x: x - 16, y: y - 2, duration: 900 },
          { x: x - 4, y: y - 28, duration: 260, ease: 'Quad.Out' },
          {
            x: x - 4,
            duration: 500,
            onComplete: () => {
              sfx.pickup();
              keys.setVisible(true);
              cat.carried = keys;
              cat.setFlipX(true);
            },
          },
          { x: x - 20, y: y + 2, duration: 260, ease: 'Quad.In' },
          { x: x - 110, y: y + 10, duration: 900 },
        ],
        onUpdate: () => cat.carried?.setPosition(cat.x + (cat.flipX ? -8 : 8), cat.y - 3).setDepth(cat.y + 1),
        onComplete: () => {
          cat.sit();
          cat.setDepth(cat.y);
          this.engineOn = false;
          sfx.meow();
          scene.cutscene = false;
          this.talk([[NAMES.richGuy, LINES.finaleNoKeys]], () => {
            scene.tasks.add('finaleWisp', 1, 'night');
            scene.progressTask('finaleStop', 1);
            this.callWisp();
          });
        },
      });
    });
  }

  // ------------------------------------------ step 3: the golden wisp

  callWisp() {
    const { scene } = this;
    this.step = 'wisp';
    this.wisp = new Wisp(scene, 'friendly', WISP_SPOT.x, WISP_SPOT.y);
    sfx.twinkle();
    scene.hintOnce('finale-wisp', LINES.finaleWispHint);
  }

  interaction(p, carried) {
    if (this.step !== 'wisp' || carried || !this.wisp || distance(this.wisp.ground, p) > 26) return null;
    return { label: LINES.finaleWispTalk, action: () => this.glow() };
  }

  // The wisp flies up and the whole farm lights up with fireflies.
  glow() {
    const { scene } = this;
    this.step = 'glow';
    const cam = scene.cameras.main;
    const zoom = cam.zoom;
    scene.hud.dialogue(null, [{ speaker: null, text: LINES.finaleGlow }], () => {
      scene.cutscene = true;
      sfx.twinkle();
      const wisp = this.wisp;
      scene.tweens.add({ targets: [wisp, wisp.halo], y: wisp.y - 60, scale: 3, duration: 2200, ease: 'Sine.InOut' });
      this.bigGlow = { x: wisp.ground.x, y: wisp.ground.y - 20, size: 192 };
      cam.stopFollow();
      cam.pan(MAP.x + MAP.w / 2, MAP.y + MAP.h / 2, 2600, 'Sine.easeInOut');
      cam.zoomTo(zoom * 0.62, 2600, 'Sine.easeInOut');
      for (let i = 0; i < FIREFLIES; i++) this.firefly(i);
      scene.time.delayedCall(1500, () => scene.hud.bubble({ x: 33 * TILE, y: 11 * TILE, active: true }, 'Ribbit! Ribbit!', 2.4, 0));
      scene.time.delayedCall(2600, () => scene.hud.bubble({ x: 43 * TILE + 8, y: 26 * TILE, active: true }, 'Hoo! Hoo!', 2.4, 0));
      scene.time.delayedCall(4200, () => this.changeOfHeart(zoom));
    });
  }

  firefly(i) {
    const { scene } = this;
    const spot = { x: MAP.x + Math.random() * MAP.w, y: MAP.y + Math.random() * MAP.h, size: 32, on: false };
    const bug = scene.add.image(spot.x, spot.y, 'glow-8').setTint(0xd8ff7a).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(9500);
    spot.bug = bug;
    scene.time.delayedCall(200 + i * 60, () => {
      spot.on = true;
      sfx.blip();
    });
    scene.tweens.add({ targets: bug, alpha: 1, delay: 200 + i * 60, duration: 500 });
    scene.tweens.add({ targets: [bug, spot], y: spot.y - 8, x: spot.x + (Math.random() - 0.5) * 10, yoyo: true, repeat: -1, duration: 1200 + Math.random() * 1200, ease: 'Sine.InOut' });
    this.fireflies.push(spot);
  }

  changeOfHeart(zoom) {
    const { scene } = this;
    const cam = scene.cameras.main;
    this.talk(
      LINES.finaleChange.map(({ speaker, text }) => [speaker, text]),
      () => {
        // Hooray! Hearts all round.
        for (const who of [scene.dog, scene.farmer, scene.pickles.cat, scene.rooster, scene.rival.duke].filter(Boolean)) {
          scene.floatIcon('heart', who.x, who.y - 18);
        }
        sfx.chime();
        scene.save.story.saved = true;
        // The golden wisp stays with the dog for the rest of the night.
        const wisp = this.wisp;
        wisp.setScale(1);
        wisp.halo.setScale(1.6);
        wisp.ground = { x: scene.dog.x + 12, y: scene.dog.y };
        wisp.befriend();
        this.bigGlow = null;
        cam.zoomTo(zoom, 1200, 'Sine.easeInOut');
        cam.startFollow(scene.dog, true, 0.12, 0.12);
        scene.cutscene = false;
        scene.tasks.add('finale', 1, 'night');
        scene.progressTask('finaleWisp', 1);
        scene.progressTask('finale', 1);
        scene.hud.showCard('nature-sign', 'You saved the farm!', 'The farm will be a Protected Nature Farm. Thank you for playing the first season!');
        scene.time.delayedCall(4000, () => scene.rival.leave());
      },
    );
  }

  // ---------------------------------------------------------- the rest

  get pointers() {
    if (this.step === 'rumble') return [{ x: POINTS.coopDoor.x, y: POINTS.coopDoor.y - 10, color: 0xf2c84b }];
    if (this.step === 'stop') return [{ x: this.dozer.x, y: this.dozer.y - 20, color: 0xe25d6a }];
    if (this.step === 'wisp' && this.wisp) return [{ x: this.wisp.x, y: this.wisp.y, color: 0xffd36b }];
    return [];
  }

  get lights() {
    const list = [];
    const { dozer } = this;
    if (dozer && this.engineOn) {
      const front = dozer.y - DOZER_HEIGHT;
      list.push({ x: dozer.x - 10, y: front - 10, size: 64 }, { x: dozer.x + 10, y: front - 10, size: 64 }, { x: dozer.x, y: front - 44, size: 128 });
    }
    if (this.wisp?.light) list.push(this.wisp.light);
    if (this.bigGlow) list.push(this.bigGlow);
    for (const f of this.fireflies) if (f.on) list.push(f);
    return list;
  }

  update(dt) {
    const { scene, dozer } = this;
    this.pause = Math.max(0, this.pause - dt);
    this.barkGap = Math.max(0, this.barkGap - dt);
    if (this.engineOn && (this.pause <= 0 || !this.inTheOpen) && dozer.y > DOZER_STOP) {
      const speed = dozer.y > WOODS_EDGE ? DOZER_SPEED.woods : DOZER_SPEED.meadow;
      dozer.y = Math.max(DOZER_STOP, dozer.y - speed * dt);
      this.blocker.setPosition(dozer.x, dozer.y - 12);
      this.blocker.body.updateFromGameObject();
    }
    dozer.setDepth(dozer.y);
    if (this.engineOn) {
      this.shake -= dt;
      if (this.shake <= 0) {
        this.shake = 3;
        scene.cameras.main.shake(220, 0.0015);
      }
    }
    if (this.dukeBarks != null && scene.rival.duke) {
      this.dukeBarks -= dt;
      if (this.dukeBarks <= 0) {
        this.dukeBarks = 1.6;
        sfx.bark(1.3);
        scene.hud.bubble(scene.rival.duke, 'WOOF! WOOF!', 1, 18);
      }
    }
    this.wisp?.update(dt, { dog: scene.dog, threat: null });
  }
}
