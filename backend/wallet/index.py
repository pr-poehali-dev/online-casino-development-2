"""
Кошелёк: пополнение, вывод, история транзакций.
POST action=deposit | withdraw | history. Требует X-Session-Id.
После каждой операции отправляет email-уведомление пользователю.
"""
import json
import os
import smtplib
import ssl
import threading
import psycopg2
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
    'Content-Type': 'application/json',
}
SCHEMA = 't_p51100434_online_casino_develo'

MIN_DEPOSIT = 100
MIN_WITHDRAW = 500
MAX_WITHDRAW = 500000

METHOD_LABELS = {'card': 'Банковская карта', 'crypto': 'Криптовалюта', 'sbp': 'СБП'}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user_by_token(cur, token: str):
    cur.execute(
        f"SELECT u.id, u.balance, u.email, u.username FROM {SCHEMA}.sessions s "
        f"JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    return cur.fetchone()

def err(msg: str, code: int = 400):
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps({'error': msg})}

def ok(data: dict):
    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(data)}

def send_email_async(to_email: str, subject: str, html: str):
    def _send():
        try:
            host = os.environ.get('SMTP_HOST', '')
            port = int(os.environ.get('SMTP_PORT', '465'))
            user = os.environ.get('SMTP_USER', '')
            password = os.environ.get('SMTP_PASSWORD', '')
            if not all([host, user, password]):
                return
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f'Grand Royal Casino <{user}>'
            msg['To'] = to_email
            msg.attach(MIMEText(html, 'html', 'utf-8'))
            context = ssl.create_default_context()
            if port == 465:
                with smtplib.SMTP_SSL(host, port, context=context) as server:
                    server.login(user, password)
                    server.sendmail(user, to_email, msg.as_string())
            else:
                with smtplib.SMTP(host, port) as server:
                    server.ehlo()
                    server.starttls(context=context)
                    server.login(user, password)
                    server.sendmail(user, to_email, msg.as_string())
        except Exception:
            pass
    threading.Thread(target=_send, daemon=True).start()

def make_email_html(username: str, op_type: str, amount: float, new_balance: float, method: str) -> tuple[str, str]:
    method_label = METHOD_LABELS.get(method, method)
    now = datetime.now().strftime('%d.%m.%Y %H:%M')
    amount_fmt = f"{amount:,.0f}".replace(",", " ")
    balance_fmt = f"{new_balance:,.2f}".replace(",", " ")

    if op_type == 'deposit':
        subject = f'✅ Баланс пополнен на {amount_fmt} ₽ — Grand Royal Casino'
        color = '#22c55e'
        icon = '💰'
        title = 'Пополнение баланса'
        op_label = 'Зачислено'
        status_text = 'Операция выполнена успешно'
    else:
        subject = f'📤 Заявка на вывод {amount_fmt} ₽ принята — Grand Royal Casino'
        color = '#f59e0b'
        icon = '📤'
        title = 'Заявка на вывод средств'
        op_label = 'Сумма вывода'
        status_text = 'Заявка принята, обработка 15–60 минут'

    html = f"""<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#12121a;border-radius:16px;overflow:hidden;border:1px solid #2a2a3a;">
        <!-- Gold top line -->
        <tr><td height="3" style="background:linear-gradient(90deg,transparent,#d4af37,transparent);"></td></tr>

        <!-- Header -->
        <tr><td style="padding:32px 40px 24px;text-align:center;">
          <div style="font-size:32px;margin-bottom:8px;">{icon}</div>
          <div style="color:#d4af37;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin-bottom:6px;">Grand Royal Casino</div>
          <h1 style="color:#ffffff;font-size:22px;font-weight:600;margin:0;">{title}</h1>
        </td></tr>

        <!-- Content -->
        <tr><td style="padding:0 40px 32px;">
          <p style="color:#888;font-size:14px;margin:0 0 24px;">Привет, <strong style="color:#fff;">{username}</strong>!</p>

          <!-- Amount card -->
          <div style="background:#0a0a0f;border-radius:12px;border:1px solid {color}33;padding:24px;text-align:center;margin-bottom:24px;">
            <div style="color:#888;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">{op_label}</div>
            <div style="color:{color};font-size:36px;font-weight:700;letter-spacing:-1px;">{amount_fmt} ₽</div>
            <div style="display:inline-block;margin-top:12px;padding:4px 14px;background:{color}20;border-radius:20px;color:{color};font-size:12px;font-weight:600;">
              {status_text}
            </div>
          </div>

          <!-- Details -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #1e1e2e;color:#666;font-size:13px;">Способ</td>
              <td style="padding:10px 0;border-bottom:1px solid #1e1e2e;color:#ccc;font-size:13px;text-align:right;">{method_label}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #1e1e2e;color:#666;font-size:13px;">Дата и время</td>
              <td style="padding:10px 0;border-bottom:1px solid #1e1e2e;color:#ccc;font-size:13px;text-align:right;">{now}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#666;font-size:13px;">Баланс после операции</td>
              <td style="padding:10px 0;color:#d4af37;font-size:14px;font-weight:700;text-align:right;">{balance_fmt} ₽</td>
            </tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px 32px;border-top:1px solid #1e1e2e;">
          <p style="color:#444;font-size:11px;text-align:center;margin:0;line-height:1.6;">
            Это автоматическое уведомление Grand Royal Casino.<br>
            Если вы не совершали эту операцию — немедленно обратитесь в поддержку.
          </p>
        </td></tr>

        <!-- Gold bottom line -->
        <tr><td height="3" style="background:linear-gradient(90deg,transparent,#d4af37,transparent);"></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""
    return subject, html

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    token = (event.get('headers') or {}).get('X-Session-Id', '').strip()
    if not token:
        return err('Требуется авторизация', 401)

    body = {}
    if event.get('body'):
        body = json.loads(event['body'])

    action = body.get('action', '')
    if not action and event.get('httpMethod') == 'GET':
        action = 'history'

    conn = get_conn()
    cur = conn.cursor()
    row = get_user_by_token(cur, token)
    if not row:
        conn.close()
        return err('Сессия истекла', 401)

    user_id, balance, user_email, username = row[0], float(row[1]), row[2], row[3]

    # ── deposit ──────────────────────────────────────────────
    if action == 'deposit':
        amount = float(body.get('amount', 0))
        method = body.get('method', 'card')
        if amount < MIN_DEPOSIT:
            conn.close()
            return err(f'Минимальная сумма пополнения — {MIN_DEPOSIT} ₽')

        cur.execute(
            f"UPDATE {SCHEMA}.users SET balance = balance + %s WHERE id = %s",
            (amount, user_id)
        )
        cur.execute(
            f"INSERT INTO {SCHEMA}.transactions (user_id, type, amount, status, method) VALUES (%s, 'deposit', %s, 'completed', %s)",
            (user_id, amount, method)
        )
        cur.execute(f"SELECT balance FROM {SCHEMA}.users WHERE id = %s", (user_id,))
        new_balance = float(cur.fetchone()[0])
        conn.commit()
        conn.close()

        subject, html = make_email_html(username, 'deposit', amount, new_balance, method)
        send_email_async(user_email, subject, html)

        return ok({'balance': new_balance, 'deposited': amount})

    # ── withdraw ─────────────────────────────────────────────
    if action == 'withdraw':
        amount = float(body.get('amount', 0))
        method = body.get('method', 'card')
        if amount < MIN_WITHDRAW:
            conn.close()
            return err(f'Минимальная сумма вывода — {MIN_WITHDRAW} ₽')
        if amount > MAX_WITHDRAW:
            conn.close()
            return err(f'Максимальная сумма вывода — {MAX_WITHDRAW} ₽')
        if amount > balance:
            conn.close()
            return err('Недостаточно средств на балансе')

        cur.execute(
            f"UPDATE {SCHEMA}.users SET balance = balance - %s WHERE id = %s",
            (amount, user_id)
        )
        cur.execute(
            f"INSERT INTO {SCHEMA}.transactions (user_id, type, amount, status, method) VALUES (%s, 'withdraw', %s, 'pending', %s)",
            (user_id, amount, method)
        )
        cur.execute(f"SELECT balance FROM {SCHEMA}.users WHERE id = %s", (user_id,))
        new_balance = float(cur.fetchone()[0])
        conn.commit()
        conn.close()

        subject, html = make_email_html(username, 'withdraw', amount, new_balance, method)
        send_email_async(user_email, subject, html)

        return ok({'balance': new_balance, 'withdrawn': amount})

    # ── history ───────────────────────────────────────────────
    if action == 'history' or not action:
        cur.execute(
            f"SELECT id, type, amount, status, method, created_at FROM {SCHEMA}.transactions "
            f"WHERE user_id = %s ORDER BY created_at DESC LIMIT 20",
            (user_id,)
        )
        rows = cur.fetchall()
        conn.close()
        txns = [
            {
                'id': r[0],
                'type': r[1],
                'amount': float(r[2]),
                'status': r[3],
                'method': r[4],
                'created_at': r[5].isoformat(),
            }
            for r in rows
        ]
        return ok({'transactions': txns, 'balance': balance})

    conn.close()
    return err('Неизвестное действие')
