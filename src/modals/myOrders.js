
const CATEGORY_EMOJI = { '과자': '🍪', '음료': '🧃', '사탕/젤리': '🍬' };

export function buildMyOrdersModal(items, week) {
  const blocks = [];

  if (items.length === 0) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: '아직 주문한 상품이 없습니다.\n아래 버튼으로 첫 주문을 추가해보세요! 🛒' },
    });
  } else {
    for (const item of items) {
      const emoji = CATEGORY_EMOJI[item.category] ?? '📦';
      const brandLine = item.brand && item.brand !== '직접 입력' ? ` · ${item.brand}` : '';
      const linkText = item.link ? ` · <${item.link}|링크>` : '';
      const noteText = item.note ? `\n> _${item.note}_` : '';

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *${item.item}* ×${item.qty}${brandLine}${linkText}${noteText}`,
        },
        accessory: {
          type: 'button',
          text: { type: 'plain_text', text: '삭제', emoji: false },
          style: 'danger',
          action_id: 'delete_order_item',
          value: item.id,
          confirm: {
            title: { type: 'plain_text', text: '삭제 확인' },
            text: { type: 'mrkdwn', text: `*${item.item}* 주문을 취소할까요?` },
            confirm: { type: 'plain_text', text: '삭제' },
            deny: { type: 'plain_text', text: '아니오' },
          },
        },
      });
    }

    blocks.push({ type: 'divider' });
  }

  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: '+ 상품 추가', emoji: false },
        style: 'primary',
        action_id: 'open_add_item',
      },
    ],
  });

  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  const subtitle = items.length > 0
    ? `${items.length}종류 ${totalQty}개 주문 중`
    : '주문 없음';

  return {
    type: 'modal',
    callback_id: 'my_orders_modal',
    title: { type: 'plain_text', text: '내 간식 주문' },
    close: { type: 'plain_text', text: '닫기' },
    private_metadata: week,
    blocks: [
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `📅 *${week}* · ${subtitle}` }],
      },
      ...blocks,
    ],
  };
}
