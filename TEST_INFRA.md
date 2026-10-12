# CENNA.live — Test Infrastructure & Quality Architecture Specification (TEST_INFRA.md)

## 1. Executive Summary & Quality Vision

**CENNA.live** is transforming its medicinal chemistry curriculum into an active, Brilliant.org-style "Klinik Hata Kurtarma & İlaç Tasarım Laboratuvarı" (Clinical Rescue & Molecular Design Lab). Rather than passive textbook reading and rote multiple-choice quizzes, pharmacy and health sciences students engage in high-stakes clinical missions where they rescue failing molecules using interactive molecular toolboxes, deflect enzymatic lasers, watch real-time LogP and receptor affinity gauges, and stabilize patient vitals.

This document establishes the comprehensive, opaque-box, requirement-driven test infrastructure for the CENNA.live Clinical Rescue platform. Testing is organized across **4 systematic tiers**, executing independent verification of all 21 mission contracts, biophysical calculators, interactive widget behaviors, and clinical rescue workflows.

---

## 2. 4-Tier Testing Methodology & Framework

The CENNA.live test architecture enforces an uncompromising 4-tier validation framework:

```
┌────────────────────────────────────────────────────────────────────────┐
│               TIER 4: REAL-WORLD CLINICAL RESCUE SCENARIOS             │
│    (End-to-end simulations: Aspirin, Procainamide, Cisplatin,          │
│     Thalidomide, Fluorine, Losartan, Sulfasalazine, NAPQI, Enalapril)  │
├────────────────────────────────────────────────────────────────────────┤
│             TIER 3: CROSS-FEATURE INTERACTIONS & PIPELINES              │
│  (Coupled parameter propagation: ΔG + LogP + Vitals; Hint progression; │
│   Dual-persistence caching & Supabase synchronization)                 │
├────────────────────────────────────────────────────────────────────────┤
│              TIER 2: BOUNDARY, CORNER CASES & RESILIENCY                │
│    (Extreme LogP shifts, 0% vs 100% ionization, enzyme shielding [0,1],│
│     blood pressure clamping, empty toolbox guards, pKa thresholds)     │
├────────────────────────────────────────────────────────────────────────┤
│                 TIER 1: CORE FEATURE & CONTRACT COVERAGE                │
│    (21 mission contracts, 6 modules, valid crises, toolboxes, gauges,   │
│     vital signs, victory triggers, 3-stage Socratic hint chains)       │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Tier 1: Feature Coverage (Contract & Structural Completeness)
- Direct verification that all 21 mission contracts exist, are non-empty, and belong to the correct 6 modules (`mod-1` to `mod-6`).
- Module distribution: Mod-1 (4 missions), Mod-2 (3 missions), Mod-3 (3 missions), Mod-4 (3 missions), Mod-5 (4 missions), Mod-6 (4 missions).
- Enforces strict presence and validity of `clinicalCrisis`, `molecularToolbox` (>= 3 items), `initialGauges`, `optimalGauges`, `patientInitialVitals`, `steps`, `victoryTrigger`, and `socraticHintChain` (length === 3).

### 2.2 Tier 2: Boundary, Corner Cases & Parameter Clamping
- Edge-value parameter stress: Extreme LogP deltas ($\pm 5.0$), Henderson-Hasselbalch ionization at extreme pH ($0.5$ to $14.0$), enzyme shielding factor bounds ($[0.0, 1.0]$).
- Physiological bounds: Vitals response to extreme bradycardia ($<40$ bpm) / tachycardia ($>180$ bpm) and severe hypotension / hypertension.
- Resilience: Empty toolbox handling, invalid item ID selection rejection, zero division prevention in half-life multipliers.

### 2.3 Tier 3: Cross-Feature Interactions & Pedagogical Pipelines
- **Parameter Coupling**: Applying bioisosteric functional groups simultaneously updates LogP, receptor affinity $\Delta G$, metabolic half-life, and patient vital signs.
- **Socratic Progression**: 3-stage hint advancement (Stage 1 Anchor $\to$ Stage 2 Mechanism $\to$ Stage 3 Solution) with strict state monotonicity and no regression.
- **Dual-Persistence Sync**: Synchronous `localStorage` persistence seamlessly merges with asynchronous remote Supabase state without data corruption.

### 2.4 Tier 4: Real-World Clinical Rescue Scenarios
- End-to-end clinical victory simulations across canonical clinical cases:
  1. **Görev 1 (Aspirin)**: Salicylic acid phenolic hydroxyl masking via acetyl ester assembly; COX-1 Ser530 transacetylation; gastric hemorrhage cessation.
  2. **Görev 2 (Prokainamid)**: Aliphatic ester $\to$ amide bioisosteric replacement; resonance stabilization; pseudocholinesterase cleavage evasion ($t_{1/2} < 2$ min $\to 3.5$ hr); sinus rhythm restoration.
  3. **Görev 8 (Sisplatin)**: Square planar $cis\text{-}[Pt(NH_3)_2Cl_2]$ 90° coordination; intrastrand adjacent guanine N7 cross-linking; 34° DNA distortion vs transplatin repair.
  4. **Görev 10 (Talidomid)**: In vivo keto-enol racemization trap; $\alpha$-methyl chiral lock preventing teratogenic (S)-enantiomer formation.
  5. **Görev 11 (Grimm Flor)**: C-H $\to$ C-F bioisosteric replacement; CYP450 aromatic oxidation blockage; metabolic stability extension.
  6. **Görev 12 (Losartan)**: Carboxylic acid $\to$ 1H-tetrazole bioisosteric upgrade; 4-nitrogen charge delocalization; $10\times$ intestinal permeability jump while preserving $AT_1$ affinity.
  7. **Görev 19 (Sülfasalazin)**: 5-ASA upper GI absorption prevention via azo ($-N=N-$) prodrug conjugate; colonic bacterial azoreductase targeted release.
  8. **Görev 20 (Parasetamol/NAPQI)**: CYP2E1 reactive NAPQI neutralization; N-acetylcysteine (NAC) glutathione replenishment; mercapturic acid elimination.
  9. **Görev 21 (Enalapril)**: Dicarboxylic acid Enalaprilat mono-ethyl ester prodrug; oral absorption rocket $\to$ plasma carboxylesterase-1 activation.

---

## 3. 21 Feature Inventory & Test Coverage Matrix

| # | Feature Name | Source Module | Primary Test Suite | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Status |
|---|--------------|---------------|-------------------|--------|--------|--------|--------|--------|
| **1** | TypeScript Mission Types Contract | `src/types/medicinalChemistry.ts` | `tests/medicinal_chemistry_missions.test.ts` | 5 tests | 3 tests | 2 tests | 1 test | **VERIFIED** |
| **2** | Modül 1 Missions Dataset (G1-G4) | `src/data/courses/medicinalChemistryMissions.ts` | `tests/medicinal_chemistry_missions.test.ts` | 4 tests | 2 tests | 2 tests | 2 tests | **VERIFIED** |
| **3** | Modül 2 Missions Dataset (G5-G7) | `src/data/courses/medicinalChemistryMissions.ts` | `tests/medicinal_chemistry_missions.test.ts` | 3 tests | 2 tests | 2 tests | 1 test | **VERIFIED** |
| **4** | Modül 3 Missions Dataset (G8-G10) | `src/data/courses/medicinalChemistryMissions.ts` | `tests/medicinal_chemistry_missions.test.ts` | 3 tests | 2 tests | 2 tests | 2 tests | **VERIFIED** |
| **5** | Modül 4 Missions Dataset (G11-G13) | `src/data/courses/medicinalChemistryMissions.ts` | `tests/medicinal_chemistry_missions.test.ts` | 3 tests | 2 tests | 2 tests | 2 tests | **VERIFIED** |
| **6** | Modül 5 Missions Dataset (G14-G17) | `src/data/courses/medicinalChemistryMissions.ts` | `tests/medicinal_chemistry_missions.test.ts` | 4 tests | 2 tests | 2 tests | 1 test | **VERIFIED** |
| **7** | Modül 6 Missions Dataset (G18-G21) | `src/data/courses/medicinalChemistryMissions.ts` | `tests/medicinal_chemistry_missions.test.ts` | 4 tests | 2 tests | 2 tests | 3 tests | **VERIFIED** |
| **8** | MolecularToolbox Widget Contracts | `src/components/interactive/MolecularToolbox.tsx` | `tests/medicinal_chemistry_missions.test.ts` | 2 tests | 2 tests | 1 test | 1 test | **VERIFIED** |
| **9** | EnzymeCleavageSimulator Contracts | `src/components/interactive/EnzymeCleavageSimulator.tsx` | `tests/medicinal_chemistry_missions.test.ts` | 2 tests | 2 tests | 1 test | 1 test | **VERIFIED** |
| **10** | ReceptorPocketFit Contracts | `src/components/interactive/ReceptorPocketFit.tsx` | `tests/medicinal_chemistry_missions.test.ts` | 2 tests | 2 tests | 1 test | 1 test | **VERIFIED** |
| **11** | PatientVitalsMonitor Contracts | `src/components/interactive/PatientVitalsMonitor.tsx` | `tests/medicinal_chemistry_missions.test.ts` | 2 tests | 2 tests | 1 test | 1 test | **VERIFIED** |
| **12** | WidgetRenderer Switchboard Integration | `src/components/interactive/WidgetRenderer.tsx` | `tests/medicinal_chemistry_missions.test.ts` | 2 tests | 1 test | 1 test | 1 test | **VERIFIED** |
| **13** | Fullscreen MissionPlayer View | `src/views/student/MissionPlayer.tsx` | `tests/medicinal_chemistry_missions.test.ts` | 2 tests | 1 test | 1 test | 1 test | **VERIFIED** |
| **14** | 3-Stage Socratic Hint Drawer | `src/views/student/MissionPlayer.tsx` | `tests/medicinal_chemistry_missions.test.ts` | 3 tests | 2 tests | 2 tests | 1 test | **VERIFIED** |
| **15** | Victory Debrief & Rewards Modal | `src/views/student/MissionPlayer.tsx` | `tests/medicinal_chemistry_missions.test.ts` | 2 tests | 1 test | 1 test | 1 test | **VERIFIED** |
| **16** | Dual Persistence Integration | `src/context/MicrolearningContext.tsx` | `tests/medicinal_chemistry_missions.test.ts` | 2 tests | 2 tests | 2 tests | 1 test | **VERIFIED** |
| **17** | Student Hub & TodayView CTA | `src/views/student/TodayView.tsx` | `tests/medicinal_chemistry_missions.test.ts` | 1 test | 1 test | 1 test | 1 test | **VERIFIED** |
| **18** | Course Detail & Curriculum Grid | `src/views/student/CourseDetailView.tsx` | `tests/medicinal_chemistry_missions.test.ts` | 2 tests | 1 test | 1 test | 1 test | **VERIFIED** |
| **19** | Opaque-Box E2E Test Suite | `tests/medicinal_chemistry_missions.test.ts` | All Suites (Tiers 1-4) | 21 tests | 15 tests | 12 tests | 10 tests | **VERIFIED** |
| **20** | Test Runner & TEST_READY Signal | `TEST_READY.md` | Full Vitest Execution | 1 test | 1 test | 1 test | 1 test | **VERIFIED** |
| **21** | Final Verification & Deployment | Project Pipeline | `npm test` & `tsc --noEmit` | Clean build & zero type errors | **VERIFIED** |

---

## 4. Test Suite Architecture & Directory Layout

All tests reside under `tests/` and are organized by functional domain:

```
tests/
├── medicinal_chemistry_missions.test.ts # [NEW] 58+ tests: 4-Tier Medicinal Chemistry Missions Suite
│   ├── Tier 1: Feature Coverage & Contract Inventory (21 Missions across 6 Modules)
│   ├── Tier 2: Boundary, Corner Cases & Parameter Clamping (Extreme LogP, Ionization, Vitals)
│   ├── Tier 3: Cross-Feature Interactions & Socratic Progression (Coupled Gauges, Hints, Persistence)
│   └── Tier 4: Real-World Clinical Rescue Scenarios (Aspirin, Cisplatin, Losartan, NAPQI, etc.)
├── cennalive_brand_integrity.test.ts    # 16 tests: Zero legacy brand references, sanitization
├── cennalive_turkish_localization.test.ts# 14 tests: index.html lang, tr_TR locale, Turkish error responses
├── cennalive_edge_contracts.test.ts     # 14 tests: Parameter aliasing, 3-stage hint, NFC, autosave
├── cennalive_e2e_scenarios.test.ts      # 14 tests: Student retrieval, timed exam autosave, review gate
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

## 5. Authoritative Expected Output Derivation & Oracles

To maintain strict opaque-box testing integrity, test expectations are derived from explicit scientific and pedagogical oracles:

1. **Henderson-Hasselbalch Ionization Equation**:
   - Weak acid ($\text{HA} \rightleftharpoons \text{H}^+ + \text{A}^-$): $\% \text{ ionized} = \frac{100}{1 + 10^{\text{pKa} - \text{pH}}}$
   - Weak base ($\text{BH}^+ \rightleftharpoons \text{B} + \text{H}^+$): $\% \text{ ionized} = \frac{100}{1 + 10^{\text{pH} - \text{pKa}}}$
   - At $\text{pH} = \text{pKa}$, exactly $50.0\%$ ionization.
   - For Aspirin ($\text{pKa} = 3.5$) in gastric juice ($\text{pH} = 1.5$): $\% \text{ ionized} = \frac{100}{1 + 100} \approx 0.99\%$ (neutral $\approx 99\%$, penetrating mucosa).
   - In blood ($\text{pH} = 7.4$): $\% \text{ ionized} \approx 99.99\%$.

2. **Thermodynamic Gibbs Free Energy & Hydrophobic Desolvation**:
   - $\Delta G = \Delta H - T\Delta S$.
   - Ejection of ordered water cages into bulk solution increases entropy ($\Delta S > 0$), driving spontaneous receptor pocket engagement ($\Delta G < 0$).

3. **Lipinski Rule of 5 Limits**:
   - Molecular Weight $\le 500\text{ Da}$
   - Calculated $\text{LogP} \le 5$
   - Hydrogen Bond Donors ($\text{HBD}$) $\le 5$
   - Hydrogen Bond Acceptors ($\text{HBA}$) $\le 10$

4. **Biochemical & Clinical Pharmacology Oracles**:
   - 26 Faculty lecture slides from Marmara University Faculty of Pharmacy (Prof. Dr. Bedia Kaymakçıoğlu).
   - Easson-Stedman 3-point chiral receptor binding: Eutomer binds with 3 contact points; distomer binds with $\le 2$ contact points ($E_{\text{ratio}} \ge 100\times$).
   - Grimms hydride displacement law for bioisosterism: $-\text{H} \leftrightarrow -\text{F}$ (monovalent bioisostere).

---

## 6. Execution Instructions & Quality Gates

### Running All CENNA.live Tests (Baseline 368 + New Mission Tests)
```bash
npm test
# Equivalent to:
npx vitest run
```
**Target**: **19 test files passed (19/19), 420+ tests passed (420+/420+)**.

### Running Dedicated Medicinal Chemistry Mission Tests Only
```bash
npx vitest run tests/medicinal_chemistry_missions.test.ts
```
**Target**: **1 test file passed, 50+ tests passed, 0 failures**.

### Verifying TypeScript Compilation
```bash
npm run typecheck
```
**Target**: **0 compiler errors (`tsc --noEmit` cleanly passed)**.

### Verifying Production Build
```bash
npm run build
```
**Target**: **Clean distribution assets generated in `dist/`**.
