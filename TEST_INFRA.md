# PharmIQ Pedagogical Engine — Test Infrastructure Specification (TEST_INFRA.md)

## 1. Executive Summary & Mission
PharmIQ is an adaptive clinical pharmacokinetics training engine for pharmacy students that combines deterministic calculation Directed Acyclic Graphs (DAGs) with Socratic error-diagnosis and Free Spaced Repetition Scheduler (FSRS) algorithms, backed by OpenRouter free LLM cascades and Supabase persistence.

This document defines the complete end-to-end (E2E) test infrastructure for PharmIQ. All testing follows an **opaque-box, requirement-driven architecture** derived strictly from `ORIGINAL_REQUEST.md`, `PROJECT.md`, and authoritative pharmacokinetics clinical literature.

---

## 2. Test Philosophy & Methodological Principles

### 2.1 Opaque-Box & Requirement-Driven Derivation
Every test case in the PharmIQ suite is derived directly from requirements without coupling to internal private state. Expected outputs are calculated using verified clinical pharmacokinetic laws and documented mathematical oracles:
1. **Cockcroft-Gault (1976)**:
   $$\text{IBW}_{\text{male}} = 50.0 + 2.3 \times \max(0, (\text{height}_{\text{in}} - 60))$$
   $$\text{IBW}_{\text{female}} = 45.5 + 2.3 \times \max(0, (\text{height}_{\text{in}} - 60))$$
   $$\text{DVA} = \text{IBW} + 0.40 \times (\text{TBW} - \text{IBW}) \quad \text{for } \text{TBW} > 1.20 \times \text{IBW}$$
   $$\text{CrCl}_{\text{raw}} = \frac{(140 - \text{age}) \times \text{Weight}_{\text{selected}}}{72 \times \text{SCr}_{\text{mg/dL}}} = \frac{(140 - \text{age}) \times \text{Weight}_{\text{selected}}}{0.814 \times \text{SCr}_{\mu\text{mol/L}}}$$
   $$\text{CrCl}_{\text{final}} = \text{CrCl}_{\text{raw}} \times (0.85 \text{ if female else } 1.00)$$
2. **First-Order Gentamicin Elimination**:
   $$\Delta t = t_2 - t_1$$
   $$k_e = \frac{\ln(C_1 / C_2)}{\Delta t}$$
   $$t_{1/2} = \frac{\ln(2)}{k_e} \approx \frac{0.69314718}{k_e}$$
3. **Theophylline Loading Dose & Salt Equivalence**:
   $$\Delta C = C_{\text{target}} - C_0$$
   $$\text{TargetMass} = V_d \times \Delta C$$
   $$D_L = \frac{\text{TargetMass}}{S} = \frac{V_d \times (C_{\text{target}} - C_0)}{S} \quad (S=1.0 \text{ anhydrous, } S=0.8 \text{ aminophylline})$$
4. **FSRS Retrievability & Decay**:
   $$R(t, S) = \left(1 + \frac{19}{81} \cdot \frac{t}{S}\right)^{-0.5}$$
   - Exact mathematical property: $R(0, S) = 1.0000$ and $R(S, S) = 0.9000$.

### 2.2 Progressive Testability & In-Flight Module Resolution
During phased milestones (M1–M4), engines and views are created concurrently. The test suite is designed with progressive testability:
- Standard contract definitions (from `src/lib/engines/types.ts` and `PROJECT.md`) act as immutable interface contracts.
- As implementations land, the E2E test runner automatically evaluates the live exported modules against the contract specifications.
- Tests verify contracts, mathematical behavior, edge-case rejection, and end-to-end dataflow without breaking when modules land incrementally.

### 2.3 Test Integrity & Anti-Facade Guarantees
- No facade tests: Every test computes and asserts precise numerical tolerances (e.g. within $0.01$ or $1.0\%$) and asserts error codes / misconception tags.
- Float arithmetic drift is handled via explicit rounding or delta assertions (`toBeCloseTo` or relative error $\le 0.01$).
- Negative and malicious inputs must trigger explicit domain errors or misconception tags.

---

## 3. Feature Inventory & Coverage Mapping (F1 – F13)

| Feature ID | Feature Name | Tier 1: Core Behavior | Tier 2: Boundary & Corner Cases | Tier 3: Cross-Feature Interactions |
|---|---|---|---|---|
| **F1** | Cockcroft-Gault Engine Hardening | Male/Female IBW, Normal/Obese/Underweight weight selection, CrCl final output, female 0.85 factor. | Extreme weights (30 kg to 350 kg), elderly SCr floor (0.8/1.0 mg/dL), SCr $\mu\text{mol/L} \leftrightarrow \text{mg/dL}$ conversion, age 18 vs 105. | Weight selection failure $\to$ misconception tag $\to$ downstream CrCl recalculation tolerance. |
| **F2** | Gentamicin Elimination Engine | $\Delta t = t_2 - t_1$, $k_e = \ln(C_1/C_2)/\Delta t$, $t_{1/2} = \ln(2)/k_e$, tolerance checking. | Inverted times ($t_1 \ge t_2$), negative concentrations, non-decaying levels ($C_1 \le C_2$), zero concentrations. | Elimination rate failure $\to$ `CONFUSED_KE_WITH_HALF_LIFE` $\to$ Socratic remediation prompt. |
| **F3** | Theophylline Loading Dose Engine | Target mass $V_d \times \Delta C$, salt factor ($S=1.0$ anhydrous vs $S=0.8$ aminophylline), $D_L$ calculation. | Zero/negative $V_d$, baseline $C_0 \ge C_{\text{target}}$, extreme $V_d$, missing weight when $V_d$ is L/kg. | Salt factor misconception $\to$ `ERRONEOUSLY_DIVIDED_BY_AMINOPHYLLINE_SALT_FACTOR` $\to$ Error Clinic audit. |
| **F4** | Engine Shared Types & Framework | `BaseEvaluationNode`, `EngineResult`, `DrugEngineId`, `EngineValidationError` error codes. | Unknown node IDs, malformed payload handling, validation error inheritance. | Uniform error structure consumed by scratchpad UI and Socratic preceptor. |
| **F5** | Socratic Dialogue FSM & Turn Budget | `SocraticTurnSchema` compliance, 3-sentence constraints, state transitions (`PREDICT` $\to$ `PROBE` $\to$ `PATCH` $\to$ `PROVE`), budget $N \le 4 \to \text{DIRECT\_TEACH}$. | Overlong sentences (>200 chars), invalid JSON response parsing, non-FSM state strings. | Turn 4 budget limit triggers `DIRECT_TEACH` regardless of misconception severity. |
| **F6** | Deterministic Clinical Preceptor | Fallback coverage for all 9+ misconception tags from seed/items_pk.json without external network. | Unknown misconception tags, empty student inputs, high turn counts ($N \ge 10$). | Zero network connectivity falls back gracefully to deterministic dialogue with 0 leaks. |
| **F7** | OpenRouter Model Cascade Hardening | Free model cascade order (`nemotron-3-ultra:free` $\to$ `nemotron-3.5-lightning:free` $\to$ `gemma-4-31b:free`), clinical refusal regex. | Rate limit simulation (429), timeout handling, patient consultation prompt detection. | Consultation refusal redirects live queries to theoretical course slides safely. |
| **F8** | FSRS Spaced Repetition Scheduling | Memory stability ($S$), difficulty ($D$), retrievability ($R$), interval calculation across confidence 1–5. | $t=0 \implies R=1.0$, $t=S \implies R=0.90$, $t \to \infty \implies R \to 0$, $S \le 0 \implies R=0$, boundary difficulties [1.0, 10.0]. | Correct responses at confidence 5 scale stability by $2.8\times$ and advance interval. |
| **F9** | Hypercorrection & Mastery Theta | Confidence $\ge 4$ error $\implies S=0$, mandatory re-test $T+24\text{h}$, running $\theta \in [0.0, 1.0]$. | Confidence 4 vs 3 threshold step function, $\theta$ boundary clamping at 0.0 and 1.0. | Hypercorrection error triggers immediate stability reset and error clinic alert tag. |
| **F10** | Daily Mission Mobile View (480px) | 480px viewport container, 3-case carousel (Ceftazidime, Gentamicin, Theophylline), scratchpad steps. | Small screen layout overflow prevention, missing scratchpad fields, rapid case switching. | Scratchpad intermediate inputs update diagnostic drawer step evaluations in real time. |
| **F11** | Error Clinic View | Historical audit of missed items, misconception tag chips, hypercorrection badges. | Empty error state, multiple attempts on same item, filtered view by misconception. | Error events generate next-time review prompts and highlight persistent mistakes. |
| **F12** | Next-Time Rules Notebook | Authoring, editing, deleting heuristics, pre-test display for confused concepts. | Empty rule validation, maximum text lengths, multiple rules per concept. | Pre-test drawer displays relevant next-time rule before student attempts retry. |
| **F13** | Supabase Telemetry & Persistence | Attempt recording, error event generation with `is_hypercorrection`, mastery score updates. | Network failure fallback to local state, RLS policy enforcement, invalid UUID handling. | Full end-to-end data pipeline from attempt submit $\to$ telemetry $\to$ mastery update. |

---

## 4. Multi-Tier Test Architecture

### 4.1 Tier 1: Feature Coverage (Minimum $\ge 5$ per Feature)
- **F1 (Cockcroft-Gault)**:
  1. Normal male patient ($175\text{ cm}, 75\text{ kg}, 50\text{ yo}, \text{SCr } 1.0 \implies \text{IBW } 70.46, \text{CrCl } 88.08$).
  2. Obese female patient ($160\text{ cm}, 85\text{ kg}, 64\text{ yo}, \text{SCr } 1.4 \implies \text{IBW } 52.38, \text{DVA } 65.43, \text{CrCl } 41.93$).
  3. Underweight female patient ($165\text{ cm}, 42\text{ kg}, 30\text{ yo}, \text{SCr } 0.8 \implies \text{TBW } 42\text{ kg used}$).
  4. Misconception detection: female factor forgotten (`MISSED_FEMALE_FACTOR_0_85`).
  5. Misconception detection: TBW used in obesity (`USED_TBW_INSTEAD_OF_ADJ_OR_IBW`).
- **F2 (Gentamicin)**:
  1. Standard 2-point decline ($t_1=2, C_1=8, t_2=6, C_2=2 \implies \Delta t=4, k_e=0.3466, t_{1/2}=2.00$).
  2. High clearance patient ($t_1=1, C_1=12, t_2=4, C_2=1.5 \implies k_e=0.6931, t_{1/2}=1.00$).
  3. Misconception: $k_e$ reported as $t_{1/2}$ (`CONFUSED_KE_WITH_HALF_LIFE`).
  4. Misconception: $\Delta t$ inverted division (`DELTA_T_DIVIDED_BY_RATIO_ERROR`).
  5. Misconception: Divided by $\ln(2)$ instead of multiplied (`DIVIDED_BY_LN2_INSTEAD_OF_MULTIPLIED`).
- **F3 (Theophylline)**:
  1. Anhydrous IV loading dose ($V_d=35\text{ L}, C_{\text{target}}=15\text{ mg/L}, C_0=0, S=1.0 \implies D_L=525.00\text{ mg}$).
  2. Aminophylline IV loading dose ($V_d=35\text{ L}, C_{\text{target}}=15\text{ mg/L}, C_0=0, S=0.8 \implies D_L=656.25\text{ mg}$).
  3. Non-zero baseline level ($V_d=35\text{ L}, C_{\text{target}}=15\text{ mg/L}, C_0=5\text{ mg/L}, S=1.0 \implies \Delta C=10, D_L=350.00\text{ mg}$).
  4. Misconception: Erroneous aminophylline salt factor on anhydrous (`ERRONEOUSLY_DIVIDED_BY_AMINOPHYLLINE_SALT_FACTOR`).
  5. Misconception: Inverted $V_d$ equation (`INVERTED_VD_EQUATION`).
- **F4 (Shared Framework)**:
  1. `BaseEvaluationNode` structural validation across all 3 engines.
  2. `EngineResult` containing correct `firstFailingNodeId` on early error.
  3. `EngineResult` containing `primaryMisconceptionTag` mapping.
  4. `EngineValidationError` code typing.
  5. Step evaluation array ordering matching DAG dependency order.
- **F5 (Socratic FSM & Budget)**:
  1. `SocraticTurnSchema` accepts compliant 3-sentence response.
  2. `SocraticTurnSchema` rejects response with `reveals_answer: true`.
  3. Turn 1 returns state `PROBE`.
  4. Turn 3 returns state `PATCH`.
  5. Turn 4 escalates to `DIRECT_TEACH`.
- **F6 (Deterministic Preceptor)**:
  1. Preceptor generates valid response for `MISSED_FEMALE_FACTOR_0_85`.
  2. Preceptor generates valid response for `USED_TBW_INSTEAD_OF_ADJ_OR_IBW`.
  3. Preceptor generates valid response for `CONFUSED_KE_WITH_HALF_LIFE`.
  4. Preceptor generates valid response for `ERRONEOUSLY_DIVIDED_BY_AMINOPHYLLINE_SALT_FACTOR`.
  5. Preceptor generates valid response for default/general calculation error.
- **F7 (OpenRouter Cascade & Refusal)**:
  1. Model priority order contains `nvidia/nemotron-3-ultra:free` as primary.
  2. Secondary model fallback contains `nvidia/nemotron-3.5-lightning:free`.
  3. Tertiary model contains `google/gemma-4-31b:free`.
  4. Regex refusal intercepts live patient consultation queries (`hasta`, `doz önerisi`).
  5. Refusal returns pedagogical redirection with `reveals_answer: false`.
- **F8 (FSRS Scheduling)**:
  1. Retrievability decay satisfies $R(0, S) = 1.0$.
  2. Retrievability decay satisfies $R(S, S) = 0.90$.
  3. Retrievability decays monotonically as $t > S$.
  4. Confidence 5 correct review multiplies stability by $2.8\times$.
  5. Confidence 4 correct review multiplies stability by $2.0\times$.
- **F9 (Hypercorrection & Mastery)**:
  1. Incorrect with confidence 4 sets $S=0.0$ and `isHypercorrection=true`.
  2. Incorrect with confidence 5 sets $S=0.0$ and `isHypercorrection=true`.
  3. Incorrect with confidence 3 preserves non-zero stability ($S \ge 0.2$).
  4. Hypercorrection penalty decrements mastery $\theta$ by $-0.25$.
  5. Mastery score clamps strictly between $0.00$ and $1.00$.
- **F10–F13 (Views & Persistence)**:
  1. Daily Mission 3-case carousel contract.
  2. Scratchpad input evaluation dataflow.
  3. Error Clinic record shape with misconception tags and hypercorrection flag.
  4. Next-time rule entity lifecycle.
  5. Telemetry payload schema validation for Supabase persistence.

### 4.2 Tier 2: Boundary & Corner Cases (Minimum $\ge 5$ per Feature)
- **F1 (Cockcroft-Gault Boundary Cases)**:
  1. Minimum adult age (18 years) boundary evaluation.
  2. Extreme elderly age (100+ years) with low SCr ($0.5\text{ mg/dL}$) requiring elderly floor ($0.8\text{ mg/dL}$).
  3. Severe morbid obesity ($\text{TBW} = 220\text{ kg}$, $\text{IBW} = 60\text{ kg}$, ratio $3.66\times$).
  4. Severe cachexia / underweight ($\text{TBW} = 32\text{ kg}$, $\text{IBW} = 55\text{ kg}$).
  5. SCr unit conversion: $123.76\ \mu\text{mol/L} \implies 1.40\text{ mg/dL}$ producing identical CrCl within $0.1\%$.
- **F2 (Gentamicin Boundary Cases)**:
  1. Inverted time inputs ($t_1 = 6\text{ h}, t_2 = 2\text{ h}$) throws `ERR_TIME_ORDER_INVERTED`.
  2. Negative concentrations ($C_1 = -5$) throws `ERR_NON_POSITIVE_CONCENTRATION`.
  3. Zero concentration ($C_2 = 0$) throws `ERR_NON_POSITIVE_CONCENTRATION` (preventing division by zero).
  4. Non-decaying concentration ($C_1 = 4, C_2 = 8$) throws `ERR_NON_DECAYING_CONCENTRATION`.
  5. Ultra-short half-life / rapid clearance ($\Delta t = 1\text{ h}, C_1 = 16, C_2 = 1$).
- **F3 (Theophylline Boundary Cases)**:
  1. Zero or negative distribution volume ($V_d \le 0$) throws `ERR_ZERO_OR_NEGATIVE_VD`.
  2. Non-positive target concentration ($C_{\text{target}} \le 0$) throws `ERR_ZERO_OR_NEGATIVE_CTARGET`.
  3. Baseline exceeds target ($C_0 \ge C_{\text{target}}$) throws `ERR_BASELINE_EXCEEDS_TARGET`.
  4. Weight-based volume ($V_{d,\text{kg}} = 0.5\text{ L/kg}, W = 70\text{ kg} \implies V_d = 35\text{ L}$).
  5. Extreme obesity theophylline volume handling (distribution into lean mass).
- **F5 & F6 (Socratic Boundary Cases)**:
  1. Character limit boundaries: clinical observation at exactly 200 characters.
  2. Actionable question at exactly 160 characters.
  3. Turn count at extreme high value ($N = 100$) remains clamped at `DIRECT_TEACH`.
  4. Empty string student input safely processed without exceptions.
  5. Punctuation and Turkish character encoding integrity (ç, ğ, ı, ö, ş, ü).
- **F8 & F9 (FSRS Boundary Cases)**:
  1. Elapsed time $t = 0.0$ days yields exactly $R = 1.0000$.
  2. Elapsed time at extreme infinity ($t = 10,000$ days) yields $R \to 0$ without NaN or negative values.
  3. Initial difficulty at upper bound ($10.0$) remains clamped at $10.0$ on failure.
  4. Initial difficulty at lower bound ($1.0$) remains clamped at $1.0$ on repeated easy successes.
  5. Confidence step transition: confidence 4 (hypercorrection) vs confidence 3 (standard lapse).

### 4.3 Tier 3: Cross-Feature Interactions (Pairwise & End-to-End Chains)
- **Interaction 1: Calculation Failure $\to$ Misconception Tag $\to$ FSRS Stability Collapse $\to$ Preceptor State Escalation**
  - Student submits $54.46\text{ mL/min}$ on obese case $\implies$ engine tags `USED_TBW_INSTEAD_OF_ADJ_OR_IBW`.
  - Student submitted with high confidence ($5/5$) $\implies$ FSRS triggers hypercorrection, drops $S \leftarrow 0.0$, sets re-test at $T+24\text{h}$.
  - System initiates Socratic turn with `USED_TBW_INSTEAD_OF_ADJ_OR_IBW` $\implies$ preceptor probes weight selection without revealing $41.93$.
- **Interaction 2: Repeated Lapses $\to$ Turn Budget Exhaustion $\to$ Direct Teaching $\to$ Mastery Decrement**
  - Successive student responses fail across turns 1 through 4.
  - Turn 4 automatically escalates from `PATCH` to `DIRECT_TEACH`.
  - Telemetry logs attempt with `is_correct: false` $\implies$ mastery $\theta$ falls by cumulative penalty clamped at $0.0$.
- **Interaction 3: Successful Remediation $\to$ Next-Time Rule Authoring $\to$ Retention Interval Expansion**
  - Student creates Next-Time Rule: *"Obez hastada her zaman DVA kullan, TVA değil"*.
  - On re-test at $T+24\text{h}$, student correctly applies DVA with confidence 5.
  - FSRS transitions item from lapse to expanded interval ($S \leftarrow 1.0 \times 2.8 = 2.8\text{ days}$).
  - Mastery score $\theta$ increments by $+0.20$.
- **Interaction 4: Gentamicin $k_e$ / $t_{1/2}$ Confusion $\to$ Socratic Inversion Hint $\to$ Formula Correction**
  - Student submits $k_e = 0.35$ as half-life. Engine flags `CONFUSED_KE_WITH_HALF_LIFE`.
  - Deterministic preceptor asks: *"0.693 sabiti ile ke arasındaki matematiksel ilişki nedir?"*.
  - Student computes $0.693 / 0.35 = 1.98 \approx 2.00\text{ h}$ on subsequent turn.
- **Interaction 5: Theophylline Salt Form Selection $\to$ Error Clinic Misconception Isolation**
  - Student uses aminophylline $S=0.8$ for anhydrous theophylline ($656.25\text{ mg}$).
  - Engine isolates `salt_factor_node` failure with tag `ERRONEOUSLY_DIVIDED_BY_AMINOPHYLLINE_SALT_FACTOR`.
  - Error Clinic records attempt and flags for targeted salt equivalence review.

### 4.4 Tier 4: Real-World Clinical Application Scenarios (Minimum $\ge 5$)
- **Scenario 1 (Seed Item 1 — Ceftazidime in Obese Elderly Female)**:
  - Patient: 64 yo female, 160 cm, 85 kg, SCr: 1.4 mg/dL.
  - Expected: $\text{IBW} = 52.38\text{ kg}$, $\text{DVA} = 65.43\text{ kg}$, $\text{CrCl} = 41.93\text{ mL/min}$.
  - Clinical decision: Ceftazidime dose adjustment required for renal clearance $< 50\text{ mL/min}$.
- **Scenario 2 (Seed Item 2 — Gentamicin Therapeutic Drug Monitoring in Sepsis)**:
  - Patient with severe sepsis receives 5 mg/kg Gentamicin. Post-distribution peak at $2\text{ h}$ is $8\text{ mg/L}$, trough at $6\text{ h}$ is $2\text{ mg/L}$.
  - Expected: $\Delta t = 4\text{ h}$, $k_e = 0.347\text{ hr}^{-1}$, $t_{1/2} = 2.00\text{ h}$.
  - Target dosing interval $\tau = 8\text{ h}$ or extended-interval $24\text{ h}$ evaluation.
- **Scenario 3 (Seed Item 3 — Acute Bronchospasm Theophylline Loading)**:
  - Patient presents with acute status asthmaticus. Target theophylline level is $15\text{ mg/L}$, baseline $C_0 = 0$, $V_d = 35\text{ L}$. Form: Theophylline anhydrous IV.
  - Expected: $D_L = 525.00\text{ mg}$.
  - Comparison: If Aminophylline was used, $D_L = 656.25\text{ mg}$.
- **Scenario 4 (Geriatric Muscle Atrophy & Sarcopenia Adjustment)**:
  - Patient: 82 yo male, 170 cm, 54 kg, SCr reported as $0.5\text{ mg/dL}$ (artificially low due to profound sarcopenia).
  - Without elderly floor: $\text{CrCl} = \frac{(140 - 82) \times 54}{72 \times 0.5} = 87.0\text{ mL/min}$ (dangerously overestimating clearance).
  - With clinical elderly floor ($\text{SCr} \ge 0.8\text{ mg/dL}$): $\text{CrCl} = \frac{58 \times 54}{72 \times 0.8} = 54.38\text{ mL/min}$.
- **Scenario 5 (Longitudinal Multi-Day Spaced Repetition Mastery Progression)**:
  - Student begins with novice mastery $\theta = 0.10$.
  - Day 1: High confidence error on Cockcroft-Gault (Hypercorrection) $\implies \theta \to 0.00$, due in 24 hours.
  - Day 2: Re-test successful with confidence 4 $\implies \theta \to 0.15$, stability $2.0$ days.
  - Day 4: Retention check successful with confidence 5 $\implies \theta \to 0.35$, stability $5.6$ days.
  - Day 10: Retention check successful with confidence 5 $\implies \theta \to 0.55$, stability $15.7$ days.

---

## 5. Test Architecture & Execution Framework

### 5.1 Invocation Commands
- **Run all E2E requirement tests**: `npm test` or `npx vitest run tests/e2e_requirements.test.ts`
- **Run full TypeScript typecheck**: `npm run typecheck` (`tsc --noEmit`)
- **Run production build verification**: `npm run build` (`tsc && vite build`)

### 5.2 Pass/Fail Semantics
1. **Exit Code 0**: All test suites must execute with zero failures, zero unhandled rejections, and zero type errors.
2. **Tolerance Checking**:
   - Primary clinical values: relative error $\le 1.0\%$ or $\le 2.0\%$ matching seed specification.
   - Retrievability: absolute error $\le 0.0001$.
   - FSRS intervals: integer equality (`Math.round(S)`).
3. **Safety Assertions**:
   - `reveals_answer: false` must strictly hold across all Socratic test cases.

---

## 6. Coverage Thresholds & Quality Gates Summary

| Tier | Category | Minimum Required | Target in Suite |
|---|---|---|---|
| **Tier 1** | Feature Coverage (F1–F13) | $\ge 5$ per feature | 65+ total tests |
| **Tier 2** | Boundary & Corner Cases | $\ge 5$ per feature | 35+ total tests |
| **Tier 3** | Pairwise & Cross-Feature Chains | $\ge 5$ interaction chains | 10+ interaction tests |
| **Tier 4** | Real-World Application Scenarios | $\ge 5$ clinical scenarios | 6 clinical scenario tests |
| **Total** | **Full Requirement Suite** | **$\ge 100$ assertions** | **116+ comprehensive tests** |

All tests are integrated into `tests/e2e_requirements.test.ts`.
