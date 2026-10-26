// Days, seasons and the clock. Pure functions so they are easy to test.

import { TIME } from '../config.js';

export const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];

// `day` counts up forever from 1. Season and year are worked out from it.
export function dateFromDay(day, daysPerSeason = TIME.daysPerSeason) {
  const index = Math.max(0, Math.floor(day) - 1);
  const seasonIndex = Math.floor(index / daysPerSeason) % SEASONS.length;
  return {
    day,
    dayOfSeason: (index % daysPerSeason) + 1,
    seasonIndex,
    season: SEASONS[seasonIndex],
    year: Math.floor(index / (daysPerSeason * SEASONS.length)) + 1,
  };
}

export function formatDate(day, daysPerSeason) {
  const d = dateFromDay(day, daysPerSeason);
  return `${d.season} ${d.dayOfSeason}, Year ${d.year}`;
}

// Like most farming games, the clock ticks in 10-minute steps.
export function formatClock(minutes) {
  const stepped = Math.floor(minutes / 10) * 10;
  const h24 = Math.floor(stepped / 60) % 24;
  const m = stepped % 60;
  const suffix = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function isNight(minutes) {
  return minutes >= TIME.nightfall || minutes < TIME.dayStart;
}

export function canSleep(minutes) {
  return minutes >= TIME.bedtimeAllowed;
}

const lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));

// How dark the world is (0 = bright day, ~0.62 = deep night) and how much
// warm sunset tint to add on top.
export function lighting(minutes) {
  const h = minutes / 60;
  let darkness = 0;
  let dusk = 0;
  if (h < 7) {
    darkness = lerp(0.3, 0, h - 6);
    dusk = lerp(0.25, 0, h - 6);
  } else if (h >= 17.5 && h < 19) {
    dusk = lerp(0, 0.3, (h - 17.5) / 1.5);
    darkness = lerp(0, 0.15, (h - 17.5) / 1.5);
  } else if (h >= 19) {
    dusk = lerp(0.3, 0, (h - 19) / 1.5);
    darkness = lerp(0.15, 0.62, (h - 19) / 1.5);
  }
  return { darkness, dusk };
}
