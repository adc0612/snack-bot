import os
import re
import sqlite3
import requests
from datetime import datetime, date, timedelta
from dotenv import load_dotenv
from slack_bolt import App
from slack_bolt.adapter.socket_mode import SocketModeHandler
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz

load_dotenv()

KST = pytz.timezone("Asia/Seoul")
app = App(token=os.environ["SLACK_BOT_TOKEN"])

# ============================================================
# DB 초기화
# ============================================================
def init_db():
    with sqlite3.connect("snacks.db") as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                user_name TEXT NOT NULL,
                item TEXT NOT NULL,
                link TEXT,
                image_url TEXT,
                memo TEXT,
                created_at TEXT NOT NULL
            )
        """)

# ============================================================
# 공휴일 체크
# ============================================================
def is_korean_holiday(d: date) -> bool:
    fixed = {(1,1),(3,1),(5,5),(6,6),(8,15),(10,3),(10,9),(12,25)}
    if (d.month, d.day) in fixed:
        return True
    api_key = os.environ.get("HOLIDAY_API_KEY")
    if api_key:
        try:
            url = "http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo"
            params = {"serviceKey": api_key, "solYear": d.year, "solMonth": f"{d.month:02d}", "_type": "json"}
            res = requests.get(url, params=params, timeout=3)
            items = res.json().get("response", {}).get("body", {}).get("items", {})
            if items:
                days = items.get("item", [])
                if isinstance(days, dict):
                    days = [days]
                if f"{d.day:02d}" in [str(i["locdate"])[-2:] for i in days]:
                    return True
        except Exception:
            pass
    return False

def get_next_business_day(d: date) -> date:
    next_day = d + timedelta(days=1)
    while next_day.weekday() >= 5 or is_korean_holiday(next_day):
        next_day += timedelta(days=1)
    return next_day

# ============================================================
# 유저 헬퍼
# ============================================================
def get_user_id_by_email(email: str) -> str:
    return app.client.users_lookupByEmail(email=email)["user"]["id"]

def get_user_display_name(user_id: str) -> str:
    profile = app.client.users_info(user=user_id)["user"]["profile"]
    return profile.get("display_name") or profile.get("real_name", user_id)

# ============================================================
# 중복 체크 (전체 목록 기준 — 제품명 대소문자/공백 무시)
# ============================================================
def find_duplicate_item(item: str):
    normalized = item.strip().lower()
    with sqlite3.connect("snacks.db") as conn:
        rows = conn.execute("SELECT user_name, item FROM requests").fetchall()
    for user_name, existing_item in rows:
        if existing_item.strip().lower() == normalized:
            return user_name, existing_item
    return None

# ============================================================
# 모달 뷰 정의
# ============================================================
SNACK_MODAL = {
    "type": "modal",
    "callback_id": "snack_modal",
    "title": {"type": "plain_text", "text": "🍿 간식 요청"},
    "submit": {"type": "plain_text", "text": "요청하기"},
    "close": {"type": "plain_text", "text": "취소"},
    "blocks": [
        {
            "type": "input",
            "block_id": "item",
            "label": {"type": "plain_text", "text": "간식 이름 / 제품명 *"},
            "element": {
                "type": "plain_text_input",
                "action_id": "item_input",
                "placeholder": {"type": "plain_text", "text": "예) 포카칩 오리지널"}
            }
        },
        {
            "type": "input",
            "block_id": "link",
            "optional": True,
            "label": {"type": "plain_text", "text": "구매 링크"},
            "element": {
                "type": "plain_text_input",
                "action_id": "link_input",
                "placeholder": {"type": "plain_text", "text": "https://..."}
            }
        },
        {
            "type": "input",
            "block_id": "image_url",
            "optional": True,
            "label": {"type": "plain_text", "text": "참고 이미지 URL"},
            "element": {
                "type": "plain_text_input",
                "action_id": "image_url_input",
                "placeholder": {"type": "plain_text", "text": "https://..."}
            }
        },
        {
            "type": "input",
            "block_id": "memo",
            "optional": True,
            "label": {"type": "plain_text", "text": "메모"},
            "element": {
                "type": "plain_text_input",
                "action_id": "memo_input",
                "multiline": True,
                "placeholder": {"type": "plain_text", "text": "맛, 용량, 수량 등 참고사항"}
            }
        }
    ]
}

# ============================================================
# /간식 — 모달 폼
# ============================================================
@app.command("/간식")
def handle_snack_command(ack, body, client):
    ack()
    client.views_open(trigger_id=body["trigger_id"], view=SNACK_MODAL)

# ============================================================
# @간식봇 멘션
# ============================================================
@app.event("app_mention")
def handle_mention(event, say, client, body):
    user_id = event["user"]
    content = re.sub(r"<@[A-Z0-9]+>", "", event.get("text", "")).strip()

    if not content:
        client.views_open(trigger_id=body.get("trigger_id", ""), view=SNACK_MODAL)
        return

    # 중복 체크
    duplicate = find_duplicate_item(content)
    if duplicate:
        dup_name, dup_item = duplicate
        say(f"<@{user_id}> *{dup_item}* 은 이미 이번 주 목록에 있어요! ({dup_name}이 요청함) 🙈")
        return

    user_name = get_user_display_name(user_id)
    save_request(user_id, user_name, content)
    say(f"저장했어요! 🍿 *{user_name}*: {content}")

# ============================================================
# 모달 제출
# ============================================================
@app.view("snack_modal")
def handle_modal_submission(ack, body, view, client):
    ack()
    user_id = body["user"]["id"]
    values = view["state"]["values"]
    item = values["item"]["item_input"]["value"]
    link = values["link"]["link_input"].get("value")
    image_url = values["image_url"]["image_url_input"].get("value")
    memo = values["memo"]["memo_input"].get("value")

    # 중복 체크
    duplicate = find_duplicate_item(item)
    if duplicate:
        dup_name, dup_item = duplicate
        client.chat_postMessage(
            channel=user_id,
            text=f"*{dup_item}* 은 이미 이번 주 목록에 있어요! ({dup_name}이 요청함) 🙈\n다른 간식을 요청하려면 `/간식` 을 다시 입력해주세요."
        )
        return

    user_name = get_user_display_name(user_id)
    save_request(user_id, user_name, item, link, image_url, memo)
    client.chat_postMessage(
        channel=user_id,
        text=f"간식 요청이 저장됐어요! 🍿\n*{item}*"
             + (f"\n🔗 {link}" if link else "")
             + (f"\n📝 {memo}" if memo else "")
    )

# ============================================================
# DB 저장
# ============================================================
def save_request(user_id, user_name, item, link=None, image_url=None, memo=None):
    now = datetime.now(KST).strftime("%Y-%m-%d %H:%M")
    with sqlite3.connect("snacks.db") as conn:
        conn.execute(
            "INSERT INTO requests (user_id, user_name, item, link, image_url, memo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (user_id, user_name, item, link, image_url, memo, now)
        )

# ============================================================
# /간식목록
# ============================================================
@app.command("/간식목록")
def handle_list_command(ack, respond):
    ack()
    with sqlite3.connect("snacks.db") as conn:
        rows = conn.execute(
            "SELECT user_name, item, link, image_url, memo FROM requests ORDER BY id"
        ).fetchall()

    if not rows:
        respond("아직 간식 요청이 없어요 😢")
        return

    lines = []
    for i, (name, item, link, image_url, memo) in enumerate(rows, 1):
        line = f"{i}. *{name}*: {item}"
        if link:   line += f"  <{link}|🔗링크>"
        if image_url: line += f"  <{image_url}|🖼️이미지>"
        if memo:   line += f"  _{memo}_"
        lines.append(line)

    respond(f"*이번 주 간식 요청 목록 ({len(rows)}건)* 🛒\n\n" + "\n".join(lines))

# ============================================================
# /간식취소 — 본인 목록 보여주고 선택 삭제
# ============================================================
@app.command("/간식취소")
def handle_cancel_command(ack, body, client):
    ack()
    user_id = body["user_id"]

    with sqlite3.connect("snacks.db") as conn:
        rows = conn.execute(
            "SELECT id, item FROM requests WHERE user_id = ? ORDER BY id", (user_id,)
        ).fetchall()

    if not rows:
        client.chat_postMessage(channel=user_id, text="취소할 간식 요청이 없어요.")
        return

    options = [
        {
            "text": {"type": "plain_text", "text": item},
            "value": str(row_id)
        }
        for row_id, item in rows
    ]

    client.views_open(
        trigger_id=body["trigger_id"],
        view={
            "type": "modal",
            "callback_id": "cancel_modal",
            "title": {"type": "plain_text", "text": "🗑️ 간식 요청 취소"},
            "submit": {"type": "plain_text", "text": "취소하기"},
            "close": {"type": "plain_text", "text": "닫기"},
            "blocks": [
                {
                    "type": "input",
                    "block_id": "cancel_items",
                    "label": {"type": "plain_text", "text": "취소할 간식을 선택하세요"},
                    "element": {
                        "type": "checkboxes",
                        "action_id": "cancel_select",
                        "options": options
                    }
                }
            ]
        }
    )

@app.view("cancel_modal")
def handle_cancel_modal(ack, body, view, client):
    ack()
    user_id = body["user"]["id"]
    selected = view["state"]["values"]["cancel_items"]["cancel_select"]["selected_options"]

    if not selected:
        client.chat_postMessage(channel=user_id, text="선택된 항목이 없어요.")
        return

    ids = [int(opt["value"]) for opt in selected]
    items = [opt["text"]["text"] for opt in selected]

    with sqlite3.connect("snacks.db") as conn:
        conn.executemany("DELETE FROM requests WHERE id = ?", [(i,) for i in ids])

    item_list = ", ".join(f"*{i}*" for i in items)
    client.chat_postMessage(
        channel=user_id,
        text=f"{item_list} 요청이 취소됐어요! 😢\n다시 요청하려면 `/간식` 을 입력해주세요."
    )

# ============================================================
# 스케줄러
# ============================================================
def post_to_channel(text):
    app.client.chat_postMessage(channel=os.environ["CHANNEL_ID"], text=text, mrkdwn=True)

def monday_announce():
    if is_korean_holiday(date.today()): return
    post_to_channel(
        "🍿 *이번 주 간식 요청을 받습니다!*\n"
        "목요일 17:00까지 `/간식` 또는 `@간식봇 [간식명]` 으로 요청해주세요 😋"
    )

def wednesday_remind():
    if is_korean_holiday(date.today()): return
    post_to_channel("⏰ 간식 요청 마감 *내일 17:00* 까지예요! 아직 못 하신 분들 서둘러주세요~")

def thursday_30min():
    if is_korean_holiday(date.today()): return
    post_to_channel("🚨 *30분 후 마감!* 아직 못 하신 분 `/간식` 으로 빠르게 요청해주세요!")

def thursday_10min():
    if is_korean_holiday(date.today()): return
    post_to_channel("⏰ *10분 후 마감!* 마지막 기회예요 🏃")

def thursday_send_dm():
    today = date.today()
    if is_korean_holiday(today):
        next_day = get_next_business_day(today)
        post_to_channel(f"오늘은 공휴일이에요! 간식 취합은 *{next_day.month}월 {next_day.day}일*로 연기됩니다 🙏")
        return

    with sqlite3.connect("snacks.db") as conn:
        rows = conn.execute(
            "SELECT user_name, item, link, image_url, memo FROM requests ORDER BY id"
        ).fetchall()

    junho_id = get_user_id_by_email(os.environ["JUNHO_EMAIL"])

    if not rows:
        text = "이번 주 간식 요청이 없어요 😢"
    else:
        lines = []
        for i, (name, item, link, image_url, memo) in enumerate(rows, 1):
            line = f"{i}. *{name}*: {item}"
            if link:      line += f"\n   🔗 <{link}|링크>"
            if image_url: line += f"\n   🖼️ <{image_url}|이미지>"
            if memo:      line += f"\n   📝 {memo}"
            lines.append(line)
        text = f"*이번 주 간식 요청 목록 (총 {len(rows)}건)* 🛒\n\n" + "\n\n".join(lines)

    dm = app.client.conversations_open(users=junho_id)
    app.client.chat_postMessage(channel=dm["channel"]["id"], text=text, mrkdwn=True)
    post_to_channel(f"✅ 간식 요청이 담당자에게 전달됐어요! 월요일에 만나요 🎉 (총 {len(rows)}건)")

    with sqlite3.connect("snacks.db") as conn:
        conn.execute("DELETE FROM requests")

def setup_scheduler():
    scheduler = BackgroundScheduler(timezone=KST)
    scheduler.add_job(monday_announce,  CronTrigger(day_of_week="mon", hour=9,  minute=0,  timezone=KST))
    scheduler.add_job(wednesday_remind, CronTrigger(day_of_week="wed", hour=9,  minute=0,  timezone=KST))
    scheduler.add_job(thursday_30min,   CronTrigger(day_of_week="thu", hour=16, minute=30, timezone=KST))
    scheduler.add_job(thursday_10min,   CronTrigger(day_of_week="thu", hour=16, minute=50, timezone=KST))
    scheduler.add_job(thursday_send_dm, CronTrigger(day_of_week="thu", hour=17, minute=0,  timezone=KST))
    scheduler.start()

# ============================================================
# 실행
# ============================================================
if __name__ == "__main__":
    init_db()
    setup_scheduler()
    handler = SocketModeHandler(app, os.environ["SLACK_APP_TOKEN"])
    handler.start()
