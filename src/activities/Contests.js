// The Great Farm Dog Contest: four contests against Duke (see Rival.js).
//
//   Fetch Race         first to bring Farmer Hazel's ball back, 3 times
//   Painted Egg Hunt   bring the most painted eggs to the basket
//   Treasure Dig-Off   sniff out and dig up the most buried treasures
//   Herding Trial      Duke herds the flock into the pen, then you try to
//                      beat his time
//
// Each one starts when you tell Gus you're ready. Duke is quick, but he
// stops to show off now and then, so he can be beaten.

import { TILE } from '../config.js';
import { AREAS, POINTS, openTilesIn } from '../world/farmMap.js';
import { CONTESTS } from '../data/story.js';
import { NAMES } from '../data/characters.js';
import { FARMER_NAME, LINES, fill, pick } from '../data/dialogue.js';
import { scentPuff, twinkle } from './LostThing.js';
import { normalize } from '../systems/steering.js';
import { sfx } from '../systems/sfx.js';

const DUKE = NAMES.rival;
const GUS = NAMES.neighbor;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const fs = POINTS.fetchSpot;
const YARD_SPOTS = { gus: { x: fs.x - 22, y: fs.y + 14 }, duke: { x: fs.x + 18, y: fs.y - 10 }, you: { x: fs.x + 18, y: fs.y + 10 } };

export function formatTime(seconds) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Picks `count` tiles at least `gap` pixels apart.
function spreadOut(tiles, count, gap) {
  const picked = [];
  for (const t of Phaser.Utils.Array.Shuffle([...tiles])) {
    const c = { x: t.x * TILE + 8, y: t.y * TILE + 10 };
    if (picked.every((p) => distance(p, c) >= gap)) picked.push({ ...c, tx: t.x, ty: t.y });
    if (picked.length === count) break;
  }
  return picked;
}

class Contest {
  constructor(rival, index) {
    this.rival = rival;
    this.scene = rival.scene;
    this.index = index;
    this.info = CONTESTS[index];
    this.you = 0;
    this.duke = 0;
    this.state = 'waiting'; // then 'ready', 'play', 'done'
  }

  get dog() {
    return this.scene.dog;
  }

  get dukeDog() {
    return this.rival.duke;
  }

  get ai() {
    return this.rival.ai;
  }

  get spots() {
    return YARD_SPOTS;
  }

  // Gus and Duke are already here when the part of the day starts.
  start() {
    const { scene } = this;
    this.rival.arrive(this.spots.gus, this.spots.duke, null, { instant: true });
    scene.hud.toast(`${GUS} and ${DUKE} are here for the contest! Tell ${GUS} when you're ready.`, 'good');
  }

  interaction(p, carried) {
    const gus = this.rival.gus;
    if (this.state === 'waiting' && !carried && gus && distance(gus.feet, p) < 26) {
      return { label: `Tell ${GUS} you're ready`, action: () => this.announce() };
    }
    return null;
  }

  announce() {
    const { scene } = this;
    this.state = 'ready';
    scene.hud.dialogue(GUS, LINES.contestRules[this.info.id].map((l) => fill(l, scene.save.dog.name)), () => this.lineUp());
  }

  lineUp() {
    const { scene } = this;
    this.setup();
    this.dog.body.reset(this.spots.you.x, this.spots.you.y);
    this.dog.facing = 'right';
    this.dukeDog.body.reset(this.spots.duke.x, this.spots.duke.y);
    this.dukeDog.facing = 'right';
    scene.hud.setScore(this.scoreText());
    scene.hud.countdown(() => {
      this.state = 'play';
      this.go();
    });
  }

  setup() {}

  go() {}

  scoreText() {
    return `You ${this.you}  -  ${this.duke} ${DUKE}`;
  }

  point(who) {
    const { scene } = this;
    this[who] += 1;
    scene.hud.setScore(this.scoreText());
    if (who === 'you') {
      sfx.chime();
      scene.floatIcon('treat', this.dog.x, this.dog.y - 20);
    } else {
      sfx.bark(1.3);
      scene.hud.bubble(this.dukeDog, pick(['Ha!', 'Too slow!', 'Woof!']), 1, 18);
    }
  }

  // Who won, then home they go.
  finish() {
    const { scene } = this;
    this.state = 'done';
    this.ai.stop();
    scene.hud.setScore(null);
    const won = this.you > this.duke;
    const story = scene.save.story;
    story.contests[this.index] = won ? 'won' : 'lost';
    const wins = story.contests.filter((r) => r === 'won').length;
    const losses = story.contests.filter((r) => r === 'lost').length;
    const lines = [...(won ? LINES.contestWon : LINES.contestLost), `That's ${wins} for you and ${losses} for ${DUKE} so far.`];
    this.cleanup();
    scene.hud.dialogue(GUS, lines.map((l) => fill(l, scene.save.dog.name)), () => {
      if (won) scene.giveTreats(5);
      scene.progressTask(this.info.job, 1);
      this.rival.leave();
    });
  }

  cleanup() {}

  update() {}
}

// -------------------------------------------------------------- fetch

class FetchRace extends Contest {
  go() {
    this.wait = 0.8;
    this.ball = null;
  }

  throwBall() {
    const { scene } = this;
    const spots = scene.fetch.throwSpots(70, 150);
    const target = spots[Math.floor(Math.random() * spots.length)];
    this.ball = scene.fetch.toss('ball', target, (ball) => this.landed(ball));
    this.target = target;
    this.reaction = 0.45 + Math.random() * 0.4;
    this.distracted = Math.random() < 0.25 ? 1.3 : 0;
    this.ai.pace = 0.8 + Math.random() * 0.08;
  }

  landed(ball) {
    const { scene } = this;
    const dog = this.dog;
    const reach = 14 * scene.perks.catchDistance;
    if (!dog.carrying && dog.mode === 'normal' && distance(dog.feet, ball) < reach) {
      dog.carry(ball);
      sfx.chime();
      scene.hud.bubble(scene.farmer, pick(LINES.fetchCatch), 1.6, 26);
    } else {
      sfx.drop();
    }
  }

  owns(item) {
    return Boolean(item) && item === this.ball;
  }

  interaction(p, carried) {
    const farmer = this.scene.farmer;
    if (this.state === 'play' && carried === this.ball && distance(farmer.feet, p) < 26) {
      return { label: `Give the ball to ${FARMER_NAME}`, action: () => this.deliver('you') };
    }
    return super.interaction(p, carried);
  }

  deliver(who) {
    const { scene } = this;
    const holder = who === 'you' ? this.dog : this.dukeDog;
    holder.carrying = null;
    scene.removeItem(this.ball);
    this.ball = null;
    this.point(who);
    if (this[who] >= 3) this.finish();
    else this.wait = 1.2;
  }

  update(dt) {
    if (this.state !== 'play') return;
    const { scene, ai } = this;
    const duke = this.dukeDog;
    if (!this.ball) {
      this.wait -= dt;
      ai.steer(duke, this.spots.duke, dt, { run: false });
      if (this.wait <= 0) this.throwBall();
      return;
    }
    const ball = this.ball;
    if (duke.carrying === ball) {
      if (ai.steer(duke, scene.farmer, dt, { near: 16 }) <= 16) this.deliver('duke');
      return;
    }
    if (ball.carried) {
      // You've got it: Duke trots back, grumbling.
      ai.steer(duke, this.spots.duke, dt, { run: false });
      return;
    }
    if (this.reaction > 0) {
      this.reaction -= dt;
      ai.stop();
      return;
    }
    if (this.distracted > 0) {
      if (this.distracted === 1.3) scene.hud.bubble(duke, '*sniffs a flower*', 1.2, 18);
      this.distracted -= dt;
      ai.stop();
      return;
    }
    const spot = ball.inFlight ? this.target : ball;
    if (ai.steer(duke, spot, dt, { near: 3 }) < 10 && !ball.inFlight && duke.mode === 'normal') {
      duke.carry(ball);
      sfx.pickup();
    }
  }

  cleanup() {
    if (this.ball) {
      if (this.dog.carrying === this.ball) this.dog.carrying = null;
      if (this.dukeDog.carrying === this.ball) this.dukeDog.carrying = null;
      this.scene.removeItem(this.ball);
      this.ball = null;
    }
  }
}

// --------------------------------------------------------------- eggs

const EGG_COUNT = 9;
const EGGS_TO_WIN = 5;

class EggHunt extends Contest {
  setup() {
    const { scene } = this;
    const farmer = scene.farmer;
    const tiles = openTilesIn(scene.tiles, AREAS.lostThings, { diggableOnly: true }).filter((t) => {
      const d = distance({ x: t.x * TILE + 8, y: t.y * TILE + 8 }, farmer);
      return d > 48 && d < 260;
    });
    this.eggs = spreadOut(tiles, EGG_COUNT, 30).map((s) => scene.spawnItem('egg-painted', s.x, s.y));
    this.basketSpot = { x: fs.x - 16, y: fs.y + 8 };
    this.basket = scene.add.image(this.basketSpot.x, this.basketSpot.y, 'basket-0').setOrigin(0.5, 1).setDepth(this.basketSpot.y);
    this.delivered = 0;
  }

  go() {
    this.ai.pace = 0.7;
    this.rest = 1;
    this.scene.hintOnce('eggs', 'Find the painted eggs and bring them to the basket next to Farmer Hazel!');
  }

  interaction(p, carried) {
    if (this.state === 'play' && carried?.kind === 'egg-painted' && (distance(this.basketSpot, p) < 24 || distance(this.scene.farmer.feet, p) < 26)) {
      return { label: 'Put the painted egg in the basket', action: () => this.deliver('you') };
    }
    return super.interaction(p, carried);
  }

  deliver(who) {
    const { scene } = this;
    const holder = who === 'you' ? this.dog : this.dukeDog;
    const egg = holder.carrying;
    holder.carrying = null;
    scene.removeItem(egg);
    this.eggs = this.eggs.filter((e) => e !== egg);
    this.delivered += 1;
    this.basket.setTexture(`basket-${Math.min(5, this.delivered)}`);
    this.point(who);
    if (who === 'duke') this.rest = 1 + Math.random() * 1.2; // a proud little wag
    if (this[who] >= EGGS_TO_WIN || this.delivered >= EGG_COUNT) this.finish();
  }

  update(dt) {
    if (this.state !== 'play') return;
    const { ai } = this;
    const duke = this.dukeDog;
    if (this.rest > 0) {
      this.rest -= dt;
      ai.stop();
      return;
    }
    if (duke.carrying) {
      if (ai.steer(duke, this.basketSpot, dt, { near: 14 }) <= 14) this.deliver('duke');
      return;
    }
    const free = this.eggs.filter((e) => !e.carried);
    if (free.length === 0) {
      ai.steer(duke, this.spots.duke, dt, { run: false });
      return;
    }
    free.sort((a, b) => distance(a, duke) - distance(b, duke));
    const egg = free[0];
    if (ai.steer(duke, egg, dt, { near: 3 }) < 10 && duke.mode === 'normal') {
      duke.carry(egg);
      sfx.pickup();
    }
  }

  cleanup() {
    for (const egg of this.eggs ?? []) {
      if (this.dog.carrying === egg) this.dog.carrying = null;
      this.scene.removeItem(egg);
    }
    this.eggs = [];
    this.basket?.destroy();
  }
}

// ---------------------------------------------------------------- dig

const TREASURE_COUNT = 7;
const SCENT_RANGE = 90;

class DigOff extends Contest {
  setup() {
    const { scene } = this;
    const farmer = scene.farmer;
    const used = new Set([...scene.holes.keys(), ...scene.mounds.keys()]);
    const tiles = openTilesIn(scene.tiles, AREAS.lostThings, { diggableOnly: true }).filter((t) => {
      const d = distance({ x: t.x * TILE + 8, y: t.y * TILE + 8 }, farmer);
      return !used.has(`${t.x},${t.y}`) && d > 40 && d < 220;
    });
    this.treasures = spreadOut(tiles, TREASURE_COUNT, 36).map((t) => ({ ...t, found: false, puff: Math.random() }));
    this.dukeTarget = null;
    this.dukeDigging = false;
  }

  go() {
    this.ai.pace = 0.7;
    this.scene.hintOnce('dig-off', `Sniff around for wavy lines of scent, then dig! ${DUKE} is sniffing too.`);
  }

  // Dig on the spot or right next to it.
  treasureAt(tx, ty) {
    return this.treasures?.find((t) => !t.found && Math.abs(t.tx - tx) <= 1 && Math.abs(t.ty - ty) <= 1) ?? null;
  }

  digFinds(tx, ty) {
    return this.state === 'play' && Boolean(this.treasureAt(tx, ty));
  }

  found(who, tx, ty) {
    const { scene } = this;
    const t = this.treasureAt(tx, ty);
    if (!t) return;
    t.found = true;
    scene.addHole(t.tx, t.ty);
    const digger = who === 'you' ? this.dog : this.dukeDog;
    const gem = scene.add.image(t.x, t.y, 'treasure').setDepth(9400);
    scene.tweens.add({ targets: gem, y: t.y - 22, duration: 400, ease: 'Quad.Out' });
    scene.tweens.add({ targets: gem, alpha: 0, delay: 900, duration: 400, onComplete: () => gem.destroy() });
    scene.hud.bubble(digger, who === 'you' ? 'Treasure!' : 'Found one!', 1.2, 18);
    this.point(who);
    if (this.treasures.every((tr) => tr.found)) this.finish();
  }

  // Duke sniffs about. Sometimes he digs in the wrong place.
  pickTarget() {
    const left = this.treasures.filter((t) => !t.found);
    if (left.length === 0) return null;
    const real = left[Math.floor(Math.random() * left.length)];
    if (Math.random() < 0.6) return { x: real.x, y: real.y, tx: real.tx, ty: real.ty };
    const tx = real.tx + (Math.random() < 0.5 ? -3 : 3);
    const ty = real.ty + Math.floor(Math.random() * 3) - 1;
    return { x: tx * TILE + 8, y: ty * TILE + 10, tx, ty };
  }

  update(dt) {
    if (this.state !== 'play') return;
    const { scene, ai } = this;
    const duke = this.dukeDog;
    // Scent rises from treasures near you.
    const range = SCENT_RANGE * scene.perks.scentRange;
    for (const t of this.treasures) {
      if (t.found) continue;
      const d = distance(this.dog.feet, t);
      if (d > range) continue;
      t.puff -= dt;
      if (t.puff <= 0) {
        t.puff = 0.4 + (d / range) * 1.2;
        scentPuff(scene, t);
        if (scene.perks.sparkle && d < 48) twinkle(scene, t);
      }
    }
    if (this.dukeDigging) return;
    if (!this.dukeTarget) this.dukeTarget = this.pickTarget();
    const target = this.dukeTarget;
    if (!target) return;
    if (ai.steer(duke, { x: target.x, y: target.y - 6 }, dt, { run: false, near: 3 }) <= 3 && duke.mode === 'normal') {
      ai.stop();
      duke.facing = 'down';
      this.dukeDigging = true;
      duke.perks = { digTime: 1.8, runSpeed: 1 };
      duke.dig(() => {
        this.dukeDigging = false;
        this.dukeTarget = null;
        if (this.state !== 'play') return;
        if (this.treasureAt(target.tx, target.ty)) this.found('duke', target.tx, target.ty);
        else {
          scene.addHole(target.tx, target.ty);
          scene.hud.bubble(duke, 'Hmm?', 0.9, 18);
        }
      });
      sfx.dig();
    }
  }
}

// --------------------------------------------------------------- herd

const PEN_GATE = { x: 252, y: 392 };
const PEN_INSIDE = { x: 120, y: 392 };
const DUKE_LIMIT = 90; // seconds before Duke's sheep wander in by themselves

class HerdTrial extends Contest {
  get spots() {
    return { gus: { x: 262, y: 318 }, duke: { x: 284, y: 324 }, you: { x: 300, y: 398 }, watch: { x: 244, y: 314 } };
  }

  start() {
    super.start();
    this.scene.hud.toast(`${GUS} and ${DUKE} are waiting by the sheep pen.`, 'good');
  }

  scoreText() {
    const duke = this.dukeTime ?? (this.turn === 'duke' ? this.time : 0);
    const you = this.turn === 'you' ? this.time : 0;
    return `${DUKE} ${formatTime(duke)}   You ${formatTime(you)}`;
  }

  // Duke goes first, while you watch.
  lineUp() {
    const { scene } = this;
    const dog = this.dog;
    dog.body.reset(this.spots.watch.x, this.spots.watch.y);
    dog.facing = 'down';
    dog.setMode('watch');
    this.dukeDog.body.reset(this.spots.duke.x, this.spots.duke.y);
    this.letSheepOut();
    this.turn = 'duke';
    this.time = 0;
    this.shows = [8, 17, 27, 38];
    this.pause = 0;
    scene.cameras.main.startFollow(this.dukeDog, true, 0.08, 0.08);
    scene.hud.setScore(this.scoreText());
    scene.hud.countdown(() => {
      this.state = 'play';
      this.dukeHerding = true;
      this.ai.pace = 0.68;
    });
  }

  letSheepOut() {
    const { scene } = this;
    scene.setGate(false);
    for (const sheep of scene.sheep) {
      if (sheep.lamb) continue;
      if (sheep.state !== 'grazing' || sheep.x < 250) {
        sheep.body.reset(300 + Math.random() * 200, 350 + Math.random() * 100);
      }
      sheep.state = 'grazing';
      sheep.target = null;
    }
  }

  get flock() {
    return this.scene.sheep.filter((s) => !s.lamb);
  }

  herdStep(dt) {
    const { ai } = this;
    const duke = this.dukeDog;
    const todo = this.flock.filter((s) => s.state !== 'penned');
    if (todo.length === 0) return;
    todo.sort((a, b) => distance(a, PEN_GATE) - distance(b, PEN_GATE));
    const s = todo[0];
    const target = s.x > 236 ? PEN_GATE : PEN_INSIDE;
    const d = normalize(target.x - s.x, target.y - s.y);
    let goal = { x: s.x - d.x * 24, y: s.y - d.y * 24 };
    const toDog = { x: duke.x - s.x, y: duke.y - s.y };
    if (toDog.x * d.x + toDog.y * d.y > -6 && Math.hypot(toDog.x, toDog.y) < 90) {
      // On the wrong side: go round the sheep, not through it.
      const side = toDog.x * -d.y + toDog.y * d.x >= 0 ? 1 : -1;
      goal = { x: s.x - d.y * side * 70 - d.x * 30, y: s.y + d.x * side * 70 - d.y * 30 };
    }
    const far = Math.hypot(goal.x - duke.x, goal.y - duke.y);
    ai.steer(duke, goal, dt, { run: far > 50, near: 4 });
  }

  update(dt) {
    if (this.state !== 'play') return;
    const { scene } = this;
    this.time += dt;
    scene.hud.setScore(this.scoreText());
    const penned = this.flock.every((s) => s.state === 'penned');
    if (this.turn === 'duke') {
      if (this.pause > 0) {
        this.pause -= dt;
        this.ai.stop();
      } else if (this.shows.length && this.time > this.shows[0]) {
        this.shows.shift();
        this.pause = 1.8;
        scene.hud.bubble(this.dukeDog, pick(['*poses for the crowd*', 'Ta-da!', '*fluffs his fur*', '*waves at Gus*']), 1.8, 18);
      } else {
        this.herdStep(dt);
      }
      if (!penned && this.time > DUKE_LIMIT) {
        for (const s of this.flock) if (s.state !== 'penned') s.body.reset(100 + Math.random() * 60, 380 + Math.random() * 30);
      }
      if (penned) this.dukeDone();
      return;
    }
    if (penned) this.youDone();
  }

  dukeDone() {
    const { scene } = this;
    this.state = 'between';
    this.dukeHerding = false;
    this.dukeTime = this.time;
    this.ai.stop();
    scene.hud.setScore(this.scoreText());
    scene.hud.dialogue(GUS, [fill(LINES.dukeTime, scene.save.dog.name).replace('{time}', formatTime(this.dukeTime))], () => {
      const cam = scene.cameras.main;
      cam.fadeOut(350, 20, 26, 58);
      cam.once('camerafadeoutcomplete', () => {
        this.letSheepOut();
        this.dukeDog.body.reset(this.spots.duke.x, this.spots.duke.y - 12);
        const dog = this.dog;
        dog.setMode('normal');
        dog.body.reset(this.spots.you.x, this.spots.you.y);
        cam.startFollow(dog, true, 0.12, 0.12);
        cam.fadeIn(350, 20, 26, 58);
        this.turn = 'you';
        this.time = 0;
        scene.hud.setScore(this.scoreText());
        scene.hud.countdown(() => (this.state = 'play'));
      });
    });
  }

  youDone() {
    const { scene } = this;
    this.state = 'done';
    const yourTime = this.time;
    const won = yourTime < this.dukeTime;
    this.you = won ? 1 : 0;
    this.duke = won ? 0 : 1;
    scene.hud.setScore(null);
    const story = scene.save.story;
    story.contests[this.index] = won ? 'won' : 'lost';
    const wins = story.contests.filter((r) => r === 'won').length;
    const name = scene.save.dog.name;
    const lines = [
      { speaker: GUS, text: `You did it in ${formatTime(yourTime)}! ${won ? `That beats ${DUKE}'s time!` : `${DUKE} was just a little faster.`}` },
      ...this.ceremony(wins, story.contests.filter((r) => r === 'lost').length).map((text) => ({ speaker: GUS, text: fill(text, name) })),
      { speaker: DUKE, text: fill(LINES.dukeFriends, name) },
      { speaker: null, text: fill(LINES.dukeNoses, name) },
    ];
    story.trophy = wins >= 2 ? 'gold' : 'ribbon';
    story.dukeFriend = true;
    scene.hud.dialogue(GUS, lines, () => {
      if (won) scene.giveTreats(5);
      scene.showTrophy();
      scene.progressTask('herdTrial', 1);
      this.rival.leave();
    });
  }

  ceremony(wins, losses) {
    if (wins >= 3) return LINES.ceremonyChampion.map((l) => l.replace('{wins}', wins));
    if (wins === 2) return LINES.ceremonyTie;
    return LINES.ceremonyRibbon.map((l) => l.replace('{wins}', losses));
  }
}

export function makeContest(rival, index) {
  const Kind = [FetchRace, EggHunt, DigOff, HerdTrial][index];
  return new Kind(rival, index);
}
