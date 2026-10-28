// The missions of the Goldsby plan, one for each story day (see Goldsby.js
// and src/data/story.js):
//
//   TruckClues     sneak around the weird truck and sniff out 3 clues
//   TruckCall      sneak up close and listen in on the driver's phone call
//   FollowGoldsby  follow Mr. Goldsby around the farm and hear his plans
//   SurveyFlags    pull up his survey flags and bury them
//   DroneRaid      bark at the spraying drone when it swoops down low
//   RallyFriends   ask Pickles, Sir Cluckington and Duke to help
//   NatureTour     show Ms. Fern the wild things that live on the farm
//
// Nothing here can be lost: getting spotted just means trying again.

import { TILE } from '../config.js';
import { AREAS, POINTS, ROAD_END, openTilesIn } from '../world/farmMap.js';
import { Walker } from '../entities/Walker.js';
import { Vehicle } from '../entities/Vehicle.js';
import { Hawk } from '../entities/Hawk.js';
import { NAMES } from '../data/characters.js';
import { LINES, fill, pick } from '../data/dialogue.js';
import { twinkle } from './LostThing.js';
import { normalize } from '../systems/steering.js';
import { sfx } from '../systems/sfx.js';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const MAIN_PATH_Y = 264;
const ROAD_X = POINTS.roadIn.x;
const YELLOW = 0xf2c84b;
const GREEN = 0x8fe36b;

// Where the weird truck parks: at the bottom of the meadow, by the woods.
const TRUCK_PARK = { x: 30 * TILE, y: 30 * TILE + 4 };
const TRUCK_ROUTE = [{ x: ROAD_X, y: TRUCK_PARK.y }, TRUCK_PARK];

class Mission {
  constructor(plan) {
    this.plan = plan;
    this.scene = plan.scene;
    this.over = false; // everyone has gone home
  }

  get dog() {
    return this.scene.dog;
  }

  get name() {
    return this.scene.save.dog.name;
  }

  // A dialogue where everyone speaks in turn: [speaker, text] pairs.
  talk(lines, done) {
    const { scene } = this;
    scene.hud.dialogue(
      lines[0][0],
      lines.map(([speaker, text]) => ({ speaker, text: fill(text, this.name) })),
      done,
    );
  }

  start() {}
  interaction() {
    return null;
  }
  hearBark() {}
  owns() {
    return false;
  }
  bury() {
    return false;
  }
  get pointers() {
    return [];
  }
  update() {}
}

// ------------------------------------------------------ the weird truck

// Bruno, the truck driver, keeps a lookout. He can see a little way in
// front of him (the yellow patch on the ground). If the dog walks into it,
// he shoos it away.
const SIGHT = 62;
const SIGHT_ANGLE = 0.6;
const FACING_ANGLE = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };

class Lookout {
  constructor(scene, x, y) {
    this.scene = scene;
    this.walker = new Walker(scene, 'driver', x, y);
    this.walker.watchDog = false;
    this.cone = scene.add.graphics().setDepth(-450);
    this.cooldown = 0;
  }

  get feet() {
    return this.walker.feet;
  }

  get angle() {
    return FACING_ANGLE[this.walker.facing];
  }

  sees(point) {
    const eye = this.feet;
    const d = distance(eye, point);
    if (d > SIGHT || d < 4) return false;
    let diff = Math.atan2(point.y - eye.y, point.x - eye.x) - this.angle;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    return Math.abs(diff) < SIGHT_ANGLE;
  }

  // Shoo! The dog scoots back out of sight.
  shoo(dog) {
    const { scene } = this;
    this.cooldown = 1.6;
    this.walker.faceToward(dog);
    scene.hud.bubble(this.walker, pick(LINES.shoo), 1.6, 28);
    scene.hintOnce('shoo', LINES.shooHint);
    sfx.hiss();
    const away = normalize(dog.x - this.walker.x || 1, dog.y - this.walker.y);
    dog.setMode('stunned', 0.35);
    dog.setVelocity(away.x * 170, away.y * 170);
  }

  // Returns true if the dog just got spotted.
  update(dt, dog) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.walker.update(dt, dog);
    const eye = this.feet;
    const a = this.angle;
    this.cone.clear().fillStyle(0xffe066, 0.34).lineStyle(1, 0xf2c84b, 0.8);
    this.cone.slice(eye.x, eye.y, SIGHT, a - SIGHT_ANGLE, a + SIGHT_ANGLE).fillPath().strokePath();
    if (this.cooldown > 0 || dog.mode !== 'normal' || !this.sees(dog.feet)) return false;
    this.shoo(dog);
    return true;
  }

  destroy() {
    this.cone.destroy();
    this.walker.destroy();
  }
}

// The truck drives up the road and parks by the woods.
function truckArrives(scene, onParked, { instant = false } = {}) {
  const truck = new Vehicle(scene, 'truck', instant ? TRUCK_PARK.x : ROAD_END.x, instant ? TRUCK_PARK.y : ROAD_END.y + 30, { size: { w: 60, h: 14 } });
  if (instant) {
    truck.setTexture('truck-side');
    truck.park();
    onParked();
    return truck;
  }
  sfx.honk();
  truck.driveTo(TRUCK_ROUTE, () => {
    truck.park();
    onParked();
  });
  return truck;
}

function truckLeaves(truck, done) {
  sfx.honk();
  truck.driveTo([{ x: ROAD_X, y: TRUCK_PARK.y }, { x: ROAD_X, y: ROAD_END.y + 40 }], () => {
    truck.destroy();
    done();
  });
}

// Day 2 of the plan: sniff out what the truck is doing here.
const CLUES = [
  { id: 'blueprint', key: 'blueprint', dx: -40, dy: 8 },
  { id: 'sampleBag', key: 'sample-bag', dx: 14, dy: -42 },
  { id: 'farmMap', key: 'farm-map', dx: 46, dy: 6 },
];
// Bruno walks round the truck between these spots, there and back again,
// and looks around at each one.
const PATROL = [
  { x: TRUCK_PARK.x - 54, y: TRUCK_PARK.y - 6, look: ['left', 'down', 'right'] },
  { x: TRUCK_PARK.x - 40, y: TRUCK_PARK.y - 54, look: ['up', 'right', 'left'] },
  { x: TRUCK_PARK.x + 40, y: TRUCK_PARK.y - 54, look: ['down', 'up', 'left'] },
  { x: TRUCK_PARK.x + 60, y: TRUCK_PARK.y - 6, look: ['right', 'down', 'up'] },
];

class TruckClues extends Mission {
  start() {
    const { scene } = this;
    scene.hud.toast(LINES.truckArrive, 'warn');
    this.clues = [];
    this.truck = truckArrives(scene, () => this.parked());
  }

  parked() {
    const { scene } = this;
    this.bruno = new Lookout(scene, TRUCK_PARK.x + 60, TRUCK_PARK.y - 6);
    this.stop = PATROL.length - 1;
    this.step = -1;
    this.walkToStop();
    this.clues = CLUES.map((c) => {
      const spot = { x: TRUCK_PARK.x + c.dx, y: TRUCK_PARK.y + c.dy };
      return { ...c, ...spot, found: false, image: scene.add.image(spot.x, spot.y, c.key).setOrigin(0.5, 1).setDepth(spot.y - 2), twinkle: Math.random() };
    });
    scene.hintOnce('truck', LINES.truckHint);
  }

  walkToStop() {
    const spot = PATROL[this.stop];
    this.looking = null;
    this.bruno.walker.walkTo([spot], () => {
      this.looking = { turns: [...spot.look], timer: 1.1 };
      this.bruno.walker.face(this.looking.turns.shift());
    });
  }

  interaction(p, carried) {
    if (carried || !this.bruno) return null;
    const clue = this.clues.find((c) => !c.found && distance(c, p) < 16);
    if (!clue) return null;
    const info = LINES.clues[clue.id];
    return { label: `Sniff the ${clue.id === 'farmMap' ? 'map' : clue.id === 'sampleBag' ? 'bag' : 'blueprint'}`, action: () => this.sniff(clue, info) };
  }

  sniff(clue, info) {
    const { scene } = this;
    clue.found = true;
    clue.image.setAlpha(0.5);
    sfx.chime();
    scene.hud.showCard(clue.key, info.title, info.text);
    scene.progressTask('truckClues', 1);
    if (this.clues.every((c) => c.found)) scene.time.delayedCall(2500, () => this.leave());
  }

  leave() {
    const { scene, bruno } = this;
    if (this.leaving) return;
    this.leaving = true;
    bruno.cone.clear();
    scene.hud.bubble(bruno.walker, LINES.truckLeave, 3, 28);
    // Round the truck to the cab door.
    bruno.walker.walkTo([PATROL[this.stop], ...PATROL.slice(this.stop + 1)], () => {
      bruno.destroy();
      this.bruno = null;
      for (const c of this.clues) c.image.destroy();
      truckLeaves(this.truck, () => (this.over = true));
    });
  }

  get pointers() {
    return this.bruno && !this.leaving ? this.clues.filter((c) => !c.found).map((c) => ({ x: c.x, y: c.y - 6, color: YELLOW })) : [];
  }

  update(dt) {
    const { scene, dog } = this;
    this.truck?.update(dt);
    if (!this.bruno) return;
    if (!this.leaving) {
      this.bruno.update(dt, dog);
      const look = this.looking;
      if (look) {
        look.timer -= dt;
        if (look.timer <= 0) {
          if (look.turns.length) {
            this.bruno.walker.face(look.turns.shift());
            look.timer = 1.1;
          } else {
            if (this.stop + this.step < 0 || this.stop + this.step >= PATROL.length) this.step = -this.step;
            this.stop += this.step;
            this.walkToStop();
          }
        }
      }
      for (const c of this.clues) {
        if (c.found) continue;
        c.twinkle -= dt;
        if (c.twinkle <= 0) {
          c.twinkle = 1.4;
          twinkle(scene, { x: c.x, y: c.y - 4 });
        }
      }
    } else {
      this.bruno.walker.update(dt, null);
    }
  }
}

// Day 3: Bruno is back, and on the phone. Listen in!
const LISTEN_TIME = 7; // seconds of listening to hear the whole call
const LISTEN_RANGE = 54;

class TruckCall extends Mission {
  start() {
    const { scene } = this;
    this.heard = 0;
    this.truck = truckArrives(scene, () => this.parked(), { instant: true });
  }

  parked() {
    const { scene } = this;
    const spot = { x: TRUCK_PARK.x + 46, y: TRUCK_PARK.y - 18 };
    this.bruno = new Lookout(scene, spot.x, spot.y);
    this.turns = ['left', 'up', 'left', 'down', 'right', 'up'];
    this.turnIn = 3;
    this.chat = 1.5;
    this.bruno.walker.face('left');
    scene.hintOnce('call', LINES.callHint);
  }

  update(dt) {
    const { scene, dog, bruno } = this;
    this.truck?.update(dt);
    if (!bruno) return;
    if (this.finished) {
      bruno.walker.update(dt, null);
      return;
    }
    // He turns every few seconds, with a "Hmm?" just before.
    this.turnIn -= dt;
    if (this.turnIn < 0.6 && !this.warned) {
      this.warned = true;
      scene.hud.bubble(bruno.walker, 'Hmm?', 0.6, 28);
    }
    if (this.turnIn <= 0) {
      this.turns.push(this.turns.shift());
      bruno.walker.face(this.turns[0]);
      this.turnIn = 2.4 + Math.random() * 1.4;
      this.warned = false;
    }
    this.chat -= dt;
    if (this.chat <= 0) {
      this.chat = 2.8;
      if (!this.warned) scene.hud.bubble(bruno.walker, pick(LINES.callBits), 1.4, 28);
    }
    if (bruno.update(dt, dog)) this.heard = Math.max(0, this.heard - LISTEN_TIME * 0.25);
    else if (dog.mode === 'normal' && distance(dog.feet, bruno.feet) < LISTEN_RANGE) this.heard += dt;
    const share = Math.min(1, this.heard / LISTEN_TIME);
    scene.hud.setScore(`Listening in: ${Math.floor(share * 100)}%`);
    if (share >= 1) this.overheard();
  }

  overheard() {
    const { scene, bruno } = this;
    this.finished = true;
    scene.hud.setScore(null);
    bruno.cone.clear();
    const lines = [...LINES.callLines.map((l) => [NAMES.driver, l]), [null, LINES.callGrr]];
    this.talk(lines, () => {
      scene.progressTask('truckCall', 1);
      bruno.walker.walkTo([{ x: TRUCK_PARK.x + 30, y: TRUCK_PARK.y - 2 }], () => {
        bruno.destroy();
        this.bruno = null;
        truckLeaves(this.truck, () => (this.over = true));
      });
    });
  }

  get pointers() {
    return this.bruno && !this.finished ? [{ x: this.bruno.walker.x, y: this.bruno.walker.y - 20, color: YELLOW }] : [];
  }
}

// ------------------------------------------------------ Mr. Goldsby

const CAR_PARK = { x: ROAD_X + 40, y: POINTS.vanPark.y };
const TOUR = {
  pond: { x: 34 * TILE + 8, y: 11 * TILE + 12 },
  meadow: { x: 27 * TILE, y: 24 * TILE },
  woods: { x: 44 * TILE, y: MAIN_PATH_Y },
};
const HEAR_RANGE = 60;

class FollowGoldsby extends Mission {
  start() {
    const { scene } = this;
    scene.hud.toast(LINES.goldsbyArrive, 'warn');
    this.car = new Vehicle(scene, 'car', ROAD_END.x, ROAD_END.y + 30, { size: { w: 50, h: 10 } });
    sfx.honk();
    this.car.driveTo([{ x: ROAD_X, y: CAR_PARK.y }, CAR_PARK], () => this.parked());
    this.stop = 0;
    this.spurned = 0;
  }

  parked() {
    const { scene } = this;
    this.car.park();
    this.goldsby = new Walker(scene, 'tycoon', CAR_PARK.x - 8, CAR_PARK.y + 4);
    this.goldsby.watchDog = false; // too busy with his plans to notice a dog
    scene.hud.bubble(this.goldsby, LINES.goldsbyHello, 3.2, 28);
    scene.hintOnce('goldsby', LINES.goldsbyHint);
    this.walkOn();
  }

  // From one stop on the tour to the next, along the paths.
  walkOn() {
    const plan = LINES.goldsbyPlans[this.stop];
    const here = this.goldsby;
    if (!plan) {
      this.state = 'leaving';
      here.walkTo([{ x: here.x, y: MAIN_PATH_Y }, { x: CAR_PARK.x - 8, y: MAIN_PATH_Y }, { x: CAR_PARK.x - 8, y: CAR_PARK.y + 4 }], () => this.drive());
      return;
    }
    const spot = TOUR[plan.at];
    this.state = 'walking';
    here.walkTo([{ x: here.x, y: MAIN_PATH_Y }, { x: spot.x, y: MAIN_PATH_Y }, spot], () => (this.state = 'waiting'));
  }

  hearBark(bark) {
    const g = this.goldsby;
    if (!g || this.spurned > 0 || distance(g, bark) > bark.radius * 0.7) return;
    this.spurned = 2.5;
    g.jump();
    this.scene.hud.bubble(g, pick(LINES.goldsbyEek), 1.8, 28);
  }

  explain() {
    const { scene } = this;
    const plan = LINES.goldsbyPlans[this.stop];
    this.state = 'talking';
    this.talk(
      plan.lines.map((l) => [NAMES.richGuy, l]),
      () => {
        scene.progressTask('followGoldsby', 1);
        this.stop += 1;
        this.walkOn();
      },
    );
  }

  drive() {
    const { scene } = this;
    scene.hud.bubble(this.goldsby, LINES.goldsbyBye, 2.4, 28);
    scene.time.delayedCall(2000, () => {
      this.goldsby.destroy();
      this.goldsby = null;
      sfx.honk();
      this.car.driveTo([{ x: ROAD_X, y: CAR_PARK.y }, { x: ROAD_X, y: ROAD_END.y + 40 }], () => {
        this.car.destroy();
        this.over = true;
      });
    });
  }

  get pointers() {
    const g = this.goldsby;
    return g && this.state !== 'leaving' ? [{ x: g.x, y: g.y - 20, color: YELLOW }] : [];
  }

  update(dt) {
    const { scene, dog } = this;
    this.car?.update(dt);
    this.spurned = Math.max(0, this.spurned - dt);
    const g = this.goldsby;
    if (!g) return;
    g.update(dt, dog);
    if (this.state === 'waiting' && dog.mode === 'normal' && distance(dog.feet, g.feet) < HEAR_RANGE) this.explain();
    if (this.state === 'walking' && distance(dog.feet, g.feet) > 220) scene.hintOnce('keep-up', `Keep up with ${NAMES.richGuy}!`);
  }
}

// ------------------------------------------------------ survey flags

const FLAG_COUNT = 5;

class SurveyFlags extends Mission {
  start() {
    const { scene } = this;
    const tiles = openTilesIn(scene.tiles, AREAS.meadow, { diggableOnly: true });
    const picked = [];
    for (const t of Phaser.Utils.Array.Shuffle([...tiles])) {
      const spot = { x: t.x * TILE + 8, y: t.y * TILE + 12 };
      if (picked.every((p) => distance(p, spot) > 44)) picked.push(spot);
      if (picked.length === FLAG_COUNT) break;
    }
    this.flags = picked.map((s) => scene.spawnItem('flag', s.x, s.y));
    scene.time.delayedCall(1500, () => scene.hintOnce('flags', LINES.flagsHint));
  }

  owns(item) {
    return this.flags.includes(item);
  }

  // Dug into the ground where nobody will find them.
  bury(item, tx, ty) {
    const { scene } = this;
    if (!this.owns(item)) return false;
    this.flags = this.flags.filter((f) => f !== item);
    this.dog.carrying = null;
    scene.removeItem(item);
    scene.addMound(tx, ty);
    sfx.drop();
    scene.hud.bubble(this.dog, pick(LINES.flagBuried), 1.2, 18);
    scene.progressTask('surveyFlags', 1);
    if (this.flags.length === 0) this.over = true;
    return true;
  }

  get pointers() {
    return this.flags.filter((f) => !f.carried).map((f) => ({ x: f.x, y: f.y - 10, color: YELLOW }));
  }
}

// ------------------------------------------------------------ the drone

const DRONE_LOOK = { key: 'drone', frame: 'a', flap: 'drone-spin', turns: false };

class DroneRaid extends Mission {
  start() {
    this.arriveIn = 2.5;
    const f = AREAS.field;
    this.center = { x: (f.x + f.w / 2) * TILE, y: (f.y + f.h / 2) * TILE };
    // The rows of crops it wants to spray.
    this.crops = [0.2, 0.45, 0.7, 0.9].map((u, i) => {
      const spot = { x: (f.x + 0.5 + u * (f.w - 1)) * TILE, y: (f.y + 1 + (i % 2) * 3) * TILE };
      return { ...spot, feet: spot, visible: true, state: 'wander' };
    });
  }

  hearBark(bark) {
    const drone = this.drone;
    if (!drone || distance(drone.ground, bark) > bark.radius) return;
    if (!drone.scare() && ['circle', 'warn', 'arrive'].includes(drone.state)) {
      this.scene.hintOnce('drone-high', 'The drone is too high up. Wait until it swoops down low to spray, then bark!');
    }
  }

  get pointers() {
    const d = this.drone;
    return d && ['warn', 'dive'].includes(d.state) ? [{ x: d.ground.x, y: d.ground.y, color: 0xe25d6a }] : [];
  }

  spray(spot) {
    const { scene } = this;
    for (let i = 0; i < 8; i++) {
      const puff = scene.add.circle(spot.x + (Math.random() - 0.5) * 16, spot.y - 4 - Math.random() * 6, 2 + Math.random() * 2, 0xa8e08a, 0.7).setDepth(spot.y + 4);
      scene.tweens.add({ targets: puff, y: puff.y + 6, scale: 2.2, alpha: 0, duration: 900 + Math.random() * 500, onComplete: () => puff.destroy() });
    }
  }

  sparks(at) {
    const { scene } = this;
    for (let i = 0; i < 6; i++) {
      const bit = scene.add.rectangle(at.x, at.y, 2, 2, i % 2 ? 0xfff3b0 : 0x7fe08a).setDepth(9000);
      scene.tweens.add({ targets: bit, x: at.x + (Math.random() - 0.5) * 30, y: at.y + (Math.random() - 0.5) * 24, alpha: 0, duration: 450, onComplete: () => bit.destroy() });
    }
  }

  update(dt) {
    const { scene } = this;
    if (this.arriveIn !== null) {
      this.arriveIn -= dt;
      if (this.arriveIn <= 0) {
        this.arriveIn = null;
        this.drone = new Hawk(scene, this.center, DRONE_LOOK);
        sfx.blip();
        scene.hud.toast(LINES.droneArrive, 'warn');
        scene.hintOnce('drone', LINES.droneHint);
      }
    }
    const drone = this.drone;
    if (!drone) return;
    drone.update(dt, { hens: this.crops });
    if (this.dog.mode === 'pounce' && drone.low && distance(this.dog.feet, drone.ground) < 18) drone.scare();
    for (const event of drone.events.splice(0)) {
      if (event === 'warn') sfx.blip();
      else if (event === 'swooped') {
        this.spray(drone.ground);
        sfx.shake();
        scene.hud.bubble(this.dog, LINES.droneSprayed, 1.6, 18);
      } else if (event === 'scared') {
        sfx.pop();
        this.sparks({ x: drone.x, y: drone.y });
        scene.hud.bubble(drone, pick(LINES.droneScared), 1, 12);
        scene.progressTask('drone', 1);
        if (!scene.tasks.isActive('drone')) drone.leave();
      }
    }
    if (drone.done) {
      drone.destroy();
      this.drone = null;
      this.over = true;
    }
  }
}

// ----------------------------------------------------- calling friends

class RallyFriends extends Mission {
  start() {
    const { scene } = this;
    this.asked = new Set();
    scene.rival.arrive({ x: 216, y: 172 }, { x: 238, y: 178 }, () => (scene.rival.duke.facing = 'left'));
    scene.time.delayedCall(1500, () => scene.hintOnce('rally', LINES.rallyHint));
  }

  get friends() {
    const { scene } = this;
    return [
      { id: 'pickles', who: scene.pickles.cat, name: NAMES.cat, lines: LINES.rallyPickles.map((l) => [NAMES.cat, l]) },
      { id: 'rooster', who: scene.rooster, name: NAMES.rooster, lines: LINES.rallyRooster.map((l) => [NAMES.rooster, l]) },
      { id: 'duke', who: scene.rival.duke, name: NAMES.rival, lines: LINES.rallyDuke.map((l, i) => [i ? NAMES.neighbor : NAMES.rival, l]) },
    ].filter((f) => f.who && !this.asked.has(f.id));
  }

  interaction(p) {
    const friend = this.friends.find((f) => distance(f.who.feet ?? f.who, p) < 24 && !(f.id === 'duke' && this.scene.rival.route.length));
    if (!friend) return null;
    return { label: `Ask ${friend.name} to help`, action: () => this.ask(friend) };
  }

  ask(friend) {
    const { scene } = this;
    this.asked.add(friend.id);
    if (friend.id === 'rooster') sfx.crow();
    else if (friend.id === 'pickles') sfx.meow();
    else sfx.bark(1.3);
    scene.floatIcon('heart', friend.who.x, friend.who.y - 16);
    this.talk(friend.lines, () => {
      scene.progressTask('rallyFriends', 1);
      if (friend.id === 'duke') scene.rival.leave();
      if (this.asked.size === 3) this.over = true;
    });
  }

  get pointers() {
    return this.friends.map((f) => ({ x: f.who.x, y: f.who.y - 12, color: YELLOW }));
  }
}

// ------------------------------------------------------- the nature tour

const NATURE = [
  { id: 'frog', x: 33 * TILE, y: 11 * TILE + 6 },
  { id: 'nest', x: 29 * TILE + 8, y: 13 * TILE + 2, high: true },
  { id: 'bees', x: 26 * TILE + 8, y: 25 * TILE + 8 },
  { id: 'rabbits', x: 41 * TILE, y: 27 * TILE + 8 },
  { id: 'butterflies', x: 29 * TILE, y: 9 * TILE + 8 },
];
const FERN_NEAR = 64;

class NatureTour extends Mission {
  start() {
    const { scene } = this;
    scene.hud.toast(LINES.fernArrive);
    this.spots = NATURE.map((s) => ({ ...s, seen: false, things: this.critters(s) }));
    const meet = { x: POINTS.fetchSpot.x + 34, y: POINTS.fetchSpot.y + 12 };
    this.fern = new Walker(scene, 'inspector', ROAD_END.x, ROAD_END.y);
    this.state = 'arriving';
    this.fern.walkTo([POINTS.roadIn, { x: ROAD_X, y: MAIN_PATH_Y }, { x: meet.x, y: MAIN_PATH_Y }, meet], () => {
      this.state = 'hello';
      this.fern.faceToward(scene.farmer);
    });
  }

  // Little animals at each nature spot.
  critters(spot) {
    const { scene } = this;
    const things = [];
    const add = (obj) => {
      things.push(obj);
      return obj;
    };
    if (spot.id === 'frog') {
      const frog = add(scene.add.image(spot.x, spot.y, 'frog').setOrigin(0.5, 1).setDepth(spot.y));
      scene.tweens.add({ targets: frog, y: spot.y - 5, yoyo: true, duration: 180, repeat: -1, repeatDelay: 1800, ease: 'Quad.Out' });
    } else if (spot.id === 'nest') {
      // Up in the shade tree.
      add(scene.add.image(spot.x, spot.y - 22, 'nest').setOrigin(0.5, 1).setDepth(spot.y + 20));
    } else if (spot.id === 'bees') {
      for (let i = 0; i < 3; i++) {
        const bee = add(scene.add.sprite(spot.x, spot.y - 8, 'bee').play('bee-buzz').setDepth(spot.y + 10));
        scene.tweens.add({ targets: bee, x: spot.x + Math.cos(i * 2.1) * 12, y: spot.y - 12 + Math.sin(i * 2.1) * 6, yoyo: true, repeat: -1, duration: 700 + i * 160, ease: 'Sine.InOut' });
      }
    } else if (spot.id === 'rabbits') {
      for (let i = 0; i < 2; i++) {
        const bunny = add(scene.add.image(spot.x + i * 18, spot.y + i * 4, 'rabbit').setOrigin(0.5, 1).setDepth(spot.y + i * 4).setFlipX(i === 1));
        scene.tweens.add({ targets: bunny, y: bunny.y - 4, yoyo: true, duration: 160, repeat: -1, repeatDelay: 1300 + i * 700 });
      }
    } else if (spot.id === 'butterflies') {
      for (let i = 0; i < 3; i++) {
        const fly = add(scene.add.sprite(spot.x + i * 10 - 10, spot.y - 10, `butterfly-${i}`).play(`butterfly-${i}-flap`).setDepth(spot.y + 10));
        scene.tweens.add({ targets: fly, x: fly.x + 8, y: fly.y - 6, yoyo: true, repeat: -1, duration: 900 + i * 230, ease: 'Sine.InOut' });
      }
    }
    return things;
  }

  interaction(p, carried) {
    const { fern } = this;
    if (carried || !fern) return null;
    if (this.state === 'hello' && distance(fern.feet, p) < 26) {
      return { label: `Say hello to ${NAMES.inspector}`, action: () => this.hello() };
    }
    if (this.state !== 'touring') return null;
    const spot = this.spots.find((s) => !s.seen && distance(s, p) < (s.high ? 22 : 24));
    if (!spot) return null;
    const info = LINES.natureSpots[spot.id];
    if (distance(fern.feet, p) > FERN_NEAR) return { label: LINES.fernWait, action: () => this.scene.hud.bubble(fern, 'Coming!', 1.2, 28) };
    return { label: `Show ${NAMES.inspector} ${info.label}`, action: () => this.show(spot, info) };
  }

  hello() {
    this.state = 'talking';
    this.talk(LINES.fernHello.map((l) => [NAMES.inspector, l]), () => {
      this.state = 'touring';
      this.scene.hintOnce('fern', LINES.fernHint);
    });
  }

  show(spot, info) {
    const { scene } = this;
    spot.seen = true;
    this.state = 'talking';
    this.fern.faceToward(spot);
    sfx.chime();
    this.talk(info.lines.map((l) => [NAMES.inspector, l]), () => {
      scene.progressTask('natureTour', 1);
      if (this.spots.every((s) => s.seen)) this.finish();
      else this.state = 'touring';
    });
  }

  finish() {
    const { scene } = this;
    this.talk(LINES.fernDone.map((l) => [NAMES.inspector, l]), () => {
      this.state = 'leaving';
      const fern = this.fern;
      fern.walkTo([{ x: fern.x, y: MAIN_PATH_Y }, { x: ROAD_X, y: MAIN_PATH_Y }, POINTS.roadIn, ROAD_END], () => {
        fern.destroy();
        this.fern = null;
        for (const s of this.spots) for (const thing of s.things) thing.destroy();
        this.over = true;
      });
      scene.floatIcon('heart', fern.x, fern.y - 24);
    });
  }

  get pointers() {
    if (this.state === 'hello') return [{ x: this.fern.x, y: this.fern.y - 20, color: YELLOW }];
    if (this.state !== 'touring') return [];
    return this.spots.filter((s) => !s.seen).map((s) => ({ x: s.x, y: s.y - 6, color: GREEN }));
  }

  update(dt) {
    const { dog } = this;
    const fern = this.fern;
    if (!fern) return;
    // On the tour, she follows the dog around.
    if (this.state === 'touring') {
      const d = distance(fern.feet, dog.feet);
      if (d > 30) fern.walkTo([{ x: dog.x - Math.sign(dog.x - fern.x) * 18, y: dog.y + 2 }]);
      else if (!fern.arrived) {
        fern.walkTo([]);
        fern.face(fern.facing);
      }
    }
    fern.update(dt, dog);
  }
}

export const MISSIONS = {
  truckClues: TruckClues,
  truckCall: TruckCall,
  followGoldsby: FollowGoldsby,
  surveyFlags: SurveyFlags,
  drone: DroneRaid,
  rallyFriends: RallyFriends,
  natureTour: NatureTour,
};

export { Mission, TRUCK_PARK, MAIN_PATH_Y };
