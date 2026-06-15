export function getDevUI() {
  return /* html */`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>🍿 Snack Bot — Dev UI</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #1a1d21; color: #d1d2d3; min-height: 100vh; }

  /* TOP BAR */
  .topbar { background: #19171d; border-bottom: 1px solid #35373b; padding: 10px 20px; display: flex; align-items: center; gap: 16px; }
  .topbar-title { font-size: 15px; font-weight: 700; color: #fff; }
  .topbar-badge { font-size: 11px; background: #2bac76; color: #fff; padding: 2px 8px; border-radius: 99px; }
  .user-select { background: #2c2d30; border: 1px solid #565856; color: #d1d2d3; padding: 5px 10px; border-radius: 6px; font-size: 13px; cursor: pointer; }

  /* LAYOUT */
  .layout { display: flex; height: calc(100vh - 49px); }
  .sidebar { width: 220px; background: #19171d; border-right: 1px solid #35373b; padding: 16px 12px; flex-shrink: 0; }
  .sidebar-section { font-size: 11px; color: #8c8c8c; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; margin-top: 16px; }
  .sidebar-section:first-child { margin-top: 0; }
  .cmd-btn { width: 100%; text-align: left; background: none; border: none; color: #d1d2d3; padding: 7px 10px; border-radius: 6px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
  .cmd-btn:hover { background: #2c2d30; color: #fff; }
  .cmd-btn .cmd-code { font-family: monospace; font-size: 12px; color: #4a9eda; }

  /* CHANNEL AREA */
  .channel { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .channel-header { padding: 12px 20px; border-bottom: 1px solid #35373b; font-size: 14px; font-weight: 600; color: #fff; display: flex; align-items: center; gap: 8px; }
  .channel-body { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 4px; }

  /* MESSAGES */
  .msg { display: flex; gap: 10px; padding: 4px 0; }
  .msg-avatar { width: 36px; height: 36px; border-radius: 4px; background: #4a154b; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #fff; flex-shrink: 0; margin-top: 2px; }
  .msg-body { flex: 1; }
  .msg-meta { display: flex; align-items: baseline; gap: 8px; margin-bottom: 3px; }
  .msg-name { font-size: 14px; font-weight: 700; color: #fff; }
  .msg-time { font-size: 11px; color: #8c8c8c; }
  .msg-text { font-size: 14px; line-height: 1.6; color: #d1d2d3; }
  .msg-text strong { color: #fff; }
  .msg-text em { color: #a0a0a0; }
  .msg-text a { color: #4a9eda; text-decoration: none; }

  /* BLOCK: section */
  .block-section { background: #222529; border-radius: 4px; padding: 10px 14px; margin-top: 6px; border-left: 3px solid #565856; }
  .block-section.cat-snack { border-left-color: #2bac76; }
  .block-section.cat-drink { border-left-color: #4a9eda; }
  .block-section.cat-candy { border-left-color: #e8647a; }
  .block-divider { border: none; border-top: 1px solid #35373b; margin: 8px 0; }
  .block-context { font-size: 12px; color: #8c8c8c; margin-top: 4px; }
  .block-actions { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }

  /* SLACK BUTTONS in messages */
  .slack-btn { padding: 6px 14px; border-radius: 4px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid; }
  .slack-btn-primary { background: #007a5a; border-color: #007a5a; color: #fff; }
  .slack-btn-primary:hover { background: #148567; }
  .slack-btn-danger { background: transparent; border-color: #e8647a; color: #e8647a; }
  .slack-btn-danger:hover { background: #e8647a22; }
  .slack-btn-default { background: transparent; border-color: #565856; color: #d1d2d3; }
  .slack-btn-default:hover { background: #35373b; }

  /* MODAL OVERLAY */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; }
  .modal-overlay.hidden { display: none; }
  .modal-box { background: #222529; border-radius: 8px; width: 480px; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden; }
  .modal-header { padding: 16px 20px 12px; border-bottom: 1px solid #35373b; display: flex; align-items: center; justify-content: space-between; }
  .modal-title { font-size: 17px; font-weight: 700; color: #fff; }
  .modal-x { background: none; border: none; color: #8c8c8c; font-size: 20px; cursor: pointer; line-height: 1; }
  .modal-x:hover { color: #fff; }
  .modal-body { padding: 16px 20px; overflow-y: auto; flex: 1; }
  .modal-footer { padding: 12px 20px; border-top: 1px solid #35373b; display: flex; justify-content: flex-end; gap: 8px; }

  /* MODAL INPUTS */
  .field-wrap { margin-bottom: 14px; }
  .field-label { font-size: 13px; font-weight: 600; color: #d1d2d3; margin-bottom: 6px; display: flex; gap: 4px; }
  .field-req { color: #e8647a; }
  .field-hint { font-size: 12px; color: #8c8c8c; margin-top: 4px; }
  .slack-select, .slack-input { width: 100%; padding: 8px 10px; background: #1a1d21; border: 1px solid #565856; border-radius: 4px; color: #d1d2d3; font-size: 14px; }
  .slack-select:focus, .slack-input:focus { outline: none; border-color: #4a9eda; }
  .slack-input-num { width: 100px; padding: 8px 10px; background: #1a1d21; border: 1px solid #565856; border-radius: 4px; color: #d1d2d3; font-size: 14px; }
  .modal-divider { border: none; border-top: 1px solid #35373b; margin: 12px 0; }

  /* MODAL FOOTER BTNS */
  .mfooter-btn { padding: 8px 18px; border-radius: 4px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; }
  .mfooter-primary { background: #007a5a; color: #fff; }
  .mfooter-primary:hover { background: #148567; }
  .mfooter-ghost { background: transparent; border: 1px solid #565856; color: #d1d2d3; }
  .mfooter-ghost:hover { background: #35373b; }

  /* ORDER ITEMS in modal */
  .order-item-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #2c2d30; border-radius: 6px; margin-bottom: 6px; }
  .order-item-info { flex: 1; }
  .order-item-cat { font-size: 11px; background: #35373b; color: #8c8c8c; border-radius: 99px; padding: 2px 8px; display: inline-block; margin-bottom: 3px; }
  .order-item-name { font-size: 14px; font-weight: 600; color: #fff; }
  .order-item-brand { font-size: 12px; color: #8c8c8c; margin-left: 4px; font-weight: 400; }
  .order-item-qty { font-size: 13px; color: #8c8c8c; }
  .order-del-btn { background: none; border: none; color: #8c8c8c; cursor: pointer; font-size: 16px; padding: 4px 6px; border-radius: 4px; }
  .order-del-btn:hover { color: #e8647a; background: #e8647a22; }
  .order-add-btn { width: 100%; padding: 10px; background: none; border: 1px dashed #565856; border-radius: 6px; color: #8c8c8c; font-size: 14px; cursor: pointer; margin-top: 6px; }
  .order-add-btn:hover { color: #d1d2d3; border-color: #8c8c8c; background: #2c2d30; }
  .order-context { font-size: 12px; color: #8c8c8c; margin-bottom: 12px; }
  .order-empty { text-align: center; padding: 24px; font-size: 14px; color: #8c8c8c; line-height: 1.7; }

  /* CAT CHIPS */
  .cat-chips { display: flex; gap: 8px; }
  .cat-chip { flex: 1; padding: 8px 6px; background: #2c2d30; border: 1px solid #565856; border-radius: 6px; color: #8c8c8c; font-size: 13px; text-align: center; cursor: pointer; }
  .cat-chip.active { border-color: #4a9eda; color: #4a9eda; background: #1a2d3d; }
  .cat-chip:hover:not(.active) { border-color: #8c8c8c; color: #d1d2d3; }

  .direct-toggle { font-size: 13px; color: #4a9eda; cursor: pointer; text-decoration: underline; margin-top: 6px; display: inline-block; }
  .toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #2bac76; color: #fff; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600; z-index: 200; opacity: 0; transition: opacity 0.3s; pointer-events: none; }
  .toast.show { opacity: 1; }
  .spinner { display: inline-block; width: 12px; height: 12px; border: 2px solid #565856; border-top-color: #4a9eda; border-radius: 50%; animation: spin 0.6s linear infinite; margin-right: 6px; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>

<div class="topbar">
  <span class="topbar-title">🍿 Snack Bot</span>
  <span class="topbar-badge">DEV</span>
  <select class="user-select" id="user-select" onchange="setUser(this.value)">
    <option value="U001|dohu">👤 dohu</option>
    <option value="U002|john">👤 john</option>
    <option value="U003|sarah">👤 sarah</option>
    <option value="U_ADMIN_DEV|admin">👤 admin (관리자)</option>
  </select>
  <span style="font-size:12px;color:#8c8c8c">현재 유저: <strong id="user-label" style="color:#fff">dohu</strong></span>
</div>

<div class="layout">
  <div class="sidebar">
    <div class="sidebar-section">명령어</div>
    <button class="cmd-btn" onclick="runCommand('order')">
      <span>📦</span><span class="cmd-code">/snack order</span>
    </button>
    <button class="cmd-btn" onclick="runCommand('list')">
      <span>📋</span><span class="cmd-code">/snack list</span>
    </button>
    <button class="cmd-btn" onclick="runCommand('clear')">
      <span>🗑️</span><span class="cmd-code">/snack clear</span>
    </button>
    <div class="sidebar-section">유저 변경</div>
    <div style="font-size:12px;color:#8c8c8c;padding:4px 10px;line-height:1.6">
      위 드롭다운에서<br>다른 유저로 주문<br>테스트 가능
    </div>
  </div>

  <div class="channel">
    <div class="channel-header">
      # snack-dev
      <span style="font-size:12px;color:#8c8c8c;font-weight:400">· 로컬 D1 DB 연결됨</span>
    </div>
    <div class="channel-body" id="channel-body">
      <div style="text-align:center;padding:40px;color:#8c8c8c;font-size:14px">
        왼쪽 명령어 버튼을 눌러 테스트하세요
      </div>
    </div>
  </div>
</div>

<!-- MODAL OVERLAY -->
<div class="modal-overlay hidden" id="modal-overlay" onclick="closeModal(event)">
  <div class="modal-box" id="modal-box" onclick="e=>e.stopPropagation()">
    <!-- rendered by JS -->
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
let currentUser = { id: 'U001', name: 'dohu' };
let viewStack = [];
let addFormState = { category: null, isCustom: false };

function setUser(val) {
  const [id, name] = val.split('|');
  currentUser = { id, name };
  document.getElementById('user-label').textContent = name;
}

// ── API CALLS ──────────────────────────────────────────────────

async function post(path, formData) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(formData).toString(),
  });
  if (!res.ok) throw new Error('Worker error: ' + res.status);
  const text = await res.text();
  try { return JSON.parse(text); } catch { return {}; }
}

async function slashCmd(text) {
  return post('/slack/command', {
    command: '/snack', text,
    user_id: currentUser.id, user_name: currentUser.name,
    channel_id: 'C_SNACK_DEV', trigger_id: 'dev_' + Date.now(),
  });
}

async function interact(payload) {
  return post('/slack/interaction', { payload: JSON.stringify(payload) });
}

function makeBlockPayload(actionId, value, extraAction = {}) {
  const meta = viewStack.length ? viewStack[viewStack.length - 1].private_metadata : '{}';
  return {
    type: 'block_actions',
    user: { id: currentUser.id, name: currentUser.name },
    view: { id: 'dev_view_' + Date.now(), private_metadata: meta },
    actions: [{ action_id: actionId, value, selected_option: value ? { value } : undefined, ...extraAction }],
    trigger_id: 'dev_' + Date.now(),
  };
}

// ── COMMANDS ───────────────────────────────────────────────────

async function runCommand(cmd) {
  try {
    appendSystemMsg(\`\${currentUser.name} 님이 /snack \${cmd} 실행\`);
    const data = await slashCmd(cmd);
    if (data.type === 'modal') {
      viewStack = [data.view];
      showModal();
    } else if (data.type === 'message') {
      appendMessage('snackbot', '🤖 Snack Bot', data.text, data.blocks);
    }
  } catch(e) { showToast('오류: ' + e.message, true); }
}

// ── MODAL ──────────────────────────────────────────────────────

function showModal() {
  if (!viewStack.length) return;
  const view = viewStack[viewStack.length - 1];
  document.getElementById('modal-box').innerHTML = renderModal(view);
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.add('hidden');
  viewStack = [];
  addFormState = { category: null, isCustom: false };
}

function closeModalBtn() {
  if (viewStack.length > 1) {
    viewStack.pop();
    showModal();
  } else {
    document.getElementById('modal-overlay').classList.add('hidden');
    viewStack = [];
  }
}

function renderModal(view) {
  const title = view.title?.text ?? '';
  const hasSubmit = !!view.submit;
  const blocks = (view.blocks ?? []).map(renderBlock).join('');

  return \`
    <div class="modal-header">
      <span class="modal-title">\${title}</span>
      <button class="modal-x" onclick="closeModalBtn()">✕</button>
    </div>
    <div class="modal-body">\${blocks}</div>
    <div class="modal-footer">
      <button class="mfooter-ghost" onclick="closeModalBtn()">\${view.close?.text ?? '닫기'}</button>
      \${hasSubmit ? \`<button class="mfooter-primary" onclick="submitModal()">\${view.submit.text}</button>\` : ''}
    </div>
  \`;
}

function renderBlock(block) {
  if (block.type === 'context') {
    const text = (block.elements ?? []).map(e => mrkdwn(e.text)).join(' ');
    return \`<div class="order-context">\${text}</div>\`;
  }
  if (block.type === 'divider') return '<hr class="modal-divider">';

  if (block.type === 'section') {
    const text = mrkdwn(block.text?.text ?? '');
    const acc = block.accessory;
    let accHtml = '';
    if (acc?.type === 'button') {
      const style = acc.style === 'danger' ? 'order-del-btn' : 'direct-toggle';
      if (acc.action_id === 'delete_order_item') {
        accHtml = \`<button class="\${style}" onclick="doDeleteItem('\${acc.value}')" title="삭제">✕</button>\`;
      } else if (acc.action_id === 'toggle_custom_input') {
        accHtml = \`<span class="direct-toggle" onclick="doToggleCustom()">✏️ 직접 입력</span>\`;
      } else {
        accHtml = \`<button class="slack-btn slack-btn-default" onclick="">\${acc.text?.text ?? ''}</button>\`;
      }
    }
    if (acc) {
      return \`<div class="order-item-row">\${renderOrderItemText(block)}<div>\${accHtml}</div></div>\`;
    }
    return \`<div style="font-size:13px;color:#8c8c8c;margin:4px 0">\${text}</div>\`;
  }

  if (block.type === 'actions') {
    const btns = (block.elements ?? []).map(el => {
      if (el.action_id === 'open_add_item') {
        return \`<button class="order-add-btn" onclick="doOpenAddItem()">+ 상품 추가</button>\`;
      }
      return \`<button class="slack-btn slack-btn-default">\${el.text?.text ?? ''}</button>\`;
    }).join('');
    return \`<div class="block-actions">\${btns}</div>\`;
  }

  if (block.type === 'input') {
    return renderInput(block);
  }

  return '';
}

function renderOrderItemText(block) {
  const raw = block.text?.text ?? '';
  // parse emoji + name + qty from mrkdwn
  return \`<div class="order-item-info">\${mrkdwn(raw)}</div>\`;
}

function renderInput(block) {
  const label = block.label?.text ?? '';
  const optional = block.optional ? \`<span style="color:#8c8c8c;font-size:11px">(선택)</span>\` : \`<span class="field-req">*</span>\`;
  const el = block.element;
  const bid = block.block_id;
  const aid = el.action_id;
  let inputHtml = '';

  if (el.type === 'static_select' && el.option_groups) {
    inputHtml = \`<select class="slack-select" id="\${bid}__\${aid}" onchange="onSelectChange('\${bid}', '\${aid}', this.value)">
      <option value="">\${el.placeholder?.text ?? '선택'}</option>
      \${(el.option_groups ?? []).map(g => \`
        <optgroup label="\${g.label?.text ?? g.label}">
          \${(g.options ?? []).map(o => \`<option value="\${o.value}">\${o.text?.text ?? o.value}</option>\`).join('')}
        </optgroup>
      \`).join('')}
    </select>\`;
  } else if (el.type === 'static_select') {
    inputHtml = \`<select class="slack-select" id="\${bid}__\${aid}" onchange="onSelectChange('\${bid}', '\${aid}', this.value)">
      <option value="">\${el.placeholder?.text ?? '선택'}</option>
      \${(el.options ?? []).map(o => \`<option value="\${o.value}" \${el.initial_option?.value === o.value ? 'selected' : ''}>\${o.text?.text}</option>\`).join('')}
    </select>\`;
  } else if (el.type === 'plain_text_input') {
    inputHtml = \`<input class="slack-input" id="\${bid}__\${aid}" type="text" placeholder="\${el.placeholder?.text ?? ''}">\`;
  } else if (el.type === 'number_input') {
    inputHtml = \`<input class="slack-input-num" id="\${bid}__\${aid}" type="number" min="\${el.min_value ?? 1}" max="\${el.max_value ?? 99}" value="\${el.initial_value ?? 1}">\`;
  }

  const hint = block.hint ? \`<div class="field-hint">\${block.hint.text}</div>\` : '';
  return \`<div class="field-wrap">
    <div class="field-label">\${label} \${optional}</div>
    \${inputHtml}\${hint}
  </div>\`;
}

// ── INTERACTIONS ───────────────────────────────────────────────

async function onSelectChange(blockId, actionId, value) {
  if (!value) return;
  if (actionId === 'select_category') {
    const data = await interact(makeBlockPayload(actionId, value, { selected_option: { value } }));
    if (data.type === 'modal_update') { viewStack[viewStack.length - 1] = data.view; showModal(); }
  }
}

async function doDeleteItem(itemId) {
  const data = await interact(makeBlockPayload('delete_order_item', itemId));
  if (data.type === 'modal_update') { viewStack[viewStack.length - 1] = data.view; showModal(); }
}

async function doOpenAddItem() {
  const data = await interact(makeBlockPayload('open_add_item', ''));
  if (data.type === 'modal_push') { viewStack.push(data.view); showModal(); }
}

async function doToggleCustom() {
  const data = await interact(makeBlockPayload('toggle_custom_input', ''));
  if (data.type === 'modal_update') { viewStack[viewStack.length - 1] = data.view; showModal(); }
}

async function submitModal() {
  const view = viewStack[viewStack.length - 1];
  if (!view) return;
  const stateValues = collectFormValues(view);
  const payload = {
    type: 'view_submission',
    user: { id: currentUser.id, name: currentUser.name },
    view: { callback_id: view.callback_id, private_metadata: view.private_metadata, state: { values: stateValues } },
  };
  const data = await interact(payload);
  if (data.response_action === 'update') {
    viewStack[viewStack.length - 1] = data.view;
    showModal();
    showToast('주문이 추가됐습니다! 🎉');
  } else if (data.response_action === 'errors') {
    showToast(Object.values(data.errors).join(' / '), true);
  } else if (data.response_action === 'clear') {
    closeModalBtn();
  }
}

function collectFormValues(view) {
  const values = {};
  for (const block of (view.blocks ?? [])) {
    if (block.type !== 'input') continue;
    const el = block.element;
    const bid = block.block_id;
    const aid = el.action_id;
    const domEl = document.getElementById(\`\${bid}__\${aid}\`);
    if (!domEl) continue;
    const val = domEl.value;
    if (!values[bid]) values[bid] = {};
    if (el.type === 'static_select') {
      values[bid][aid] = { selected_option: val ? { value: val } : null };
    } else {
      values[bid][aid] = { value: val };
    }
  }
  return values;
}

// ── MESSAGE RENDERING ──────────────────────────────────────────

function appendMessage(type, name, text, blocks) {
  const body = document.getElementById('channel-body');
  const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  const avatar = type === 'snackbot' ? '🤖' : name.slice(0, 2).toUpperCase();
  const avatarColor = type === 'snackbot' ? '#4a154b' : '#007a5a';
  const blocksHtml = blocks ? renderMessageBlocks(blocks) : '';
  const msgHtml = \`
    <div class="msg">
      <div class="msg-avatar" style="background:\${avatarColor}">\${avatar}</div>
      <div class="msg-body">
        <div class="msg-meta"><span class="msg-name">\${name}</span><span class="msg-time">\${now}</span></div>
        <div class="msg-text">\${mrkdwn(text)}</div>
        \${blocksHtml}
      </div>
    </div>
  \`;
  body.insertAdjacentHTML('beforeend', msgHtml);
  body.scrollTop = body.scrollHeight;
}

function appendSystemMsg(text) {
  const body = document.getElementById('channel-body');
  body.insertAdjacentHTML('beforeend', \`<div style="font-size:12px;color:#8c8c8c;text-align:center;padding:6px 0">\${text}</div>\`);
  body.scrollTop = body.scrollHeight;
}

function renderMessageBlocks(blocks) {
  return blocks.map(b => {
    if (b.type === 'divider') return '<hr class="block-divider">';
    if (b.type === 'context') {
      return \`<div class="block-context">\${(b.elements ?? []).map(e => mrkdwn(e.text)).join('')}</div>\`;
    }
    if (b.type === 'section' && b.text) {
      const cat = b.text.text?.includes('🍪') ? 'cat-snack' : b.text.text?.includes('🧃') ? 'cat-drink' : b.text.text?.includes('🍬') ? 'cat-candy' : '';
      return \`<div class="block-section \${cat}">\${mrkdwn(b.text.text)}</div>\`;
    }
    return '';
  }).join('');
}

// ── MRKDWN ────────────────────────────────────────────────────

function mrkdwn(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/&lt;([^|]+)\|([^&]+)&gt;/g, '<a href="$1" target="_blank">$2</a>')
    .replace(/&lt;([^&]+)&gt;/g, '<a href="#">$1</a>')
    .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/\x60([^\x60]+)\x60/g, '<code style="background:#35373b;padding:1px 5px;border-radius:3px">$1</code>')
    .replace(/\n/g, '<br>');
}

// ── TOAST ─────────────────────────────────────────────────────

function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = isError ? '#e8647a' : '#2bac76';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}
</script>
</body>
</html>`;
}
