# CENNA.live — Campus Pilot Launch Checklist

**Version:** 1.0 (Controlled Pilot Release)  
**Target Audience:** Faculty Leads, System Administrators & DevOps Engineers  
**Pilot Scope:** Biruni University Faculty of Pharmacy — Year 3 Clinical Pharmacokinetics & Medicinal Chemistry Cohort  

---

## Phase 1: Pre-Flight Infrastructure Verification (T-48h)

- [ ] **Cloudflare Production Deployment**:
  - [ ] Production build cleanly generated via `npm run build`.
  - [ ] Verify HTTP 200 on `https://cenna.live` and fallback `https://pharmiq-app.pages.dev`.
  - [ ] Verify SPA deep-link routing by refreshing `/app/today` and `/learn/mission/1` (confirm `public/_redirects` rewrites to `/index.html`).
  - [ ] Check `/api/health` returns `status: "healthy"` and database latency < 150ms.
- [ ] **Supabase PostgreSQL & Storage Verification**:
  - [ ] Connect to project `ltmtmhmadsrlvuqffdcs` and confirm status is `ACTIVE_HEALTHY`.
  - [ ] Verify 100% of 37 tables have `rowsecurity: true` in `pg_tables`.
  - [ ] Confirm `public.user_roles` denies direct client insertion and defaults new accounts to `student`.
  - [ ] Verify `course-resources` (50MB) and `user-avatars` (5MB) buckets are set to `public: false`.
  - [ ] Verify `storage.objects` RLS policies block direct student access and allow instructor uploads.
- [ ] **Secrets & API Integrations**:
  - [ ] Verify Cloudflare production secrets are injected:
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `RESEND_API_KEY`
    - `OPENROUTER_API_KEY`
  - [ ] Confirm no secret keys exist in client JavaScript bundles (`dist/assets/*.js`).
  - [ ] Test transactional email dispatch via `/api/notifications/test-email` (verify delivery to test inbox or `delivered@resend.dev`).

---

## Phase 2: Faculty & Course Material Onboarding (T-24h)

- [ ] **Instructor Access & Verification**:
  - [ ] Authenticate as instructor (`instructor.demo@cenna.live`).
  - [ ] Verify access to the **Instructor Dashboard** (`/app/teach/classrooms` and `/app/teach/resources`).
  - [ ] Verify non-instructors cannot access teaching interfaces (tested by RLS and client route guards).
- [ ] **Curriculum & Source Material Ingestion**:
  - [ ] Upload approved faculty lecture slide deck to `course-resources`.
  - [ ] Trigger server extraction and verify semantic chunk generation in `resource_chunks`.
  - [ ] Run AI concept extraction and question generation (status enters `needs_review`).
- [ ] **Editorial Sign-off**:
  - [ ] Open the **Content Review Workspace** (`/app/teach/content-review`).
  - [ ] Inspect generated question stems, distractor rationales, and source slide references.
  - [ ] Edit and approve questions; transition status to `published`.
  - [ ] Verify students can only query items with `status = 'published'`.

---

## Phase 3: Student Cohort Invitation & Onboarding (T-0)

- [ ] **Classroom Invitation Generation**:
  - [ ] Generate secure invitation link in the Classroom Manager.
  - [ ] Configure expiration date (e.g., 7 days) and seat cap (e.g., 50 students).
  - [ ] Copy raw token URL (`https://cenna.live/invite/:token`).
- [ ] **Student Account Provisioning**:
  - [ ] Distribute invitation URL to the participating student cohort.
  - [ ] Students complete self-registration via Supabase Auth.
  - [ ] Verify database trigger creates initial profile in `public.profiles` and assigns `student` role in `public.user_roles`.
  - [ ] Verify student enrollment row created in `public.classroom_members`.

---

## Phase 4: Active Pilot Study Monitoring (Day 1 - Day 14)

- [ ] **Session & Retrieval Progress**:
  - [ ] Students complete daily recommended study sessions (~25 minutes).
  - [ ] Verify question answer submissions are scored server-side and recorded in `question_attempts`.
  - [ ] Verify FSRS intervals calculate correctly and schedule Day 1, 3, 7, and 14 reviews in `user_concept_progress`.
- [ ] **System Observability & Safety**:
  - [ ] Monitor `/api/health` every 5 minutes.
  - [ ] Check `public.audit_logs` for any administrative action anomalies.
  - [ ] Confirm zero student-facing server crashes or uncaught exceptions in ErrorBoundary.
  - [ ] Verify rate limiting (`X-RateLimit-*`) throttles any automated or abusive request bursts.

---

## Phase 5: Post-Pilot Evaluation & Rollback Plan

- [ ] **Student Feedback Collection**:
  - [ ] Distribute the **Pilot Feedback Survey** (`docs/PILOT_FEEDBACK_SURVEY.md`) at the end of Day 7 and Day 14.
  - [ ] Evaluate explanation clarity, source citation trust, and platform usability metrics.
- [ ] **Rollback Procedures (If Required)**:
  - [ ] **Frontend Rollback:** If a regression occurs, use Cloudflare Pages deployment dashboard to instantly rollback to the previous immutable deployment hash.
  - [ ] **Database Rollback:** Supabase point-in-time recovery (PITR) is enabled on project `ltmtmhmadsrlvuqffdcs`. Schema rollbacks can be executed using reverse migration scripts in `supabase/migrations/`.
