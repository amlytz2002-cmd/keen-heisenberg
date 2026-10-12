-- ==============================================================================
-- CENNA.live: Medicinal Chemistry (Farmasötik ve Medisinal Kimya) Tier 1
-- Production Backend Course Material & Schema Deployment
-- Migration: 20261012180000_seed_medicinal_chemistry_course.sql
-- ==============================================================================

-- 1. Ensure Microlearning Progress & Gamification Tables Exist
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

CREATE TABLE IF NOT EXISTS public.user_gamification (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    streak INTEGER NOT NULL DEFAULT 0 CHECK (streak >= 0),
    xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
    last_active_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed_lessons_count INTEGER NOT NULL DEFAULT 0 CHECK (completed_lessons_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ulp_user_lesson ON public.user_lesson_progress(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_ulp_completed ON public.user_lesson_progress(user_id, is_completed);

ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_lesson_progress' AND policyname = 'Users can view own lesson progress') THEN
        CREATE POLICY "Users can view own lesson progress" ON public.user_lesson_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_lesson_progress' AND policyname = 'Users can insert own lesson progress') THEN
        CREATE POLICY "Users can insert own lesson progress" ON public.user_lesson_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_lesson_progress' AND policyname = 'Users can update own lesson progress') THEN
        CREATE POLICY "Users can update own lesson progress" ON public.user_lesson_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_gamification' AND policyname = 'Users can view own gamification stats') THEN
        CREATE POLICY "Users can view own gamification stats" ON public.user_gamification FOR SELECT TO authenticated USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_gamification' AND policyname = 'Users can insert own gamification stats') THEN
        CREATE POLICY "Users can insert own gamification stats" ON public.user_gamification FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_gamification' AND policyname = 'Users can update own gamification stats') THEN
        CREATE POLICY "Users can update own gamification stats" ON public.user_gamification FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 2. Seed Course in public.courses
INSERT INTO public.courses (
    id,
    classroom_id,
    created_by,
    code,
    name,
    title,
    faculty,
    term,
    year,
    language,
    is_active,
    status,
    created_at,
    updated_at
) VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'c1a55000-0000-0000-0000-000000000001',
    'd1a55000-0000-0000-0000-000000000001',
    'ECZ304',
    'Farmasötik ve Medisinal Kimya',
    'Farmasötik ve Medisinal Kimya (Kademe 1: Temel İlkeler & SAR)',
    'Biruni Üniversitesi Eczacılık Fakültesi',
    'Güz',
    3,
    'tr',
    true,
    'published',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active;

-- 3. Seed Course Modules (6 Modules)
INSERT INTO public.course_modules (
    id,
    course_id,
    position,
    title,
    description,
    status,
    created_at,
    updated_at
) VALUES 
(
    'm0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    1,
    'Modül 1: Fonksiyonel Gruplar & Moleküler İskelet',
    'İlaçların temel yapı taşları: Oksijenli, azotlu, kükürtlü gruplar ve heterosiklik halkalar.',
    'published',
    NOW(),
    NOW()
),
(
    'm0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    2,
    'Modül 2: İlaç-Reseptör Etkileşimi & Bağ Türleri',
    'Kovalent, iyonik, hidrojen bağı ve Van der Waals etkileşimlerinin termodinamiği.',
    'published',
    NOW(),
    NOW()
),
(
    'm0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000001',
    3,
    'Modül 3: İlaçlarda İzomeri & Stereokimya',
    'Kiralite, Easson-Stedman 3-nokta hipotezi, ötromer/distomer ve kiral geçiş.',
    'published',
    NOW(),
    NOW()
),
(
    'm0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000001',
    4,
    'Modül 4: Biyoizosterizm İlkeleri & İlaç Optimizasyonu',
    'Grimm hidrit kayması, klasik ve non-klasik biyoizosterler ile metabolik zırhlama.',
    'published',
    NOW(),
    NOW()
),
(
    'm0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000001',
    5,
    'Modül 5: Yapı-Etki İlişkileri (SAR) & Çözünürlük',
    'LogP, Henderson-Hasselbalch, Lipinski Ro5 kuralları ve rasyonel sübstitüent tasarımı.',
    'published',
    NOW(),
    NOW()
),
(
    'm0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000001',
    6,
    'Modül 6: İlaç Metabolizması (Biyotransformasyon)',
    'Faz I CYP450 reaksiyonları, Faz II konjugasyonları ve Parasetamol toksisitesi.',
    'published',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    position = EXCLUDED.position;

-- 4. Seed Canonical Concepts in public.concepts
INSERT INTO public.concepts (
    id,
    course_id,
    module_id,
    slug,
    canonical_name,
    title,
    pillar,
    syllabus_weight,
    difficulty,
    status,
    version,
    created_at,
    updated_at
) VALUES 
(
    'c1100000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000001',
    'medchem-oxygen-groups',
    'Oksijenli Fonksiyonel Gruplar (Alkol, Eter, Ester)',
    'Oksijenli Fonksiyonel Gruplar',
    'chem_sar',
    1.00,
    'beginner',
    'published',
    1,
    NOW(),
    NOW()
),
(
    'c1100000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000001',
    'medchem-carbonyl-acyl',
    'Karbonil & Açil Türevleri Reaktivitesi',
    'Karbonil & Açil Türevleri Reaktivitesi',
    'chem_sar',
    1.00,
    'intermediate',
    'published',
    1,
    NOW(),
    NOW()
),
(
    'c1100000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000001',
    'medchem-nitrogen-sulfur',
    'Azot & Kükürt Fonksiyonel Grupları',
    'Azot & Kükürt Fonksiyonel Grupları',
    'chem_sar',
    1.00,
    'intermediate',
    'published',
    1,
    NOW(),
    NOW()
),
(
    'c1100000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000001',
    'medchem-heterocycles',
    'Heterosiklik Halkalar & Farmakofor İskeletler',
    'Heterosiklik Halkalar & Farmakofor İskeletler',
    'chem_sar',
    1.00,
    'advanced',
    'published',
    1,
    NOW(),
    NOW()
),
(
    'c1100000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000002',
    'medchem-covalent-binding',
    'Kovalent & Geri Dönüşümsüz İlaç Bağları',
    'Kovalent & Geri Dönüşümsüz İlaç Bağları',
    'chem_sar',
    1.00,
    'advanced',
    'published',
    1,
    NOW(),
    NOW()
),
(
    'c1100000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000002',
    'medchem-ionic-hydrogen-bonds',
    'İyonik Bağlar & Hidrojen Köprüleri',
    'İyonik Bağlar & Hidrojen Köprüleri',
    'chem_sar',
    1.00,
    'intermediate',
    'published',
    1,
    NOW(),
    NOW()
),
(
    'c1100000-0000-0000-0000-000000000007',
    'c0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000002',
    'medchem-hydrophobic-effect',
    'Zayıf Kuvvetler & Lipofilik Reseptör Cebi',
    'Zayıf Kuvvetler & Lipofilik Reseptör Cebi',
    'chem_sar',
    1.00,
    'intermediate',
    'published',
    1,
    NOW(),
    NOW()
),
(
    'c1100000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000003',
    'medchem-geometric-isomerism',
    'Geometrik İzomeri & Konformasyon',
    'Geometrik İzomeri & Konformasyon',
    'chem_sar',
    1.00,
    'intermediate',
    'published',
    1,
    NOW(),
    NOW()
),
(
    'c1100000-0000-0000-0000-000000000009',
    'c0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000003',
    'medchem-easson-stedman',
    'Optik İzomeri & Easson-Stedman 3-Nokta Hipotezi',
    'Optik İzomeri & Easson-Stedman Hipotezi',
    'chem_sar',
    1.00,
    'advanced',
    'published',
    1,
    NOW(),
    NOW()
),
(
    'c1100000-0000-0000-0000-000000000010',
    'c0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000003',
    'medchem-chiral-switch',
    'Kiral Geçiş & Talidomid Teratojenitesi',
    'Kiral Geçiş & Klinik Yansımalar',
    'chem_sar',
    1.00,
    'advanced',
    'published',
    1,
    NOW(),
    NOW()
),
(
    'c1100000-0000-0000-0000-000000000011',
    'c0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000004',
    'medchem-grimm-bioisostere',
    'Grimm Hidrit Kayması & Klasik Biyoizosterler',
    'Grimm Hidrit Kayması & Klasik Biyoizosterler',
    'chem_sar',
    1.00,
    'intermediate',
    'published',
    1,
    NOW(),
    NOW()
),
(
    'c1100000-0000-0000-0000-000000000012',
    'c0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000004',
    'medchem-tetrazole-carboxylic',
    'Non-Klasik Biyoizosterler: Tetrazol & Karboksil',
    'Tetrazol & Karboksil Biyoizosterizmi',
    'chem_sar',
    1.00,
    'advanced',
    'published',
    1,
    NOW(),
    NOW()
),
(
    'c1100000-0000-0000-0000-000000000013',
    'c0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000004',
    'medchem-procainamide-stability',
    'Biyoizosterizm ile Metabolik Kararlılık (Prokainamid)',
    'Metabolik Kararlılık & Ester/Amit Değişimi',
    'chem_sar',
    1.00,
    'intermediate',
    'published',
    1,
    NOW(),
    NOW()
),
(
    'c1100000-0000-0000-0000-000000000014',
    'c0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000005',
    'medchem-logp-partition',
    'Dağılma Katsayısı (LogP) & Membran Geçirgenliği',
    'Dağılma Katsayısı (LogP) & KBB',
    'chem_sar',
    1.00,
    'intermediate',
    'published',
    1,
    NOW(),
    NOW()
),
(
    'c1100000-0000-0000-0000-000000000015',
    'c0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000005',
    'medchem-henderson-hasselbalch',
    'Henderson-Hasselbalch & İlaç İyonizasyonu',
    'Henderson-Hasselbalch & İyon Tuzağı',
    'chem_sar',
    1.00,
    'intermediate',
    'published',
    1,
    NOW(),
    NOW()
),
(
    'c1100000-0000-0000-0000-000000000016',
    'c0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000005',
    'medchem-lipinski-ro5',
    'Lipinski 5 Kuralı (Rule of 5 - Ro5)',
    'Lipinski 5 Kuralı (Ro5)',
    'chem_sar',
    1.00,
    'beginner',
    'published',
    1,
    NOW(),
    NOW()
),
(
    'c1100000-0000-0000-0000-000000000017',
    'c0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000005',
    'medchem-sar-methodology',
    'SAR Analiz Metodolojisi & Substitüent Modifikasyonu',
    'SAR Analiz Metodolojisi',
    'chem_sar',
    1.00,
    'advanced',
    'published',
    1,
    NOW(),
    NOW()
),
(
    'c1100000-0000-0000-0000-000000000018',
    'c0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000006',
    'medchem-cyp450-phase1',
    'Faz I Reaksiyonları: CYP450 Oksidasyonu',
    'Faz I CYP450 Oksidasyonları',
    'chem_sar',
    1.00,
    'intermediate',
    'published',
    1,
    NOW(),
    NOW()
),
(
    'c1100000-0000-0000-0000-000000000019',
    'c0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000006',
    'medchem-phase1-reduction-hydrolysis',
    'Faz I Redüksiyon & Hidroliz (Sülfasalazin)',
    'Faz I Redüksiyon & Hidroliz',
    'chem_sar',
    1.00,
    'intermediate',
    'published',
    1,
    NOW(),
    NOW()
),
(
    'c1100000-0000-0000-0000-000000000020',
    'c0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000006',
    'medchem-phase2-paracetamol-napqi',
    'Faz II Konjugasyon & Parasetamol NAPQI Toksisitesi',
    'Faz II Konjugasyon & Toksisite',
    'chem_sar',
    1.00,
    'advanced',
    'published',
    1,
    NOW(),
    NOW()
),
(
    'c1100000-0000-0000-0000-000000000021',
    'c0000000-0000-0000-0000-000000000001',
    'm0000000-0000-0000-0000-000000000006',
    'medchem-prodrug-design',
    'Ön İlaç (Prodrug) Tasarımı (Enalapril -> Enalaprilat)',
    'Ön İlaç (Prodrug) Tasarımı',
    'chem_sar',
    1.00,
    'advanced',
    'published',
    1,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    canonical_name = EXCLUDED.canonical_name,
    title = EXCLUDED.title,
    difficulty = EXCLUDED.difficulty;
