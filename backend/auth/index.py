"""
Авторизация: регистрация, вход, выход, получение профиля.
POST /register, POST /login, POST /logout, GET /me
"""
import json
import os
import hashlib
import secrets
import psycopg2

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
        except psycopg2.errors.UniqueViolation:
            conn.rollback()
            conn.close()
            return {'statusCode': 409, 'headers': HEADERS, 'body': json.dumps({'error': 'Email или имя пользователя уже заняты'})}
        finally:
            conn.close()

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