import { describe, it, expect } from 'vitest';
import { GentamicinEngine, GentamicinEliminationEngine } from '../src/lib/engines/gentamicin';
import { EngineValidationError, GentamicinEliminationInput } from '../src/lib/engines/types';

describe('GentamicinEngine Deterministic Verification', () => {
  const engine = new GentamicinEngine();

  // Test Case 2 from seed/items_pk.json:
  // t1 = 2 h, C1 = 8 mg/L, t2 = 6 h, C2 = 2 mg/L
  const standardCase: GentamicinEliminationInput = {
    t1Hours: 2,
    c1MgL: 8,
    t2Hours: 6,
    c2MgL: 2,
  };

  it('verifies alias export GentamicinEliminationEngine works', () => {
    const aliasEngine = new GentamicinEliminationEngine();
    expect(aliasEngine).toBeInstanceOf(GentamicinEngine);
  });

  it('evaluates correct derivations for seed item 2', () => {
    const deltaT = engine.calculateDeltaT(standardCase);
    expect(deltaT).toBe(4.0);

    const ke = engine.calculateKe(standardCase);
    // ke = ln(8 / 2) / 4 = ln(4) / 4 = 1.38629 / 4 = 0.3466 hr^-1
    expect(ke).toBeCloseTo(0.3466, 3);

    const halfLife = engine.calculateHalfLife(ke);
    // t1/2 = ln(2) / 0.3466 = 0.69315 / 0.3466 = 2.00 h
    expect(halfLife).toBeCloseTo(2.0, 2);

    const res = engine.evaluate(standardCase, {
      deltaT: 4.0,
      ke: 0.3466,
      halfLife: 2.0,
    });

    expect(res.isFullyCorrect).toBe(true);
    expect(res.engineId).toBe('gentamicin_elimination');
    expect(res.output.deltaTHours).toBe(4.0);
    expect(res.output.concentrationRatio).toBe(4.0);
    expect(res.output.keHrMinus1).toBeCloseTo(0.3466, 3);
    expect(res.output.halfLifeHours).toBeCloseTo(2.0, 2);
    expect(res.stepEvaluations).toHaveLength(3);
    expect(res.stepEvaluations.every((s) => s.isCorrect)).toBe(true);
  });

  it('detects Distractor A from seed item: 4.00 saat (DELTA_T_DIVIDED_BY_RATIO_ERROR)', () => {
    const res = engine.evaluate(standardCase, {
      deltaT: 4.0,
      ke: 0.3466,
      halfLife: 4.0, // Submitted 4.00 h!
    });

    expect(res.isFullyCorrect).toBe(false);
    expect(res.stepEvaluations[0].isCorrect).toBe(true);
    expect(res.stepEvaluations[1].isCorrect).toBe(true);
    expect(res.stepEvaluations[2].isCorrect).toBe(false);
    expect(res.firstFailingNodeId).toBe('half_life_node');
    expect(res.primaryMisconceptionTag).toBe('DELTA_T_DIVIDED_BY_RATIO_ERROR');
  });

  it('detects Distractor B from seed item: 1.38 saat (DIVIDED_BY_LN2_INSTEAD_OF_MULTIPLIED)', () => {
    const res = engine.evaluate(standardCase, {
      deltaT: 4.0,
      ke: 0.3466,
      halfLife: 1.38, // Submitted 1.38 h!
    });

    expect(res.isFullyCorrect).toBe(false);
    expect(res.stepEvaluations[2].isCorrect).toBe(false);
    expect(res.firstFailingNodeId).toBe('half_life_node');
    expect(res.primaryMisconceptionTag).toBe('DIVIDED_BY_LN2_INSTEAD_OF_MULTIPLIED');
  });

  it('detects Distractor C from seed item: 0.34 saat (CONFUSED_KE_WITH_HALF_LIFE)', () => {
    const res = engine.evaluate(standardCase, {
      deltaT: 4.0,
      ke: 0.3466,
      halfLife: 0.34, // Submitted ke value as half-life!
    });

    expect(res.isFullyCorrect).toBe(false);
    expect(res.stepEvaluations[2].isCorrect).toBe(false);
    expect(res.firstFailingNodeId).toBe('half_life_node');
    expect(res.primaryMisconceptionTag).toBe('CONFUSED_KE_WITH_HALF_LIFE');
  });

  it('detects MULTIPLIED_BY_LN2_INSTEAD_OF_DIVIDED distractor', () => {
    // ke * ln(2) = 0.3466 * 0.69315 = 0.24 h
    const res = engine.evaluate(standardCase, {
      deltaT: 4.0,
      ke: 0.3466,
      halfLife: 0.24,
    });

    expect(res.isFullyCorrect).toBe(false);
    expect(res.stepEvaluations[2].isCorrect).toBe(false);
    expect(res.firstFailingNodeId).toBe('half_life_node');
    expect(res.primaryMisconceptionTag).toBe('MULTIPLIED_BY_LN2_INSTEAD_OF_DIVIDED');
  });

  it('detects NATURAL_LOG_BASE_10_CONFUSION in ke node', () => {
    // log10(4) / 4 = 0.60206 / 4 = 0.1505
    const res = engine.evaluate(standardCase, {
      deltaT: 4.0,
      ke: 0.1505,
      halfLife: 2.0,
    });

    expect(res.isFullyCorrect).toBe(false);
    expect(res.stepEvaluations[1].isCorrect).toBe(false);
    expect(res.firstFailingNodeId).toBe('ke_node');
    expect(res.primaryMisconceptionTag).toBe('NATURAL_LOG_BASE_10_CONFUSION');
  });

  it('detects ASSUMED_ZERO_ORDER_ELIMINATION in ke node', () => {
    // (C1 - C2) / deltaT = (8 - 2) / 4 = 1.5
    const res = engine.evaluate(standardCase, {
      deltaT: 4.0,
      ke: 1.5,
      halfLife: 2.0,
    });

    expect(res.isFullyCorrect).toBe(false);
    expect(res.stepEvaluations[1].isCorrect).toBe(false);
    expect(res.firstFailingNodeId).toBe('ke_node');
    expect(res.primaryMisconceptionTag).toBe('ASSUMED_ZERO_ORDER_ELIMINATION');
  });

  it('detects INVERTED_KE_EQUATION in ke node', () => {
    // deltaT / ln(C1/C2) = 4 / 1.3863 = 2.885
    const res = engine.evaluate(standardCase, {
      deltaT: 4.0,
      ke: 2.885,
      halfLife: 2.0,
    });

    expect(res.isFullyCorrect).toBe(false);
    expect(res.stepEvaluations[1].isCorrect).toBe(false);
    expect(res.firstFailingNodeId).toBe('ke_node');
    expect(res.primaryMisconceptionTag).toBe('INVERTED_KE_EQUATION');
  });

  it('detects DELTA_T_NEGATIVE_OR_INVERTED in delta t node', () => {
    const res = engine.evaluate(standardCase, {
      deltaT: -4.0, // Inverted t1 - t2
      ke: 0.3466,
      halfLife: 2.0,
    });

    expect(res.isFullyCorrect).toBe(false);
    expect(res.stepEvaluations[0].isCorrect).toBe(false);
    expect(res.firstFailingNodeId).toBe('delta_t_node');
    expect(res.primaryMisconceptionTag).toBe('DELTA_T_NEGATIVE_OR_INVERTED');
  });

  it('demonstrates atomic failure isolation with cascading tolerance', () => {
    // Student enters wrong deltaT = 5.0 (instead of 4.0)
    // Then computes ke based on deltaT = 5.0: ke = ln(4) / 5.0 = 0.2773
    // Then computes halfLife based on ke = 0.2773: t1/2 = ln(2) / 0.2773 = 2.50
    const res = engine.evaluate(standardCase, {
      deltaT: 5.0,
      ke: 0.2773,
      halfLife: 2.5,
    });

    expect(res.isFullyCorrect).toBe(false);
    expect(res.stepEvaluations[0].isCorrect).toBe(false);
    expect(res.firstFailingNodeId).toBe('delta_t_node');
    // Step 2 & 3 correctly applied formulas based on student's intermediate value!
    expect(res.stepEvaluations[1].isCorrect).toBe(true);
    expect(res.stepEvaluations[2].isCorrect).toBe(true);
  });

  it('throws EngineValidationError for time inversion (t2 <= t1)', () => {
    expect(() =>
      engine.evaluate({ t1Hours: 6, c1MgL: 8, t2Hours: 2, c2MgL: 2 })
    ).toThrowError(EngineValidationError);

    try {
      engine.evaluate({ t1Hours: 6, c1MgL: 8, t2Hours: 2, c2MgL: 2 });
    } catch (err) {
      expect((err as EngineValidationError).code).toBe('ERR_TIME_ORDER_INVERTED');
    }
  });

  it('throws EngineValidationError for non-positive concentrations', () => {
    expect(() =>
      engine.evaluate({ t1Hours: 2, c1MgL: 0, t2Hours: 6, c2MgL: 2 })
    ).toThrowError(EngineValidationError);

    try {
      engine.evaluate({ t1Hours: 2, c1MgL: -5, t2Hours: 6, c2MgL: 2 });
    } catch (err) {
      expect((err as EngineValidationError).code).toBe('ERR_NON_POSITIVE_CONCENTRATION');
    }
  });

  it('throws EngineValidationError for non-decaying concentrations (C2 >= C1)', () => {
    expect(() =>
      engine.evaluate({ t1Hours: 2, c1MgL: 2, t2Hours: 6, c2MgL: 8 })
    ).toThrowError(EngineValidationError);

    try {
      engine.evaluate({ t1Hours: 2, c1MgL: 5, t2Hours: 6, c2MgL: 5 });
    } catch (err) {
      expect((err as EngineValidationError).code).toBe('ERR_NON_DECAYING_CONCENTRATION');
    }
  });
});
