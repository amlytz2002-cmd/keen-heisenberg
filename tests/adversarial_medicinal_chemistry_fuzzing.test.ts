/**
 * CENNA.live Clinical Rescue & Molecular Design Sandbox Platform
 * Adversarial Empirical Fuzzing, Boundary Stress & Contract Oracle Suite
 *
 * Enforces:
 * 1. Mathematical Fuzzing: Henderson-Hasselbalch ionization under extreme pH/pKa.
 * 2. Biophysical Fuzzing: calculateModifiedGauges under extreme multipliers & deltas.
 * 3. Physiological Fuzzing: evaluateVitalsResponse under extreme hemodynamics & vitals.
 * 4. Contract Consistency Oracle: All 21 production missions in medicinalChemistryMissions.ts.
 *
 * @license CENNA.live 2026
 */

import { describe, it, expect } from 'vitest';
import {
  calculateHendersonHasselbalchIonization,
  calculateModifiedGauges,
  evaluateVitalsResponse,
  validateMissionSolution,
  LiveGauges,
  MolecularToolboxItem,
  PatientVitals,
  ClinicalRescueMission,
} from '../src/types/medicinalChemistry';
import { MEDICINAL_CHEMISTRY_MISSIONS } from '../src/data/courses/medicinalChemistryMissions';

describe('Adversarial Fuzzing & Contract Oracle Suite: Medicinal Chemistry', () => {

  // ==========================================================================
  // 1. MATHEMATICAL FUZZING: HENDERSON-HASSELBALCH IONIZATION ENGINE
  // ==========================================================================
  describe('1. Mathematical Fuzzing: calculateHendersonHasselbalchIonization', () => {
    const testPHs = [-2.0, 0.0, 7.4, 14.0, 16.0];
    const testPKas = [0.0, 3.5, 10.4, 15.0];

    it('guarantees 50.00% ionization when pH strictly equals pKa for both acids and bases', () => {
      for (const pKa of testPKas) {
        const acid50 = calculateHendersonHasselbalchIonization(pKa, pKa, 'acid');
        const base50 = calculateHendersonHasselbalchIonization(pKa, pKa, 'base');
        expect(acid50).toBe(50.0);
        expect(base50).toBe(50.0);
      }
    });

    it('evaluates all 40 combinations of extreme pH and pKa without NaN, Infinity, negative values, or crashes', () => {
      for (const pH of testPHs) {
        for (const pKa of testPKas) {
          for (const type of ['acid', 'base'] as const) {
            const result = calculateHendersonHasselbalchIonization(pKa, pH, type);

            expect(Number.isFinite(result)).toBe(true);
            expect(Number.isNaN(result)).toBe(false);
            expect(result).toBeGreaterThanOrEqual(0.0);
            expect(result).toBeLessThanOrEqual(100.0);
          }
        }
      }
    });

    it('correctly captures physiological Aspirin ionization (pKa 3.5): gastric mucosa vs systemic blood', () => {
      // Gastric juice pH ~ 1.5: mostly un-ionized (lipophilic, penetrates gastric mucosal lining)
      const gastricAcid = calculateHendersonHasselbalchIonization(3.5, 1.5, 'acid');
      expect(gastricAcid).toBeCloseTo(0.99, 1); // ~0.99% ionized -> ~99% neutral non-ionized

      // Systemic plasma pH 7.4: overwhelmingly ionized (hydrophilic, traps anion)
      const bloodAcid = calculateHendersonHasselbalchIonization(3.5, 7.4, 'acid');
      expect(bloodAcid).toBeCloseTo(99.99, 1);
    });

    it('correctly models basic drugs (e.g. Procaine pKa 8.9): stomach trapping vs tissue distribution', () => {
      const procaineStomach = calculateHendersonHasselbalchIonization(8.9, 1.5, 'base');
      expect(procaineStomach).toBeGreaterThan(99.9); // completely protonated cation

      const procaineBlood = calculateHendersonHasselbalchIonization(8.9, 7.4, 'base');
      expect(procaineBlood).toBeGreaterThan(95.0);
    });

    it('resists deep mathematical extremes (pH = -100, pH = +100, pKa = -50, pKa = +50)', () => {
      const extremeValues = [-100, -50, 0, 50, 100];
      for (const pH of extremeValues) {
        for (const pKa of extremeValues) {
          for (const type of ['acid', 'base'] as const) {
            const res = calculateHendersonHasselbalchIonization(pKa, pH, type);
            expect(Number.isFinite(res)).toBe(true);
            expect(Number.isNaN(res)).toBe(false);
            expect(res).toBeGreaterThanOrEqual(0.0);
            expect(res).toBeLessThanOrEqual(100.0);
          }
        }
      }
    });

    it('generates 1,000 randomized (pH, pKa) test cases across continuous space [-20.0, 30.0]', () => {
      // Deterministic pseudorandom generator seed for reproducibility
      let seed = 123456789;
      const rnd = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };

      for (let i = 0; i < 1000; i++) {
        const pH = -20.0 + rnd() * 50.0; // [-20.0, 30.0]
        const pKa = -20.0 + rnd() * 50.0;
        const type = rnd() > 0.5 ? 'acid' : 'base';

        const res = calculateHendersonHasselbalchIonization(pKa, pH, type);
        expect(Number.isFinite(res), `Failed on pH=${pH}, pKa=${pKa}, type=${type}: not finite`).toBe(true);
        expect(Number.isNaN(res), `Failed on pH=${pH}, pKa=${pKa}, type=${type}: NaN`).toBe(false);
        expect(res).toBeGreaterThanOrEqual(0.0);
        expect(res).toBeLessThanOrEqual(100.0);
      }
    });
  });

  // ==========================================================================
  // 2. BIOPHYSICAL FUZZING: MODIFIED GAUGES ENGINE
  // ==========================================================================
  describe('2. Biophysical Fuzzing: calculateModifiedGauges', () => {
    const baselineGauges: LiveGauges = {
      logP: 1.5,
      percentIonized: 20.0,
      metabolicHalfLifeMinutes: 10.0,
      receptorAffinityDeltaG: -6.0,
      bloodBrainBarrierPenetration: 50.0,
    };

    it('handles empty selected items cleanly and returns default clamped parameters', () => {
      const result = calculateModifiedGauges(baselineGauges, []);
      expect(result.logP).toBe(1.5);
      expect(result.percentIonized).toBe(20.0);
      expect(result.metabolicHalfLifeMinutes).toBe(10.0);
      expect(result.receptorAffinityDeltaG).toBe(-6.0);
      expect(result.bloodBrainBarrierPenetration).toBeGreaterThanOrEqual(2.0);
    });

    it('fuzzes extreme LogP shifts (-10.0 to +10.0) without NaN or negative BBB', () => {
      const extremeLogPDeltas = [-10.0, -5.0, -1.0, 0.0, 1.0, 5.0, 10.0];

      for (const delta of extremeLogPDeltas) {
        const item: MolecularToolboxItem = {
          id: `tool-fuzz-logp-${delta}`,
          name: `Test Tool LogP ${delta}`,
          formula: 'C1',
          type: 'functional_group',
          deltaLogP: delta,
          deltaAffinity: 0,
          halfLifeMultiplier: 1.0,
          shieldingFactor: 0,
          toxicityRisk: 0,
          description: 'Fuzzing LogP delta',
        };

        const result = calculateModifiedGauges(baselineGauges, [item]);

        expect(Number.isFinite(result.logP)).toBe(true);
        expect(Number.isNaN(result.logP)).toBe(false);
        expect(Number.isFinite(result.bloodBrainBarrierPenetration!)).toBe(true);
        expect(result.bloodBrainBarrierPenetration).toBeGreaterThanOrEqual(2.0);
        expect(result.bloodBrainBarrierPenetration).toBeLessThanOrEqual(98.0);
      }
    });

    it('fuzzes extreme metabolic half-life multipliers (0.001 to 1000.0) enforcing 0.5 min minimum floor', () => {
      const extremeMultipliers = [0.00001, 0.001, 0.01, 0.5, 1.0, 50.0, 1000.0, 10000.0];

      for (const mult of extremeMultipliers) {
        const item: MolecularToolboxItem = {
          id: `tool-fuzz-hl-${mult}`,
          name: `Test Tool HalfLife ${mult}`,
          formula: 'C1',
          type: 'functional_group',
          deltaLogP: 0,
          deltaAffinity: 0,
          halfLifeMultiplier: mult,
          shieldingFactor: 0.8,
          toxicityRisk: 0,
          description: 'Fuzzing half life multiplier',
        };

        const result = calculateModifiedGauges(baselineGauges, [item]);

        expect(Number.isFinite(result.metabolicHalfLifeMinutes)).toBe(true);
        expect(Number.isNaN(result.metabolicHalfLifeMinutes)).toBe(false);
        expect(result.metabolicHalfLifeMinutes).toBeGreaterThanOrEqual(0.5); // Safety floor
      }
    });

    it('fuzzes massive pKaDelta shifts and preserves percentIonized clamped strictly in [0, 100]', () => {
      const pKaDeltas = [-50.0, -10.0, -2.0, 0.0, 2.0, 10.0, 50.0];

      for (const delta of pKaDeltas) {
        const item: MolecularToolboxItem = {
          id: `tool-fuzz-pka-${delta}`,
          name: `Test Tool pKaDelta ${delta}`,
          formula: 'C1',
          type: 'functional_group',
          deltaLogP: 0,
          deltaAffinity: 0,
          halfLifeMultiplier: 1.0,
          shieldingFactor: 0,
          toxicityRisk: 0,
          description: 'Fuzzing pKa delta',
          chemicalDelta: { pKaDelta: delta },
        };

        const result = calculateModifiedGauges(baselineGauges, [item]);

        expect(Number.isFinite(result.percentIonized)).toBe(true);
        expect(result.percentIonized).toBeGreaterThanOrEqual(0.0);
        expect(result.percentIonized).toBeLessThanOrEqual(100.0);
      }
    });

    it('fuzzes multi-item stack combinations with cumulative parameters', () => {
      const items: MolecularToolboxItem[] = [
        {
          id: 'item-1',
          name: 'Extreme Hydrophobe',
          formula: 'C10',
          type: 'functional_group',
          deltaLogP: 6.0,
          deltaAffinity: -4.0,
          halfLifeMultiplier: 2.5,
          shieldingFactor: 0.9,
          toxicityRisk: 0.1,
          description: 'Test stack 1',
        },
        {
          id: 'item-2',
          name: 'Hydrophilic Ionizer',
          formula: 'SO3H',
          type: 'functional_group',
          deltaLogP: -8.0,
          deltaAffinity: -2.0,
          halfLifeMultiplier: 0.05,
          shieldingFactor: 0.2,
          toxicityRisk: 0.2,
          description: 'Test stack 2',
          chemicalDelta: { pKaDelta: -8.0 },
        },
      ];

      const result = calculateModifiedGauges(baselineGauges, items);

      expect(Number.isFinite(result.logP)).toBe(true);
      expect(Number.isFinite(result.percentIonized)).toBe(true);
      expect(result.percentIonized).toBeGreaterThanOrEqual(0.0);
      expect(result.percentIonized).toBeLessThanOrEqual(100.0);
      expect(result.metabolicHalfLifeMinutes).toBeGreaterThanOrEqual(0.5);
      expect(result.bloodBrainBarrierPenetration).toBeGreaterThanOrEqual(2.0);
    });

    it('generates 500 randomized toolbox item configurations and confirms invariant properties', () => {
      let seed = 987654321;
      const rnd = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };

      for (let i = 0; i < 500; i++) {
        const randomItem: MolecularToolboxItem = {
          id: `rand-item-${i}`,
          name: `Rand ${i}`,
          formula: 'Rx',
          type: 'functional_group',
          deltaLogP: -20.0 + rnd() * 40.0,            // [-20.0, 20.0]
          deltaAffinity: -50.0 + rnd() * 100.0,       // [-50.0, 50.0]
          halfLifeMultiplier: Math.pow(10, -4 + rnd() * 8), // [10^-4, 10^4]
          shieldingFactor: rnd() * 10.0,             // [0.0, 10.0]
          toxicityRisk: rnd(),
          description: 'Random item',
          chemicalDelta: {
            pKaDelta: -25.0 + rnd() * 50.0,          // [-25.0, 25.0]
          },
        };

        const res = calculateModifiedGauges(baselineGauges, [randomItem]);

        expect(Number.isFinite(res.logP), `Run ${i}: logP not finite`).toBe(true);
        expect(Number.isNaN(res.logP), `Run ${i}: logP is NaN`).toBe(false);

        expect(Number.isFinite(res.percentIonized), `Run ${i}: percentIonized not finite`).toBe(true);
        expect(res.percentIonized).toBeGreaterThanOrEqual(0.0);
        expect(res.percentIonized).toBeLessThanOrEqual(100.0);

        expect(Number.isFinite(res.metabolicHalfLifeMinutes), `Run ${i}: halfLife not finite`).toBe(true);
        expect(res.metabolicHalfLifeMinutes).toBeGreaterThanOrEqual(0.5);

        expect(Number.isFinite(res.receptorAffinityDeltaG), `Run ${i}: affinity not finite`).toBe(true);

        expect(Number.isFinite(res.bloodBrainBarrierPenetration!), `Run ${i}: BBB not finite`).toBe(true);
        expect(res.bloodBrainBarrierPenetration).toBeGreaterThanOrEqual(2.0);
        expect(res.bloodBrainBarrierPenetration).toBeLessThanOrEqual(98.0);
      }
    });
  });

  // ==========================================================================
  // 3. PHYSIOLOGICAL FUZZING: PATIENT VITALS EVALUATION ENGINE
  // ==========================================================================
  describe('3. Physiological Fuzzing: evaluateVitalsResponse', () => {
    const mockMission: ClinicalRescueMission = {
      id: 'mission-mock',
      order: 1,
      moduleId: 'mod-1',
      moduleTitle: 'Test Module',
      title: 'Mock Mission',
      subtitle: 'Testing Vitals',
      xpReward: 50,
      estimatedMinutes: 5,
      failingMoleculeName: 'Mock Molecule',
      targetTargetName: 'Mock Target',
      clinicalCrisis: {
        presentation: 'Mock Presentation',
        vignette: 'Mock Vignette',
        biochemicalFlaw: 'Mock Flaw',
        patientInitialVitals: {
          heartRateBpm: 120,
          bloodPressureSys: 85,
          bloodPressureDia: 50,
          gastricPh: 1.5,
          liverEnzymeAlt: 45,
          status: 'critical',
        },
      },
      initialGauges: {
        logP: 1.0,
        percentIonized: 10.0,
        metabolicHalfLifeMinutes: 5.0,
        receptorAffinityDeltaG: -4.0,
      },
      optimalGauges: {
        logP: 2.0,
        receptorAffinityDeltaG: -8.0,
        metabolicHalfLifeMinutes: 30.0,
        percentIonized: 50.0,
      },
      molecularToolbox: [],
      solutionItemIds: ['tool-correct'],
      steps: [],
      victoryTrigger: {
        conditionDescription: 'Target reached',
        ahaExplanation: 'Aha!',
        pearl: 'Pearl',
      },
      socraticHintChain: ['H1', 'H2', 'H3'],
    };

    const extremeHeartRates = [20, 35, 60, 140, 200, 260];
    const extremeBPSys = [30, 50, 90, 160, 240, 280];

    it('evaluates extreme heart rates (20 to 260 bpm) and BP sys (30 to 280) across all deviation tiers', () => {
      for (const hr of extremeHeartRates) {
        for (const sys of extremeBPSys) {
          const initialVitals: PatientVitals = {
            heartRateBpm: hr,
            bloodPressureSys: sys,
            bloodPressureDia: Math.max(10, Math.round(sys * 0.6)),
            gastricPh: 2.0,
            liverEnzymeAlt: 35,
            status: 'critical',
          };

          // 1. Normalized scenario (gauges match optimal)
          const normalizedGauges: LiveGauges = {
            logP: 2.0,
            receptorAffinityDeltaG: -8.0,
            metabolicHalfLifeMinutes: 30.0,
            percentIonized: 50.0,
          };
          const normResult = evaluateVitalsResponse(initialVitals, normalizedGauges, mockMission);
          expect(normResult.status).toBe('normalized');
          expect(normResult.heartRateBpm).toBe(74);
          expect(normResult.bloodPressureSys).toBe(120);
          expect(normResult.bloodPressureDia).toBe(80);
          expect(normResult.bloodPressure).toBe('120/80');
          expect(normResult.overallStabilityScore).toBe(96);

          // 2. Stabilizing scenario (partial convergence: avgDeviation in [0.3, 0.85))
          const stabilizingGauges: LiveGauges = {
            logP: 3.5, // diff 1.5
            receptorAffinityDeltaG: -7.5, // diff 0.5
            metabolicHalfLifeMinutes: 25.0, // diff ratio 5/30 = 0.167
            percentIonized: 50.0,
          };
          const stabResult = evaluateVitalsResponse(initialVitals, stabilizingGauges, mockMission);
          expect(stabResult.status).toBe('stabilizing');
          expect(stabResult.heartRateBpm).toBe(Math.round((hr + 74) / 2));
          expect(stabResult.bloodPressureSys).toBe(Math.round((sys + 120) / 2));
          expect(Number.isFinite(stabResult.heartRateBpm)).toBe(true);
          expect(Number.isFinite(stabResult.bloodPressureSys)).toBe(true);
          expect(stabResult.bloodPressure).toMatch(/^\d+\/\d+$/);

          // 3. Unstable / Critical scenario (severe deviation)
          const criticalGauges: LiveGauges = {
            logP: 8.0,
            receptorAffinityDeltaG: 0.0,
            metabolicHalfLifeMinutes: 2.0,
            percentIonized: 0.0,
          };
          const critResult = evaluateVitalsResponse(initialVitals, criticalGauges, mockMission);
          expect(['unstable', 'critical']).toContain(critResult.status);
          expect(critResult.heartRateBpm).toBe(hr);
          expect(critResult.bloodPressureSys).toBe(sys);
        }
      }
    });

    it('safely handles empty optimalGauges object without crashing or NaN', () => {
      const missionEmptyOptimal = {
        ...mockMission,
        optimalGauges: {},
      };
      const initialVitals: PatientVitals = {
        heartRateBpm: 90,
        bloodPressureSys: 110,
        bloodPressureDia: 70,
        gastricPh: 3.0,
        liverEnzymeAlt: 30,
        status: 'unstable',
      };
      const currentGauges: LiveGauges = {
        logP: 1.5,
        percentIonized: 50.0,
        metabolicHalfLifeMinutes: 10.0,
        receptorAffinityDeltaG: -5.0,
      };

      const result = evaluateVitalsResponse(initialVitals, currentGauges, missionEmptyOptimal);
      expect(result.status).toBe('normalized'); // 0 deviations -> < 0.3
      expect(Number.isFinite(result.heartRateBpm)).toBe(true);
    });
  });

  // ==========================================================================
  // 4. CONTRACT CONSISTENCY ORACLE: ALL 21 PRODUCTION MISSIONS
  // ==========================================================================
  describe('4. Contract Consistency Oracle: All 21 Production Missions', () => {
    it('contains exactly 21 missions in MEDICINAL_CHEMISTRY_MISSIONS', () => {
      expect(MEDICINAL_CHEMISTRY_MISSIONS).toBeDefined();
      expect(Array.isArray(MEDICINAL_CHEMISTRY_MISSIONS)).toBe(true);
      expect(MEDICINAL_CHEMISTRY_MISSIONS.length).toBe(21);
    });

    it('enforces strictly canonical IDs (mission-1 through mission-21) and ascending order', () => {
      const ids = MEDICINAL_CHEMISTRY_MISSIONS.map(m => m.id);
      const expectedIds = Array.from({ length: 21 }, (_, i) => `mission-${i + 1}`);
      expect(ids).toEqual(expectedIds);

      MEDICINAL_CHEMISTRY_MISSIONS.forEach((m, idx) => {
        expect(m.order).toBe(idx + 1);
        if (m.missionNumber !== undefined) {
          expect(m.missionNumber).toBe(idx + 1);
        }
      });
    });

    it('correctly maps 6 modules with exact pedagogical distributions [4, 3, 3, 3, 4, 4]', () => {
      const moduleCounts: Record<string, number> = {};
      for (const m of MEDICINAL_CHEMISTRY_MISSIONS) {
        moduleCounts[m.moduleId] = (moduleCounts[m.moduleId] || 0) + 1;
      }

      expect(moduleCounts['mod-1']).toBe(4); // Missions 1-4
      expect(moduleCounts['mod-2']).toBe(3); // Missions 5-7
      expect(moduleCounts['mod-3']).toBe(3); // Missions 8-10
      expect(moduleCounts['mod-4']).toBe(3); // Missions 11-13
      expect(moduleCounts['mod-5']).toBe(4); // Missions 14-17
      expect(moduleCounts['mod-6']).toBe(4); // Missions 18-21
    });

    it('verifies that every mission has valid solutionItemIds that exist in its molecularToolbox', () => {
      for (const mission of MEDICINAL_CHEMISTRY_MISSIONS) {
        expect(mission.solutionItemIds, `Mission ${mission.id} missing solutionItemIds`).toBeDefined();
        expect(Array.isArray(mission.solutionItemIds), `Mission ${mission.id} solutionItemIds must be array`).toBe(true);
        expect(mission.solutionItemIds.length, `Mission ${mission.id} solutionItemIds is empty`).toBeGreaterThan(0);

        const toolboxIds = new Set(mission.molecularToolbox.map(t => t.id));

        for (const solId of mission.solutionItemIds) {
          expect(
            toolboxIds.has(solId),
            `Mission ${mission.id} solutionItemId '${solId}' does NOT exist in molecularToolbox: [${Array.from(toolboxIds).join(', ')}]`
          ).toBe(true);

          // Verify the matching item in molecularToolbox is marked isCorrect: true
          const matchingItem = mission.molecularToolbox.find(t => t.id === solId);
          expect(matchingItem, `Missing item for ${solId}`).toBeDefined();
          expect(
            matchingItem?.isCorrect,
            `Toolbox item ${solId} in mission ${mission.id} is listed in solutionItemIds but isCorrect is not true`
          ).toBe(true);
        }
      }
    });

    it('verifies that every mission has molecularToolbox with >= 3 items and complete biophysical properties', () => {
      for (const mission of MEDICINAL_CHEMISTRY_MISSIONS) {
        expect(
          mission.molecularToolbox.length,
          `Mission ${mission.id} molecularToolbox must contain at least 3 items`
        ).toBeGreaterThanOrEqual(3);

        const ids = mission.molecularToolbox.map(t => t.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size, `Mission ${mission.id} contains duplicate toolbox item IDs`).toBe(ids.length);

        for (const item of mission.molecularToolbox) {
          expect(item.id.trim().length, `Mission ${mission.id} item id is empty`).toBeGreaterThan(0);
          expect(item.name.trim().length, `Mission ${mission.id} item name is empty`).toBeGreaterThan(0);
          expect(item.formula.trim().length, `Mission ${mission.id} item formula is empty`).toBeGreaterThan(0);
          expect(item.description.trim().length, `Mission ${mission.id} item description is empty`).toBeGreaterThan(0);

          expect(Number.isFinite(item.deltaLogP), `Mission ${mission.id} item ${item.id} deltaLogP is not finite`).toBe(true);
          expect(Number.isFinite(item.deltaAffinity), `Mission ${mission.id} item ${item.id} deltaAffinity is not finite`).toBe(true);
          expect(Number.isFinite(item.halfLifeMultiplier), `Mission ${mission.id} item ${item.id} halfLifeMultiplier is not finite`).toBe(true);
          expect(Number.isFinite(item.shieldingFactor), `Mission ${mission.id} item ${item.id} shieldingFactor is not finite`).toBe(true);
          expect(Number.isFinite(item.toxicityRisk), `Mission ${mission.id} item ${item.id} toxicityRisk is not finite`).toBe(true);
        }
      }
    });

    it('verifies that all socraticHintChain entries have length strictly === 3 and contain non-empty strings', () => {
      for (const mission of MEDICINAL_CHEMISTRY_MISSIONS) {
        expect(mission.socraticHintChain, `Mission ${mission.id} missing socraticHintChain`).toBeDefined();
        expect(Array.isArray(mission.socraticHintChain), `Mission ${mission.id} socraticHintChain must be array`).toBe(true);
        expect(
          mission.socraticHintChain.length,
          `Mission ${mission.id} socraticHintChain must have length 3, got ${mission.socraticHintChain.length}`
        ).toBe(3);

        mission.socraticHintChain.forEach((hint, index) => {
          expect(typeof hint, `Mission ${mission.id} hint ${index} must be string`).toBe('string');
          expect(hint.trim().length, `Mission ${mission.id} hint ${index} must not be empty`).toBeGreaterThan(0);
        });
      }
    });

    it('strictly forbids multiple_choice widgetType across all 21 missions and validates interactive widget types', () => {
      const allowedWidgets = new Set([
        'molecular_toolbox',
        'enzyme_cleavage_simulator',
        'receptor_pocket_fit',
        'patient_vitals_monitor',
      ]);

      for (const mission of MEDICINAL_CHEMISTRY_MISSIONS) {
        expect(mission.steps.length, `Mission ${mission.id} has no steps`).toBeGreaterThan(0);

        for (const step of mission.steps) {
          // Zero multiple-choice quiz questions allowed
          expect(
            (step.widgetType as string),
            `Violation: Mission ${mission.id} step ${step.id} uses multiple_choice widgetType!`
          ).not.toBe('multiple_choice');

          expect(
            allowedWidgets.has(step.widgetType),
            `Mission ${mission.id} step ${step.id} has unrecognized widgetType: ${step.widgetType}`
          ).toBe(true);

          expect(step.prompt.trim().length, `Mission ${mission.id} step ${step.id} prompt is empty`).toBeGreaterThan(0);
        }
      }
    });

    it('verifies clinicalCrisis and initialVitals validity for all 21 missions', () => {
      for (const mission of MEDICINAL_CHEMISTRY_MISSIONS) {
        const crisis = mission.clinicalCrisis;
        expect(crisis, `Mission ${mission.id} missing clinicalCrisis`).toBeDefined();
        expect(crisis.presentation.trim().length, `Mission ${mission.id} crisis presentation empty`).toBeGreaterThan(0);
        expect(crisis.vignette.trim().length, `Mission ${mission.id} crisis vignette empty`).toBeGreaterThan(0);
        expect(crisis.biochemicalFlaw.trim().length, `Mission ${mission.id} crisis biochemicalFlaw empty`).toBeGreaterThan(0);

        const vitals = crisis.patientInitialVitals;
        expect(vitals, `Mission ${mission.id} missing patientInitialVitals`).toBeDefined();
        expect(vitals.heartRateBpm).toBeGreaterThan(0);
        expect(vitals.bloodPressureSys).toBeGreaterThan(0);
        expect(vitals.bloodPressureDia).toBeGreaterThan(0);
        expect(['critical', 'unstable', 'stabilizing', 'normalized']).toContain(vitals.status);
      }
    });

    it('verifies victoryTrigger and pedagogical pearls for all 21 missions', () => {
      for (const mission of MEDICINAL_CHEMISTRY_MISSIONS) {
        const vic = mission.victoryTrigger;
        expect(vic, `Mission ${mission.id} missing victoryTrigger`).toBeDefined();
        expect(vic.conditionDescription.trim().length, `Mission ${mission.id} victory condition empty`).toBeGreaterThan(0);
        expect(vic.ahaExplanation.trim().length, `Mission ${mission.id} victory ahaExplanation empty`).toBeGreaterThan(0);
        expect(vic.pearl.trim().length, `Mission ${mission.id} victory pearl empty`).toBeGreaterThan(0);
      }
    });

    it('verifies that step availableToolIds and optimalToolId are valid within mission molecularToolbox', () => {
      for (const mission of MEDICINAL_CHEMISTRY_MISSIONS) {
        const toolboxIds = new Set(mission.molecularToolbox.map(t => t.id));

        for (const step of mission.steps) {
          if (step.availableToolIds) {
            expect(step.availableToolIds.length, `Mission ${mission.id} step ${step.id} has empty availableToolIds`).toBeGreaterThan(0);
            for (const toolId of step.availableToolIds) {
              expect(
                toolboxIds.has(toolId),
                `Mission ${mission.id} step ${step.id} availableToolId '${toolId}' does not exist in molecularToolbox`
              ).toBe(true);
            }
          }

          if (step.optimalToolId) {
            expect(
              toolboxIds.has(step.optimalToolId),
              `Mission ${mission.id} step ${step.id} optimalToolId '${step.optimalToolId}' does not exist in molecularToolbox`
            ).toBe(true);
            expect(
              mission.solutionItemIds.includes(step.optimalToolId),
              `Mission ${mission.id} step ${step.id} optimalToolId '${step.optimalToolId}' is not included in mission.solutionItemIds`
            ).toBe(true);
          }
        }
      }
    });

    it('verifies initialGauges and optimalGauges completeness for all 21 missions', () => {
      for (const mission of MEDICINAL_CHEMISTRY_MISSIONS) {
        const ig = mission.initialGauges;
        expect(Number.isFinite(ig.logP), `Mission ${mission.id} initial logP is not finite`).toBe(true);
        expect(Number.isFinite(ig.percentIonized), `Mission ${mission.id} initial percentIonized is not finite`).toBe(true);
        expect(Number.isFinite(ig.metabolicHalfLifeMinutes), `Mission ${mission.id} initial metabolicHalfLifeMinutes is not finite`).toBe(true);
        expect(Number.isFinite(ig.receptorAffinityDeltaG), `Mission ${mission.id} initial receptorAffinityDeltaG is not finite`).toBe(true);

        const og = mission.optimalGauges;
        expect(og, `Mission ${mission.id} optimalGauges missing`).toBeDefined();
        const hasAtLeastOneOptimal =
          og.logP !== undefined ||
          og.receptorAffinityDeltaG !== undefined ||
          og.metabolicHalfLifeMinutes !== undefined ||
          og.percentIonized !== undefined;
        expect(hasAtLeastOneOptimal, `Mission ${mission.id} optimalGauges has no target metrics`).toBe(true);
      }
    });
  });

  // ==========================================================================
  // 5. MISSION SOLUTION VALIDATOR ACROSS ALL 21 MISSIONS
  // ==========================================================================
  describe('5. Mission Solution Validator: validateMissionSolution', () => {
    it('awards 3 stars and 100 points on flawless canonical solution submission across all 21 missions', () => {
      for (const mission of MEDICINAL_CHEMISTRY_MISSIONS) {
        const res = validateMissionSolution(mission, mission.solutionItemIds, 0);
        expect(res.isSuccess, `Mission ${mission.id} failed valid solution`).toBe(true);
        expect(res.stars).toBe(3);
        expect(res.score).toBe(100);
        expect(res.clinicalExplanation).toBe(mission.victoryTrigger.ahaExplanation);
      }
    });

    it('rejects invalid / dummy tool choices with 0 stars and failure across all 21 missions', () => {
      for (const mission of MEDICINAL_CHEMISTRY_MISSIONS) {
        const res = validateMissionSolution(mission, ['invalid-dummy-tool-id-999'], 0);
        expect(res.isSuccess, `Mission ${mission.id} should fail on invalid item`).toBe(false);
        expect(res.stars).toBe(0);
        expect(res.score).toBe(25);
      }
    });

    it('correctly degrades star rating to 2 stars (85 points) on 1-2 mistakes and 1 star (70 points) on >= 3 mistakes', () => {
      const sampleMission = MEDICINAL_CHEMISTRY_MISSIONS[0];

      const res1Mistake = validateMissionSolution(sampleMission, sampleMission.solutionItemIds, 1);
      expect(res1Mistake.isSuccess).toBe(true);
      expect(res1Mistake.stars).toBe(2);
      expect(res1Mistake.score).toBe(85);

      const res2Mistakes = validateMissionSolution(sampleMission, sampleMission.solutionItemIds, 2);
      expect(res2Mistakes.isSuccess).toBe(true);
      expect(res2Mistakes.stars).toBe(2);
      expect(res2Mistakes.score).toBe(85);

      const res3Mistakes = validateMissionSolution(sampleMission, sampleMission.solutionItemIds, 3);
      expect(res3Mistakes.isSuccess).toBe(true);
      expect(res3Mistakes.stars).toBe(1);
      expect(res3Mistakes.score).toBe(70);

      const res5Mistakes = validateMissionSolution(sampleMission, sampleMission.solutionItemIds, 5);
      expect(res5Mistakes.isSuccess).toBe(true);
      expect(res5Mistakes.stars).toBe(1);
      expect(res5Mistakes.score).toBe(70);
    });
  });
});
