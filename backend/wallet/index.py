"""
Кошелёк: пополнение, вывод, история транзакций.
POST action=deposit | withdraw | history. Требует X-Session-Id.
"""
import json
import os
import psycopg2

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

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user_by_token(cur, token: str):
    cur.execute(
        f"SELECT u.id, u.balance FROM {SCHEMA}.sessions s "
        f"JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    return cur.fetchone()

def err(msg: str, code: int = 400):
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps({'error': msg})}

def ok(data: dict):
    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(data)}

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

    user_id, balance = row[0], float(row[1])

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
            return err(f'Максимальная сумма вывода — {MAX_WITHDRAW:,} ₽'.replace(',', ' '))
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
