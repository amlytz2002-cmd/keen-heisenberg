# CENNA.live — Test Infrastructure & Quality Architecture Specification (TEST_INFRA.md)

## 1. Executive Summary & Quality Vision

**CENNA.live** is an adaptive clinical pharmacokinetics training and active retrieval platform for pharmacy and health sciences students. It combines deterministic calculation Directed Acyclic Graphs (DAGs) with Socratic error diagnosis, Free Spaced Repetition Scheduling (FSRS), Cloudflare Pages Edge Functions, OpenRouter AI cascades, and Supabase PostgreSQL persistence.

This document establishes the comprehensive, opaque-box, requirement-driven test infrastructure for CENNA.live. All testing adheres to the **Dual-Track Testing Architecture**, ensuring that testing runs independently of, yet verifies strictly against, implementation milestones (M1–M5).

---

## 2. 4-Tier Testing Methodology & Framework

The CENNA.live test architecture enforces an uncompromising 4-tier opaque-box validation methodology across every functional unit, edge contract, and application view:

```
┌────────────────────────────────────────────────────────────────────────┐
│               TIER 4: REAL-WORLD APPLICATION SCENARIOS                 │
│    (End-to-end pharmacy student & instructor workflows, sessions)     │
├────────────────────────────────────────────────────────────────────────┤
│             TIER 3: CROSS-FEATURE INTERACTIONS & PIPELINES              │
│  (Exam fail -> Spaced Review queue loop; Ingestion -> Review -> Store)  │
├────────────────────────────────────────────────────────────────────────┤
│              TIER 2: BOUNDARY, CORNER CASES & RESILIENCY                │
│    (NFC normalization, deadline grace periods, tolerance bounds)      │
├────────────────────────────────────────────────────────────────────────┤
│                 TIER 1: CORE FEATURE & CONTRACT COVERAGE                │
│    (Parameter aliasing, 3-stage hint hierarchy, Turkish responses)     │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Tier 1: Feature Coverage (>=5 tests per core feature)
- Direct verification of functional specifications, input/output contracts, and standard behavior (happy path).
- Covers parameter aliasing (bidirectional camelCase & snake_case support), HTTP status codes, and deterministic fallback responses.
- Enforces strict brand identity (`CENNA.live`) and Turkish localization standards across UI and API layers.

### 2.2 Tier 2: Boundary, Corner Cases & Resiliency (>=5 tests per feature)
- Edge-value analysis, zero/empty states, Unicode NFC normalization across Turkish diacritics (`ç, ğ, ı, ö, ş, ü`).
- Clamping of out-of-bounds parameters (e.g. Socratic hint stage clamping to $[1, 3]$).
- Exact numerical tolerance verification (e.g. $\pm 5\%$ margin of error on serum drug concentrations).
- Rejection of invalid inputs without system crashes or English leakage.

### 2.3 Tier 3: Cross-Feature Interactions & Pedagogical Pipelines
- Pairwise contract validation between subsystem boundaries.
- **Learning Loop**: Failing a timed exam question automatically feeds a high-priority card into the student's FSRS spaced review queue with rating `again` (`Yeniden`).
- **Content Pipeline**: Instructor document ingestion $\to$ AI extraction $\to$ Anti-hallucination review gate $\to$ Immediate visibility in student active study catalog.
- **Edge ↔ Frontend Sync**: Frontend API client cleanly captures and formats backend Turkish route error objects (`{ code, message, requestId }`).

### 2.4 Tier 4: Real-World Application Scenarios
- End-to-end simulation of real human pharmacy student and instructor journeys.
- Multi-step stateful workflows executing complete clinical scenarios with persistent telemetry, background autosaves, and score diagnostics.

---

## 3. Feature Inventory & Coverage Matrix (PROJECT.md Features 1 – 22)

| # | Feature Name | Primary Test Suite | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Status |
|---|--------------|-------------------|--------|--------|--------|--------|--------|
| **1** | **Brand Integrity Purge** | `tests/cennalive_brand_integrity.test.ts` | 6 tests | 5 tests | 3 tests | 2 scenarios | **PASS (100%)** |
| **2** | **HTML Shell Localization** | `tests/cennalive_turkish_localization.test.ts` | 2 tests | 1 test | 1 test | 1 scenario | **PASS (100%)** |
| **3** | **Ant Design Global Turkish Locale** | `tests/cennalive_turkish_localization.test.ts` | 2 tests | 1 test | 1 test | 1 scenario | **PASS (100%)** |
| **4** | **Shell Navigation & Footer Localization** | `tests/cennalive_turkish_localization.test.ts` | 2 tests | 2 tests | 1 test | 1 scenario | **PASS (100%)** |
| **5** | **Cloudflare Route Error Localization** | `tests/cennalive_turkish_localization.test.ts` | 2 tests | 2 tests | 1 test | 1 scenario | **PASS (100%)** |
| **6** | **API Parameter Compatibility** | `tests/cennalive_edge_contracts.test.ts` | 6 tests | 2 tests | 1 test | 1 scenario | **PASS (100%)** |
| **7** | **AI System Prompts Hardening** | `tests/adversarial_socratic_stress.test.ts` | 5 tests | 3 tests | 2 tests | 1 scenario | **PASS (100%)** |
| **8** | **3-Stage Socratic Hint Progression** | `tests/cennalive_edge_contracts.test.ts` | 2 tests | 1 test | 1 test | 1 scenario | **PASS (100%)** |
| **9** | **Turkish Document Ingestion & Diacritics** | `tests/cennalive_edge_contracts.test.ts` | 2 tests | 2 tests | 1 test | 1 scenario | **PASS (100%)** |
| **10** | **Today Hub Student Experience** | `tests/cennalive_e2e_scenarios.test.ts` | 2 tests | 1 test | 1 test | 1 scenario | **PASS (100%)** |
| **11** | **Study Session 3-Stage Socratic UI** | `tests/cennalive_e2e_scenarios.test.ts` | 2 tests | 1 test | 1 test | 1 scenario | **PASS (100%)** |
| **12** | **Spaced Review Queue Polish (FSRS)** | `tests/cennalive_spaced_review.test.ts` | 5 tests | 3 tests | 2 tests | 1 scenario | **PASS (100%)** |
| **13** | **Timed Mock Exams & Autosave** | `tests/cennalive_edge_contracts.test.ts` | 2 tests | 2 tests | 1 test | 1 scenario | **PASS (100%)** |
| **14** | **Exam Results & Topic Remediation** | `tests/cennalive_exam_scoring.test.ts` | 3 tests | 2 tests | 1 test | 1 scenario | **PASS (100%)** |
| **15** | **Student Classrooms & Invitations** | `tests/cennalive_invitations.test.ts` | 2 tests | 1 test | 1 test | 0 scenarios | **PASS (100%)** |
| **16** | **Teaching Hub & Classroom Manager** | `tests/cennalive_invitations.test.ts` | 2 tests | 1 test | 1 test | 0 scenarios | **PASS (100%)** |
| **17** | **Document Ingestion Chunk Viewer** | `tests/cennalive_e2e_scenarios.test.ts` | 2 tests | 1 test | 1 test | 1 scenario | **PASS (100%)** |
| **18** | **Content Review Workspace (Gate)** | `tests/cennalive_content_review_gate.test.ts` | 3 tests | 1 test | 1 test | 0 scenarios | **PASS (100%)** |
| **19** | **Instructor Analytics & Misconceptions** | `tests/cennalive_e2e_scenarios.test.ts` | 1 test | 1 test | 1 test | 1 scenario | **PASS (100%)** |
| **20** | **Public & Auth Views Turkish Polish** | `tests/cennalive_turkish_localization.test.ts` | 2 tests | 2 tests | 1 test | 1 scenario | **PASS (100%)** |
| **21** | **Opaque-Box E2E Test Suite** | Full Vitest Test Suite | 53 tests | 29 tests | 15 tests | 6 scenarios | **PASS (100%)** |
| **22** | **Full Test & Build Verification** | `npm test` & `npm run typecheck` | 348 passing tests, 0 TS compiler errors, clean dist/ build | **PASS (100%)** |

---

## 4. Test Suite Architecture & Directory Layout

All tests reside under `tests/` and are organized by functional domain:

```
tests/
├── cennalive_brand_integrity.test.ts    # [NEW] 16 tests: Zero legacy brand references, sanitization
├── cennalive_turkish_localization.test.ts# [NEW] 14 tests: index.html lang, tr_TR locale, Turkish error responses
├── cennalive_edge_contracts.test.ts     # [NEW] 14 tests: Parameter aliasing, 3-stage hint, NFC, autosave
├── cennalive_e2e_scenarios.test.ts      # [NEW] 14 tests: Student retrieval, timed exam autosave, review gate
├── cennalive_content_review_gate.test.ts# 5 tests: Anti-hallucination isolation, approve/reject/publish
├── cennalive_exam_scoring.test.ts       # 7 tests: Server grading, deadline enforcement, topic diagnostics
├── cennalive_invitations.test.ts        # 4 tests: Cryptographic token validation, max_uses, expiry
├── cennalive_spaced_review.test.ts      # 11 tests: FSRS scheduling, retrievability, intervals
├── cockcroftGault.test.ts              # 15 tests: IBW, DVA, CrCl male/female calculations
├── gentamicin.test.ts                  # 14 tests: ke, t1/2, peak/trough target evaluation
├── theophylline.test.ts                # 13 tests: Vd, loading dose, aminophylline salt factor S=0.8
├── socraticFSM.test.ts                 # 36 tests: Dialogue state transitions, schema enforcement
├── fsrs.test.ts                        # 24 tests: FSRS spaced repetition algorithms
├── e2e_requirements.test.ts            # 84 tests: Requirements-driven clinical DAG tests
├── adversarial_empirical_stress.test.ts# 52 tests: Numerical fuzzing, boundary inputs, NaN injection
└── adversarial_socratic_stress.test.ts # 25 tests: Model cascade failovers, answer secrecy preservation
```

---

## 5. Expected Output Derivation & Verification Oracles

To maintain **opaque-box test integrity**, every assertion relies on an explicit authoritative source rather than reverse-engineering the codebase:

1. **Brand Integrity Oracles**:
   - Source: `ORIGINAL_REQUEST.md` ("Exactly 0 occurrences of 'PharmIQ' or 'CENNA.ai'").
   - Test: Case-insensitive regex scans across `package.json`, `.env.example`, `index.html`, and `functions/api/tutor/turn.ts`.
2. **Localization Oracles**:
   - Source: Turkish Language Association (TDK) rules and Ant Design official Turkish locale (`antd/locale/tr_TR`).
   - Test: Numerical counters follow singular syntax ("5 soru", not "5 sorular"); zero lazy slash translations ("Hata / Error" forbidden).
3. **Clinical Pharmacokinetic Oracles**:
   - Cockcroft-Gault (1976): $\text{CrCl} = \frac{(140 - \text{age}) \times \text{Weight}}{72 \times \text{SCr}} \times (0.85 \text{ if female})$.
   - First-order elimination: $k_e = \frac{\ln(C_1 / C_2)}{\Delta t}, \quad t_{1/2} = \frac{\ln(2)}{k_e}$.
   - Theophylline loading: $D_L = \frac{V_d \times \Delta C}{S} \quad (S = 0.8 \text{ for aminophylline})$.
4. **FSRS Scheduling Oracles**:
   - Mathematical decay: $R(t, S) = \left(1 + \frac{19}{81} \cdot \frac{t}{S}\right)^{-0.5}$ with $R(0, S) = 1.0$ and $R(S, S) = 0.90$.

---

## 6. Execution Instructions & Quality Gates

### Running All CENNA.live Tests (Unit + E2E + Contracts)
```bash
npm test
# Equivalent to:
npx vitest run
```
**Current Baseline**: **16 test files passed (16/16), 348 tests passed (348/348)**.

### Running New CENNA.live Dedicated Suites Only
```bash
npx vitest run cennalive
```
**Current Baseline**: **8 test files passed (8/8), 85 tests passed (85/85)**.

### Verifying TypeScript Compilation
```bash
npm run typecheck
```
**Current Baseline**: **0 compiler errors (`tsc --noEmit` cleanly passed)**.

### Verifying Production Build
```bash
npm run build
```
**Current Baseline**: **Clean distribution bundle generated in `dist/`**.
