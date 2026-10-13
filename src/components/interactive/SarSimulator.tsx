import React from 'react';
import { Radio, Progress, Tag, Alert } from 'antd';

export interface SarSubstituent {
  id: string;
  label: string; // e.g. "-H", "-Cl", "-CF3", "-OH", "-SO2NH2"
  name: string; // e.g. "Hidrojen", "Klor", "Triflorometil", "Hidroksil"
  logPDelta: number; // e.g. +0.71, +1.16, -0.67
  affinityPercent: number; // 0-100
  bbbPermeable: boolean;
  waterSolubilityRank: 'Düşük' | 'Orta' | 'Yüksek';
  pedagogicalNote: string;
}

export interface SarSimulatorProps {
  coreName: string;
  baseLogP: number;
  substituents: SarSubstituent[];
  selectedId?: string;
  onSelectSubstituent: (id: string) => void;
  targetResidueHint?: string;
}

export const SarSimulator: React.FC<SarSimulatorProps> = ({
  coreName,
  baseLogP,
  substituents,
  selectedId,
  onSelectSubstituent,
  targetResidueHint,
}) => {
  const current = substituents.find((s) => s.id === selectedId) || substituents[0];
  const calculatedLogP = parseFloat((baseLogP + current.logPDelta).toFixed(2));

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
            SAR Simülatörü: {coreName}
          </span>
          <span style={{ fontSize: 13, color: '#64748B', marginLeft: 8 }}>
            (Baz LogP: {baseLogP})
          </span>
        </div>
        <Tag color="purple">Yapı-Etki Laboratuvarı</Tag>
      </div>

      {/* Substituent Selection Buttons */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
          Molekülün R Pozisyonuna Bağlanacak Grubu Seçin:
        </div>
        <Radio.Group
          value={selectedId}
          onChange={(e) => onSelectSubstituent(e.target.value)}
          buttonStyle="solid"
          size="middle"
        >
          {substituents.map((sub) => (
            <Radio.Button key={sub.id} value={sub.id} style={{ fontWeight: 600 }}>
              {sub.label} ({sub.name})
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>

      {/* Live Parameter Gauges */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #E2E8F0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* Lipophilicity LogP Gauge */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ fontWeight: 600, color: '#475569' }}>Lipofilisite (Hesaplanan LogP)</span>
            <span style={{ fontWeight: 700, color: calculatedLogP > 3 ? '#DC2626' : '#2563EB' }}>
              {calculatedLogP} ({current.logPDelta >= 0 ? `+${current.logPDelta}` : current.logPDelta})
            </span>
          </div>
          <Progress
            percent={Math.min(Math.max((calculatedLogP / 5) * 100, 5), 100)}
            strokeColor={calculatedLogP > 3.5 ? '#EA580C' : '#3B82F6'}
            showInfo={false}
          />
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
            Lipinski Ro5 Sınırı: &lt; 5.0
          </div>
        </div>

        {/* Receptor Affinity Gauge */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ fontWeight: 600, color: '#475569' }}>Reseptör Bağlanma Gücü</span>
            <span style={{ fontWeight: 700, color: '#059669' }}>%{current.affinityPercent}</span>
          </div>
          <Progress
            percent={current.affinityPercent}
            strokeColor="#10B981"
            showInfo={false}
          />
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
            Hedef Reseptör Uyum İndeksi
          </div>
        </div>

        {/* BBB & Solubility Properties */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: '#475569', fontWeight: 600 }}>Kan-Beyin Bariyeri:</span>
            <Tag color={current.bbbPermeable ? 'green' : 'orange'}>
              {current.bbbPermeable ? 'Geçer (SSS Aktif)' : 'Geçemez (Periferik)'}
            </Tag>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: '#475569', fontWeight: 600 }}>Suda Çözünürlük:</span>
            <Tag color={current.waterSolubilityRank === 'Yüksek' ? 'blue' : current.waterSolubilityRank === 'Orta' ? 'cyan' : 'volcano'}>
              {current.waterSolubilityRank}
            </Tag>
          </div>
        </div>
      </div>

      {/* Pedagogical Explanation for Selected Group */}
      <Alert
        message={`Gözlem: ${current.label} (${current.name}) Değişimi`}
        description={current.pedagogicalNote}
        type="info"
        showIcon
      />

      {targetResidueHint && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#64748B', fontStyle: 'italic' }}>
          💡 Reseptör ipucu: {targetResidueHint}
        </div>
      )}
    </div>
  );
};
