/*  Scheduling config + date helpers shared by the booking modal and admin.  */

// 30-minute call slots offered each working day (24h "HH:MM" keys).
// Evening only — calls run after 6 PM.
export const TIME_SLOTS = [
  "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30",
];

// Days the team takes calls (0 = Sun … 6 = Sat). Mon–Sat here.
export const WORKING_DAYS = [1, 2, 3, 4, 5, 6];

// How far ahead people can book.
export const BOOKING_WINDOW_DAYS = 45;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Local-date "YYYY-MM-DD" key (avoids UTC off-by-one from toISOString).
export function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isWorkingDay(d) {
  return WORKING_DAYS.includes(d.getDay());
}

// Bookable = a working day, today or later, within the booking window.
export function isBookable(d) {
  const today = startOfToday();
  const max = new Date(today);
  max.setDate(max.getDate() + BOOKING_WINDOW_DAYS);
  return isWorkingDay(d) && d >= today && d <= max;
}

// "10:30" → "10:30 AM"
export function formatTime(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

// "2026-08-20" → "Thu, 20 Aug 2026"
export function formatDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${WEEKDAYS[date.getDay()]}, ${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
}

export { WEEKDAYS, MONTHS };
