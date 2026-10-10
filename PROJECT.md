# Project: CENNA.live

## Architecture
CENNA.live is an active retrieval and deliberate practice platform for pharmacy and health sciences students.
- **Frontend**: Vite + React 18 + TypeScript + Ant Design v5 + Tailwind CSS.
- **Backend & Edge**: Cloudflare Pages Functions (`functions/api/`), OpenRouter AI client with deterministic curriculum fallbacks (`functions/_lib/aiService.ts`), and Supabase PostgreSQL with RLS.
- **State & Communication**: Frontend client (`src/lib/api.ts`) communicates with Cloudflare Pages Functions; UI localized globally via Ant Design `tr_TR` ConfigProvider.
- **Testing**: Vitest v3 with 290+ existing baseline tests for pharmacokinetic engines, Socratic FSM, and FSRS spaced repetition.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Brand Integrity Purge | Purge all occurrences of "PharmIQ" and "CENNA.ai" across package.json, wrangler.toml, env, source code, headers, and tests | M1 | survey, R3, criteria |
| 2 | HTML Shell Localization | Set lang="tr", Turkish title, and meta description in index.html | M1 | survey, R2, criteria |
| 3 | Ant Design Global Turkish Locale | Configure ConfigProvider with trTR locale in App.tsx | M1 | survey, R2, criteria |
| 4 | Shell Navigation & Footer Localization | 100% natural academic Turkish for Navbar, Footer, and ErrorBoundary | M1 | survey, R2, criteria |
| 5 | Cloudflare Route Error Localization | Standardize all 21 route handlers in functions/api/ to return academic Turkish error messages | M2 | survey, R2, R3, criteria |
| 6 | API Parameter Compatibility | Bidirectional aliasing for snake_case and camelCase parameters across all route handlers, plus POST handler on profile.ts | M2 | survey, R3 |
| 7 | AI System Prompts Hardening | Turkish-first system prompts and academic deterministic fallbacks in functions/_lib/aiService.ts | M2 | survey, R3, criteria |
| 8 | 3-Stage Socratic Hint Progression Backend | Ensure 3-stage hint progression (Stage 1, 2, 3) in functions/api/study/hint.ts with Turkish pedagogical text | M2 | survey, R3, criteria |
| 9 | Turkish Document Ingestion & Diacritics | Add Unicode NFC normalization, Turkish text processing, Turkish section titles, and Turkish diacritic slug transliteration | M2 | survey, R3, criteria |
| 10 | Today Hub Student Experience | Localize and polish daily goals, streaks, review counters, and quick study start | M3 | survey, R4, criteria |
| 11 | Study Session 3-Stage Socratic UI | 3-stage Socratic hint progression modal, input fields, feedback alerts, and session completion summary screen | M3 | survey, R4, criteria |
| 12 | Spaced Review Queue Polish | Localize FSRS interval ratings (Yeniden, Zor, İyi, Kolay), card details, and empty states | M3 | survey, R4, criteria |
| 13 | Timed Mock Exams & Autosave | Question palette, server countdown display, autosave status indicator, and resilient submit error handling | M3 | survey, R4, criteria |
| 14 | Exam Results & Topic Remediation | Localize diagnostics table, topic mastery breakdown, and targeted remediation links | M3 | survey, R4, criteria |
| 15 | Student Classrooms & Courses | Localize classroom enrollment, invitation redemption, and course details | M3 | survey, R4, criteria |
| 16 | Teaching Hub & Classroom Manager | Instructor dashboard, classroom roster management, invitation link generation with limits | M4 | survey, R4, criteria |
| 17 | Document Ingestion Chunk Viewer | Upload documents, view extracted chunks with section headers and token counts | M4 | survey, R4, criteria |
| 18 | Content Review Workspace | Anti-hallucination review gate, tab filters, concept/question approve & reject with reason, toast formatting fix | M4 | survey, R4, criteria |
| 19 | Instructor Analytics & Course Manager | Class misconceptions diagnostics, course curriculum builder, and clean empty states | M4 | survey, R4, criteria |
| 20 | Public & Auth Views Turkish Polish | Landing, Features, How It Works, Legal, and Auth views with Turkish Ant Design form validation messages | M4 | survey, R2, criteria |
| 21 | Opaque-Box E2E Test Suite | Requirements-driven E2E test suite covering Tiers 1-4 with TEST_READY.md | E2E | R1-R4, criteria |
| 22 | Full Test & Build Verification | Pass 100% of tests (npm test >= 290 baseline + new tests), 0 type errors (npm run typecheck), clean production build (npm run build) | M5 | criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Design and implement opaque-box E2E test suite (Tiers 1-4) covering all acceptance criteria, publish TEST_READY.md | none | PLANNED |
| M1 | Brand Integrity & HTML/Root Shell | Purge legacy brand names ("PharmIQ"), configure index.html (lang="tr", title, meta), configure App.tsx (locale={trTR}), localize Navbar, Footer, ErrorBoundary | none | PLANNED |
| M2 | Backend Edge Functions & AI Engine Hardening | Localize all 21 functions/api/ route errors, implement parameter aliasing, harden aiService.ts prompts to Turkish, harden 3-stage hint endpoint, add NFC normalization & Turkish diacritics support to document processing | none | PLANNED |
| M3 | Student Workspace Polish & Turkish Localization | Localize and polish TodayView, StudySessionView (3-stage Socratic hint UI + completion summary), ReviewQueueView, ExamsListView, ExamTakeView (countdown + autosave), ExamResultsView, ClassroomsView, CourseDetailView, ProgressView | M1, M2 | PLANNED |
| M4 | Instructor & Public Workspaces Polish | Localize and polish TeachDashboardView, ClassroomManagerView, CourseManagerView, ResourceManagerView (chunk viewer), ContentReviewWorkspace (review gate + toast fix), InstructorAnalyticsView, LandingView, FeaturesView, HowItWorksView, AuthView, LegalView | M1, M2 | PLANNED |
| M5 | Final Verification & E2E Test Pass | Pass 100% E2E test suite (Tiers 1-4), verify 0 typecheck errors, clean build in dist/, execute Tier 5 adversarial coverage hardening | M1, M2, M3, M4, E2E | PLANNED |

## Interface Contracts

### Frontend Client ↔ Backend Cloudflare Edge Functions
- **Error Response Protocol**:
  All `functions/api/` error responses return JSON `{ error: string, message: string }` with HTTP status 4xx/5xx, where `message` is natural academic Turkish.
- **Parameter Aliasing Protocol**:
  Backend endpoints MUST accept both snake_case and camelCase parameters:
  - `classrooms/[id]/invitations`: `expires_in_days` / `expiresInDays`, `max_uses` / `maxUses`
  - `resources/index`: `file_path` / `storagePath`
  - `resources/[id]/process`: `text_override` / `sampleContent`
  - `ai/generate`: `resource_id` / `resourceId`, `course_id` / `courseId`, `mode` / `taskType`
  - `teach/content-review`: `item_type` / `contentType`, `item_id` / `contentId`
  - `study/submit-answer`: `session_id` / `studySessionId`, `question_id` / `questionId`, `user_answer` / `answer`, `hints_used_count` / `hintsUsed`
  - `study/hint`: `session_id` / `attemptId`, `question_id` / `questionId`, `hint_stage` / `hintIndex`
  - `exams/index`: `duration_minutes` / `durationSeconds`, `course_id` / `courseId`
  - `exams/attempts/[attemptId]/answers`: accepts both single `{ questionId, answer }` AND batch `{ answers: [{ question_id, answer_payload }] }`
  - `auth/profile`: supports both `onRequestPut` AND `onRequestPost`

### Socratic Hint 3-Stage Progression Contract
- Stage 1 (`hintIndex = 0` or `hint_stage = 1`):
  - Label: `1. Kademe: Yönlendirme ve Temel İlke` (Conceptual Anchor)
- Stage 2 (`hintIndex = 1` or `hint_stage = 2`):
  - Label: `2. Kademe: Akıl Yürütme ve Mantıksal İlişki` (Mechanism & Relationship)
- Stage 3 (`hintIndex = 2` or `hint_stage = 3`):
  - Label: `3. Kademe: Uygulama ve Çözüm Adımı` (Synthesis & Solution Guidance)

### Document Ingestion & Text Processing Contract
- Text extraction and chunking must apply Unicode NFC normalization (`text.normalize('NFC')`).
- Fallback simulation text must be high-yield academic Turkish pharmaceutical guidelines.
- Section titles default to Turkish: `Giriş ve Genel Bakış`, `Bölüm 1 - Temel İlkeler`, etc.
- Slug generation transliterates Turkish diacritics: `ç->c, ğ->g, ı->i, ö->o, ş->s, ü->u`.

## Code Layout
- `src/`: Frontend React application
  - `src/views/student/`: Student workspace views (Today, StudySession, ReviewQueue, Exams, Classrooms, etc.)
  - `src/views/instructor/`: Instructor workspace views (Teach, ClassroomManager, ContentReview, Resources, Analytics)
  - `src/views/public/`: Public and marketing views (Landing, Features, HowItWorks, Legal, Auth)
  - `src/components/layout/`: Navbar, Footer, Sidebar
  - `src/components/common/`: ErrorBoundary, Modals, Shared Cards
  - `src/lib/`: API client (`api.ts`), Supabase client (`supabaseClient.ts`), utilities
- `functions/`: Cloudflare Pages Edge Functions
  - `functions/api/`: Route handlers (auth, study, exams, classrooms, resources, reviews, teach, ai, tutor)
  - `functions/_lib/`: Shared edge services (aiService, spacedReview, supabaseAdmin)
- `tests/`: Vitest test suites
- `dist/`: Production build output
