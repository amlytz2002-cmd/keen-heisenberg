import React from 'react';
import type { LessonStep } from '../../types/microlearning';
import type {
  PuzzleStep,
  ClinicalRescueMission,
  LiveGauges,
  PatientVitals,
} from '../../types/medicinalChemistry';
import { MEDICINAL_CHEMISTRY_MISSIONS } from '../../data/courses/medicinalChemistryMissions';
import { MoleculeInspector } from './MoleculeInspector';
import { SarSimulator } from './SarSimulator';
import { BondPocketMatcher } from './BondPocketMatcher';
import { PhIonizationGauge } from './PhIonizationGauge';
import { MolecularToolbox } from './MolecularToolbox';
import { EnzymeCleavageSimulator } from './EnzymeCleavageSimulator';
import { ReceptorPocketFit } from './ReceptorPocketFit';
import { PatientVitalsMonitor } from './PatientVitalsMonitor';

export interface WidgetRendererProps {
  step: (LessonStep | PuzzleStep) & { [key: string]: any };
  currentAnswer: any;
  onAnswerChange: (answer: any) => void;
  disabled?: boolean;
  mission?: ClinicalRescueMission;
  gauges?: LiveGauges;
  vitals?: PatientVitals;
  onSimulationComplete?: (success: boolean) => void;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  step,
  currentAnswer,
  onAnswerChange,
  disabled = false,
  mission,
  gauges,
  vitals,
  onSimulationComplete,
}) => {
  // Attempt to resolve mission context if not provided
  const matchedMission =
    mission ||
    MEDICINAL_CHEMISTRY_MISSIONS.find((m) =>
      m.steps.some((s) => s.id === step.id)
    ) ||
    MEDICINAL_CHEMISTRY_MISSIONS.find(
      (m) =>
        step.id &&
        typeof step.id === 'string' &&
        m.id === step.id.split('-')[1]?.replace('m', 'mission-')
    );

  const widgetProps = step.widgetProps || {};

  switch (step.widgetType) {
    // ------------------------------------------------------------------------
    // R2 NEW CLINICAL SANDBOX WIDGETS
    // ------------------------------------------------------------------------
    case 'molecular_toolbox': {
      const items =
        widgetProps.items ||
        widgetProps.molecularToolbox ||
        matchedMission?.molecularToolbox;

      const availableIds =
        step.availableToolIds || widgetProps.availableToolIds;

      return (
        <MolecularToolbox
          items={items}
          availableToolIds={availableIds}
          selectedItemId={
            typeof currentAnswer === 'string' ? currentAnswer : currentAnswer?.id
          }
          onSelectItemId={(id) => !disabled && onAnswerChange(id)}
          onSelectItem={(item) => !disabled && onAnswerChange(item.id)}
          onApply={(appliedItems) =>
            !disabled && onAnswerChange(appliedItems[0]?.id)
          }
          scaffoldName={
            widgetProps.scaffoldName ||
            matchedMission?.failingMoleculeName ||
            step.title
          }
          failingMoleculeName={
            matchedMission?.failingMoleculeName ||
            widgetProps.failingMoleculeName
          }
          initialGauges={matchedMission?.initialGauges || gauges}
          currentGauges={gauges}
          optimalGauges={matchedMission?.optimalGauges}
          disabled={disabled}
          title={step.title}
          instructionHtml={step.instructionHtml}
        />
      );
    }

    case 'enzyme_cleavage_simulator': {
      const isShielded =
        widgetProps.isShielded !== undefined
          ? widgetProps.isShielded
          : currentAnswer === step.optimalToolId ||
            (typeof currentAnswer === 'string' &&
              (currentAnswer.includes('amide') ||
                currentAnswer.includes('shield') ||
                currentAnswer === 'tool-m2-amide' ||
                currentAnswer === 'tool-m11-fluorine' ||
                currentAnswer === 'tool-m13-dimethyl'));

      const availableTools =
        step.availableToolIds && matchedMission?.molecularToolbox
          ? matchedMission.molecularToolbox.filter((t) =>
              step.availableToolIds?.includes(t.id)
            )
          : matchedMission?.molecularToolbox;

      return (
        <EnzymeCleavageSimulator
          moleculeName={
            matchedMission?.failingMoleculeName || widgetProps.moleculeName
          }
          enzymeName={
            widgetProps.enzymeName ||
            matchedMission?.targetTargetName ||
            'Plazma Psödokolinesterazı'
          }
          targetBond={widgetProps.targetBond || 'Ester Bağı (C-O-C=O)'}
          isShielded={isShielded}
          shieldType={widgetProps.shieldType || 'bioisostere_amide'}
          initialHalfLifeMinutes={
            matchedMission?.initialGauges?.metabolicHalfLifeMinutes ||
            widgetProps.initialHalfLifeMinutes ||
            2.0
          }
          stabilizedHalfLifeMinutes={
            matchedMission?.optimalGauges?.metabolicHalfLifeMinutes ||
            widgetProps.stabilizedHalfLifeMinutes ||
            210.0
          }
          selectedToolId={
            typeof currentAnswer === 'string' ? currentAnswer : undefined
          }
          optimalToolId={step.optimalToolId}
          availableTools={availableTools}
          onSimulationComplete={(success) => {
            if (!disabled) {
              onSimulationComplete?.(success);
              onAnswerChange(
                success ? step.optimalToolId || 'shielded' : 'unshielded'
              );
            }
          }}
          onSelectTool={(toolId) => !disabled && onAnswerChange(toolId)}
          disabled={disabled}
          title={step.title}
          instructionHtml={step.instructionHtml}
          simulationFeedback={step.simulationFeedback}
        />
      );
    }

    case 'receptor_pocket_fit': {
      return (
        <ReceptorPocketFit
          pocketName={
            widgetProps.pocketName ||
            matchedMission?.targetTargetName ||
            'Reseptör Bağlanma Cebi'
          }
          targetTargetName={
            matchedMission?.targetTargetName || widgetProps.targetTargetName
          }
          pocketResidues={widgetProps.pocketResidues}
          ligandGroups={widgetProps.ligandGroups}
          selectedToolId={
            typeof currentAnswer === 'string' ? currentAnswer : undefined
          }
          onBindingScoreChange={(score) => {
            if (!disabled && score.isOptimal) {
              onAnswerChange(step.optimalToolId || true);
            }
          }}
          onDockComplete={(success) => {
            if (!disabled) {
              onAnswerChange(success ? step.optimalToolId || true : false);
            }
          }}
          disabled={disabled}
          title={step.title}
          instructionHtml={step.instructionHtml}
        />
      );
    }

    case 'patient_vitals_monitor': {
      return (
        <PatientVitalsMonitor
          vitals={
            vitals ||
            widgetProps.vitals ||
            matchedMission?.clinicalCrisis?.patientInitialVitals
          }
          initialVitals={matchedMission?.clinicalCrisis?.patientInitialVitals}
          targetVitals={widgetProps.targetVitals}
          patientCode={
            matchedMission?.clinicalCrisis?.patientCode || widgetProps.patientCode
          }
          patientAgeGender={
            matchedMission?.clinicalCrisis?.patientAgeGender ||
            widgetProps.patientAgeGender
          }
          clinicalPresentation={
            matchedMission?.clinicalCrisis?.presentation ||
            widgetProps.clinicalPresentation
          }
          failingMoleculeName={
            matchedMission?.failingMoleculeName ||
            widgetProps.failingMoleculeName
          }
          gauges={gauges}
          compact={widgetProps.compact}
          title={step.title}
          instructionHtml={step.instructionHtml}
          preceptorNote={widgetProps.preceptorNote || step.instructionHtml}
        />
      );
    }

    // ------------------------------------------------------------------------
    // LEGACY INTERACTIVE WIDGETS (PRESERVED FOR BACKWARD COMPATIBILITY)
    // ------------------------------------------------------------------------
    case 'molecule_inspector':
      return (
        <MoleculeInspector
          moleculeName={widgetProps.moleculeName || 'Molekül'}
          chemicalFormula={widgetProps.chemicalFormula}
          svgType={widgetProps.svgType || 'aspirin'}
          hotspots={widgetProps.hotspots || []}
          selectedId={currentAnswer}
          onSelectHotspot={(id) => !disabled && onAnswerChange(id)}
          interactive={!disabled}
          highlightTarget={widgetProps.highlightTarget}
        />
      );

    case 'sar_slider':
      return (
        <SarSimulator
          coreName={widgetProps.coreName || 'Farmakofor Çekirdek'}
          baseLogP={widgetProps.baseLogP ?? 1.5}
          substituents={widgetProps.substituents || []}
          selectedId={
            typeof currentAnswer === 'string' ? currentAnswer : undefined
          }
          onSelectSubstituent={(id) => !disabled && onAnswerChange(id)}
          targetResidueHint={widgetProps.targetResidueHint}
        />
      );

    case 'bond_matcher':
      return (
        <BondPocketMatcher
          pocketName={widgetProps.pocketName || 'Reseptör Bağlanma Cebi'}
          drugGroups={widgetProps.drugGroups || []}
          pocketResidues={widgetProps.pocketResidues || []}
          onComplete={(success) => !disabled && onAnswerChange(success)}
        />
      );

    case 'ph_gauge':
      return (
        <PhIonizationGauge
          drugName={widgetProps.drugName || 'Test İlacı'}
          drugType={widgetProps.drugType || 'weak_acid'}
          pKa={widgetProps.pKa || 3.5}
          defaultPh={widgetProps.defaultPh || 7.4}
          targetQuestion={widgetProps.targetQuestion}
          clinicalNote={widgetProps.clinicalNote}
          onPhChange={(ph, ionized) =>
            !disabled && onAnswerChange({ ph, ionized })
          }
        />
      );

    case 'multiple_choice':
    default:
      if (!step.options || step.options.length === 0) {
        return null;
      }

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {step.options.map((opt: any, idx: number) => {
            const isSelected = currentAnswer === opt.id;
            const letter = String.fromCharCode(65 + idx); // A, B, C, D

            return (
              <div
                key={opt.id}
                onClick={() => !disabled && onAnswerChange(opt.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 18px',
                  borderRadius: 14,
                  border: isSelected
                    ? '2px solid #0284C7'
                    : '1.5px solid #E2E8F0',
                  background: isSelected ? '#F0F9FF' : '#FFFFFF',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected
                    ? '0 2px 8px rgba(2, 132, 199, 0.12)'
                    : 'none',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    background: isSelected ? '#0284C7' : '#F1F5F9',
                    color: isSelected ? '#FFFFFF' : '#475569',
                    flexShrink: 0,
                  }}
                >
                  {letter}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    color: '#1E293B',
                    fontWeight: isSelected ? 600 : 400,
                    flex: 1,
                  }}
                >
                  {opt.label}
                </div>
              </div>
            );
          })}
        </div>
      );
  }
};
