import { describe, it, expect } from 'vitest';
import { buildListMessage, buildAdminDMMessage } from '../src/handlers/list.js';

const WEEK = '2025-W24';

function makeRow(userId, userName, items) {
  return { user_id: userId, user_name: userName, items: JSON.stringify(items) };
}

describe('buildListMessage', () => {
  it('주문 없을 때 안내 메시지', () => {
    const { text, blocks } = buildListMessage([], WEEK);
    expect(text).toContain('주문이 없습니다');
    expect(blocks).toBeNull();
  });

  it('같은 상품을 다른 사람이 주문하면 합산 수량 표시', () => {
    const rows = [
      makeRow('U001', 'dohu', [{ category: '과자', brand: '오리온', item: '초코파이', qty: 2, link: null }]),
      makeRow('U002', 'john', [{ category: '과자', brand: '오리온', item: '초코파이', qty: 1, link: null }]),
    ];
    const { blocks } = buildListMessage(rows, WEEK);
    const text = blocks.map(b => b.text?.text ?? '').join('\n');
    expect(text).toContain('×3');
    expect(text).toContain('@dohu');
    expect(text).toContain('@john');
  });

  it('카테고리 순서: 과자 → 음료 → 사탕/젤리', () => {
    const rows = [
      makeRow('U001', 'dohu', [
        { category: '사탕/젤리', brand: '하리보', item: '골드베어', qty: 1, link: null },
        { category: '음료', brand: '코카콜라', item: '콜라', qty: 1, link: null },
        { category: '과자', brand: '오리온', item: '초코파이', qty: 1, link: null },
      ]),
    ];
    const { blocks } = buildListMessage(rows, WEEK);
    const catBlocks = blocks.filter(b => b.text?.text?.match(/^[🍪🧃🍬]/));
    expect(catBlocks[0].text.text).toContain('과자');
    expect(catBlocks[1].text.text).toContain('음료');
    expect(catBlocks[2].text.text).toContain('사탕/젤리');
  });

  it('링크 있는 주문 → 링크 표시', () => {
    const rows = [
      makeRow('U001', 'dohu', [
        { category: '과자', brand: '직접 입력', item: '신라면컵', qty: 1, link: 'https://coupang.com/x' },
      ]),
    ];
    const { blocks } = buildListMessage(rows, WEEK);
    const text = blocks.map(b => b.text?.text ?? '').join('\n');
    expect(text).toContain('https://coupang.com/x');
  });
});

describe('buildAdminDMMessage', () => {
  it('주문 없을 때 안내 메시지', () => {
    const { text } = buildAdminDMMessage([], WEEK);
    expect(text).toContain('주문이 없습니다');
  });

  it('구매 완료 버튼 포함', () => {
    const rows = [
      makeRow('U001', 'dohu', [{ category: '과자', brand: '오리온', item: '초코파이', qty: 2, link: null }]),
    ];
    const { blocks } = buildAdminDMMessage(rows, WEEK);
    const actionBlock = blocks.find(b => b.type === 'actions');
    expect(actionBlock).toBeTruthy();
    expect(actionBlock.elements[0].action_id).toBe('purchase_complete');
    expect(actionBlock.elements[0].value).toBe(WEEK);
  });

  it('총 수량 합산 정확', () => {
    const rows = [
      makeRow('U001', 'dohu', [{ category: '과자', brand: '오리온', item: '초코파이', qty: 3, link: null }]),
      makeRow('U002', 'john', [{ category: '과자', brand: '오리온', item: '초코파이', qty: 2, link: null }]),
    ];
    const { blocks } = buildAdminDMMessage(rows, WEEK);
    const text = blocks.map(b => b.text?.text ?? '').join('\n');
    expect(text).toContain('×5');
  });
});
