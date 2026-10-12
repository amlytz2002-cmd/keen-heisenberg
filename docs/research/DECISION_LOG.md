# Campus Study Platform (CENNA.live) — Architectural Decision Log

**Date:** 2026-10-12  
**Status:** Approved & Implemented  
**Scope:** Canonical Production Architecture, Security, Persistence, and Deployment  

---

## Decision 1: Canonical Production Architecture — Path B (Cloudflare-Native TypeScript) over Path A (Python Workers)

### Context & Problem Statement
The initial project concept suggested either continuing with a Python 3.11 / Jinja / SQLite architecture or migrating to a modern Cloudflare-native TypeScript application. We evaluated both paths against Cloudflare production constraints.

### Alternatives Considered
1. **Path A (Python Workers):**
   - Cloudflare Python Workers execute via Pyodide inside a WebAssembly sandbox.
   - *Limitations Discovered:*
     - Heavy cold start overhead (>1-2s WASM runtime initialization).
     - Standard library restrictions: no raw sockets, no local thread concurrency, no direct filesystem operations.
     - Third-party dependency friction: many Python PDF parsing libraries (`pypdf`, `pdfplumber`, `fitz`) rely on compiled C extensions that are incompatible or unstable in Pyodide.
     - Supabase Python SDK does not have Edge-native parity with `@supabase/supabase-js`.
2. **Path B (React 18 + TypeScript + Vite + Cloudflare Pages Functions):**
   - Single language stack (TypeScript 5.8) across client and edge server.
   - Sub-50ms edge request execution with zero cold starts.
   - Strong type generation and safety via `types/supabase.ts`.
   - Rich, accessible mobile-first component ecosystem with Ant Design 5.
   - Native integration with Cloudflare Pages Functions (`functions/api/*`).

### Decision & Trade-offs
**Selected Path B.** The production application is 100% TypeScript. There are no divergent production implementations in Python or SQLite. All business logic, calculation engines, FSRS algorithms, and Edge endpoints run on the TypeScript toolchain.

---

## Decision 2: Single Authoritative Database — Supabase PostgreSQL 17

### Context
Ensuring data integrity, multi-device sync, and reliable persistence for students and instructors across mobile and desktop.

### Alternatives Considered
1. **Local SQLite / D1:** Limited PostgreSQL feature set, lack of built-in Supabase Auth integration, and lack of fine-grained PostgreSQL Row Level Security.
2. **Direct TCP PostgreSQL via Hyperdrive:** Introduces unnecessary connection pooling overhead and bypasses Supabase Auth RLS policies that rely on PostgREST JWT claims.
3. **Supabase PostgreSQL 17 via Data API & RLS:** PostgREST automatically unpacks Supabase Auth JWTs into `auth.uid()` and `request.jwt.claims`, enforcing RLS directly in the database engine.

### Decision
Supabase PostgreSQL 17 (`ltmtmhmadsrlvuqffdcs`) is the sole authoritative persistent database. All 37 domain tables are protected by PostgreSQL RLS. Hyperdrive was intentionally rejected because the Supabase Data API over HTTP provides superior security, native JWT decoding, and edge connection multiplexing without infrastructure bloat.

---

## Decision 3: Authorization & Role Segregation Model

### Context
Preventing privilege escalation from students attempting to claim instructor or administrative privileges.

### Alternatives Considered
1. **Storing roles in `auth.users.raw_user_meta_data`:** Vulnerable to tampering because user metadata can be modified during self-registration or profile updates if not strictly guarded.
2. **Hardcoded Role Lookups:** Inflexible for multi-classroom hierarchies.
3. **Dedicated `public.user_roles` Table + Security Definer Triggers:** Roles stored in an independent database table with RLS denying direct user manipulation. Initial accounts default to `student`. Instructors are explicitly provisioned or verified.

### Decision
Implemented dedicated `public.user_roles` table with `public.get_user_role(p_user_id UUID)` helper function. RLS policies and Edge Functions verify permissions against `user_roles`, guaranteeing that students cannot escalate privileges through client requests.

---

## Decision 4: Server-Side Grading & Answer-Key Secrecy

### Context
Maintaining academic integrity in quizzes and mock examinations.

### Alternatives Considered
1. **Client-side evaluation:** Sending correct options in the question payload and evaluating in the browser. Rejected as completely insecure.
2. **Dedicated Serverless Grading Endpoint:** Omitting `answer_key` from client-facing question queries. Evaluating user submissions authoritatively in `functions/api/study/submit-answer.ts` and `functions/api/exams/attempts/[attemptId]/submit.ts`.

### Decision
Implemented zero-trust server evaluation. Question schemas transmitted to students contain only question prompts, choices, and IDs. The server compares user answers against the secure database record, records attempts in `question_attempts`, calculates FSRS mastery updates, and returns explanations only after submission.

---

## Decision 5: Resend Transactional Email via Edge Functions

### Context
Sending student verification emails, course invitations, and spaced review reminders.

### Alternatives Considered
1. **Direct client email calls:** Unacceptable security risk; exposes `RESEND_API_KEY` to the public.
2. **Cloudflare Worker Edge Service:** Centralized in `functions/_lib/emailService.ts`. Securely consumes `env.RESEND_API_KEY`, validates email payloads with Zod, logs every event to `public.email_events` for auditability, and fails gracefully when external keys are unconfigured.

### Decision
Implemented Edge-based Resend dispatch with transactional HTML templates, database logging, and rate-limiting safeguards.

---

## Decision 6: Scientific Learning Priority — Retrieval Practice over Pre-Testing

### Context
Designing the pedagogical core of CENNA.live based on empirical cognitive science.

### Alternatives Considered
1. **Pre-testing focus:** Making students guess answers before viewing lecture materials based on misquoted effect size claims.
2. **Retrieval Practice (Post-Testing) + Spaced Review:** Based on the audited findings of Latimier et al. (2019) ($d = 0.74$ for post-testing vs. $d = 0.35$ for pre-testing), prioritizing post-exposure active retrieval and FSRS spaced repetition schedules.

### Decision
Anchored core learning on post-lecture deliberate retrieval practice, case simulation drills, and FSRS spaced reviews (Days 1, 3, 7, 14, 30), utilizing pre-testing solely for optional diagnostic placement.
