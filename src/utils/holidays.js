import { toDateStr, addDays, isWeekend } from './date.js';

let cachedHolidays = null;
let cachedYear = null;

async function fetchHolidays(year) {
  const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/KR`);
  if (!res.ok) return [];
  return await res.json();
}

async function getHolidays(year) {
  if (cachedYear === year && cachedHolidays) return cachedHolidays;
  cachedHolidays = await fetchHolidays(year);
  cachedYear = year;
  return cachedHolidays;
}

export async function isHoliday(date) {
  const holidays = await getHolidays(date.getUTCFullYear());
  const dateStr = toDateStr(date);
  return holidays.some(h => h.date === dateStr);
}

export async function isWorkingDay(date) {
  if (isWeekend(date)) return false;
  return !(await isHoliday(date));
}

// 이번 주 첫 번째 근무일 (월요일 기준, 최대 금요일까지)
export async function firstWorkingDayOfWeek(monday) {
  for (let i = 0; i < 5; i++) {
    const d = addDays(monday, i);
    if (await isWorkingDay(d)) return d;
  }
  return null;
}

// 이번 주 마지막 근무일 (금요일 기준, 최소 월요일까지)
export async function lastWorkingDayOfWeek(monday) {
  for (let i = 4; i >= 0; i--) {
    const d = addDays(monday, i);
    if (await isWorkingDay(d)) return d;
  }
  return null;
}
