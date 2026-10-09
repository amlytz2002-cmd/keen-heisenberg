-- ============================================================================
-- CENNA.live v1.0 — Pilot Core Database Schema & Row-Level Security
-- Authoritative persistent learning platform data layer
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. PROFILES & ROLES
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS profiles 
    ADD COLUMN IF NOT EXISTS avatar_path TEXT,
    ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
    ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Helper functions for RLS checks
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

-- ----------------------------------------------------------------------------
-- 2. CLASSROOMS & INVITATIONS
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS classrooms
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill name from title if title exists
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classrooms' AND column_name = 'title') THEN
        UPDATE public.classrooms SET name = title WHERE name IS NULL AND title IS NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classrooms' AND column_name = 'created_by') THEN
        UPDATE public.classrooms SET owner_id = created_by WHERE owner_id IS NULL AND created_by IS NOT NULL;
    END IF;
END $$;

ALTER TABLE IF EXISTS classroom_members
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'left'));

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_classroom_member'
    ) THEN
        ALTER TABLE public.classroom_members 
        ADD CONSTRAINT unique_classroom_member UNIQUE (classroom_id, user_id);
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

CREATE TABLE IF NOT EXISTS classroom_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    max_uses INTEGER NULL,
    use_count INTEGER NOT NULL DEFAULT 0,
    revoked_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_token_hash ON classroom_invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_invitations_classroom_id ON classroom_invitations(classroom_id);

-- ----------------------------------------------------------------------------
-- 3. COURSES & MODULES
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS courses
    ADD COLUMN IF NOT EXISTS classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS subject TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'name') THEN
        UPDATE public.courses SET title = name WHERE title IS NULL AND name IS NOT NULL;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS course_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_modules_course_pos ON course_modules(course_id, position);

-- ----------------------------------------------------------------------------
-- 4. RESOURCES & EXTRACTION CHUNKS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    content_hash TEXT NULL,
    processing_status TEXT NOT NULL DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'queued', 'processing', 'extracted', 'indexing', 'completed', 'failed')),
    processing_error_code TEXT NULL,
    processing_error_message TEXT NULL,
    extraction_version TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resources_course_id ON resources(course_id);
CREATE INDEX IF NOT EXISTS idx_resources_classroom_id ON resources(classroom_id);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(processing_status);

CREATE TABLE IF NOT EXISTS resource_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    page_number INTEGER NULL,
    section_title TEXT NULL,
    start_offset INTEGER NULL,
    end_offset INTEGER NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_resource_chunk UNIQUE (resource_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_resource_chunks_resource_id ON resource_chunks(resource_id);

CREATE TABLE IF NOT EXISTS processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    attempt_count INTEGER NOT NULL DEFAULT 0,
    idempotency_key TEXT UNIQUE,
    last_error_code TEXT NULL,
    last_error_message TEXT NULL,
    started_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_resource ON processing_jobs(resource_id);

-- ----------------------------------------------------------------------------
-- 5. CONCEPTS, CITATIONS & RELATIONS
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS concepts
    ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES course_modules(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS summary TEXT,
    ADD COLUMN IF NOT EXISTS explanation TEXT,
    ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'needs_review', 'approved', 'published', 'rejected', 'archived')),
    ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'concepts' AND column_name = 'canonical_name') THEN
        UPDATE public.concepts SET title = canonical_name WHERE title IS NULL AND canonical_name IS NOT NULL;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS concept_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES resource_chunks(id) ON DELETE SET NULL,
    page_number INTEGER NULL,
    citation_text TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_concept_sources_concept_id ON concept_sources(concept_id);

CREATE TABLE IF NOT EXISTS concept_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    related_concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL CHECK (relation_type IN ('prerequisite', 'related', 'extends', 'contrast')),
    CONSTRAINT unique_concept_relation UNIQUE (concept_id, related_concept_id, relation_type)
);

CREATE INDEX IF NOT EXISTS idx_concept_relations_concept_id ON concept_relations(concept_id);

-- ----------------------------------------------------------------------------
-- 6. QUESTION BANK & QUESTION SOURCES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    concept_id UUID REFERENCES concepts(id) ON DELETE SET NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('single_choice', 'multiple_select', 'short_answer', 'true_false', 'scenario', 'numeric')),
    difficulty TEXT NOT NULL DEFAULT 'intermediate' CHECK (difficulty IN ('easy', 'intermediate', 'hard')),
    question_text TEXT NOT NULL,
    options JSONB NULL,
    answer_key JSONB NOT NULL,
    explanation TEXT NOT NULL,
    hint_sequence JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'needs_review', 'approved', 'published', 'rejected', 'archived')),
    version INTEGER NOT NULL DEFAULT 1,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_concept_id ON questions(concept_id);
CREATE INDEX IF NOT EXISTS idx_questions_course_id ON questions(course_id);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);

CREATE TABLE IF NOT EXISTS question_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES resource_chunks(id) ON DELETE SET NULL,
    page_number INTEGER NULL,
    supporting_excerpt TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_sources_question_id ON question_sources(question_id);

-- ----------------------------------------------------------------------------
-- 7. STUDY SESSIONS, ATTEMPTS & HINTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL DEFAULT 'daily_study' CHECK (session_type IN ('daily_study', 'concept_deep_dive', 'spaced_review', 'quick_practice')),
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ NULL,
    planned_duration_seconds INTEGER DEFAULT 1500,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_status ON study_sessions(status);

CREATE TABLE IF NOT EXISTS question_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    study_session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL,
    question_version INTEGER NOT NULL DEFAULT 1,
    answer_payload JSONB NOT NULL,
    is_correct BOOLEAN NULL,
    score NUMERIC NULL,
    hints_used INTEGER NOT NULL DEFAULT 0,
    feedback JSONB NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    grading_status TEXT NOT NULL DEFAULT 'graded' CHECK (grading_status IN ('graded', 'pending', 'manual_review'))
);

CREATE INDEX IF NOT EXISTS idx_question_attempts_user_id ON question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_question_id ON question_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_session_id ON question_attempts(study_session_id);

CREATE TABLE IF NOT EXISTS hint_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_attempt_id UUID NOT NULL REFERENCES question_attempts(id) ON DELETE CASCADE,
    hint_index INTEGER NOT NULL,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    hint_source TEXT NOT NULL DEFAULT 'pre_reviewed' CHECK (hint_source IN ('pre_reviewed', 'generated')),
    CONSTRAINT unique_attempt_hint UNIQUE (question_attempt_id, hint_index)
);

CREATE INDEX IF NOT EXISTS idx_hint_events_attempt_id ON hint_events(question_attempt_id);

-- ----------------------------------------------------------------------------
-- 8. REVIEW ENGINE & MASTERY
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_concept_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    mastery_score NUMERIC NOT NULL DEFAULT 0.00 CHECK (mastery_score BETWEEN 0.00 AND 100.00),
    review_stage INTEGER NOT NULL DEFAULT 0 CHECK (review_stage BETWEEN 0 AND 4),
    last_reviewed_at TIMESTAMPTZ NULL,
    next_review_at TIMESTAMPTZ NULL,
    consecutive_successes INTEGER NOT NULL DEFAULT 0,
    total_attempts INTEGER NOT NULL DEFAULT 0,
    correct_attempts INTEGER NOT NULL DEFAULT 0,
    recent_performance JSONB NULL DEFAULT '[]'::jsonb,
    algorithm_version TEXT NOT NULL DEFAULT 'cennalive_v1',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_concept_progress UNIQUE (user_id, concept_id)
);

CREATE INDEX IF NOT EXISTS idx_user_concept_progress_user_id ON user_concept_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_concept_progress_due ON user_concept_progress(user_id, next_review_at);

CREATE TABLE IF NOT EXISTS review_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    question_attempt_id UUID REFERENCES question_attempts(id) ON DELETE SET NULL,
    previous_stage INTEGER NULL,
    new_stage INTEGER NOT NULL,
    previous_due_at TIMESTAMPTZ NULL,
    next_due_at TIMESTAMPTZ NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('initial_learning', 'retrieval_success', 'retrieval_failure', 'lapse_reset', 'manual_adjustment')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_events_user_concept ON review_events(user_id, concept_id);

-- ----------------------------------------------------------------------------
-- 9. TIMED MOCK EXAMS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    duration_seconds INTEGER NOT NULL DEFAULT 3600,
    max_attempts INTEGER DEFAULT 1,
    available_from TIMESTAMPTZ NULL,
    available_until TIMESTAMPTZ NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    scoring_config JSONB NOT NULL DEFAULT '{"passing_score": 70, "penalty_per_incorrect": 0}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exams_course_id ON exams(course_id);
CREATE INDEX IF NOT EXISTS idx_exams_classroom_id ON exams(classroom_id);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);

CREATE TABLE IF NOT EXISTS exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    points NUMERIC NOT NULL DEFAULT 1.0,
    CONSTRAINT unique_exam_question UNIQUE (exam_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_pos ON exam_questions(exam_id, position);

CREATE TABLE IF NOT EXISTS exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'submitted', 'timed_out', 'graded', 'cancelled')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    deadline_at TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ NULL,
    score NUMERIC NULL,
    result_summary JSONB NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_exam ON exam_attempts(user_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_status ON exam_attempts(status);

CREATE TABLE IF NOT EXISTS exam_attempt_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    question_version INTEGER NOT NULL DEFAULT 1,
    answer_payload JSONB NULL,
    is_correct BOOLEAN NULL,
    points_awarded NUMERIC NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_attempt_question_answer UNIQUE (exam_attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_attempt_answers_attempt ON exam_attempt_answers(exam_attempt_id);

-- ----------------------------------------------------------------------------
-- 10. EMAIL, AUDIT & AI LOGGING
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email_type TEXT NOT NULL CHECK (email_type IN ('classroom_invitation', 'study_reminder', 'processing_failure', 'account_notice')),
    provider_message_id TEXT NULL,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'failed', 'delivered', 'bounced')),
    idempotency_key TEXT UNIQUE NOT NULL,
    last_error_code TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_events_idempotency ON email_events(idempotency_key);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

CREATE TABLE IF NOT EXISTS ai_generation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
    task_type TEXT NOT NULL CHECK (task_type IN ('concept_extraction', 'question_generation', 'hint_generation', 'short_answer_grading')),
    model_identifier TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
    validation_result JSONB NULL,
    created_content_id UUID NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_generation_runs_req ON ai_generation_runs(requested_by);

-- ----------------------------------------------------------------------------
-- 11. STORAGE BUCKETS CONFIGURATION
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('course-resources', 'course-resources', false, 52428800, ARRAY['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('user-avatars', 'user-avatars', false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Enable RLS across all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hint_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_concept_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_runs ENABLE ROW LEVEL SECURITY;

-- 12.1 user_roles
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can read own roles" ON user_roles;
    CREATE POLICY "Users can read own roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
    CREATE POLICY "Admins can manage all roles" ON user_roles FOR ALL USING (public.is_admin(auth.uid()));
END $$;

-- 12.2 classrooms
DO $$ BEGIN
    DROP POLICY IF EXISTS "Members and owners read classrooms" ON classrooms;
    CREATE POLICY "Members and owners read classrooms" ON classrooms FOR SELECT USING (
        auth.uid() = owner_id 
        OR public.is_admin(auth.uid())
        OR EXISTS (SELECT 1 FROM classroom_members WHERE classroom_id = classrooms.id AND user_id = auth.uid())
    );

    DROP POLICY IF EXISTS "Instructors can create classrooms" ON classrooms;
    CREATE POLICY "Instructors can create classrooms" ON classrooms FOR INSERT WITH CHECK (
        auth.uid() = owner_id
    );

    DROP POLICY IF EXISTS "Owners can update classrooms" ON classrooms;
    CREATE POLICY "Owners can update classrooms" ON classrooms FOR UPDATE USING (
        auth.uid() = owner_id OR public.is_admin(auth.uid())
    );
END $$;

-- 12.3 classroom_members
DO $$ BEGIN
    DROP POLICY IF EXISTS "Members can view peers in classroom" ON classroom_members;
    CREATE POLICY "Members can view peers in classroom" ON classroom_members FOR SELECT USING (
        auth.uid() = user_id
        OR public.is_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM classrooms WHERE id = classroom_members.classroom_id AND owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM classroom_members cm WHERE cm.classroom_id = classroom_members.classroom_id AND cm.user_id = auth.uid()
        )
    );

    DROP POLICY IF EXISTS "Owners or self can join classroom" ON classroom_members;
    CREATE POLICY "Owners or self can join classroom" ON classroom_members FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        OR public.is_admin(auth.uid())
        OR EXISTS (SELECT 1 FROM classrooms WHERE id = classroom_members.classroom_id AND owner_id = auth.uid())
    );

    DROP POLICY IF EXISTS "Owners manage members" ON classroom_members;
    CREATE POLICY "Owners manage members" ON classroom_members FOR UPDATE USING (
        auth.uid() = user_id 
        OR public.is_admin(auth.uid())
        OR EXISTS (SELECT 1 FROM classrooms WHERE id = classroom_members.classroom_id AND owner_id = auth.uid())
    );
END $$;

-- 12.4 classroom_invitations
DO $$ BEGIN
    DROP POLICY IF EXISTS "Classroom instructors manage invitations" ON classroom_invitations;
    CREATE POLICY "Classroom instructors manage invitations" ON classroom_invitations FOR ALL USING (
        public.is_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM classrooms WHERE id = classroom_invitations.classroom_id AND owner_id = auth.uid()
        )
    );
    -- Public token lookup policy for redemption
    DROP POLICY IF EXISTS "Anyone with token hash can view valid invitation" ON classroom_invitations;
    CREATE POLICY "Anyone with token hash can view valid invitation" ON classroom_invitations FOR SELECT USING (
        revoked_at IS NULL AND expires_at > NOW()
    );
END $$;

-- 12.5 courses & modules
DO $$ BEGIN
    DROP POLICY IF EXISTS "Read published courses or if enrolled" ON courses;
    CREATE POLICY "Read published courses or if enrolled" ON courses FOR SELECT USING (
        status = 'published'
        OR auth.uid() = created_by
        OR public.is_admin(auth.uid())
        OR (classroom_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM classroom_members WHERE classroom_id = courses.classroom_id AND user_id = auth.uid()
        ))
    );

    DROP POLICY IF EXISTS "Instructors manage courses" ON courses;
    CREATE POLICY "Instructors manage courses" ON courses FOR ALL USING (
        auth.uid() = created_by OR public.is_admin(auth.uid())
    );

    DROP POLICY IF EXISTS "Read modules of accessible courses" ON course_modules;
    CREATE POLICY "Read modules of accessible courses" ON course_modules FOR SELECT USING (
        EXISTS (SELECT 1 FROM courses WHERE id = course_modules.course_id AND (
            status = 'published' 
            OR created_by = auth.uid() 
            OR public.is_admin(auth.uid())
        ))
    );

    DROP POLICY IF EXISTS "Instructors manage modules" ON course_modules;
    CREATE POLICY "Instructors manage modules" ON course_modules FOR ALL USING (
        EXISTS (SELECT 1 FROM courses WHERE id = course_modules.course_id AND (
            created_by = auth.uid() OR public.is_admin(auth.uid())
        ))
    );
END $$;

-- 12.6 resources & chunks
DO $$ BEGIN
    DROP POLICY IF EXISTS "Read resources" ON resources;
    CREATE POLICY "Read resources" ON resources FOR SELECT USING (
        uploaded_by = auth.uid()
        OR public.is_admin(auth.uid())
        OR (course_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM courses WHERE id = resources.course_id AND status = 'published'
        ))
        OR (classroom_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM classroom_members WHERE classroom_id = resources.classroom_id AND user_id = auth.uid()
        ))
    );

    DROP POLICY IF EXISTS "Instructors manage resources" ON resources;
    CREATE POLICY "Instructors manage resources" ON resources FOR ALL USING (
        uploaded_by = auth.uid() OR public.is_admin(auth.uid())
    );

    DROP POLICY IF EXISTS "Read chunks" ON resource_chunks;
    CREATE POLICY "Read chunks" ON resource_chunks FOR SELECT USING (
        EXISTS (SELECT 1 FROM resources WHERE id = resource_chunks.resource_id)
    );
END $$;

-- 12.7 concepts & relations
DO $$ BEGIN
    DROP POLICY IF EXISTS "Read concepts" ON concepts;
    CREATE POLICY "Read concepts" ON concepts FOR SELECT USING (
        status = 'published'
        OR created_by = auth.uid()
        OR public.is_admin(auth.uid())
        OR EXISTS (SELECT 1 FROM courses WHERE id = concepts.course_id AND created_by = auth.uid())
    );

    DROP POLICY IF EXISTS "Instructors manage concepts" ON concepts;
    CREATE POLICY "Instructors manage concepts" ON concepts FOR ALL USING (
        created_by = auth.uid()
        OR public.is_admin(auth.uid())
        OR EXISTS (SELECT 1 FROM courses WHERE id = concepts.course_id AND created_by = auth.uid())
    );

    DROP POLICY IF EXISTS "Read concept sources" ON concept_sources;
    CREATE POLICY "Read concept sources" ON concept_sources FOR SELECT USING (
        EXISTS (SELECT 1 FROM concepts WHERE id = concept_sources.concept_id)
    );

    DROP POLICY IF EXISTS "Read concept relations" ON concept_relations;
    CREATE POLICY "Read concept relations" ON concept_relations FOR SELECT USING (
        EXISTS (SELECT 1 FROM concepts WHERE id = concept_relations.concept_id)
    );
END $$;

-- 12.8 questions & sources
DO $$ BEGIN
    DROP POLICY IF EXISTS "Read questions" ON questions;
    CREATE POLICY "Read questions" ON questions FOR SELECT USING (
        status = 'published'
        OR created_by = auth.uid()
        OR public.is_admin(auth.uid())
        OR EXISTS (SELECT 1 FROM courses WHERE id = questions.course_id AND created_by = auth.uid())
    );

    DROP POLICY IF EXISTS "Instructors manage questions" ON questions;
    CREATE POLICY "Instructors manage questions" ON questions FOR ALL USING (
        created_by = auth.uid()
        OR public.is_admin(auth.uid())
        OR EXISTS (SELECT 1 FROM courses WHERE id = questions.course_id AND created_by = auth.uid())
    );

    DROP POLICY IF EXISTS "Read question sources" ON question_sources;
    CREATE POLICY "Read question sources" ON question_sources FOR SELECT USING (
        EXISTS (SELECT 1 FROM questions WHERE id = question_sources.question_id)
    );
END $$;

-- 12.9 study sessions, attempts, hints
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users manage own study sessions" ON study_sessions;
    CREATE POLICY "Users manage own study sessions" ON study_sessions FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users manage own question attempts" ON question_attempts;
    CREATE POLICY "Users manage own question attempts" ON question_attempts FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users manage own hint events" ON hint_events;
    CREATE POLICY "Users manage own hint events" ON hint_events FOR ALL USING (
        EXISTS (SELECT 1 FROM question_attempts WHERE id = hint_events.question_attempt_id AND user_id = auth.uid())
    );
END $$;

-- 12.10 user concept progress & review events
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users manage own concept progress" ON user_concept_progress;
    CREATE POLICY "Users manage own concept progress" ON user_concept_progress FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users read own review events" ON review_events;
    CREATE POLICY "Users read own review events" ON review_events FOR SELECT USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users insert own review events" ON review_events;
    CREATE POLICY "Users insert own review events" ON review_events FOR INSERT WITH CHECK (auth.uid() = user_id);
END $$;

-- 12.11 exams & attempts
DO $$ BEGIN
    DROP POLICY IF EXISTS "Read published exams" ON exams;
    CREATE POLICY "Read published exams" ON exams FOR SELECT USING (
        status = 'published'
        OR created_by = auth.uid()
        OR public.is_admin(auth.uid())
    );

    DROP POLICY IF EXISTS "Instructors manage exams" ON exams;
    CREATE POLICY "Instructors manage exams" ON exams FOR ALL USING (
        created_by = auth.uid() OR public.is_admin(auth.uid())
    );

    DROP POLICY IF EXISTS "Read exam questions" ON exam_questions;
    CREATE POLICY "Read exam questions" ON exam_questions FOR SELECT USING (
        EXISTS (SELECT 1 FROM exams WHERE id = exam_questions.exam_id AND (status = 'published' OR created_by = auth.uid()))
    );

    DROP POLICY IF EXISTS "Users manage own exam attempts" ON exam_attempts;
    CREATE POLICY "Users manage own exam attempts" ON exam_attempts FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users manage own exam attempt answers" ON exam_attempt_answers;
    CREATE POLICY "Users manage own exam attempt answers" ON exam_attempt_answers FOR ALL USING (
        EXISTS (SELECT 1 FROM exam_attempts WHERE id = exam_attempt_answers.exam_attempt_id AND user_id = auth.uid())
    );
END $$;

-- 12.12 email events, audit logs, AI runs
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users read own email events" ON email_events;
    CREATE POLICY "Users read own email events" ON email_events FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

    DROP POLICY IF EXISTS "Admins read audit logs" ON audit_logs;
    CREATE POLICY "Admins read audit logs" ON audit_logs FOR SELECT USING (public.is_admin(auth.uid()));

    DROP POLICY IF EXISTS "Instructors read own AI runs" ON ai_generation_runs;
    CREATE POLICY "Instructors read own AI runs" ON ai_generation_runs FOR SELECT USING (auth.uid() = requested_by OR public.is_admin(auth.uid()));
END $$;
