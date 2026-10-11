-- Migration: 20261011183000_harden_security_definer_and_llm_usage.sql
-- Description: Harden security definer functions, isolate auth helpers, and add RLS policy for llm_usage

-- 1. Helper schema for auth verification to prevent PostgREST exposure & RLS recursion
CREATE SCHEMA IF NOT EXISTS auth_helpers;

CREATE OR REPLACE FUNCTION auth_helpers.is_admin(p_uid uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_uid AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION auth_helpers.is_instructor(p_uid uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_uid AND role IN ('instructor', 'admin')
  );
END;
$$;

-- 2. Public wrapper functions as SECURITY INVOKER (calling auth_helpers.*)
CREATE OR REPLACE FUNCTION public.is_admin(p_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
  SELECT auth_helpers.is_admin(p_uid);
$$;

CREATE OR REPLACE FUNCTION public.is_instructor(p_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
  SELECT auth_helpers.is_instructor(p_uid);
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_instructor(uuid) TO authenticated, service_role;

-- 3. Classroom helper functions: switch to SECURITY INVOKER and empty search_path
ALTER FUNCTION public.is_classroom_owner(uuid) SECURITY INVOKER;
ALTER FUNCTION public.is_classroom_owner(uuid) SET search_path = '';
REVOKE EXECUTE ON FUNCTION public.is_classroom_owner(uuid) FROM public, anon, authenticated;

ALTER FUNCTION public.is_classroom_member(uuid) SECURITY INVOKER;
ALTER FUNCTION public.is_classroom_member(uuid) SET search_path = '';
REVOKE EXECUTE ON FUNCTION public.is_classroom_member(uuid) FROM public, anon, authenticated;

ALTER FUNCTION public.is_classroom_instructor(uuid) SECURITY INVOKER;
ALTER FUNCTION public.is_classroom_instructor(uuid) SET search_path = '';
REVOKE EXECUTE ON FUNCTION public.is_classroom_instructor(uuid) FROM public, anon, authenticated;

-- 4. Harden triggers: SET search_path = '' and revoke execution from public/anon/authenticated
CREATE OR REPLACE FUNCTION public.handle_new_user_autoconfirm()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, NOW());
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_autoconfirm() FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_role TEXT := 'student';
  v_name TEXT;
  v_univ TEXT;
BEGIN
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  v_univ := COALESCE(
    NEW.raw_user_meta_data->>'university',
    NEW.raw_user_meta_data->>'faculty',
    'Biruni Üniversitesi'
  );
  IF NEW.raw_user_meta_data->>'role' = 'instructor' OR NEW.raw_user_meta_data->>'primary_role' = 'instructor' THEN
    v_role := 'instructor';
  END IF;
  INSERT INTO public.profiles (id, email, display_name, university, plan, preferred_language, created_at, last_active_at)
  VALUES (NEW.id, NEW.email, v_name, v_univ, 'free', 'tr', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_profile() FROM public, anon, authenticated;

-- 5. Harden invitation RPCs: SET search_path = '', revoke public/anon/authenticated, grant only to service_role
CREATE OR REPLACE FUNCTION public.get_invitation_by_token_hash(p_hash text)
RETURNS TABLE(id uuid, classroom_id uuid, expires_at timestamp with time zone, max_uses integer, use_count integer, revoked_at timestamp with time zone, classroom_name text, classroom_description text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT ci.id, ci.classroom_id, ci.expires_at, ci.max_uses, ci.use_count, ci.revoked_at, COALESCE(c.name, c.title) as classroom_name, c.description as classroom_description
  FROM public.classroom_invitations ci
  JOIN public.classrooms c ON c.id = ci.classroom_id
  WHERE ci.token_hash = p_hash;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_invitation_by_token_hash(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token_hash(text) TO service_role;

CREATE OR REPLACE FUNCTION public.redeem_classroom_invitation(p_hash text, p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_invite RECORD;
  v_existing RECORD;
  v_membership RECORD;
BEGIN
  SELECT * INTO v_invite FROM public.classroom_invitations WHERE token_hash = p_hash FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'INVALID_TOKEN', 'message', 'Davetiye geçersiz veya bulunamadı');
  END IF;
  IF v_invite.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'code', 'REVOKED', 'message', 'Bu davetiye iptal edilmiştir');
  END IF;
  IF v_invite.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'code', 'EXPIRED', 'message', 'Bu davetiyenin süresi dolmuştur');
  END IF;
  IF v_invite.max_uses IS NOT NULL AND v_invite.use_count >= v_invite.max_uses THEN
    RETURN jsonb_build_object('success', false, 'code', 'USAGE_LIMIT', 'message', 'Davetiyenin kullanım limiti dolmuştur');
  END IF;
  SELECT * INTO v_existing FROM public.classroom_members WHERE classroom_id = v_invite.classroom_id AND user_id = p_user_id;
  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'alreadyEnrolled', true, 'classroomId', v_invite.classroom_id, 'message', 'Zaten bu sınıfa kayıtlısınız');
  END IF;
  UPDATE public.classroom_invitations SET use_count = use_count + 1 WHERE id = v_invite.id;
  INSERT INTO public.classroom_members (classroom_id, user_id, role, status) VALUES (v_invite.classroom_id, p_user_id, 'student', 'active') RETURNING * INTO v_membership;
  INSERT INTO public.audit_logs (actor_user_id, action, target_type, target_id, metadata) VALUES (p_user_id, 'CLASSROOM_JOINED', 'classrooms', v_invite.classroom_id, jsonb_build_object('invitation_id', v_invite.id));
  RETURN jsonb_build_object('success', true, 'alreadyEnrolled', false, 'classroomId', v_invite.classroom_id, 'membership', to_jsonb(v_membership));
END;
$$;
REVOKE EXECUTE ON FUNCTION public.redeem_classroom_invitation(text, uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_classroom_invitation(text, uuid) TO service_role;

-- 6. Add RLS policy for llm_usage table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'llm_usage' AND policyname = 'Admins or users can manage llm_usage'
  ) THEN
    CREATE POLICY "Admins or users can manage llm_usage" ON public.llm_usage FOR ALL TO authenticated, service_role
    USING (is_admin(auth.uid()) OR auth.uid() = user_id)
    WITH CHECK (is_admin(auth.uid()) OR auth.uid() = user_id);
  END IF;
END $$;
