-- ============================================================================
-- CENNA.live v1.0 — Seed Data: Auth Users, Classroom, Course & Pedagogical Graph
-- ============================================================================

-- 1. AUTH USERS (password: CennaLive2026!Demo)
INSERT INTO auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES 
(
    'd1a55000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'instructor.demo@cenna.live',
    crypt('CennaLive2026!Demo', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Dr. Farmakoloji Eğitmeni", "role": "instructor", "primary_role": "instructor"}'::jsonb,
    NOW(),
    NOW()
),
(
    '52d2d5a8-7e3c-4564-87cd-8efc08bd4bdf',
    'authenticated',
    'authenticated',
    'pilot.student@biruni.edu.tr',
    crypt('CennaLive2026!Demo', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Biruni Pilot Öğrencisi (Dönem 3)", "role": "student", "faculty": "Biruni Üniversitesi Eczacılık Fakültesi"}'::jsonb,
    NOW(),
    NOW()
),
(
    'f2feff24-8da5-4eb8-bd27-6f61c26b559b',
    'authenticated',
    'authenticated',
    'amlytz2002@gmail.com',
    crypt('CennaLive2026!Demo', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "yahya taha", "role": "student"}'::jsonb,
    NOW(),
    NOW()
),
(
    '9f82d038-dd76-4c89-83d3-a6efee52a30d',
    'authenticated',
    'authenticated',
    '220201930@st.biruni.edu.tr',
    crypt('CennaLive2026!Demo', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "hussein Abadla", "role": "student", "university": "Biruni Üniversitesi"}'::jsonb,
    NOW(),
    NOW()
),
(
    'a80e4917-abd1-487d-937c-d6c434c05200',
    'authenticated',
    'authenticated',
    '240201034@st.biruni.edu.tr',
    crypt('CennaLive2026!Demo', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "erva nisa kılıç", "role": "student", "university": "Biruni Üniversitesi"}'::jsonb,
    NOW(),
    NOW()
),
(
    'f4edf115-918f-4a23-90a1-b1c0b9d78d00',
    'authenticated',
    'authenticated',
    '220201918@st.biruni.edu.tr',
    crypt('CennaLive2026!Demo', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "لجين طه", "role": "student", "university": "Biruni Üniversitesi"}'::jsonb,
    NOW(),
    NOW()
),
(
    '3820a3f7-25f4-4111-8917-a5b8432c76fa',
    'authenticated',
    'authenticated',
    '240201919@st.biruni.com',
    crypt('CennaLive2026!Demo', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "يحيى", "role": "student", "university": "Biruni Üniversitesi"}'::jsonb,
    NOW(),
    NOW()
),
(
    '567ab992-ca63-4ae0-bc90-db80caf35237',
    'authenticated',
    'authenticated',
    '240201928@st.biruni.edu.tr',
    crypt('CennaLive2026!Demo', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "elmas bitar", "role": "student", "university": "Biruni Üniversitesi"}'::jsonb,
    NOW(),
    NOW()
),
(
    'f4a43083-b522-4c0b-81d3-b4f591226c61',
    'authenticated',
    'authenticated',
    '240201919@st.biruni.edu.tr',
    crypt('CennaLive2026!Demo', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "yahya", "role": "student", "university": "Biruni Üniversitesi"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Ensure profiles and roles are created/updated
INSERT INTO public.profiles (
    id, email, display_name, plan, preferred_language, country, university, last_active_at, created_at
) VALUES 
(
    'd1a55000-0000-0000-0000-000000000001',
    'instructor.demo@cenna.live',
    'Dr. Farmakoloji Eğitmeni',
    'premium',
    'tr',
    'TR',
    'Biruni Üniversitesi Eczacılık Fakültesi',
    NOW(),
    NOW()
),
(
    '52d2d5a8-7e3c-4564-87cd-8efc08bd4bdf',
    'pilot.student@biruni.edu.tr',
    'Biruni Pilot Öğrencisi (Dönem 3)',
    'free',
    'tr',
    'TR',
    'Biruni Üniversitesi',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    plan = EXCLUDED.plan,
    university = EXCLUDED.university;

INSERT INTO public.user_roles (user_id, role)
VALUES 
    ('d1a55000-0000-0000-0000-000000000001', 'instructor'),
    ('52d2d5a8-7e3c-4564-87cd-8efc08bd4bdf', 'student')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. CLASSROOMS
INSERT INTO public.classrooms (
    id, title, name, description, course_code, term, join_code, created_by, owner_id, is_active, status, section_code, settings, created_at, updated_at
) VALUES (
    'c1a55000-0000-0000-0000-000000000001',
    'Biruni Üniversitesi Eczacılık Fakültesi — Dönem 3',
    'Biruni Üniversitesi Eczacılık Fakültesi — Dönem 3',
    'Biyofarmasötik ve Klinik Farmakokinetik 2026 Pilot Grubu',
    'ECZ305',
    '2026-Güz',
    'PILOT2026',
    'd1a55000-0000-0000-0000-000000000001',
    'd1a55000-0000-0000-0000-000000000001',
    true,
    'active',
    '01',
    '{"item_cap": 20, "allow_student_reports": true, "target_session_minutes": 25}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. COURSES
INSERT INTO public.courses (
    id, classroom_id, created_by, code, name, title, faculty, term, year, language, is_active, status, created_at, updated_at
) VALUES (
    '472ca0dc-86bd-44df-8e6a-b83b848b0524',
    'c1a55000-0000-0000-0000-000000000001',
    'd1a55000-0000-0000-0000-000000000001',
    'ECZ305',
    'Biyofarmasötik ve Farmakokinetik',
    'Biyofarmasötik ve Farmakokinetik',
    'Biruni Üniversitesi Eczacılık Fakültesi',
    'Güz',
    3,
    'tr',
    true,
    'published',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 4. CLASSROOM MEMBERS
INSERT INTO public.classroom_members (
    id, classroom_id, user_id, role, status, joined_at
) VALUES 
(
    '8993f245-b78d-48b1-9be6-116030c8352c',
    'c1a55000-0000-0000-0000-000000000001',
    'd1a55000-0000-0000-0000-000000000001',
    'instructor',
    'active',
    NOW()
),
(
    '51903c05-aeca-4256-9aae-1efdfaac0f1a',
    'c1a55000-0000-0000-0000-000000000001',
    '52d2d5a8-7e3c-4564-87cd-8efc08bd4bdf',
    'student',
    'active',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 5. CLASSROOM INVITATION (Token: pilot-2026 -> sha256: 45e33ac320194d370f07cf0d5c7f750b2ce48c64b51f811459771f10b3ff9927)
INSERT INTO public.classroom_invitations (
    id, classroom_id, created_by, token_hash, expires_at, max_uses, use_count, revoked_at, created_at
) VALUES (
    '3907bb34-a768-424c-a920-f4fb7663953d',
    'c1a55000-0000-0000-0000-000000000001',
    'd1a55000-0000-0000-0000-000000000001',
    '45e33ac320194d370f07cf0d5c7f750b2ce48c64b51f811459771f10b3ff9927',
    NOW() + INTERVAL '1 year',
    500,
    0,
    null,
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 6. CONCEPTS
INSERT INTO public.concepts (
    id, course_id, slug, canonical_name, title, pillar, syllabus_weight, difficulty, status, version, created_at, updated_at
) VALUES 
(
    '4b3dc2f1-4f0d-4b35-b138-d70b3b656b32',
    '472ca0dc-86bd-44df-8e6a-b83b848b0524',
    'crcl-cockcroft-gault',
    'Kreatinin Klerensi ve Cockcroft-Gault Hesaplaması',
    'Kreatinin Klerensi ve Cockcroft-Gault Hesaplaması',
    'pk_calc',
    1.00,
    'intermediate',
    'published',
    1,
    NOW(),
    NOW()
),
(
    'b208490a-128d-4d68-865a-7d4257dc442f',
    '472ca0dc-86bd-44df-8e6a-b83b848b0524',
    'pk-ke-half-life',
    'Eliminasyon Hız Sabiti (ke) ve Yarı Ömür (t1/2)',
    'Eliminasyon Hız Sabiti (ke) ve Yarı Ömür (t1/2)',
    'pk_calc',
    1.00,
    'intermediate',
    'published',
    1,
    NOW(),
    NOW()
),
(
    '7d0682a6-d704-4b46-9768-b7705b34387a',
    '472ca0dc-86bd-44df-8e6a-b83b848b0524',
    'pk-vd-loading-dose',
    'Dağılım Hacmi (Vd) ve Yükleme Dozu',
    'Dağılım Hacmi (Vd) ve Yükleme Dozu',
    'pk_calc',
    1.00,
    'intermediate',
    'published',
    1,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 7. CONCEPT EDGES
INSERT INTO public.concept_edges (
    id, source_concept_id, target_concept_id, edge_type
) VALUES 
(
    '6ecdeb5c-1a6b-476c-96ff-d19ca06a2a21',
    'b208490a-128d-4d68-865a-7d4257dc442f',
    '7d0682a6-d704-4b46-9768-b7705b34387a',
    'prerequisite'
),
(
    'c80fb83c-19ee-4463-b54d-a7985befc2dc',
    '4b3dc2f1-4f0d-4b35-b138-d70b3b656b32',
    'b208490a-128d-4d68-865a-7d4257dc442f',
    'related'
) ON CONFLICT (id) DO NOTHING;

-- 8. ITEMS & DISTRACTORS
INSERT INTO public.items (
    id, concept_id, stem_tr, item_type, correct_key, tolerance_pct, source_ref, difficulty_tier, origin, review_status, created_at
) VALUES 
(
    'e75ce3de-9b94-4528-aeea-1f0772eca8f5',
    '4b3dc2f1-4f0d-4b35-b138-d70b3b656b32',
    '64 yaşında kadın hasta (Boy: 160 cm, Ağırlık: 85 kg, SCr: 1.4 mg/dL) için Cockcroft-Gault yöntemiyle CrCl hesaplayınız.',
    'numeric',
    '41.93',
    2.00,
    'Biruni Biyofarmasötik Ders Notları, Slayt 14',
    2,
    'authored',
    'approved',
    NOW()
),
(
    '1cc0ddc0-9d2b-405b-9703-0c9d3b7b255a',
    'b208490a-128d-4d68-865a-7d4257dc442f',
    'Tek doz gentamisin sonrası plazma konsantrasyonu 2. saatte 8 mg/L, 6. saatte 2 mg/L ölçülmüştür. Bu hastada eliminasyon yarı ömrü (t1/2) kaç saattir?',
    'numeric',
    '2.00',
    1.00,
    'Biruni Biyofarmasötik Ders Notları, Slayt 22',
    2,
    'authored',
    'approved',
    NOW()
),
(
    '30d32f64-5622-4ca5-b1d9-383c27ca4495',
    '7d0682a6-d704-4b46-9768-b7705b34387a',
    'Dağılım hacmi Vd = 35 L olan bir hastada hedeflenen teofilin kararlı durum tepe konsantrasyonu 15 mg/L''dir. Teofilin anhidr (S = 1.0) için gereken IV yükleme dozu nedir?',
    'numeric',
    '525.00',
    1.00,
    'Biruni Biyofarmasötik Ders Notları, Slayt 31',
    2,
    'authored',
    'approved',
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.distractors (
    id, item_id, option_key, text_tr, misconception_tag
) VALUES 
('9356612d-a813-42b7-99b6-13bcfa0e2674', 'e75ce3de-9b94-4528-aeea-1f0772eca8f5', 'A', '49.33 mL/dk', 'MISSED_FEMALE_FACTOR_0_85'),
('caddfcbc-72a4-4abb-9dae-5285707ab51f', 'e75ce3de-9b94-4528-aeea-1f0772eca8f5', 'B', '54.46 mL/dk', 'USED_TBW_INSTEAD_OF_ADJ_OR_IBW'),
('6501d21f-659d-45cd-acdc-50f3b9a1f2d7', 'e75ce3de-9b94-4528-aeea-1f0772eca8f5', 'C', '33.56 mL/dk', 'USED_IBW_WITHOUT_OBESITY_ADJUSTMENT'),
('ddadf95f-941b-419d-b18d-cdf378feb2fa', '1cc0ddc0-9d2b-405b-9703-0c9d3b7b255a', 'A', '4.00 saat', 'DELTA_T_DIVIDED_BY_RATIO_ERROR'),
('a2bf6779-5aab-4688-a23c-5eba882b5efd', '1cc0ddc0-9d2b-405b-9703-0c9d3b7b255a', 'B', '1.38 saat', 'DIVIDED_BY_LN2_INSTEAD_OF_MULTIPLIED'),
('8b7dd6da-31d1-4e59-908b-0be38380968b', '1cc0ddc0-9d2b-405b-9703-0c9d3b7b255a', 'C', '0.34 saat', 'CONFUSED_KE_WITH_HALF_LIFE'),
('8021156b-4386-4315-baf3-1ee43400387e', '30d32f64-5622-4ca5-b1d9-383c27ca4495', 'A', '656.25 mg', 'ERRONEOUSLY_DIVIDED_BY_AMINOPHYLLINE_SALT_FACTOR'),
('de926dab-6820-4ea9-b55d-19b5cd281b44', '30d32f64-5622-4ca5-b1d9-383c27ca4495', 'B', '2.33 mg', 'INVERTED_VD_EQUATION'),
('a4227443-af1b-4e84-963d-ed72d28aeed2', '30d32f64-5622-4ca5-b1d9-383c27ca4495', 'C', '420.00 mg', 'MISAPPLIED_CLEARANCE_PRODUCT')
ON CONFLICT (id) DO NOTHING;

-- 9. QUESTIONS
INSERT INTO public.questions (
    id, course_id, concept_id, question_type, difficulty, question_text, options, answer_key, explanation, hint_sequence, status, version, created_at, updated_at
) VALUES 
(
    'a1000000-0000-0000-0000-000000000001',
    '472ca0dc-86bd-44df-8e6a-b83b848b0524',
    '4b3dc2f1-4f0d-4b35-b138-d70b3b656b32',
    'single_choice',
    'intermediate',
    '65 yaşında kadın hasta (60 kg, Serum Kreatinin: 1.2 mg/dL). Cockcroft-Gault formülüne göre kreatinin klerensi (CrCl) yaklaşık kaç mL/dakikadır?',
    '[{"key": "A", "text": "44.3 mL/dak"}, {"key": "B", "text": "52.1 mL/dak"}, {"key": "C", "text": "60.5 mL/dak"}, {"key": "D", "text": "35.2 mL/dak"}]'::jsonb,
    '{"correct": "A"}'::jsonb,
    'Doğru cevap A. Erkek formülü: [(140 - 65) * 60] / (72 * 1.2) = 4500 / 86.4 = 52.08 mL/dak. Kadın hasta için 0.85 katsayısı uygulanır: 52.08 * 0.85 = 44.27 mL/dak.',
    '[{"text": "Cockcroft-Gault eşitliği: CrCl = [(140 - Yaş) * Ağırlık(kg)] / (72 * Scr).", "stage": 1}, {"text": "Hasta kadın olduğu için hesaplanan sonucun kadın düzeltme katsayısı ile çarpılması gerekir.", "stage": 2}, {"text": "[(140 - 65) * 60] / (72 * 1.2) sonucunu bulup 0.85 ile çarpınız.", "stage": 3}]'::jsonb,
    'published',
    1,
    NOW(),
    NOW()
),
(
    'a1000000-0000-0000-0000-000000000002',
    '472ca0dc-86bd-44df-8e6a-b83b848b0524',
    'b208490a-128d-4d68-865a-7d4257dc442f',
    'single_choice',
    'easy',
    'Birinci derece kinetiğe uyan bir ilacın eliminasyon yarı ömrü (t1/2) 4 saat ise, eliminasyon hız sabiti (ke) nedir?',
    '[{"key": "A", "text": "0.173 saat^-1"}, {"key": "B", "text": "0.250 saat^-1"}, {"key": "C", "text": "0.693 saat^-1"}, {"key": "D", "text": "0.346 saat^-1"}]'::jsonb,
    '{"correct": "A"}'::jsonb,
    'Doğru cevap A. Birinci derece kinetikte ke = ln(2) / t1/2 = 0.693 / 4 = 0.173 saat^-1.',
    '[{"text": "Yarı ömür ve eliminasyon hız sabiti arasındaki temel logaritmik ilişkiyi hatırlayın.", "stage": 1}, {"text": "ke = ln(2) / t1/2 eşitliğini kullanın. ln(2) yaklaşık 0.693 tür.", "stage": 2}, {"text": "0.693 değerini 4 saate bölün: 0.693 / 4.", "stage": 3}]'::jsonb,
    'published',
    1,
    NOW(),
    NOW()
),
(
    'a1000000-0000-0000-0000-000000000003',
    '472ca0dc-86bd-44df-8e6a-b83b848b0524',
    '7d0682a6-d704-4b46-9768-b7705b34387a',
    'single_choice',
    'intermediate',
    'Hedef plazma konsantrasyonu (Ctarget) 10 mg/L ve Dağılım Hacmi (Vd) 35 L olan bir ilaç için tek doz intravenöz yükleme dozu (Loading Dose) kaç mg olmalıdır?',
    '[{"key": "A", "text": "175 mg"}, {"key": "B", "text": "350 mg"}, {"key": "C", "text": "500 mg"}, {"key": "D", "text": "700 mg"}]'::jsonb,
    '{"correct": "B"}'::jsonb,
    'Doğru cevap B. İntravenöz yükleme dozu formülü: D_L = C_target * Vd = 10 mg/L * 35 L = 350 mg.',
    '[{"text": "Yükleme dozu, hedef konsantrasyonu dağılım hacmi boyunca anında sağlamak üzere verilir.", "stage": 1}, {"text": "D_L = Vd * C_target eşitliğini uygulayın.", "stage": 2}, {"text": "35 L ile 10 mg/L çarpılarak gerekli miligram miktarı bulunur: 35 * 10 = 350 mg.", "stage": 3}]'::jsonb,
    'published',
    1,
    NOW(),
    NOW()
),
(
    'a1000000-0000-0000-0000-000000000004',
    '472ca0dc-86bd-44df-8e6a-b83b848b0524',
    '7d0682a6-d704-4b46-9768-b7705b34387a',
    'single_choice',
    'easy',
    'Sabit hızla intravenöz infüzyon yapılan bir ilacın kararlı durum (steady-state) plazma konsantrasyonunun %90 ına ulaşması için yaklaşık kaç yarı ömür geçmelidir?',
    '[{"key": "A", "text": "1 yarı ömür"}, {"key": "B", "text": "2 yarı ömür"}, {"key": "C", "text": "3.3 yarı ömür"}, {"key": "D", "text": "5 yarı ömür"}]'::jsonb,
    '{"correct": "C"}'::jsonb,
    'Doğru cevap C. 1 t1/2: %50, 2 t1/2: %75, 3.3 t1/2: %90, 4-5 t1/2: %95-97 (klinik kararlı durum).',
    '[{"text": "Kararlı duruma ulaşma süresi yalnızca ilacın eliminasyon yarı ömrüne (t1/2) bağlıdır.", "stage": 1}, {"text": "Her yarı ömürde kalan eksik konsantrasyon yarıya iner (1 - 0.5^n).", "stage": 2}, {"text": "n = 3.3 olduğunda 1 - 0.5^3.3 = %90 kararlı duruma ulaşılır.", "stage": 3}]'::jsonb,
    'published',
    1,
    NOW(),
    NOW()
),
(
    'a1000000-0000-0000-0000-000000000005',
    '472ca0dc-86bd-44df-8e6a-b83b848b0524',
    '4b3dc2f1-4f0d-4b35-b138-d70b3b656b32',
    'single_choice',
    'hard',
    '[TASLAK / AI İNCELEME] Obez hastalarda (BMI > 30 kg/m2) Cockcroft-Gault formülü uygulanırken hangi vücut ağırlığı kullanılmalıdır?',
    '[{"key": "A", "text": "Total (Aktüel) Vücut Ağırlığı"}, {"key": "B", "text": "İdeal Vücut Ağırlığı (IBW) veya Düzeltilmiş Vücut Ağırlığı (ABW)"}, {"key": "C", "text": "Yalnızca Yağsız Vücut Kütlesi (LBM)"}, {"key": "D", "text": "Vücut Ağırlığı dikkate alınmaz"}]'::jsonb,
    '{"correct": "B"}'::jsonb,
    'Obez hastalarda aşırı yağ dokusu kreatinin üretmediği için aktüel ağırlık böbrek fonksiyonunu aşırı yüksek hesaplar. IBW veya %40 düzeltme faktörlü ABW önerilir.',
    '[{"text": "Yağ dokusunun kas dokusu gibi kreatinin üretip üretmediğini düşünün.", "stage": 1}, {"text": "Aktüel ağırlık kullanmak GFR değerini yapay olarak yükseltir mi?", "stage": 2}, {"text": "ABW = IBW + 0.4 * (TBW - IBW) formülü kullanılır.", "stage": 3}]'::jsonb,
    'needs_review',
    1,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 10. EXAMS & EXAM QUESTIONS
INSERT INTO public.exams (
    id, course_id, classroom_id, title, description, duration_seconds, max_attempts, status, scoring_config, created_at, updated_at
) VALUES (
    'e1a50000-0000-0000-0000-000000000001',
    '472ca0dc-86bd-44df-8e6a-b83b848b0524',
    'c1a55000-0000-0000-0000-000000000001',
    'Klinik Farmakokinetik Ara Sınav Simülasyonu (2026)',
    'Cockcroft-Gault, eliminasyon kinetiği ve dağılım hacmi hesaplamalarını içeren resmi süre kısıtlı deneme sınavı.',
    1800,
    3,
    'published',
    '{"topic_weights": {"Elimination": 0.5, "Cockcroft-Gault": 0.5}, "passing_score_pct": 70}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exam_questions (
    id, exam_id, question_id, position, points
) VALUES 
('9a23df94-9720-4e86-9d55-96d0105bd465', 'e1a50000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 1, 25),
('bed83d49-85af-4bc3-9600-2fc3ab7d9d1f', 'e1a50000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 2, 25),
('cddc949b-0e11-4839-895c-8eb2a6af1b8b', 'e1a50000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 3, 25),
('d2d560a1-0ed0-4240-b92e-27dd867a8872', 'e1a50000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 4, 25)
ON CONFLICT (id) DO NOTHING;
