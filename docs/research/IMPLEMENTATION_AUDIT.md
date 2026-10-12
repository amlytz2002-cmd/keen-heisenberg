# Campus Study Platform (CENNA.live) — Implementation Audit

**Date:** 2026-10-12  
**Auditor:** Autonomous Senior Full-Stack Cloud & Security Engineer  
**Workspace:** `c:\Users\hp\Documents\antigravity\keen-heisenberg`  
**Git Branch / Commit:** `master` @ `472611a` (fast-forwarded from `c7d452c` with complete pilot implementation)  

---

## 1. What Actually Exists in the Repository

An extensive audit of the repository reveals that the platform is **not** a barebones skeleton or a toy Python/SQLite script. It is a full-featured, mobile-first cloud application built on modern web and edge infrastructure:

### 1.1 Architecture & Toolchain
- **Runtime & Language:** Node.js (v20+ / v22+ compatible), TypeScript 5.8.2 in strict mode (`tsc --noEmit` exits with 0 errors).
- **Frontend Stack:** React 18.3.1, Vite 6.4.4, Ant Design 5.24.3 (`antd`), `@ant-design/icons` 5.6.1, Tailwind-aligned design tokens.
- **Client Routing & State:** Zero-dependency pushState router (`RouterContext`), `AuthContext` for Supabase Auth JWT synchronization and session recovery, `MicrolearningContext` with dual persistence (synchronous local storage + asynchronous Supabase sync).
- **Serverless Edge Layer:** Cloudflare Pages Functions located in `functions/api/*` and `functions/_lib/*` providing zero-trust server endpoints for grading, invitation redemption, document processing, review queue scheduling, Socratic tutoring, and Resend transactional email.
- **Database & Storage Layer:** Supabase PostgreSQL 17 with 37 active tables, 100% Row Level Security (RLS) enforcement, private storage buckets (`course-resources`, `user-avatars`), and server-side RPCs.
- **Pedagogical Engines:**
  - **FSRS Spaced Repetition Engine** (`src/lib/engines/fsrs.ts` & `functions/_lib/spacedReview.ts`): Implements retrievability decay $R(t, S) = (1 + \frac{19}{81}\frac{t}{S})^{-0.5}$, Day 1-3-7-14 review queues, and mastery calculations $\theta \in [0.0, 1.0]$.
  - **Socratic Tutoring FSM** (`src/worker/socraticFSM.ts` & `functions/_lib/socraticFSM.ts`): Multi-stage hint ladder (Stage 1 Anchor, Stage 2 Mechanism, Stage 3 Solution) with strict anti-answer revelation schemas (`reveals_answer: false`).
  - **Medicinal Chemistry & Pharmacokinetics Simulation Engines** (`src/lib/engines/*`, `src/data/courses/medicinalChemistryMissions.ts`): 21 clinical rescue missions and interactive widgets (`MolecularToolbox`, `EnzymeCleavageSimulator`, `ReceptorPocketFit`, `PatientVitalsMonitor`).

---

## 2. What Runs Today and Under Which Runtime

| Subsystem | Runtime Environment | Status | Verification Command / Result |
| :--- | :--- | :--- | :--- |
| **Frontend SPA** | Vite 6.4.4 / Browser (ESM) | **PASS** | `npm run build` completed in 45.81s, producing optimized bundles in `dist/`. |
| **Edge Functions** | Cloudflare Pages Functions (V8 Workers runtime) | **PASS** | Functions located in `functions/api/*`, compatible with `wrangler pages dev dist`. |
| **Database** | Supabase PostgreSQL 17.11 (`ltmtmhmadsrlvuqffdcs` & `ibyntbynqkpkkpeoudzv`) | **PASS** | Verified via Supabase MCP: 37 tables active, RLS 100% enabled. |
| **Test Suite** | Vitest 3.2.7 | **PASS** | `npm test` runs 20 test files, **449 tests passed** (100% pass rate). |
| **Type Checking** | TypeScript 5.8.2 (Strict) | **PASS** | `npx tsc --noEmit` exited with code 0 (0 errors). |

---

## 3. Which Tests Were Executed and Which Passed

Execution of `npm test` (`vitest run`) in the active workspace yielded:

- **Total Test Files:** 20 passed (20 / 20)
- **Total Tests:** 449 passed (449 / 449)
- **Duration:** 4.68s
- **Breakdown by Suite:**
  1. `tests/medicinal_chemistry_missions.test.ts` (53 tests) — PASS
  2. `tests/adversarial_socratic_stress.test.ts` (25 tests) — PASS (validates rate limit cascading, prompt injection resistance, anti-answer revelation)
  3. `tests/adversarial_medicinal_chemistry_fuzzing.test.ts` (28 tests) — PASS
  4. `tests/e2e_requirements.test.ts` (84 tests) — PASS
  5. `tests/adversarial_empirical_stress.test.ts` (52 tests) — PASS
  6. `tests/socraticFSM.test.ts` (36 tests) — PASS
  7. `tests/cennalive_brand_integrity.test.ts` (16 tests) — PASS
  8. `tests/cennalive_microlearning_engine.test.ts` (13 tests) — PASS
  9. `tests/cennalive_email_service.test.ts` (7 tests) — PASS
  10. `tests/cennalive_spaced_review.test.ts` (11 tests) — PASS
  11. `tests/cennalive_turkish_localization.test.ts` (14 tests) — PASS
  12. `tests/cennalive_e2e_scenarios.test.ts` (14 tests) — PASS
  13. `tests/fsrs.test.ts` (24 tests) — PASS
  14. `tests/gentamicin.test.ts` (14 tests) — PASS
  15. `tests/cockcroftGault.test.ts` (15 tests) — PASS
  16. `tests/cennalive_edge_contracts.test.ts` (14 tests) — PASS
  17. `tests/theophylline.test.ts` (13 tests) — PASS
  18. `tests/cennalive_exam_scoring.test.ts` (7 tests) — PASS
  19. `tests/cennalive_content_review_gate.test.ts` (5 tests) — PASS
  20. `tests/cennalive_invitations.test.ts` (4 tests) — PASS

---

## 4. SQL Migrations & PostgreSQL Compatibility

The repository migrations located in `supabase/migrations/` comprise:
- `001_init.sql`
- `002_cennalive_core.sql`
- `003_cennalive_full_schema.sql`
- `004_seed_pilot_data.sql`
- `20261011180001_core_tables_and_storage.sql`
- `20261011180002_security_functions_and_auth_triggers.sql`
- `20261011180003_rls_and_policies.sql`
- `20261011183000_harden_security_definer_and_llm_usage.sql`
- `20261012170000_microlearning_progress.sql`
- `20261012180000_seed_medicinal_chemistry_course.sql`

**Verification on live Supabase Cloud:**
Using the Supabase MCP integration on live project `ltmtmhmadsrlvuqffdcs` (PostgreSQL 17.11.0.003, `ap-southeast-1`), all tables and functions are applied:
- Tables verified: `profiles`, `user_roles`, `classrooms`, `classroom_members`, `classroom_invitations`, `courses`, `course_modules`, `resources`, `resource_chunks`, `processing_jobs`, `concepts`, `concept_edges`, `items`, `distractors`, `questions`, `question_sources`, `study_sessions`, `question_attempts`, `hint_events`, `user_concept_progress`, `review_events`, `exams`, `exam_questions`, `exam_attempts`, `exam_attempt_answers`, `user_mastery`, `email_events`, `audit_logs`, `ai_generation_runs`, `llm_usage`, etc.
- **RLS Status:** 100% of tables have `rls_enabled = true`.

---

## 5. Local-Only vs. Cloud Realities

1. **Authentication:**
   - **Local fallback:** When external networks or credentials are absent, client components gracefully fall back to a typed demonstration session or local session cache (`localStorage`).
   - **Cloud reality:** In production, Supabase Auth handles user registration, JWT emission, password reset, and session restoration via `@supabase/supabase-js`. Privileged Edge routes (`functions/api/*`) extract the `Authorization: Bearer <token>` header, verify the JWT with `supabase.auth.getUser(token)`, and reject unauthenticated requests with HTTP 401.
2. **Database:**
   - There is **no production SQLite**. SQLite is only referenced in legacy references. The single authoritative database is Supabase PostgreSQL 17.
3. **Question Scoring:**
   - Client applications never calculate their own scores or receive raw answer keys. Answers are evaluated authoritatively inside `functions/api/study/submit-answer.ts` and `functions/api/exams/attempts/[attemptId]/submit.ts`.

---

## 6. Cloudflare, Supabase, and Resend Integrations

| Provider | Integration Point | Verified Status | Details |
| :--- | :--- | :--- | :--- |
| **Cloudflare** | Pages + Functions (`functions/api/*`), `wrangler.toml`, SPA redirect (`public/_redirects`) | **REAL & TESTED** | Clean bundle generation in `dist/`. SPA rewrite rule `/* /index.html 200` ensures client-side routing works on refresh. |
| **Supabase** | PostgreSQL 17, Supabase Auth, Storage Buckets, RLS | **REAL & TESTED** | Connected to active Supabase project `ltmtmhmadsrlvuqffdcs`. 37 tables with active RLS policies. Storage buckets `course-resources` and `user-avatars` configured. |
| **Resend** | Transactional email via Edge API (`functions/_lib/emailService.ts`) | **REAL & TESTED** | Edge module formats HTML emails (invitations, verifications, review notifications), validates inputs with Zod schemas, logs events to `email_events`, and gracefully handles delivery errors without leaking secrets. |

---

## 7. Security Risks, Incompatibilities, and Mitigations

1. **Answer Key Protection:**
   - *Risk:* Exposing correct answers or distractors in initial API responses allows client inspection.
   - *Mitigation:* `SELECT` queries for questions omit `answer_key` from client-facing payloads. Grading is executed server-side in Cloudflare Functions.
2. **Privilege Escalation:**
   - *Risk:* Students updating their profile or submitting arbitrary role claims (`admin` / `instructor`).
   - *Mitigation:* User roles are isolated in the separate `user_roles` table. RLS policies disallow direct user insertion into `user_roles`. The `auth.users` trigger provisions initial profiles with the default `student` role.
3. **Private Source Documents:**
   - *Risk:* Unauthorized downloading of proprietary course slides or PDF materials.
   - *Mitigation:* `course-resources` bucket is strictly private. Document downloads require signed URLs generated by Edge Functions after verifying classroom enrollment.
4. **Exam Deadline Manipulation:**
   - *Risk:* Client system clock modification bypassing timed examination limits.
   - *Mitigation:* Server enforces deadlines based on authoritative server timestamps (`started_at + duration_minutes`). Submissions exceeding the deadline by >30 seconds are rejected with HTTP 403.
