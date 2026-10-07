import {
  BaseEvaluationNode,
  CockcroftGaultInput,
  CockcroftGaultNodeId,
  CockcroftGaultOutput,
  CockcroftGaultStudentSteps,
  EngineResult,
  EngineValidationError,
} from './types';

// Backward compatibility type aliases
export type PatientContext = CockcroftGaultInput;
export type StudentInputSteps = CockcroftGaultStudentSteps;
export type FailingNodeId = CockcroftGaultNodeId;
export type StepEvaluation = BaseEvaluationNode<CockcroftGaultNodeId>;

export class CockcroftGaultEngine {
  private readonly tolerance = 0.02; // 2% tolerance threshold

  public validateInput(input: CockcroftGaultInput): void {
    if (input.age === undefined || input.age < 18 || input.age > 120) {
      throw new EngineValidationError(
        'ERR_INVALID_AGE',
        'Hasta yaşı 18 ile 120 arasında bir yetişkin değeri olmalıdır.'
      );
    }

    if (input.heightCm === undefined || input.heightCm < 100 || input.heightCm > 250) {
      throw new EngineValidationError(
        'ERR_INVALID_HEIGHT',
        'Hasta boyu 100 ile 250 cm arasında olmalıdır.'
      );
    }

    if (input.tbwKg === undefined || input.tbwKg < 30 || input.tbwKg > 350) {
      throw new EngineValidationError(
        'ERR_INVALID_WEIGHT',
        'Hasta toplam vücut ağırlığı 30 ile 350 kg arasında olmalıdır.'
      );
    }

    const scr = input.scrValue ?? input.scrMgDl;
    if (scr === undefined || scr <= 0) {
      throw new EngineValidationError(
        'ERR_ZERO_OR_NEGATIVE_SCR',
        'Serum kreatinin değeri 0 dan büyük pozitif bir değer olmalıdır.'
      );
    }
  }

  public getEffectiveScr(input: CockcroftGaultInput): {
    effectiveScrMgDl: number;
    rawScrValue: number;
    unit: 'mg/dL' | 'umol/L';
    wasCapped: boolean;
  } {
    const rawScrValue = input.scrValue ?? input.scrMgDl ?? 0;
    const unit = input.scrUnit ?? 'mg/dL';
    let effectiveScrMgDl = unit === 'umol/L' ? rawScrValue / 88.4 : rawScrValue;
    let wasCapped = false;

    if (input.options?.elderlyScrCapping && input.age >= 65) {
      const floor = input.options.elderlyScrFloor ?? 0.8;
      if (effectiveScrMgDl < floor) {
        effectiveScrMgDl = floor;
        wasCapped = true;
      }
    }

    return { effectiveScrMgDl, rawScrValue, unit, wasCapped };
  }

  public calculateIBW(ctx: CockcroftGaultInput): number {
    this.validateInput(ctx);
    const heightInches = ctx.heightCm / 2.54;
    const inchesOver60 = Math.max(0, heightInches - 60);
    const base = ctx.sex === 'M' ? 50.0 : 45.5;
    return Number((base + 2.3 * inchesOver60).toFixed(2));
  }

  public selectWeight(
    ctx: CockcroftGaultInput,
    ibw: number
  ): {
    weight: number;
    reason: 'TBW_LESS_THAN_IBW' | 'IDEAL_BW_NORMAL' | 'ADJUSTED_BW_OVER_120_IBW';
  } {
    this.validateInput(ctx);
    if (ctx.tbwKg < ibw) {
      return { weight: ctx.tbwKg, reason: 'TBW_LESS_THAN_IBW' };
    }
    if (ctx.tbwKg > 1.2 * ibw) {
      const adjBw = ibw + 0.4 * (ctx.tbwKg - ibw);
      return { weight: Number(adjBw.toFixed(2)), reason: 'ADJUSTED_BW_OVER_120_IBW' };
    }
    return { weight: ibw, reason: 'IDEAL_BW_NORMAL' };
  }

  public calculateCrCl(ctx: CockcroftGaultInput, weightKg: number): number {
    this.validateInput(ctx);
    const { effectiveScrMgDl } = this.getEffectiveScr(ctx);
    const rawCrCl = ((140 - ctx.age) * weightKg) / (72.0 * effectiveScrMgDl);
    return Number((rawCrCl * (ctx.sex === 'F' ? 0.85 : 1.0)).toFixed(2));
  }

  public evaluateDerivation(
    ctx: CockcroftGaultInput,
    steps: CockcroftGaultStudentSteps
  ): BaseEvaluationNode<CockcroftGaultNodeId>[] {
    return this.evaluate(ctx, steps).stepEvaluations;
  }

  public evaluate(
    ctx: CockcroftGaultInput,
    steps: CockcroftGaultStudentSteps = {}
  ): EngineResult<CockcroftGaultNodeId, CockcroftGaultOutput> {
    this.validateInput(ctx);
    const { effectiveScrMgDl, rawScrValue, unit, wasCapped } = this.getEffectiveScr(ctx);

    // 1. Node: ibw_node
    const expectedIBW = this.calculateIBW(ctx);
    const submittedIBW = steps.ibw;
    const hasIbw = submittedIBW !== undefined;
    const ibwRelErr = hasIbw
      ? Math.abs((submittedIBW - expectedIBW) / expectedIBW)
      : 1.0;
    const ibwCorrect = hasIbw && ibwRelErr <= this.tolerance;

    let ibwTag: string | undefined;
    if (!ibwCorrect && hasIbw) {
      ibwTag = 'IBW_CALCULATION_ERROR';
    }

    const ibwEvaluation: BaseEvaluationNode<CockcroftGaultNodeId> = {
      nodeId: 'ibw_node',
      nodeNameTr: 'İdeal Vücut Ağırlığı (İVA)',
      expectedValue: expectedIBW,
      submittedValue: submittedIBW,
      isCorrect: ibwCorrect,
      relativeErrorPct: Number((ibwRelErr * 100).toFixed(2)),
      misconceptionTag: ibwTag,
      hintTr:
        ctx.sex === 'M'
          ? "Erkeklerde İVA = 50 + 2.3 × (Boy(inç) - 60). Boyu inçe çevirirken 2.54'e bölmeyi unutmayınız."
          : "Kadınlarda İVA = 45.5 + 2.3 × (Boy(inç) - 60). Başlangıç sabitini 45.5 alınız.",
    };

    // 2. Node: weight_selection_node
    const { weight: expectedWeight, reason } = this.selectWeight(ctx, expectedIBW);
    const submittedWeight = steps.weightUsed;
    const hasWeight = submittedWeight !== undefined;
    const weightRelErr = hasWeight
      ? Math.abs((submittedWeight - expectedWeight) / expectedWeight)
      : 1.0;
    const weightCorrect = hasWeight && weightRelErr <= this.tolerance;

    let weightTag: string | undefined;
    let weightHintTr =
      reason === 'ADJUSTED_BW_OVER_120_IBW'
        ? "Hastanın toplam ağırlığı İVA'nın %120'sini aşmaktadır. Düzeltilmiş Vücut Ağırlığı (DVA) formülü kullanılmalıdır."
        : reason === 'TBW_LESS_THAN_IBW'
        ? 'Zayıf hastalarda kas kütlesi azaldığı için İVA değil gerçek vücut ağırlığı (TVA) kullanılır.'
        : 'Hasta ağırlığı normal sınırlardadır; formülde İdeal Vücut Ağırlığı (İVA) kullanılmalıdır.';

    if (!weightCorrect && hasWeight) {
      if (reason === 'ADJUSTED_BW_OVER_120_IBW') {
        if (Math.abs(submittedWeight - ctx.tbwKg) / ctx.tbwKg <= this.tolerance) {
          weightTag = 'USED_TBW_INSTEAD_OF_ADJ_OR_IBW';
          weightHintTr =
            "Hastanın ağırlığı İVA'nın %120'sini aşmaktadır; Düzeltilmiş Vücut Ağırlığı (DVA) kullanılmalıdır.";
        } else if (Math.abs(submittedWeight - expectedIBW) / expectedIBW <= this.tolerance) {
          weightTag = 'USED_IBW_WITHOUT_OBESITY_ADJUSTMENT';
          weightHintTr =
            'Obez hastada yalnızca İVA kullanmak klerensi düşük tahmin ettirir; DVA formülünü uygulayınız.';
        } else {
          weightTag = 'INVALID_WEIGHT_ARITHMETIC';
          weightHintTr = 'DVA = İVA + 0.4 × (TVA - İVA) formülündeki hesaplamayı kontrol ediniz.';
        }
      } else if (reason === 'TBW_LESS_THAN_IBW') {
        if (Math.abs(submittedWeight - expectedIBW) / expectedIBW <= this.tolerance) {
          weightTag = 'USED_IBW_WHEN_UNDERWEIGHT';
          weightHintTr =
            'Zayıf hastalarda kas kütlesi azaldığı için İVA değil gerçek vücut ağırlığı (TVA) kullanılır.';
        } else {
          weightTag = 'INVALID_WEIGHT_ARITHMETIC';
        }
      } else {
        // IDEAL_BW_NORMAL
        const hypotheticalAdj = expectedIBW + 0.4 * (ctx.tbwKg - expectedIBW);
        if (
          hypotheticalAdj > 0 &&
          Math.abs(submittedWeight - hypotheticalAdj) / hypotheticalAdj <= this.tolerance
        ) {
          weightTag = 'USED_ADJUSTED_WEIGHT_WHEN_NOT_OBESE';
          weightHintTr = 'Hasta obez değildir; DVA yerine İVA kullanılmalıdır.';
        } else if (Math.abs(submittedWeight - ctx.tbwKg) / ctx.tbwKg <= this.tolerance) {
          weightTag = 'USED_TBW_INSTEAD_OF_ADJ_OR_IBW';
          weightHintTr = 'Normal kilolu hastalarda TVA yerine İVA kullanılmalıdır.';
        } else {
          weightTag = 'INVALID_WEIGHT_ARITHMETIC';
        }
      }
    }

    const weightEvaluation: BaseEvaluationNode<CockcroftGaultNodeId> = {
      nodeId: 'weight_selection_node',
      nodeNameTr: 'Formülde Kullanılacak Ağırlık Seçimi',
      expectedValue: expectedWeight,
      submittedValue: submittedWeight,
      isCorrect: weightCorrect,
      relativeErrorPct: Number((weightRelErr * 100).toFixed(2)),
      misconceptionTag: weightTag,
      hintTr: weightHintTr,
    };

    // 3. Node: crcl_final_node
    const effectiveWeightForCalculation = weightCorrect
      ? expectedWeight
      : submittedWeight ?? expectedWeight;

    const rawCrClWithExpectedWeight =
      ((140 - ctx.age) * expectedWeight) / (72.0 * effectiveScrMgDl);
    const expectedFinalCrCl = Number(
      (rawCrClWithExpectedWeight * (ctx.sex === 'F' ? 0.85 : 1.0)).toFixed(2)
    );

    const rawCrClWithEffectiveWeight =
      ((140 - ctx.age) * effectiveWeightForCalculation) / (72.0 * effectiveScrMgDl);
    const finalCrClWithEffectiveWeight = Number(
      (rawCrClWithEffectiveWeight * (ctx.sex === 'F' ? 0.85 : 1.0)).toFixed(2)
    );

    const submittedCrCl = steps.finalCrCl;
    const hasCrCl = submittedCrCl !== undefined;

    // Check if correct against either ideal derivation or cascading from student's selected weight
    const crclRelErrExpected = hasCrCl
      ? Math.abs((submittedCrCl - expectedFinalCrCl) / expectedFinalCrCl)
      : 1.0;
    const crclRelErrEffective = hasCrCl
      ? Math.abs((submittedCrCl - finalCrClWithEffectiveWeight) / finalCrClWithEffectiveWeight)
      : 1.0;

    const crclCorrect =
      hasCrCl && (crclRelErrExpected <= this.tolerance || crclRelErrEffective <= this.tolerance);
    const primaryRelErr = Math.min(crclRelErrExpected, crclRelErrEffective);

    let crclTag: string | undefined;
    let crclHintTr =
      'Paydadaki (72 × SCr) çarpımını ve işlem basamaklarını kontrol ediniz.';

    if (!crclCorrect && hasCrCl) {
      // Check 1: Missed female 0.85 factor
      const uncorrectedFemaleCrClExpected = rawCrClWithExpectedWeight;
      const uncorrectedFemaleCrClEffective = rawCrClWithEffectiveWeight;
      if (
        ctx.sex === 'F' &&
        (Math.abs(submittedCrCl - uncorrectedFemaleCrClExpected) / uncorrectedFemaleCrClExpected <=
          this.tolerance ||
          Math.abs(submittedCrCl - uncorrectedFemaleCrClEffective) / uncorrectedFemaleCrClEffective <=
            this.tolerance)
      ) {
        crclTag = 'MISSED_FEMALE_FACTOR_0_85';
        crclHintTr =
          'Kadın hastalarda kas kütlesi düzeltmesi için sonuç 0.85 ile çarpılmalıdır.';
      }
      // Check 2: Erroneously applied 0.85 to male
      else if (
        ctx.sex === 'M' &&
        (Math.abs(submittedCrCl - rawCrClWithExpectedWeight * 0.85) /
          (rawCrClWithExpectedWeight * 0.85) <=
          this.tolerance ||
          Math.abs(submittedCrCl - rawCrClWithEffectiveWeight * 0.85) /
            (rawCrClWithEffectiveWeight * 0.85) <=
            this.tolerance)
      ) {
        crclTag = 'ERRONEOUS_MALE_FACTOR_APPLIED';
        crclHintTr = '0.85 düzeltme faktörü yalnızca kadın hastalara özgüdür.';
      }
      // Check 3: Did not convert umol/L to mg/dL (used raw umol/L in denominator with 72)
      else if (
        unit === 'umol/L' &&
        (Math.abs(
          submittedCrCl -
            ((140 - ctx.age) * effectiveWeightForCalculation) /
              (72.0 * rawScrValue) *
              (ctx.sex === 'F' ? 0.85 : 1.0)
        ) /
          Math.max(
            1e-6,
            ((140 - ctx.age) * effectiveWeightForCalculation) /
              (72.0 * rawScrValue) *
              (ctx.sex === 'F' ? 0.85 : 1.0)
          ) <=
          this.tolerance ||
          Math.abs(
            submittedCrCl -
              ((140 - ctx.age) * expectedWeight) /
                (72.0 * rawScrValue) *
                (ctx.sex === 'F' ? 0.85 : 1.0)
          ) /
            Math.max(
              1e-6,
              ((140 - ctx.age) * expectedWeight) /
                (72.0 * rawScrValue) *
                (ctx.sex === 'F' ? 0.85 : 1.0)
            ) <=
            this.tolerance)
      ) {
        crclTag = 'SCR_UNITS_NOT_CONVERTED';
        crclHintTr =
          'Serum kreatinin μmol/L verildiğinde 88.4 e bölünerek mg/dL ye çevrilmelidir.';
      }
      // Check 4: Denominator order of operations error: ((140-age)*W / 72) * SCr
      else if (
        Math.abs(
          submittedCrCl -
            (((140 - ctx.age) * effectiveWeightForCalculation) / 72.0) *
              effectiveScrMgDl *
              (ctx.sex === 'F' ? 0.85 : 1.0)
        ) /
          Math.max(
            1e-6,
            (((140 - ctx.age) * effectiveWeightForCalculation) / 72.0) *
              effectiveScrMgDl *
              (ctx.sex === 'F' ? 0.85 : 1.0)
          ) <=
        this.tolerance
      ) {
        crclTag = 'DENOMINATOR_ORDER_OF_OPERATIONS_ERROR';
        crclHintTr =
          'Paydadaki (72 × SCr) çarpımını parantez içinde yapmayı unutmayınız.';
      }
      // Check 5: Unnecessary elderly SCr rounding when not configured
      else if (
        !wasCapped &&
        ctx.age >= 65 &&
        effectiveScrMgDl < 0.8 &&
        Math.abs(
          submittedCrCl -
            (((140 - ctx.age) * effectiveWeightForCalculation) / (72.0 * 0.8)) *
              (ctx.sex === 'F' ? 0.85 : 1.0)
        ) /
          ((((140 - ctx.age) * effectiveWeightForCalculation) / (72.0 * 0.8)) *
            (ctx.sex === 'F' ? 0.85 : 1.0)) <=
          this.tolerance
      ) {
        crclTag = 'UNNECESSARY_ELDERLY_SCR_ROUNDING';
        crclHintTr =
          'Klinik talimat verilmedikçe yaşlı hastalarda serum kreatinin değerini taban değere yuvarlamayınız.';
      } else {
        crclTag = 'GENERAL_ARITHMETIC_OR_UNITS';
        crclHintTr =
          'Paydadaki (72 × SCr) çarpımını ve işlem basamaklarını kontrol ediniz.';
      }
    }

    const crclEvaluation: BaseEvaluationNode<CockcroftGaultNodeId> = {
      nodeId: 'crcl_final_node',
      nodeNameTr: 'Nihai Kreatinin Klerensi (CrCl)',
      expectedValue: expectedFinalCrCl,
      submittedValue: submittedCrCl,
      isCorrect: crclCorrect,
      relativeErrorPct: Number((primaryRelErr * 100).toFixed(2)),
      misconceptionTag: crclTag,
      hintTr: crclHintTr,
    };

    const stepEvaluations = [ibwEvaluation, weightEvaluation, crclEvaluation];
    const isFullyCorrect = stepEvaluations.every((s) => s.isCorrect);
    const firstFailing = stepEvaluations.find((s) => !s.isCorrect);

    const output: CockcroftGaultOutput = {
      ibwKg: expectedIBW,
      selectedWeightKg: expectedWeight,
      weightCategory: reason,
      crclRawMlMin: Number(rawCrClWithExpectedWeight.toFixed(2)),
      crclFinalMlMin: expectedFinalCrCl,
    };

    return {
      engineId: 'cockcroft_gault',
      isFullyCorrect,
      output,
      stepEvaluations,
      firstFailingNodeId: firstFailing?.nodeId,
      primaryMisconceptionTag: firstFailing?.misconceptionTag,
    };
  }
}
