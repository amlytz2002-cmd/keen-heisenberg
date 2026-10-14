-- ==============================================================================
-- CENNA.live Microlearning Concurrency-Safe Progress & Gamification RPC
-- Migration: 20261014180000_atomic_sync_lesson_progress.sql
-- ==============================================================================

-- 1. Schema & Table Adjustments
-- Make last_active_date nullable so newly initialized users without activity have NULL last_active_date
ALTER TABLE public.user_gamification ALTER COLUMN last_active_date DROP NOT NULL;
ALTER TABLE public.user_gamification ALTER COLUMN last_active_date DROP DEFAULT;

-- 2. Internal canonical catalog function in auth_helpers schema
-- Not exposed to PostgREST public schema. Maps the 42 verified activities to exact XP.
CREATE SCHEMA IF NOT EXISTS auth_helpers;

CREATE OR REPLACE FUNCTION auth_helpers.get_canonical_activity_xp(p_id TEXT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE p_id
    -- Tier 1 Theory Lessons (src/data/courses/medicinalChemistryTier1.ts)
    WHEN 'les-1' THEN 30  WHEN 'les-2' THEN 30  WHEN 'les-3' THEN 35  WHEN 'les-4' THEN 35  WHEN 'les-5' THEN 35
    WHEN 'les-6' THEN 40  WHEN 'les-7' THEN 35  WHEN 'les-8' THEN 30  WHEN 'les-9' THEN 40  WHEN 'les-10' THEN 40
    WHEN 'les-11' THEN 30 WHEN 'les-12' THEN 40 WHEN 'les-13' THEN 35 WHEN 'les-14' THEN 35 WHEN 'les-15' THEN 40
    WHEN 'les-16' THEN 35 WHEN 'les-17' THEN 35 WHEN 'les-18' THEN 35 WHEN 'les-19' THEN 30 WHEN 'les-20' THEN 45
    WHEN 'les-21' THEN 40
    -- Clinical Rescue Missions (src/data/courses/medicinalChemistryMissions.ts)
    WHEN 'mission-1' THEN 35  WHEN 'mission-2' THEN 40  WHEN 'mission-3' THEN 40  WHEN 'mission-4' THEN 45
    WHEN 'mission-5' THEN 45  WHEN 'mission-6' THEN 40  WHEN 'mission-7' THEN 50  WHEN 'mission-8' THEN 45
    WHEN 'mission-9' THEN 45  WHEN 'mission-10' THEN 50 WHEN 'mission-11' THEN 40 WHEN 'mission-12' THEN 45
    WHEN 'mission-13' THEN 40 WHEN 'mission-14' THEN 45 WHEN 'mission-15' THEN 45 WHEN 'mission-16' THEN 35
    WHEN 'mission-17' THEN 45 WHEN 'mission-18' THEN 40 WHEN 'mission-19' THEN 45 WHEN 'mission-20' THEN 50
    WHEN 'mission-21' THEN 45
    ELSE NULL
  END;
$$;

GRANT USAGE ON SCHEMA auth_helpers TO authenticated, service_role;
REVOKE ALL ON FUNCTION auth_helpers.get_canonical_activity_xp(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION auth_helpers.get_canonical_activity_xp(TEXT) TO authenticated, service_role;

-- 3. Atomic progress synchronization RPC
CREATE OR REPLACE FUNCTION public.sync_lesson_progress(
    p_lesson_id TEXT,
    p_current_step INTEGER,
    p_is_completed BOOLEAN,
    p_stars_earned INTEGER,
    p_completed_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID;
    v_server_today DATE := (timezone('utc'::text, now()))::date;
    v_canonical_xp INTEGER;
    v_existing_prog public.user_lesson_progress%ROWTYPE;
    v_existing_game public.user_gamification%ROWTYPE;
    v_is_new_completion BOOLEAN := false;
    v_xp_delta INTEGER := 0;
    v_count_delta INTEGER := 0;
    v_next_streak INTEGER;
    v_next_last_active DATE;
    v_merged_completed_at TIMESTAMPTZ;
BEGIN
    -- A. Authentication derivation: strictly from auth.uid()
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- B. Strict input validation
    IF p_lesson_id IS NULL THEN
        RAISE EXCEPTION 'Lesson ID cannot be null';
    END IF;

    IF p_current_step < 0 OR p_current_step > 100 THEN
        RAISE EXCEPTION 'Invalid current_step value: % (expected 0-100)', p_current_step;
    END IF;

    IF p_stars_earned < 0 OR p_stars_earned > 3 THEN
        RAISE EXCEPTION 'Invalid stars_earned value: % (expected 0-3)', p_stars_earned;
    END IF;

    -- C. Canonical catalog check and XP derivation on the server
    v_canonical_xp := auth_helpers.get_canonical_activity_xp(p_lesson_id);
    IF v_canonical_xp IS NULL THEN
        RAISE EXCEPTION 'Unknown or unauthorized activity ID: %', p_lesson_id;
    END IF;

    -- D. Global lock hierarchy: Order 1 - user_gamification
    -- Initialize unplayed users with NULL last_active_date and 0 streak
    INSERT INTO public.user_gamification (user_id, streak, xp, completed_lessons_count, last_active_date)
    VALUES (v_user_id, 0, 0, 0, NULL)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT * INTO v_existing_game
    FROM public.user_gamification
    WHERE user_id = v_user_id
    FOR UPDATE;

    -- E. Global lock hierarchy: Order 2 - user_lesson_progress
    INSERT INTO public.user_lesson_progress (user_id, lesson_id, current_step, stars_earned, is_completed)
    VALUES (v_user_id, p_lesson_id, 0, 0, false)
    ON CONFLICT (user_id, lesson_id) DO NOTHING;

    SELECT * INTO v_existing_prog
    FROM public.user_lesson_progress
    WHERE user_id = v_user_id AND lesson_id = p_lesson_id
    FOR UPDATE;

    -- F. Evaluate completion and reward qualification
    v_is_new_completion := (p_is_completed AND NOT v_existing_prog.is_completed);

    IF v_is_new_completion THEN
        v_xp_delta := v_canonical_xp;
        v_count_delta := 1;
    ELSE
        v_xp_delta := 0;
        v_count_delta := 0;
    END IF;

    -- G. Compute monotonic completed_at
    IF v_existing_prog.is_completed THEN
        -- Preserve first non-null completion timestamp; repair legacy completed rows where timestamp was NULL
        v_merged_completed_at := COALESCE(v_existing_prog.completed_at, timezone('utc'::text, now()));
    ELSIF p_is_completed THEN
        -- Brand new completion: derive authoritative completion timestamp strictly from server now()
        -- Untrusted client timestamps cannot backdate or forward-date server-owned completion timestamps
        v_merged_completed_at := timezone('utc'::text, now());
    ELSE
        v_merged_completed_at := NULL;
    END IF;

    -- H. Update user_lesson_progress monotonically
    UPDATE public.user_lesson_progress
    SET is_completed = (v_existing_prog.is_completed OR p_is_completed),
        current_step = GREATEST(v_existing_prog.current_step, p_current_step),
        stars_earned = GREATEST(v_existing_prog.stars_earned, p_stars_earned),
        completed_at = v_merged_completed_at,
        updated_at = timezone('utc'::text, now())
    WHERE user_id = v_user_id AND lesson_id = p_lesson_id
    RETURNING * INTO v_existing_prog;

    -- I. Update user_gamification (streak, XP, completed_lessons_count) only on completion
    IF p_is_completed THEN
        v_next_streak := v_existing_game.streak;
        v_next_last_active := v_existing_game.last_active_date;

        IF v_existing_game.last_active_date IS NULL THEN
            -- First recorded completion ever
            v_next_streak := GREATEST(v_existing_game.streak, 1);
            v_next_last_active := v_server_today;
        ELSIF v_existing_game.last_active_date = v_server_today THEN
            -- Activity already recorded on this calendar day: streak preserved
            v_next_streak := v_existing_game.streak;
        ELSIF v_existing_game.last_active_date = v_server_today - 1 THEN
            -- Consecutive calendar day: increment streak
            v_next_streak := v_existing_game.streak + 1;
            v_next_last_active := v_server_today;
        ELSE
            -- Missed calendar day (< v_server_today - 1) or future date anomaly (> v_server_today)
            v_next_streak := 1;
            v_next_last_active := v_server_today;
        END IF;

        UPDATE public.user_gamification
        SET streak = v_next_streak,
            xp = v_existing_game.xp + v_xp_delta,
            completed_lessons_count = v_existing_game.completed_lessons_count + v_count_delta,
            last_active_date = v_next_last_active,
            updated_at = timezone('utc'::text, now())
        WHERE user_id = v_user_id
        RETURNING * INTO v_existing_game;
    END IF;

    -- J. Return authoritative merged state
    RETURN jsonb_build_object(
        'lesson_id', v_existing_prog.lesson_id,
        'current_step', v_existing_prog.current_step,
        'is_completed', v_existing_prog.is_completed,
        'stars_earned', v_existing_prog.stars_earned,
        'completed_at', v_existing_prog.completed_at,
        'streak', v_existing_game.streak,
        'xp', v_existing_game.xp,
        'completed_lessons_count', v_existing_game.completed_lessons_count,
        'last_active_date', v_existing_game.last_active_date
    );
END;
$$;

-- 4. Security Hardening
REVOKE ALL ON FUNCTION public.sync_lesson_progress(TEXT, INTEGER, BOOLEAN, INTEGER, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_lesson_progress(TEXT, INTEGER, BOOLEAN, INTEGER, TIMESTAMPTZ) TO authenticated, service_role;
