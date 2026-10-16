-- ============================================================================
-- Migration: 20261016160000_auth_confirmation_and_email_events.sql
-- Description:
--   1. Replace handle_new_user_autoconfirm() to selectively auto-confirm only
--      demo/seeded '@cenna.live' accounts, preserving NULL email_confirmed_at
--      for real users so Supabase GoTrue dispatches confirmation emails via Resend.
--   2. Re-ensure on_auth_user_created_autoconfirm trigger exists on auth.users
--      and preserve grants for supabase_auth_admin.
--   3. Expand public.email_events constraint to permit 'welcome_onboarding'
--      and 'account_notice' events, with strict RLS enforcement.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SELECTIVE AUTO-CONFIRMATION FOR DEMO / SEEDED ACCOUNTS ONLY
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user_autoconfirm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only auto-confirm internal demo/seeded accounts ending in @cenna.live
  IF NEW.email ILIKE '%@cenna.live' THEN
    NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW());
  END IF;
  -- For all real user emails, NEW.email_confirmed_at remains untouched (NULL),
  -- triggering Supabase GoTrue to send confirmation emails via SMTP/Resend.
  RETURN NEW;
END;
$$;

-- Revoke execute from public/anon/authenticated; grant strictly to supabase_auth_admin and service_role
REVOKE EXECUTE ON FUNCTION public.handle_new_user_autoconfirm() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user_autoconfirm() TO supabase_auth_admin, service_role;

-- Re-ensure trigger is registered on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_autoconfirm ON auth.users;
CREATE TRIGGER on_auth_user_created_autoconfirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_autoconfirm();

-- ----------------------------------------------------------------------------
-- 2. EMAIL_EVENTS SCHEMA HARDENING & CHECK CONSTRAINT EXPANSION
-- ----------------------------------------------------------------------------
-- Ensure table exists with all standard columns
CREATE TABLE IF NOT EXISTS public.email_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email_type TEXT NOT NULL,
    provider_message_id TEXT NULL,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'failed', 'delivered', 'bounced')),
    idempotency_key TEXT UNIQUE NOT NULL,
    last_error_code TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely and idempotently update email_type check constraint to include welcome_onboarding
DO $$
DECLARE
  v_con RECORD;
BEGIN
  FOR v_con IN (
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'public.email_events'::regclass 
      AND contype = 'c' 
      AND pg_get_constraintdef(oid) LIKE '%email_type%'
  ) LOOP
    EXECUTE 'ALTER TABLE public.email_events DROP CONSTRAINT ' || quote_ident(v_con.conname);
  END LOOP;
END $$;

ALTER TABLE public.email_events
  ADD CONSTRAINT email_events_email_type_check
  CHECK (email_type IN (
    'classroom_invitation', 
    'study_reminder', 
    'processing_failure', 
    'account_notice', 
    'welcome_onboarding'
  ));

-- Helpful indexes for idempotency and user lookup
CREATE INDEX IF NOT EXISTS idx_email_events_idempotency ON public.email_events(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_email_events_user_id ON public.email_events(user_id);

-- Keep updated_at synchronized
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_email_events_updated_at ON public.email_events;
CREATE TRIGGER trg_email_events_updated_at
  BEFORE UPDATE ON public.email_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 3. RLS LOCKDOWN & POLICIES FOR EMAIL_EVENTS
-- ----------------------------------------------------------------------------
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events FORCE ROW LEVEL SECURITY;

-- Server / service_role policies for Edge Functions
DROP POLICY IF EXISTS "Allow server to insert email events" ON public.email_events;
CREATE POLICY "Allow server to insert email events" 
  ON public.email_events 
  FOR INSERT 
  TO service_role 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow server to select email events" ON public.email_events;
CREATE POLICY "Allow server to select email events" 
  ON public.email_events 
  FOR SELECT 
  TO service_role 
  USING (true);

DROP POLICY IF EXISTS "Allow server to update email events" ON public.email_events;
CREATE POLICY "Allow server to update email events" 
  ON public.email_events 
  FOR UPDATE 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Authenticated user policies: users read own email events, admins read all
DROP POLICY IF EXISTS "Users read own email events" ON public.email_events;
CREATE POLICY "Users read own email events" 
  ON public.email_events
  FOR SELECT 
  TO authenticated
  USING ((SELECT auth.uid()) = user_id OR public.is_admin((SELECT auth.uid())));

-- Permissions grant lockdown
REVOKE ALL ON public.email_events FROM PUBLIC, anon;
GRANT SELECT ON public.email_events TO authenticated;
GRANT ALL ON public.email_events TO service_role;
