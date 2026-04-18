"""
Авторизация: регистрация, вход, выход, получение профиля.
POST /register, POST /login, POST /logout, GET /me
При регистрации отправляет приветственное письмо с бонусом.
"""
import json
import os
import hashlib
import secrets
import smtplib
import ssl
import threading
import psycopg2
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
    'Content-Type': 'application/json',
}
SCHEMA = 't_p51100434_online_casino_develo'

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password: str) -> str:
    salt = os.environ.get('PW_SALT', 'casino_royal_secure_salt_x7k')
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()

def new_token() -> str:
    return secrets.token_hex(32)

def get_user_by_token(cur, token: str):
    cur.execute(
        f"SELECT u.id, u.email, u.username, u.balance, u.loyalty_points, u.loyalty_level, u.freespins, u.welcome_bonus_claimed "
        f"FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    return cur.fetchone()

def row_to_user(row) -> dict:
    return {
        'id': row[0],
        'email': row[1],
        'username': row[2],
        'balance': float(row[3]),
        'loyalty_points': row[4],
        'loyalty_level': row[5],
        'freespins': row[6],
        'welcome_bonus_claimed': row[7],
    }

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

def make_welcome_email(username: str, email: str, freespins: int) -> tuple:
    subject = '🎰 Добро пожаловать в Grand Royal Casino — ваш бонус внутри!'
    html = f"""<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#12121a;border-radius:16px;overflow:hidden;border:1px solid #2a2a3a;">

        <!-- Gold top line -->
        <tr><td height="3" style="background:linear-gradient(90deg,transparent,#d4af37,transparent);"></td></tr>

        <!-- Hero -->
        <tr><td style="padding:48px 40px 32px;text-align:center;background:linear-gradient(180deg,#1a1a2e 0%,#12121a 100%);">
          <div style="font-size:52px;margin-bottom:16px;">♛</div>
          <div style="color:#d4af37;font-size:10px;letter-spacing:5px;text-transform:uppercase;margin-bottom:10px;">Grand Royal Casino</div>
          <h1 style="color:#ffffff;font-size:28px;font-weight:300;margin:0 0 8px;letter-spacing:1px;">
            Добро пожаловать,<br><strong style="font-weight:700;color:#d4af37;">{username}</strong>!
          </h1>
          <p style="color:#666;font-size:14px;margin:12px 0 0;">Ваш аккаунт успешно создан</p>
        </td></tr>

        <!-- Bonus cards -->
        <tr><td style="padding:32px 40px;">
          <p style="color:#888;font-size:14px;text-align:center;margin:0 0 24px;">Специально для вас — приветственный пакет бонусов:</p>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <!-- Bonus 1 -->
              <td width="48%" style="background:#0a0a0f;border-radius:12px;border:1px solid #d4af3733;padding:20px;text-align:center;">
                <div style="font-size:28px;margin-bottom:8px;">💰</div>
                <div style="color:#d4af37;font-size:22px;font-weight:700;margin-bottom:4px;">+200%</div>
                <div style="color:#888;font-size:11px;letter-spacing:1px;text-transform:uppercase;">к первому депозиту</div>
                <div style="color:#555;font-size:11px;margin-top:8px;">Пополни от 1 000 ₽</div>
              </td>
              <td width="4%"></td>
              <!-- Bonus 2 -->
              <td width="48%" style="background:#0a0a0f;border-radius:12px;border:1px solid #7c3aed33;padding:20px;text-align:center;">
                <div style="font-size:28px;margin-bottom:8px;">⚡</div>
                <div style="color:#a78bfa;font-size:22px;font-weight:700;margin-bottom:4px;">{freespins}</div>
                <div style="color:#888;font-size:11px;letter-spacing:1px;text-transform:uppercase;">бесплатных вращений</div>
                <div style="color:#555;font-size:11px;margin-top:8px;">Активируются сразу</div>
              </td>
            </tr>
          </table>

          <!-- Loyalty bonus -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
            <tr>
              <td style="background:#0a0a0f;border-radius:12px;border:1px solid #22c55e33;padding:16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:24px;width:40px;">👑</td>
                    <td>
                      <div style="color:#22c55e;font-size:13px;font-weight:700;">Программа лояльности Bronze</div>
                      <div style="color:#555;font-size:11px;margin-top:2px;">Зарабатывайте очки с каждой ставки и повышайте уровень</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:0 40px 40px;text-align:center;">
          <div style="background:linear-gradient(135deg,#1a1a2e,#0f0f1a);border-radius:12px;border:1px solid #2a2a3a;padding:24px;">
            <p style="color:#aaa;font-size:14px;margin:0 0 20px;">Готовы начать? Пополните счёт и получите бонус прямо сейчас</p>
            <div style="display:inline-block;background:linear-gradient(90deg,#b8860b,#d4af37);border-radius:8px;padding:14px 40px;">
              <span style="color:#0a0a0f;font-size:14px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Получить бонус</span>
            </div>
            <p style="color:#444;font-size:11px;margin:16px 0 0;">Войдите на сайт → Профиль → Пополнить</p>
          </div>
        </td></tr>

        <!-- Account info -->
        <tr><td style="padding:0 40px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1e1e2e;border-radius:10px;overflow:hidden;">
            <tr><td colspan="2" style="background:#1e1e2e;padding:10px 16px;color:#666;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Данные аккаунта</td></tr>
            <tr>
              <td style="padding:10px 16px;border-top:1px solid #1e1e2e;color:#666;font-size:13px;">Никнейм</td>
              <td style="padding:10px 16px;border-top:1px solid #1e1e2e;color:#ccc;font-size:13px;text-align:right;font-weight:600;">{username}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;border-top:1px solid #1e1e2e;color:#666;font-size:13px;">Email</td>
              <td style="padding:10px 16px;border-top:1px solid #1e1e2e;color:#ccc;font-size:13px;text-align:right;">{email}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;border-top:1px solid #1e1e2e;color:#666;font-size:13px;">Уровень</td>
              <td style="padding:10px 16px;border-top:1px solid #1e1e2e;color:#d4af37;font-size:13px;text-align:right;font-weight:600;">Bronze ♛</td>
            </tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px 32px;border-top:1px solid #1e1e2e;">
          <p style="color:#333;font-size:11px;text-align:center;margin:0;line-height:1.8;">
            Вы получили это письмо, потому что зарегистрировались на Grand Royal Casino.<br>
            Играйте ответственно. 18+. Азартные игры могут вызывать зависимость.
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

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')

    body = {}
    if event.get('body'):
        body = json.loads(event['body'])

    session_token = (event.get('headers') or {}).get('X-Session-Id', '').strip()
    action = body.get('action', '') or ''

    # ── GET /me или action=me ─────────────────────────────────
    if (method == 'GET' and (path.endswith('/me') or session_token)) or action == 'me':
        if not session_token:
            return {'statusCode': 401, 'headers': HEADERS, 'body': json.dumps({'error': 'Не авторизован'})}
        conn = get_conn()
        cur = conn.cursor()
        row = get_user_by_token(cur, session_token)
        conn.close()
        if not row:
            return {'statusCode': 401, 'headers': HEADERS, 'body': json.dumps({'error': 'Сессия истекла'})}
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'user': row_to_user(row)})}

    # ── POST /register ────────────────────────────────────────
    if method == 'POST' and (path.endswith('/register') or action == 'register'):
        email = body.get('email', '').strip().lower()
        username = body.get('username', '').strip()
        password = body.get('password', '')

        if not email or not username or not password:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Заполните все поля'})}
        if len(password) < 6:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Пароль минимум 6 символов'})}
        if '@' not in email:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Некорректный email'})}

        pw_hash = hash_password(password)
        conn = get_conn()
        cur = conn.cursor()
        try:
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (email, username, password_hash) VALUES (%s, %s, %s) RETURNING id",
                (email, username, pw_hash)
            )
            user_id = cur.fetchone()[0]
            token = new_token()
            cur.execute(
                f"INSERT INTO {SCHEMA}.sessions (token, user_id) VALUES (%s, %s)",
                (token, user_id)
            )
            conn.commit()
        except Exception as e:
            conn.rollback()
            conn.close()
            if 'unique' in str(e).lower() or 'duplicate' in str(e).lower():
                return {'statusCode': 409, 'headers': HEADERS, 'body': json.dumps({'error': 'Email или имя пользователя уже заняты'})}
            raise
        finally:
            conn.close()

        subject, html = make_welcome_email(username, email, 200)
        send_email_async(email, subject, html)

        return {
            'statusCode': 200,
            'headers': HEADERS,
            'body': json.dumps({
                'token': token,
                'user': {
                    'id': user_id,
                    'email': email,
                    'username': username,
                    'balance': 0.0,
                    'loyalty_points': 0,
                    'loyalty_level': 'Bronze',
                    'freespins': 200,
                    'welcome_bonus_claimed': False,
                }
            })
        }

    # ── POST /login ───────────────────────────────────────────
    if method == 'POST' and (path.endswith('/login') or action == 'login'):
        email = body.get('email', '').strip().lower()
        password = body.get('password', '')

        if not email or not password:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Заполните все поля'})}

        pw_hash = hash_password(password)
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, email, username, balance, loyalty_points, loyalty_level, freespins, welcome_bonus_claimed "
            f"FROM {SCHEMA}.users WHERE email = %s AND password_hash = %s",
            (email, pw_hash)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return {'statusCode': 401, 'headers': HEADERS, 'body': json.dumps({'error': 'Неверный email или пароль'})}

        cur.execute(f"UPDATE {SCHEMA}.users SET last_login = NOW() WHERE id = %s", (row[0],))
        token = new_token()
        cur.execute(f"INSERT INTO {SCHEMA}.sessions (token, user_id) VALUES (%s, %s)", (token, row[0]))
        conn.commit()
        conn.close()

        return {
            'statusCode': 200,
            'headers': HEADERS,
            'body': json.dumps({'token': token, 'user': row_to_user(row)})
        }

    # ── POST /logout ──────────────────────────────────────────
    if method == 'POST' and (path.endswith('/logout') or action == 'logout'):
        if session_token:
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE token = %s", (session_token,))
            conn.commit()
            conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True})}

    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'status': 'ok'})}