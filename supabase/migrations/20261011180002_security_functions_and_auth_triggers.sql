-- ============================================================================
-- CENNA.live v1.0 — Part 2: Security Definer Functions, RPCs & Auth Triggers
-- ============================================================================

-- 1. Helper functions for role & classroom checks
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = check_user_id AND role = 'admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_instructor(check_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = check_user_id AND role IN ('instructor', 'admin')
    );
$$;

CREATE OR REPLACE FUNCTION public.is_classroom_owner(cid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.classrooms
        WHERE id = cid AND (owner_id = auth.uid() OR created_by = auth.uid())
    );
$$;

CREATE OR REPLACE FUNCTION public.is_classroom_member(cid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.classroom_members
        WHERE classroom_id = cid AND user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.is_classroom_instructor(cid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.classrooms
        WHERE id = cid AND (created_by = auth.uid() OR owner_id = auth.uid())
    ) OR EXISTS (
        SELECT 1 FROM public.classroom_members
        WHERE classroom_id = cid AND user_id = auth.uid() AND role = 'instructor'
    );
$$;

-- 2. RPC Functions
CREATE OR REPLACE FUNCTION public.get_invitation_by_token_hash(p_hash TEXT)
RETURNS TABLE (
    id UUID,
    classroom_id UUID,
    expires_at TIMESTAMPTZ,
    max_uses INTEGER,
    use_count INTEGER,
    revoked_at TIMESTAMPTZ,
    classroom_name TEXT,
    classroom_description TEXT
) LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.classroom_id,
    ci.expires_at,
    ci.max_uses,
    ci.use_count,
    ci.revoked_at,
    COALESCE(c.name, c.title) as classroom_name,
    c.description as classroom_description
  FROM public.classroom_invitations ci
  JOIN public.classrooms c ON c.id = ci.classroom_id
  WHERE ci.token_hash = p_hash;
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_classroom_invitation(p_hash TEXT, p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_invite RECORD;
  v_existing RECORD;
  v_membership RECORD;
BEGIN
  SELECT * INTO v_invite
  FROM public.classroom_invitations
  WHERE token_hash = p_hash
  FOR UPDATE;

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

  SELECT * INTO v_existing
  FROM public.classroom_members
  WHERE classroom_id = v_invite.classroom_id AND user_id = p_user_id;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true, 
      'alreadyEnrolled', true, 
      'classroomId', v_invite.classroom_id,
      'message', 'Zaten bu sınıfa kayıtlısınız'
    );
  END IF;

  UPDATE public.classroom_invitations
  SET use_count = use_count + 1
  WHERE id = v_invite.id;

  INSERT INTO public.classroom_members (classroom_id, user_id, role, status)
  VALUES (v_invite.classroom_id, p_user_id, 'student', 'active')
  RETURNING * INTO v_membership;

  INSERT INTO public.audit_logs (actor_user_id, action, target_type, target_id, metadata)
  VALUES (p_user_id, 'CLASSROOM_JOINED', 'classrooms', v_invite.classroom_id, jsonb_build_object('invitation_id', v_invite.id));

  RETURN jsonb_build_object(
    'success', true,
    'alreadyEnrolled', false,
    'classroomId', v_invite.classroom_id,
    'membership', to_jsonb(v_membership)
  );
END;
$$;

-- 3. Auth triggers: Auto-confirmation & Profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_autoconfirm()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, NOW());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created_autoconfirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_autoconfirm();

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
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

  IF NEW.raw_user_meta_data->>'role' = 'instructor' 
     OR NEW.raw_user_meta_data->>'primary_role' = 'instructor' THEN
    v_role := 'instructor';
  END IF;

  INSERT INTO public.profiles (
    id, email, display_name, university, plan, preferred_language, created_at, last_active_at
  ) VALUES (
    NEW.id, NEW.email, v_name, v_univ, 'free', 'tr', NOW(), NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();
