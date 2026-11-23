-- MangoCode donations and supporter status.
-- Safe to run more than once; the production branch has already received
-- the same additive schema change.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS has_donated BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  amount_rupees INTEGER NOT NULL CHECK (amount_rupees BETWEEN 1 AND 100000),
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'paid', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_donations_user_created
  ON donations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_status_created
  ON donations(status, created_at DESC);

-- Historical UPI claim storage was retired from the application in November 2026.
-- Keep this migration file immutable for existing installations; production data is
-- retained pending an owner-reviewed retention migration.
