// Starts the game.

import { GAME_WIDTH, GAME_HEIGHT } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { ChooseDogScene } from './scenes/ChooseDogScene.js';
import { FarmScene } from './scenes/FarmScene.js';
import { HudScene } from './scenes/HudScene.js';
import { installFocusGuard } from './ui/focusGuard.js';

async function waitForFont() {
  // Text is drawn onto canvases, so the pixel font has to be ready first.
  try {
    await Promise.race([document.fonts.load('20px "Pixelify Sans"'), new Promise((resolve) => setTimeout(resolve, 2500))]);
  } catch {
    // Fall back to the browser's own font.
  }
}

await waitForFont();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1d2a1f',
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [BootScene, TitleScene, ChooseDogScene, FarmScene, HudScene],
});

installFocusGuard(game);
globalThis.pawsGame = game;
