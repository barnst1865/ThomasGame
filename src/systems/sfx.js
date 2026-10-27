// Little sound effects made on the fly with the Web Audio API, so the game
// needs no sound files. Browsers only allow sound after the player presses
// a key or clicks, which every sound here comes after.

let ctx = null;
let muted = false;

function audio() {
  if (muted) return null;
  if (!ctx) {
    const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioCtx) return null;
    try {
      ctx = new AudioCtx();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone({ freq, to = freq, type = 'square', start = 0, duration = 0.12, volume = 0.08 }) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + start;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + duration);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

function noise({ start = 0, duration = 0.15, volume = 0.06, filter = 800 }) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + start;
  const length = Math.floor(ac.sampleRate * duration);
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = filter;
  const gain = ac.createGain();
  gain.gain.value = volume;
  src.connect(lp).connect(gain).connect(ac.destination);
  src.start(t);
}

export const sfx = {
  bark(pitch = 1) {
    tone({ freq: 520 * pitch, to: 230 * pitch, type: 'square', duration: 0.09, volume: 0.07 });
    noise({ duration: 0.08, volume: 0.05, filter: 1400 });
    tone({ freq: 470 * pitch, to: 210 * pitch, type: 'square', start: 0.13, duration: 0.08, volume: 0.06 });
  },
  pickup() {
    tone({ freq: 660, to: 990, type: 'triangle', duration: 0.1, volume: 0.07 });
  },
  drop() {
    tone({ freq: 440, to: 300, type: 'triangle', duration: 0.1, volume: 0.06 });
  },
  dig() {
    noise({ duration: 0.12, volume: 0.07, filter: 500 });
  },
  chime() {
    [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, type: 'triangle', start: i * 0.08, duration: 0.25, volume: 0.06 }));
  },
  sad() {
    [392, 330, 262].forEach((f, i) => tone({ freq: f, type: 'triangle', start: i * 0.14, duration: 0.3, volume: 0.05 }));
  },
  pounce() {
    tone({ freq: 300, to: 600, type: 'triangle', duration: 0.12, volume: 0.05 });
  },
  hit() {
    noise({ duration: 0.1, volume: 0.09, filter: 2000 });
    tone({ freq: 200, to: 90, type: 'square', duration: 0.1, volume: 0.05 });
  },
  yelp() {
    tone({ freq: 900, to: 1400, type: 'square', duration: 0.08, volume: 0.05 });
    tone({ freq: 1200, to: 700, type: 'square', start: 0.08, duration: 0.1, volume: 0.04 });
  },
  hiss() {
    noise({ duration: 0.35, volume: 0.05, filter: 4000 });
  },
  baa() {
    tone({ freq: 330, to: 300, type: 'sawtooth', duration: 0.35, volume: 0.03 });
  },
  cluck() {
    tone({ freq: 950, to: 600, type: 'triangle', duration: 0.06, volume: 0.04 });
  },
  caw() {
    tone({ freq: 620, to: 380, type: 'sawtooth', duration: 0.16, volume: 0.035 });
    tone({ freq: 560, to: 340, type: 'sawtooth', start: 0.2, duration: 0.16, volume: 0.03 });
  },
  flap() {
    noise({ duration: 0.2, volume: 0.04, filter: 900 });
  },
  munch() {
    noise({ duration: 0.06, volume: 0.05, filter: 1200 });
    noise({ start: 0.12, duration: 0.06, volume: 0.05, filter: 1200 });
  },
  throw() {
    tone({ freq: 300, to: 900, type: 'triangle', duration: 0.18, volume: 0.04 });
  },
  blip() {
    tone({ freq: 880, type: 'square', duration: 0.04, volume: 0.03 });
  },
  lullaby() {
    [659, 587, 523, 392, 523].forEach((f, i) => tone({ freq: f, type: 'sine', start: i * 0.28, duration: 0.5, volume: 0.06 }));
  },
};

export function toggleMute() {
  muted = !muted;
  if (muted && ctx) ctx.suspend().catch(() => {});
  return muted;
}

export function isMuted() {
  return muted;
}
