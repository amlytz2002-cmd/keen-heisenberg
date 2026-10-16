-- ============================================================================
-- Migration: 20261016170000_fix_classroom_members_rls_recursion.sql
-- Description:
--   1. Harden classroom helper functions (is_classroom_member, is_classroom_owner,
--      is_classroom_instructor) with SECURITY DEFINER, SET search_path = public, STABLE.
--   2. Grant EXECUTE to anon and authenticated roles.
--   3. Replace recursive subquery in classroom_members SELECT policy with
--      security-definer helper functions to eliminate 42P17 infinite recursion.
-- ============================================================================

-- 1. Helper functions with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_classroom_member(cid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classroom_members
    WHERE classroom_id = cid AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_classroom_owner(cid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE id = cid AND (owner_id = auth.uid() OR created_by = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_classroom_instructor(cid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE id = cid AND (created_by = auth.uid() OR owner_id = auth.uid())
  ) OR EXISTS (
    SELECT 1 FROM public.classroom_members
    WHERE classroom_id = cid AND user_id = auth.uid() AND role = 'instructor'
  );
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.is_classroom_owner(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_classroom_member(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_classroom_instructor(uuid) TO anon, authenticated;

-- 2. Alter classroom_members SELECT policy to eliminate recursion
ALTER POLICY "Members can view peers in classroom" ON public.classroom_members
USING (
  (auth.uid() = user_id)
  OR is_admin(auth.uid())
  OR is_classroom_owner(classroom_id)
  OR is_classroom_member(classroom_id)
);
