import os
import requests
from datetime import date, timedelta
import gspread
from google.oauth2.service_account import Credentials
import json

# ── Sozlamalar ──────────────────────────────────────────────
BOT_TOKEN   = os.environ["BOT_TOKEN"]
SHEET_ID    = os.environ["SHEET_ID"]
CREDS_JSON  = os.environ["GOOGLE_CREDS_JSON"]

DAYS_BEFORE = 3

PLAN_NAMES = {
    "test":    "📝 Test",
    "video":   "🎬 Video",
    "premium": "⭐ Premium",
}

# ── Google Sheets ulanish ────────────────────────────────────
def get_sheet():
    creds_dict = json.loads(CREDS_JSON)
    scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    creds  = Credentials.from_service_account_info(creds_dict, scopes=scopes)
    client = gspread.authorize(creds)
    return client.open_by_key(SHEET_ID).sheet1

# ── Sanani parse qilish ──────────────────────────────────────
# Qo'llab-quvvatlanadigan formatlar:
#   "29.06"        → joriy yil qo'shiladi
#   "29.06.2026"   → to'liq sana
#   "2026-06-29"   → ISO format
def parse_date(raw: str) -> date | None:
    raw = raw.strip()
    if not raw:
        return None

    today = date.today()

    # "29.06" → kun.oy (yilsiz)
    if len(raw) <= 5 and raw.count(".") == 1:
        try:
            day, month = raw.split(".")
            return date(today.year, int(month), int(day))
        except Exception:
            return None

    # "29.06.2026" → kun.oy.yil
    if raw.count(".") == 2:
        try:
            day, month, year = raw.split(".")
            return date(int(year), int(month), int(day))
        except Exception:
            return None

    # "2026-06-29" → ISO
    try:
        return date.fromisoformat(raw)
    except Exception:
        return None

# ── Telegram xabar yuborish ──────────────────────────────────
def send_message(chat_id: str, text: str):
    url  = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    data = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
    resp = requests.post(url, data=data, timeout=10)
    if not resp.ok:
        print(f"  ⚠️  Yuborilmadi ({chat_id}): {resp.text}")
    return resp.ok

# ── Asosiy mantiq ────────────────────────────────────────────
def main():
    today      = date.today()
    target_day = today + timedelta(days=DAYS_BEFORE)

    print(f"📅 Bugun: {today}  |  Tekshirilayotgan sana: {target_day}")

    sheet      = get_sheet()
    all_values = sheet.get_all_values()  # sarlavhasiz, to'g'ridan-to'g'ri

    notified = 0

    for i, row in enumerate(all_values):
        # Bo'sh qatorni o'tkazib yuborish
        if not any(cell.strip() for cell in row):
            continue

        # A=chat_id  B=ism  C=tugash sanasi  D=obuna shakli
        chat_id    = str(row[0]).strip() if len(row) > 0 else ""
        name       = str(row[1]).strip() if len(row) > 1 else ""
        expiry_raw = str(row[2]).strip() if len(row) > 2 else ""
        plan_raw   = str(row[3]).strip().lower() if len(row) > 3 else ""

        if not chat_id or not expiry_raw:
            continue

        # chat_id raqam emasligini tekshirish
        if not chat_id.lstrip("-").isdigit():
            print(f"  ⚠️  Noto'g'ri chat_id: '{chat_id}' (qator {i+1})")
            continue

        expiry = parse_date(expiry_raw)
        if expiry is None:
            print(f"  ⚠️  Sana o'qilmadi: '{expiry_raw}' (qator {i+1})")
            continue

        if expiry == target_day:
            plan_label = PLAN_NAMES.get(plan_raw, plan_raw.capitalize() or "Obuna")
            name_part  = f"<b>{name}</b>, s" if name else "S"

            message = (
                f"👋 Salom, {name_part}izning\n"
                f"<b>{plan_label}</b> obunangiz "
                f"<b>{expiry.strftime('%d.%m.%Y')}</b> sanada tugaydi "
                f"(<b>{DAYS_BEFORE} kun</b> qoldi).\n\n"
                f"♻️ Obunani uzaytirish uchun @musiqashunosbot ga murojaat qiling."
            )

            ok = send_message(chat_id, message)
            status = "✅" if ok else "❌"
            print(f"  {status} {name or chat_id} | {plan_label} | {expiry}")
            if ok:
                notified += 1

    print(f"\n✅ Jami yuborildi: {notified} ta xabar")

if __name__ == "__main__":
    main()
