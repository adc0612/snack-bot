const KST_OFFSET = 9 * 60 * 60 * 1000;

export function nowKST() {
  return new Date(Date.now() + KST_OFFSET);
}

export function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

export function getWeekStr(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

export function isWeekend(date) {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

// 현재 KST 기준 cron 타입 반환
export function getCronType(now) {
  const h = now.getUTCHours();
  const m = now.getUTCMinutes();
  if (h === 1 && m === 0) return 'announce';
  if (h === 7 && m === 30) return 'warn';
  if (h === 8 && m === 0) return 'send';
  return null;
}
