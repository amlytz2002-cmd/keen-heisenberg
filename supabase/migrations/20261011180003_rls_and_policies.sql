-- ============================================================================
-- CENNA.live v1.0 — Part 3: Row-Level Security (RLS) Enablement & Access Policies
-- ============================================================================

-- 1. Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hint_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_concept_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.next_time_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_usage ENABLE ROW LEVEL SECURITY;

-- 2. profiles
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own profile' AND tablename = 'profiles') THEN
        CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile' AND tablename = 'profiles') THEN
        CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Instructors can read member profiles' AND tablename = 'profiles') THEN
        CREATE POLICY "Instructors can read member profiles" ON public.profiles FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.classroom_members cm
            JOIN public.classrooms c ON c.id = cm.classroom_id
            WHERE cm.user_id = public.profiles.id AND (c.owner_id = auth.uid() OR c.created_by = auth.uid())
        ) OR public.is_admin(auth.uid())
    );
    END IF;
END $$;

-- 3. user_roles
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own roles' AND tablename = 'user_roles') THEN
        CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all roles' AND tablename = 'user_roles') THEN
        CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.is_admin(auth.uid()));
    END IF;
END $$;

-- 4. classrooms
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Members and owners read classrooms' AND tablename = 'classrooms') THEN
        CREATE POLICY "Members and owners read classrooms" ON public.classrooms FOR SELECT USING (
        auth.uid() = owner_id 
        OR auth.uid() = created_by
        OR public.is_admin(auth.uid())
        OR EXISTS (SELECT 1 FROM public.classroom_members WHERE classroom_id = public.classrooms.id AND user_id = auth.uid())
    );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Instructors can create classrooms' AND tablename = 'classrooms') THEN
        CREATE POLICY "Instructors can create classrooms" ON public.classrooms FOR INSERT WITH CHECK (
        auth.uid() = owner_id OR auth.uid() = created_by
    );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners can update classrooms' AND tablename = 'classrooms') THEN
        CREATE POLICY "Owners can update classrooms" ON public.classrooms FOR UPDATE USING (
        auth.uid() = owner_id OR auth.uid() = created_by OR public.is_admin(auth.uid())
    );
    END IF;
END $$;

-- 5. classroom_members
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Members can view peers in classroom' AND tablename = 'classroom_members') THEN
        CREATE POLICY "Members can view peers in classroom" ON public.classroom_members FOR SELECT USING (
        auth.uid() = user_id
        OR public.is_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.classrooms WHERE id = public.classroom_members.classroom_id AND (owner_id = auth.uid() OR created_by = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.classroom_members cm WHERE cm.classroom_id = public.classroom_members.classroom_id AND cm.user_id = auth.uid()
        )
    );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners or self can join classroom' AND tablename = 'classroom_members') THEN
        CREATE POLICY "Owners or self can join classroom" ON public.classroom_members FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        OR public.is_admin(auth.uid())
        OR EXISTS (SELECT 1 FROM public.classrooms WHERE id = public.classroom_members.classroom_id AND (owner_id = auth.uid() OR created_by = auth.uid()))
    );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners manage members' AND tablename = 'classroom_members') THEN
        CREATE POLICY "Owners manage members" ON public.classroom_members FOR UPDATE USING (
        auth.uid() = user_id 
        OR public.is_admin(auth.uid())
        OR EXISTS (SELECT 1 FROM public.classrooms WHERE id = public.classroom_members.classroom_id AND (owner_id = auth.uid() OR created_by = auth.uid()))
    );
    END IF;
END $$;

-- 6. classroom_invitations
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Classroom instructors manage invitations' AND tablename = 'classroom_invitations') THEN
        CREATE POLICY "Classroom instructors manage invitations" ON public.classroom_invitations FOR ALL USING (
        public.is_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.classrooms WHERE id = public.classroom_invitations.classroom_id AND (owner_id = auth.uid() OR created_by = auth.uid())
        )
    );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone with token hash can view valid invitation' AND tablename = 'classroom_invitations') THEN
        CREATE POLICY "Anyone with token hash can view valid invitation" ON public.classroom_invitations FOR SELECT USING (
        revoked_at IS NULL AND expires_at > NOW()
    );
    END IF;
END $$;

-- 7. courses & modules
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Read published courses or if enrolled' AND tablename = 'courses') THEN
        CREATE POLICY "Read published courses or if enrolled" ON public.courses FOR SELECT USING (
        status = 'published'
        OR auth.uid() = created_by
        OR public.is_admin(auth.uid())
        OR (classroom_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.classroom_members WHERE classroom_id = public.courses.classroom_id AND user_id = auth.uid()
        ))
    );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Instructors manage courses' AND tablename = 'courses') THEN
        CREATE POLICY "Instructors manage courses" ON public.courses FOR ALL USING (
        auth.uid() = created_by OR public.is_admin(auth.uid())
    );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Read modules of accessible courses' AND tablename = 'course_modules') THEN
        CREATE POLICY "Read modules of accessible courses" ON public.course_modules FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.courses WHERE id = public.course_modules.course_id AND (
            status = 'published' 
            OR created_by = auth.uid() 
            OR public.is_admin(auth.uid())
        ))
    );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Instructors manage modules' AND tablename = 'course_modules') THEN
        CREATE POLICY "Instructors manage modules" ON public.course_modules FOR ALL USING (
        EXISTS (SELECT 1 FROM public.courses WHERE id = public.course_modules.course_id AND (
            created_by = auth.uid() OR public.is_admin(auth.uid())
        ))
    );
    END IF;
END $$;

-- 8. resources & chunks
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Read resources' AND tablename = 'resources') THEN
        CREATE POLICY "Read resources" ON public.resources FOR SELECT USING (
        uploaded_by = auth.uid()
        OR public.is_admin(auth.uid())
        OR (course_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.courses WHERE id = public.resources.course_id AND status = 'published'
        ))
        OR (classroom_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.classroom_members WHERE classroom_id = public.resources.classroom_id AND user_id = auth.uid()
        ))
    );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Instructors manage resources' AND tablename = 'resources') THEN
        CREATE POLICY "Instructors manage resources" ON public.resources FOR ALL USING (
        uploaded_by = auth.uid() OR public.is_admin(auth.uid())
    );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Read chunks' AND tablename = 'resource_chunks') THEN
        CREATE POLICY "Read chunks" ON public.resource_chunks FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.resources WHERE id = public.resource_chunks.resource_id)
    );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Instructors manage processing jobs' AND tablename = 'processing_jobs') THEN
        CREATE POLICY "Instructors manage processing jobs" ON public.processing_jobs FOR ALL USING (
        EXISTS (SELECT 1 FROM public.resources WHERE id = public.processing_jobs.resource_id AND (uploaded_by = auth.uid() OR public.is_admin(auth.uid())))
    );
    END IF;
END $$;

-- 9. concepts & relations
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Read concepts' AND tablename = 'concepts') THEN
        CREATE POLICY "Read concepts" ON public.concepts FOR SELECT USING (
        status = 'published'
        OR created_by = auth.uid()
        OR public.is_admin(auth.uid())
        OR EXISTS (SELECT 1 FROM public.courses WHERE id = public.concepts.course_id AND created_by = auth.uid())
    );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Instructors manage concepts' AND tablename = 'concepts') THEN
        CREATE POLICY "Instructors manage concepts" ON public.concepts FOR ALL USING (
        created_by = auth.uid()
        OR public.is_admin(auth.uid())
        OR EXISTS (SELECT 1 FROM public.courses WHERE id = public.concepts.course_id AND created_by = auth.uid())
    );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Read concept edges' AND tablename = 'concept_edges') THEN
        CREATE POLICY "Read concept edges" ON public.concept_edges FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.concepts WHERE id = public.concept_edges.source_concept_id)
    );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Read concept sources' AND tablename = 'concept_sources') THEN
        CREATE POLICY "Read concept sources" ON public.concept_sources FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.concepts WHERE id = public.concept_sources.concept_id)
    );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Read concept relations' AND tablename = 'concept_relations') THEN
        CREATE POLICY "Read concept relations" ON public.concept_relations FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.concepts WHERE id = public.concept_relations.concept_id)
    );
    END IF;
END $$;

-- 10. items & distractors
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Read approved items' AND tablename = 'items') THEN
        CREATE POLICY "Read approved items" ON public.items FOR SELECT USING (
        review_status = 'approved' OR public.is_instructor(auth.uid())
    );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Instructors manage items' AND tablename = 'items') THEN
        CREATE POLICY "Instructors manage items" ON public.items FOR ALL USING (
        public.is_instructor(auth.uid())
    );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Read distractors' AND tablename = 'distractors') THEN
        CREATE POLICY "Read distractors" ON public.distractors FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.items WHERE id = public.distractors.item_id)
    );
    END IF;
END $$;

-- 11. questions & sources
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Read questions' AND tablename = 'questions') THEN
        CREATE POLICY "Read questions" ON public.questions FOR SELECT USING (
        status = 'published'
        OR created_by = auth.uid()
        OR public.is_admin(auth.uid())
        OR EXISTS (SELECT 1 FROM public.courses WHERE id = public.questions.course_id AND created_by = auth.uid())
    );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Instructors manage questions' AND tablename = 'questions') THEN
        CREATE POLICY "Instructors manage questions" ON public.questions FOR ALL USING (
        created_by = auth.uid()
        OR public.is_admin(auth.uid())
        OR EXISTS (SELECT 1 FROM public.courses WHERE id = public.questions.course_id AND created_by = auth.uid())
    );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Read question sources' AND tablename = 'question_sources') THEN
        CREATE POLICY "Read question sources" ON public.question_sources FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.questions WHERE id = public.question_sources.question_id)
    );
    END IF;
END $$;

-- 12. study sessions, attempts, hints
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own study sessions' AND tablename = 'study_sessions') THEN
        CREATE POLICY "Users manage own study sessions" ON public.study_sessions FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own question attempts' AND tablename = 'question_attempts') THEN
        CREATE POLICY "Users manage own question attempts" ON public.question_attempts FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own hint events' AND tablename = 'hint_events') THEN
        CREATE POLICY "Users manage own hint events" ON public.hint_events FOR ALL USING (
        EXISTS (SELECT 1 FROM public.question_attempts WHERE id = public.hint_events.question_attempt_id AND user_id = auth.uid())
    );
    END IF;
END $$;

-- 13. user concept progress & review events
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own concept progress' AND tablename = 'user_concept_progress') THEN
        CREATE POLICY "Users manage own concept progress" ON public.user_concept_progress FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own review events' AND tablename = 'review_events') THEN
        CREATE POLICY "Users read own review events" ON public.review_events FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own review events' AND tablename = 'review_events') THEN
        CREATE POLICY "Users insert own review events" ON public.review_events FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 14. exams & attempts
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Read published exams' AND tablename = 'exams') THEN
        CREATE POLICY "Read published exams" ON public.exams FOR SELECT USING (
        status = 'published'
        OR created_by = auth.uid()
        OR public.is_admin(auth.uid())
    );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Instructors manage exams' AND tablename = 'exams') THEN
        CREATE POLICY "Instructors manage exams" ON public.exams FOR ALL USING (
        created_by = auth.uid() OR public.is_admin(auth.uid())
    );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Read exam questions' AND tablename = 'exam_questions') THEN
        CREATE POLICY "Read exam questions" ON public.exam_questions FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.exams WHERE id = public.exam_questions.exam_id AND (status = 'published' OR created_by = auth.uid()))
    );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own exam attempts' AND tablename = 'exam_attempts') THEN
        CREATE POLICY "Users manage own exam attempts" ON public.exam_attempts FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own exam attempt answers' AND tablename = 'exam_attempt_answers') THEN
        CREATE POLICY "Users manage own exam attempt answers" ON public.exam_attempt_answers FOR ALL USING (
        EXISTS (SELECT 1 FROM public.exam_attempts WHERE id = public.exam_attempt_answers.exam_attempt_id AND user_id = auth.uid())
    );
    END IF;
END $$;

-- 15. telemetry & spaced practice
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own attempts' AND tablename = 'attempts') THEN
        CREATE POLICY "Users read own attempts" ON public.attempts FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own attempts' AND tablename = 'attempts') THEN
        CREATE POLICY "Users insert own attempts" ON public.attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own error events' AND tablename = 'error_events') THEN
        CREATE POLICY "Users read own error events" ON public.error_events FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own next time rules' AND tablename = 'next_time_rules') THEN
        CREATE POLICY "Users manage own next time rules" ON public.next_time_rules FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own mastery' AND tablename = 'user_mastery') THEN
        CREATE POLICY "Users read own mastery" ON public.user_mastery FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own schedule' AND tablename = 'review_schedule') THEN
        CREATE POLICY "Users read own schedule" ON public.review_schedule FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own subscription' AND tablename = 'subscriptions') THEN
        CREATE POLICY "Users read own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- 16. email events, audit logs, AI runs
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own email events' AND tablename = 'email_events') THEN
        CREATE POLICY "Users read own email events" ON public.email_events FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins read audit logs' AND tablename = 'audit_logs') THEN
        CREATE POLICY "Admins read audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin(auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Instructors read own AI runs' AND tablename = 'ai_generation_runs') THEN
        CREATE POLICY "Instructors read own AI runs" ON public.ai_generation_runs FOR SELECT USING (auth.uid() = requested_by OR public.is_admin(auth.uid()));
    END IF;
END $$;
