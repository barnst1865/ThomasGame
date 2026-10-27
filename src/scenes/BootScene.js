// Draws every texture once, then shows the title screen.

import { buildBaseTextures } from '../art/textures.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    buildBaseTextures(this);
    this.scene.start('Title');
  }
}
