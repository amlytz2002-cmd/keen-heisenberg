import React, { useState } from 'react';
import { Tag } from 'antd';

export interface MoleculeHotspot {
  id: string;
  label: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  groupType: string; // e.g. 'ester', 'karboksil', 'fenol', 'amin', 'aromatik'
  description: string;
  isTarget?: boolean;
}

export interface MoleculeInspectorProps {
  moleculeName: string;
  chemicalFormula?: string;
  svgType: 'aspirin' | 'losartan' | 'omeprazole' | 'propranolol' | 'penicillin' | 'generic';
  hotspots: MoleculeHotspot[];
  selectedId?: string;
  onSelectHotspot?: (hotspotId: string) => void;
  interactive?: boolean;
  highlightTarget?: boolean;
}

export const MoleculeInspector: React.FC<MoleculeInspectorProps> = ({
  moleculeName,
  chemicalFormula,
  svgType,
  hotspots,
  selectedId,
  onSelectHotspot,
  interactive = true,
  highlightTarget = false,
}) => {
  const [internalSelected, setInternalSelected] = useState<string | null>(selectedId || null);

  const activeId = selectedId !== undefined ? selectedId : internalSelected;
  const activeHotspot = hotspots.find((h) => h.id === activeId);

  const handleClick = (id: string) => {
    if (!interactive) return;
    setInternalSelected(id);
    onSelectHotspot?.(id);
  };

  // Render molecule skeleton SVG based on type
  const renderSkeleton = () => {
    switch (svgType) {
      case 'aspirin':
        return (
          <svg viewBox="0 0 400 240" style={{ width: '100%', height: '100%' }}>
            {/* Aromatic Ring */}
            <polygon points="120,70 170,40 220,70 220,130 170,160 120,130" fill="none" stroke="#334155" strokeWidth="3" />
            <circle cx="170" cy="100" r="32" fill="none" stroke="#94A3B8" strokeWidth="2" strokeDasharray="5,3" />

            {/* Carboxylic Acid Branch */}
            <line x1="220" y1="70" x2="270" y2="40" stroke="#334155" strokeWidth="3" />
            <line x1="267" y1="36" x2="267" y2="0" stroke="#DC2626" strokeWidth="3" />
            <line x1="273" y1="36" x2="273" y2="0" stroke="#DC2626" strokeWidth="3" />
            <text x="260" y="-8" fill="#DC2626" fontWeight="bold" fontSize="16">O</text>
            <line x1="270" y1="40" x2="320" y2="60" stroke="#334155" strokeWidth="3" />
            <text x="325" y="68" fill="#DC2626" fontWeight="bold" fontSize="16">OH</text>

            {/* Ester Branch (Acetylation) */}
            <line x1="220" y1="130" x2="270" y2="160" stroke="#334155" strokeWidth="3" />
            <text x="275" y="166" fill="#DC2626" fontWeight="bold" fontSize="16">O</text>
            <line x1="290" y1="168" x2="330" y2="190" stroke="#334155" strokeWidth="3" />
            <line x1="327" y1="190" x2="327" y2="230" stroke="#DC2626" strokeWidth="3" />
            <line x1="333" y1="190" x2="333" y2="230" stroke="#DC2626" strokeWidth="3" />
            <text x="323" y="245" fill="#DC2626" fontWeight="bold" fontSize="16">O</text>
            <line x1="330" y1="190" x2="370" y2="170" stroke="#334155" strokeWidth="3" />
            <text x="375" y="176" fill="#334155" fontWeight="bold" fontSize="16">CH₃</text>
          </svg>
        );

      case 'losartan':
        return (
          <svg viewBox="0 0 400 240" style={{ width: '100%', height: '100%' }}>
            {/* Imidazole core */}
            <polygon points="100,90 140,60 170,90 150,140 110,140" fill="none" stroke="#2563EB" strokeWidth="3" />
            <text x="135" y="55" fill="#2563EB" fontWeight="bold" fontSize="14">N</text>
            <text x="145" y="135" fill="#2563EB" fontWeight="bold" fontSize="14">N</text>
            <line x1="170" y1="90" x2="200" y2="90" stroke="#334155" strokeWidth="3" />
            <text x="205" y="95" fill="#059669" fontWeight="bold" fontSize="15">Cl</text>

            {/* Biphenyl bridge */}
            <line x1="100" y1="90" x2="60" y2="90" stroke="#334155" strokeWidth="3" />
            <circle cx="210" cy="170" r="28" fill="none" stroke="#334155" strokeWidth="2.5" />
            <circle cx="310" cy="170" r="28" fill="none" stroke="#334155" strokeWidth="2.5" />
            <line x1="238" y1="170" x2="282" y2="170" stroke="#334155" strokeWidth="3" />

            {/* Tetrazole Ring */}
            <polygon points="345,130 380,110 395,140 375,170 345,160" fill="none" stroke="#DC2626" strokeWidth="3" />
            <text x="350" y="105" fill="#DC2626" fontWeight="bold" fontSize="13">NH—N</text>
            <text x="375" y="185" fill="#DC2626" fontWeight="bold" fontSize="13">N══N</text>
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 400 240" style={{ width: '100%', height: '100%' }}>
            {/* Generic Core */}
            <polygon points="150,60 210,60 240,110 210,160 150,160 120,110" fill="none" stroke="#334155" strokeWidth="3" />
            <circle cx="180" cy="110" r="30" fill="none" stroke="#94A3B8" strokeWidth="2" strokeDasharray="5,3" />
            <line x1="240" y1="110" x2="300" y2="110" stroke="#334155" strokeWidth="3" />
            <text x="305" y="115" fill="#2563EB" fontWeight="bold" fontSize="16">R₁</text>
            <line x1="120" y1="110" x2="70" y2="110" stroke="#334155" strokeWidth="3" />
            <text x="40" y="115" fill="#DC2626" fontWeight="bold" fontSize="16">R₂</text>
          </svg>
        );
    }
  };

  return (
    <div
      style={{
        borderRadius: 16,
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        padding: 20,
        position: 'relative',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{moleculeName}</span>
          {chemicalFormula && (
            <span style={{ fontSize: 13, color: '#64748B', marginLeft: 8 }}>({chemicalFormula})</span>
          )}
        </div>
        <Tag color="blue">2D Kimyasal Harita</Tag>
      </div>

      {/* Interactive Molecule Canvas */}
      <div
        style={{
          width: '100%',
          height: 240,
          background: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {renderSkeleton()}

        {/* Hotspot Markers */}
        {hotspots.map((hs) => {
          const isSelected = hs.id === activeId;
          const isTarget = hs.isTarget && highlightTarget;
          return (
            <button
              key={hs.id}
              onClick={() => handleClick(hs.id)}
              disabled={!interactive}
              style={{
                position: 'absolute',
                left: `${hs.x}%`,
                top: `${hs.y}%`,
                transform: 'translate(-50%, -50%)',
                width: isSelected ? 34 : 26,
                height: isSelected ? 34 : 26,
                borderRadius: '50%',
                background: isSelected
                  ? '#2563EB'
                  : isTarget
                  ? '#10B981'
                  : 'rgba(59, 130, 246, 0.2)',
                border: isSelected
                  ? '3px solid #DBEAFE'
                  : isTarget
                  ? '3px solid #A7F3D0'
                  : '2px solid #3B82F6',
                cursor: interactive ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSelected || isTarget ? '#FFFFFF' : '#1D4ED8',
                fontWeight: 700,
                fontSize: 12,
                transition: 'all 0.2s ease',
                zIndex: isSelected ? 10 : 5,
                boxShadow: isSelected
                  ? '0 0 0 6px rgba(37, 99, 235, 0.25)'
                  : '0 2px 4px rgba(0,0,0,0.1)',
              }}
              title={hs.label}
            >
              {hs.id}
            </button>
          );
        })}
      </div>

      {/* Selected Hotspot Explanation Panel */}
      {activeHotspot ? (
        <div
          style={{
            marginTop: 14,
            padding: '12px 16px',
            borderRadius: 10,
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, color: '#1E40AF', fontSize: 14 }}>
              [{activeHotspot.id}] {activeHotspot.label}
            </span>
            <Tag color="geekblue">{activeHotspot.groupType}</Tag>
          </div>
          <div style={{ fontSize: 13, color: '#1E293B', lineHeight: 1.5 }}>
            {activeHotspot.description}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 12, textAlign: 'center', fontSize: 13, color: '#94A3B8' }}>
          💡 Molekül üzerindeki numaralı dairelere tıklayarak fonksiyonel grupları inceleyin.
        </div>
      )}
    </div>
  );
};
