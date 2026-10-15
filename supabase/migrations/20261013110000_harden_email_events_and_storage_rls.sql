-- ============================================================================
-- CENNA.live v1.0 — Security Hardening: email_events & storage.objects RLS
-- ============================================================================

-- 1. Restrict email_events administrative policies strictly to service_role
-- (Preventing anonymous or untrusted clients from reading/modifying all transactional email events)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'email_events' AND policyname = 'Allow server to insert email events') THEN
        ALTER POLICY "Allow server to insert email events" ON public.email_events TO service_role;
    ELSE
        CREATE POLICY "Allow server to insert email events" ON public.email_events FOR INSERT TO service_role WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'email_events' AND policyname = 'Allow server to select email events') THEN
        ALTER POLICY "Allow server to select email events" ON public.email_events TO service_role;
    ELSE
        CREATE POLICY "Allow server to select email events" ON public.email_events FOR SELECT TO service_role USING (true);
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'email_events' AND policyname = 'Allow server to update email events') THEN
        ALTER POLICY "Allow server to update email events" ON public.email_events TO service_role;
    ELSE
        CREATE POLICY "Allow server to update email events" ON public.email_events FOR UPDATE TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Ensure authenticated users can only view their own email events
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'email_events' AND policyname = 'Users read own email events'
    ) THEN
        CREATE POLICY "Users read own email events" ON public.email_events
            FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
    END IF;
END $$;

-- 2. Storage RLS Policies for course-resources and user-avatars
-- (Note: storage.objects has RLS enabled by default in Supabase storage service)

-- Instructors and admins can upload course resources
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Instructors upload course resources'
    ) THEN
        CREATE POLICY "Instructors upload course resources" ON storage.objects
            FOR INSERT TO authenticated
            WITH CHECK (
                bucket_id = 'course-resources' AND (
                    public.is_instructor(auth.uid()) OR public.is_admin(auth.uid())
                )
            );
    END IF;
END $$;

-- Instructors and admins can view course resources
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Instructors view course resources'
    ) THEN
        CREATE POLICY "Instructors view course resources" ON storage.objects
            FOR SELECT TO authenticated
            USING (
                bucket_id = 'course-resources' AND (
                    public.is_instructor(auth.uid()) OR public.is_admin(auth.uid())
                )
            );
    END IF;
END $$;

-- Instructors and admins can delete course resources
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Instructors delete course resources'
    ) THEN
        CREATE POLICY "Instructors delete course resources" ON storage.objects
            FOR DELETE TO authenticated
            USING (
                bucket_id = 'course-resources' AND (
                    public.is_instructor(auth.uid()) OR public.is_admin(auth.uid())
                )
            );
    END IF;
END $$;

-- Authenticated users can upload, update, and delete their own avatar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users upload own avatar'
    ) THEN
        CREATE POLICY "Users upload own avatar" ON storage.objects
            FOR INSERT TO authenticated
            WITH CHECK (
                bucket_id = 'user-avatars' AND (
                    (storage.foldername(name))[1] = auth.uid()::text OR
                    name LIKE auth.uid()::text || '/%' OR
                    name LIKE auth.uid()::text || '.%'
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users update own avatar'
    ) THEN
        CREATE POLICY "Users update own avatar" ON storage.objects
            FOR UPDATE TO authenticated
            USING (
                bucket_id = 'user-avatars' AND (
                    (storage.foldername(name))[1] = auth.uid()::text OR
                    name LIKE auth.uid()::text || '/%' OR
                    name LIKE auth.uid()::text || '.%'
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users delete own avatar'
    ) THEN
        CREATE POLICY "Users delete own avatar" ON storage.objects
            FOR DELETE TO authenticated
            USING (
                bucket_id = 'user-avatars' AND (
                    (storage.foldername(name))[1] = auth.uid()::text OR
                    name LIKE auth.uid()::text || '/%' OR
                    name LIKE auth.uid()::text || '.%'
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users view avatars'
    ) THEN
        CREATE POLICY "Authenticated users view avatars" ON storage.objects
            FOR SELECT TO authenticated
            USING (bucket_id = 'user-avatars');
    END IF;
END $$;
