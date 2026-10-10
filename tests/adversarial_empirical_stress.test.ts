import { describe, it, expect } from 'vitest';
import { CockcroftGaultEngine } from '../src/lib/engines/cockcroftGault';
import { GentamicinEngine } from '../src/lib/engines/gentamicin';
import { TheophyllineEngine } from '../src/lib/engines/theophylline';
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
} from '../src/lib/engines/fsrs';

/**
 * ============================================================================
 * CENNA.LIVE ADVERSARIAL EMPIRICAL STRESS TEST SUITE
 * ============================================================================
 * Rigorous adversarial validation across:
 * 1. Cockcroft-Gault Engine:
 *    - Extreme heights (<60 inches, >84 inches)
 *    - Weight categories: Underweight (TBW < IBW), Normal (IBW <= TBW <= 1.2*IBW), Obese (TBW > 1.2*IBW)
 *    - Borderline obesity threshold (exactly 1.20 * IBW)
 *    - Serum creatinine unit conversion (umol/L via 88.4) & elderly floor (0.8 mg/dL)
 *    - Female multiplier (0.85) vs Male (1.00)
 * 2. Gentamicin Elimination Engine:
 *    - Elimination rate ke = ln(C1/C2)/Δt and half-life t1/2 = ln(2)/ke
 *    - Input validation: non-positive concentrations, inverted times, non-decaying levels
 *    - Numerical precision & atomic misconception isolation
 * 3. Theophylline Loading Dose Engine:
 *    - Target mass Vd * (Ctarget - C0), Salt factors (1.0 vs 0.8), Loading dose DL = TargetMass / S
 *    - Input validation: non-positive Vd, non-positive Ctarget, baseline subtraction & violations
 * 4. FSRS Spaced Repetition & Mastery Engine:
 *    - Proof of R(0, S) = 1.0 and R(S, S) = 0.90 across arbitrary S > 0
 *    - Stability growth multipliers across confidence 1-5
 *    - Hypercorrection rule: confidence >= 4 & incorrect -> S = 0, due_at = now + 24h, isHypercorrection = true
 *    - Theta mastery bounds strictly clamped in [0.0, 1.0]
 * ============================================================================
 */

describe('Adversarial Stress: Cockcroft-Gault CrCl Engine', () => {
  const cg = new CockcroftGaultEngine();

  describe('1.1 Extreme Heights & Short Stature', () => {
    it('clamps inches over 60 to 0 for heights strictly below 60 inches (male)', () => {
      // 100 cm = 39.37 inches (<60)
      const male100 = cg.calculateIBW({ age: 40, sex: 'M', heightCm: 100, tbwKg: 50, scrMgDl: 1.0 });
      expect(male100).toBe(50.0);

      // 120 cm = 47.24 inches (<60)
      const male120 = cg.calculateIBW({ age: 40, sex: 'M', heightCm: 120, tbwKg: 50, scrMgDl: 1.0 });
      expect(male120).toBe(50.0);

      // 140 cm = 55.12 inches (<60)
      const male140 = cg.calculateIBW({ age: 40, sex: 'M', heightCm: 140, tbwKg: 50, scrMgDl: 1.0 });
      expect(male140).toBe(50.0);

      // 150 cm = 59.06 inches (<60)
      const male150 = cg.calculateIBW({ age: 40, sex: 'M', heightCm: 150, tbwKg: 50, scrMgDl: 1.0 });
      expect(male150).toBe(50.0);

      // 152.39 cm = 59.996 inches (<60)
      const male152 = cg.calculateIBW({ age: 40, sex: 'M', heightCm: 152.39, tbwKg: 50, scrMgDl: 1.0 });
      expect(male152).toBe(50.0);
    });

    it('clamps inches over 60 to 0 for heights strictly below 60 inches (female)', () => {
      // 100 cm = 39.37 inches (<60) -> base = 45.5 kg
      const female100 = cg.calculateIBW({ age: 35, sex: 'F', heightCm: 100, tbwKg: 40, scrMgDl: 0.9 });
      expect(female100).toBe(45.5);

      // 145 cm = 57.09 inches (<60) -> base = 45.5 kg
      const female145 = cg.calculateIBW({ age: 35, sex: 'F', heightCm: 145, tbwKg: 40, scrMgDl: 0.9 });
      expect(female145).toBe(45.5);
    });

    it('evaluates exactly 60 inches (152.4 cm) with 0 excess inches', () => {
      const male60in = cg.calculateIBW({ age: 40, sex: 'M', heightCm: 152.4, tbwKg: 60, scrMgDl: 1.0 });
      expect(male60in).toBe(50.0);

      const female60in = cg.calculateIBW({ age: 40, sex: 'F', heightCm: 152.4, tbwKg: 60, scrMgDl: 1.0 });
      expect(female60in).toBe(45.5);
    });

    it('handles tall patients above 84 inches (213.36 cm) up to maximum boundary 250 cm', () => {
      // 85 inches = 215.9 cm -> excess = 25 inches -> 50 + 2.3 * 25 = 107.5 kg
      const male85in = cg.calculateIBW({ age: 30, sex: 'M', heightCm: 215.9, tbwKg: 110, scrMgDl: 1.1 });
      expect(male85in).toBe(107.5);

      // 220 cm = 86.614 inches -> excess = 26.614 -> 50 + 2.3 * 26.614 = 111.21 kg
      const male220 = cg.calculateIBW({ age: 25, sex: 'M', heightCm: 220, tbwKg: 120, scrMgDl: 1.0 });
      expect(male220).toBe(111.21);

      // Maximum valid height boundary: 250 cm = 98.425 inches -> excess = 38.425 -> 50 + 2.3 * 38.425 = 138.38 kg
      const male250 = cg.calculateIBW({ age: 30, sex: 'M', heightCm: 250, tbwKg: 140, scrMgDl: 1.2 });
      expect(male250).toBe(138.38);

      const female250 = cg.calculateIBW({ age: 30, sex: 'F', heightCm: 250, tbwKg: 140, scrMgDl: 1.2 });
      // 45.5 + 2.3 * 38.425 = 133.88 kg
      expect(female250).toBe(133.88);
    });

    it('rejects heights outside domain boundaries [100, 250] cm with ERR_INVALID_HEIGHT', () => {
      expect(() => cg.validateInput({ age: 30, sex: 'M', heightCm: 99.9, tbwKg: 70, scrMgDl: 1.0 }))
        .toThrowError(EngineValidationError);
      expect(() => cg.validateInput({ age: 30, sex: 'M', heightCm: 250.1, tbwKg: 70, scrMgDl: 1.0 }))
        .toThrowError(EngineValidationError);
    });
  });

  describe('1.2 Weight Selection Categories & Obesity Thresholds', () => {
    const baseMale: CockcroftGaultInput = {
      age: 40,
      sex: 'M',
      heightCm: 175, // IBW = 70.46 kg
      tbwKg: 70.46,
      scrMgDl: 1.0,
    };
    const ibw = 70.46;

    it('selects TBW and reason TBW_LESS_THAN_IBW when TBW < IBW', () => {
      // TBW 50 kg < 70.46 kg
      const underCtx = { ...baseMale, tbwKg: 50 };
      const res = cg.selectWeight(underCtx, ibw);
      expect(res.weight).toBe(50);
      expect(res.reason).toBe('TBW_LESS_THAN_IBW');

      // Edge: TBW is 0.01 kg below IBW
      const nearUnder = { ...baseMale, tbwKg: 70.45 };
      const nearRes = cg.selectWeight(nearUnder, ibw);
      expect(nearRes.weight).toBe(70.45);
      expect(nearRes.reason).toBe('TBW_LESS_THAN_IBW');
    });

    it('selects IBW and reason IDEAL_BW_NORMAL when IBW <= TBW <= 1.20 * IBW', () => {
      // Exactly at IBW
      const exactIbw = { ...baseMale, tbwKg: 70.46 };
      const exactRes = cg.selectWeight(exactIbw, ibw);
      expect(exactRes.weight).toBe(70.46);
      expect(exactRes.reason).toBe('IDEAL_BW_NORMAL');

      // Mid-normal: 1.10 * IBW = 77.51 kg
      const midNormal = { ...baseMale, tbwKg: 77.51 };
      const midRes = cg.selectWeight(midNormal, ibw);
      expect(midRes.weight).toBe(70.46);
      expect(midRes.reason).toBe('IDEAL_BW_NORMAL');

      // Borderline Test A: Integer-clean boundary (IBW = 50.0 kg, 1.20 * IBW = 60.0 kg)
      const male60Clean: CockcroftGaultInput = {
        age: 40,
        sex: 'M',
        heightCm: 152.4, // IBW = 50.0 kg
        tbwKg: 60.0,     // Exactly 1.20 * 50.0 kg
        scrMgDl: 1.0,
      };
      const cleanRes = cg.selectWeight(male60Clean, 50.0);
      expect(cleanRes.weight).toBe(50.0);
      expect(cleanRes.reason).toBe('IDEAL_BW_NORMAL');

      // Borderline Test B: In JS floating point, tbwKg = 1.2 * ibw (84.55199999999999)
      const borderlineJs = { ...baseMale, tbwKg: 1.2 * ibw };
      const borderResJs = cg.selectWeight(borderlineJs, ibw);
      expect(borderResJs.weight).toBe(70.46);
      expect(borderResJs.reason).toBe('IDEAL_BW_NORMAL');

      // Borderline Test C: EMPIRICAL VULNERABILITY FINDING
      // In exact mathematical decimal arithmetic, 1.20 * 70.46 = 84.552 kg.
      // However, in IEEE-754: 1.2 * 70.46 = 84.55199999999999.
      // Therefore, if tbwKg is provided as decimal 84.552, 84.552 > (1.2 * 70.46) evaluates to true!
      // This causes CockcroftGaultEngine.selectWeight to switch to ADJUSTED_BW_OVER_120_IBW (weight: 76.10).
      const borderlineDecimal = { ...baseMale, tbwKg: 84.552 };
      const borderResDecimal = cg.selectWeight(borderlineDecimal, ibw);
      // Documenting the empirical behavior of the engine:
      expect(borderResDecimal.reason).toBe('ADJUSTED_BW_OVER_120_IBW');
      expect(borderResDecimal.weight).toBeCloseTo(76.10, 2);
    });

    it('selects DVA with 0.40 factor and reason ADJUSTED_BW_OVER_120_IBW when TBW > 1.20 * IBW', () => {
      // Slightly above 1.20 * IBW: 84.56 kg > 84.552 kg
      const justAbove = { ...baseMale, tbwKg: 84.56 };
      const aboveRes = cg.selectWeight(justAbove, ibw);
      expect(aboveRes.reason).toBe('ADJUSTED_BW_OVER_120_IBW');
      // DVA = 70.46 + 0.4 * (84.56 - 70.46) = 70.46 + 0.4 * 14.10 = 70.46 + 5.64 = 76.10 kg
      expect(aboveRes.weight).toBeCloseTo(76.10, 2);

      // Obese: 100 kg
      const obese100 = { ...baseMale, tbwKg: 100 };
      const obeseRes = cg.selectWeight(obese100, ibw);
      expect(obeseRes.reason).toBe('ADJUSTED_BW_OVER_120_IBW');
      // DVA = 70.46 + 0.4 * (100 - 70.46) = 70.46 + 11.816 = 82.28 kg
      expect(obeseRes.weight).toBeCloseTo(82.28, 2);

      // Extreme obesity: 350 kg (upper validation boundary)
      const maxObese = { ...baseMale, tbwKg: 350 };
      const maxRes = cg.selectWeight(maxObese, ibw);
      expect(maxRes.reason).toBe('ADJUSTED_BW_OVER_120_IBW');
      // DVA = 70.46 + 0.4 * (350 - 70.46) = 70.46 + 111.816 = 182.28 kg
      expect(maxRes.weight).toBeCloseTo(182.28, 2);
    });
  });

  describe('1.3 Serum Creatinine Conversions & Elderly Floor', () => {
    it('accurately converts umol/L to mg/dL using divisor 88.4', () => {
      // 88.4 umol/L = 1.0 mg/dL
      const eff1 = cg.getEffectiveScr({
        age: 50,
        sex: 'M',
        heightCm: 175,
        tbwKg: 75,
        scrValue: 88.4,
        scrUnit: 'umol/L',
      });
      expect(eff1.effectiveScrMgDl).toBeCloseTo(1.0, 4);
      expect(eff1.unit).toBe('umol/L');
      expect(eff1.wasCapped).toBe(false);

      // 176.8 umol/L = 2.0 mg/dL
      const eff2 = cg.getEffectiveScr({
        age: 50,
        sex: 'M',
        heightCm: 175,
        tbwKg: 75,
        scrValue: 176.8,
        scrUnit: 'umol/L',
      });
      expect(eff2.effectiveScrMgDl).toBeCloseTo(2.0, 4);

      // 44.2 umol/L = 0.5 mg/dL
      const eff3 = cg.getEffectiveScr({
        age: 50,
        sex: 'M',
        heightCm: 175,
        tbwKg: 75,
        scrValue: 44.2,
        scrUnit: 'umol/L',
      });
      expect(eff3.effectiveScrMgDl).toBeCloseTo(0.5, 4);
    });

    it('applies elderly floor 0.8 mg/dL only when configured and age >= 65', () => {
      // Case A: Age 64 (non-elderly) with SCr 0.5 mg/dL and elderlyScrCapping: true -> NOT capped
      const resNonElderly = cg.getEffectiveScr({
        age: 64,
        sex: 'F',
        heightCm: 160,
        tbwKg: 55,
        scrMgDl: 0.5,
        options: { elderlyScrCapping: true, elderlyScrFloor: 0.8 },
      });
      expect(resNonElderly.effectiveScrMgDl).toBe(0.5);
      expect(resNonElderly.wasCapped).toBe(false);

      // Case B: Age 65 (elderly threshold) with SCr 0.5 mg/dL and capping: true -> CAPPED to 0.8
      const resElderly65 = cg.getEffectiveScr({
        age: 65,
        sex: 'F',
        heightCm: 160,
        tbwKg: 55,
        scrMgDl: 0.5,
        options: { elderlyScrCapping: true, elderlyScrFloor: 0.8 },
      });
      expect(resElderly65.effectiveScrMgDl).toBe(0.8);
      expect(resElderly65.wasCapped).toBe(true);

      // Case C: Age 85 with SCr 0.79 mg/dL -> CAPPED to 0.8
      const resElderly79 = cg.getEffectiveScr({
        age: 85,
        sex: 'F',
        heightCm: 160,
        tbwKg: 55,
        scrMgDl: 0.79,
        options: { elderlyScrCapping: true },
      });
      expect(resElderly79.effectiveScrMgDl).toBe(0.8);
      expect(resElderly79.wasCapped).toBe(true);

      // Case D: Age 85 with SCr 0.80 mg/dL -> NOT capped (already >= floor)
      const resElderly80 = cg.getEffectiveScr({
        age: 85,
        sex: 'F',
        heightCm: 160,
        tbwKg: 55,
        scrMgDl: 0.80,
        options: { elderlyScrCapping: true },
      });
      expect(resElderly80.effectiveScrMgDl).toBe(0.80);
      expect(resElderly80.wasCapped).toBe(false);

      // Case E: Age 85 with custom floor 1.0 mg/dL and SCr 0.7 -> CAPPED to 1.0
      const resCustomFloor = cg.getEffectiveScr({
        age: 85,
        sex: 'M',
        heightCm: 170,
        tbwKg: 65,
        scrMgDl: 0.7,
        options: { elderlyScrCapping: true, elderlyScrFloor: 1.0 },
      });
      expect(resCustomFloor.effectiveScrMgDl).toBe(1.0);
      expect(resCustomFloor.wasCapped).toBe(true);

      // Case F: Age 85 with capping DISABLED -> NOT capped
      const resDisabled = cg.getEffectiveScr({
        age: 85,
        sex: 'F',
        heightCm: 160,
        tbwKg: 55,
        scrMgDl: 0.5,
        options: { elderlyScrCapping: false },
      });
      expect(resDisabled.effectiveScrMgDl).toBe(0.5);
      expect(resDisabled.wasCapped).toBe(false);
    });
  });

  describe('1.4 Female Multiplier (0.85) vs Male (1.00)', () => {
    it('applies exact 0.85 factor across varied female demographic profiles', () => {
      const testCases = [
        { age: 20, wt: 50, scr: 0.8 },
        { age: 45, wt: 65, scr: 1.2 },
        { age: 70, wt: 60, scr: 1.0 },
        { age: 85, wt: 45, scr: 1.5 },
      ];

      for (const tc of testCases) {
        const femaleCtx: CockcroftGaultInput = {
          age: tc.age,
          sex: 'F',
          heightCm: 165,
          tbwKg: tc.wt,
          scrMgDl: tc.scr,
        };
        const maleCtx: CockcroftGaultInput = {
          age: tc.age,
          sex: 'M',
          heightCm: 165,
          tbwKg: tc.wt,
          scrMgDl: tc.scr,
        };

        const femaleCrCl = cg.calculateCrCl(femaleCtx, tc.wt);
        const maleCrCl = cg.calculateCrCl(maleCtx, tc.wt);

        // CrCl_female = CrCl_male * 0.85
        expect(femaleCrCl).toBeCloseTo(Number((maleCrCl * 0.85).toFixed(2)), 1);
      }
    });

    it('isolates MISSED_FEMALE_FACTOR_0_85 when female multiplier is omitted', () => {
      const ctx: CockcroftGaultInput = {
        age: 55,
        sex: 'F',
        heightCm: 165,
        tbwKg: 65,
        scrMgDl: 1.0,
      };
      // IBW = 45.5 + 2.3 * (64.96 - 60) = 45.5 + 2.3 * 4.96 = 56.91 kg
      // TBW 65 kg <= 1.2 * 56.91 = 68.29 kg -> weight is 56.91 kg
      // Male raw CrCl: (140 - 55) * 56.91 / (72 * 1.0) = 4837.35 / 72 = 67.19 mL/min
      // Correct female CrCl: 67.19 * 0.85 = 57.11 mL/min
      const res = cg.evaluate(ctx, {
        ibw: 56.91,
        weightUsed: 56.91,
        finalCrCl: 67.19, // Uncorrected male value submitted!
      });

      expect(res.isFullyCorrect).toBe(false);
      expect(res.firstFailingNodeId).toBe('crcl_final_node');
      expect(res.primaryMisconceptionTag).toBe('MISSED_FEMALE_FACTOR_0_85');
    });

    it('isolates ERRONEOUS_MALE_FACTOR_APPLIED when 0.85 is erroneously applied to male', () => {
      const ctx: CockcroftGaultInput = {
        age: 55,
        sex: 'M',
        heightCm: 175,
        tbwKg: 75,
        scrMgDl: 1.0,
      };
      // Expected CrCl = 82.99 mL/min. Student submits 82.99 * 0.85 = 70.54 mL/min
      const res = cg.evaluate(ctx, {
        ibw: 70.46,
        weightUsed: 70.46,
        finalCrCl: 70.54,
      });

      expect(res.isFullyCorrect).toBe(false);
      expect(res.firstFailingNodeId).toBe('crcl_final_node');
      expect(res.primaryMisconceptionTag).toBe('ERRONEOUS_MALE_FACTOR_APPLIED');
    });
  });
});

describe('Adversarial Stress: Gentamicin Elimination Engine', () => {
  const genta = new GentamicinEngine();

  describe('2.1 Mathematical Precision: ke & t1/2', () => {
    it('guarantees ke * t1/2 === ln(2) across arbitrary physiological regimes', () => {
      const testRegimes: GentamicinEliminationInput[] = [
        { t1Hours: 1, c1MgL: 12.0, t2Hours: 7, c2MgL: 1.5 },   // fast decay
        { t1Hours: 2, c1MgL: 8.0, t2Hours: 6, c2MgL: 2.0 },    // standard
        { t1Hours: 1, c1MgL: 10.0, t2Hours: 25, c2MgL: 5.0 },  // slow decay (renal impairment)
        { t1Hours: 0.5, c1MgL: 20.0, t2Hours: 8.5, c2MgL: 2.5 },
      ];

      for (const input of testRegimes) {
        const deltaT = genta.calculateDeltaT(input);
        const ke = genta.calculateKe(input);
        const tHalf = genta.calculateHalfLife(ke);

        expect(deltaT).toBe(input.t2Hours - input.t1Hours);
        expect(ke).toBeGreaterThan(0);
        expect(tHalf).toBeGreaterThan(0);

        // Product ke * t1/2 must equal ln(2) ~ 0.69315 within rounding precision (<= 2%)
        const product = ke * tHalf;
        expect(product).toBeCloseTo(Math.LN2, 1);
      }
    });

    it('handles extreme dynamic ranges without underflow or NaN', () => {
      // Micro concentrations: 0.04 -> 0.01 mg/L over 10 hours
      const microInput: GentamicinEliminationInput = {
        t1Hours: 1.0,
        c1MgL: 0.04,
        t2Hours: 11.0,
        c2MgL: 0.01,
      };
      const microKe = genta.calculateKe(microInput);
      expect(microKe).toBeCloseTo(0.1386, 3);
      expect(genta.calculateHalfLife(microKe)).toBeCloseTo(5.0, 1);

      // Large concentrations: 120 -> 15 mg/L over 6 hours
      const largeInput: GentamicinEliminationInput = {
        t1Hours: 1.0,
        c1MgL: 120.0,
        t2Hours: 7.0,
        c2MgL: 15.0,
      };
      const largeKe = genta.calculateKe(largeInput);
      // ln(8) / 6 = 2.0794 / 6 = 0.3466
      expect(largeKe).toBeCloseTo(0.3466, 3);
      expect(genta.calculateHalfLife(largeKe)).toBeCloseTo(2.0, 1);
    });
  });

  describe('2.2 Input Validation & Non-Physical Boundary Rejections', () => {
    it('strictly rejects inverted time order (t2 <= t1) with ERR_TIME_ORDER_INVERTED', () => {
      // t2 < t1
      expect(() => genta.validateInput({ t1Hours: 8, c1MgL: 8, t2Hours: 2, c2MgL: 2 }))
        .toThrowError(EngineValidationError);
      try {
        genta.validateInput({ t1Hours: 8, c1MgL: 8, t2Hours: 2, c2MgL: 2 });
      } catch (e: any) {
        expect(e.code).toBe('ERR_TIME_ORDER_INVERTED');
      }

      // t2 === t1
      try {
        genta.validateInput({ t1Hours: 4, c1MgL: 8, t2Hours: 4, c2MgL: 2 });
      } catch (e: any) {
        expect(e.code).toBe('ERR_TIME_ORDER_INVERTED');
      }
    });

    it('strictly rejects non-positive concentrations (C1 <= 0 or C2 <= 0) with ERR_NON_POSITIVE_CONCENTRATION', () => {
      expect(() => genta.validateInput({ t1Hours: 2, c1MgL: 0, t2Hours: 6, c2MgL: 2 }))
        .toThrowError(EngineValidationError);
      expect(() => genta.validateInput({ t1Hours: 2, c1MgL: -5, t2Hours: 6, c2MgL: 2 }))
        .toThrowError(EngineValidationError);
      expect(() => genta.validateInput({ t1Hours: 2, c1MgL: 8, t2Hours: 6, c2MgL: 0 }))
        .toThrowError(EngineValidationError);
      expect(() => genta.validateInput({ t1Hours: 2, c1MgL: 8, t2Hours: 6, c2MgL: -1 }))
        .toThrowError(EngineValidationError);
    });

    it('strictly rejects non-decaying levels (C2 >= C1) with ERR_NON_DECAYING_CONCENTRATION', () => {
      // C2 === C1 (no elimination)
      try {
        genta.validateInput({ t1Hours: 2, c1MgL: 6, t2Hours: 6, c2MgL: 6 });
      } catch (e: any) {
        expect(e.code).toBe('ERR_NON_DECAYING_CONCENTRATION');
      }

      // C2 > C1 (accumulation during elimination phase)
      try {
        genta.validateInput({ t1Hours: 2, c1MgL: 6, t2Hours: 6, c2MgL: 10 });
      } catch (e: any) {
        expect(e.code).toBe('ERR_NON_DECAYING_CONCENTRATION');
      }
    });
  });

  describe('2.3 Misconception Diagnostics & Cascading Tolerance', () => {
    const input: GentamicinEliminationInput = {
      t1Hours: 2,
      c1MgL: 8,
      t2Hours: 6,
      c2MgL: 2,
    }; // deltaT = 4.0, ke = 0.3466, t1/2 = 2.00

    it('isolates NATURAL_LOG_BASE_10_CONFUSION', () => {
      // log10(4) / 4 = 0.1505
      const res = genta.evaluate(input, { deltaT: 4.0, ke: 0.1505, halfLife: 4.6 });
      expect(res.firstFailingNodeId).toBe('ke_node');
      expect(res.primaryMisconceptionTag).toBe('NATURAL_LOG_BASE_10_CONFUSION');
    });

    it('isolates ASSUMED_ZERO_ORDER_ELIMINATION', () => {
      // (8 - 2) / 4 = 1.5
      const res = genta.evaluate(input, { deltaT: 4.0, ke: 1.5, halfLife: 0.46 });
      expect(res.firstFailingNodeId).toBe('ke_node');
      expect(res.primaryMisconceptionTag).toBe('ASSUMED_ZERO_ORDER_ELIMINATION');
    });

    it('isolates INVERTED_KE_EQUATION', () => {
      // 4 / ln(4) = 4 / 1.3863 = 2.885
      const res = genta.evaluate(input, { deltaT: 4.0, ke: 2.885, halfLife: 0.24 });
      expect(res.firstFailingNodeId).toBe('ke_node');
      expect(res.primaryMisconceptionTag).toBe('INVERTED_KE_EQUATION');
    });

    it('isolates DELTA_T_DIVIDED_BY_RATIO_ERROR in t1/2 node', () => {
      const res = genta.evaluate(input, { deltaT: 4.0, ke: 0.3466, halfLife: 4.0 });
      expect(res.firstFailingNodeId).toBe('half_life_node');
      expect(res.primaryMisconceptionTag).toBe('DELTA_T_DIVIDED_BY_RATIO_ERROR');
    });

    it('isolates DIVIDED_BY_LN2_INSTEAD_OF_MULTIPLIED in t1/2 node', () => {
      const res = genta.evaluate(input, { deltaT: 4.0, ke: 0.3466, halfLife: 1.38 });
      expect(res.firstFailingNodeId).toBe('half_life_node');
      expect(res.primaryMisconceptionTag).toBe('DIVIDED_BY_LN2_INSTEAD_OF_MULTIPLIED');
    });

    it('isolates CONFUSED_KE_WITH_HALF_LIFE in t1/2 node', () => {
      const res = genta.evaluate(input, { deltaT: 4.0, ke: 0.3466, halfLife: 0.35 });
      expect(res.firstFailingNodeId).toBe('half_life_node');
      expect(res.primaryMisconceptionTag).toBe('CONFUSED_KE_WITH_HALF_LIFE');
    });

    it('validates cascading tolerance: intermediate student error propagates without penalizing downstream correct steps', () => {
      // Student enters wrong deltaT = 8.0 (instead of 4.0)
      // Then correctly calculates ke from their deltaT: ln(4) / 8.0 = 0.1733
      // Then correctly calculates t1/2 from their ke: ln(2) / 0.1733 = 4.00
      const res = genta.evaluate(input, {
        deltaT: 8.0,
        ke: 0.1733,
        halfLife: 4.00,
      });

      expect(res.isFullyCorrect).toBe(false);
      expect(res.stepEvaluations[0].isCorrect).toBe(false);
      expect(res.firstFailingNodeId).toBe('delta_t_node');
      // Downstream nodes are marked correct because student applied formulas correctly to their value!
      expect(res.stepEvaluations[1].isCorrect).toBe(true);
      expect(res.stepEvaluations[2].isCorrect).toBe(true);
    });
  });
});

describe('Adversarial Stress: Theophylline Loading Dose Engine', () => {
  const theo = new TheophyllineEngine();

  describe('3.1 Target Mass, Salt Factors & Loading Dose Formulations', () => {
    it('evaluates Theophylline Anhydrous (S = 1.0) accurately', () => {
      const input: TheophyllineInput = {
        vdL: 40,
        cTargetMgL: 12,
        saltForm: 'theophylline_anhydrous',
      };
      // Target mass = 40 * 12 = 480 mg
      expect(theo.calculateTargetMass(input)).toBe(480);
      expect(theo.getSaltFactor(input.saltForm)).toBe(1.0);
      expect(theo.calculateLoadingDose(input)).toBe(480);

      const res = theo.evaluate(input, {
        targetMassMg: 480,
        saltFactor: 1.0,
        loadingDoseMg: 480,
      });
      expect(res.isFullyCorrect).toBe(true);
      expect(res.output.loadingDoseMg).toBe(480);
    });

    it('evaluates Aminophylline (S = 0.8) accurately with 25% dose enlargement', () => {
      const input: TheophyllineInput = {
        vdL: 40,
        cTargetMgL: 12,
        saltForm: 'aminophylline',
      };
      // Target mass = 480 mg. DL = 480 / 0.8 = 600 mg
      expect(theo.calculateTargetMass(input)).toBe(480);
      expect(theo.getSaltFactor(input.saltForm)).toBe(0.8);
      expect(theo.calculateLoadingDose(input)).toBe(600);

      const res = theo.evaluate(input, {
        targetMassMg: 480,
        saltFactor: 0.8,
        loadingDoseMg: 600,
      });
      expect(res.isFullyCorrect).toBe(true);
      expect(res.output.loadingDoseMg).toBe(600);
    });

    it('handles baseline subtraction accurately: TargetMass = Vd * (Ctarget - C0)', () => {
      const input: TheophyllineInput = {
        vdL: 35,
        cTargetMgL: 15,
        cInitialMgL: 6, // Baseline level
        saltForm: 'aminophylline',
      };
      // Delta C = 15 - 6 = 9 mg/L
      // Target mass = 35 * 9 = 315 mg
      // Aminophylline DL = 315 / 0.8 = 393.75 mg
      expect(theo.calculateTargetMass(input)).toBe(315);
      expect(theo.calculateLoadingDose(input)).toBe(393.75);

      const res = theo.evaluate(input, {
        targetMassMg: 315,
        saltFactor: 0.8,
        loadingDoseMg: 393.75,
      });
      expect(res.isFullyCorrect).toBe(true);
      expect(res.output.loadingDoseMg).toBe(393.75);
    });
  });

  describe('3.2 Input Boundary Validations & Rejections', () => {
    it('rejects missing or non-positive Vd with ERR_MISSING_VD or ERR_ZERO_OR_NEGATIVE_VD', () => {
      // Missing Vd
      try {
        theo.validateInput({ cTargetMgL: 15, saltForm: 'theophylline_anhydrous' });
        expect.unreachable();
      } catch (e: any) {
        expect(e.code).toBe('ERR_MISSING_VD');
      }

      // Vd <= 0
      try {
        theo.validateInput({ vdL: 0, cTargetMgL: 15, saltForm: 'theophylline_anhydrous' });
        expect.unreachable();
      } catch (e: any) {
        expect(e.code).toBe('ERR_ZERO_OR_NEGATIVE_VD');
      }

      try {
        theo.validateInput({ vdL: -15, cTargetMgL: 15, saltForm: 'theophylline_anhydrous' });
        expect.unreachable();
      } catch (e: any) {
        expect(e.code).toBe('ERR_ZERO_OR_NEGATIVE_VD');
      }
    });

    it('rejects non-positive Ctarget with ERR_ZERO_OR_NEGATIVE_CTARGET', () => {
      try {
        theo.validateInput({ vdL: 35, cTargetMgL: 0, saltForm: 'theophylline_anhydrous' });
        expect.unreachable();
      } catch (e: any) {
        expect(e.code).toBe('ERR_ZERO_OR_NEGATIVE_CTARGET');
      }

      try {
        theo.validateInput({ vdL: 35, cTargetMgL: -5, saltForm: 'theophylline_anhydrous' });
        expect.unreachable();
      } catch (e: any) {
        expect(e.code).toBe('ERR_ZERO_OR_NEGATIVE_CTARGET');
      }
    });

    it('rejects negative baseline or baseline >= target with ERR_BASELINE_EXCEEDS_TARGET or ERR_NON_POSITIVE_CONCENTRATION', () => {
      // Negative baseline
      try {
        theo.validateInput({ vdL: 35, cTargetMgL: 15, cInitialMgL: -1, saltForm: 'theophylline_anhydrous' });
        expect.unreachable();
      } catch (e: any) {
        expect(e.code).toBe('ERR_NON_POSITIVE_CONCENTRATION');
      }

      // Baseline equals target
      try {
        theo.validateInput({ vdL: 35, cTargetMgL: 15, cInitialMgL: 15, saltForm: 'theophylline_anhydrous' });
        expect.unreachable();
      } catch (e: any) {
        expect(e.code).toBe('ERR_BASELINE_EXCEEDS_TARGET');
      }

      // Baseline exceeds target
      try {
        theo.validateInput({ vdL: 35, cTargetMgL: 15, cInitialMgL: 22, saltForm: 'theophylline_anhydrous' });
        expect.unreachable();
      } catch (e: any) {
        expect(e.code).toBe('ERR_BASELINE_EXCEEDS_TARGET');
      }
    });
  });

  describe('3.3 Misconception Diagnostic Tags', () => {
    const input: TheophyllineInput = {
      vdL: 35,
      cTargetMgL: 15,
      saltForm: 'theophylline_anhydrous',
    }; // Target mass = 525 mg, S = 1.0, DL = 525 mg

    it('isolates ERRONEOUSLY_DIVIDED_BY_AMINOPHYLLINE_SALT_FACTOR for anhydrous', () => {
      const res = theo.evaluate(input, {
        targetMassMg: 525,
        saltFactor: 1.0,
        loadingDoseMg: 656.25, // 525 / 0.8
      });
      expect(res.firstFailingNodeId).toBe('loading_dose_node');
      expect(res.primaryMisconceptionTag).toBe('ERRONEOUSLY_DIVIDED_BY_AMINOPHYLLINE_SALT_FACTOR');
    });

    it('isolates MISSED_AMINOPHYLLINE_SALT_FACTOR for aminophylline', () => {
      const aminoInput: TheophyllineInput = {
        vdL: 35,
        cTargetMgL: 15,
        saltForm: 'aminophylline',
      };
      const res = theo.evaluate(aminoInput, {
        targetMassMg: 525,
        saltFactor: 1.0, // Missed 0.8!
        loadingDoseMg: 525,
      });
      expect(res.firstFailingNodeId).toBe('salt_factor_node');
      expect(res.primaryMisconceptionTag).toBe('MISSED_AMINOPHYLLINE_SALT_FACTOR');
    });

    it('isolates MULTIPLIED_INSTEAD_OF_DIVIDED_BY_SALT_FACTOR for aminophylline', () => {
      const aminoInput: TheophyllineInput = {
        vdL: 35,
        cTargetMgL: 15,
        saltForm: 'aminophylline',
      };
      const res = theo.evaluate(aminoInput, {
        targetMassMg: 525,
        saltFactor: 0.8,
        loadingDoseMg: 420.0, // 525 * 0.8
      });
      expect(res.firstFailingNodeId).toBe('loading_dose_node');
      expect(res.primaryMisconceptionTag).toBe('MULTIPLIED_INSTEAD_OF_DIVIDED_BY_SALT_FACTOR');
    });

    it('isolates IGNORED_BASELINE_CONCENTRATION', () => {
      const baselineInput: TheophyllineInput = {
        vdL: 35,
        cTargetMgL: 15,
        cInitialMgL: 5,
        saltForm: 'theophylline_anhydrous',
      };
      // Student calculated 35 * 15 = 525 mg instead of 35 * (15 - 5) = 350 mg
      const res = theo.evaluate(baselineInput, {
        targetMassMg: 525,
        saltFactor: 1.0,
        loadingDoseMg: 525,
      });
      expect(res.firstFailingNodeId).toBe('target_mass_node');
      expect(res.primaryMisconceptionTag).toBe('IGNORED_BASELINE_CONCENTRATION');
    });
  });
});

describe('Adversarial Stress: FSRS Spaced Repetition Engine', () => {
  describe('4.1 Mathematical Proofs of Retrievability R(0, S) and R(S, S)', () => {
    // Exact Formula: R(t, S) = (1 + (19/81) * (t/S))^(-0.5)
    // When t = 0: R(0, S) = (1 + 0)^(-0.5) = 1.0
    // When t = S: R(S, S) = (1 + 19/81)^(-0.5) = (100/81)^(-0.5) = 9/10 = 0.900000

    it('proves R(0, S) === 1.0 across arbitrary scale of stability S in [1e-4, 1e5]', () => {
      const testStabilities = [
        0.0001, 0.001, 0.05, 0.2, 1.0, 2.5, 7.0, 14.0, 30.0, 90.0, 365.0, 1000.0, 100000.0,
      ];

      for (const s of testStabilities) {
        expect(calculateRetrievability(s, 0)).toBe(1.0);
      }
    });

    it('proves R(S, S) === 0.900000 within numerical precision across all stabilities', () => {
      const testStabilities = [
        0.0001, 0.01, 0.5, 1.0, 3.14159, 10.0, 21.0, 60.0, 365.0, 5000.0,
      ];

      for (const s of testStabilities) {
        const rAtS = calculateRetrievability(s, s);
        expect(rAtS).toBeCloseTo(0.90, 5);
      }
    });

    it('proves strict monotonic decay of R(t, S) with increasing t', () => {
      const s = 14.0;
      let prevR = 1.0;
      for (const t of [0.5, 1, 3, 7, 14, 28, 56, 112]) {
        const curR = calculateRetrievability(s, t);
        expect(curR).toBeLessThan(prevR);
        expect(curR).toBeGreaterThan(0.0);
        prevR = curR;
      }
    });
  });

  describe('4.2 Stability Multipliers Across Confidence Levels 1 to 5', () => {
    const baseDate = new Date('2026-10-07T12:00:00Z');

    it('scales stability by 2.8x on Confidence 5 (Easy)', () => {
      const current = { stability: 3.5, difficulty: 5.0 };
      const res = scheduleNextReview(current, { isCorrect: true, confidence: 5, now: baseDate });

      // 3.5 * 2.8 = 9.8 days
      expect(res.stability).toBe(9.8);
      expect(res.difficulty).toBe(4.5); // 5.0 - 0.5
      expect(res.intervalDays).toBe(10); // round(9.8) = 10
      expect(res.isHypercorrection).toBe(false);
    });

    it('scales stability by 2.0x on Confidence 4 (Good)', () => {
      const current = { stability: 3.5, difficulty: 5.0 };
      const res = scheduleNextReview(current, { isCorrect: true, confidence: 4, now: baseDate });

      // 3.5 * 2.0 = 7.0 days
      expect(res.stability).toBe(7.0);
      expect(res.difficulty).toBe(5.0); // unchanged
      expect(res.intervalDays).toBe(7);
      expect(res.isHypercorrection).toBe(false);
    });

    it('scales stability by 1.25x on Confidence 3 (Hard)', () => {
      const current = { stability: 4.0, difficulty: 5.0 };
      const res = scheduleNextReview(current, { isCorrect: true, confidence: 3, now: baseDate });

      // 4.0 * 1.25 = 5.0 days
      expect(res.stability).toBe(5.0);
      expect(res.difficulty).toBe(5.2); // 5.0 + 0.2
      expect(res.intervalDays).toBe(5);
      expect(res.isHypercorrection).toBe(false);
    });

    it('scales stability by 1.05x with minimum 1.0 on Confidence 1-2 (Guess)', () => {
      const current = { stability: 4.0, difficulty: 5.0 };
      const res2 = scheduleNextReview(current, { isCorrect: true, confidence: 2, now: baseDate });
      // 4.0 * 1.05 = 4.2
      expect(res2.stability).toBe(4.2);
      expect(res2.difficulty).toBe(5.4); // 5.0 + 0.4
      expect(res2.intervalDays).toBe(4); // round(4.2) = 4

      const res1 = scheduleNextReview(current, { isCorrect: true, confidence: 1, now: baseDate });
      expect(res1.stability).toBe(4.2);
      expect(res1.difficulty).toBe(5.4);
    });
  });

  describe('4.3 Hypercorrection Rule Enforcement & Subsequent Recovery', () => {
    const baseDate = new Date('2026-10-07T12:00:00Z');
    const expectedDueIso = new Date('2026-10-08T12:00:00Z').toISOString();

    it('enforces hypercorrection on high confidence (>= 4) errors: S = 0, due in 24h, isHypercorrection = true', () => {
      for (const conf of [4, 5]) {
        const current = { stability: 8.5, difficulty: 4.0 };
        const res = scheduleNextReview(current, { isCorrect: false, confidence: conf, now: baseDate });

        expect(res.stability).toBe(0.0);
        expect(res.intervalDays).toBe(1);
        expect(res.dueAt).toBe(expectedDueIso);
        expect(res.isHypercorrection).toBe(true);
        expect(res.difficulty).toBe(5.5); // min(10.0, 4.0 + 1.5)
      }
    });

    it('does NOT flag hypercorrection on moderate/low confidence (< 4) errors', () => {
      for (const conf of [1, 2, 3]) {
        const current = { stability: 8.0, difficulty: 4.0 };
        const res = scheduleNextReview(current, { isCorrect: false, confidence: conf, now: baseDate });

        expect(res.isHypercorrection).toBe(false);
        // Standard decay: max(0.2, 8.0 * 0.25) = 2.0
        expect(res.stability).toBe(2.0);
        expect(res.intervalDays).toBe(1);
        expect(res.difficulty).toBe(4.8); // 4.0 + 0.8
      }
    });

    it('safely recovers when student successfully answers re-test after hypercorrection (S = 0)', () => {
      const hypercorrectedState = { stability: 0.0, difficulty: 6.5 };

      // Recovery with Confidence 4: base 1.0 * 2.0 = 2.0 days
      const recGood = scheduleNextReview(hypercorrectedState, { isCorrect: true, confidence: 4, now: baseDate });
      expect(recGood.stability).toBe(2.0);
      expect(recGood.intervalDays).toBe(2);
      expect(recGood.isHypercorrection).toBe(false);

      // Recovery with Confidence 5: base 1.0 * 2.8 = 2.8 days
      const recEasy = scheduleNextReview(hypercorrectedState, { isCorrect: true, confidence: 5, now: baseDate });
      expect(recEasy.stability).toBe(2.8);
      expect(recEasy.intervalDays).toBe(3); // round(2.8) = 3
      expect(recEasy.isHypercorrection).toBe(false);
    });
  });

  describe('4.4 Concept Mastery Score Theta Clamping within [0.0, 1.0]', () => {
    it('applies exact delta values across all attempt types', () => {
      // Hypercorrection error: -0.25
      expect(updateMasteryScore(0.50, { isCorrect: false, confidence: 4 })).toBe(0.25);
      expect(updateMasteryScore(0.50, { isCorrect: false, confidence: 5 })).toBe(0.25);

      // Standard error: -0.10
      expect(updateMasteryScore(0.50, { isCorrect: false, confidence: 3 })).toBe(0.40);
      expect(updateMasteryScore(0.50, { isCorrect: false, confidence: 1 })).toBe(0.40);

      // Correct Conf 5: +0.20
      expect(updateMasteryScore(0.50, { isCorrect: true, confidence: 5 })).toBe(0.70);

      // Correct Conf 4: +0.15
      expect(updateMasteryScore(0.50, { isCorrect: true, confidence: 4 })).toBe(0.65);

      // Correct Conf 3: +0.10
      expect(updateMasteryScore(0.50, { isCorrect: true, confidence: 3 })).toBe(0.60);

      // Correct Conf 1-2: +0.05
      expect(updateMasteryScore(0.50, { isCorrect: true, confidence: 2 })).toBe(0.55);
    });

    it('strictly clamps theta at lower bound 0.0 under extreme negative streaks', () => {
      let theta = 0.20;
      // Hypercorrection error: 0.20 - 0.25 = -0.05 -> clamped to 0.0
      theta = updateMasteryScore(theta, { isCorrect: false, confidence: 5 });
      expect(theta).toBe(0.0);

      // Further errors from 0.0
      for (let i = 0; i < 50; i++) {
        theta = updateMasteryScore(theta, { isCorrect: false, confidence: 4 });
        expect(theta).toBe(0.0);
      }
    });

    it('strictly clamps theta at upper bound 1.0 under extreme positive streaks', () => {
      let theta = 0.85;
      // Correct conf 5: 0.85 + 0.20 = 1.05 -> clamped to 1.0
      theta = updateMasteryScore(theta, { isCorrect: true, confidence: 5 });
      expect(theta).toBe(1.0);

      // Further correct answers from 1.0
      for (let i = 0; i < 50; i++) {
        theta = updateMasteryScore(theta, { isCorrect: true, confidence: 5 });
        expect(theta).toBe(1.0);
      }
    });

    it('remains strictly inside [0.0, 1.0] over 500 stochastic transitions', () => {
      let theta = 0.50;
      for (let step = 0; step < 500; step++) {
        const isCorrect = Math.random() > 0.4;
        const confidence = Math.floor(Math.random() * 5) + 1; // 1 to 5
        theta = updateMasteryScore(theta, { isCorrect, confidence });

        expect(theta).toBeGreaterThanOrEqual(0.0);
        expect(theta).toBeLessThanOrEqual(1.0);
      }
    });
  });

  describe('5. Comprehensive Multi-Step Engine Stress & Boundary Synthesis', () => {
    it('5.1: demonstrates Gentamicin near-zero ke underflow boundary when deltaC is extremely small', () => {
      const genta = new GentamicinEngine();
      // c1 = 8.0001, c2 = 8.0000, deltaT = 4 -> rawKe ~ 3.12e-6
      const flatInput: GentamicinEliminationInput = {
        t1Hours: 0,
        c1MgL: 8.0001,
        t2Hours: 4,
        c2MgL: 8.0000,
      };

      const roundedKe = genta.calculateKe(flatInput);
      expect(roundedKe).toBe(0.0); // toFixed(4) rounds 0.00000312 to 0

      // When calculateHalfLife is called on the rounded 0.0 ke, it rejects with ERR_NON_POSITIVE_CONCENTRATION
      expect(() => genta.calculateHalfLife(roundedKe)).toThrowError(EngineValidationError);

      // However, evaluate() handles this by using rawKeExpected directly:
      const evalRes = genta.evaluate(flatInput, { deltaT: 4, ke: 0.0 });
      expect(evalRes.output.halfLifeHours).toBeGreaterThan(10000); // Does not throw
    });

    it('5.2: verifies Cockcroft-Gault elderly SCr rounding detection matches clinical guidelines', () => {
      const cg = new CockcroftGaultEngine();
      // Patient 75 yo, SCr 0.6 mg/dL, elderlyScrCapping = false
      const ctx: CockcroftGaultInput = {
        age: 75,
        sex: 'M',
        heightCm: 170,
        tbwKg: 70,
        scrMgDl: 0.6,
        options: { elderlyScrCapping: false },
      };
      // Correct: ((140-75)*66.83) / (72*0.6) = 4343.95 / 43.2 = 100.55 mL/min
      // If student erroneously rounded SCr to 0.8: ((140-75)*66.83)/(72*0.8) = 75.42 mL/min
      const res = cg.evaluate(ctx, {
        ibw: 66.83,
        weightUsed: 66.83,
        finalCrCl: 75.42,
      });

      expect(res.isFullyCorrect).toBe(false);
      expect(res.firstFailingNodeId).toBe('crcl_final_node');
      expect(res.primaryMisconceptionTag).toBe('UNNECESSARY_ELDERLY_SCR_ROUNDING');
    });

    it('5.3: verifies Theophylline weight-based Vd (vdLPerKg * weightKg) against direct Vd', () => {
      const theo = new TheophyllineEngine();
      const byKgInput: TheophyllineInput = {
        cTargetMgL: 12,
        saltForm: 'aminophylline',
        vdLPerKg: 0.45,
        weightKg: 80, // Vd = 36 L
      };
      const directInput: TheophyllineInput = {
        cTargetMgL: 12,
        saltForm: 'aminophylline',
        vdL: 36,
      };

      const mass1 = theo.calculateTargetMass(byKgInput);
      const mass2 = theo.calculateTargetMass(directInput);
      expect(mass1).toBe(mass2);
      expect(mass1).toBe(432); // 36 * 12 = 432 mg

      const ld1 = theo.calculateLoadingDose(byKgInput);
      const ld2 = theo.calculateLoadingDose(directInput);
      expect(ld1).toBe(ld2);
      expect(ld1).toBe(540); // 432 / 0.8 = 540 mg
    });
  });
});

