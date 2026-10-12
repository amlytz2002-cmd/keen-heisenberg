-- ==============================================================================
-- CENNA.live Microlearning Gamification and Lesson Progress Schema
-- Migration: 20261012170000_microlearning_progress.sql
-- ==============================================================================

-- 1. User Lesson Progress Table
CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    current_step INTEGER NOT NULL DEFAULT 0,
    stars_earned INTEGER NOT NULL DEFAULT 0 CHECK (stars_earned >= 0 AND stars_earned <= 3),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_lesson_progress UNIQUE (user_id, lesson_id)
);

-- 2. User Gamification Table (Streak & XP)
CREATE TABLE IF NOT EXISTS public.user_gamification (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    streak INTEGER NOT NULL DEFAULT 0 CHECK (streak >= 0),
    xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
    last_active_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed_lessons_count INTEGER NOT NULL DEFAULT 0 CHECK (completed_lessons_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_ulp_user_lesson ON public.user_lesson_progress(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_ulp_completed ON public.user_lesson_progress(user_id, is_completed);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for user_lesson_progress
DROP POLICY IF EXISTS "Users can view own lesson progress" ON public.user_lesson_progress;
CREATE POLICY "Users can view own lesson progress"
    ON public.user_lesson_progress
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own lesson progress" ON public.user_lesson_progress;
CREATE POLICY "Users can insert own lesson progress"
    ON public.user_lesson_progress
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own lesson progress" ON public.user_lesson_progress;
CREATE POLICY "Users can update own lesson progress"
    ON public.user_lesson_progress
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. RLS Policies for user_gamification
DROP POLICY IF EXISTS "Users can view own gamification stats" ON public.user_gamification;
CREATE POLICY "Users can view own gamification stats"
    ON public.user_gamification
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own gamification stats" ON public.user_gamification;
CREATE POLICY "Users can insert own gamification stats"
    ON public.user_gamification
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own gamification stats" ON public.user_gamification;
CREATE POLICY "Users can update own gamification stats"
    ON public.user_gamification
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
