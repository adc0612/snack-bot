import { CATEGORIES, getItemOptionGroups } from '../catalog.js';

export function buildAddItemModal(selectedCategory = null, isCustom = false) {
  const blocks = [];

  // 카테고리
  blocks.push({
    type: 'input',
    block_id: 'block_category',
    dispatch_action: true,
    label: { type: 'plain_text', text: '카테고리' },
    element: {
      type: 'static_select',
      action_id: 'select_category',
      placeholder: { type: 'plain_text', text: '카테고리 선택' },
      initial_option: selectedCategory ? {
        text: { type: 'plain_text', text: selectedCategory },
        value: selectedCategory,
      } : undefined,
      options: CATEGORIES.map(c => ({
        text: { type: 'plain_text', text: c },
        value: c,
      })),
    },
  });

  // 카테고리 선택 후: 상품 선택 (브랜드별 그룹)
  if (selectedCategory) {
    const groups = getItemOptionGroups(selectedCategory);

    blocks.push({
      type: 'input',
      block_id: 'block_item',
      dispatch_action: true,
      label: { type: 'plain_text', text: '상품' },
      element: {
        type: 'static_select',
        action_id: 'select_item',
        placeholder: { type: 'plain_text', text: '상품 선택' },
        option_groups: groups.map(g => ({
          label: { type: 'plain_text', text: g.label },
          options: g.options.map(o => ({
            text: { type: 'plain_text', text: o.label },
            value: o.value,
          })),
        })),
        // 직접 입력은 그룹 밖 별도 옵션으로 추가 (option_groups와 options 동시 사용 불가)
        // → option_groups 마지막 그룹으로 넣기
      },
    });

    // 직접 입력 버튼 (section + button)
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: '목록에 없다면?' },
      accessory: {
        type: 'button',
        text: { type: 'plain_text', text: '직접 입력' },
        action_id: 'toggle_custom_input',
        value: selectedCategory,
      },
    });
  }

  // 직접 입력 모드
  if (isCustom) {
    blocks.push({
      type: 'input',
      block_id: 'block_custom_item',
      label: { type: 'plain_text', text: '상품명 직접 입력' },
      element: {
        type: 'plain_text_input',
        action_id: 'input_item_name',
        placeholder: { type: 'plain_text', text: '예) 허니버터칩, 신라면컵...' },
      },
    });

    blocks.push({
      type: 'input',
      block_id: 'block_link',
      optional: true,
      label: { type: 'plain_text', text: '구매 링크' },
      hint: { type: 'plain_text', text: '쿠팡, 이마트몰 등 (선택)' },
      element: {
        type: 'plain_text_input',
        action_id: 'input_link',
        placeholder: { type: 'plain_text', text: 'https://coupang.com/...' },
      },
    });
  }

  // 상품 선택 또는 직접 입력 후: 수량 + 메모
  if (selectedCategory) {
    blocks.push({
      type: 'input',
      block_id: 'block_qty',
      label: { type: 'plain_text', text: '수량' },
      element: {
        type: 'number_input',
        action_id: 'input_qty',
        is_decimal_allowed: false,
        min_value: '1',
        max_value: '20',
        initial_value: '1',
      },
    });

    blocks.push({
      type: 'input',
      block_id: 'block_note',
      optional: true,
      label: { type: 'plain_text', text: '메모' },
      element: {
        type: 'plain_text_input',
        action_id: 'input_note',
        placeholder: { type: 'plain_text', text: '매운맛으로, 대용량 등 (선택)' },
      },
    });
  }

  return {
    type: 'modal',
    callback_id: 'add_item_modal',
    title: { type: 'plain_text', text: '상품 추가' },
    submit: selectedCategory ? { type: 'plain_text', text: '추가하기' } : undefined,
    close: { type: 'plain_text', text: '← 뒤로' },
    private_metadata: JSON.stringify({ selectedCategory, isCustom }),
    blocks,
  };
}
