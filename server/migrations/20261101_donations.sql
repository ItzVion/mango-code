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

CREATE TABLE IF NOT EXISTS upi_donation_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_rupees INTEGER NOT NULL CHECK (amount_rupees BETWEEN 1 AND 100000),
  utr_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  review_note TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_upi_one_pending_per_user
  ON upi_donation_claims(user_id)
  WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_upi_claims_status_created
  ON upi_donation_claims(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_upi_claims_user_created
  ON upi_donation_claims(user_id, created_at DESC);
