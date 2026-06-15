import { openModal, postMessage } from '../utils/slack.js';
import { buildMyOrdersModal } from '../modals/myOrders.js';
import { getUserOrders, currentWeek, getAllOrdersForWeek, markWeekSent } from './db.js';
import { buildListMessage } from './list.js';
import { isDevMode } from '../utils/devMode.js';

export async function handleCommand(body, env) {
  const { text, user_id, user_name, channel_id, trigger_id } = body;

  // 지정 채널 외 사용 차단 (dev 모드에서는 스킵)
  if (!isDevMode(env) && channel_id !== env.SLACK_CHANNEL_ID) {
    return jsonResponse({
      response_type: 'ephemeral',
      text: `⚠️ <#${env.SLACK_CHANNEL_ID}> 채널에서만 사용할 수 있어요.`,
    });
  }

  const sub = (text ?? '').trim().toLowerCase();

  if (!sub || sub === 'order') {
    return handleOrder(trigger_id, user_id, user_name, env);
  }
  if (sub === 'list') {
    return handleList(channel_id, env);
  }
  if (sub === 'clear') {
    return handleClear(user_id, channel_id, env);
  }

  return jsonResponse({
    response_type: 'ephemeral',
    text: '사용법: `/snack order` · `/snack list` · `/snack clear` (관리자)',
  });
}

async function handleOrder(triggerId, userId, userName, env) {
  const week = currentWeek();
  const items = await getUserOrders(env.DB, userId, week);
  const modal = buildMyOrdersModal(items, week);
  if (isDevMode(env)) return jsonResponse({ type: 'modal', view: modal });
  await openModal(triggerId, modal, env.SLACK_BOT_TOKEN);
  return new Response('', { status: 200 });
}

async function handleList(_channelId, env) {
  const week = currentWeek();
  const rows = await getAllOrdersForWeek(env.DB, week);
  const { text, blocks } = buildListMessage(rows, week);
  if (isDevMode(env)) return jsonResponse({ type: 'message', text, blocks });
  await postMessage(_channelId, text, blocks, env.SLACK_BOT_TOKEN);
  return new Response('', { status: 200 });
}

async function handleClear(userId, channelId, env) {
  if (!isDevMode(env) && userId !== env.ADMIN_USER_ID) {
    return jsonResponse({
      response_type: 'ephemeral',
      text: '⛔ 관리자만 사용할 수 있는 명령어입니다.',
    });
  }
  const week = currentWeek();
  await markWeekSent(env.DB, week);
  if (isDevMode(env)) return jsonResponse({ type: 'message', text: `🗑️ ${week} 초기화 완료`, blocks: null });
  await postMessage(channelId,
    `🗑️ 이번 주(${week}) 주문 목록이 초기화됐습니다.`,
    null,
    env.SLACK_BOT_TOKEN
  );
  return new Response('', { status: 200 });
}

function jsonResponse(body) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
}
