import {
  BaseEvaluationNode,
  EngineResult,
  EngineValidationError,
  GentamicinEliminationInput,
  GentamicinNodeId,
  GentamicinOutput,
  GentamicinStudentSteps,
} from './types';

export class GentamicinEngine {
  private readonly tolerance = 0.01; // 1% tolerance threshold

  public validateInput(input: GentamicinEliminationInput): void {
    if (input.t1Hours === undefined || input.t2Hours === undefined || input.t2Hours <= input.t1Hours) {
      throw new EngineValidationError(
        'ERR_TIME_ORDER_INVERTED',
        'İkinci ölçüm zamanı (t2), ilk ölçüm zamanından (t1) kesinlikle büyük olmalıdır.'
      );
    }

    if (input.c1MgL === undefined || input.c2MgL === undefined || input.c1MgL <= 0 || input.c2MgL <= 0) {
      throw new EngineValidationError(
        'ERR_NON_POSITIVE_CONCENTRATION',
        'Konsantrasyon ölçümleri 0 dan büyük pozitif değerler olmalıdır.'
      );
    }

    if (input.c2MgL >= input.c1MgL) {
      throw new EngineValidationError(
        'ERR_NON_DECAYING_CONCENTRATION',
        'Post-infüzyon eliminasyon fazında ikinci konsantrasyon (C2) ilk konsantrasyondan (C1) düşük olmalıdır.'
      );
    }
  }

  public calculateDeltaT(input: GentamicinEliminationInput): number {
    this.validateInput(input);
    return Number((input.t2Hours - input.t1Hours).toFixed(2));
  }

  public calculateKe(input: GentamicinEliminationInput): number {
    this.validateInput(input);
    const deltaT = input.t2Hours - input.t1Hours;
    const ke = Math.log(input.c1MgL / input.c2MgL) / deltaT;
    return Number(ke.toFixed(4));
  }

  public calculateHalfLife(ke: number): number {
    if (ke <= 0) {
      throw new EngineValidationError(
        'ERR_NON_POSITIVE_CONCENTRATION',
        'Hız sabiti (ke) pozitif olmalıdır.'
      );
    }
    return Number((Math.LN2 / ke).toFixed(2));
  }

  public evaluateDerivation(
    input: GentamicinEliminationInput,
    steps: GentamicinStudentSteps
  ): BaseEvaluationNode<GentamicinNodeId>[] {
    return this.evaluate(input, steps).stepEvaluations;
  }

  public evaluate(
    input: GentamicinEliminationInput,
    steps: GentamicinStudentSteps = {}
  ): EngineResult<GentamicinNodeId, GentamicinOutput> {
    this.validateInput(input);

    // 1. Node: delta_t_node
    const expectedDeltaT = Number((input.t2Hours - input.t1Hours).toFixed(2));
    const submittedDeltaT = steps.deltaT;
    const hasDeltaT = submittedDeltaT !== undefined;
    const deltaTRelErr = hasDeltaT
      ? Math.abs((submittedDeltaT - expectedDeltaT) / expectedDeltaT)
      : 1.0;
    const deltaTCorrect = hasDeltaT && deltaTRelErr <= this.tolerance;

    let deltaTTag: string | undefined;
    let deltaTHintTr = 'Zaman farkı: Δt = t2 - t1 formülüyle hesaplanır.';

    if (!deltaTCorrect && hasDeltaT) {
      if (submittedDeltaT < 0 || Math.abs(submittedDeltaT - (input.t1Hours - input.t2Hours)) <= 1e-4) {
        deltaTTag = 'DELTA_T_NEGATIVE_OR_INVERTED';
        deltaTHintTr = 'Zaman aralığı son zamandan ilk zaman çıkarılarak hesaplanır (t2 - t1).';
      } else {
        deltaTTag = 'DELTA_T_CALCULATION_ERROR';
        deltaTHintTr = 'Zaman aralığı t2 - t1 işlemini kontrol ediniz.';
      }
    }

    const deltaTEvaluation: BaseEvaluationNode<GentamicinNodeId> = {
      nodeId: 'delta_t_node',
      nodeNameTr: 'Zaman Farkı (Δt)',
      expectedValue: expectedDeltaT,
      submittedValue: submittedDeltaT,
      isCorrect: deltaTCorrect,
      relativeErrorPct: Number((deltaTRelErr * 100).toFixed(2)),
      misconceptionTag: deltaTTag,
      hintTr: deltaTHintTr,
    };

    // 2. Node: ke_node
    const effectiveDeltaT =
      deltaTCorrect || (submittedDeltaT !== undefined && submittedDeltaT > 0)
        ? submittedDeltaT!
        : expectedDeltaT;

    const rawKeExpected = Math.log(input.c1MgL / input.c2MgL) / expectedDeltaT;
    const expectedKe = Number(rawKeExpected.toFixed(4));

    const rawKeEffective = Math.log(input.c1MgL / input.c2MgL) / effectiveDeltaT;
    const effectiveKe = Number(rawKeEffective.toFixed(4));

    const submittedKe = steps.ke;
    const hasKe = submittedKe !== undefined;

    const keRelErrExpected = hasKe
      ? Math.abs((submittedKe - expectedKe) / expectedKe)
      : 1.0;
    const keRelErrEffective = hasKe
      ? Math.abs((submittedKe - effectiveKe) / effectiveKe)
      : 1.0;

    const keCorrect =
      hasKe && (keRelErrExpected <= this.tolerance || keRelErrEffective <= this.tolerance);
    const primaryKeRelErr = Math.min(keRelErrExpected, keRelErrEffective);

    let keTag: string | undefined;
    let keHintTr = 'Eliminasyon hız sabiti: ke = ln(C1 / C2) / Δt formülüyle hesaplanır.';

    if (!keCorrect && hasKe) {
      // Check: base-10 log instead of natural log (ln)
      const log10Ke = Math.log10(input.c1MgL / input.c2MgL) / effectiveDeltaT;
      const zeroOrderKe = (input.c1MgL - input.c2MgL) / effectiveDeltaT;
      const invertedKe = effectiveDeltaT / Math.log(input.c1MgL / input.c2MgL);

      if (Math.abs((submittedKe - log10Ke) / log10Ke) <= this.tolerance) {
        keTag = 'NATURAL_LOG_BASE_10_CONFUSION';
        keHintTr = 'Formülde 10 tabanında logaritma değil doğal logaritma (ln) kullanılmalıdır.';
      } else if (Math.abs((submittedKe - zeroOrderKe) / zeroOrderKe) <= this.tolerance) {
        keTag = 'ASSUMED_ZERO_ORDER_ELIMINATION';
        keHintTr = 'İlaç eliminasyonu sıfırıncı derece değil, birinci derece kinetik (ln C1/C2) izler.';
      } else if (Math.abs((submittedKe - invertedKe) / invertedKe) <= this.tolerance) {
        keTag = 'INVERTED_KE_EQUATION';
        keHintTr = 'Eliminasyon hız sabiti formülü ke = ln(C1/C2) / Δt şeklindedir.';
      } else {
        keTag = 'GENERAL_KE_OR_HALFLIFE_ERROR';
        keHintTr = 'ke = ln(C1 / C2) / Δt işlem basamaklarını kontrol ediniz.';
      }
    }

    const keEvaluation: BaseEvaluationNode<GentamicinNodeId> = {
      nodeId: 'ke_node',
      nodeNameTr: 'Eliminasyon Hız Sabiti (ke)',
      expectedValue: expectedKe,
      submittedValue: submittedKe,
      isCorrect: keCorrect,
      relativeErrorPct: Number((primaryKeRelErr * 100).toFixed(2)),
      misconceptionTag: keTag,
      hintTr: keHintTr,
    };

    // 3. Node: half_life_node
    const expectedHalfLife = Number((Math.LN2 / rawKeExpected).toFixed(2));
    const effectiveTargetKe =
      keCorrect || (submittedKe !== undefined && submittedKe > 0)
        ? submittedKe!
        : rawKeExpected;
    const effectiveHalfLife = Number((Math.LN2 / effectiveTargetKe).toFixed(2));

    const submittedHalfLife = steps.halfLife;
    const hasHalfLife = submittedHalfLife !== undefined;

    const hlRelErrExpected = hasHalfLife
      ? Math.abs((submittedHalfLife - expectedHalfLife) / expectedHalfLife)
      : 1.0;
    const hlRelErrEffective = hasHalfLife
      ? Math.abs((submittedHalfLife - effectiveHalfLife) / effectiveHalfLife)
      : 1.0;

    const halfLifeCorrect =
      hasHalfLife &&
      (hlRelErrExpected <= this.tolerance || hlRelErrEffective <= this.tolerance);
    const primaryHlRelErr = Math.min(hlRelErrExpected, hlRelErrEffective);

    let halfLifeTag: string | undefined;
    let halfLifeHintTr = 'Eliminasyon yarı ömrü: t1/2 = ln(2) / ke = 0.693 / ke formülüyle hesaplanır.';

    if (!halfLifeCorrect && hasHalfLife) {
      // Seed item distractors:
      // Option A: 4.00 saat (DELTA_T_DIVIDED_BY_RATIO_ERROR)
      // Option B: 1.38 saat (DIVIDED_BY_LN2_INSTEAD_OF_MULTIPLIED)
      // Option C: 0.34 saat (CONFUSED_KE_WITH_HALF_LIFE)

      const lnRatio = Math.log(input.c1MgL / input.c2MgL); // 1.3863
      const dividedByLn2 = effectiveTargetKe / Math.LN2; // ke / ln(2) ~ 0.50
      const multipliedByLn2 = effectiveTargetKe * Math.LN2; // ke * ln(2) ~ 0.24

      if (
        Math.abs(submittedHalfLife - 4.0) / 4.0 <= 0.02 ||
        Math.abs(submittedHalfLife - effectiveDeltaT) / effectiveDeltaT <= 0.02
      ) {
        halfLifeTag = 'DELTA_T_DIVIDED_BY_RATIO_ERROR';
        halfLifeHintTr =
          'Yarı ömür doğrudan zaman farkı veya basit oran değildir; t1/2 = ln(2) / ke formülü uygulanmalıdır.';
      } else if (
        Math.abs(submittedHalfLife - 1.38) / 1.38 <= 0.02 ||
        Math.abs(submittedHalfLife - lnRatio) / lnRatio <= 0.02 ||
        Math.abs(submittedHalfLife - dividedByLn2) / dividedByLn2 <= 0.02
      ) {
        halfLifeTag = 'DIVIDED_BY_LN2_INSTEAD_OF_MULTIPLIED';
        halfLifeHintTr =
          'Yarı ömür formülü t1/2 = 0.693 / ke şeklindedir, tersini yapmayınız.';
      } else if (
        Math.abs(submittedHalfLife - effectiveTargetKe) / effectiveTargetKe <= 0.02 ||
        Math.abs(submittedHalfLife - expectedKe) / expectedKe <= 0.02 ||
        Math.abs(submittedHalfLife - 0.34) / 0.34 <= 0.02
      ) {
        halfLifeTag = 'CONFUSED_KE_WITH_HALF_LIFE';
        halfLifeHintTr =
          'Hesapladığınız değer hız sabitidir (ke). Yarı ömür için ln(2) / ke yapılmalıdır.';
      } else if (Math.abs((submittedHalfLife - multipliedByLn2) / multipliedByLn2) <= this.tolerance) {
        halfLifeTag = 'MULTIPLIED_BY_LN2_INSTEAD_OF_DIVIDED';
        halfLifeHintTr =
          'Yarı ömür ke ile çarpılmaz, 0.693 ke ye bölünür.';
      } else {
        halfLifeTag = 'GENERAL_KE_OR_HALFLIFE_ERROR';
        halfLifeHintTr = 't1/2 = ln(2) / ke işlem basamağını kontrol ediniz.';
      }
    }

    const halfLifeEvaluation: BaseEvaluationNode<GentamicinNodeId> = {
      nodeId: 'half_life_node',
      nodeNameTr: 'Eliminasyon Yarı Ömrü (t1/2)',
      expectedValue: expectedHalfLife,
      submittedValue: submittedHalfLife,
      isCorrect: halfLifeCorrect,
      relativeErrorPct: Number((primaryHlRelErr * 100).toFixed(2)),
      misconceptionTag: halfLifeTag,
      hintTr: halfLifeHintTr,
    };

    const stepEvaluations = [deltaTEvaluation, keEvaluation, halfLifeEvaluation];
    const isFullyCorrect = stepEvaluations.every((s) => s.isCorrect);
    const firstFailing = stepEvaluations.find((s) => !s.isCorrect);

    const output: GentamicinOutput = {
      deltaTHours: expectedDeltaT,
      concentrationRatio: Number((input.c1MgL / input.c2MgL).toFixed(2)),
      keHrMinus1: expectedKe,
      halfLifeHours: expectedHalfLife,
    };

    return {
      engineId: 'gentamicin_elimination',
      isFullyCorrect,
      output,
      stepEvaluations,
      firstFailingNodeId: firstFailing?.nodeId,
      primaryMisconceptionTag: firstFailing?.misconceptionTag,
    };
  }
}

export { GentamicinEngine as GentamicinEliminationEngine };
