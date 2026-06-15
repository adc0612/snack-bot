export async function verifySlackRequest(request, signingSecret) {
  const timestamp = request.headers.get('x-slack-request-timestamp');
  const signature = request.headers.get('x-slack-signature');
  if (!timestamp || !signature) return false;

  // 5분 이상 지난 요청 거부
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const body = await request.clone().text();
  const baseString = `v0:${timestamp}:${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(signingSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(baseString));
  const hex = 'v0=' + [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
  return hex === signature;
}

export async function slackApi(method, body, token) {
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Slack API ${method} failed: ${data.error}`);
  return data;
}

export async function postMessage(channelId, text, blocks, token) {
  return slackApi('chat.postMessage', {
    channel: channelId,
    text,
    blocks,
    unfurl_links: false,
  }, token);
}

export async function openModal(triggerId, view, token) {
  return slackApi('views.open', { trigger_id: triggerId, view }, token);
}

export async function pushModal(triggerId, view, token) {
  return slackApi('views.push', { trigger_id: triggerId, view }, token);
}

export async function updateModal(viewId, view, token) {
  return slackApi('views.update', { view_id: viewId, view }, token);
}

export async function openDM(userId, token) {
  const data = await slackApi('conversations.open', { users: userId }, token);
  return data.channel.id;
}

export function parseBody(text) {
  return Object.fromEntries(new URLSearchParams(text));
}
