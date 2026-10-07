export type DrugEngineId =
  | 'cockcroft_gault'
  | 'gentamicin_elimination'
  | 'theophylline_loading_dose';

export interface BaseEvaluationNode<TNodeId extends string> {
  nodeId: TNodeId;
  nodeNameTr: string;
  expectedValue: number;
  submittedValue?: number;
  isCorrect: boolean;
  relativeErrorPct: number;
  misconceptionTag?: string;
  hintTr: string;
}

export interface EngineResult<TNodeId extends string, TOutput> {
  engineId: DrugEngineId;
  isFullyCorrect: boolean;
  output: TOutput;
  stepEvaluations: BaseEvaluationNode<TNodeId>[];
  firstFailingNodeId?: TNodeId;
  primaryMisconceptionTag?: string;
}

// -------------------------------------------------------------
// 1. Cockcroft-Gault Types
// -------------------------------------------------------------

export type CockcroftGaultNodeId =
  | 'ibw_node'
  | 'weight_selection_node'
  | 'crcl_final_node';

export interface CockcroftGaultInput {
  age: number; // 18 - 120
  sex: 'M' | 'F';
  heightCm: number; // 100 - 250 cm
  tbwKg: number; // 30 - 350 kg
  scrValue?: number; // > 0
  scrMgDl?: number; // backward compatibility alias for scrValue with mg/dL
  scrUnit?: 'mg/dL' | 'umol/L'; // default 'mg/dL'
  options?: {
    elderlyScrCapping?: boolean;
    elderlyScrFloor?: number; // default 0.8 or 1.0 mg/dL
  };
}

export interface CockcroftGaultStudentSteps {
  ibw?: number;
  weightUsed?: number;
  finalCrCl?: number;
}

export interface CockcroftGaultOutput {
  ibwKg: number;
  selectedWeightKg: number;
  weightCategory: 'TBW_LESS_THAN_IBW' | 'IDEAL_BW_NORMAL' | 'ADJUSTED_BW_OVER_120_IBW';
  crclRawMlMin: number;
  crclFinalMlMin: number;
}

// -------------------------------------------------------------
// 2. Gentamicin Elimination Types
// -------------------------------------------------------------

export type GentamicinNodeId =
  | 'delta_t_node'
  | 'ke_node'
  | 'half_life_node';

export interface GentamicinEliminationInput {
  t1Hours: number;
  c1MgL: number;
  t2Hours: number;
  c2MgL: number;
}

export interface GentamicinStudentSteps {
  deltaT?: number;
  ke?: number;
  halfLife?: number;
}

export interface GentamicinOutput {
  deltaTHours: number;
  concentrationRatio: number;
  keHrMinus1: number;
  halfLifeHours: number;
}

// -------------------------------------------------------------
// 3. Theophylline Loading Dose Types
// -------------------------------------------------------------

export type TheophyllineSaltForm =
  | 'theophylline_anhydrous'
  | 'aminophylline';

export type TheophyllineNodeId =
  | 'target_mass_node'
  | 'salt_factor_node'
  | 'loading_dose_node';

export interface TheophyllineInput {
  cTargetMgL: number;
  cInitialMgL?: number; // default 0
  saltForm: TheophyllineSaltForm;
  vdL?: number;
  vdLPerKg?: number;
  weightKg?: number;
}

export interface TheophyllineStudentSteps {
  targetMassMg?: number;
  saltFactor?: number;
  loadingDoseMg?: number;
}

export interface TheophyllineOutput {
  effectiveVdL: number;
  targetMassMg: number;
  saltFactor: number;
  loadingDoseMg: number;
}

// -------------------------------------------------------------
// Validation Errors
// -------------------------------------------------------------

export type EngineValidationErrorCode =
  | 'ERR_INVALID_AGE'
  | 'ERR_INVALID_HEIGHT'
  | 'ERR_INVALID_WEIGHT'
  | 'ERR_ZERO_OR_NEGATIVE_SCR'
  | 'ERR_TIME_ORDER_INVERTED'
  | 'ERR_NON_POSITIVE_CONCENTRATION'
  | 'ERR_NON_DECAYING_CONCENTRATION'
  | 'ERR_ZERO_OR_NEGATIVE_VD'
  | 'ERR_ZERO_OR_NEGATIVE_CTARGET'
  | 'ERR_BASELINE_EXCEEDS_TARGET'
  | 'ERR_MISSING_VD';

export class EngineValidationError extends Error {
  public readonly code: EngineValidationErrorCode;

  constructor(code: EngineValidationErrorCode, message: string) {
    super(message);
    this.name = 'EngineValidationError';
    this.code = code;
  }
}
