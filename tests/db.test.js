import { describe, it, expect, beforeEach } from 'vitest';
import { createMockDb } from './helpers/mockDb.js';
import { getUserOrders, addItem, deleteItem, getAllOrdersForWeek } from '../src/handlers/db.js';

const WEEK = '2025-W24';

describe('addItem', () => {
  let db;
  beforeEach(() => { db = createMockDb(); });

  it('새 상품 추가', async () => {
    const items = await addItem(db, 'U001', 'dohu', WEEK, {
      category: '과자', brand: '오리온', item: '초코파이', qty: 2, link: null, note: null,
    });
    expect(items).toHaveLength(1);
    expect(items[0].item).toBe('초코파이');
    expect(items[0].qty).toBe(2);
    expect(items[0].id).toBeTruthy();
  });

  it('같은 상품 재주문 → 수량 합산', async () => {
    await addItem(db, 'U001', 'dohu', WEEK, {
      category: '과자', brand: '오리온', item: '초코파이', qty: 2, link: null, note: null,
    });
    const items = await addItem(db, 'U001', 'dohu', WEEK, {
      category: '과자', brand: '오리온', item: '초코파이', qty: 3, link: null, note: null,
    });
    expect(items).toHaveLength(1);
    expect(items[0].qty).toBe(5);
  });

  it('다른 상품 추가 → 별도 row', async () => {
    await addItem(db, 'U001', 'dohu', WEEK, {
      category: '과자', brand: '오리온', item: '초코파이', qty: 1, link: null, note: null,
    });
    const items = await addItem(db, 'U001', 'dohu', WEEK, {
      category: '음료', brand: '코카콜라', item: '콜라', qty: 1, link: null, note: null,
    });
    expect(items).toHaveLength(2);
  });

  it('링크 없던 상품에 링크 재주문 → 링크 업데이트', async () => {
    await addItem(db, 'U001', 'dohu', WEEK, {
      category: '과자', brand: '오리온', item: '초코파이', qty: 1, link: null, note: null,
    });
    const items = await addItem(db, 'U001', 'dohu', WEEK, {
      category: '과자', brand: '오리온', item: '초코파이', qty: 1, link: 'https://coupang.com/a', note: null,
    });
    expect(items[0].link).toBe('https://coupang.com/a');
  });
});

describe('deleteItem', () => {
  let db;
  beforeEach(() => { db = createMockDb(); });

  it('id로 항목 삭제', async () => {
    const items = await addItem(db, 'U001', 'dohu', WEEK, {
      category: '과자', brand: '오리온', item: '초코파이', qty: 2, link: null, note: null,
    });
    const id = items[0].id;
    const result = await deleteItem(db, 'U001', 'dohu', WEEK, id);
    expect(result).toHaveLength(0);
  });

  it('없는 id 삭제 → 변화 없음', async () => {
    await addItem(db, 'U001', 'dohu', WEEK, {
      category: '과자', brand: '오리온', item: '초코파이', qty: 2, link: null, note: null,
    });
    const result = await deleteItem(db, 'U001', 'dohu', WEEK, 'nonexistent-id');
    expect(result).toHaveLength(1);
  });
});

describe('getAllOrdersForWeek', () => {
  let db;
  beforeEach(() => { db = createMockDb(); });

  it('여러 유저 주문 조회', async () => {
    await addItem(db, 'U001', 'dohu', WEEK, {
      category: '과자', brand: '오리온', item: '초코파이', qty: 2, link: null, note: null,
    });
    await addItem(db, 'U002', 'john', WEEK, {
      category: '음료', brand: '코카콜라', item: '콜라', qty: 1, link: null, note: null,
    });
    const rows = await getAllOrdersForWeek(db, WEEK);
    expect(rows).toHaveLength(2);
    expect(rows.map(r => r.user_id)).toContain('U001');
    expect(rows.map(r => r.user_id)).toContain('U002');
  });

  it('다른 주차는 포함 안 됨', async () => {
    await addItem(db, 'U001', 'dohu', '2025-W23', {
      category: '과자', brand: '오리온', item: '초코파이', qty: 1, link: null, note: null,
    });
    const rows = await getAllOrdersForWeek(db, WEEK);
    expect(rows).toHaveLength(0);
  });
});
