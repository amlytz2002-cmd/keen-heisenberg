# CENNA.live — Repository Audit & Architectural Baseline

**Date:** 2026-10-09  
**Product:** CENNA.live (v1.0 — Pilot Implementation)  
**Lead Engineer / Architect:** Autonomous Full-Stack Engineering Agent  

---

## 1. Executive Summary

This repository initially contained a prototype named "PharmIQ" focused on pharmacokinetic calculations (Cockcroft-Gault, Gentamicin, Theophylline) and clinical preceptor Socratic dialogue experiments. While the underlying mathematical and cognitive science foundations (FSRS spaced repetition algorithms, Socratic finite state machines, Zod schemas, and Vitest test runners) are sound, the interface was an early single-screen mobile prototype with hardcoded mock state, Turkish medical school labels, and legacy COTE assumptions.

Per the master directive:
- **Product Identity:** CENNA.live is the authoritative identity. Legacy COTE tools do not dictate main navigation, branding, or onboarding.
- **Data Persistence:** Supabase is the authoritative persistent data layer. Mock data and hardcoded state buffers are replaced with real PostgreSQL tables, Row Level Security (RLS), and server-side execution.
- **Frontend Architecture:** Preserving the high-performance Vite + React 18 + TypeScript strict mode stack, while establishing full-featured client routing, responsive mobile-first views, and an accessible academic productivity design system.
- **Server Execution:** Cloudflare Pages Functions (`functions/api/*`) provide server-side endpoints for AI generation, grading, invitation redemption, document processing, and Resend transactional email without leaking credentials to client bundles.

---

## 2. Inventory of Existing Codebase Assets

### 2.1 Package & Toolchain
- **React / DOM:** `18.3.1`
- **TypeScript:** `5.8.2` (strict mode verified with 0 errors via `tsc --noEmit`)
- **Vite:** `6.2.0` (production bundling verified in `dist/`, manual chunks for UI components)
- **UI & Icons:** `antd 5.24.3`, `@ant-design/icons 5.6.1`
- **Validation:** `zod 3.24.2`
- **Data Layer:** `@supabase/supabase-js 2.49.1`
- **Test Framework:** `vitest 3.0.7` (263 passing unit and empirical tests)
- **Deployment Target:** Cloudflare Pages + Functions (`wrangler 3.111.0`)

### 2.2 Reusable Pedagogical Engines
- **Spaced Repetition (`src/lib/engines/fsrs.ts`):** Implements retrievability decay $R(t, S) = (1 + \frac{19}{81}\frac{t}{S})^{-0.5}$, hypercorrection triggers ($S=0$, 24h re-test), and continuous mastery tracking $\theta \in [0.0, 1.0]$. Fully tested and directly reusable for CENNA.live's Day 1, 3, 7, 14 review engine.
- **Socratic FSM (`src/worker/socraticFSM.ts` & `functions/_lib/socraticFSM.ts`):** Structured Zod validation for progressive Socratic turns, anti-answer revelation guardrails, and deterministic fallbacks when external LLM gateways are rate-limited or unavailable.
- **Pharmacokinetics / Medical Science Reference Modules (`src/lib/engines/`):** Retained as domain-specific course modules for pharmacy students, accessible under the broader CENNA.live academic catalog.

### 2.3 Existing Supabase Infrastructure
- **Project Ref:** `ibyntbynqkpkkpeoudzv` (PostgreSQL 17.11, region `ap-southeast-2`, Status: `ACTIVE_HEALTHY`).
- **Applied Migrations:**
  - `20261004073448_add_open_step_access_policy`
  - `20261007080257_001_init`
  - `20261008173310_create_tutor_events_table`
- **Existing Tables:** `profiles`, `courses`, `concepts`, `concept_edges`, `items`, `distractors`, `attempts`, `error_events`, `next_time_rules`, `user_mastery`, `review_schedule`, `classrooms`, `classroom_members`, `documents`, `doc_chunks`, `course_concepts`, `generated_questions`, `student_concept_mastery`, `student_question_attempts`, `mocks`, `mock_attempts`, `jobs`.
- **Existing Gaps Identified:**
  - Need dedicated tables and foreign keys matching CENNA.live v1.0 specification: `course_modules`, `classroom_invitations`, `study_sessions`, `hint_events`, `user_concept_progress`, `review_events`, `exams`, `exam_questions`, `exam_attempts`, `exam_attempt_answers`, `email_events`, `audit_logs`, `ai_generation_runs`, `user_roles`.
  - Storage buckets `course-resources` and `user-avatars` need creation with private RLS access policies.
  - Client interface currently contains no real routing or multi-page navigation; needs a full route tree (`/`, `/app/today`, `/app/study/:sessionId`, `/app/teach/*`, `/admin/*`, etc.).

---

## 3. Baseline Verification Results

| Quality Gate | Status | Evidence |
| :--- | :--- | :--- |
| **TypeScript Typecheck** | **PASSED** | `tsc --noEmit` exited 0 with 0 errors. |
| **Vitest Test Suite** | **PASSED** | 8 test files, 263 tests passed (adversarial stress, FSRS, engines, socratic FSM). |
| **Production Build** | **PASSED** | `vite build` completed in 48s, generating `dist/` bundle (342 kB index, 1.09 MB antd chunk). |
| **Disk Space Issue** | **RESOLVED** | Host drive C was at 0 MB free; cleaned stale pnpm cache & orphaned worktree node_modules to restore >215 MB free space. |
| **Supabase Connectivity** | **VERIFIED** | Connected to live Supabase project `ibyntbynqkpkkpeoudzv` via Supabase MCP; verified tables and schema. |

---

## 4. Architectural Risks & Mitigations

1. **Client-Side Secret Leakage Risk:**
   - *Risk:* In prototype code, API keys could be read from browser `VITE_` variables.
   - *Mitigation:* Centralize all AI operations, Resend calls, and privileged database operations into Cloudflare Pages Functions (`functions/api/*`). The browser client only holds the Supabase public anon key.
2. **Untrusted AI Content Risk:**
   - *Risk:* Model hallucinations or prompt injection from uploaded documents creating ungrounded questions.
   - *Mitigation:* Strict multi-stage review pipeline (`draft` -> `needs_review` -> `approved` -> `published`), chunk-level provenance tracing, and schema validation with Zod.
3. **Exam Deadline Client Clock Manipulation:**
   - *Risk:* Student changing system clock to bypass exam time limits.
   - *Mitigation:* Server-side deadline enforcement in database/API. Every answer submission verifies `NOW() <= deadline_at`.
4. **Mobile Navigation Usability:**
   - *Risk:* Dense desktop layouts shrinking on phones.
   - *Mitigation:* Mobile-first responsive shell with bottom touch navigation on mobile and persistent sidebar on desktop.
