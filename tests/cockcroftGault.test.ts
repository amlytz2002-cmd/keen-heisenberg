import { describe, it, expect } from 'vitest';
import { CockcroftGaultEngine, PatientContext } from '../src/lib/engines/cockcroftGault';
import { EngineValidationError } from '../src/lib/engines/types';

describe('CockcroftGaultEngine Deterministic Verification', () => {
  const engine = new CockcroftGaultEngine();

  it('evaluates normal male patient accurately', () => {
    const ctx: PatientContext = { age: 50, sex: 'M', heightCm: 175, tbwKg: 75, scrMgDl: 1.0 };
    const ibw = engine.calculateIBW(ctx);
    // height 175 cm = 68.898 inches -> 8.898 inches over 60 -> 50 + 2.3 * 8.898 = 70.46 kg
    expect(ibw).toBeCloseTo(70.46, 1);

    const { weight, reason } = engine.selectWeight(ctx, ibw);
    expect(weight).toBeCloseTo(70.46, 1);
    expect(reason).toBe('IDEAL_BW_NORMAL');

    // Expected CrCl: ((140 - 50) * 70.46) / (72 * 1.0) = 88.08 mL/min
    const expectedCrCl = engine.calculateCrCl(ctx, weight);
    expect(expectedCrCl).toBeCloseTo(88.08, 1);

    const steps = engine.evaluateDerivation(ctx, {
      ibw: 70.46,
      weightUsed: 70.46,
      finalCrCl: 88.08,
    });

    expect(steps.every((s) => s.isCorrect)).toBe(true);
  });

  it('detects forgotten female factor 0.85 and isolates obesity adjustment', () => {
    const ctx: PatientContext = { age: 64, sex: 'F', heightCm: 160, tbwKg: 85, scrMgDl: 1.4 };
    const ibw = engine.calculateIBW(ctx); // ~52.38 kg
    const { weight, reason } = engine.selectWeight(ctx, ibw); // AdjBW ~65.43 kg

    expect(reason).toBe('ADJUSTED_BW_OVER_120_IBW');
    expect(weight).toBeCloseTo(65.43, 1);

    // Raw CrCl without 0.85: ((140 - 64) * 65.43) / (72 * 1.4) = ~49.33 mL/min
    // Correct final CrCl with 0.85: 49.33 * 0.85 = ~41.93 mL/min
    const rawCrCl = Number((((140 - 64) * 65.43) / (72 * 1.4)).toFixed(2));
    const steps = engine.evaluateDerivation(ctx, {
      ibw: 52.38,
      weightUsed: 65.43,
      finalCrCl: rawCrCl, // Missing female 0.85!
    });

    expect(steps[0].isCorrect).toBe(true);
    expect(steps[1].isCorrect).toBe(true);
    expect(steps[2].isCorrect).toBe(false);
    expect(steps[2].misconceptionTag).toBe('MISSED_FEMALE_FACTOR_0_85');
  });

  it('detects when TBW was used instead of adjusted weight for obese patient', () => {
    const ctx: PatientContext = { age: 64, sex: 'F', heightCm: 160, tbwKg: 85, scrMgDl: 1.4 };

    const steps = engine.evaluateDerivation(ctx, {
      ibw: 52.38,
      weightUsed: 85.0, // Used TBW!
      finalCrCl: 54.46,
    });

    expect(steps[0].isCorrect).toBe(true);
    expect(steps[1].isCorrect).toBe(false);
    expect(steps[1].misconceptionTag).toBe('USED_TBW_INSTEAD_OF_ADJ_OR_IBW');
  });

  it('detects when IBW was used without obesity adjustment', () => {
    const ctx: PatientContext = { age: 64, sex: 'F', heightCm: 160, tbwKg: 85, scrMgDl: 1.4 };

    const steps = engine.evaluateDerivation(ctx, {
      ibw: 52.38,
      weightUsed: 52.38, // Used unadjusted IBW
      finalCrCl: 33.56,
    });

    expect(steps[0].isCorrect).toBe(true);
    expect(steps[1].isCorrect).toBe(false);
    expect(steps[1].misconceptionTag).toBe('USED_IBW_WITHOUT_OBESITY_ADJUSTMENT');
  });

  it('handles underweight patient where TBW < IBW', () => {
    const ctx: PatientContext = { age: 30, sex: 'F', heightCm: 165, tbwKg: 42, scrMgDl: 0.8 };
    const ibw = engine.calculateIBW(ctx); // ~57 kg
    expect(ibw).toBeGreaterThan(42);

    const { weight, reason } = engine.selectWeight(ctx, ibw);
    expect(weight).toBe(42);
    expect(reason).toBe('TBW_LESS_THAN_IBW');
  });

  it('supports SCr conversion from umol/L to mg/dL (88.4 conversion)', () => {
    // 1.4 mg/dL * 88.4 = 123.76 umol/L
    const ctx: PatientContext = {
      age: 64,
      sex: 'F',
      heightCm: 160,
      tbwKg: 85,
      scrValue: 123.76,
      scrUnit: 'umol/L',
    };

    const res = engine.evaluate(ctx, {
      ibw: 52.38,
      weightUsed: 65.43,
      finalCrCl: 41.93,
    });

    expect(res.isFullyCorrect).toBe(true);
    expect(res.output.crclFinalMlMin).toBeCloseTo(41.93, 1);
  });

  it('detects unconverted umol/L SCr (SCR_UNITS_NOT_CONVERTED)', () => {
    // Patient has SCr 123.76 umol/L. Unconverted raw value:
    // ((140 - 64) * 65.43) / (72 * 123.76) * 0.85 = 4972.68 / 8910.72 * 0.85 = 0.558 * 0.85 = 0.47 mL/min
    const ctx: PatientContext = {
      age: 64,
      sex: 'F',
      heightCm: 160,
      tbwKg: 85,
      scrValue: 123.76,
      scrUnit: 'umol/L',
    };

    const res = engine.evaluate(ctx, {
      ibw: 52.38,
      weightUsed: 65.43,
      finalCrCl: 0.47,
    });

    expect(res.isFullyCorrect).toBe(false);
    expect(res.firstFailingNodeId).toBe('crcl_final_node');
    expect(res.primaryMisconceptionTag).toBe('SCR_UNITS_NOT_CONVERTED');
  });

  it('supports elderly SCr capping option when enabled', () => {
    // 80 yo female, 160 cm, 50 kg, SCr 0.5 mg/dL.
    // Capped to 0.8 mg/dL when elderlyScrCapping: true
    const ctx: PatientContext = {
      age: 80,
      sex: 'F',
      heightCm: 160,
      tbwKg: 50,
      scrMgDl: 0.5,
      options: {
        elderlyScrCapping: true,
        elderlyScrFloor: 0.8,
      },
    };

    const ibw = engine.calculateIBW(ctx); // 52.38 kg
    // TBW (50) < IBW (52.38) -> TBW used (50 kg)
    const { weight } = engine.selectWeight(ctx, ibw);
    expect(weight).toBe(50);

    // With 0.8 capped SCr: ((140 - 80) * 50) / (72 * 0.8) * 0.85 = (3000 / 57.6) * 0.85 = 52.08 * 0.85 = 44.27 mL/min
    const crcl = engine.calculateCrCl(ctx, weight);
    expect(crcl).toBeCloseTo(44.27, 1);
  });

  it('detects uninstructed elderly SCr rounding (UNNECESSARY_ELDERLY_SCR_ROUNDING)', () => {
    // Elderly patient with SCr 0.5 mg/dL, elderlyScrCapping is NOT enabled
    const ctx: PatientContext = {
      age: 80,
      sex: 'F',
      heightCm: 160,
      tbwKg: 50,
      scrMgDl: 0.5,
      options: {
        elderlyScrCapping: false,
      },
    };

    // Correct CrCl using raw 0.5: ((140 - 80) * 50) / (72 * 0.5) * 0.85 = (3000 / 36) * 0.85 = 83.33 * 0.85 = 70.83 mL/min
    // Student submitted 44.27 mL/min based on uninstructed 0.8 rounding
    const res = engine.evaluate(ctx, {
      ibw: 52.38,
      weightUsed: 50,
      finalCrCl: 44.27,
    });

    expect(res.isFullyCorrect).toBe(false);
    expect(res.firstFailingNodeId).toBe('crcl_final_node');
    expect(res.primaryMisconceptionTag).toBe('UNNECESSARY_ELDERLY_SCR_ROUNDING');
  });

  it('detects erroneous female factor applied to male patient', () => {
    const ctx: PatientContext = { age: 50, sex: 'M', heightCm: 175, tbwKg: 75, scrMgDl: 1.0 };
    // Normal CrCl = 88.08 mL/min. If student mistakenly multiplies by 0.85: 74.87 mL/min
    const res = engine.evaluate(ctx, {
      ibw: 70.46,
      weightUsed: 70.46,
      finalCrCl: 74.87,
    });

    expect(res.isFullyCorrect).toBe(false);
    expect(res.firstFailingNodeId).toBe('crcl_final_node');
    expect(res.primaryMisconceptionTag).toBe('ERRONEOUS_MALE_FACTOR_APPLIED');
  });

  it('detects denominator order of operations error', () => {
    const ctx: PatientContext = { age: 50, sex: 'M', heightCm: 175, tbwKg: 75, scrMgDl: 1.5 };
    // Correct: ((140-50)*70.46)/(72*1.5) = 6341.4 / 108 = 58.72
    // Error: ((140-50)*70.46/72) * 1.5 = 88.075 * 1.5 = 132.11
    const res = engine.evaluate(ctx, {
      ibw: 70.46,
      weightUsed: 70.46,
      finalCrCl: 132.11,
    });

    expect(res.isFullyCorrect).toBe(false);
    expect(res.firstFailingNodeId).toBe('crcl_final_node');
    expect(res.primaryMisconceptionTag).toBe('DENOMINATOR_ORDER_OF_OPERATIONS_ERROR');
  });

  it('handles short stature (height < 60 inches) by clamping inches over 60 to 0', () => {
    const ctx: PatientContext = { age: 40, sex: 'F', heightCm: 148, tbwKg: 45, scrMgDl: 0.9 };
    // 148 cm = 58.27 in < 60 in -> inches over 60 = 0 -> IBW = base = 45.5 kg
    const ibw = engine.calculateIBW(ctx);
    expect(ibw).toBe(45.5);
  });

  it('detects underweight student using IBW instead of TBW', () => {
    const ctx: PatientContext = { age: 30, sex: 'F', heightCm: 165, tbwKg: 42, scrMgDl: 0.8 };
    const ibw = engine.calculateIBW(ctx); // ~57 kg
    const res = engine.evaluate(ctx, {
      ibw,
      weightUsed: ibw, // Used IBW instead of 42 kg!
      finalCrCl: 70,
    });

    expect(res.isFullyCorrect).toBe(false);
    expect(res.firstFailingNodeId).toBe('weight_selection_node');
    expect(res.primaryMisconceptionTag).toBe('USED_IBW_WHEN_UNDERWEIGHT');
  });

  it('detects normal weight student erroneously applying DVA', () => {
    const ctx: PatientContext = { age: 50, sex: 'M', heightCm: 175, tbwKg: 75, scrMgDl: 1.0 };
    const ibw = 70.46; // normal weight: 70.46 <= 75 <= 84.55 (1.2*IBW)
    // Hypothetical DVA: 70.46 + 0.4 * (75 - 70.46) = 72.28 kg
    const res = engine.evaluate(ctx, {
      ibw,
      weightUsed: 72.28,
      finalCrCl: 88.08,
    });

    expect(res.isFullyCorrect).toBe(false);
    expect(res.firstFailingNodeId).toBe('weight_selection_node');
    expect(res.primaryMisconceptionTag).toBe('USED_ADJUSTED_WEIGHT_WHEN_NOT_OBESE');
  });

  it('throws typed EngineValidationError for invalid input parameters', () => {
    expect(() => engine.calculateIBW({ age: 12, sex: 'M', heightCm: 175, tbwKg: 75, scrMgDl: 1.0 })).toThrowError(
      EngineValidationError
    );
    expect(() => engine.calculateIBW({ age: 50, sex: 'M', heightCm: 80, tbwKg: 75, scrMgDl: 1.0 })).toThrowError(
      EngineValidationError
    );
    expect(() => engine.calculateIBW({ age: 50, sex: 'M', heightCm: 175, tbwKg: 20, scrMgDl: 1.0 })).toThrowError(
      EngineValidationError
    );
    expect(() => engine.calculateCrCl({ age: 50, sex: 'M', heightCm: 175, tbwKg: 75, scrMgDl: 0 }, 70)).toThrowError(
      EngineValidationError
    );
  });
});
