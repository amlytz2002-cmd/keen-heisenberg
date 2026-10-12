# Project: CENNA.live Clinical Rescue & Molecular Design Platform

## Architecture
CENNA.live is transforming its Medicinal Chemistry curriculum into an active, Brilliant.org-style "Klinik Hata Kurtarma & İlaç Tasarım Laboratuvarı".
- **Frontend Core**: Vite + React 18 + TypeScript + Ant Design v5 + Tailwind-aligned design tokens + SVG graphics.
- **Routing & Immersion**: Fullscreen route bypass in `src/App.tsx` (`/learn/lesson/:id` & `/learn/mission/:id`) completely unmounting Navbar/Footer for a 100vh distraction-free clinical cockpit.
- **Interactive Sandbox Layer**: Custom SVG/React widgets (`MolecularToolbox`, `EnzymeCleavageSimulator`, `ReceptorPocketFit`, `PatientVitalsMonitor`) dispatched via `WidgetRenderer.tsx`.
- **Data & Gamification**: Zero-latency typed mission dataset (`src/data/courses/medicinalChemistryMissions.ts`), dual persistence via `MicrolearningContext.tsx` (synchronous `localStorage` + asynchronous Supabase `user_lesson_progress` / `user_gamification`).
- **Testing & Quality Assurance**: Vitest v3 with 368 existing baseline tests + dedicated unit test suite `tests/medicinal_chemistry_missions.test.ts` (53 tests) testing all 21 mission contracts, interactions, and scoring rules (Total: 421 tests passed).
- **Production Deployment**: Cloudflare Pages (`cennalive-pilot`) configured via `wrangler.toml`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | TypeScript Mission Types Contract | Strict contracts for missions, crises, toolbox, live gauges, vitals, steps, and victory triggers in `src/types/medicinalChemistry.ts` | M1 | R1, R3 |
| 2 | Modül 1 Missions Dataset | Package Missions 1-4 (Aspirin, Prokainamid, Aldehit, Sülfonamid) based on 26 faculty slides | M1 | R1, R3 |
| 3 | Modül 2 Missions Dataset | Package Missions 5-7 (Omeprazol, Adrenerjik tuz köprüsü, Entropi desolvatasyonu) | M1 | R1, R3 |
| 4 | Modül 3 Missions Dataset | Package Missions 8-10 (Sisplatin, Easson-Stedman, Talidomid rasemizasyonu) | M1 | R1, R3 |
| 5 | Modül 4 Missions Dataset | Package Missions 11-13 (Grimm flor, Losartan tetrazol, Lidokain 2,6-dimetil) | M1 | R1, R3 |
| 6 | Modül 5 Missions Dataset | Package Missions 14-17 (KBB LogP, İdrar pH iyon tuzağı, Lipinski 5, Nalokson farmakofor) | M1 | R1, R3 |
| 7 | Modül 6 Missions Dataset | Package Missions 18-21 (CYP450, Sülfasalazin azo redüktaz, Parasetamol/NAPQI, Enalaprilat ön ilaç) | M1 | R1, R3 |
| 8 | MolecularToolbox Widget | Interactive drag-and-drop/click-to-swap atom and bioisosteric functional group assembler in `src/components/interactive/MolecularToolbox.tsx` | M2 | R2 |
| 9 | EnzymeCleavageSimulator Widget | SVG enzymatic attack laser simulator with real-time deflection upon bioisosteric shielding in `src/components/interactive/EnzymeCleavageSimulator.tsx` | M2 | R2 |
| 10 | ReceptorPocketFit Widget | Lock-and-key pocket alignment testing steric clash, Coulomb salt bridge, and π-stacking in `src/components/interactive/ReceptorPocketFit.tsx` | M2 | R2 |
| 11 | PatientVitalsMonitor Widget | Dynamic HUD monitoring cardiac, gastric, liver, and blood pressure vitals tied to molecular structure in `src/components/interactive/PatientVitalsMonitor.tsx` | M2 | R2 |
| 12 | WidgetRenderer Integration | Expand `WidgetRenderer.tsx` switchboard to mount the 4 new interactive widgets | M2 | R2 |
| 13 | Fullscreen MissionPlayer View | Immersive 100vh clinical rescue view in `src/views/student/MissionPlayer.tsx` with cockpit HUD, sandbox, and Socratic hints | M3 | R4 |
| 14 | 3-Stage Socratic Hint Drawer | Progressive hints drawer (Stage 1 Anchor, Stage 2 Mechanism, Stage 3 Solution) in MissionPlayer | M3 | R4 |
| 15 | Victory Debrief & Rewards Modal | Interactive victory celebration with stars (1-3), XP rewards, streak increments, and clinical pearls | M3 | R4 |
| 16 | Dual Persistence Integration | Synchronous localStorage caching + async Supabase sync to `user_lesson_progress` and `user_gamification` | M3 | R4 |
| 17 | Student Hub & TodayView CTA | Add prominent "Klinik Kurtarma Laboratuvarı" CTA card and mission progress to `TodayView.tsx` | M4 | R4 |
| 18 | Course Detail & Curriculum Grid | Display all 6 modules and 21 missions with unlock state and star badges in `CourseDetailView.tsx` | M4 | R4 |
| 19 | Opaque-Box E2E Test Suite | Comprehensive unit/E2E test suite in `tests/medicinal_chemistry_missions.test.ts` covering Tiers 1-4 | E2E | Criteria |
| 20 | Test Runner & TEST_READY Signal | Ensure all 368+ baseline tests + new mission tests pass (100% green), publish `TEST_READY.md` | E2E | Criteria |
| 21 | Final Verification & Deployment | Zero typecheck errors (`tsc --noEmit`), clean Vite build (`npm run build`), Cloudflare Pages deploy | M5 | Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Author 53 unit/E2E test cases in `tests/medicinal_chemistry_missions.test.ts` across Tiers 1-4; published `TEST_READY.md` (421/421 tests passed) | none | DONE |
| M1 | 21 Missions Dataset & Council Synthesis | Implemented `src/types/medicinalChemistry.ts` and `src/data/courses/medicinalChemistryMissions.ts` covering all 21 missions across 6 modules | none | DONE |
| M2 | Interactive Molecular Sandbox Widgets | Implemented `MolecularToolbox`, `EnzymeCleavageSimulator`, `ReceptorPocketFit`, `PatientVitalsMonitor` and wired into `WidgetRenderer.tsx` | M1 | DONE |
| M3 | Fullscreen MissionPlayer & Dual Persistence | Implemented `MissionPlayer.tsx`, 3-stage hints, victory debrief modal, and dual persistence in `MicrolearningContext.tsx` | M1, M2 | DONE |
| M4 | Student Hub & Curriculum Navigation | Wire 21 missions into `TodayView.tsx` and `CourseDetailView.tsx` | M1, M3 | DONE |
| M5 | Final Verification & Deployment | Run full test suite (368+ existing + new tests), verify 0 typecheck errors, clean build, deploy, forensic audit | M1-M4, E2E | DONE |

## Interface Contracts

### TypeScript Mission Data Contract (`src/types/medicinalChemistry.ts`)
```typescript
export interface MolecularToolboxItem {
  id: string;
  name: string;
  formula: string;
  type: 'functional_group' | 'bioisostere' | 'protecting_group' | 'antidote' | 'atom';
  deltaLogP: number;
  deltaAffinity: number;
  halfLifeMultiplier: number;
  shieldingFactor: number;
  toxicityRisk: number;
  description: string;
}

export interface LiveGauges {
  logP: number;
  percentIonized: number;
  metabolicHalfLifeMinutes: number;
  receptorAffinityDeltaG: number;
  bloodBrainBarrierPenetration?: number;
}

export interface PatientVitals {
  heartRateBpm: number;
  bloodPressureSys: number;
  bloodPressureDia: number;
  gastricPh: number;
  liverEnzymeAlt: number;
  status: 'critical' | 'unstable' | 'stabilizing' | 'normalized';
}

export interface ClinicalRescueMission {
  id: string;
  moduleId: string;
  moduleTitle: string;
  title: string;
  subtitle: string;
  order: number;
  xpReward: number;
  estimatedMinutes: number;
  failingMoleculeName: string;
  targetTargetName: string;
  clinicalCrisis: {
    presentation: string;
    vignette: string;
    biochemicalFlaw: string;
    patientInitialVitals: PatientVitals;
  };
  initialGauges: LiveGauges;
  optimalGauges: Partial<LiveGauges>;
  molecularToolbox: MolecularToolboxItem[];
  solutionItemIds: string[];
  steps: PuzzleStep[];
  victoryTrigger: {
    conditionDescription: string;
    ahaExplanation: string;
    pearl: string;
  };
  socraticHintChain: [string, string, string];
}
```

## Code Layout
- `src/types/medicinalChemistry.ts`: Type definitions for missions, toolbox, gauges, and vitals.
- `src/data/courses/medicinalChemistryMissions.ts`: 21 Clinical Rescue Missions dataset.
- `src/components/interactive/`: Interactive sandbox widgets.
  - `MolecularToolbox.tsx`: Atom/group selector and bioisosteric assembly.
  - `EnzymeCleavageSimulator.tsx`: SVG enzymatic attack laser simulator.
  - `ReceptorPocketFit.tsx`: 2D lock-and-key pocket alignment.
  - `PatientVitalsMonitor.tsx`: Dynamic patient response HUD.
  - `WidgetRenderer.tsx`: Interactive widget dispatch switchboard.
- `src/views/student/`:
  - `MissionPlayer.tsx`: Fullscreen clinical rescue cockpit.
  - `TodayView.tsx`: Student daily hub with mission CTA.
  - `CourseDetailView.tsx`: Course syllabus and mission progression grid.
- `tests/medicinal_chemistry_missions.test.ts`: E2E & unit test suite (53 tests).
