// Visitors who come on a schedule. Like the nights (src/data/nights.js),
// the same day number always brings the same visitors.
//
//   mail:  Mo the mail carrier brings a package in the morning
//   shop:  the Wagtail Wagon parks by the road at sunset

export const MAIL = { first: 3, every: 3 };
export const SHOP = { first: 4, every: 4 };

// Day 15's mail is a special letter (coming in a later chapter), so Mo
// doesn't bring a present that day.
const NO_PRESENT_DAYS = new Set([15]);

const onSchedule = (day, { first, every }) => day >= first && (day - first) % every === 0;

export function mailToday(day) {
  return onSchedule(day, MAIL) && !NO_PRESENT_DAYS.has(day);
}

export function shopToday(day) {
  return onSchedule(day, SHOP);
}

export function eventsFor(day) {
  return { mail: mailToday(day), shop: shopToday(day) };
}
