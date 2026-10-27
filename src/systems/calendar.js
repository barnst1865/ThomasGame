// Days, seasons, and how light or dark the sky is. Pure functions so they
// are easy to test.

import { DAY } from '../config.js';

export const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];

// `day` counts up forever from 1. Season and year are worked out from it.
export function dateFromDay(day, daysPerSeason = DAY.daysPerSeason) {
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

const lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));

// How dark the world is at a time of day in minutes (0 = bright day,
// ~0.62 = deep night) and how much warm sunset glow to add on top.
export function lighting(minutes) {
  const h = minutes / 60;
  if (h < 7) return { darkness: lerp(0.3, 0, h - 6), dusk: lerp(0.25, 0, h - 6) };
  if (h < 16.5) return { darkness: 0, dusk: 0 };
  if (h < 18.5) return { darkness: lerp(0, 0.12, (h - 16.5) / 2), dusk: lerp(0, 0.5, (h - 16.5) / 2) };
  if (h < 20) return { darkness: lerp(0.12, 0.62, (h - 18.5) / 1.5), dusk: lerp(0.5, 0.1, (h - 18.5) / 1.5) };
  return { darkness: 0.62, dusk: lerp(0.1, 0, h - 20) };
}
