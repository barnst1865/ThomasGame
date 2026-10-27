// Everything drawn on top of the farm: clock, treats, hearts, today's
// jobs, button prompts, messages, dialogue, the help and pause screens,
// and the end-of-day summary.

import { GAME_WIDTH as W, GAME_HEIGHT as H, COLORS, TIME } from '../config.js';
import { formatClock, dateFromDay, isNight } from '../systems/calendar.js';
import { Controls, KEY_LABELS } from '../input/controls.js';
import { sfx, toggleMute } from '../systems/sfx.js';
import { UI, textStyle, drawPanel, drawCheckbox, Menu } from '../ui/widgets.js';

const TYPE_SPEED = 55; // letters per second in dialogue

export class HudScene extends Phaser.Scene {
  constructor() {
    super('Hud');
  }

  init(data) {
    this.farm = data.farm;
  }

  create() {
    this.controls = new Controls(this);
    this.modal = null;
    this.toasts = [];
    this.bubbles = [];
    this.lastTaskKey = '';
    this.lastStatsKey = '';

    this.buildClock();
    this.buildStats();
    this.taskPanel = this.add.graphics();
    this.taskBox = this.add.container(0, 0, [this.taskPanel]);
    this.taskTexts = [];
    this.buildPrompt();
    this.buildDialogue();
    this.arrow = this.add.graphics().setDepth(5);
    this.help = this.buildHelp();
    this.hintText = this.add
      .text(12, H - 10, `${KEY_LABELS.help}: controls   ${KEY_LABELS.pause}: pause`, textStyle(13, '#f6ecd2'))
      .setOrigin(0, 1)
      .setAlpha(0.75)
      .setShadow(1, 1, '#2b2024', 0, false, true);
  }

  isBusy() {
    return this.modal !== null;
  }

  // ------------------------------------------------------------ top bar

  buildClock() {
    const g = this.add.graphics();
    drawPanel(g, 12, 12, 226, 66);
    this.clockIcon = this.add.image(42, 45, 'sun').setScale(3);
    this.dateText = this.add.text(68, 20, '', textStyle(17, COLORS.woodDark));
    this.clockText = this.add.text(68, 40, '', textStyle(24));
    this.clockBox = this.add.container(0, 0, [g, this.clockIcon, this.dateText, this.clockText]);
    this.clockBox.rect = { x: 12, y: 12, w: 226, h: 66 };
  }

  buildStats() {
    const g = this.add.graphics();
    const x = W - 12 - 196;
    drawPanel(g, x, 12, 196, 66);
    const icon = this.add.image(x + 28, 32, 'treat').setScale(2.5);
    this.treatText = this.add.text(x + 52, 19, '', textStyle(22));
    const label = this.add.text(x + 112, 23, 'treats', textStyle(15, COLORS.woodDark));
    this.hearts = [];
    for (let i = 0; i < 10; i++) {
      this.hearts.push(this.add.image(x + 22 + i * 17, 59, 'heart-empty').setScale(2));
    }
    this.statsBox = this.add.container(0, 0, [g, icon, this.treatText, label, ...this.hearts]);
    this.statsBox.rect = { x, y: 12, w: 196, h: 66 };
  }

  // Panels fade out when the dog or the weasel walks behind them.
  fadePanels() {
    const cam = this.farm.cameras.main;
    const spots = [this.farm.dog, this.farm.weasel]
      .filter(Boolean)
      .map((o) => ({ x: (o.x - cam.worldView.x) * cam.zoom, y: (o.y - 10 - cam.worldView.y) * cam.zoom }));
    for (const box of [this.clockBox, this.statsBox, this.taskBox]) {
      const r = box.rect;
      if (!r) continue;
      const covered = spots.some((p) => p.x > r.x - 20 && p.x < r.x + r.w + 20 && p.y > r.y - 20 && p.y < r.y + r.h + 30);
      const target = covered && !this.modal ? 0.3 : 1;
      box.setAlpha(Phaser.Math.Linear(box.alpha, target, 0.2));
    }
  }

  updateTopBar() {
    const farm = this.farm;
    const date = dateFromDay(farm.save.day);
    this.dateText.setText(`${date.season} ${date.dayOfSeason}, Year ${date.year}`);
    this.clockText.setText(formatClock(farm.minutes));
    this.clockIcon.setTexture(isNight(farm.minutes) || farm.minutes >= TIME.nightfall - 30 ? 'moon' : 'sun');

    const key = `${farm.save.treats}|${farm.save.friendship.farmer}`;
    if (key !== this.lastStatsKey) {
      this.lastStatsKey = key;
      this.treatText.setText(String(farm.save.treats));
      const full = Math.floor(farm.save.friendship.farmer / 10);
      this.hearts.forEach((h, i) => h.setTexture(i < full ? 'heart' : 'heart-empty'));
    }
  }

  // --------------------------------------------------------------- tasks

  updateTasks() {
    const tasks = this.farm.tasks.tasks;
    const key = tasks.map((t) => `${t.id}:${t.progress}:${t.status}`).join('|');
    if (key === this.lastTaskKey) return;
    this.lastTaskKey = key;

    this.taskTexts.forEach((t) => t.destroy());
    this.taskTexts = [];
    const g = this.taskPanel.clear();
    const y = 88;
    const lineH = 26;
    const h = 40 + tasks.length * lineH;
    const title = this.add.text(0, y + 11, "Today's jobs", textStyle(16, COLORS.woodDark, { fontStyle: 'bold' }));
    const lines = tasks.map((task) => {
      const color = task.status === 'done' ? '#7c8a5a' : task.status === 'failed' ? '#b0623a' : COLORS.ink;
      return this.add.text(0, 0, this.farm.tasks.label(task), textStyle(15, color));
    });
    const w = Math.max(196, ...lines.map((t) => t.width + 58));
    const x = W - 12 - w;
    drawPanel(g, x, y, w, h);
    title.setX(x + 16);
    this.taskTexts.push(title, ...lines);
    this.taskBox.add([title, ...lines]);
    this.taskBox.rect = { x, y, w, h };
    lines.forEach((text, i) => {
      const ty = y + 36 + i * lineH;
      drawCheckbox(g, x + 16, ty + 2, tasks[i].status);
      text.setPosition(x + 38, ty);
    });
  }

  // -------------------------------------------------------------- prompt

  buildPrompt() {
    this.promptBg = this.add.graphics().setDepth(4);
    this.promptText = this.add.text(W / 2, H - 34, '', textStyle(18)).setOrigin(0.5).setDepth(5);
    this.lastPrompt = null;
  }

  updatePrompt() {
    const prompts = this.modal ? [] : this.farm.prompts ?? [];
    const text = prompts.map((p) => `[${p.key}] ${p.label}`).join('     ');
    if (text === this.lastPrompt) return;
    this.lastPrompt = text;
    this.promptBg.clear();
    this.promptText.setText(text);
    if (!text) return;
    const w = this.promptText.width + 36;
    drawPanel(this.promptBg, W / 2 - w / 2, H - 54, w, 40, { radius: 10 });
  }

  // -------------------------------------------------------------- toasts

  toast(message, kind = 'info') {
    const accent = kind === 'good' ? UI.good : kind === 'warn' ? UI.warn : UI.woodDark;
    const text = this.add.text(0, 0, message, textStyle(17, COLORS.ink, { wordWrap: { width: 460 }, align: 'center' })).setOrigin(0.5);
    const w = Math.max(200, text.width + 40);
    const h = text.height + 22;
    const bg = this.add.graphics();
    drawPanel(bg, -w / 2, -h / 2, w, h, { border: accent, radius: 10 });
    const box = this.add.container(W / 2, -40, [bg, text]).setDepth(20);
    box.h = h;
    this.toasts.push(box);
    this.layoutToasts();
    this.time.delayedCall(3600, () => {
      this.tweens.add({
        targets: box,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.toasts = this.toasts.filter((t) => t !== box);
          box.destroy();
          this.layoutToasts();
        },
      });
    });
  }

  layoutToasts() {
    let y = 16;
    for (const box of this.toasts) {
      this.tweens.add({ targets: box, y: y + box.h / 2, duration: 220, ease: 'Back.Out' });
      y += box.h + 8;
    }
  }

  // ------------------------------------------------------------- bubbles

  // A little speech bubble that follows something in the world.
  bubble(target, message, seconds = 2.2, offsetY = 22) {
    this.bubbles = this.bubbles.filter((b) => {
      if (b.target === target) b.box.destroy();
      return b.target !== target;
    });
    const text = this.add.text(0, 0, message, textStyle(15, COLORS.ink, { wordWrap: { width: 240 }, align: 'center' })).setOrigin(0.5);
    const w = text.width + 18;
    const h = text.height + 10;
    const g = this.add.graphics();
    g.fillStyle(UI.ink, 1).fillRoundedRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4, 7);
    g.fillStyle(0xffffff, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    g.fillStyle(UI.ink, 1).fillTriangle(-6, h / 2 + 1, 6, h / 2 + 1, 0, h / 2 + 8);
    g.fillStyle(0xffffff, 1).fillTriangle(-4, h / 2 - 1, 4, h / 2 - 1, 0, h / 2 + 5);
    const box = this.add.container(0, 0, [g, text]).setDepth(3);
    this.bubbles.push({ target, box, until: this.time.now + seconds * 1000, offsetY, w, h });
    this.positionBubbles();
  }

  positionBubbles() {
    const cam = this.farm.cameras.main;
    this.bubbles = this.bubbles.filter((b) => {
      const gone = this.time.now > b.until || !b.target.active;
      if (gone) b.box.destroy();
      return !gone;
    });
    for (const b of this.bubbles) {
      const sx = (b.target.x - cam.worldView.x) * cam.zoom;
      const sy = (b.target.y - b.offsetY - cam.worldView.y) * cam.zoom - b.h / 2 - 6;
      // Keep bubbles on screen even when the speaker is near an edge.
      const x = Phaser.Math.Clamp(sx, b.w / 2 + 6, W - b.w / 2 - 6);
      const y = Phaser.Math.Clamp(sy, b.h / 2 + 6, H - b.h / 2 - 6);
      b.box.setPosition(Math.round(x), Math.round(y)).setVisible(b.target.visible !== false);
    }
  }

  // ---------------------------------------------------- off-screen arrow

  updateArrow() {
    const g = this.arrow.clear();
    const weasel = this.farm.weasel;
    if (!weasel || weasel.state === 'flee' || this.modal) return;
    const cam = this.farm.cameras.main;
    const sx = (weasel.x - cam.worldView.x) * cam.zoom;
    const sy = (weasel.y - 8 - cam.worldView.y) * cam.zoom;
    const margin = 40;
    if (sx > 0 && sx < W && sy > 0 && sy < H) return;
    const cx = W / 2;
    const cy = H / 2;
    const angle = Math.atan2(sy - cy, sx - cx);
    const t = Math.min((cx - margin) / Math.abs(Math.cos(angle) || 1e-6), (cy - margin) / Math.abs(Math.sin(angle) || 1e-6));
    const ax = cx + Math.cos(angle) * t;
    const ay = cy + Math.sin(angle) * t;
    const pulse = 1 + Math.sin(this.time.now / 120) * 0.15;
    const p = (dist, a) => ({ x: ax + Math.cos(angle + a) * dist * pulse, y: ay + Math.sin(angle + a) * dist * pulse });
    const tip = p(16, 0);
    const l = p(14, 2.4);
    const r = p(14, -2.4);
    g.fillStyle(UI.ink, 1).fillCircle(ax, ay, 18 * pulse);
    g.fillStyle(0xe25d6a, 1).fillTriangle(tip.x, tip.y, l.x, l.y, r.x, r.y);
  }

  // ------------------------------------------------------------ dialogue

  buildDialogue() {
    const bw = 720;
    const bh = 136;
    const x = (W - bw) / 2;
    const y = H - bh - 16;
    const g = this.add.graphics();
    drawPanel(g, x, y, bw, bh, { radius: 10 });
    const nameBg = this.add.graphics();
    this.nameText = this.add.text(x + 30, y - 6, '', textStyle(17, COLORS.paper, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    this.dialogueText = this.add.text(x + 26, y + 24, '', textStyle(20, COLORS.ink, { wordWrap: { width: bw - 60 }, lineSpacing: 6 }));
    this.moreArrow = this.add.graphics();
    this.moreArrow.fillStyle(UI.woodDark, 1).fillTriangle(0, 0, 14, 0, 7, 9);
    this.moreArrow.setPosition(x + bw - 34, y + bh - 26);
    this.dialogueBox = this.add.container(0, 0, [g, nameBg, this.nameText, this.dialogueText, this.moreArrow]).setDepth(30).setVisible(false);
    this.nameBg = nameBg;
    this.dialogueFrame = { x, y };
  }

  // entries: strings or { speaker, text }
  dialogue(speaker, entries, onDone) {
    this.lines = entries.map((e) => (typeof e === 'string' ? { speaker, text: e } : e));
    this.lineIndex = -1;
    this.onDialogueDone = onDone;
    this.modal = 'dialogue';
    this.dialogueBox.setVisible(true);
    this.nextLine();
  }

  nextLine() {
    this.lineIndex += 1;
    if (this.lineIndex >= this.lines.length) {
      this.dialogueBox.setVisible(false);
      this.modal = null;
      const done = this.onDialogueDone;
      this.onDialogueDone = null;
      done?.();
      return;
    }
    const line = this.lines[this.lineIndex];
    this.fullText = line.text;
    this.shown = 0;
    this.dialogueText.setText('');
    this.dialogueText.setFontStyle(line.speaker ? 'normal' : 'italic');
    this.nameBg.clear();
    if (line.speaker) {
      this.nameText.setText(line.speaker).setVisible(true);
      const w = this.nameText.width + 28;
      this.nameBg.fillStyle(UI.woodDark, 1).fillRoundedRect(this.dialogueFrame.x + 16, this.dialogueFrame.y - 20, w, 28, 8);
    } else {
      this.nameText.setVisible(false);
    }
  }

  updateDialogue(dt) {
    if (this.shown < this.fullText.length) {
      const before = Math.floor(this.shown);
      this.shown = Math.min(this.fullText.length, this.shown + dt * TYPE_SPEED);
      if (Math.floor(this.shown) !== before && before % 3 === 0) sfx.blip();
      this.dialogueText.setText(this.fullText.slice(0, Math.floor(this.shown)));
    }
    const typing = this.shown < this.fullText.length;
    this.moreArrow.setVisible(!typing && Math.floor(this.time.now / 350) % 2 === 0);
    if (this.controls.justPressed('interact') || this.controls.justPressed('pounce')) {
      if (typing) {
        this.shown = this.fullText.length;
        this.dialogueText.setText(this.fullText);
      } else {
        this.nextLine();
      }
    }
  }

  // ---------------------------------------------------------- help/pause

  buildHelp() {
    const rows = [
      ['Move', KEY_LABELS.move],
      ['Run', `hold ${KEY_LABELS.run}`],
      ['Pick up, talk, sleep', KEY_LABELS.interact],
      ['Bark', KEY_LABELS.bark],
      ['Dig or bury', KEY_LABELS.dig],
      ['Pounce', KEY_LABELS.pounce],
      ['Pause', KEY_LABELS.pause],
      ['Sound on or off', KEY_LABELS.mute],
    ];
    const pw = 460;
    const ph = 110 + rows.length * 32;
    const x = (W - pw) / 2;
    const y = (H - ph) / 2;
    const dim = this.add.rectangle(0, 0, W, H, UI.ink, 0.55).setOrigin(0);
    const g = this.add.graphics();
    drawPanel(g, x, y, pw, ph, { radius: 12 });
    const parts = [dim, g, this.add.text(W / 2, y + 30, 'How to play', textStyle(26, COLORS.ink, { fontStyle: 'bold' })).setOrigin(0.5)];
    rows.forEach(([what, key], i) => {
      const ry = y + 70 + i * 32;
      parts.push(this.add.text(x + 40, ry, what, textStyle(18)));
      parts.push(this.add.text(x + pw - 40, ry, key, textStyle(18, COLORS.woodDark, { fontStyle: 'bold' })).setOrigin(1, 0));
    });
    parts.push(this.add.text(W / 2, y + ph - 24, 'Press H or Esc to close', textStyle(14, COLORS.woodDark)).setOrigin(0.5));
    return this.add.container(0, 0, parts).setDepth(40).setVisible(false);
  }

  openHelp() {
    this.modal = 'help';
    this.help.setVisible(true);
    this.helpOpenedAt = this.time.now;
  }

  closeHelp() {
    this.help.setVisible(false);
    this.modal = this.pauseMenu ? 'pause' : null;
  }

  openPause() {
    this.modal = 'pause';
    const dim = this.add.rectangle(0, 0, W, H, UI.ink, 0.6).setOrigin(0).setDepth(35);
    const title = this.add.text(W / 2, H / 2 - 110, 'Paused', textStyle(40, COLORS.paper, { fontStyle: 'bold' })).setOrigin(0.5).setDepth(36);
    const note = this.add
      .text(W / 2, H / 2 + 120, 'The farm saves each night when you go to sleep.', textStyle(15, COLORS.paperDark))
      .setOrigin(0.5)
      .setDepth(36);
    const menu = new Menu(this, W / 2, H / 2 - 40, [
      { label: 'Keep playing', action: () => this.closePause() },
      { label: 'How to play', action: () => this.openHelp() },
      { label: 'Quit to title', action: () => this.farm.quitToTitle() },
    ]).setDepth(36);
    this.pauseMenu = { dim, title, note, menu };
  }

  closePause() {
    if (!this.pauseMenu) return;
    const { dim, title, note, menu } = this.pauseMenu;
    [dim, title, note].forEach((o) => o.destroy());
    menu.destroy();
    this.pauseMenu = null;
    this.modal = null;
  }

  // --------------------------------------------------------- end of day

  showSleep(summary, onWake) {
    this.modal = 'sleep';
    this.closePause();
    const cover = this.add.rectangle(0, 0, W, H, 0x141a3a, 1).setOrigin(0).setDepth(50).setAlpha(0);
    const parts = [];
    this.tweens.add({
      targets: cover,
      alpha: 1,
      duration: 1200,
      onComplete: () => {
        const zs = [0, 1, 2].map((i) =>
          this.add.image(W / 2 - 40 + i * 34, 120 - i * 16, 'zzz').setScale(3 + i).setDepth(51).setAlpha(0),
        );
        zs.forEach((z, i) => this.tweens.add({ targets: z, alpha: 1, y: z.y - 8, delay: i * 250, duration: 500 }));
        parts.push(...zs);

        const pw = 480;
        const lines = summary.lines;
        const x = (W - pw) / 2;
        const y = 170;
        const title = this.add
          .text(W / 2, y + 18, summary.title, textStyle(22, COLORS.ink, { fontStyle: 'bold', align: 'center', wordWrap: { width: pw - 60 } }))
          .setOrigin(0.5, 0)
          .setDepth(52);
        const top = y + 30 + title.height;
        const ph = top - y + 100 + lines.length * 26;
        const g = this.add.graphics().setDepth(51);
        drawPanel(g, x, y, pw, ph, { radius: 12 });
        parts.push(g, title);
        lines.forEach((line, i) => {
          parts.push(this.add.text(x + 34, top + i * 26, line.text, textStyle(17, line.color ?? COLORS.ink)).setDepth(52));
          if (line.right) parts.push(this.add.text(x + pw - 34, top + i * 26, line.right, textStyle(17, COLORS.woodDark)).setOrigin(1, 0).setDepth(52));
        });
        parts.push(this.add.text(W / 2, y + ph - 58, summary.footer, textStyle(15, COLORS.woodDark)).setOrigin(0.5).setDepth(52));
        const wake = this.add.text(W / 2, y + ph - 30, 'Press E to wake up', textStyle(18, COLORS.ink, { fontStyle: 'bold' })).setOrigin(0.5).setDepth(52);
        this.tweens.add({ targets: wake, alpha: 0.4, yoyo: true, repeat: -1, duration: 700 });
        parts.push(wake);
        this.wakeReadyAt = this.time.now + 600;
        this.onWake = onWake;
      },
    });
  }

  // ------------------------------------------------------------- update

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.controls.update();
    const c = this.controls;

    if (c.justPressed('mute')) this.toast(toggleMute() ? 'Sound off' : 'Sound on');

    switch (this.modal) {
      case 'dialogue':
        this.updateDialogue(dt);
        break;
      case 'help':
        if (time - this.helpOpenedAt > 150 && Object.values(c.pressed).some(Boolean)) {
          this.closeHelp();
          c.consume('pause');
        }
        break;
      case 'pause': {
        const menu = this.pauseMenu.menu;
        if (c.justPressed('up')) menu.move(-1);
        if (c.justPressed('down')) menu.move(1);
        if (c.justPressed('interact') || c.justPressed('pounce')) menu.choose();
        else if (c.justPressed('pause')) this.closePause();
        break;
      }
      case 'sleep':
        if (this.onWake && time > this.wakeReadyAt && (c.justPressed('interact') || c.justPressed('pounce'))) {
          const wake = this.onWake;
          this.onWake = null;
          wake();
        }
        break;
      default:
        if (!this.farm.sleeping) {
          if (c.justPressed('help')) this.openHelp();
          else if (c.justPressed('pause')) this.openPause();
        }
    }

    this.updateTopBar();
    this.updateTasks();
    this.fadePanels();
    this.updatePrompt();
    this.positionBubbles();
    this.updateArrow();
  }
}
