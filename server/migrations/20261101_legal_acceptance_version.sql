-- Store the exact legal revision accepted during registration or sign-in.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS legal_accepted_version TEXT;
ALTER TABLE public.auth_otps ADD COLUMN IF NOT EXISTS legal_version TEXT;
