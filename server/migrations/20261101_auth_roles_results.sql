ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'USER';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS legal_accepted_at TIMESTAMPTZ;

UPDATE users
SET email_verified_at = COALESCE(email_verified_at, created_at, CURRENT_TIMESTAMP)
WHERE email_verified_at IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_role_check' AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('USER', 'OWNER'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS auth_otps (
  email TEXT NOT NULL,
  purpose TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  name TEXT,
  password_hash TEXT,
  legal_accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (email, purpose),
  CONSTRAINT auth_otps_purpose_check CHECK (purpose IN ('register', 'password_reset'))
);

CREATE INDEX IF NOT EXISTS idx_auth_otps_expiry ON auth_otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_otps_purpose_expiry ON auth_otps(purpose, expires_at);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
