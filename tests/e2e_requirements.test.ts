import { describe, it, expect } from 'vitest';
import itemsPkSeed from '../seed/items_pk.json';
import {
  CockcroftGaultEngine,
} from '../src/lib/engines/cockcroftGault';
import {
  GentamicinEngine,
} from '../src/lib/engines/gentamicin';
import {
  TheophyllineEngine,
} from '../src/lib/engines/theophylline';
import {
  CockcroftGaultInput,
  GentamicinEliminationInput,
  TheophyllineInput,
  EngineValidationError,
} from '../src/lib/engines/types';
import {
  calculateRetrievability,
  scheduleNextReview,
  updateMasteryScore,
  FSRSReviewScheduleResult,
} from '../src/lib/engines/fsrs';
import {
  SocraticTurnSchema,
  generateDeterministicFallbackTurn,
  SocraticRequest,
} from '../src/worker/socraticFSM';
import workerHandler, { Env } from '../src/worker/index';

/**
 * ============================================================================
 * CENNA.LIVE PEDAGOGICAL ENGINE — E2E REQUIREMENT-DRIVEN TEST SUITE
 * ============================================================================
 * Coverage Map:
 *   - Tier 1: Feature Coverage (F1 to F13) [>=5 tests per feature]
 *   - Tier 2: Boundary & Corner Cases (F1 to F13) [>=5 tests per feature]
 *   - Tier 3: Cross-Feature Interactions & Pedagogical Pipelines
 *   - Tier 4: Real-World Clinical Application Scenarios (Seed Items & Clinical TDM)
 * ============================================================================
 */

describe('CENNA.live E2E Requirements Suite', () => {
  const cgEngine = new CockcroftGaultEngine();
  const gentaEngine = new GentamicinEngine();
  const theoEngine = new TheophyllineEngine();

  function expectValidationError(fn: () => void, expectedCode: string) {
    try {
      fn();
      expect.unreachable('Expected function to throw EngineValidationError');
    } catch (e: any) {
      expect(e).toBeInstanceOf(EngineValidationError);
      expect(e.code).toBe(expectedCode);
    }
  }

  // ==========================================================================
  // TIER 1: FEATURE COVERAGE (F1 – F13)
  // ==========================================================================

  describe('Tier 1: Feature Coverage', () => {
    // ------------------------------------------------------------------------
    // F1: Cockcroft-Gault Engine Hardening
    // ------------------------------------------------------------------------
    describe('F1: Cockcroft-Gault Engine', () => {
      it('F1-1: calculates normal male patient IBW, weight selection, and CrCl accurately', () => {
        const input: CockcroftGaultInput = {
          age: 50,
          sex: 'M',
          heightCm: 175,
          tbwKg: 75,
          scrValue: 1.0,
        };
        const ibw = cgEngine.calculateIBW(input);
        expect(ibw).toBeCloseTo(70.46, 1);

        const selection = cgEngine.selectWeight(input, ibw);
        expect(selection.weight).toBeCloseTo(70.46, 1);
        expect(selection.reason).toBe('IDEAL_BW_NORMAL');

        const crcl = cgEngine.calculateCrCl(input, selection.weight);
        expect(crcl).toBeCloseTo(88.08, 1);

        const evaluation = cgEngine.evaluate(input, {
          ibw: 70.46,
          weightUsed: 70.46,
          finalCrCl: 88.08,
        });
        expect(evaluation.isFullyCorrect).toBe(true);
        expect(evaluation.stepEvaluations.every((s) => s.isCorrect)).toBe(true);
      });

      it('F1-2: calculates obese female patient using Adjusted Body Weight (DVA)', () => {
        const input: CockcroftGaultInput = {
          age: 64,
          sex: 'F',
          heightCm: 160,
          tbwKg: 85,
          scrValue: 1.4,
        };
        const ibw = cgEngine.calculateIBW(input);
        expect(ibw).toBeCloseTo(52.38, 1);

        const selection = cgEngine.selectWeight(input, ibw);
        expect(selection.reason).toBe('ADJUSTED_BW_OVER_120_IBW');
        expect(selection.weight).toBeCloseTo(65.43, 1);

        const crcl = cgEngine.calculateCrCl(input, selection.weight);
        expect(crcl).toBeCloseTo(41.93, 1);
      });

      it('F1-3: handles underweight patient by selecting Total Body Weight (TBW)', () => {
        const input: CockcroftGaultInput = {
          age: 30,
          sex: 'F',
          heightCm: 165,
          tbwKg: 42,
          scrValue: 0.8,
        };
        const ibw = cgEngine.calculateIBW(input);
        expect(ibw).toBeGreaterThan(42);

        const selection = cgEngine.selectWeight(input, ibw);
        expect(selection.weight).toBe(42);
        expect(selection.reason).toBe('TBW_LESS_THAN_IBW');
      });

      it('F1-4: isolates misconception when female factor 0.85 is omitted', () => {
        const input: CockcroftGaultInput = {
          age: 64,
          sex: 'F',
          heightCm: 160,
          tbwKg: 85,
          scrValue: 1.4,
        };
        const rawUnadjusted = 49.33; // without 0.85
        const evaluation = cgEngine.evaluate(input, {
          ibw: 52.38,
          weightUsed: 65.43,
          finalCrCl: rawUnadjusted,
        });

        expect(evaluation.isFullyCorrect).toBe(false);
        expect(evaluation.firstFailingNodeId).toBe('crcl_final_node');
        expect(evaluation.primaryMisconceptionTag).toBe('MISSED_FEMALE_FACTOR_0_85');
      });

      it('F1-5: isolates misconception when TBW is used instead of DVA in obesity', () => {
        const input: CockcroftGaultInput = {
          age: 64,
          sex: 'F',
          heightCm: 160,
          tbwKg: 85,
          scrValue: 1.4,
        };
        const evaluation = cgEngine.evaluate(input, {
          ibw: 52.38,
          weightUsed: 85.0,
          finalCrCl: 54.46,
        });

        expect(evaluation.isFullyCorrect).toBe(false);
        expect(evaluation.firstFailingNodeId).toBe('weight_selection_node');
        expect(evaluation.primaryMisconceptionTag).toBe('USED_TBW_INSTEAD_OF_ADJ_OR_IBW');
      });

      it('F1-6: isolates misconception when IBW is used without obesity adjustment', () => {
        const input: CockcroftGaultInput = {
          age: 64,
          sex: 'F',
          heightCm: 160,
          tbwKg: 85,
          scrValue: 1.4,
        };
        const evaluation = cgEngine.evaluate(input, {
          ibw: 52.38,
          weightUsed: 52.38,
          finalCrCl: 33.56,
        });

        expect(evaluation.isFullyCorrect).toBe(false);
        expect(evaluation.firstFailingNodeId).toBe('weight_selection_node');
        expect(evaluation.primaryMisconceptionTag).toBe('USED_IBW_WITHOUT_OBESITY_ADJUSTMENT');
      });
    });

    // ------------------------------------------------------------------------
    // F2: Gentamicin Elimination Engine
    // ------------------------------------------------------------------------
    describe('F2: Gentamicin Elimination Engine', () => {
      const gentaInput: GentamicinEliminationInput = {
        t1Hours: 2,
        c1MgL: 8,
        t2Hours: 6,
        c2MgL: 2,
      };

      it('F2-1: computes Delta t, ke, and half-life accurately', () => {
        const deltaT = gentaEngine.calculateDeltaT(gentaInput);
        expect(deltaT).toBe(4.0);

        const ke = gentaEngine.calculateKe(gentaInput);
        expect(ke).toBeCloseTo(0.3466, 3);

        const tHalf = gentaEngine.calculateHalfLife(ke);
        expect(tHalf).toBeCloseTo(2.0, 2);
      });

      it('F2-2: evaluates fully correct 3-node student derivation', () => {
        const res = gentaEngine.evaluate(gentaInput, {
          deltaT: 4.0,
          ke: 0.3466,
          halfLife: 2.0,
        });

        expect(res.isFullyCorrect).toBe(true);
        expect(res.stepEvaluations).toHaveLength(3);
        expect(res.output.halfLifeHours).toBeCloseTo(2.0, 2);
        expect(res.stepEvaluations.every((s) => s.isCorrect)).toBe(true);
      });

      it('F2-3: isolates misconception when ke is confused with half-life', () => {
        const res = gentaEngine.evaluate(gentaInput, {
          deltaT: 4.0,
          ke: 0.3466,
          halfLife: 0.34, // Submitted ke as t1/2!
        });

        expect(res.isFullyCorrect).toBe(false);
        expect(res.firstFailingNodeId).toBe('half_life_node');
        expect(res.primaryMisconceptionTag).toBe('CONFUSED_KE_WITH_HALF_LIFE');
      });

      it('F2-4: isolates misconception when Delta t is divided by concentration ratio', () => {
        const res = gentaEngine.evaluate(gentaInput, {
          deltaT: 4.0,
          ke: 0.3466,
          halfLife: 4.0, // 4.00 h
        });

        expect(res.isFullyCorrect).toBe(false);
        expect(res.firstFailingNodeId).toBe('half_life_node');
        expect(res.primaryMisconceptionTag).toBe('DELTA_T_DIVIDED_BY_RATIO_ERROR');
      });

      it('F2-5: isolates misconception when dividing by ln2 instead of multiplying', () => {
        const res = gentaEngine.evaluate(gentaInput, {
          deltaT: 4.0,
          ke: 0.3466,
          halfLife: 1.38, // 1.38 h
        });

        expect(res.isFullyCorrect).toBe(false);
        expect(res.firstFailingNodeId).toBe('half_life_node');
        expect(res.primaryMisconceptionTag).toBe('DIVIDED_BY_LN2_INSTEAD_OF_MULTIPLIED');
      });

      it('F2-6: isolates base-10 log confusion in ke derivation node', () => {
        // log10(8/2) / 4 = log10(4) / 4 = 0.60206 / 4 = 0.1505
        const res = gentaEngine.evaluate(gentaInput, {
          deltaT: 4.0,
          ke: 0.1505,
          halfLife: 4.6,
        });

        expect(res.isFullyCorrect).toBe(false);
        expect(res.firstFailingNodeId).toBe('ke_node');
        expect(res.primaryMisconceptionTag).toBe('NATURAL_LOG_BASE_10_CONFUSION');
      });
    });

    // ------------------------------------------------------------------------
    // F3: Theophylline Loading Dose Engine
    // ------------------------------------------------------------------------
    describe('F3: Theophylline Loading Dose Engine', () => {
      const theoAnhydrousInput: TheophyllineInput = {
        vdL: 35,
        cTargetMgL: 15,
        cInitialMgL: 0,
        saltForm: 'theophylline_anhydrous',
      };

      it('F3-1: calculates target mass and loading dose for theophylline anhydrous (S=1.0)', () => {
        const targetMass = theoEngine.calculateTargetMass(theoAnhydrousInput);
        expect(targetMass).toBe(525.0);

        const ld = theoEngine.calculateLoadingDose(theoAnhydrousInput);
        expect(ld).toBe(525.0);

        const res = theoEngine.evaluate(theoAnhydrousInput, {
          targetMassMg: 525,
          saltFactor: 1.0,
          loadingDoseMg: 525,
        });
        expect(res.isFullyCorrect).toBe(true);
        expect(res.output.loadingDoseMg).toBe(525);
      });

      it('F3-2: calculates loading dose for aminophylline (S=0.8)', () => {
        const aminoInput: TheophyllineInput = {
          vdL: 35,
          cTargetMgL: 15,
          cInitialMgL: 0,
          saltForm: 'aminophylline',
        };
        const ld = theoEngine.calculateLoadingDose(aminoInput);
        // 525 / 0.8 = 656.25 mg
        expect(ld).toBe(656.25);

        const res = theoEngine.evaluate(aminoInput, {
          targetMassMg: 525,
          saltFactor: 0.8,
          loadingDoseMg: 656.25,
        });
        expect(res.isFullyCorrect).toBe(true);
      });

      it('F3-3: isolates misconception when aminophylline factor S=0.8 is applied to anhydrous', () => {
        const res = theoEngine.evaluate(theoAnhydrousInput, {
          targetMassMg: 525,
          saltFactor: 0.8, // Erroneous salt factor!
          loadingDoseMg: 656.25,
        });

        expect(res.isFullyCorrect).toBe(false);
        expect(res.firstFailingNodeId).toBe('salt_factor_node');
        expect(res.primaryMisconceptionTag).toBe(
          'ERRONEOUSLY_DIVIDED_BY_AMINOPHYLLINE_SALT_FACTOR'
        );
      });

      it('F3-4: isolates misconception when Vd equation is inverted (Vd / Ctarget)', () => {
        const res = theoEngine.evaluate(theoAnhydrousInput, {
          targetMassMg: 2.33, // 35 / 15 = 2.33
          saltFactor: 1.0,
          loadingDoseMg: 2.33,
        });

        expect(res.isFullyCorrect).toBe(false);
        expect(res.firstFailingNodeId).toBe('target_mass_node');
        expect(res.primaryMisconceptionTag).toBe('INVERTED_VD_EQUATION');
      });

      it('F3-5: isolates misconception when clearance product is misapplied instead of Vd', () => {
        const res = theoEngine.evaluate(theoAnhydrousInput, {
          targetMassMg: 420.0,
          saltFactor: 1.0,
          loadingDoseMg: 420.0,
        });

        expect(res.isFullyCorrect).toBe(false);
        expect(res.firstFailingNodeId).toBe('target_mass_node');
        expect(res.primaryMisconceptionTag).toBe('MISAPPLIED_CLEARANCE_PRODUCT');
      });

      it('F3-6: calculates loading dose accurately when non-zero baseline C0 exists', () => {
        const inputWithBaseline: TheophyllineInput = {
          vdL: 35,
          cTargetMgL: 15,
          cInitialMgL: 5, // baseline
          saltForm: 'theophylline_anhydrous',
        };
        // Delta C = 15 - 5 = 10; Target mass = 35 * 10 = 350 mg; DL = 350 mg
        expect(theoEngine.calculateTargetMass(inputWithBaseline)).toBe(350);
        expect(theoEngine.calculateLoadingDose(inputWithBaseline)).toBe(350);
      });
    });

    // ------------------------------------------------------------------------
    // F4: Engine Shared Types & Framework
    // ------------------------------------------------------------------------
    describe('F4: Shared Types & DAG Framework', () => {
      it('F4-1: guarantees all three engines implement standard EngineResult contract', () => {
        const cgRes = cgEngine.evaluate({
          age: 40,
          sex: 'M',
          heightCm: 180,
          tbwKg: 75,
          scrValue: 1.0,
        });
        const gentaRes = gentaEngine.evaluate({
          t1Hours: 2,
          c1MgL: 8,
          t2Hours: 6,
          c2MgL: 2,
        });
        const theoRes = theoEngine.evaluate({
          vdL: 35,
          cTargetMgL: 15,
          saltForm: 'theophylline_anhydrous',
        });

        expect(cgRes.engineId).toBe('cockcroft_gault');
        expect(gentaRes.engineId).toBe('gentamicin_elimination');
        expect(theoRes.engineId).toBe('theophylline_loading_dose');

        expect(cgRes.stepEvaluations).toHaveLength(3);
        expect(gentaRes.stepEvaluations).toHaveLength(3);
        expect(theoRes.stepEvaluations).toHaveLength(3);
      });

      it('F4-2: validates BaseEvaluationNode structure across all engines', () => {
        const gentaRes = gentaEngine.evaluate({
          t1Hours: 2,
          c1MgL: 8,
          t2Hours: 6,
          c2MgL: 2,
        });
        for (const step of gentaRes.stepEvaluations) {
          expect(typeof step.nodeId).toBe('string');
          expect(typeof step.nodeNameTr).toBe('string');
          expect(typeof step.expectedValue).toBe('number');
          expect(typeof step.isCorrect).toBe('boolean');
          expect(typeof step.relativeErrorPct).toBe('number');
          expect(typeof step.hintTr).toBe('string');
        }
      });

      it('F4-3: sets firstFailingNodeId to earliest failure in DAG sequence', () => {
        const cgRes = cgEngine.evaluate(
          { age: 64, sex: 'F', heightCm: 160, tbwKg: 85, scrValue: 1.4 },
          { ibw: 99.9, weightUsed: 99.9, finalCrCl: 99.9 }
        );
        expect(cgRes.firstFailingNodeId).toBe('ibw_node');
      });

      it('F4-4: throws typed EngineValidationError on domain boundary violations', () => {
        expect(() =>
          cgEngine.validateInput({
            age: 12, // Pediatric not supported
            sex: 'M',
            heightCm: 170,
            tbwKg: 70,
            scrValue: 1.0,
          })
        ).toThrow(EngineValidationError);

        try {
          cgEngine.validateInput({
            age: 12,
            sex: 'M',
            heightCm: 170,
            tbwKg: 70,
            scrValue: 1.0,
          });
        } catch (e: any) {
          expect(e.code).toBe('ERR_INVALID_AGE');
        }
      });

      it('F4-5: maintains DAG node evaluation order (Delta t -> ke -> t1/2)', () => {
        const gentaRes = gentaEngine.evaluate({
          t1Hours: 2,
          c1MgL: 8,
          t2Hours: 6,
          c2MgL: 2,
        });
        expect(gentaRes.stepEvaluations[0].nodeId).toBe('delta_t_node');
        expect(gentaRes.stepEvaluations[1].nodeId).toBe('ke_node');
        expect(gentaRes.stepEvaluations[2].nodeId).toBe('half_life_node');
      });
    });

    // ------------------------------------------------------------------------
    // F5: Socratic Dialogue FSM & Turn Budget
    // ------------------------------------------------------------------------
    describe('F5: Socratic FSM & Turn Budget', () => {
      it('F5-1: parses valid SocraticTurn conforming to 3-sentence schema', () => {
        const validTurn = {
          clinical_observation_tr:
            'Kreatinin üretiminin kas kitlesi ile ilişkisini göz önünde bulundurunuz.',
          conceptual_pivot_tr:
            'Kadın ve erkeklerde ortalama fizyolojik kas kitlesi farklıdır.',
          actionable_question_tr:
            'Kadın hastalarda Cockcroft-Gault sonucuna hangi çarpan uygulanmalıdır?',
          current_state: 'PROBE' as const,
          misconception_tag: 'MISSED_FEMALE_FACTOR_0_85',
          reveals_answer: false as const,
        };

        const result = SocraticTurnSchema.safeParse(validTurn);
        expect(result.success).toBe(true);
      });

      it('F5-2: strictly rejects turns that reveal answer (reveals_answer: true)', () => {
        const leakingTurn = {
          clinical_observation_tr: 'Yanlış hesapladınız.',
          conceptual_pivot_tr: 'Cevabınız 41.93 olmalıydı.',
          actionable_question_tr: 'Anladınız mı?',
          current_state: 'PROBE' as const,
          misconception_tag: 'MISSED_FEMALE_FACTOR_0_85',
          reveals_answer: true,
        };

        const result = SocraticTurnSchema.safeParse(leakingTurn);
        expect(result.success).toBe(false);
      });

      it('F5-3: escalates to DIRECT_TEACH when turnCount reaches budget (N >= 4)', () => {
        const req: SocraticRequest = {
          conceptName: 'Cockcroft-Gault CrCl',
          misconceptionTag: 'MISSED_FEMALE_FACTOR_0_85',
          studentInput: 'Sonucu hala bulamadım.',
          turnCount: 4,
        };
        const turn = generateDeterministicFallbackTurn(req);
        expect(turn.current_state).toBe('DIRECT_TEACH');
        expect(turn.reveals_answer).toBe(false);
      });

      it('F5-4: operates in PROBE state during initial dialogue turns (Turn 1 and 2)', () => {
        const req: SocraticRequest = {
          conceptName: 'Gentamicin Ke',
          misconceptionTag: 'CONFUSED_KE_WITH_HALF_LIFE',
          studentInput: 'Hız sabitini buldum ama yarı ömür nasıl?',
          turnCount: 1,
        };
        const turn = generateDeterministicFallbackTurn(req);
        expect(turn.current_state).toBe('PROBE');
      });

      it('F5-5: operates in PATCH state during turn 3 before budget exhaustion', () => {
        const req: SocraticRequest = {
          conceptName: 'Gentamicin Ke',
          misconceptionTag: 'CONFUSED_KE_WITH_HALF_LIFE',
          studentInput: 'Yarı ömür ke değerine eşit değil mi?',
          turnCount: 3,
        };
        const turn = generateDeterministicFallbackTurn(req);
        expect(turn.current_state).toBe('PATCH');
      });
    });

    // ------------------------------------------------------------------------
    // F6: Deterministic Clinical Preceptor
    // ------------------------------------------------------------------------
    describe('F6: Deterministic Clinical Preceptor Fallback', () => {
      it('F6-1: generates clinical response for MISSED_FEMALE_FACTOR_0_85', () => {
        const turn = generateDeterministicFallbackTurn({
          conceptName: 'CrCl',
          misconceptionTag: 'MISSED_FEMALE_FACTOR_0_85',
          studentInput: 'Nerede hata yaptım?',
          turnCount: 1,
        });
        expect(turn.misconception_tag).toBe('MISSED_FEMALE_FACTOR_0_85');
        expect(turn.actionable_question_tr).toContain('çarpan');
      });

      it('F6-2: generates clinical response for USED_TBW_INSTEAD_OF_ADJ_OR_IBW', () => {
        const turn = generateDeterministicFallbackTurn({
          conceptName: 'CrCl',
          misconceptionTag: 'USED_TBW_INSTEAD_OF_ADJ_OR_IBW',
          studentInput: '85 kg aldım.',
          turnCount: 1,
        });
        expect(turn.misconception_tag).toBe('USED_TBW_INSTEAD_OF_ADJ_OR_IBW');
        expect(turn.actionable_question_tr).toContain('İVA');
      });

      it('F6-3: generates clinical response for CONFUSED_KE_WITH_HALF_LIFE', () => {
        const turn = generateDeterministicFallbackTurn({
          conceptName: 'Gentamicin',
          misconceptionTag: 'CONFUSED_KE_WITH_HALF_LIFE',
          studentInput: '0.35 buldum.',
          turnCount: 1,
        });
        expect(turn.misconception_tag).toBe('CONFUSED_KE_WITH_HALF_LIFE');
        expect(turn.actionable_question_tr).toContain('0.693');
      });

      it('F6-4: provides general calculation guidance on unrecognized misconception tags', () => {
        const turn = generateDeterministicFallbackTurn({
          conceptName: 'Genel',
          misconceptionTag: 'UNKNOWN_CUSTOM_TAG',
          studentInput: 'Hata aldım',
          turnCount: 1,
        });
        expect(turn.current_state).toBe('PROBE');
        expect(turn.reveals_answer).toBe(false);
      });

      it('F6-5: never reveals final numerical values in preceptor responses', () => {
        const tags = [
          'MISSED_FEMALE_FACTOR_0_85',
          'USED_TBW_INSTEAD_OF_ADJ_OR_IBW',
          'USED_IBW_WITHOUT_OBESITY_ADJUSTMENT',
          'CONFUSED_KE_WITH_HALF_LIFE',
          'GENERAL_ERROR',
        ];
        for (const tag of tags) {
          const turn = generateDeterministicFallbackTurn({
            conceptName: 'PK',
            misconceptionTag: tag,
            studentInput: 'Cevap nedir?',
            turnCount: 2,
          });
          expect(turn.reveals_answer).toBe(false);
          expect(turn.clinical_observation_tr).not.toMatch(/\b41\.93\b/);
          expect(turn.conceptual_pivot_tr).not.toMatch(/\b41\.93\b/);
          expect(turn.actionable_question_tr).not.toMatch(/\b41\.93\b/);
        }
      });
    });

    // ------------------------------------------------------------------------
    // F7: OpenRouter Model Cascade & Redirection Guardrail
    // ------------------------------------------------------------------------
    describe('F7: Model Cascade & Clinical Consultation Refusal', () => {
      it('F7-1: worker intercept handles OPTIONS preflight with CORS headers', async () => {
        const req = new Request('http://localhost/api/tutor/turn', {
          method: 'OPTIONS',
        });
        const res = await workerHandler.fetch(req, {});
        expect(res.status).toBe(200);
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
      });

      it('F7-2: refuses live patient consultation and redirects safely', async () => {
        const liveConsultationPrompt =
          'Bu hasta 64 yaşında bir kadın, kreatinin değeri yüksek, ne vermeliyim doz önerisi nedir lütfen acil söyleyin?';
        const req = new Request('http://localhost/api/tutor/turn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conceptName: 'Acil Tedavi',
            misconceptionTag: 'NONE',
            studentInput: liveConsultationPrompt,
            turnCount: 1,
          }),
        });

        const res = await workerHandler.fetch(req, {});
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.reveals_answer).toBe(false);
        expect(data.clinical_observation_tr).toContain('sentetik');
        expect(data.conceptual_pivot_tr).toContain('kapsamı dışındadır');
      });

      it('F7-3: uses deterministic fallback when OpenRouter API key is not configured', async () => {
        const req = new Request('http://localhost/api/tutor/turn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conceptName: 'Cockcroft-Gault',
            misconceptionTag: 'MISSED_FEMALE_FACTOR_0_85',
            studentInput: 'Kadın katsayısını unuttum',
            turnCount: 1,
          }),
        });
        const env: Env = {}; // No API key
        const res = await workerHandler.fetch(req, env);
        expect(res.status).toBe(200);
        const turn = await res.json();
        expect(turn.reveals_answer).toBe(false);
        expect(turn.misconception_tag).toBe('MISSED_FEMALE_FACTOR_0_85');
      });

      it('F7-4: returns 405 Method Not Allowed on non-POST requests', async () => {
        const req = new Request('http://localhost/api/tutor/turn', {
          method: 'GET',
        });
        const res = await workerHandler.fetch(req, {});
        expect(res.status).toBe(405);
      });

      it('F7-5: guarantees refusal responses comply with SocraticTurnSchema', async () => {
        const req = new Request('http://localhost/api/tutor/turn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conceptName: 'Hasta',
            misconceptionTag: null,
            studentInput:
              'Gerçek bir hasta var elimizde, kadın 70 yaşında, ne vermeliyim doz önerisi bekliyorum acil klinik karar lazım.',
            turnCount: 1,
          }),
        });
        const res = await workerHandler.fetch(req, {});
        const turn = await res.json();
        const parsed = SocraticTurnSchema.safeParse(turn);
        expect(parsed.success).toBe(true);
      });
    });

    // ------------------------------------------------------------------------
    // F8: FSRS Spaced Repetition Scheduling
    // ------------------------------------------------------------------------
    describe('F8: FSRS Spaced Repetition Scheduling', () => {
      it('F8-1: computes retrievability decay satisfying R(0, S) = 1.0 and R(S, S) = 0.90', () => {
        const s = 10; // 10 days stability
        expect(calculateRetrievability(s, 0)).toBe(1.0);
        expect(calculateRetrievability(s, s)).toBeCloseTo(0.9, 4);
      });

      it('F8-2: computes correct retrievability decay over elapsed time', () => {
        const s = 10;
        const r1 = calculateRetrievability(s, 5);
        const r2 = calculateRetrievability(s, 10);
        const r3 = calculateRetrievability(s, 20);

        expect(r1).toBeGreaterThan(r2);
        expect(r2).toBeGreaterThan(r3);
        expect(r3).toBeGreaterThan(0.0);
      });

      it('F8-3: scales stability by 2.8x on Confidence 5 (Easy) correct answer', () => {
        const now = new Date('2026-10-01T12:00:00Z');
        const res = scheduleNextReview(
          { stability: 2.0, difficulty: 5.0 },
          { isCorrect: true, confidence: 5, now }
        );

        // 2.0 * 2.8 = 5.6 days
        expect(res.stability).toBeCloseTo(5.6, 2);
        expect(res.intervalDays).toBe(6); // round(5.6) = 6
        expect(res.isHypercorrection).toBe(false);
      });

      it('F8-4: scales stability by 2.0x on Confidence 4 (Good) correct answer', () => {
        const res = scheduleNextReview(
          { stability: 3.0, difficulty: 5.0 },
          { isCorrect: true, confidence: 4 }
        );
        // 3.0 * 2.0 = 6.0 days
        expect(res.stability).toBeCloseTo(6.0, 2);
        expect(res.intervalDays).toBe(6);
        expect(res.difficulty).toBe(5.0); // unchanged
      });

      it('F8-5: scales stability moderately on Confidence 3 (Hard) and adjusts difficulty', () => {
        const res = scheduleNextReview(
          { stability: 4.0, difficulty: 5.0 },
          { isCorrect: true, confidence: 3 }
        );
        // 4.0 * 1.25 = 5.0 days
        expect(res.stability).toBeCloseTo(5.0, 2);
        expect(res.difficulty).toBeCloseTo(5.2, 2);
      });

      it('F8-6: handles low confidence (1-2) correct answers with minimal scaling', () => {
        const res = scheduleNextReview(
          { stability: 4.0, difficulty: 5.0 },
          { isCorrect: true, confidence: 2 }
        );
        // max(1.0, 4.0 * 1.05) = 4.2 days
        expect(res.stability).toBeCloseTo(4.2, 2);
        expect(res.difficulty).toBeCloseTo(5.4, 2);
      });
    });

    // ------------------------------------------------------------------------
    // F9: Hypercorrection & Mastery Theta
    // ------------------------------------------------------------------------
    describe('F9: Hypercorrection & Concept Mastery', () => {
      it('F9-1: triggers hypercorrection on Confidence 4 error, resetting S=0 and scheduling in 24h', () => {
        const now = new Date('2026-10-07T10:00:00Z');
        const res = scheduleNextReview(
          { stability: 5.0, difficulty: 4.0 },
          { isCorrect: false, confidence: 4, now }
        );

        expect(res.stability).toBe(0.0);
        expect(res.isHypercorrection).toBe(true);
        expect(res.intervalDays).toBe(1);
        expect(res.dueAt).toBe(new Date('2026-10-08T10:00:00Z').toISOString());
        expect(res.difficulty).toBeCloseTo(5.5, 2);
      });

      it('F9-2: triggers hypercorrection on Confidence 5 error, resetting S=0', () => {
        const res = scheduleNextReview(
          { stability: 8.0, difficulty: 3.0 },
          { isCorrect: false, confidence: 5 }
        );
        expect(res.stability).toBe(0.0);
        expect(res.isHypercorrection).toBe(true);
        expect(res.intervalDays).toBe(1);
      });

      it('F9-3: treats Confidence < 4 error as standard lapse without hypercorrection flag', () => {
        const res = scheduleNextReview(
          { stability: 4.0, difficulty: 5.0 },
          { isCorrect: false, confidence: 3 }
        );
        // Lapse stability: max(0.2, 4.0 * 0.25) = 1.0
        expect(res.stability).toBeCloseTo(1.0, 2);
        expect(res.isHypercorrection).toBe(false);
        expect(res.intervalDays).toBe(1);
      });

      it('F9-4: applies hypercorrection penalty of -0.25 to mastery score theta', () => {
        const updatedTheta = updateMasteryScore(0.6, {
          isCorrect: false,
          confidence: 4,
        });
        expect(updatedTheta).toBeCloseTo(0.35, 2);
      });

      it('F9-5: clamps mastery score theta strictly within [0.0, 1.0]', () => {
        const clampedLower = updateMasteryScore(0.1, {
          isCorrect: false,
          confidence: 5, // -0.25 penalty
        });
        expect(clampedLower).toBe(0.0);

        const clampedUpper = updateMasteryScore(0.95, {
          isCorrect: true,
          confidence: 5, // +0.20 reward
        });
        expect(clampedUpper).toBe(1.0);
      });
    });

    // ------------------------------------------------------------------------
    // F10 – F13: Pedagogical UI, Error Clinic & Telemetry Contracts
    // ------------------------------------------------------------------------
    describe('F10–F13: Clinical Seed Items & Telemetry Data Contracts', () => {
      it('F10-1: seed items contain exactly 3 validated clinical PK scenarios', () => {
        expect(itemsPkSeed).toHaveLength(3);
        const slugs = itemsPkSeed.map((i) => i.slug);
        expect(slugs).toContain('crcl-obese-female-ceftazidime');
        expect(slugs).toContain('pk-ke-half-life-gentamicin');
        expect(slugs).toContain('pk-vd-loading-dose-theophylline');
      });

      it('F11-1: every seed distractor maps to a recognized misconception tag', () => {
        for (const item of itemsPkSeed) {
          expect(item.distractors.length).toBeGreaterThanOrEqual(3);
          for (const d of item.distractors) {
            expect(d.misconception_tag).toBeTruthy();
            expect(typeof d.misconception_tag).toBe('string');
            expect(d.misconception_tag.length).toBeGreaterThan(3);
          }
        }
      });

      it('F12-1: validates Next-Time Rule entity schema for notebook persistence', () => {
        const sampleRule = {
          id: 'rule-uuid-1',
          user_id: 'user-uuid-1',
          concept_id: 'crcl-concept',
          rule_text: 'Obez hastada her zaman DVA kullan, TVA değil.',
          created_at: new Date().toISOString(),
        };
        expect(sampleRule.rule_text.length).toBeGreaterThan(10);
        expect(typeof sampleRule.concept_id).toBe('string');
      });

      it('F13-1: generates compliant telemetry attempt payload', () => {
        const payload = {
          itemId: 'crcl-obese-female-ceftazidime',
          conceptId: 'crcl_obesity',
          selectedKey: 'B',
          confidence: 5,
          isCorrect: false,
          primaryMisconceptionTag: 'USED_TBW_INSTEAD_OF_ADJ_OR_IBW',
          firstFailingNodeId: 'weight_selection_node',
        };

        const schedule: FSRSReviewScheduleResult = scheduleNextReview(
          { stability: 1.0, difficulty: 5.0 },
          { isCorrect: payload.isCorrect, confidence: payload.confidence }
        );

        expect(schedule.isHypercorrection).toBe(true);
        expect(schedule.stability).toBe(0.0);
        expect(schedule.intervalDays).toBe(1);
      });
    });
  });

  // ==========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (F1 – F13)
  // ==========================================================================

  describe('Tier 2: Boundary & Corner Cases', () => {
    // ------------------------------------------------------------------------
    // F1 Boundaries
    // ------------------------------------------------------------------------
    describe('F1 Boundaries (Cockcroft-Gault)', () => {
      it('B1-1: supports adult age limits (18 years and 120 years)', () => {
        const youngAdult: CockcroftGaultInput = {
          age: 18,
          sex: 'M',
          heightCm: 175,
          tbwKg: 70,
          scrValue: 1.0,
        };
        expect(cgEngine.calculateCrCl(youngAdult, 70)).toBeGreaterThan(0);

        const centenarian: CockcroftGaultInput = {
          age: 120,
          sex: 'M',
          heightCm: 165,
          tbwKg: 55,
          scrValue: 1.0,
        };
        expect(cgEngine.calculateCrCl(centenarian, 55)).toBeGreaterThan(0);
      });

      it('B1-2: rejects age < 18 with ERR_INVALID_AGE', () => {
        expect(() =>
          cgEngine.validateInput({
            age: 17,
            sex: 'M',
            heightCm: 170,
            tbwKg: 65,
            scrValue: 1.0,
          })
        ).toThrowError(/18 ile 120/);
      });

      it('B1-3: rejects extreme height and weight boundaries', () => {
        expectValidationError(
          () =>
            cgEngine.validateInput({
              age: 40,
              sex: 'M',
              heightCm: 90, // < 100 cm
              tbwKg: 70,
              scrValue: 1.0,
            }),
          'ERR_INVALID_HEIGHT'
        );

        expectValidationError(
          () =>
            cgEngine.validateInput({
              age: 40,
              sex: 'M',
              heightCm: 170,
              tbwKg: 380, // > 350 kg
              scrValue: 1.0,
            }),
          'ERR_INVALID_WEIGHT'
        );
      });

      it('B1-4: converts umol/L SCr to mg/dL yielding equivalent CrCl within 0.1%', () => {
        const inputMgDl: CockcroftGaultInput = {
          age: 64,
          sex: 'F',
          heightCm: 160,
          tbwKg: 85,
          scrValue: 1.4,
          scrUnit: 'mg/dL',
        };
        // 1.4 * 88.4 = 123.76 umol/L
        const inputUmol: CockcroftGaultInput = {
          age: 64,
          sex: 'F',
          heightCm: 160,
          tbwKg: 85,
          scrValue: 123.76,
          scrUnit: 'umol/L',
        };

        const crcl1 = cgEngine.calculateCrCl(inputMgDl, 65.43);
        const crcl2 = cgEngine.calculateCrCl(inputUmol, 65.43);
        expect(Math.abs(crcl1 - crcl2) / crcl1).toBeLessThan(0.005);
      });

      it('B1-5: enforces elderly SCr capping when enabled for age >= 65', () => {
        const elderlyPatient: CockcroftGaultInput = {
          age: 78,
          sex: 'F',
          heightCm: 155,
          tbwKg: 50,
          scrValue: 0.5, // Low SCr due to sarcopenia
          options: {
            elderlyScrCapping: true,
            elderlyScrFloor: 0.8,
          },
        };

        const { effectiveScrMgDl, wasCapped } =
          cgEngine.getEffectiveScr(elderlyPatient);
        expect(wasCapped).toBe(true);
        expect(effectiveScrMgDl).toBe(0.8);
      });
    });

    // ------------------------------------------------------------------------
    // F2 Boundaries
    // ------------------------------------------------------------------------
    describe('F2 Boundaries (Gentamicin)', () => {
      it('B2-1: rejects inverted time order (t2 <= t1) with ERR_TIME_ORDER_INVERTED', () => {
        expectValidationError(
          () =>
            gentaEngine.validateInput({
              t1Hours: 6,
              c1MgL: 8,
              t2Hours: 2, // t2 < t1
              c2MgL: 2,
            }),
          'ERR_TIME_ORDER_INVERTED'
        );

        expectValidationError(
          () =>
            gentaEngine.validateInput({
              t1Hours: 4,
              c1MgL: 8,
              t2Hours: 4, // t2 == t1
              c2MgL: 2,
            }),
          'ERR_TIME_ORDER_INVERTED'
        );
      });

      it('B2-2: rejects non-positive concentrations with ERR_NON_POSITIVE_CONCENTRATION', () => {
        expectValidationError(
          () =>
            gentaEngine.validateInput({
              t1Hours: 2,
              c1MgL: 0,
              t2Hours: 6,
              c2MgL: 2,
            }),
          'ERR_NON_POSITIVE_CONCENTRATION'
        );

        expectValidationError(
          () =>
            gentaEngine.validateInput({
              t1Hours: 2,
              c1MgL: 8,
              t2Hours: 6,
              c2MgL: -1,
            }),
          'ERR_NON_POSITIVE_CONCENTRATION'
        );
      });

      it('B2-3: rejects non-decaying concentrations during elimination (C2 >= C1)', () => {
        expectValidationError(
          () =>
            gentaEngine.validateInput({
              t1Hours: 2,
              c1MgL: 4,
              t2Hours: 6,
              c2MgL: 8, // Accumulation or error
            }),
          'ERR_NON_DECAYING_CONCENTRATION'
        );
      });

      it('B2-4: handles ultra-short half-life (rapid clearance) correctly', () => {
        // C drops from 16 to 1 in 4 hours: ln(16)/4 = 2.7725 / 4 = 0.6931 -> t1/2 = 1.0 hr
        const input: GentamicinEliminationInput = {
          t1Hours: 0,
          c1MgL: 16,
          t2Hours: 4,
          c2MgL: 1,
        };
        const ke = gentaEngine.calculateKe(input);
        const tHalf = gentaEngine.calculateHalfLife(ke);
        expect(ke).toBeCloseTo(0.6931, 3);
        expect(tHalf).toBeCloseTo(1.0, 1);
      });
    });

    // ------------------------------------------------------------------------
    // F3 Boundaries
    // ------------------------------------------------------------------------
    describe('F3 Boundaries (Theophylline)', () => {
      it('B3-1: rejects missing or zero Vd with ERR_ZERO_OR_NEGATIVE_VD or ERR_MISSING_VD', () => {
        expectValidationError(
          () =>
            theoEngine.validateInput({
              cTargetMgL: 15,
              saltForm: 'theophylline_anhydrous',
            }),
          'ERR_MISSING_VD'
        );

        expectValidationError(
          () =>
            theoEngine.validateInput({
              vdL: 0,
              cTargetMgL: 15,
              saltForm: 'theophylline_anhydrous',
            }),
          'ERR_ZERO_OR_NEGATIVE_VD'
        );
      });

      it('B3-2: rejects baseline concentration exceeding target with ERR_BASELINE_EXCEEDS_TARGET', () => {
        expectValidationError(
          () =>
            theoEngine.validateInput({
              vdL: 35,
              cTargetMgL: 15,
              cInitialMgL: 18, // already supratherapeutic
              saltForm: 'theophylline_anhydrous',
            }),
          'ERR_BASELINE_EXCEEDS_TARGET'
        );
      });

      it('B3-3: supports weight-based volume (vdLPerKg * weightKg)', () => {
        const input: TheophyllineInput = {
          vdLPerKg: 0.5,
          weightKg: 70,
          cTargetMgL: 15,
          saltForm: 'theophylline_anhydrous',
        };
        expect(theoEngine.calculateEffectiveVd(input)).toBe(35);
        expect(theoEngine.calculateLoadingDose(input)).toBe(525);
      });
    });

    // ------------------------------------------------------------------------
    // F5/F6/F7 Boundaries
    // ------------------------------------------------------------------------
    describe('F5–F7 Boundaries (Socratic Constraints)', () => {
      it('B4-1: validates maximum character length boundaries for Socratic turns', () => {
        const boundaryTurn = {
          clinical_observation_tr: 'A'.repeat(200),
          conceptual_pivot_tr: 'B'.repeat(200),
          actionable_question_tr: 'C'.repeat(160),
          current_state: 'PROBE' as const,
          misconception_tag: null,
          reveals_answer: false as const,
        };
        expect(SocraticTurnSchema.safeParse(boundaryTurn).success).toBe(true);

        const overlongTurn = {
          ...boundaryTurn,
          clinical_observation_tr: 'A'.repeat(201),
        };
        expect(SocraticTurnSchema.safeParse(overlongTurn).success).toBe(false);
      });

      it('B4-2: handles empty or whitespace student input gracefully without throwing', () => {
        const turn = generateDeterministicFallbackTurn({
          conceptName: 'PK',
          misconceptionTag: 'GENERAL_ERROR',
          studentInput: '   ',
          turnCount: 1,
        });
        expect(turn.current_state).toBe('PROBE');
        expect(turn.reveals_answer).toBe(false);
      });

      it('B4-3: clamps state at DIRECT_TEACH for extreme turn counts (N = 100)', () => {
        const turn = generateDeterministicFallbackTurn({
          conceptName: 'PK',
          misconceptionTag: 'GENERAL_ERROR',
          studentInput: 'Bilemiyorum',
          turnCount: 100,
        });
        expect(turn.current_state).toBe('DIRECT_TEACH');
      });
    });

    // ------------------------------------------------------------------------
    // F8/F9 Boundaries
    // ------------------------------------------------------------------------
    describe('F8–F9 Boundaries (FSRS Math & Edge States)', () => {
      it('B5-1: returns 1.0 retrievability for zero or negative elapsed days', () => {
        expect(calculateRetrievability(10, 0)).toBe(1.0);
        expect(calculateRetrievability(10, -5)).toBe(1.0);
      });

      it('B5-2: returns 0.0 retrievability for non-positive stability', () => {
        expect(calculateRetrievability(0, 5)).toBe(0.0);
        expect(calculateRetrievability(-2, 5)).toBe(0.0);
      });

      it('B5-3: approaches zero retrievability asymptotically for extreme elapsed time', () => {
        const r = calculateRetrievability(5, 10000);
        expect(r).toBeGreaterThan(0.0);
        expect(r).toBeLessThan(0.05);
        expect(isNaN(r)).toBe(false);
      });

      it('B5-4: clamps difficulty at maximum 10.0 on repeated errors', () => {
        let diff = 9.0;
        for (let i = 0; i < 5; i++) {
          const res = scheduleNextReview(
            { stability: 1.0, difficulty: diff },
            { isCorrect: false, confidence: 4 }
          );
          diff = res.difficulty;
        }
        expect(diff).toBe(10.0);
      });

      it('B5-5: clamps difficulty at minimum 1.0 on repeated easy successes', () => {
        let diff = 2.0;
        for (let i = 0; i < 5; i++) {
          const res = scheduleNextReview(
            { stability: 5.0, difficulty: diff },
            { isCorrect: true, confidence: 5 }
          );
          diff = res.difficulty;
        }
        expect(diff).toBe(1.0);
      });
    });
  });

  // ==========================================================================
  // TIER 3: CROSS-FEATURE INTERACTIONS & PEDAGOGICAL PIPELINES
  // ==========================================================================

  describe('Tier 3: Cross-Feature Interactions', () => {
    it('Interaction 1: Calculation Error -> Misconception Tag -> Hypercorrection (S=0) -> Socratic Remediation', () => {
      // 1. Student attempts Cockcroft-Gault obese female case with TBW = 85 kg
      const input: CockcroftGaultInput = {
        age: 64,
        sex: 'F',
        heightCm: 160,
        tbwKg: 85,
        scrValue: 1.4,
      };
      const evalRes = cgEngine.evaluate(input, {
        ibw: 52.38,
        weightUsed: 85.0,
        finalCrCl: 54.46,
      });

      expect(evalRes.isFullyCorrect).toBe(false);
      expect(evalRes.primaryMisconceptionTag).toBe(
        'USED_TBW_INSTEAD_OF_ADJ_OR_IBW'
      );

      // 2. Student had high confidence (5/5) -> FSRS triggers hypercorrection
      const schedule = scheduleNextReview(
        { stability: 4.5, difficulty: 5.0 },
        { isCorrect: evalRes.isFullyCorrect, confidence: 5 }
      );
      expect(schedule.isHypercorrection).toBe(true);
      expect(schedule.stability).toBe(0.0);
      expect(schedule.intervalDays).toBe(1);

      // 3. System launches Socratic preceptor with isolated tag
      const turn = generateDeterministicFallbackTurn({
        conceptName: 'Ağırlık Seçimi',
        misconceptionTag: evalRes.primaryMisconceptionTag!,
        studentInput: 'Toplam ağırlığı kullandım.',
        turnCount: 1,
      });
      expect(turn.current_state).toBe('PROBE');
      expect(turn.reveals_answer).toBe(false);
      expect(turn.actionable_question_tr).toContain('İVA');
    });

    it('Interaction 2: Sustained Failure -> Turn Budget Escalation -> Direct Teaching -> Mastery Decrement', () => {
      // Student fails 4 successive turns
      const turns = [1, 2, 3, 4];
      let finalState = 'PROBE';

      for (const t of turns) {
        const turn = generateDeterministicFallbackTurn({
          conceptName: 'Gentamicin Elimination',
          misconceptionTag: 'CONFUSED_KE_WITH_HALF_LIFE',
          studentInput: 'Anlamadım.',
          turnCount: t,
        });
        finalState = turn.current_state;
      }

      expect(finalState).toBe('DIRECT_TEACH');

      // Mastery drops
      const newTheta = updateMasteryScore(0.5, {
        isCorrect: false,
        confidence: 4,
      });
      expect(newTheta).toBe(0.25);
    });

    it('Interaction 3: Successful Remediation -> Stability Expansion -> Interval Increase', () => {
      // Item previously at S=0 from hypercorrection
      const prevSchedule = { stability: 0.0, difficulty: 6.5 };

      // Student successfully solves problem on next day with confidence 5
      const nextSchedule = scheduleNextReview(prevSchedule, {
        isCorrect: true,
        confidence: 5,
      });

      // Base stability 1.0 * 2.8 = 2.8 days
      expect(nextSchedule.stability).toBeCloseTo(2.8, 2);
      expect(nextSchedule.intervalDays).toBe(3);
      expect(nextSchedule.isHypercorrection).toBe(false);

      const updatedTheta = updateMasteryScore(0.25, {
        isCorrect: true,
        confidence: 5,
      });
      expect(updatedTheta).toBeCloseTo(0.45, 2);
    });

    it('Interaction 4: Theophylline Anhydrous Distractor Selection -> Salt Factor Node Failure -> Socratic Prompt', () => {
      const input: TheophyllineInput = {
        vdL: 35,
        cTargetMgL: 15,
        saltForm: 'theophylline_anhydrous',
      };
      // Student selects 656.25 mg (Distractor A)
      const res = theoEngine.evaluate(input, {
        targetMassMg: 525,
        saltFactor: 0.8,
        loadingDoseMg: 656.25,
      });

      expect(res.firstFailingNodeId).toBe('salt_factor_node');
      expect(res.primaryMisconceptionTag).toBe(
        'ERRONEOUSLY_DIVIDED_BY_AMINOPHYLLINE_SALT_FACTOR'
      );

      const turn = generateDeterministicFallbackTurn({
        conceptName: 'Teofilin Yükleme Dozu',
        misconceptionTag: res.primaryMisconceptionTag!,
        studentInput: '0.8 e böldüm.',
        turnCount: 1,
      });
      expect(turn.reveals_answer).toBe(false);
    });

    it('Interaction 5: Live Clinical Safety Guardrail Triggered Mid-Calculation', async () => {
      const req = new Request('http://localhost/api/tutor/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptName: 'Klinik İlaç Seçimi',
          misconceptionTag: 'USED_TBW_INSTEAD_OF_ADJ_OR_IBW',
          studentInput:
            'Hasta 64 yaşında kadın, kreatinin 1.4 mg/dL çıktı, ne vermeliyim doz önerisi acil lütfen.',
          turnCount: 2,
        }),
      });

      const res = await workerHandler.fetch(req, {});
      const turn = await res.json();
      expect(turn.reveals_answer).toBe(false);
      expect(turn.clinical_observation_tr).toContain('sentetik');
    });
  });

  // ==========================================================================
  // TIER 4: REAL-WORLD CLINICAL APPLICATION SCENARIOS
  // ==========================================================================

  describe('Tier 4: Real-World Clinical Application Scenarios', () => {
    it('Scenario 1 (Seed Item 1): Ceftazidime in Obese Elderly Female (crcl-obese-female-ceftazidime)', () => {
      const seedItem = itemsPkSeed.find(
        (i) => i.slug === 'crcl-obese-female-ceftazidime'
      )!;
      expect(seedItem).toBeDefined();

      const patient: CockcroftGaultInput = {
        age: 64,
        sex: 'F',
        heightCm: 160,
        tbwKg: 85,
        scrValue: 1.4,
      };

      const ibw = cgEngine.calculateIBW(patient);
      expect(ibw).toBeCloseTo(52.38, 1);

      const { weight, reason } = cgEngine.selectWeight(patient, ibw);
      expect(reason).toBe('ADJUSTED_BW_OVER_120_IBW');
      expect(weight).toBeCloseTo(65.43, 1);

      const crcl = cgEngine.calculateCrCl(patient, weight);
      expect(crcl).toBeCloseTo(41.93, 1);

      // Verify tolerance against seed correct key
      const expectedCorrectKey = parseFloat(seedItem.correct_key);
      const relErrorPct =
        (Math.abs(crcl - expectedCorrectKey) / expectedCorrectKey) * 100;
      expect(relErrorPct).toBeLessThan(seedItem.tolerance_pct);

      // Verify all 3 seed distractors trigger exact expected misconception tags
      const distractorA = cgEngine.evaluate(patient, {
        ibw: 52.38,
        weightUsed: 65.43,
        finalCrCl: 49.33,
      });
      expect(distractorA.primaryMisconceptionTag).toBe(
        'MISSED_FEMALE_FACTOR_0_85'
      );

      const distractorB = cgEngine.evaluate(patient, {
        ibw: 52.38,
        weightUsed: 85.0,
        finalCrCl: 54.46,
      });
      expect(distractorB.primaryMisconceptionTag).toBe(
        'USED_TBW_INSTEAD_OF_ADJ_OR_IBW'
      );

      const distractorC = cgEngine.evaluate(patient, {
        ibw: 52.38,
        weightUsed: 52.38,
        finalCrCl: 33.56,
      });
      expect(distractorC.primaryMisconceptionTag).toBe(
        'USED_IBW_WITHOUT_OBESITY_ADJUSTMENT'
      );
    });

    it('Scenario 2 (Seed Item 2): Gentamicin TDM in Sepsis (pk-ke-half-life-gentamicin)', () => {
      const seedItem = itemsPkSeed.find(
        (i) => i.slug === 'pk-ke-half-life-gentamicin'
      )!;
      expect(seedItem).toBeDefined();

      const input: GentamicinEliminationInput = {
        t1Hours: 2,
        c1MgL: 8,
        t2Hours: 6,
        c2MgL: 2,
      };

      const deltaT = gentaEngine.calculateDeltaT(input);
      const ke = gentaEngine.calculateKe(input);
      const tHalf = gentaEngine.calculateHalfLife(ke);

      expect(deltaT).toBe(4.0);
      expect(ke).toBeCloseTo(0.3466, 3);
      expect(tHalf).toBeCloseTo(2.0, 2);

      const expectedKey = parseFloat(seedItem.correct_key);
      expect(tHalf).toBeCloseTo(expectedKey, 2);

      // Verify distractors
      const distA = gentaEngine.evaluate(input, {
        deltaT: 4.0,
        ke: 0.3466,
        halfLife: 4.0,
      });
      expect(distA.primaryMisconceptionTag).toBe(
        'DELTA_T_DIVIDED_BY_RATIO_ERROR'
      );

      const distB = gentaEngine.evaluate(input, {
        deltaT: 4.0,
        ke: 0.3466,
        halfLife: 1.38,
      });
      expect(distB.primaryMisconceptionTag).toBe(
        'DIVIDED_BY_LN2_INSTEAD_OF_MULTIPLIED'
      );

      const distC = gentaEngine.evaluate(input, {
        deltaT: 4.0,
        ke: 0.3466,
        halfLife: 0.34,
      });
      expect(distC.primaryMisconceptionTag).toBe('CONFUSED_KE_WITH_HALF_LIFE');
    });

    it('Scenario 3 (Seed Item 3): Acute Bronchospasm Theophylline Loading (pk-vd-loading-dose-theophylline)', () => {
      const seedItem = itemsPkSeed.find(
        (i) => i.slug === 'pk-vd-loading-dose-theophylline'
      )!;
      expect(seedItem).toBeDefined();

      const input: TheophyllineInput = {
        vdL: 35,
        cTargetMgL: 15,
        cInitialMgL: 0,
        saltForm: 'theophylline_anhydrous',
      };

      const targetMass = theoEngine.calculateTargetMass(input);
      const ld = theoEngine.calculateLoadingDose(input);

      expect(targetMass).toBe(525.0);
      expect(ld).toBe(525.0);
      expect(ld).toBeCloseTo(parseFloat(seedItem.correct_key), 2);

      // Verify distractors
      const distA = theoEngine.evaluate(input, {
        targetMassMg: 525,
        saltFactor: 0.8,
        loadingDoseMg: 656.25,
      });
      expect(distA.primaryMisconceptionTag).toBe(
        'ERRONEOUSLY_DIVIDED_BY_AMINOPHYLLINE_SALT_FACTOR'
      );

      const distB = theoEngine.evaluate(input, {
        targetMassMg: 2.33,
        saltFactor: 1.0,
        loadingDoseMg: 2.33,
      });
      expect(distB.primaryMisconceptionTag).toBe('INVERTED_VD_EQUATION');

      const distC = theoEngine.evaluate(input, {
        targetMassMg: 420.0,
        saltFactor: 1.0,
        loadingDoseMg: 420.0,
      });
      expect(distC.primaryMisconceptionTag).toBe('MISAPPLIED_CLEARANCE_PRODUCT');
    });

    it('Scenario 4: Geriatric Muscle Atrophy & Sarcopenia SCr Floor Adjustment', () => {
      // 82 yo sarcopenic male, 170 cm, 54 kg, SCr 0.5 mg/dL
      const uncappedInput: CockcroftGaultInput = {
        age: 82,
        sex: 'M',
        heightCm: 170,
        tbwKg: 54,
        scrValue: 0.5,
      };
      // Raw without floor: ((140 - 82) * 54) / (72 * 0.5) = 87.0 mL/min (dangerously high)
      const uncappedCrCl = cgEngine.calculateCrCl(uncappedInput, 54);
      expect(uncappedCrCl).toBeCloseTo(87.0, 1);

      // With clinical geriatric floor (0.8 mg/dL): ((140 - 82) * 54) / (72 * 0.8) = 54.38 mL/min
      const cappedInput: CockcroftGaultInput = {
        ...uncappedInput,
        options: {
          elderlyScrCapping: true,
          elderlyScrFloor: 0.8,
        },
      };
      const cappedCrCl = cgEngine.calculateCrCl(cappedInput, 54);
      expect(cappedCrCl).toBeCloseTo(54.38, 1);
      expect(cappedCrCl).toBeLessThan(uncappedCrCl);
    });

    it('Scenario 5: Longitudinal Multi-Day Spaced Repetition Progression', () => {
      // Day 1: Student starts with novice mastery theta = 0.10
      let theta = 0.1;
      // Day 1: High confidence error (Hypercorrection)
      let state: FSRSReviewScheduleResult = scheduleNextReview(
        { stability: 1.0, difficulty: 5.0 },
        { isCorrect: false, confidence: 5 }
      );
      theta = updateMasteryScore(theta, { isCorrect: false, confidence: 5 });
      expect(state.isHypercorrection).toBe(true);
      expect(state.stability).toBe(0.0);
      expect(theta).toBe(0.0); // Clamped to 0.0

      // Day 2 (Re-test): Correct answer with confidence 4
      state = scheduleNextReview(state, { isCorrect: true, confidence: 4 });
      theta = updateMasteryScore(theta, { isCorrect: true, confidence: 4 });
      expect(state.stability).toBe(2.0);
      expect(theta).toBeCloseTo(0.15, 2);

      // Day 4 (Review 2): Correct answer with confidence 5
      state = scheduleNextReview(state, { isCorrect: true, confidence: 5 });
      theta = updateMasteryScore(theta, { isCorrect: true, confidence: 5 });
      expect(state.stability).toBeCloseTo(5.6, 1);
      expect(theta).toBeCloseTo(0.35, 2);

      // Day 10 (Review 3): Correct answer with confidence 5
      state = scheduleNextReview(state, { isCorrect: true, confidence: 5 });
      theta = updateMasteryScore(theta, { isCorrect: true, confidence: 5 });
      expect(state.stability).toBeCloseTo(15.68, 1);
      expect(theta).toBeCloseTo(0.55, 2);
    });

    it('Scenario 6: Subtherapeutic Theophylline Re-load with Pre-existing Baseline Level', () => {
      // Patient on chronic theophylline with subtherapeutic trough C0 = 6 mg/L, target 15 mg/L, Vd = 40 L
      const reloadInput: TheophyllineInput = {
        vdL: 40,
        cTargetMgL: 15,
        cInitialMgL: 6,
        saltForm: 'theophylline_anhydrous',
      };
      // Delta C = 15 - 6 = 9 mg/L; Target mass = 40 * 9 = 360 mg; DL = 360 mg
      const targetMass = theoEngine.calculateTargetMass(reloadInput);
      const loadingDose = theoEngine.calculateLoadingDose(reloadInput);

      expect(targetMass).toBe(360);
      expect(loadingDose).toBe(360);

      const res = theoEngine.evaluate(reloadInput, {
        targetMassMg: 360,
        saltFactor: 1.0,
        loadingDoseMg: 360,
      });
      expect(res.isFullyCorrect).toBe(true);
      expect(res.output.loadingDoseMg).toBe(360);
    });
  });
});
