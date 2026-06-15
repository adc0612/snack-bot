import { verifySlackRequest, parseBody } from './utils/slack.js';
import { handleCommand } from './handlers/command.js';
import { handleInteraction } from './handlers/interaction.js';
import { handleCron } from './cron/index.js';
import { isDevMode } from './utils/devMode.js';
import { getDevUI } from './dev/ui.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Dev UI (GET /)
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/dev')) {
      if (!isDevMode(env)) return new Response('Not Found', { status: 404 });
      return new Response(getDevUI(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if (request.method !== 'POST') {
      return new Response('OK', { status: 200 });
    }

    // Slack 서명 검증 (dev 모드에서는 스킵)
    if (!isDevMode(env)) {
      const isValid = await verifySlackRequest(request, env.SLACK_SIGNING_SECRET);
      if (!isValid) return new Response('Unauthorized', { status: 401 });
    }

    const bodyText = await request.text();
    const contentType = request.headers.get('content-type') ?? '';

    // 슬래시 커맨드
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const body = parseBody(bodyText);
      if (body.command) return handleCommand(body, env);
      // 인터랙티브 컴포넌트
      if (body.payload) {
        const payload = JSON.parse(body.payload);
        return handleInteraction(payload, env);
      }
    }

    return new Response('Not Found', { status: 404 });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleCron(env));
  },
};
