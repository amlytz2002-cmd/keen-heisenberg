import { describe, it, expect } from 'vitest';
import { CockcroftGaultEngine, PatientContext } from '../src/lib/engines/cockcroftGault';

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
      finalCrCl: 88.08
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
      finalCrCl: rawCrCl // Missing female 0.85!
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
      finalCrCl: 54.46
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
      finalCrCl: 33.56
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
});
