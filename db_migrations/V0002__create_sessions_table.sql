CREATE TABLE t_p51100434_online_casino_develo.sessions (
  token VARCHAR(255) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p51100434_online_casino_develo.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);
