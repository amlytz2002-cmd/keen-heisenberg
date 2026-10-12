# CENNA.live Engineering & Pedagogical Roadmap

## Milestone 1: Pilot Validation & Pharmacokinetics Wedge

### Phase 1: PK & Calculation Engine Proof [Complete]
- **Goal:** Deliver deterministic Cockcroft-Gault, Gentamicin, and Theophylline calculation engines, Socratic diagnostic dialogue FSM, Turkish PK seed items, Supabase schema with RLS, and mobile-first drill workspace for Biruni University 3rd-year cohort.
- **Decision Gate A:**
  - $\ge 60\%$ pilot completion across daily sessions.
  - $\ge 85\%$ human pharmacist alignment on classified error nodes.
  - $0\%$ arithmetic/calculation errors produced by deterministic engine.

### Phase 2: Systemic Polish, Backend Resilience & 100% Turkish Academic Localization [Complete]
- **Goal:** Conduct a comprehensive, uncompromising audit and overhaul of the entire application: eliminate all English, mixed language, and machine-translated copywriting in favor of natural, high-register academic Turkish appropriate for pharmacy and health sciences students; harden backend Cloudflare Pages functions, error states, and Turkish character encodings; eliminate all legacy brand references (legacy prototype -> "CENNA.live"); and polish every student and instructor interaction.
- **Decision Gate B [PASSED]:**
  - 100% of user-facing UI labels, descriptions, empty states, error alerts, and modals in fluent academic Turkish.
  - 0 legacy brand references across code, UI, and edge functions (strictly "CENNA.live").
  - 100% automated test pass rate (348/348 tests across 16 test suites) and 0 TypeScript compilation errors.
  - Seamless edge function error handling with localized user-facing feedback and global Ant Design tr_TR locale.

### Phase 3: Brilliant-Tarzı İnteraktif Medisinal Kimya Mikro-Öğrenme Platformu [Complete]
- **Goal:** Transform CENNA.live into a consumer-grade, Brilliant.org-style interactive micro-learning platform for Medicinal Chemistry based on 26 faculty lecture slides (`Desktop/medisinal`). Decommission instructor portal from primary consumer nav, build visual Skill Tree (`/learn`) and interactive full-screen lesson player (`/learn/lesson/:id`), deliver custom chemical widgets (`MoleculeInspector`, `SarSimulator`, `BondPocketMatcher`, `PhIonizationGauge`), and package Tier 1 (Foundations & SAR: 6 Modules, 21 Micro-Lessons, 100+ interactive cards) with Supabase progress synchronization.
- **Decision Gate C [PASSED]:**
  - 100% of Tier 1 modules (6 modules, 21 micro-lessons, 100+ interactive cards) playable with instant feedback and zero latency.
  - Interactive chemical widgets render seamlessly across desktop and mobile.
  - User progress, stars, and daily streaks persist cleanly in Supabase (`user_lesson_progress`, `user_gamification`).
  - Zero TypeScript errors (`npm run typecheck` passes with 0 errors) and 100% test pass rate (368/368 vitest tests passing across 18 test suites).
  - Production Vite build succeeds cleanly (`dist/` generated).

### Phase 4: Multi-Course Rollout & Licensure Prep (Post-Gate C)
- **Goal:** Tier 2 (Autonomic & CVS) and Tier 3 (Chemotherapeutics) rollout, paid Socratic AI preceptor integration, and multi-university scaling.

