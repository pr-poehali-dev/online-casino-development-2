CREATE TABLE t_p51100434_online_casino_develo.users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  balance NUMERIC(12,2) DEFAULT 0.00,
  loyalty_points INTEGER DEFAULT 0,
  loyalty_level VARCHAR(20) DEFAULT 'Bronze',
  freespins INTEGER DEFAULT 200,
  welcome_bonus_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);
