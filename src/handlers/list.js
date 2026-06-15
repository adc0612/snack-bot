const CATEGORY_EMOJI = { '과자': '🍪', '음료': '🧃', '사탕/젤리': '🍬' };
const CATEGORY_ORDER = ['과자', '음료', '사탕/젤리'];

export function buildListMessage(rows, week) {
  if (!rows.length) {
    return {
      text: `📭 ${week} 아직 주문이 없습니다. \`/snack order\` 로 주문해주세요!`,
      blocks: null,
    };
  }

  // 상품별 집계: { category → { brand__item → { item, brand, category, totalQty, orders[] } } }
  const grouped = {};
  for (const row of rows) {
    const items = JSON.parse(row.items);
    for (const item of items) {
      const cat = item.category;
      const key = `${item.brand}__${item.item}`;
      if (!grouped[cat]) grouped[cat] = {};
      if (!grouped[cat][key]) {
        grouped[cat][key] = {
          category: cat,
          brand: item.brand,
          item: item.item,
          totalQty: 0,
          orders: [],
        };
      }
      grouped[cat][key].totalQty += item.qty;
      grouped[cat][key].orders.push({
        user: row.user_name,
        qty: item.qty,
        link: item.link,
      });
    }
  }

  const blocks = [];
  let totalItems = 0;
  let totalQty = 0;

  for (const cat of CATEGORY_ORDER) {
    if (!grouped[cat]) continue;
    const emoji = CATEGORY_EMOJI[cat] ?? '📦';

    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `${emoji} *${cat}*` },
    });

    for (const entry of Object.values(grouped[cat])) {
      const brandText = entry.brand && entry.brand !== '직접 입력' ? ` (${entry.brand})` : '';
      const ordersText = entry.orders
        .map(o => {
          const link = o.link ? ` <${o.link}|🔗>` : '';
          return `@${o.user} ×${o.qty}${link}`;
        })
        .join('  ·  ');

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `> *${entry.item}*${brandText} — 총 *×${entry.totalQty}*\n> ${ordersText}`,
        },
      });

      totalItems++;
      totalQty += entry.totalQty;
    }
  }

  const participantCount = rows.length;
  const summary = `📦 *${week} 간식 주문 현황* — ${participantCount}명 · ${totalItems}종류 · 총 ${totalQty}개`;

  blocks.unshift(
    { type: 'section', text: { type: 'mrkdwn', text: summary } },
    { type: 'divider' }
  );

  blocks.push(
    { type: 'divider' },
    {
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: `마감: 금요일 오후 5시 · \`/snack order\` 로 주문 · \`/snack list\` 로 현황 확인`,
      }],
    }
  );

  return { text: summary, blocks };
}

export function buildAdminDMMessage(rows, week) {
  if (!rows.length) {
    return { text: `${week} 주문이 없습니다.`, blocks: null };
  }

  // 상품별 집계
  const grouped = {};
  for (const row of rows) {
    const items = JSON.parse(row.items);
    for (const item of items) {
      const key = `${item.category}__${item.brand}__${item.item}`;
      if (!grouped[key]) {
        grouped[key] = { ...item, totalQty: 0, links: [] };
      }
      grouped[key].totalQty += item.qty;
      if (item.link) grouped[key].links.push(item.link);
    }
  }

  const blocks = [];
  blocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: `🛒 *${week} 간식 구매 목록*` },
  });
  blocks.push({ type: 'divider' });

  let totalQty = 0;
  for (const cat of CATEGORY_ORDER) {
    const entries = Object.values(grouped).filter(e => e.category === cat);
    if (!entries.length) continue;
    const emoji = CATEGORY_EMOJI[cat] ?? '📦';
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${emoji} *${cat}*\n` + entries.map(e => {
          const brandText = e.brand && e.brand !== '직접 입력' ? ` (${e.brand})` : '';
          const links = e.links.length ? '  ' + e.links.map(l => `<${l}|🔗>`).join(' ') : '';
          totalQty += e.totalQty;
          return `• ${e.item}${brandText} ×${e.totalQty}${links}`;
        }).join('\n'),
      },
    });
  }

  blocks.push({ type: 'divider' });
  blocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: `총 *${Object.keys(grouped).length}종류 ${totalQty}개*` },
  });
  blocks.push({
    type: 'actions',
    elements: [{
      type: 'button',
      text: { type: 'plain_text', text: '✅ 구매 완료' },
      style: 'primary',
      action_id: 'purchase_complete',
      value: week,
      confirm: {
        title: { type: 'plain_text', text: '구매 완료 확인' },
        text: { type: 'mrkdwn', text: `${week} 주문을 완료 처리할까요?` },
        confirm: { type: 'plain_text', text: '완료' },
        deny: { type: 'plain_text', text: '취소' },
      },
    }],
  });

  return { text: `🛒 ${week} 구매 목록`, blocks };
}
