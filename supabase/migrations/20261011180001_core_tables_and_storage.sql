-- ============================================================================
-- CENNA.live v1.0 — Part 1: Core Tables, Indices & Storage Buckets
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES & ROLES
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

-- 2. CLASSROOMS & INVITATIONS
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

-- 3. COURSES & MODULES
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

-- 4. RESOURCES & EXTRACTION CHUNKS
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

-- 5. CONCEPTS, CITATIONS & RELATIONS
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

-- 6. QUESTION BANK & QUESTION SOURCES
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

-- 7. STUDY SESSIONS, ATTEMPTS & HINTS
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

-- 8. REVIEW ENGINE & MASTERY
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

-- 9. TIMED MOCK EXAMS
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

-- 10. ATTEMPTS, ERRORS, RULES & SUBSCRIPTIONS
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

-- 11. EMAIL EVENTS, AUDIT LOGS, AI RUNS
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

-- 12. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('course-resources', 'course-resources', false, 52428800, ARRAY['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('user-avatars', 'user-avatars', false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
