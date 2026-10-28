// Something on the ground the dog can pick up and carry (eggs, bones,
// Farmer Hazel's lost things).

export const ITEM_NAMES = {
  egg: 'egg',
  bone: 'bone',
  ball: 'ball',
  stick: 'stick',
  hat: 'hat',
  glove: 'glove',
  key: 'key',
  package: 'package',
};

// Only the dog's own things go in the ground.
export const BURYABLE = new Set(['bone']);

export class Item extends Phaser.GameObjects.Image {
  constructor(scene, x, y, kind) {
    super(scene, x, y, kind);
    scene.add.existing(this);
    this.kind = kind;
    this.carried = false;
    this.setOrigin(0.5, 1);
    this.setDepth(y);
  }

  get label() {
    return ITEM_NAMES[this.kind] ?? this.kind;
  }
}
