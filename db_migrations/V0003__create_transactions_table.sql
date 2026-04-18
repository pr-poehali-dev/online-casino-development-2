CREATE TABLE t_p51100434_online_casino_develo.transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p51100434_online_casino_develo.users(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdraw', 'bonus')),
  amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'rejected')),
  method VARCHAR(50) DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT NOW()
);
