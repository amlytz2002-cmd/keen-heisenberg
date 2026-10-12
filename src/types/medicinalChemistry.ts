/**
 * CENNA.live Clinical Rescue & Molecular Design Sandbox Platform
 * Strict TypeScript Mission Contracts, Models, and Physiological Calculators
 *
 * @license CENNA.live 2026
 */

export type MissionModuleId = 'mod-1' | 'mod-2' | 'mod-3' | 'mod-4' | 'mod-5' | 'mod-6';

export type ToolItemType =
  | 'functional_group'
  | 'bioisostere'
  | 'protecting_group'
  | 'antidote'
  | 'atom'
  | 'conformation'
  | 'steric_shield'
  | 'prodrug_mask';

export interface ChemicalDelta {
  logPDelta?: number;
  halfLifeDeltaMinutes?: number;
  pKaDelta?: number;
  stericHindranceScore?: number; // 0 - 100
  affinityDeltaG?: number;       // kcal/mol
  cypCleavageShield?: boolean;
  esteraseShield?: boolean;
}

export interface MolecularToolboxItem {
  id: string;
  name: string;
  formula: string;
  chemicalFormula?: string;
  type: ToolItemType;
  category?: string;
  deltaLogP: number;
  deltaAffinity: number;
  halfLifeMultiplier: number;
  shieldingFactor: number;
  toxicityRisk: number;
  description: string;
  smilesFragment?: string;
  isCorrect?: boolean;
  consequenceFeedback?: string;
  chemicalDelta?: ChemicalDelta;
  iconSvg?: string;
}

export interface LiveGauges {
  logP: number;
  percentIonized: number;
  metabolicHalfLifeMinutes: number;
  receptorAffinityDeltaG: number;
  bloodBrainBarrierPenetration?: number; // 0 - 100%
  // Extended gauge parameters for sandbox views
  initialLogP?: number;
  targetLogPRange?: [number, number];
  initialHalfLifeMinutes?: number;
  targetHalfLifeMinutes?: number;
  initialIonizationPercent?: number;
  targetIonizationPercent?: number;
  initialAffinityDeltaG?: number;
  targetAffinityDeltaG?: number;
  baselineVitals?: PatientVitals;
}

export type PatientVitalsStatus = 'critical' | 'unstable' | 'stabilizing' | 'normalized';

export interface PatientVitals {
  heartRateBpm: number;
  bloodPressureSys: number;
  bloodPressureDia: number;
  gastricPh: number;
  liverEnzymeAlt: number;
  status: PatientVitalsStatus;
  // Extended monitor properties for widgets
  heartRate?: number;
  bloodPressure?: string;
  gastricBleedingRiskPercent?: number;
  liverToxicityPercent?: number;
  targetOrganPerfusionPercent?: number;
  overallStabilityScore?: number;
}

export type PuzzleWidgetType =
  | 'molecular_toolbox'
  | 'enzyme_cleavage_simulator'
  | 'receptor_pocket_fit'
  | 'patient_vitals_monitor';

export interface SimulationFeedback {
  successTitle: string;
  successExplanation: string;
  successExplanationHtml?: string;
  failureTitle?: string;
  failureExplanation?: string;
  failureExplanationHtml?: string;
}

export interface PuzzleStep {
  id: string;
  order: number;
  stepNumber?: number;
  prompt: string;
  title?: string;
  instructionHtml?: string;
  widgetType: PuzzleWidgetType;
  targetParameter?: string;
  expectedValue?: number | string;
  tolerance?: number;
  hintChain?: [string, string, string];
  socraticHintChain?: [string, string, string];
  availableToolIds?: string[];
  optimalToolId?: string;
  acceptableToolIds?: string[];
  simulationFeedback?: SimulationFeedback;
}

export interface VictoryTrigger {
  conditionDescription: string;
  ahaExplanation: string;
  pearl: string;
  condition?: string;
  ahaMomentHtml?: string;
  clinicalPearl?: string;
  xpReward?: number;
  estimatedDurationMinutes?: number;
}

export interface ClinicalCrisis {
  presentation: string;
  vignette: string;
  biochemicalFlaw: string;
  patientInitialVitals: PatientVitals;
  // Extended clinical vignette fields
  patientCode?: string;
  patientAgeGender?: string;
  clinicalScenario?: string;
  failingMolecule?: {
    name: string;
    chemicalName?: string;
    flawDescription?: string;
    structureSvg?: string;
  };
  initialVitals?: PatientVitals;
}

export interface ClinicalRescueMission {
  id: string; // 'mission-1' through 'mission-21'
  missionNumber?: number; // 1 to 21
  order: number;
  moduleId: string; // 'mod-1' through 'mod-6'
  moduleTitle: string;
  title: string;
  subtitle: string;
  conceptTag?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  facultySlideReference?: string;
  xpReward: number;
  estimatedMinutes: number;
  failingMoleculeName: string;
  failingMoleculeSmiles?: string;
  targetTargetName: string;
  targetSystemType?: 'enzyme' | 'receptor' | 'barrier' | 'transporter' | 'dna';
  clinicalCrisis: ClinicalCrisis;
  crisis?: ClinicalCrisis;
  initialGauges: LiveGauges;
  gauges?: LiveGauges;
  optimalGauges: Partial<LiveGauges>;
  molecularToolbox: MolecularToolboxItem[];
  toolbox?: MolecularToolboxItem[];
  solutionItemIds: string[];
  steps: PuzzleStep[];
  victoryTrigger: VictoryTrigger;
  victory?: VictoryTrigger;
  socraticHintChain: [string, string, string];
  hints?: [string, string, string];
}

export interface MissionModule {
  id: string; // 'mod-1' to 'mod-6'
  moduleNumber: number;
  title: string;
  shortDescription: string;
  badgeText: string;
  colorTheme: 'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'cyan';
  missions: ClinicalRescueMission[];
}

export interface MissionValidationResult {
  isSuccess: boolean;
  score: number;
  stars: number;
  feedback: string;
  clinicalExplanation: string;
}

// ============================================================================
// Genuine Biophysical & Physiological Calculation Engines
// ============================================================================

/**
 * Calculates modified pharmacokinetic and thermodynamic gauges when molecular tools are applied.
 */
export function calculateModifiedGauges(
  initialGauges: LiveGauges,
  selectedItems: MolecularToolboxItem[]
): LiveGauges {
  let logP = initialGauges.logP;
  let percentIonized = initialGauges.percentIonized;
  let halfLife = initialGauges.metabolicHalfLifeMinutes;
  let affinityDeltaG = initialGauges.receptorAffinityDeltaG;
  let bbb = initialGauges.bloodBrainBarrierPenetration ?? 10;

  for (const item of selectedItems) {
    logP += item.deltaLogP;
    affinityDeltaG += item.deltaAffinity;
    halfLife *= item.halfLifeMultiplier;

    if (item.chemicalDelta?.pKaDelta) {
      percentIonized = Math.min(100, Math.max(0, percentIonized + item.chemicalDelta.pKaDelta * 8));
    }
    if (item.shieldingFactor > 0) {
      // Enzymatic shielding extends half-life proportionally
      halfLife *= (1 + item.shieldingFactor * 0.5);
    }
  }

  // Calculate Blood-Brain Barrier (BBB) penetration dynamically based on LogP (optimal 1.5 - 2.5)
  const logPOptimalDiff = Math.abs(logP - 2.0);
  if (logPOptimalDiff < 0.5) {
    bbb = Math.min(98, 80 + (0.5 - logPOptimalDiff) * 36);
  } else if (logPOptimalDiff < 1.5) {
    bbb = Math.max(15, 80 - (logPOptimalDiff - 0.5) * 50);
  } else {
    bbb = Math.max(2, 20 - logPOptimalDiff * 5);
  }

  return {
    logP: Number(logP.toFixed(2)),
    percentIonized: Number(Math.min(100, Math.max(0, percentIonized)).toFixed(1)),
    metabolicHalfLifeMinutes: Number(Math.max(0.5, halfLife).toFixed(1)),
    receptorAffinityDeltaG: Number(affinityDeltaG.toFixed(2)),
    bloodBrainBarrierPenetration: Number(bbb.toFixed(1)),
  };
}

/**
 * Dynamically computes patient vital signs based on molecular gauge convergence toward optimal values.
 */
export function evaluateVitalsResponse(
  initialVitals: PatientVitals,
  currentGauges: LiveGauges,
  mission: ClinicalRescueMission
): PatientVitals {
  const opt = mission.optimalGauges;
  let totalDeviations = 0;
  let checkedCount = 0;

  if (opt.logP !== undefined) {
    totalDeviations += Math.min(2, Math.abs(currentGauges.logP - opt.logP));
    checkedCount++;
  }
  if (opt.receptorAffinityDeltaG !== undefined) {
    const diff = currentGauges.receptorAffinityDeltaG - opt.receptorAffinityDeltaG;
    totalDeviations += Math.min(2, Math.max(0, diff));
    checkedCount++;
  }
  if (opt.metabolicHalfLifeMinutes !== undefined) {
    const diffRatio = Math.abs(currentGauges.metabolicHalfLifeMinutes - opt.metabolicHalfLifeMinutes) / Math.max(1, opt.metabolicHalfLifeMinutes);
    totalDeviations += Math.min(2, diffRatio);
    checkedCount++;
  }
  if (opt.percentIonized !== undefined) {
    const diffRatio = Math.abs(currentGauges.percentIonized - opt.percentIonized) / 100;
    totalDeviations += Math.min(2, diffRatio * 2);
    checkedCount++;
  }

  const avgDeviation = checkedCount > 0 ? totalDeviations / checkedCount : 0;

  if (avgDeviation < 0.3) {
    return {
      heartRateBpm: 74,
      bloodPressureSys: 120,
      bloodPressureDia: 80,
      gastricPh: 5.5,
      liverEnzymeAlt: 28,
      status: 'normalized',
      heartRate: 74,
      bloodPressure: '120/80',
      gastricBleedingRiskPercent: 5,
      liverToxicityPercent: 4,
      targetOrganPerfusionPercent: 98,
      overallStabilityScore: 96,
    };
  }

  if (avgDeviation < 0.85) {
    const hr = Math.round((initialVitals.heartRateBpm + 74) / 2);
    const sys = Math.round((initialVitals.bloodPressureSys + 120) / 2);
    const dia = Math.round((initialVitals.bloodPressureDia + 80) / 2);
    return {
      heartRateBpm: hr,
      bloodPressureSys: sys,
      bloodPressureDia: dia,
      gastricPh: Number(((initialVitals.gastricPh + 5.5) / 2).toFixed(1)),
      liverEnzymeAlt: Math.round((initialVitals.liverEnzymeAlt + 28) / 2),
      status: 'stabilizing',
      heartRate: hr,
      bloodPressure: `${sys}/${dia}`,
      gastricBleedingRiskPercent: 25,
      liverToxicityPercent: 20,
      targetOrganPerfusionPercent: 80,
      overallStabilityScore: 75,
    };
  }

  if (avgDeviation < 1.4) {
    return {
      ...initialVitals,
      status: 'unstable',
      overallStabilityScore: 40,
    };
  }

  return {
    ...initialVitals,
    status: 'critical',
    overallStabilityScore: 15,
  };
}

/**
 * Validates player's selected toolbox solutions against canonical mission contracts.
 */
export function validateMissionSolution(
  mission: ClinicalRescueMission,
  selectedItemIds: string[],
  mistakesCount: number = 0
): MissionValidationResult {
  const isMatch = mission.solutionItemIds.some(solId => selectedItemIds.includes(solId));

  if (!isMatch) {
    return {
      isSuccess: false,
      score: 25,
      stars: 0,
      feedback: 'Moleküler modifikasyon beklenen farmakokinetik veya reseptör afinitesini sağlayamadı.',
      clinicalExplanation: mission.steps[0]?.simulationFeedback?.failureExplanation || 'Hastanın klinik tablosu kritik olmaya devam ediyor.',
    };
  }

  let stars = 3;
  if (mistakesCount === 1 || mistakesCount === 2) {
    stars = 2;
  } else if (mistakesCount >= 3) {
    stars = 1;
  }

  const score = stars === 3 ? 100 : stars === 2 ? 85 : 70;

  return {
    isSuccess: true,
    score,
    stars,
    feedback: 'Klinik Kurtarma Başarılı! Molekül optimize edildi ve hasta stabilize oldu.',
    clinicalExplanation: mission.victoryTrigger.ahaExplanation,
  };
}

/**
 * Henderson-Hasselbalch ionization calculator.
 * - Weak acid (HA <=> H+ + A-): % ionized = 100 / (1 + 10^(pKa - pH))
 * - Weak base (BH+ <=> B + H+): % ionized = 100 / (1 + 10^(pH - pKa))
 */
export function calculateHendersonHasselbalchIonization(
  pKa: number,
  pH: number,
  type: 'acid' | 'base'
): number {
  if (type === 'acid') {
    const ratio = Math.pow(10, pKa - pH);
    return Number((100 / (1 + ratio)).toFixed(2));
  } else {
    const ratio = Math.pow(10, pH - pKa);
    return Number((100 / (1 + ratio)).toFixed(2));
  }
}
