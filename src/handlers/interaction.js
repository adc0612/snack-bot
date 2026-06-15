import { updateModal, pushModal, postMessage } from '../utils/slack.js';
import { buildMyOrdersModal } from '../modals/myOrders.js';
import { buildAddItemModal } from '../modals/addItem.js';
import { addItem, deleteItem, currentWeek, markWeekSent } from './db.js';
import { parseItemValue } from '../catalog.js';
import { isDevMode } from '../utils/devMode.js';

export async function handleInteraction(payload, env) {
  const { type } = payload;
  if (type === 'block_actions') return handleBlockAction(payload, env);
  if (type === 'view_submission') return handleViewSubmission(payload, env);
  return new Response('', { status: 200 });
}

async function handleBlockAction(payload, env) {
  const action = payload.actions?.[0];
  if (!action) return new Response('', { status: 200 });

  const { user, view } = payload;
  const week = currentWeek();
  const meta = safeParseJSON(view?.private_metadata);

  // 상품 추가 버튼
  if (action.action_id === 'open_add_item') {
    const addModal = buildAddItemModal();
    if (isDevMode(env)) return devJson({ type: 'modal_push', view: addModal });
    await pushModal(payload.trigger_id, addModal, env.SLACK_BOT_TOKEN);
    return new Response('', { status: 200 });
  }

  // 상품 삭제
  if (action.action_id === 'delete_order_item') {
    const updatedItems = await deleteItem(env.DB, user.id, user.name, week, action.value);
    const modal = buildMyOrdersModal(updatedItems, week);
    if (isDevMode(env)) return devJson({ type: 'modal_update', view: modal });
    await updateModal(view.id, modal, env.SLACK_BOT_TOKEN);
    return new Response('', { status: 200 });
  }

  // 카테고리 선택
  if (action.action_id === 'select_category') {
    const selectedCategory = action.selected_option.value;
    const modal = buildAddItemModal(selectedCategory, false);
    if (isDevMode(env)) return devJson({ type: 'modal_update', view: modal });
    await updateModal(view.id, modal, env.SLACK_BOT_TOKEN);
    return new Response('', { status: 200 });
  }

  // 상품 선택 (value = "브랜드::상품명") — dispatch_action이지만 제출 시 처리하므로 no-op
  if (action.action_id === 'select_item') {
    return new Response('', { status: 200 });
  }

  // 직접 입력 토글
  if (action.action_id === 'toggle_custom_input') {
    const modal = buildAddItemModal(meta.selectedCategory, !meta.isCustom);
    if (isDevMode(env)) return devJson({ type: 'modal_update', view: modal });
    await updateModal(view.id, modal, env.SLACK_BOT_TOKEN);
    return new Response('', { status: 200 });
  }

  // 구매 완료 (관리자 DM)
  if (action.action_id === 'purchase_complete') {
    const targetWeek = action.value;
    await markWeekSent(env.DB, targetWeek);
    await postMessage(
      env.SLACK_CHANNEL_ID,
      `✅ ${targetWeek} 간식 주문이 완료됐습니다! 곧 도착 예정 🎉`,
      null,
      env.SLACK_BOT_TOKEN
    );
    const updatedBlocks = (payload.message?.blocks ?? []).map(b =>
      b.type === 'actions'
        ? { type: 'section', text: { type: 'mrkdwn', text: '✅ 구매 완료 처리됨' } }
        : b
    );
    return jsonResponse({ replace_original: true, blocks: updatedBlocks });
  }

  return new Response('', { status: 200 });
}

async function handleViewSubmission(payload, env) {
  const { view, user } = payload;
  const week = currentWeek();

  if (view.callback_id === 'add_item_modal') {
    const meta = safeParseJSON(view.private_metadata);
    const values = view.state.values;
    const isCustom = meta.isCustom;

    let brand, itemName, link;

    if (isCustom) {
      brand = null;
      itemName = values.block_custom_item?.input_item_name?.value?.trim();
      link = values.block_link?.input_link?.value || null;
    } else {
      const rawValue = values.block_item?.select_item?.selected_option?.value;
      if (!rawValue) {
        return jsonResponse({
          response_action: 'errors',
          errors: { block_item: '상품을 선택해주세요.' },
        });
      }
      ({ brand, item: itemName } = parseItemValue(rawValue));
      link = null;
    }

    if (!itemName) {
      return jsonResponse({
        response_action: 'errors',
        errors: { block_custom_item: '상품명을 입력해주세요.' },
      });
    }

    const qty = parseInt(values.block_qty?.input_qty?.value ?? '1', 10);
    const note = values.block_note?.input_note?.value || null;

    const updatedItems = await addItem(env.DB, user.id, user.name, week, {
      category: meta.selectedCategory,
      brand,
      item: itemName,
      qty,
      link,
      note,
    });

    const myOrdersModal = buildMyOrdersModal(updatedItems, week);
    return jsonResponse({ response_action: 'update', view: myOrdersModal });
  }

  return jsonResponse({ response_action: 'clear' });
}

function safeParseJSON(str) {
  try { return JSON.parse(str); } catch { return {}; }
}

function jsonResponse(body) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function devJson(body) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
}
