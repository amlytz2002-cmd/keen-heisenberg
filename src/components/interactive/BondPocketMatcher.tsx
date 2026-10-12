import React, { useState } from 'react';
import { Tag, Button, Progress } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';

export interface DrugGroupItem {
  id: string;
  name: string;
  formula: string;
  targetResidueId: string; // The correct residue to pair with
}

export interface ReceptorResidueItem {
  id: string;
  name: string; // e.g. "Asp113 (Karboksilat -COO⁻)", "Ser204 (-OH)"
  bondType: string; // e.g. "İyonik Bağ", "Hidrojen Bağı"
  energyKcal: number; // e.g. -8.5, -4.2
}

export interface BondPocketMatcherProps {
  pocketName: string;
  drugGroups: DrugGroupItem[];
  pocketResidues: ReceptorResidueItem[];
  onComplete?: (success: boolean) => void;
}

export const BondPocketMatcher: React.FC<BondPocketMatcherProps> = ({
  pocketName,
  drugGroups,
  pocketResidues,
  onComplete,
}) => {
  const [selectedDrugGroup, setSelectedDrugGroup] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({}); // drugGroupId -> residueId

  const handleSelectDrug = (id: string) => {
    setSelectedDrugGroup(id);
  };

  const handleSelectResidue = (residueId: string) => {
    if (!selectedDrugGroup) return;

    const nextMatches = { ...matches, [selectedDrugGroup]: residueId };
    setMatches(nextMatches);
    setSelectedDrugGroup(null);

    // Check completion
    const allPaired = drugGroups.every((dg) => nextMatches[dg.id]);
    if (allPaired) {
      const allCorrect = drugGroups.every((dg) => nextMatches[dg.id] === dg.targetResidueId);
      onComplete?.(allCorrect);
    }
  };

  const handleReset = () => {
    setMatches({});
    setSelectedDrugGroup(null);
  };

  // Calculate accumulated binding energy
  const totalEnergy = Object.entries(matches).reduce((acc, [, resId]) => {
    const residue = pocketResidues.find((r) => r.id === resId);
    return acc + (residue ? residue.energyKcal : 0);
  }, 0);

  const matchedCount = Object.keys(matches).length;
  const isAllMatched = matchedCount === drugGroups.length;
  const isAllCorrect = isAllMatched && drugGroups.every((dg) => matches[dg.id] === dg.targetResidueId);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
            Reseptör Cebi Bağ Eşleştirici: {pocketName}
          </span>
        </div>
        <Tag color="cyan">Moleküler Yerleşim</Tag>
      </div>

      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
        Soldaki ilaç fonksiyonel grubunu seçin, ardından sağdaki bağ kuracağı reseptör amino asit kalıntısına tıklayın.
      </div>

      {/* Matching Columns Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
          background: '#FFFFFF',
          padding: 16,
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          marginBottom: 16,
        }}
      >
        {/* Left Column: Drug Groups */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase', marginBottom: 10 }}>
            İlaç Fonksiyonel Grupları
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {drugGroups.map((dg) => {
              const isSelected = selectedDrugGroup === dg.id;
              const isPaired = !!matches[dg.id];
              return (
                <button
                  key={dg.id}
                  onClick={() => handleSelectDrug(dg.id)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: isSelected ? '#EFF6FF' : isPaired ? '#F0FDF4' : '#F8FAFC',
                    border: isSelected
                      ? '2px solid #2563EB'
                      : isPaired
                      ? '1px solid #86EFAC'
                      : '1px solid #CBD5E1',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>{dg.name}</div>
                    <div style={{ fontSize: 12, color: '#2563EB', fontFamily: 'monospace' }}>{dg.formula}</div>
                  </div>
                  {isPaired && <CheckCircleFilled style={{ color: '#16A34A', fontSize: 16 }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Receptor Residues */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#9333EA', textTransform: 'uppercase', marginBottom: 10 }}>
            Reseptör Bağlanma Bölgesi
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pocketResidues.map((res) => {
              const isUsed = Object.values(matches).includes(res.id);
              return (
                <button
                  key={res.id}
                  onClick={() => handleSelectResidue(res.id)}
                  disabled={!selectedDrugGroup || isUsed}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: isUsed ? '#F1F5F9' : selectedDrugGroup ? '#FAF5FF' : '#F8FAFC',
                    border: selectedDrugGroup && !isUsed
                      ? '2px dashed #9333EA'
                      : '1px solid #CBD5E1',
                    textAlign: 'left',
                    cursor: selectedDrugGroup && !isUsed ? 'pointer' : 'default',
                    opacity: isUsed ? 0.6 : 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>{res.name}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>
                      {res.bondType} ({res.energyKcal} kcal/mol)
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Energy Gauge & Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1, marginRight: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ fontWeight: 600, color: '#334155' }}>
              Toplam Bağlanma Serbest Enerjisi (ΔG):
            </span>
            <span style={{ fontWeight: 700, color: totalEnergy < -10 ? '#16A34A' : '#2563EB' }}>
              {totalEnergy.toFixed(1)} kcal/mol
            </span>
          </div>
          <Progress
            percent={Math.min(Math.abs(totalEnergy) * 5, 100)}
            strokeColor="#10B981"
            showInfo={false}
          />
        </div>

        {matchedCount > 0 && (
          <Button size="small" onClick={handleReset}>
            Sıfırla
          </Button>
        )}
      </div>

      {/* Completion feedback */}
      {isAllMatched && (
        <div
          style={{
            marginTop: 14,
            padding: '10px 14px',
            borderRadius: 8,
            background: isAllCorrect ? '#F0FDF4' : '#FEF2F2',
            border: `1px solid ${isAllCorrect ? '#BBF7D0' : '#FECACA'}`,
            color: isAllCorrect ? '#166534' : '#991B1B',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {isAllCorrect
            ? '✨ Harika! Tüm fonksiyonel gruplar doğru reseptör amino asitleri ile en yüksek afiniteyle eşleşti.'
            : '⚠️ Bazı eşleşmeler suboptimal bağ türlerine bağlandı. Sıfırlayıp en güçlü bağ türlerini (örn. İyonik > H-bağı) tekrar değerlendirin.'}
        </div>
      )}
    </div>
  );
};
