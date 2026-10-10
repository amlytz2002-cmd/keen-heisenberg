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

### Phase 3: Course Companion & Syllabus Ingestion (Weeks 4–7)
- **Goal:** Automated slide/PDF ingestion, "Professor Pearl" extraction, expanded multi-compartment PK, and exam-sprint timed mocks.
- **Decision Gate C:**
  - $\ge 40\%$ 4-week active retention.
  - $< 2\%$ flagged question rate from QA pipeline.

### Phase 4: Multi-Course Rollout & Licensure Prep (Post-Gate C)
- **Goal:** Multi-compartment ODE solvers, full patient case simulator, multi-university scaling, and commercial payment gateways.
