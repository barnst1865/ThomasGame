// Places the farm's ground, trees, buildings and fences in a scene. Used by
// the farm itself and by the title screen backdrop.

import { TILE } from '../config.js';
import { T, MAP_W, MAP_H, AREAS, POINTS, tileAt } from './farmMap.js';
import { hash2 } from '../systems/rng.js';
import { buildGroundTexture, buildTreeTextures } from '../art/textures.js';

const isFenceLike = (t) => t === T.FENCE || t === T.GATE;

// `add(obj)` lets the caller collect objects (e.g. into a container).
export function buildFarmView(scene, tiles, seasonIndex, add = (obj) => obj) {
  const view = {};
  const ground = scene.add.image(0, 0, buildGroundTexture(scene, tiles, seasonIndex)).setOrigin(0).setDepth(-1000);
  add(ground);

  buildTreeTextures(scene, seasonIndex);
  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      const t = tiles[ty][tx];
      if (t === T.TREE) {
        const variant = hash2(tx, ty, 77) < 0.5 ? 0 : 1;
        const jx = Math.floor(hash2(tx, ty, 78) * 5) - 2;
        const jy = Math.floor(hash2(tx, ty, 79) * 3) - 1;
        const y = ty * TILE + TILE + jy;
        add(scene.add.image(tx * TILE + 8 + jx, y, `tree-${seasonIndex}-${variant}`).setOrigin(0.5, 1).setDepth(y - 1));
      } else if (t === T.FENCE) {
        let mask = 0;
        if (isFenceLike(tileAt(tiles, tx, ty - 1))) mask |= 1;
        if (isFenceLike(tileAt(tiles, tx + 1, ty))) mask |= 2;
        if (isFenceLike(tileAt(tiles, tx, ty + 1))) mask |= 4;
        if (isFenceLike(tileAt(tiles, tx - 1, ty))) mask |= 8;
        add(scene.add.image(tx * TILE, ty * TILE, `fence-${mask}`).setOrigin(0).setDepth(ty * TILE + 13));
      }
    }
  }

  const footBottom = (area) => (area.y + area.h) * TILE;
  view.house = add(scene.add.image(AREAS.house.x * TILE, footBottom(AREAS.house), 'house').setOrigin(0, 1).setDepth(footBottom(AREAS.house)));
  view.doghouse = add(
    scene.add.image(AREAS.doghouse.x * TILE, footBottom(AREAS.doghouse), 'doghouse').setOrigin(0, 1).setDepth(footBottom(AREAS.doghouse)),
  );
  view.coop = add(scene.add.image(AREAS.coop.x * TILE, footBottom(AREAS.coop), 'coop').setOrigin(0, 1).setDepth(footBottom(AREAS.coop)));
  add(scene.add.image(AREAS.trough.x * TILE, AREAS.trough.y * TILE, 'trough').setOrigin(0).setDepth(footBottom(AREAS.trough)));
  add(scene.add.image(POINTS.scarecrow.x, POINTS.scarecrow.y, 'scarecrow').setOrigin(0.5, 1).setDepth(POINTS.scarecrow.y));
  add(scene.add.image(POINTS.sign.x, POINTS.sign.y, 'sign').setOrigin(0.5, 1).setDepth(POINTS.sign.y));
  add(scene.add.image(POINTS.mailbox.x, POINTS.mailbox.y, 'mailbox').setOrigin(0.5, 1).setDepth(POINTS.mailbox.y));
  view.dogBed = add(scene.add.image(POINTS.dogBed.x, POINTS.dogBed.y, 'dog-bed').setDepth(-450));
  view.basket = add(scene.add.image(POINTS.basket.x, POINTS.basket.y, 'basket-0').setOrigin(0.5, 1).setDepth(POINTS.basket.y));

  const gate = AREAS.penGate;
  view.gateClosed = add(
    scene.add
      .image(gate.x * TILE, gate.y * TILE, 'gate-closed')
      .setOrigin(0)
      .setDepth((gate.y + gate.h) * TILE)
      .setVisible(false),
  );
  view.gateOpen = add(
    scene.add
      .image((gate.x + 1) * TILE - 2, (gate.y - 1) * TILE, 'gate-open')
      .setOrigin(0)
      .setDepth(gate.y * TILE),
  );

  // Windows that glow at night (positions match the drawings in scenery.js).
  const houseTop = footBottom(AREAS.house) - 96;
  const coopTop = footBottom(AREAS.coop) - 58;
  view.windows = [
    [AREAS.house.x * TILE + 16, houseTop + 58, 16, 12, view.house.depth],
    [AREAS.house.x * TILE + 80, houseTop + 58, 16, 12, view.house.depth],
    [AREAS.coop.x * TILE + 10, coopTop + 31, 8, 6, view.coop.depth],
    [AREAS.coop.x * TILE + 46, coopTop + 31, 8, 6, view.coop.depth],
  ].map(([x, y, w, h, depth]) => add(scene.add.rectangle(x, y, w, h, 0xffd36b).setOrigin(0).setDepth(depth + 0.1).setAlpha(0)));

  // Where light shines out at night: windows, the porch lamp, the coop.
  view.lights = [
    { x: AREAS.house.x * TILE + 24, y: houseTop + 70, size: 64 },
    { x: AREAS.house.x * TILE + 88, y: houseTop + 70, size: 64 },
    { x: POINTS.houseDoor.x, y: POINTS.houseDoor.y + 4, size: 128 },
    { x: AREAS.coop.x * TILE + 32, y: footBottom(AREAS.coop), size: 64 },
  ];

  return view;
}
