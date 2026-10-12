import React, { useState, useMemo } from 'react';
import { Slider, Tag, Progress, Alert } from 'antd';
import { ExperimentOutlined, ThunderboltOutlined, SafetyCertificateOutlined } from '@ant-design/icons';

export interface PhIonizationGaugeProps {
  drugName: string;
  drugType: 'weak_acid' | 'weak_base';
  pKa: number;
  defaultPh?: number;
  targetQuestion?: string;
  onPhChange?: (currentPh: number, ionizedPercent: number) => void;
  clinicalNote?: string;
}

export const PhIonizationGauge: React.FC<PhIonizationGaugeProps> = ({
  drugName,
  drugType,
  pKa,
  defaultPh = 7.4,
  targetQuestion,
  onPhChange,
  clinicalNote,
}) => {
  const [ph, setPh] = useState<number>(defaultPh);

  // Henderson-Hasselbalch calculation
  const { ionizedPercent, neutralPercent } = useMemo(() => {
    const delta = ph - pKa;
    const ratio = Math.pow(10, delta); // [Baz] / [Asit]

    let ionized = 0;
    if (drugType === 'weak_acid') {
      // HA <=> H+ + A- (A- is ionized)
      // [A-] / [HA] = ratio => ionized fraction = ratio / (1 + ratio)
      ionized = (ratio / (1 + ratio)) * 100;
    } else {
      // BH+ <=> B + H+ (BH+ is ionized)
      // [B] / [BH+] = ratio => neutral fraction = ratio / (1 + ratio)
      const neutral = (ratio / (1 + ratio)) * 100;
      ionized = 100 - neutral;
    }

    const clampedIonized = Math.max(0.1, Math.min(99.9, parseFloat(ionized.toFixed(1))));
    const clampedNeutral = parseFloat((100 - clampedIonized).toFixed(1));

    return {
      ionizedPercent: clampedIonized,
      neutralPercent: clampedNeutral,
    };
  }, [ph, pKa, drugType]);

  const handleSliderChange = (value: number) => {
    setPh(value);
    onPhChange?.(value, ionizedPercent);
  };

  // Landmark tags
  const landmarks = [
    { label: 'Mide', ph: 1.5, color: 'volcano' },
    { label: 'Duodenum', ph: 6.0, color: 'orange' },
    { label: 'Kan / Plazma', ph: 7.4, color: 'blue' },
    { label: 'İdrar', ph: 6.2, color: 'cyan' },
  ];

  return (
    <div
      style={{
        borderRadius: 16,
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        padding: 20,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
            <ExperimentOutlined style={{ color: '#0284C7', marginRight: 8 }} />
            {drugName}
          </span>
          <span style={{ marginLeft: 8, fontSize: 13, color: '#64748B' }}>
            ({drugType === 'weak_acid' ? 'Zayıf Asit İlaç' : 'Zayıf Baz İlaç'}, pKa: <strong>{pKa}</strong>)
          </span>
        </div>
        <Tag color={drugType === 'weak_acid' ? 'gold' : 'purple'} style={{ borderRadius: 12, fontWeight: 600 }}>
          {drugType === 'weak_acid' ? 'R-COOH / Asidik' : 'R-NH₂ / Bazik'}
        </Tag>
      </div>

      {targetQuestion && (
        <Alert
          message={targetQuestion}
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: 10, fontSize: 13, background: '#F0F9FF', borderColor: '#BAE6FD' }}
        />
      )}

      {/* pH Slider with Landmarks */}
      <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Ortam pH Değeri:</span>
          <span
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: ph < 5 ? '#DC2626' : ph > 8 ? '#7C3AED' : '#0284C7',
              background: '#F1F5F9',
              padding: '2px 10px',
              borderRadius: 8,
            }}
          >
            pH {ph.toFixed(1)}
          </span>
        </div>

        <Slider
          min={1.0}
          max={12.0}
          step={0.1}
          value={ph}
          onChange={handleSliderChange}
          tooltip={{ formatter: (val) => `pH ${val}` }}
          marks={{
            1.5: { style: { color: '#DC2626', fontSize: 11 }, label: 'Mide (1.5)' },
            6.0: { style: { color: '#D97706', fontSize: 11 }, label: 'İnce B. (6.0)' },
            7.4: { style: { color: '#0284C7', fontSize: 11, fontWeight: 'bold' }, label: 'Plazma (7.4)' },
            10.0: { style: { color: '#7C3AED', fontSize: 11 }, label: 'Bazik (10)' },
          }}
        />

        {/* Quick jump buttons */}
        <div style={{ marginTop: 24, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#94A3B8', alignSelf: 'center', marginRight: 4 }}>Hızlı pH:</span>
          {landmarks.map((l) => (
            <button
              key={l.label}
              onClick={() => handleSliderChange(l.ph)}
              type="button"
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 6,
                border: ph === l.ph ? '1px solid #0284C7' : '1px solid #CBD5E1',
                background: ph === l.ph ? '#E0F2FE' : '#FFFFFF',
                color: ph === l.ph ? '#0369A1' : '#475569',
                cursor: 'pointer',
                fontWeight: ph === l.ph ? 700 : 500,
                transition: 'all 0.15s ease',
              }}
            >
              {l.label} ({l.ph})
            </button>
          ))}
        </div>
      </div>

      {/* Henderson-Hasselbalch Dynamic Ionization Split */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {/* Lipophilic / Non-ionized fraction */}
        <div
          style={{
            background: '#FFFFFF',
            padding: 14,
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
            <SafetyCertificateOutlined style={{ color: '#16A34A', fontSize: 16 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A' }}>NÖTR (LİPOFİLİK) FORMU</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#15803D' }}>%{neutralPercent}</div>
          <Progress percent={neutralPercent} strokeColor="#22C55E" showInfo={false} size="small" />
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>
            Biyolojik membranlardan <strong>pasif difüzyonla emilebilir</strong>.
          </div>
        </div>

        {/* Ionized fraction */}
        <div
          style={{
            background: '#FFFFFF',
            padding: 14,
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
            <ThunderboltOutlined style={{ color: '#0284C7', fontSize: 16 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0284C7' }}>İYONİZE (POLAR) FORMU</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0369A1' }}>%{ionizedPercent}</div>
          <Progress percent={ionizedPercent} strokeColor="#0284C7" showInfo={false} size="small" />
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>
            Suda çözünür, <strong>reseptörle elektrostatik bağlanır veya idrarla atılır</strong>.
          </div>
        </div>
      </div>

      {/* Clinical / Pedagogical Takeaway */}
      <div
        style={{
          background: '#EFF6FF',
          borderLeft: '4px solid #0284C7',
          padding: '10px 14px',
          borderRadius: '0 8px 8px 0',
          fontSize: 12,
          color: '#1E293B',
          lineHeight: 1.5,
        }}
      >
        <strong>Mekanistik Kural: </strong>
        {drugType === 'weak_acid' ? (
          <span>
            Zayıf asit ilaçlar (Aspirin, İbuprofen), asidik ortamda (pH &lt; pKa) proton alarak nötrleşir (%{neutralPercent} emilebilir).
            Bazik ortamda (pH &gt; pKa) proton kaybedip iyonize forma geçer (%{ionizedPercent} atılabilir).
          </span>
        ) : (
          <span>
            Zayıf baz ilaçlar (Propranolol, Diazepam), asidik ortamda proton alarak iyonize olur (%{ionizedPercent} çözünür).
            Bazik ortama geçtikçe nötrleşip lipofilikleşir (%{neutralPercent} emilebilir).
          </span>
        )}
        {clinicalNote && <div style={{ marginTop: 4, fontStyle: 'italic', color: '#0369A1' }}>💡 {clinicalNote}</div>}
      </div>
    </div>
  );
};
