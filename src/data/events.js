// Visitors who come on a schedule. Like the nights (src/data/nights.js),
// the same day number always brings the same visitors.
//
//   mail:  Mo the mail carrier brings a package in the morning
//   shop:  the Wagtail Wagon parks by the road at sunset

import { NEW_STORY, letterDay } from './story.js';

export const MAIL = { first: 3, every: 3 };
export const SHOP = { first: 4, every: 4 };

const onSchedule = (day, { first, every }) => day >= first && (day - first) % every === 0;

// On the day of the special letter (see story.js), Mo brings that instead
// of a present.
export function mailToday(day, story = NEW_STORY) {
  return onSchedule(day, MAIL) && day !== letterDay(story);
}

export function shopToday(day) {
  return onSchedule(day, SHOP);
}

export function eventsFor(day, story = NEW_STORY) {
  return { mail: mailToday(day, story), shop: shopToday(day) };
}
