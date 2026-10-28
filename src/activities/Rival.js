// Duke, the prize-winning show dog from next door, and Gus, his owner. They
// come over on the first day of the rival story to say hello (and to
// challenge you), and again for each of the four contests (see
// src/data/story.js and Contests.js). Win or lose, Duke ends up a friend.

import { POINTS, ROAD_END } from '../world/farmMap.js';
import { Walker } from '../entities/Walker.js';
import { Dog } from '../entities/Dog.js';
import { AiControls } from '../entities/AiControls.js';
import { getBreed } from '../data/breeds.js';
import { contestOn } from '../data/story.js';
import { NAMES } from '../data/characters.js';
import { FARMER_NAME, LINES, fill } from '../data/dialogue.js';
import { makeContest } from './Contests.js';
import { sfx } from '../systems/sfx.js';

// Duke is a different breed from your dog, in his first coat.
const DUKE_BREEDS = ['golden-retriever', 'border-collie', 'corgi', 'cattle-dog'];
export const DUKE_LOOK = { collar: 'gold', neck: 'blue', hat: null };

export function dukeBreedFor(playerBreedId) {
  return getBreed(DUKE_BREEDS.find((id) => id !== playerBreedId));
}

const MAIN_PATH_Y = 264;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export class Rival {
  constructor(scene) {
    this.scene = scene;
    this.gus = null;
    this.duke = null;
    this.ai = new AiControls();
    this.route = [];
    this.onDukeArrive = null;
    this.contest = null;
    this.meeting = null; // 'walking', 'waiting' or 'done'
  }

  get story() {
    return this.scene.save.story;
  }

  // Duke helps herd only during his turn in the Herding Trial.
  get herders() {
    return this.contest?.dukeHerding ? [this.duke] : [];
  }

  // ------------------------------------------------- coming and going

  // Gus and Duke appear (walking up the road, or already standing there).
  arrive(gusSpot, dukeSpot, onArrive, { instant = false } = {}) {
    const { scene } = this;
    const breed = dukeBreedFor(scene.breed.id);
    const from = instant ? null : ROAD_END;
    this.gus = new Walker(scene, 'neighbor', from ? from.x - 8 : gusSpot.x, from ? from.y : gusSpot.y);
    this.duke = new Dog(scene, from ? from.x + 8 : dukeSpot.x, from ? from.y : dukeSpot.y, breed, breed.coats[0], DUKE_LOOK);
    this.duke.body.setCollideWorldBounds(false);
    this.duke.body.setMass(2);
    scene.physics.add.collider(this.duke, scene.collisionLayer, null, (d, tile) => tile.index !== 3);
    scene.physics.add.collider(this.duke, scene.sheepGroup);
    if (instant) {
      this.gus.faceToward(scene.farmer);
      onArrive?.();
      return;
    }
    let waiting = 2;
    const both = () => {
      waiting -= 1;
      if (waiting === 0) onArrive?.();
    };
    const via = (spot) => [POINTS.roadIn, { x: POINTS.roadIn.x, y: MAIN_PATH_Y }, { x: spot.x, y: MAIN_PATH_Y }, spot];
    this.gus.walkTo(via(gusSpot), both);
    this.dukeTo(via(dukeSpot), both);
  }

  leave() {
    const { gus, duke } = this;
    if (!gus) return;
    const back = (p) => [{ x: p.x, y: MAIN_PATH_Y }, { x: POINTS.roadIn.x, y: MAIN_PATH_Y }, POINTS.roadIn, ROAD_END];
    this.contest = null;
    this.dukeTo(back(duke), null);
    gus.walkTo(back(gus), () => {
      gus.destroy();
      duke.destroy();
      if (this.gus === gus) {
        this.gus = null;
        this.duke = null;
      }
    });
  }

  dukeTo(points, onArrive) {
    this.route = points.map((p) => ({ x: p.x, y: p.y }));
    this.onDukeArrive = onArrive;
  }

  // ------------------------------------------------------- the story

  startPart(part) {
    const { scene } = this;
    if (part.jobs.includes('meetDuke')) this.startMeeting();
    const index = contestOn(scene.save.day, this.story);
    if (index >= 0 && part.jobs.includes(['contestFetch', 'contestEggs', 'contestDig', 'herdTrial'][index])) {
      this.contest = makeContest(this, index);
      this.contest.start();
    }
  }

  startMeeting() {
    const { scene } = this;
    this.meeting = 'walking';
    this.arrive({ x: 216, y: 172 }, { x: 238, y: 178 }, () => {
      this.meeting = 'waiting';
      this.duke.facing = 'left';
      scene.hud.toast(`A visitor! Go say hello to the dog by the porch.`);
    });
  }

  meet() {
    const { scene } = this;
    const name = scene.save.dog.name;
    this.meeting = 'done';
    this.gus.faceToward(scene.dog);
    scene.farmer.talking = true;
    const say = (speaker, text) => ({ speaker, text: fill(text, name) });
    scene.hud.dialogue(
      NAMES.neighbor,
      [
        say(NAMES.neighbor, LINES.gusHello),
        say(NAMES.rival, LINES.dukeHello),
        say(FARMER_NAME, LINES.hazelBestDog),
        say(NAMES.neighbor, LINES.gusChallenge),
        say(FARMER_NAME, LINES.hazelYoureOn),
      ],
      () => {
        scene.farmer.talking = false;
        scene.progressTask('meetDuke', 1);
        this.leave();
      },
    );
    sfx.bark(1.3);
  }

  // --------------------------------------------------------- the dog

  interaction(p, carried) {
    if (this.meeting === 'waiting' && !carried && this.duke && distance(this.duke.feet, p) < 26) {
      return { label: `Say hello to ${NAMES.rival}`, action: () => this.meet() };
    }
    return this.contest?.interaction(p, carried) ?? null;
  }

  hearBark(bark) {
    this.contest?.hearBark?.(bark);
  }

  digFinds(tx, ty) {
    return Boolean(this.contest?.digFinds?.(tx, ty));
  }

  found(tx, ty) {
    this.contest.found('you', tx, ty);
  }

  owns(item) {
    return Boolean(this.contest?.owns?.(item));
  }

  // The HUD points at Gus while he's waiting for you.
  get pointer() {
    if (this.meeting === 'waiting') return this.duke;
    if (this.contest?.state === 'waiting') return this.gus;
    return null;
  }

  update(dt) {
    const { scene } = this;
    if (!this.duke) return;
    this.gus?.update(dt, scene.dog);
    // Home they went (Gus reached the end of the road just now).
    const duke = this.duke;
    if (!duke) return;
    if (this.route.length > 0) {
      const far = this.ai.steer(duke, this.route[0], dt, { run: false, near: 5 });
      this.ai.pace = 0.8;
      if (far <= 5) {
        this.route.shift();
        if (this.route.length === 0) {
          this.ai.stop();
          const done = this.onDukeArrive;
          this.onDukeArrive = null;
          done?.();
        }
      }
    } else if (!this.contest || this.contest.state !== 'play') {
      this.ai.stop();
    }
    this.contest?.update(dt);
    duke.update(dt, this.ai);
  }
}
