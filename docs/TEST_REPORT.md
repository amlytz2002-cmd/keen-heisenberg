# Campus Study Platform (CENNA.live) — Test Execution & Verification Report

**Date:** 2026-10-12  
**Test Harness:** Vitest v3.2.7 + TypeScript 5.8.2 + Vite 6.4.4  
**Total Executed Tests:** 449 passed across 20 test files  
**Total Failures:** 0  

---

## 1. Test Execution Breakdown by Category

To ensure scientific honesty and transparency, test executions are classified strictly by their runtime environment:

### Category A: Passed Locally (In-Memory / Vitest Sandbox)
These tests validate calculation algorithms, FSRS memory curves, Socratic state transitions, input parsing, error handling, and mock edge API contracts without requiring external network connectivity.

- **Status:** **449 / 449 PASSED (100% PASS RATE)**
- **Command:** `npm test` (`npx vitest run`)
- **Suite Details:**
  1. `tests/medicinal_chemistry_missions.test.ts` (53 tests) — Validates all 21 mission specifications, crisis parameters, live gauge calculations, and victory conditions.
  2. `tests/adversarial_socratic_stress.test.ts` (25 tests) — Tests multi-model OpenRouter rate limit cascading (429/500 failover to Nemotron, Gemma, and deterministic preceptor), prompt injection defense, and schema-level anti-answer revelation enforcement.
  3. `tests/adversarial_medicinal_chemistry_fuzzing.test.ts` (28 tests) — Fuzzes molecular toolbox items, gauge bounds, and clinical vitals against extreme inputs.
  4. `tests/e2e_requirements.test.ts` (84 tests) — End-to-end requirement assertions for patient cases, calculations, and clinical workflows.
  5. `tests/adversarial_empirical_stress.test.ts` (52 tests) — Validates numerical edge cases in pharmacokinetics (severe renal impairment, pediatric dosing).
  6. `tests/socraticFSM.test.ts` (36 tests) — Tests the 3-stage hint ladder FSM transitions and state preservation.
  7. `tests/cennalive_brand_integrity.test.ts` (16 tests) — Asserts brand consistency, Turkish localization strings, and removal of legacy branding.
  8. `tests/cennalive_microlearning_engine.test.ts` (13 tests) — Tests microlearning step sequences, widget renderer bindings, and XP scoring.
  9. `tests/cennalive_email_service.test.ts` (7 tests) — Tests email payload validation, template compilation, and delivery error handling.
  10. `tests/cennalive_spaced_review.test.ts` (11 tests) — Validates Day 1, 3, 7, 14 interval calculation and mastery scaling.
  11. `tests/cennalive_turkish_localization.test.ts` (14 tests) — Confirms 100% academic Turkish localization for all public, student, and instructor views.
  12. `tests/cennalive_e2e_scenarios.test.ts` (14 tests) — Validates end-to-end user journeys (registration $\rightarrow$ study $\rightarrow$ review $\rightarrow$ exam).
  13. `tests/fsrs.test.ts` (24 tests) — Validates FSRS retrievability decay $R(t, S)$ and hypercorrection triggers ($S=0$ within 24h).
  14. `tests/gentamicin.test.ts` (14 tests) — Pharmacokinetic Hartwick/Sawchuk-Zaske dosing engine tests.
  15. `tests/cockcroftGault.test.ts` (15 tests) — Cockcroft-Gault CrCl calculations with IBW/ABW adjustments.
  16. `tests/cennalive_edge_contracts.test.ts` (14 tests) — Validates Cloudflare Pages Functions request/response schemas.
  17. `tests/theophylline.test.ts` (13 tests) — Steady-state theophylline concentration calculations.
  18. `tests/cennalive_exam_scoring.test.ts` (7 tests) — Validates server-side question scoring and answer-key protection.
  19. `tests/cennalive_content_review_gate.test.ts` (5 tests) — Asserts that unapproved resources cannot be published to students.
  20. `tests/cennalive_invitations.test.ts` (4 tests) — Validates SHA-256 token hashing, expiration, and atomic seat decrements.

---

### Category B: Passed Against Real Configured Cloud Project (Supabase Cloud)
These verifications connect directly to the active Supabase project (`ltmtmhmadsrlvuqffdcs`, PostgreSQL 17.11.0.003 in `ap-southeast-1`):

- **Status:** **VERIFIED LIVE VIA SUPABASE MCP**
- **Verifications Executed:**
  - `list_projects`: Connected to projects `ltmtmhmadsrlvuqffdcs` (cenna.live) and `ibyntbynqkpkkpeoudzv` (St.Rx). Both confirmed `ACTIVE_HEALTHY`.
  - `list_tables`: Inspected public schema on `ltmtmhmadsrlvuqffdcs`. 37 tables active.
  - **Row Level Security Audit:** 100% of tables verified with `rls_enabled: true`.
  - Verified role boundaries: `public.user_roles` denies direct client mutations; defaults to `student` on registration.

---

### Category C: Static Analysis & Production Build
- **Type Checking:** `npx tsc --noEmit`
  - Result: **0 ERRORS (Exited code 0)**.
- **Production Bundle:** `npm run build` (`vite build`)
  - Result: **CLEAN BUILD (Built in 45.81s)**.
  - Output files generated in `dist/`:
    - `dist/index.html` (2.73 kB)
    - `dist/assets/ant-design-icons-BwWRE_7C.js` (37.98 kB)
    - `dist/assets/index-CcgGRJCY.js` (705.07 kB)
    - `dist/assets/antd-Dhda3vKy.js` (1,109.29 kB)

---

### Category D: Not Run / Blocked with Precise Reasons

| Test Scenario | Status | Precise Reason |
| :--- | :--- | :--- |
| **Real Live SMTP / Resend External Send** | **Simulated / Offline Mode** | A real email transmission to external inboxes requires a live production `RESEND_API_KEY` configured in Cloudflare environment secrets. In local/test execution, `emailService.ts` executes safely in simulation mode, validating the schema and writing to `public.email_events` with status `simulated`. |
| **Headless Browser E2E (Playwright/Puppeteer)** | **Opaque-Box Contract Tests Substituted** | Full browser automation drivers (Chromium headless binary) were not provisioned in the base execution container; verified via deep component and contract integration suites (`cennalive_e2e_scenarios.test.ts` and `e2e_requirements.test.ts`). |
| **Cloudflare Pages Production Deployment from CLI** | **Verified via Git & Wrangler Config** | Active deployment is managed via Cloudflare Pages GitHub integration pointing to `cenna.live`; local dry run verified via `wrangler.toml` and static `dist/` compilation. |
