import { nowKST, getWeekStr, getMondayOfWeek, getCronType } from '../utils/date.js';
import { firstWorkingDayOfWeek, lastWorkingDayOfWeek } from '../utils/holidays.js';
import { postMessage, openDM } from '../utils/slack.js';
import { getWeeklyState, setWeeklyStateField, getAllOrdersForWeek, markWeekSent } from '../handlers/db.js';
import { buildAdminDMMessage } from '../handlers/list.js';

export async function handleCron(env) {
  const now = nowKST();
  const cronType = getCronType(now);
  if (!cronType) return;

  const week = getWeekStr(now);
  const monday = getMondayOfWeek(now);
  const state = await getWeeklyState(env.DB, week);

  if (cronType === 'announce') {
    await handleAnnounce(now, monday, week, state, env);
  } else if (cronType === 'warn') {
    await handleWarn(now, monday, week, state, env);
  } else if (cronType === 'send') {
    await handleSend(now, monday, week, state, env);
  }
}

async function handleAnnounce(now, monday, week, state, env) {
  if (state.announced_at) return;

  const firstDay = await firstWorkingDayOfWeek(monday);
  if (!firstDay) return;

  const todayStr = now.toISOString().slice(0, 10);
  const firstStr = firstDay.toISOString().slice(0, 10);
  if (todayStr !== firstStr) return;

  await postMessage(
    env.SLACK_CHANNEL_ID,
    '🍿 이번 주 간식 주문을 받습니다!',
    [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '🍿 *이번 주 간식 주문을 받습니다!*\n`/snack order` 로 금요일 오후 5시까지 주문해주세요.\n현재 주문 현황은 `/snack list` 로 확인할 수 있어요.',
        },
      },
    ],
    env.SLACK_BOT_TOKEN
  );

  await setWeeklyStateField(env.DB, week, 'announced_at', null);
}

async function handleWarn(now, monday, week, state, env) {
  if (state.warned_at) return;

  const lastDay = await lastWorkingDayOfWeek(monday);
  if (!lastDay) return;

  const todayStr = now.toISOString().slice(0, 10);
  const lastStr = lastDay.toISOString().slice(0, 10);
  if (todayStr !== lastStr) return;

  await postMessage(
    env.SLACK_CHANNEL_ID,
    '⏰ 간식 주문 마감 30분 전!',
    [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '⏰ *간식 주문 마감 30분 전입니다!*\n아직 못 하신 분은 `/snack order` 로 서둘러주세요 🏃',
        },
      },
    ],
    env.SLACK_BOT_TOKEN
  );

  await setWeeklyStateField(env.DB, week, 'warned_at', null);
}

async function handleSend(now, monday, week, state, env) {
  if (state.sent_at) return;

  const lastDay = await lastWorkingDayOfWeek(monday);
  if (!lastDay) return;

  const todayStr = now.toISOString().slice(0, 10);
  const lastStr = lastDay.toISOString().slice(0, 10);
  if (todayStr !== lastStr) return;

  const rows = await getAllOrdersForWeek(env.DB, week);

  if (rows.length === 0) {
    await postMessage(
      env.SLACK_CHANNEL_ID,
      `📭 ${week} 주문이 없어 이번 주는 건너뜁니다.`,
      null,
      env.SLACK_BOT_TOKEN
    );
    await setWeeklyStateField(env.DB, week, 'sent_at', null);
    return;
  }

  // 관리자 DM 발송
  const { text, blocks } = buildAdminDMMessage(rows, week);
  const dmChannelId = await openDM(env.ADMIN_USER_ID, env.SLACK_BOT_TOKEN);
  await postMessage(dmChannelId, text, blocks, env.SLACK_BOT_TOKEN);

  // 채널 공지
  const totalItems = rows.reduce((s, r) => s + JSON.parse(r.items).length, 0);
  const totalQty = rows.reduce((s, r) =>
    s + JSON.parse(r.items).reduce((qs, i) => qs + i.qty, 0), 0
  );
  await postMessage(
    env.SLACK_CHANNEL_ID,
    `✅ 이번 주 간식 주문이 전달됐습니다!`,
    [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `✅ *이번 주(${week}) 간식 주문이 전달됐습니다!*\n총 ${rows.length}명 · ${totalItems}종류 · ${totalQty}개\n다음 주 월요일부터 다시 주문받습니다 🙏`,
        },
      },
    ],
    env.SLACK_BOT_TOKEN
  );

  await markWeekSent(env.DB, week);
}
