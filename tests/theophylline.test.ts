import { describe, it, expect } from 'vitest';
import { TheophyllineEngine, TheophyllineLoadingDoseEngine } from '../src/lib/engines/theophylline';
import { EngineValidationError, TheophyllineInput } from '../src/lib/engines/types';

describe('TheophyllineEngine Deterministic Verification', () => {
  const engine = new TheophyllineEngine();

  // Test Case 3 from seed/items_pk.json:
  // Vd = 35 L, Ctarget = 15 mg/L, Theophylline anhydrous (S = 1.0)
  const standardCase: TheophyllineInput = {
    cTargetMgL: 15,
    saltForm: 'theophylline_anhydrous',
    vdL: 35,
  };

  it('verifies alias export TheophyllineLoadingDoseEngine works', () => {
    const aliasEngine = new TheophyllineLoadingDoseEngine();
    expect(aliasEngine).toBeInstanceOf(TheophyllineEngine);
  });

  it('evaluates correct derivations for seed item 3 (anhydrous)', () => {
    const vdL = engine.calculateEffectiveVd(standardCase);
    expect(vdL).toBe(35);

    const s = engine.getSaltFactor(standardCase.saltForm);
    expect(s).toBe(1.0);

    const targetMass = engine.calculateTargetMass(standardCase);
    // 35 L * 15 mg/L = 525 mg
    expect(targetMass).toBe(525);

    const loadingDose = engine.calculateLoadingDose(standardCase);
    // 525 mg / 1.0 = 525.00 mg
    expect(loadingDose).toBe(525);

    const res = engine.evaluate(standardCase, {
      targetMassMg: 525,
      saltFactor: 1.0,
      loadingDoseMg: 525,
    });

    expect(res.isFullyCorrect).toBe(true);
    expect(res.engineId).toBe('theophylline_loading_dose');
    expect(res.output.effectiveVdL).toBe(35);
    expect(res.output.targetMassMg).toBe(525);
    expect(res.output.saltFactor).toBe(1.0);
    expect(res.output.loadingDoseMg).toBe(525);
    expect(res.stepEvaluations).toHaveLength(3);
    expect(res.stepEvaluations.every((s) => s.isCorrect)).toBe(true);
  });

  it('detects Distractor A: 656.25 mg (ERRONEOUSLY_DIVIDED_BY_AMINOPHYLLINE_SALT_FACTOR)', () => {
    // Student erroneously divided by 0.8: 525 / 0.8 = 656.25 mg
    const res = engine.evaluate(standardCase, {
      targetMassMg: 525,
      saltFactor: 1.0,
      loadingDoseMg: 656.25,
    });

    expect(res.isFullyCorrect).toBe(false);
    expect(res.stepEvaluations[0].isCorrect).toBe(true);
    expect(res.stepEvaluations[1].isCorrect).toBe(true);
    expect(res.stepEvaluations[2].isCorrect).toBe(false);
    expect(res.firstFailingNodeId).toBe('loading_dose_node');
    expect(res.primaryMisconceptionTag).toBe('ERRONEOUSLY_DIVIDED_BY_AMINOPHYLLINE_SALT_FACTOR');
  });

  it('detects Distractor B: 2.33 mg (INVERTED_VD_EQUATION)', () => {
    // Student inverted equation: Vd / Ctarget = 35 / 15 = 2.33
    const res = engine.evaluate(standardCase, {
      targetMassMg: 2.33,
      saltFactor: 1.0,
      loadingDoseMg: 2.33,
    });

    expect(res.isFullyCorrect).toBe(false);
    expect(res.stepEvaluations[0].isCorrect).toBe(false);
    expect(res.firstFailingNodeId).toBe('target_mass_node');
    expect(res.primaryMisconceptionTag).toBe('INVERTED_VD_EQUATION');
  });

  it('detects Distractor C: 420.00 mg (MISAPPLIED_CLEARANCE_PRODUCT)', () => {
    // 525 * 0.8 = 420.00 mg
    const res = engine.evaluate(standardCase, {
      targetMassMg: 420,
      saltFactor: 1.0,
      loadingDoseMg: 420,
    });

    expect(res.isFullyCorrect).toBe(false);
    expect(res.firstFailingNodeId).toBe('target_mass_node');
    expect(res.primaryMisconceptionTag).toBe('MISAPPLIED_CLEARANCE_PRODUCT');
  });

  it('evaluates aminophylline formulation accurately (S = 0.8)', () => {
    const aminoCase: TheophyllineInput = {
      cTargetMgL: 15,
      saltForm: 'aminophylline',
      vdL: 35,
    };

    const s = engine.getSaltFactor(aminoCase.saltForm);
    expect(s).toBe(0.8);

    const loadingDose = engine.calculateLoadingDose(aminoCase);
    // 525 / 0.8 = 656.25 mg
    expect(loadingDose).toBe(656.25);

    const res = engine.evaluate(aminoCase, {
      targetMassMg: 525,
      saltFactor: 0.8,
      loadingDoseMg: 656.25,
    });

    expect(res.isFullyCorrect).toBe(true);
    expect(res.output.saltFactor).toBe(0.8);
    expect(res.output.loadingDoseMg).toBe(656.25);
  });

  it('detects MISSED_AMINOPHYLLINE_SALT_FACTOR when student uses S = 1.0 for aminophylline', () => {
    const aminoCase: TheophyllineInput = {
      cTargetMgL: 15,
      saltForm: 'aminophylline',
      vdL: 35,
    };

    const res = engine.evaluate(aminoCase, {
      targetMassMg: 525,
      saltFactor: 1.0, // Missed 0.8!
      loadingDoseMg: 525,
    });

    expect(res.isFullyCorrect).toBe(false);
    expect(res.firstFailingNodeId).toBe('salt_factor_node');
    expect(res.primaryMisconceptionTag).toBe('MISSED_AMINOPHYLLINE_SALT_FACTOR');
  });

  it('detects MULTIPLIED_INSTEAD_OF_DIVIDED_BY_SALT_FACTOR for aminophylline', () => {
    const aminoCase: TheophyllineInput = {
      cTargetMgL: 15,
      saltForm: 'aminophylline',
      vdL: 35,
    };

    // Multiplied by 0.8 instead of dividing: 525 * 0.8 = 420 mg
    const res = engine.evaluate(aminoCase, {
      targetMassMg: 525,
      saltFactor: 0.8,
      loadingDoseMg: 420,
    });

    expect(res.isFullyCorrect).toBe(false);
    expect(res.firstFailingNodeId).toBe('loading_dose_node');
    expect(res.primaryMisconceptionTag).toBe('MULTIPLIED_INSTEAD_OF_DIVIDED_BY_SALT_FACTOR');
  });

  it('handles pre-existing baseline concentration (C0 > 0) and detects IGNORED_BASELINE_CONCENTRATION', () => {
    const baselineCase: TheophyllineInput = {
      cTargetMgL: 15,
      cInitialMgL: 5, // Baseline level 5 mg/L
      saltForm: 'theophylline_anhydrous',
      vdL: 35,
    };

    // Expected target mass: 35 * (15 - 5) = 35 * 10 = 350 mg
    const expectedMass = engine.calculateTargetMass(baselineCase);
    expect(expectedMass).toBe(350);

    const expectedLd = engine.calculateLoadingDose(baselineCase);
    expect(expectedLd).toBe(350);

    // Correct student calculation
    const correctRes = engine.evaluate(baselineCase, {
      targetMassMg: 350,
      saltFactor: 1.0,
      loadingDoseMg: 350,
    });
    expect(correctRes.isFullyCorrect).toBe(true);

    // Student ignored baseline C0: 35 * 15 = 525 mg
    const ignoredRes = engine.evaluate(baselineCase, {
      targetMassMg: 525,
      saltFactor: 1.0,
      loadingDoseMg: 525,
    });
    expect(ignoredRes.isFullyCorrect).toBe(false);
    expect(ignoredRes.firstFailingNodeId).toBe('target_mass_node');
    expect(ignoredRes.primaryMisconceptionTag).toBe('IGNORED_BASELINE_CONCENTRATION');
  });

  it('supports weight-based Vd (vdLPerKg * weightKg)', () => {
    const weightCase: TheophyllineInput = {
      cTargetMgL: 15,
      saltForm: 'theophylline_anhydrous',
      vdLPerKg: 0.5,
      weightKg: 70, // 0.5 * 70 = 35 L
    };

    const effectiveVd = engine.calculateEffectiveVd(weightCase);
    expect(effectiveVd).toBe(35);

    const res = engine.evaluate(weightCase, {
      targetMassMg: 525,
      saltFactor: 1.0,
      loadingDoseMg: 525,
    });
    expect(res.isFullyCorrect).toBe(true);
    expect(res.output.effectiveVdL).toBe(35);
  });

  it('demonstrates atomic failure isolation with cascading tolerance', () => {
    const aminoCase: TheophyllineInput = {
      cTargetMgL: 15,
      saltForm: 'aminophylline',
      vdL: 35,
    };

    // Student made arithmetic error in target mass: enters 600 mg (expected 525)
    // Then applies salt factor 0.8 correctly: enters 0.8
    // Then correctly calculates loading dose from their target mass: 600 / 0.8 = 750 mg
    const res = engine.evaluate(aminoCase, {
      targetMassMg: 600,
      saltFactor: 0.8,
      loadingDoseMg: 750,
    });

    expect(res.isFullyCorrect).toBe(false);
    expect(res.stepEvaluations[0].isCorrect).toBe(false);
    expect(res.firstFailingNodeId).toBe('target_mass_node');
    // Step 2 & 3 correctly evaluated from student's value!
    expect(res.stepEvaluations[1].isCorrect).toBe(true);
    expect(res.stepEvaluations[2].isCorrect).toBe(true);
  });

  it('throws EngineValidationError for missing or invalid Vd', () => {
    expect(() =>
      engine.evaluate({ cTargetMgL: 15, saltForm: 'theophylline_anhydrous' })
    ).toThrowError(EngineValidationError);

    try {
      engine.evaluate({ cTargetMgL: 15, saltForm: 'theophylline_anhydrous' });
    } catch (err) {
      expect((err as EngineValidationError).code).toBe('ERR_MISSING_VD');
    }

    expect(() =>
      engine.evaluate({ cTargetMgL: 15, saltForm: 'theophylline_anhydrous', vdL: -10 })
    ).toThrowError(EngineValidationError);
  });

  it('throws EngineValidationError for invalid Ctarget or baseline C0', () => {
    // Non-positive Ctarget
    expect(() =>
      engine.evaluate({ cTargetMgL: 0, saltForm: 'theophylline_anhydrous', vdL: 35 })
    ).toThrowError(EngineValidationError);

    // Negative C0
    expect(() =>
      engine.evaluate({ cTargetMgL: 15, cInitialMgL: -2, saltForm: 'theophylline_anhydrous', vdL: 35 })
    ).toThrowError(EngineValidationError);

    // Baseline exceeds or equals target
    expect(() =>
      engine.evaluate({ cTargetMgL: 15, cInitialMgL: 15, saltForm: 'theophylline_anhydrous', vdL: 35 })
    ).toThrowError(EngineValidationError);

    try {
      engine.evaluate({ cTargetMgL: 15, cInitialMgL: 20, saltForm: 'theophylline_anhydrous', vdL: 35 });
    } catch (err) {
      expect((err as EngineValidationError).code).toBe('ERR_BASELINE_EXCEEDS_TARGET');
    }
  });
});
