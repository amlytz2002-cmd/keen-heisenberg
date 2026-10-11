-- ============================================================================
-- CENNA.live v1.0 — Comprehensive Core Database Schema, Security & Auth Engine
-- Project: ltmtmhmadsrlvuqffdcs (cenna.live production backend)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. PROFILES & USER ROLES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    plan TEXT NOT NULL DEFAULT 'free',
    trial_started_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    trial_used BOOLEAN NOT NULL DEFAULT FALSE,
    preferred_language TEXT NOT NULL DEFAULT 'tr',
    country TEXT DEFAULT 'TR',
    university TEXT DEFAULT 'Biruni Üniversitesi',
    academic_year TEXT,
    learning_track TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    avatar_path TEXT,
    timezone TEXT DEFAULT 'UTC',
    onboarding_completed_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Security definer functions for role verification
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
CREATE TABLE IF NOT EXISTS public.classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    name TEXT,
    description TEXT,
    course_code VARCHAR(32) NOT NULL,
    term VARCHAR(32) NOT NULL,
    exam_date DATE,
    join_code VARCHAR(32) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    section_code TEXT DEFAULT '01',
    settings JSONB NOT NULL DEFAULT '{"item_cap": 20, "allow_student_reports": true, "target_session_minutes": 25}'::jsonb,
    blueprint_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.classroom_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL DEFAULT 'student',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'left')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_classroom_member UNIQUE (classroom_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_classroom_members_cid ON public.classroom_members(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_members_uid ON public.classroom_members(user_id);

CREATE TABLE IF NOT EXISTS public.classroom_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    max_uses INTEGER NULL,
    use_count INTEGER NOT NULL DEFAULT 0,
    revoked_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_token_hash ON public.classroom_invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_invitations_classroom_id ON public.classroom_invitations(classroom_id);

-- Helper functions for classrooms
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

-- ----------------------------------------------------------------------------
-- 3. COURSES & MODULES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    title TEXT,
    description TEXT,
    subject TEXT,
    faculty VARCHAR(255) DEFAULT 'Biruni Üniversitesi Eczacılık Fakültesi',
    term VARCHAR(32) NOT NULL,
    year INT NOT NULL DEFAULT 3,
    language VARCHAR(8) DEFAULT 'tr',
    is_active BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.course_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_modules_course_pos ON public.course_modules(course_id, position);

-- ----------------------------------------------------------------------------
-- 4. RESOURCES & EXTRACTION CHUNKS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_resources_course_id ON public.resources(course_id);
CREATE INDEX IF NOT EXISTS idx_resources_classroom_id ON public.resources(classroom_id);
CREATE INDEX IF NOT EXISTS idx_resources_status ON public.resources(processing_status);

CREATE TABLE IF NOT EXISTS public.resource_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    page_number INTEGER NULL,
    section_title TEXT NULL,
    start_offset INTEGER NULL,
    end_offset INTEGER NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_resource_chunk UNIQUE (resource_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_resource_chunks_resource_id ON public.resource_chunks(resource_id);

CREATE TABLE IF NOT EXISTS public.processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON public.processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_resource ON public.processing_jobs(resource_id);

-- ----------------------------------------------------------------------------
-- 5. CONCEPTS, CITATIONS & RELATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.course_modules(id) ON DELETE SET NULL,
    slug VARCHAR(64) UNIQUE NOT NULL,
    canonical_name VARCHAR(255) NOT NULL,
    title TEXT,
    summary TEXT,
    explanation TEXT,
    pillar VARCHAR(32) NOT NULL,
    syllabus_weight NUMERIC(3,2) DEFAULT 1.00,
    difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'needs_review', 'approved', 'published', 'rejected', 'archived')),
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.concept_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_concept_id UUID REFERENCES public.concepts(id) ON DELETE CASCADE,
    target_concept_id UUID REFERENCES public.concepts(id) ON DELETE CASCADE,
    edge_type VARCHAR(32) NOT NULL,
    CONSTRAINT unique_concept_edge UNIQUE (source_concept_id, target_concept_id, edge_type)
);

CREATE TABLE IF NOT EXISTS public.concept_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES public.resource_chunks(id) ON DELETE SET NULL,
    page_number INTEGER NULL,
    citation_text TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_concept_sources_concept_id ON public.concept_sources(concept_id);

CREATE TABLE IF NOT EXISTS public.concept_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
    related_concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL CHECK (relation_type IN ('prerequisite', 'related', 'extends', 'contrast')),
    CONSTRAINT unique_concept_relation UNIQUE (concept_id, related_concept_id, relation_type)
);

CREATE INDEX IF NOT EXISTS idx_concept_relations_concept_id ON public.concept_relations(concept_id);

-- ----------------------------------------------------------------------------
-- 6. QUESTION BANK & QUESTION SOURCES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID REFERENCES public.concepts(id) ON DELETE RESTRICT,
    stem_tr TEXT NOT NULL,
    item_type VARCHAR(16) NOT NULL DEFAULT 'numeric',
    correct_key VARCHAR(64) NOT NULL,
    tolerance_pct NUMERIC(4,2) DEFAULT 2.00,
    source_ref VARCHAR(255) NOT NULL,
    difficulty_tier INT DEFAULT 2,
    origin VARCHAR(16) DEFAULT 'authored',
    review_status VARCHAR(16) DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.distractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    option_key VARCHAR(8) NOT NULL,
    text_tr TEXT NOT NULL,
    misconception_tag VARCHAR(64) NOT NULL,
    CONSTRAINT unique_item_option UNIQUE (item_id, option_key)
);

CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    concept_id UUID REFERENCES public.concepts(id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_questions_concept_id ON public.questions(concept_id);
CREATE INDEX IF NOT EXISTS idx_questions_course_id ON public.questions(course_id);
CREATE INDEX IF NOT EXISTS idx_questions_status ON public.questions(status);

CREATE TABLE IF NOT EXISTS public.question_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES public.resource_chunks(id) ON DELETE SET NULL,
    page_number INTEGER NULL,
    supporting_excerpt TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_sources_question_id ON public.question_sources(question_id);

-- ----------------------------------------------------------------------------
-- 7. STUDY SESSIONS, ATTEMPTS & HINTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL DEFAULT 'daily_study' CHECK (session_type IN ('daily_study', 'concept_deep_dive', 'spaced_review', 'quick_practice')),
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ NULL,
    planned_duration_seconds INTEGER DEFAULT 1500,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_status ON public.study_sessions(status);

CREATE TABLE IF NOT EXISTS public.question_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    study_session_id UUID REFERENCES public.study_sessions(id) ON DELETE SET NULL,
    question_version INTEGER NOT NULL DEFAULT 1,
    answer_payload JSONB NOT NULL,
    is_correct BOOLEAN NULL,
    score NUMERIC NULL,
    hints_used INTEGER NOT NULL DEFAULT 0,
    feedback JSONB NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    grading_status TEXT NOT NULL DEFAULT 'graded' CHECK (grading_status IN ('graded', 'pending', 'manual_review'))
);

CREATE INDEX IF NOT EXISTS idx_question_attempts_user_id ON public.question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_question_id ON public.question_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_session_id ON public.question_attempts(study_session_id);

CREATE TABLE IF NOT EXISTS public.hint_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_attempt_id UUID NOT NULL REFERENCES public.question_attempts(id) ON DELETE CASCADE,
    hint_index INTEGER NOT NULL,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    hint_source TEXT NOT NULL DEFAULT 'pre_reviewed' CHECK (hint_source IN ('pre_reviewed', 'generated')),
    CONSTRAINT unique_attempt_hint UNIQUE (question_attempt_id, hint_index)
);

CREATE INDEX IF NOT EXISTS idx_hint_events_attempt_id ON public.hint_events(question_attempt_id);

-- ----------------------------------------------------------------------------
-- 8. REVIEW ENGINE & MASTERY
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_concept_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_user_concept_progress_user_id ON public.user_concept_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_concept_progress_due ON public.user_concept_progress(user_id, next_review_at);

CREATE TABLE IF NOT EXISTS public.review_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
    question_attempt_id UUID REFERENCES public.question_attempts(id) ON DELETE SET NULL,
    previous_stage INTEGER NULL,
    new_stage INTEGER NOT NULL,
    previous_due_at TIMESTAMPTZ NULL,
    next_due_at TIMESTAMPTZ NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('initial_learning', 'retrieval_success', 'retrieval_failure', 'lapse_reset', 'manual_adjustment')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_events_user_concept ON public.review_events(user_id, concept_id);

-- ----------------------------------------------------------------------------
-- 9. TIMED MOCK EXAMS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_exams_course_id ON public.exams(course_id);
CREATE INDEX IF NOT EXISTS idx_exams_classroom_id ON public.exams(classroom_id);
CREATE INDEX IF NOT EXISTS idx_exams_status ON public.exams(status);

CREATE TABLE IF NOT EXISTS public.exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    points NUMERIC NOT NULL DEFAULT 1.0,
    CONSTRAINT unique_exam_question UNIQUE (exam_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_pos ON public.exam_questions(exam_id, position);

CREATE TABLE IF NOT EXISTS public.exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_exam ON public.exam_attempts(user_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_status ON public.exam_attempts(status);

CREATE TABLE IF NOT EXISTS public.exam_attempt_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    question_version INTEGER NOT NULL DEFAULT 1,
    answer_payload JSONB NULL,
    is_correct BOOLEAN NULL,
    points_awarded NUMERIC NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_attempt_question_answer UNIQUE (exam_attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_attempt_answers_attempt ON public.exam_attempt_answers(exam_attempt_id);

-- ----------------------------------------------------------------------------
-- 10. ATTEMPTS, ERRORS, RULES, TELEMETRY & SUBSCRIPTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    submitted_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    confidence INT NOT NULL CHECK (confidence BETWEEN 1 AND 5),
    latency_ms INT NOT NULL,
    hint_level INT DEFAULT 0,
    assisted BOOLEAN DEFAULT FALSE,
    changed_answer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.error_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES public.attempts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    concept_id UUID REFERENCES public.concepts(id) ON DELETE CASCADE,
    error_family VARCHAR(32) NOT NULL,
    misconception_tag VARCHAR(64) NOT NULL,
    failed_node VARCHAR(64),
    confidence INT NOT NULL DEFAULT 3,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    is_hypercorrection BOOLEAN GENERATED ALWAYS AS (confidence >= 4 AND is_correct = FALSE) STORED,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.next_time_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    concept_id UUID REFERENCES public.concepts(id) ON DELETE CASCADE,
    misconception_tag VARCHAR(64) NOT NULL,
    rule_text_tr TEXT NOT NULL,
    edited_by_user BOOLEAN DEFAULT FALSE,
    times_shown INT DEFAULT 0,
    last_shown TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    concept_id UUID REFERENCES public.concepts(id) ON DELETE CASCADE,
    mastery_score NUMERIC(3,2) DEFAULT 0.00,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_concept_mastery UNIQUE (user_id, concept_id)
);

CREATE TABLE IF NOT EXISTS public.review_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    stability NUMERIC(6,2) DEFAULT 1.00,
    difficulty NUMERIC(6,2) DEFAULT 5.00,
    due_at TIMESTAMPTZ DEFAULT NOW(),
    last_reviewed TIMESTAMPTZ,
    CONSTRAINT unique_user_item_schedule UNIQUE (user_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier VARCHAR(16) NOT NULL DEFAULT 'free',
    period VARCHAR(16) NOT NULL DEFAULT 'monthly',
    status VARCHAR(16) NOT NULL DEFAULT 'active',
    current_period_end TIMESTAMPTZ NOT NULL,
    activated_manually_by VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.llm_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    route VARCHAR(32) NOT NULL,
    tokens_in INT NOT NULL,
    tokens_out INT NOT NULL,
    cost_est_usd NUMERIC(8,6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 11. EMAIL EVENTS, AUDIT LOGS, AI RUNS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_events (
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

CREATE INDEX IF NOT EXISTS idx_email_events_idempotency ON public.email_events(idempotency_key);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

CREATE TABLE IF NOT EXISTS public.ai_generation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL,
    task_type TEXT NOT NULL CHECK (task_type IN ('concept_extraction', 'question_generation', 'hint_generation', 'short_answer_grading')),
    model_identifier TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
    validation_result JSONB NULL,
    created_content_id UUID NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_generation_runs_req ON public.ai_generation_runs(requested_by);

-- ----------------------------------------------------------------------------
-- 12. STORAGE BUCKETS
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('course-resources', 'course-resources', false, 52428800, ARRAY['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('user-avatars', 'user-avatars', false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 13. RPC FUNCTIONS FOR INVITATIONS & TRIAL
-- ----------------------------------------------------------------------------
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
  -- 1. Fetch and lock invitation
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

  -- 2. Check if user already enrolled
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

  -- 3. Increment usage count
  UPDATE public.classroom_invitations
  SET use_count = use_count + 1
  WHERE id = v_invite.id;

  -- 4. Insert membership
  INSERT INTO public.classroom_members (classroom_id, user_id, role, status)
  VALUES (v_invite.classroom_id, p_user_id, 'student', 'active')
  RETURNING * INTO v_membership;

  -- 5. Audit log
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

-- ----------------------------------------------------------------------------
-- 14. AUTH TRIGGERS: AUTO-CONFIRMATION & PROFILE AUTO-POPULATION
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user_autoconfirm()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_autoconfirm ON auth.users;
CREATE TRIGGER on_auth_user_created_autoconfirm
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

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- ----------------------------------------------------------------------------
-- 15. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
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

-- 15.1 profiles
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
    CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Instructors can read member profiles" ON public.profiles;
    CREATE POLICY "Instructors can read member profiles" ON public.profiles FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.classroom_members cm
            JOIN public.classrooms c ON c.id = cm.classroom_id
            WHERE cm.user_id = public.profiles.id AND (c.owner_id = auth.uid() OR c.created_by = auth.uid())
        ) OR public.is_admin(auth.uid())
    );
END $$;

-- 15.2 user_roles
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
    CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
    CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.is_admin(auth.uid()));
END $$;

-- 15.3 classrooms
DO $$ BEGIN
    DROP POLICY IF EXISTS "Members and owners read classrooms" ON public.classrooms;
    CREATE POLICY "Members and owners read classrooms" ON public.classrooms FOR SELECT USING (
        auth.uid() = owner_id 
        OR auth.uid() = created_by
        OR public.is_admin(auth.uid())
        OR EXISTS (SELECT 1 FROM public.classroom_members WHERE classroom_id = public.classrooms.id AND user_id = auth.uid())
    );

    DROP POLICY IF EXISTS "Instructors can create classrooms" ON public.classrooms;
    CREATE POLICY "Instructors can create classrooms" ON public.classrooms FOR INSERT WITH CHECK (
        auth.uid() = owner_id OR auth.uid() = created_by
    );

    DROP POLICY IF EXISTS "Owners can update classrooms" ON public.classrooms;
    CREATE POLICY "Owners can update classrooms" ON public.classrooms FOR UPDATE USING (
        auth.uid() = owner_id OR auth.uid() = created_by OR public.is_admin(auth.uid())
    );
END $$;

-- 15.4 classroom_members
DO $$ BEGIN
    DROP POLICY IF EXISTS "Members can view peers in classroom" ON public.classroom_members;
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

    DROP POLICY IF EXISTS "Owners or self can join classroom" ON public.classroom_members;
    CREATE POLICY "Owners or self can join classroom" ON public.classroom_members FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        OR public.is_admin(auth.uid())
        OR EXISTS (SELECT 1 FROM public.classrooms WHERE id = public.classroom_members.classroom_id AND (owner_id = auth.uid() OR created_by = auth.uid()))
    );

    DROP POLICY IF EXISTS "Owners manage members" ON public.classroom_members;
    CREATE POLICY "Owners manage members" ON public.classroom_members FOR UPDATE USING (
        auth.uid() = user_id 
        OR public.is_admin(auth.uid())
        OR EXISTS (SELECT 1 FROM public.classrooms WHERE id = public.classroom_members.classroom_id AND (owner_id = auth.uid() OR created_by = auth.uid()))
    );
END $$;

-- 15.5 classroom_invitations
DO $$ BEGIN
    DROP POLICY IF EXISTS "Classroom instructors manage invitations" ON public.classroom_invitations;
    CREATE POLICY "Classroom instructors manage invitations" ON public.classroom_invitations FOR ALL USING (
        public.is_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.classrooms WHERE id = public.classroom_invitations.classroom_id AND (owner_id = auth.uid() OR created_by = auth.uid())
        )
    );

    DROP POLICY IF EXISTS "Anyone with token hash can view valid invitation" ON public.classroom_invitations;
    CREATE POLICY "Anyone with token hash can view valid invitation" ON public.classroom_invitations FOR SELECT USING (
        revoked_at IS NULL AND expires_at > NOW()
    );
END $$;

-- 15.6 courses & modules
DO $$ BEGIN
    DROP POLICY IF EXISTS "Read published courses or if enrolled" ON public.courses;
    CREATE POLICY "Read published courses or if enrolled" ON public.courses FOR SELECT USING (
        status = 'published'
        OR auth.uid() = created_by
        OR public.is_admin(auth.uid())
        OR (classroom_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.classroom_members WHERE classroom_id = public.courses.classroom_id AND user_id = auth.uid()
        ))
    );

    DROP POLICY IF EXISTS "Instructors manage courses" ON public.courses;
    CREATE POLICY "Instructors manage courses" ON public.courses FOR ALL USING (
        auth.uid() = created_by OR public.is_admin(auth.uid())
    );

    DROP POLICY IF EXISTS "Read modules of accessible courses" ON public.course_modules;
    CREATE POLICY "Read modules of accessible courses" ON public.course_modules FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.courses WHERE id = public.course_modules.course_id AND (
            status = 'published' 
            OR created_by = auth.uid() 
            OR public.is_admin(auth.uid())
        ))
    );

    DROP POLICY IF EXISTS "Instructors manage modules" ON public.course_modules;
    CREATE POLICY "Instructors manage modules" ON public.course_modules FOR ALL USING (
        EXISTS (SELECT 1 FROM public.courses WHERE id = public.course_modules.course_id AND (
            created_by = auth.uid() OR public.is_admin(auth.uid())
        ))
    );
END $$;

-- 15.7 resources & chunks
DO $$ BEGIN
    DROP POLICY IF EXISTS "Read resources" ON public.resources;
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

    DROP POLICY IF EXISTS "Instructors manage resources" ON public.resources;
    CREATE POLICY "Instructors manage resources" ON public.resources FOR ALL USING (
        uploaded_by = auth.uid() OR public.is_admin(auth.uid())
    );

    DROP POLICY IF EXISTS "Read chunks" ON public.resource_chunks;
    CREATE POLICY "Read chunks" ON public.resource_chunks FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.resources WHERE id = public.resource_chunks.resource_id)
    );

    DROP POLICY IF EXISTS "Instructors manage processing jobs" ON public.processing_jobs;
    CREATE POLICY "Instructors manage processing jobs" ON public.processing_jobs FOR ALL USING (
        EXISTS (SELECT 1 FROM public.resources WHERE id = public.processing_jobs.resource_id AND (uploaded_by = auth.uid() OR public.is_admin(auth.uid())))
    );
END $$;

-- 15.8 concepts & relations
DO $$ BEGIN
    DROP POLICY IF EXISTS "Read concepts" ON public.concepts;
    CREATE POLICY "Read concepts" ON public.concepts FOR SELECT USING (
        status = 'published'
        OR created_by = auth.uid()
        OR public.is_admin(auth.uid())
        OR EXISTS (SELECT 1 FROM public.courses WHERE id = public.concepts.course_id AND created_by = auth.uid())
    );

    DROP POLICY IF EXISTS "Instructors manage concepts" ON public.concepts;
    CREATE POLICY "Instructors manage concepts" ON public.concepts FOR ALL USING (
        created_by = auth.uid()
        OR public.is_admin(auth.uid())
        OR EXISTS (SELECT 1 FROM public.courses WHERE id = public.concepts.course_id AND created_by = auth.uid())
    );

    DROP POLICY IF EXISTS "Read concept edges" ON public.concept_edges;
    CREATE POLICY "Read concept edges" ON public.concept_edges FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.concepts WHERE id = public.concept_edges.source_concept_id)
    );

    DROP POLICY IF EXISTS "Read concept sources" ON public.concept_sources;
    CREATE POLICY "Read concept sources" ON public.concept_sources FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.concepts WHERE id = public.concept_sources.concept_id)
    );

    DROP POLICY IF EXISTS "Read concept relations" ON public.concept_relations;
    CREATE POLICY "Read concept relations" ON public.concept_relations FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.concepts WHERE id = public.concept_relations.concept_id)
    );
END $$;

-- 15.9 items & distractors
DO $$ BEGIN
    DROP POLICY IF EXISTS "Read approved items" ON public.items;
    CREATE POLICY "Read approved items" ON public.items FOR SELECT USING (
        review_status = 'approved' OR public.is_instructor(auth.uid())
    );

    DROP POLICY IF EXISTS "Instructors manage items" ON public.items;
    CREATE POLICY "Instructors manage items" ON public.items FOR ALL USING (
        public.is_instructor(auth.uid())
    );

    DROP POLICY IF EXISTS "Read distractors" ON public.distractors;
    CREATE POLICY "Read distractors" ON public.distractors FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.items WHERE id = public.distractors.item_id)
    );
END $$;

-- 15.10 questions & sources
DO $$ BEGIN
    DROP POLICY IF EXISTS "Read questions" ON public.questions;
    CREATE POLICY "Read questions" ON public.questions FOR SELECT USING (
        status = 'published'
        OR created_by = auth.uid()
        OR public.is_admin(auth.uid())
        OR EXISTS (SELECT 1 FROM public.courses WHERE id = public.questions.course_id AND created_by = auth.uid())
    );

    DROP POLICY IF EXISTS "Instructors manage questions" ON public.questions;
    CREATE POLICY "Instructors manage questions" ON public.questions FOR ALL USING (
        created_by = auth.uid()
        OR public.is_admin(auth.uid())
        OR EXISTS (SELECT 1 FROM public.courses WHERE id = public.questions.course_id AND created_by = auth.uid())
    );

    DROP POLICY IF EXISTS "Read question sources" ON public.question_sources;
    CREATE POLICY "Read question sources" ON public.question_sources FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.questions WHERE id = public.question_sources.question_id)
    );
END $$;

-- 15.11 study sessions, attempts, hints
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users manage own study sessions" ON public.study_sessions;
    CREATE POLICY "Users manage own study sessions" ON public.study_sessions FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users manage own question attempts" ON public.question_attempts;
    CREATE POLICY "Users manage own question attempts" ON public.question_attempts FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users manage own hint events" ON public.hint_events;
    CREATE POLICY "Users manage own hint events" ON public.hint_events FOR ALL USING (
        EXISTS (SELECT 1 FROM public.question_attempts WHERE id = public.hint_events.question_attempt_id AND user_id = auth.uid())
    );
END $$;

-- 15.12 user concept progress & review events
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users manage own concept progress" ON public.user_concept_progress;
    CREATE POLICY "Users manage own concept progress" ON public.user_concept_progress FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users read own review events" ON public.review_events;
    CREATE POLICY "Users read own review events" ON public.review_events FOR SELECT USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users insert own review events" ON public.review_events;
    CREATE POLICY "Users insert own review events" ON public.review_events FOR INSERT WITH CHECK (auth.uid() = user_id);
END $$;

-- 15.13 exams & attempts
DO $$ BEGIN
    DROP POLICY IF EXISTS "Read published exams" ON public.exams;
    CREATE POLICY "Read published exams" ON public.exams FOR SELECT USING (
        status = 'published'
        OR created_by = auth.uid()
        OR public.is_admin(auth.uid())
    );

    DROP POLICY IF EXISTS "Instructors manage exams" ON public.exams;
    CREATE POLICY "Instructors manage exams" ON public.exams FOR ALL USING (
        created_by = auth.uid() OR public.is_admin(auth.uid())
    );

    DROP POLICY IF EXISTS "Read exam questions" ON public.exam_questions;
    CREATE POLICY "Read exam questions" ON public.exam_questions FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.exams WHERE id = public.exam_questions.exam_id AND (status = 'published' OR created_by = auth.uid()))
    );

    DROP POLICY IF EXISTS "Users manage own exam attempts" ON public.exam_attempts;
    CREATE POLICY "Users manage own exam attempts" ON public.exam_attempts FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users manage own exam attempt answers" ON public.exam_attempt_answers;
    CREATE POLICY "Users manage own exam attempt answers" ON public.exam_attempt_answers FOR ALL USING (
        EXISTS (SELECT 1 FROM public.exam_attempts WHERE id = public.exam_attempt_answers.exam_attempt_id AND user_id = auth.uid())
    );
END $$;

-- 15.14 telemetry & spaced practice
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users read own attempts" ON public.attempts;
    CREATE POLICY "Users read own attempts" ON public.attempts FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users insert own attempts" ON public.attempts;
    CREATE POLICY "Users insert own attempts" ON public.attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users read own error events" ON public.error_events;
    CREATE POLICY "Users read own error events" ON public.error_events FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users manage own next time rules" ON public.next_time_rules;
    CREATE POLICY "Users manage own next time rules" ON public.next_time_rules FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users read own mastery" ON public.user_mastery;
    CREATE POLICY "Users read own mastery" ON public.user_mastery FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users read own schedule" ON public.review_schedule;
    CREATE POLICY "Users read own schedule" ON public.review_schedule FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users read own subscription" ON public.subscriptions;
    CREATE POLICY "Users read own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
END $$;

-- 15.15 email events, audit logs, AI runs
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users read own email events" ON public.email_events;
    CREATE POLICY "Users read own email events" ON public.email_events FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

    DROP POLICY IF EXISTS "Admins read audit logs" ON public.audit_logs;
    CREATE POLICY "Admins read audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin(auth.uid()));

    DROP POLICY IF EXISTS "Instructors read own AI runs" ON public.ai_generation_runs;
    CREATE POLICY "Instructors read own AI runs" ON public.ai_generation_runs FOR SELECT USING (auth.uid() = requested_by OR public.is_admin(auth.uid()));
END $$;
