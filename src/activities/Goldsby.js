// The Goldsby plan (days 15 to 28): Mr. Goldsby wants to turn the farm into
// a giant MegaFarm, and the dog finds out and stops him. Each story day has
// a mission (see Missions.js), and the last night is the big finale (see
// Finale.js). Which day is which is in src/data/story.js. Once the farm is
// saved, a Protected Nature Farm sign stands by the road for good.

import { TILE } from '../config.js';
import { MISSIONS } from './Missions.js';
import { Finale } from './Finale.js';
import { LINES } from '../data/dialogue.js';

const SIGN_SPOT = { x: 29 * TILE, y: 30 * TILE + 4 };

// What Farmer Hazel says at dinner after each story day.
const DINNER_LINES = {
  letter: LINES.dinnerLetter,
  truckClues: LINES.dinnerClues,
  truckCall: LINES.dinnerCall,
  followGoldsby: LINES.dinnerGoldsby,
  surveyFlags: LINES.dinnerFlags,
  drone: LINES.dinnerDrone,
  rallyFriends: LINES.dinnerRally,
  natureTour: LINES.dinnerFern,
};

export class GoldsbyPlan {
  constructor(scene) {
    this.scene = scene;
    this.mission = null;
    if (scene.save.story?.saved) this.putUpSign();
  }

  putUpSign() {
    const { scene } = this;
    if (this.sign) return;
    this.sign = scene.add.image(SIGN_SPOT.x, SIGN_SPOT.y, 'nature-sign').setOrigin(0.5, 1).setDepth(SIGN_SPOT.y);
  }

  startPart(part) {
    const job = part.jobs.find((j) => MISSIONS[j] || j === 'finaleWake');
    if (!job) return;
    const Kind = job === 'finaleWake' ? Finale : MISSIONS[job];
    this.mission = new Kind(this);
    this.mission.start(part);
  }

  interaction(p, carried) {
    return this.mission?.interaction(p, carried) ?? null;
  }

  hearBark(bark) {
    this.mission?.hearBark(bark);
  }

  owns(item) {
    return Boolean(this.mission?.owns(item));
  }

  // Burying one of Mr. Goldsby's survey flags? Returns true if it was one.
  bury(item, tx, ty) {
    return Boolean(this.mission?.bury(item, tx, ty));
  }

  get pointers() {
    return this.mission?.pointers ?? [];
  }

  // Lights in the dark (the finale's headlights and fireflies).
  get lights() {
    return this.mission?.lights ?? [];
  }

  dinnerLines() {
    const { tasks } = this.scene;
    return Object.entries(DINNER_LINES)
      .filter(([job]) => tasks.get(job)?.status === 'done')
      .map(([, line]) => line);
  }

  update(dt) {
    const mission = this.mission;
    if (!mission) return;
    mission.update(dt);
    if (mission.over && this.mission === mission) this.mission = null;
  }
}
