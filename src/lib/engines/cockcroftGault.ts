export interface PatientContext {
  age: number;
  sex: 'M' | 'F';
  heightCm: number;
  tbwKg: number;
  scrMgDl: number;
}

export interface StudentInputSteps {
  ibw?: number;
  weightUsed?: number;
  finalCrCl?: number;
}

export type FailingNodeId = 'ibw_node' | 'weight_selection_node' | 'crcl_final_node';

export interface StepEvaluation {
  nodeId: FailingNodeId;
  expectedValue: number;
  submittedValue: number;
  isCorrect: boolean;
  misconceptionTag?: string;
  hintTr: string;
}

export class CockcroftGaultEngine {
  private tolerance = 0.02; // 2% tolerance threshold

  public calculateIBW(ctx: PatientContext): number {
    const heightInches = ctx.heightCm / 2.54;
    const inchesOver60 = Math.max(0, heightInches - 60);
    const base = ctx.sex === 'M' ? 50.0 : 45.5;
    return Number((base + 2.3 * inchesOver60).toFixed(2));
  }

  public selectWeight(ctx: PatientContext, ibw: number): { weight: number; reason: string } {
    if (ctx.tbwKg < ibw) {
      return { weight: ctx.tbwKg, reason: 'TBW_LESS_THAN_IBW' };
    }
    if (ctx.tbwKg > 1.20 * ibw) {
      const adjBw = ibw + 0.4 * (ctx.tbwKg - ibw);
      return { weight: Number(adjBw.toFixed(2)), reason: 'ADJUSTED_BW_OVER_120_IBW' };
    }
    return { weight: ibw, reason: 'IDEAL_BW_NORMAL' };
  }

  public calculateCrCl(ctx: PatientContext, weightKg: number): number {
    const rawCrCl = ((140 - ctx.age) * weightKg) / (72.0 * ctx.scrMgDl);
    return Number((rawCrCl * (ctx.sex === 'F' ? 0.85 : 1.0)).toFixed(2));
  }

  public evaluateDerivation(ctx: PatientContext, steps: StudentInputSteps): StepEvaluation[] {
    const results: StepEvaluation[] = [];

    // 1. IBW Evaluation Node
    const expectedIBW = this.calculateIBW(ctx);
    const ibwCorrect = steps.ibw !== undefined && 
      Math.abs(steps.ibw - expectedIBW) / expectedIBW <= this.tolerance;

    results.push({
      nodeId: 'ibw_node',
      expectedValue: expectedIBW,
      submittedValue: steps.ibw ?? 0,
      isCorrect: ibwCorrect,
      misconceptionTag: ibwCorrect ? undefined : 'IBW_CALCULATION_ERROR',
      hintTr: ctx.sex === 'M'
        ? "Erkeklerde İVA = 50 + 2.3 × (Boy(inç) - 60). Boyu inçe çevirirken 2.54'e bölmeyi unutmayınız."
        : "Kadınlarda İVA = 45.5 + 2.3 × (Boy(inç) - 60). Başlangıç sabitini 45.5 alınız."
    });

    // 2. Weight Selection Node
    const { weight: expectedWeight, reason } = this.selectWeight(ctx, expectedIBW);
    const weightCorrect = steps.weightUsed !== undefined && 
      Math.abs(steps.weightUsed - expectedWeight) / expectedWeight <= this.tolerance;

    let weightTag: string | undefined;
    if (!weightCorrect && steps.weightUsed !== undefined) {
      if (Math.abs(steps.weightUsed - ctx.tbwKg) / ctx.tbwKg <= this.tolerance) {
        weightTag = 'USED_TBW_INSTEAD_OF_ADJ_OR_IBW';
      } else if (Math.abs(steps.weightUsed - expectedIBW) / expectedIBW <= this.tolerance) {
        weightTag = 'USED_IBW_WITHOUT_OBESITY_ADJUSTMENT';
      } else {
        weightTag = 'INVALID_WEIGHT_ARITHMETIC';
      }
    }

    results.push({
      nodeId: 'weight_selection_node',
      expectedValue: expectedWeight,
      submittedValue: steps.weightUsed ?? 0,
      isCorrect: weightCorrect,
      misconceptionTag: weightTag,
      hintTr: reason === 'ADJUSTED_BW_OVER_120_IBW'
        ? "Hastanın toplam ağırlığı İVA'nın %120'sini aşmaktadır. Düzeltilmiş Vücut Ağırlığı (DVA) formülü kullanılmalıdır."
        : "Hasta ağırlığı normal sınırlardadır; formülde İdeal Vücut Ağırlığı (İVA) kullanılmalıdır."
    });

    // 3. Final CrCl Execution Node
    const effectiveWeight = weightCorrect ? expectedWeight : (steps.weightUsed ?? expectedWeight);
    const rawCrCl = ((140 - ctx.age) * effectiveWeight) / (72.0 * ctx.scrMgDl);
    const expectedFinalCrCl = Number((rawCrCl * (ctx.sex === 'F' ? 0.85 : 1.0)).toFixed(2));

    const crclCorrect = steps.finalCrCl !== undefined && 
      Math.abs(steps.finalCrCl - expectedFinalCrCl) / expectedFinalCrCl <= this.tolerance;

    let crclTag: string | undefined;
    if (!crclCorrect && steps.finalCrCl !== undefined) {
      if (ctx.sex === 'F' && Math.abs(steps.finalCrCl - rawCrCl) / rawCrCl <= this.tolerance) {
        crclTag = 'MISSED_FEMALE_FACTOR_0_85';
      } else {
        crclTag = 'GENERAL_ARITHMETIC_OR_UNITS';
      }
    }

    results.push({
      nodeId: 'crcl_final_node',
      expectedValue: expectedFinalCrCl,
      submittedValue: steps.finalCrCl ?? 0,
      isCorrect: crclCorrect,
      misconceptionTag: crclTag,
      hintTr: crclTag === 'MISSED_FEMALE_FACTOR_0_85'
        ? 'Kadın hastalarda kas kütlesi düzeltmesi için sonuç 0.85 ile çarpılmalıdır.'
        : 'Paydadaki (72 × SCr) çarpımını ve işlem basamaklarını kontrol ediniz.'
    });

    return results;
  }
}
