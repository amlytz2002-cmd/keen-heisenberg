CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. COURSES & ACADEMIC CATALOG
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    faculty VARCHAR(255) DEFAULT 'Biruni Üniversitesi Eczacılık Fakültesi',
    term VARCHAR(32) NOT NULL,
    year INT NOT NULL DEFAULT 3,
    language VARCHAR(8) DEFAULT 'tr',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CONCEPTS & RELATIONS
CREATE TABLE IF NOT EXISTS concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    slug VARCHAR(64) UNIQUE NOT NULL,
    canonical_name VARCHAR(255) NOT NULL,
    pillar VARCHAR(32) NOT NULL,
    syllabus_weight NUMERIC(3,2) DEFAULT 1.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS concept_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
    target_concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
    edge_type VARCHAR(32) NOT NULL,
    CONSTRAINT unique_concept_edge UNIQUE (source_concept_id, target_concept_id, edge_type)
);

-- 3. ITEMS & DIAGNOSTIC DISTRACTORS
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID REFERENCES concepts(id) ON DELETE RESTRICT,
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

CREATE TABLE IF NOT EXISTS distractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    option_key VARCHAR(8) NOT NULL,
    text_tr TEXT NOT NULL,
    misconception_tag VARCHAR(64) NOT NULL,
    CONSTRAINT unique_item_option UNIQUE (item_id, option_key)
);

-- 4. ATTEMPTS & TELEMETRY
CREATE TABLE IF NOT EXISTS attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    submitted_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    confidence INT NOT NULL CHECK (confidence BETWEEN 1 AND 5),
    latency_ms INT NOT NULL,
    hint_level INT DEFAULT 0,
    assisted BOOLEAN DEFAULT FALSE,
    changed_answer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ERROR DIAGNOSIS & REMEDIATION
CREATE TABLE IF NOT EXISTS error_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES attempts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
    error_family VARCHAR(32) NOT NULL,
    misconception_tag VARCHAR(64) NOT NULL,
    failed_node VARCHAR(64),
    confidence INT NOT NULL DEFAULT 3,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    is_hypercorrection BOOLEAN GENERATED ALWAYS AS (confidence >= 4 AND is_correct = FALSE) STORED,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS next_time_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
    misconception_tag VARCHAR(64) NOT NULL,
    rule_text_tr TEXT NOT NULL,
    edited_by_user BOOLEAN DEFAULT FALSE,
    times_shown INT DEFAULT 0,
    last_shown TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SCHEDULING (FSRS) & MASTERY
CREATE TABLE IF NOT EXISTS user_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
    mastery_score NUMERIC(3,2) DEFAULT 0.00,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_concept_mastery UNIQUE (user_id, concept_id)
);

CREATE TABLE IF NOT EXISTS review_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    stability NUMERIC(6,2) DEFAULT 1.00,
    difficulty NUMERIC(6,2) DEFAULT 5.00,
    due_at TIMESTAMPTZ DEFAULT NOW(),
    last_reviewed TIMESTAMPTZ,
    CONSTRAINT unique_user_item_schedule UNIQUE (user_id, item_id)
);

-- 7. USAGE TRACKING & ACCESS CONTROL
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier VARCHAR(16) NOT NULL DEFAULT 'free',
    period VARCHAR(16) NOT NULL DEFAULT 'monthly',
    status VARCHAR(16) NOT NULL DEFAULT 'active',
    current_period_end TIMESTAMPTZ NOT NULL,
    activated_manually_by VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS llm_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    route VARCHAR(32) NOT NULL,
    tokens_in INT NOT NULL,
    tokens_out INT NOT NULL,
    cost_est_usd NUMERIC(8,6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_time_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own attempts') THEN
        CREATE POLICY "Users read own attempts" ON attempts FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own attempts') THEN
        CREATE POLICY "Users insert own attempts" ON attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own error events') THEN
        CREATE POLICY "Users read own error events" ON error_events FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own next time rules') THEN
        CREATE POLICY "Users manage own next time rules" ON next_time_rules FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own mastery') THEN
        CREATE POLICY "Users read own mastery" ON user_mastery FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own schedule') THEN
        CREATE POLICY "Users read own schedule" ON review_schedule FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own subscription') THEN
        CREATE POLICY "Users read own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;
