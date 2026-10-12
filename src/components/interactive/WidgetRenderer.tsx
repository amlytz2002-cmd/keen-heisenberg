import React from 'react';
import { LessonStep } from '../../types/microlearning';
import { MoleculeInspector } from './MoleculeInspector';
import { SarSimulator } from './SarSimulator';
import { BondPocketMatcher } from './BondPocketMatcher';
import { PhIonizationGauge } from './PhIonizationGauge';

export interface WidgetRendererProps {
  step: LessonStep;
  currentAnswer: any;
  onAnswerChange: (answer: any) => void;
  disabled?: boolean;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  step,
  currentAnswer,
  onAnswerChange,
  disabled = false,
}) => {
  switch (step.widgetType) {
    case 'molecule_inspector':
      return (
        <MoleculeInspector
          moleculeName={step.widgetProps.moleculeName || 'Molekül'}
          chemicalFormula={step.widgetProps.chemicalFormula}
          svgType={step.widgetProps.svgType || 'aspirin'}
          hotspots={step.widgetProps.hotspots || []}
          selectedId={currentAnswer}
          onSelectHotspot={(id) => !disabled && onAnswerChange(id)}
          interactive={!disabled}
          highlightTarget={step.widgetProps.highlightTarget}
        />
      );

    case 'sar_slider':
      return (
        <SarSimulator
          coreName={step.widgetProps.coreName || 'Farmakofor Çekirdek'}
          baseLogP={step.widgetProps.baseLogP ?? 1.5}
          substituents={step.widgetProps.substituents || []}
          selectedId={currentAnswer || step.widgetProps.defaultId || step.widgetProps.substituents?.[0]?.id}
          onSelectSubstituent={(id) => !disabled && onAnswerChange(id)}
          targetResidueHint={step.widgetProps.targetResidueHint}
        />
      );

    case 'bond_matcher':
      return (
        <BondPocketMatcher
          pocketName={step.widgetProps.pocketName || 'Reseptör Bağlanma Cebi'}
          drugGroups={step.widgetProps.drugGroups || []}
          pocketResidues={step.widgetProps.pocketResidues || []}
          onComplete={(success) => !disabled && onAnswerChange(success)}
        />
      );

    case 'ph_gauge':
      return (
        <PhIonizationGauge
          drugName={step.widgetProps.drugName || 'Test İlacı'}
          drugType={step.widgetProps.drugType || 'weak_acid'}
          pKa={step.widgetProps.pKa || 3.5}
          defaultPh={step.widgetProps.defaultPh || 7.4}
          targetQuestion={step.widgetProps.targetQuestion}
          clinicalNote={step.widgetProps.clinicalNote}
          onPhChange={(ph, ionized) => !disabled && onAnswerChange({ ph, ionized })}
        />
      );

    case 'multiple_choice':
    default:
      if (!step.options || step.options.length === 0) {
        return null;
      }

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {step.options.map((opt, idx) => {
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
                  border: isSelected ? '2px solid #0284C7' : '1.5px solid #E2E8F0',
                  background: isSelected ? '#F0F9FF' : '#FFFFFF',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 8px rgba(2, 132, 199, 0.12)' : 'none',
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
                <div style={{ fontSize: 15, color: '#1E293B', fontWeight: isSelected ? 600 : 400, flex: 1 }}>
                  {opt.label}
                </div>
              </div>
            );
          })}
        </div>
      );
  }
};
