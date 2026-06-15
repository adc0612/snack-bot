import { nowKST, getWeekStr } from '../utils/date.js';

export function currentWeek() {
  return getWeekStr(nowKST());
}

export async function getUserOrders(db, userId, week) {
  const row = await db.prepare(
    'SELECT items FROM orders WHERE user_id=? AND week=? AND status=?'
  ).bind(userId, week, 'active').first();
  return row ? JSON.parse(row.items) : [];
}

export async function saveUserOrders(db, userId, userName, week, items) {
  const now = nowKST().toISOString();
  await db.prepare(`
    INSERT INTO orders (user_id, user_name, week, items, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'active', ?, ?)
    ON CONFLICT (user_id, week) DO UPDATE SET
      user_name  = excluded.user_name,
      items      = excluded.items,
      updated_at = excluded.updated_at
  `).bind(userId, userName, week, JSON.stringify(items), now, now).run();
}

export async function addItem(db, userId, userName, week, newItem) {
  const items = await getUserOrders(db, userId, week);
  const key = `${newItem.brand}__${newItem.item}`;
  const existing = items.find(i => `${i.brand}__${i.item}` === key);

  if (existing) {
    existing.qty += newItem.qty;
    if (newItem.link && !existing.link) existing.link = newItem.link;
    if (newItem.note && !existing.note) existing.note = newItem.note;
  } else {
    items.push({ id: crypto.randomUUID(), ...newItem });
  }

  await saveUserOrders(db, userId, userName, week, items);
  return items;
}

export async function deleteItem(db, userId, userName, week, itemId) {
  const items = await getUserOrders(db, userId, week);
  const filtered = items.filter(i => i.id !== itemId);
  await saveUserOrders(db, userId, userName, week, filtered);
  return filtered;
}

export async function getAllOrdersForWeek(db, week) {
  const rows = await db.prepare(
    'SELECT user_id, user_name, items FROM orders WHERE week=? AND status=?'
  ).bind(week, 'active').all();
  return rows.results ?? [];
}

export async function markWeekSent(db, week) {
  const now = nowKST().toISOString();
  await db.prepare(
    'UPDATE orders SET status=? WHERE week=? AND status=?'
  ).bind('sent', week, 'active').run();
  await db.prepare(`
    INSERT INTO weekly_state (week, sent_at) VALUES (?, ?)
    ON CONFLICT (week) DO UPDATE SET sent_at=excluded.sent_at
  `).bind(week, now).run();
}

export async function getWeeklyState(db, week) {
  return await db.prepare(
    'SELECT * FROM weekly_state WHERE week=?'
  ).bind(week).first() ?? {};
}

export async function setWeeklyStateField(db, week, field, value) {
  const now = nowKST().toISOString();
  await db.prepare(`
    INSERT INTO weekly_state (week, ${field}) VALUES (?, ?)
    ON CONFLICT (week) DO UPDATE SET ${field}=excluded.${field}
  `).bind(week, value ?? now).run();
}
