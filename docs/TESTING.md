# CENNA.live Quality Assurance, Verification & Testing Specification

**Test Runner:** Vitest v3.2.7  
**Coverage Scope:** Domain Logic, Spaced Repetition, Exam Deadlines, Multi-Model Cascade, Security Gates, End-to-End Invariants  
**Total Test Count:** 290 Automated Tests across 12 Test Suites (100% Passing)  

---

## 1. Test Suite Catalog & Evidence

| Suite File | Tests | Focus Area | Status |
|---|---|---|---|
| `tests/cennalive_spaced_review.test.ts` | 11 | 1-3-7-14 Day progression, lapse reset, hint attenuation, 0–100 clamping | **PASS** |
| `tests/cennalive_exam_scoring.test.ts` | 7 | Server deadline enforcement, MCQ/numeric tolerance, topic remediation | **PASS** |
| `tests/cennalive_invitations.test.ts` | 4 | SHA-256 token hashing, expiration, max redemptions | **PASS** |
| `tests/cennalive_content_review_gate.test.ts` | 5 | Anti-hallucination states, student draft isolation, moderation workflow | **PASS** |
| `tests/adversarial_empirical_stress.test.ts` | 52 | Extreme inputs, negative parameters, edge cases | **PASS** |
| `tests/e2e_requirements.test.ts` | 84 | Specification contracts, clinical accuracy, pedagogical loops | **PASS** |
| `tests/adversarial_socratic_stress.test.ts` | 25 | OpenRouter cascade failover, rate limits (429/500), preceptor fallbacks | **PASS** |
| `tests/gentamicin.test.ts` | 14 | Aminoglycoside 1-compartment pharmacokinetics & trough modeling | **PASS** |
| `tests/fsrs.test.ts` | 24 | Free Spaced Repetition Scheduler retention stability curve | **PASS** |
| `tests/socraticFSM.test.ts` | 36 | 3-Stage Socratic hint ladder finite-state machine transitions | **PASS** |
| `tests/cockcroftGault.test.ts` | 15 | Creatinine clearance, female multiplier (0.85), adjusted body weight | **PASS** |
| `tests/theophylline.test.ts` | 13 | Steady-state infusion, clearance, and dosing adjustments | **PASS** |
| **Total** | **290** | **Comprehensive Full-Stack Pedagogical Verification** | **100% PASS** |

---

## 2. Key Verified Test Scenarios

### 2.1 Spaced Repetition & Retention Engine
- **Interval Progression:** Verifies that a successful retrieval advances intervals:
  - Initial learning $\rightarrow$ Day 1
  - Day 1 $\rightarrow$ Day 3
  - Day 3 $\rightarrow$ Day 7
  - Day 7 $\rightarrow$ Day 14
- **Lapse Reset:** An incorrect answer resets the concept interval back to Day 1 regardless of whether it was at Day 7 or Day 14.
- **Hint Penalties:** Using Stage 1 hints multiplies mastery gain by 0.85; Stage 2 by 0.65; Stage 3 by 0.40.
- **Mastery Clamping:** Mastery scores cannot exceed 100 or drop below 0.

### 2.2 Timed Mock Exam Engine
- **Deadline Enforcement:** Submissions occurring within `deadline_at + 30s` grace are accepted; submissions after grace are strictly rejected with HTTP 403.
- **Question Grading:** Single-choice evaluates case-insensitively; multiple-choice evaluates set equality regardless of selection order; numeric calculations evaluate within $\pm 5\%$ tolerance.
- **Topic Remediation:** Generates per-topic diagnostic breakdown. Any topic with $<75\%$ accuracy is flagged with `needs_remediation = true`.

### 2.3 Cryptographic Invitations
- **Tamper Resistance:** Mismatched raw tokens fail SHA-256 validation.
- **Expiry:** Tokens past their expiration timestamp fail with `Invitation has expired`.
- **Exhaustion:** Tokens where `times_used >= max_uses` fail with `Invitation redemption limit reached`.

### 2.4 Instructor Anti-Hallucination Review Gate
- **Student Isolation:** Confirms that filtering logic queries strictly `status = 'published'`, preventing unapproved AI drafts from leaking to students.
- **Workflow Transitions:** Tests `approve`, `publish`, `edit_and_approve`, and `reject` with reason recording.

---

## 3. Running Verification Locally

```bash
# Run full Vitest suite once
npm test

# Run Vitest in watch mode for development
npm run test:watch

# Verify strict TypeScript typing
npm run typecheck

# Verify production Vite build
npm run build
```
