import React, { useState, useMemo } from 'react';
import { Tag, Button, Tooltip } from 'antd';
import {
  ThunderboltOutlined,
  CheckCircleFilled,
  SyncOutlined,
  InfoCircleOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import type {
  MolecularToolboxItem,
  LiveGauges,
} from '../../types/medicinalChemistry';
import { calculateModifiedGauges } from '../../types/medicinalChemistry';

export interface MolecularToolboxProps {
  items?: MolecularToolboxItem[];
  availableToolIds?: string[];
  selectedItemId?: string | null;
  onSelectItem?: (item: MolecularToolboxItem) => void;
  onSelectItemId?: (id: string) => void;
  onApply?: (selectedItems: MolecularToolboxItem[]) => void;
  onReset?: () => void;
  scaffoldName?: string;
  failingMoleculeName?: string;
  initialGauges?: LiveGauges;
  currentGauges?: LiveGauges;
  optimalGauges?: Partial<LiveGauges>;
  disabled?: boolean;
  compact?: boolean;
  title?: string;
  instructionHtml?: string;
}

// Fallback canonical catalog if items are not passed
const DEFAULT_FALLBACK_ITEMS: MolecularToolboxItem[] = [
  {
    id: 'tool-m1-acetyl',
    name: 'Asetil Grubu (-COCH3)',
    formula: '-COCH3',
    chemicalFormula: 'C2H3O',
    type: 'protecting_group',
    category: 'Açilasyon Reaktifi',
    deltaLogP: 0.35,
    deltaAffinity: -3.3,
    halfLifeMultiplier: 1.8,
    shieldingFactor: 0.95,
    toxicityRisk: 0.05,
    description: 'Fenolik hidroksili ester bağıyla maskeler, mukozal erozyonu önler ve COX-1 Ser530 kalıntısını kovalent olarak asetiller.',
    isCorrect: true,
    consequenceFeedback: 'Ester bağı fenolik yakıcılığı maskeledi; Aspirin COX-1 Ser530 kalıntısını kovalent asetilleyerek kanamayı durdurdu.',
  },
  {
    id: 'tool-m2-amide',
    name: 'Amid Köprüsü (-CONH-)',
    formula: '-CONH-',
    chemicalFormula: 'CH2NO',
    type: 'bioisostere',
    category: 'Biyoizosterik Değişim',
    deltaLogP: -0.3,
    deltaAffinity: -2.9,
    halfLifeMultiplier: 100.0,
    shieldingFactor: 0.98,
    toxicityRisk: 0.05,
    description: 'Ester oksijenini -NH- ile değiştirir. Azotun elektron delokalizasyonu karbonilin elektrofilikliğini düşürür ve esteraz hidrolizini bloke eder.',
    isCorrect: true,
    consequenceFeedback: 'Amid rezonansı esteraz atağını durdurdu; yarılanma ömrü 2 dakikadan 3.5 saate fırladı.',
  },
  {
    id: 'tool-m11-fluorine',
    name: 'Flor Atomu (-F)',
    formula: '-F',
    chemicalFormula: 'F',
    type: 'atom',
    category: 'Elektronik Biyoizoster',
    deltaLogP: 0.25,
    deltaAffinity: -1.8,
    halfLifeMultiplier: 4.5,
    shieldingFactor: 0.85,
    toxicityRisk: 0.08,
    description: 'Grimm hidrit yer değiştirme kuralı: Hidrojen ile benzer van der Waals yarıçapı, ancak C-F bağı 485 kJ/mol ile CYP450 oksidasyonuna karşı aşılmaz bir kalkan oluşturur.',
    isCorrect: true,
    consequenceFeedback: 'Metabolik açıdan kararsız C-H bağı C-F kalkanı ile korundu; Faz I hidroksilasyon engellendi.',
  },
  {
    id: 'tool-m12-tetrazole',
    name: 'Tetrazol Halkası',
    formula: '-CN4H',
    chemicalFormula: 'CN4H',
    type: 'bioisostere',
    category: 'Non-Klasik Biyoizoster',
    deltaLogP: 0.9,
    deltaAffinity: -3.5,
    halfLifeMultiplier: 3.2,
    shieldingFactor: 0.7,
    toxicityRisk: 0.05,
    description: 'Karboksilat (-COO⁻) asit izosteridir. 10 kat daha lipofilik olup oral biyoyararlanımı artırırken fizyolojik pH 7.4 altında negatif yükünü korur.',
    isCorrect: true,
    consequenceFeedback: 'Tetrazol halkası oral lipofilisiteyi artırırken AT1 reseptörüyle güçlü elektrostatik tutunmayı sağladı.',
  },
  {
    id: 'tool-m1-methyl',
    name: 'Metil Grubu (-CH3)',
    formula: '-CH3',
    chemicalFormula: 'CH3',
    type: 'functional_group',
    category: 'Alkilasyon Reaktifi',
    deltaLogP: 0.5,
    deltaAffinity: 2.1,
    halfLifeMultiplier: 3.0,
    shieldingFactor: 0.4,
    toxicityRisk: 0.3,
    description: 'Fenolik oksijeni metil eterine çevirir. COX-1 aktif bölgesine asetil transferini imkansız kılar.',
    isCorrect: false,
    consequenceFeedback: 'Eter bağı COX-1 asetilasyon kabiliyetini yok etti; analjezik etkinlik kayboldu.',
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  all: 'Tümü',
  bioisostere: 'Biyoizosterler',
  functional_group: 'Fonksiyonel Gruplar',
  protecting_group: 'Koruyucu Gruplar',
  atom: 'Atom / İzosterler',
  steric_shield: 'Sterik Kalkanlar',
  prodrug_mask: 'Ön İlaç Maskeleri',
};

export const MolecularToolbox: React.FC<MolecularToolboxProps> = ({
  items,
  availableToolIds,
  selectedItemId,
  onSelectItem,
  onSelectItemId,
  onApply,
  onReset,
  scaffoldName = 'İlaç Çekirdek İskeleti',
  failingMoleculeName,
  initialGauges = {
    logP: 1.4,
    percentIonized: 60,
    metabolicHalfLifeMinutes: 10,
    receptorAffinityDeltaG: -4.5,
    bloodBrainBarrierPenetration: 20,
  },
  currentGauges,
  optimalGauges,
  disabled = false,
  compact = false,
  title,
  instructionHtml,
}) => {
  // Determine available items
  const toolList = useMemo(() => {
    const pool = items && items.length > 0 ? items : DEFAULT_FALLBACK_ITEMS;
    if (availableToolIds && availableToolIds.length > 0) {
      const filtered = pool.filter((it) => availableToolIds.includes(it.id));
      return filtered.length > 0 ? filtered : pool;
    }
    return pool;
  }, [items, availableToolIds]);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    selectedItemId || null
  );

  const effectiveSelectedId = selectedItemId !== undefined ? selectedItemId : internalSelectedId;

  const selectedItem = useMemo(() => {
    return toolList.find((it) => it.id === effectiveSelectedId) || null;
  }, [toolList, effectiveSelectedId]);

  // Filtered by category
  const filteredTools = useMemo(() => {
    if (activeCategory === 'all') return toolList;
    return toolList.filter((it) => it.type === activeCategory || it.category?.toLowerCase().includes(activeCategory));
  }, [toolList, activeCategory]);

  // Dynamic calculated gauges
  const previewGauges = useMemo(() => {
    if (!selectedItem) return currentGauges || initialGauges;
    return calculateModifiedGauges(initialGauges, [selectedItem]);
  }, [selectedItem, initialGauges, currentGauges]);

  const handleSelect = (item: MolecularToolboxItem) => {
    if (disabled) return;
    setInternalSelectedId(item.id);
    onSelectItemId?.(item.id);
    onSelectItem?.(item);
  };

  const handleApply = () => {
    if (disabled || !selectedItem) return;
    onApply?.([selectedItem]);
  };

  const handleReset = () => {
    if (disabled) return;
    setInternalSelectedId(null);
    onSelectItemId?.('');
    onReset?.();
  };

  return (
    <div
      style={{
        borderRadius: 16,
        background: '#0F172A',
        border: '1px solid #1E293B',
        padding: compact ? 16 : 22,
        color: '#F8FAFC',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                color: '#FFFFFF',
                fontSize: 14,
              }}
            >
              <ApartmentOutlined />
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>
              {title || `Moleküler Tasarım & Alet Çantası: ${scaffoldName}`}
            </span>
          </div>
          {failingMoleculeName && (
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
              Hedef İlaç Çekirdeği: <strong style={{ color: '#E2E8F0' }}>{failingMoleculeName}</strong>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag
            color="geekblue"
            style={{
              borderRadius: 6,
              padding: '2px 10px',
              fontWeight: 600,
              border: '1px solid #1D4ED8',
            }}
          >
            Biyoizosterik Montaj
          </Tag>
          {selectedItem && (
            <Button
              size="small"
              icon={<SyncOutlined />}
              onClick={handleReset}
              disabled={disabled}
              style={{
                borderRadius: 6,
                background: '#1E293B',
                borderColor: '#334155',
                color: '#CBD5E1',
                fontSize: 12,
              }}
            >
              İskeleti Sıfırla
            </Button>
          )}
        </div>
      </div>

      {instructionHtml && (
        <div
          style={{
            fontSize: 13,
            color: '#CBD5E1',
            lineHeight: 1.5,
            marginBottom: 16,
            background: 'rgba(30, 41, 59, 0.6)',
            padding: '10px 14px',
            borderRadius: 10,
            borderLeft: '3px solid #0284C7',
          }}
          dangerouslySetInnerHTML={{ __html: instructionHtml }}
        />
      )}

      {/* Interactive Visual Molecular Scaffold Canvas */}
      <div
        style={{
          background: 'linear-gradient(180deg, #131E35 0%, #0F172A 100%)',
          borderRadius: 14,
          border: '1px solid #1E293B',
          padding: 16,
          marginBottom: 18,
          position: 'relative',
          overflow: 'visible',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Kimyasal İskelet & Modifikasyon Yuvası [R]
          </span>
          <span style={{ fontSize: 12, color: selectedItem ? '#38BDF8' : '#64748B' }}>
            {selectedItem ? `Aktif Eklenti: ${selectedItem.name}` : 'Yuva Boş (Bir grup seçin)'}
          </span>
        </div>

        {/* Responsive Chemical Scaffold SVG */}
        <div style={{ width: '100%', minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg
            viewBox="0 0 540 170"
            style={{ width: '100%', height: '100%', maxHeight: 170, overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="scaffoldBond" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#818CF8" />
              </linearGradient>
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Core Aromatic Ring (Benzene Core Hexagon) */}
            <g transform="translate(140, 80)">
              {/* Outer Ring */}
              <polygon
                points="0,-45 39,-22.5 39,22.5 0,45 -39,22.5 -39,-22.5"
                fill="rgba(15, 23, 42, 0.8)"
                stroke="#38BDF8"
                strokeWidth="2.5"
              />
              {/* Inner Delocalized Circle */}
              <circle
                cx="0"
                cy="0"
                r="26"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="1.5"
                strokeDasharray="5,4"
              />
              <text x="0" y="4" textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="600">
                Aromatik Çekirdek
              </text>
            </g>

            {/* Left Functional Branch (e.g. Acid/Ester Core) */}
            <g transform="translate(101, 80)">
              <line x1="0" y1="0" x2="-45" y2="0" stroke="#64748B" strokeWidth="2.5" />
              <circle cx="-50" cy="0" r="14" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
              <text x="-50" y="4" textAnchor="middle" fill="#E2E8F0" fontSize="10" fontWeight="700">
                C(=O)
              </text>
              <line x1="-50" y1="-14" x2="-50" y2="-32" stroke="#EF4444" strokeWidth="2" />
              <text x="-50" y="-36" textAnchor="middle" fill="#EF4444" fontSize="11" fontWeight="700">
                =O
              </text>
            </g>

            {/* Connecting Bridge Bond to Slot [R] */}
            <line
              x1="179"
              y1="80"
              x2="260"
              y2="80"
              stroke={selectedItem ? '#10B981' : '#38BDF8'}
              strokeWidth={selectedItem ? '3.5' : '2'}
              strokeDasharray={selectedItem ? 'none' : '4,4'}
              filter={selectedItem ? 'url(#neonGlow)' : undefined}
            />

            {/* Active Attachment Slot Socket [R] */}
            <g transform="translate(300, 80)">
              {selectedItem ? (
                // Docked Fragment Representation
                <g filter="url(#neonGlow)">
                  <rect
                    x="-40"
                    y="-30"
                    width="110"
                    height="60"
                    rx="12"
                    fill="rgba(16, 185, 129, 0.15)"
                    stroke="#10B981"
                    strokeWidth="2.5"
                  />
                  <text
                    x="15"
                    y="-8"
                    textAnchor="middle"
                    fill="#6EE7B7"
                    fontSize="13"
                    fontWeight="800"
                    fontFamily="monospace"
                  >
                    {selectedItem.formula}
                  </text>
                  <text
                    x="15"
                    y="14"
                    textAnchor="middle"
                    fill="#A7F3D0"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {selectedItem.name.split(' ')[0]}
                  </text>
                </g>
              ) : (
                // Empty Docking Socket
                <g>
                  <circle
                    cx="0"
                    cy="0"
                    r="28"
                    fill="rgba(56, 189, 248, 0.08)"
                    stroke="#38BDF8"
                    strokeWidth="2"
                    strokeDasharray="5,4"
                  />
                  <text
                    x="0"
                    y="5"
                    textAnchor="middle"
                    fill="#38BDF8"
                    fontSize="14"
                    fontWeight="800"
                  >
                    [ R ]
                  </text>
                  <text
                    x="0"
                    y="42"
                    textAnchor="middle"
                    fill="#64748B"
                    fontSize="10"
                  >
                    Montaj Yuvası
                  </text>
                </g>
              )}
            </g>

            {/* Shield / Resonance Force Vector Indicator if shielded */}
            {selectedItem && selectedItem.shieldingFactor > 0 && (
              <g transform="translate(420, 80)">
                <path
                  d="M 0 -24 Q 25 -24 35 0 Q 25 24 0 24 Z"
                  fill="rgba(14, 165, 233, 0.2)"
                  stroke="#38BDF8"
                  strokeWidth="2"
                  filter="url(#neonGlow)"
                />
                <text x="14" y="4" textAnchor="middle" fill="#38BDF8" fontSize="10" fontWeight="700">
                  🛡️ ZIRH
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Category Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 14,
          overflowX: 'auto',
          paddingBottom: 4,
        }}
      >
        {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => {
          const isActive = activeCategory === catKey;
          return (
            <button
              key={catKey}
              onClick={() => setActiveCategory(catKey)}
              disabled={disabled}
              style={{
                background: isActive ? '#2563EB' : '#1E293B',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                border: isActive ? '1px solid #3B82F6' : '1px solid #334155',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                cursor: disabled ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {catLabel}
            </button>
          );
        })}
      </div>

      {/* Tool Shelf Item Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12,
          marginBottom: 18,
        }}
      >
        {filteredTools.map((tool) => {
          const isSelected = tool.id === effectiveSelectedId;

          return (
            <div
              key={tool.id}
              onClick={() => handleSelect(tool)}
              style={{
                borderRadius: 12,
                background: isSelected ? 'rgba(37, 99, 235, 0.18)' : '#1E293B',
                border: isSelected ? '2px solid #38BDF8' : '1px solid #334155',
                padding: 14,
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                boxShadow: isSelected ? '0 0 16px rgba(56, 189, 248, 0.25)' : 'none',
              }}
            >
              {/* Item Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      background: isSelected ? '#0284C7' : '#0F172A',
                      border: '1px solid #334155',
                      borderRadius: 8,
                      padding: '4px 8px',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      fontSize: 13,
                      color: isSelected ? '#FFFFFF' : '#38BDF8',
                    }}
                  >
                    {tool.formula}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>
                      {tool.name}
                    </div>
                    {tool.category && (
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>{tool.category}</div>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <CheckCircleFilled style={{ color: '#10B981', fontSize: 18 }} />
                )}
              </div>

              {/* Physicochemical Delta Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <Tooltip title="Lipofilisite Değişimi (ΔLogP)">
                  <span
                    style={{
                      margin: 0,
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 4,
                      padding: '2px 6px',
                      backgroundColor: 'rgba(14, 165, 233, 0.15)',
                      color: '#38BDF8',
                      border: '1px solid rgba(14, 165, 233, 0.3)',
                    }}
                  >
                    ΔLogP {tool.deltaLogP >= 0 ? `+${tool.deltaLogP}` : tool.deltaLogP}
                  </span>
                </Tooltip>
                <Tooltip title="Reseptör Bağlanma Serbest Enerjisi (ΔAffinity kcal/mol)">
                  <span
                    style={{
                      margin: 0,
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 4,
                      padding: '2px 6px',
                      backgroundColor: tool.deltaAffinity < 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                      color: tool.deltaAffinity < 0 ? '#34D399' : '#FB7185',
                      border: `1px solid ${tool.deltaAffinity < 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                    }}
                  >
                    ΔG {tool.deltaAffinity >= 0 ? `+${tool.deltaAffinity}` : tool.deltaAffinity}
                  </span>
                </Tooltip>
                {tool.halfLifeMultiplier > 1 && (
                  <Tooltip title="Metabolik Yarı Ömür Çarpanı">
                    <span
                      style={{
                        margin: 0,
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 4,
                        padding: '2px 6px',
                        backgroundColor: 'rgba(168, 85, 247, 0.15)',
                        color: '#C084FC',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                      }}
                    >
                      {tool.halfLifeMultiplier}x Yarı Ömür
                    </span>
                  </Tooltip>
                )}
                {tool.shieldingFactor > 0 && (
                  <Tooltip title="Enzimatik Koruyucu Zırh Faktörü">
                    <span
                      style={{
                        margin: 0,
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 4,
                        padding: '2px 6px',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        color: '#FBBF24',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                      }}
                    >
                      %{Math.round(tool.shieldingFactor * 100)} Zırh
                    </span>
                  </Tooltip>
                )}
              </div>

              {/* Description */}
              <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.4, flex: 1 }}>
                {tool.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Physicochemical Preview Gauge Bar */}
      <div
        style={{
          background: '#1E293B',
          borderRadius: 12,
          padding: 14,
          marginBottom: 16,
          border: '1px solid #334155',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
            Canlı Fizikokimyasal Simülasyon Göstergeleri
          </span>
          <span style={{ fontSize: 12, color: '#38BDF8' }}>
            {selectedItem ? 'Seçilen Grup ile Simüle Ediliyor' : 'Mevcut Durum'}
            {optimalGauges?.logP !== undefined && (
              <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 8 }}>
                (Optimum Hedef: LogP {optimalGauges.logP})
              </span>
            )}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 12,
          }}
        >
          {/* LogP */}
          <div style={{ background: '#0F172A', padding: 10, borderRadius: 8, border: '1px solid #334155' }}>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>LogP (Lipofilisite)</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#38BDF8', marginTop: 2 }}>
              {previewGauges.logP}
              {selectedItem && selectedItem.deltaLogP !== 0 && (
                <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 4 }}>
                  ({selectedItem.deltaLogP > 0 ? `+${selectedItem.deltaLogP}` : selectedItem.deltaLogP})
                </span>
              )}
            </div>
          </div>

          {/* Half-Life */}
          <div style={{ background: '#0F172A', padding: 10, borderRadius: 8, border: '1px solid #334155' }}>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>Metabolik t½</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#10B981', marginTop: 2 }}>
              {previewGauges.metabolicHalfLifeMinutes} dk
              {selectedItem && selectedItem.halfLifeMultiplier > 1 && (
                <span style={{ fontSize: 11, color: '#A7F3D0', marginLeft: 4 }}>
                  (×{selectedItem.halfLifeMultiplier})
                </span>
              )}
            </div>
          </div>

          {/* Affinity */}
          <div style={{ background: '#0F172A', padding: 10, borderRadius: 8, border: '1px solid #334155' }}>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>Reseptör ΔG</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#F59E0B', marginTop: 2 }}>
              {previewGauges.receptorAffinityDeltaG} kcal
            </div>
          </div>

          {/* Shielding */}
          <div style={{ background: '#0F172A', padding: 10, borderRadius: 8, border: '1px solid #334155' }}>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>Enzim Zırhı</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: selectedItem && selectedItem.shieldingFactor > 0 ? '#10B981' : '#64748B', marginTop: 2 }}>
              {selectedItem ? `%${Math.round(selectedItem.shieldingFactor * 100)}` : '%0'}
            </div>
          </div>
        </div>
      </div>

      {/* Consequence Feedback Note if selected */}
      {selectedItem && (
        <div
          style={{
            background: selectedItem.isCorrect !== false ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: selectedItem.isCorrect !== false ? '1px solid #10B981' : '1px solid #EF4444',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <InfoCircleOutlined
            style={{
              color: selectedItem.isCorrect !== false ? '#10B981' : '#EF4444',
              fontSize: 16,
              marginTop: 2,
            }}
          />
          <div style={{ fontSize: 13, color: '#E2E8F0', lineHeight: 1.5 }}>
            <strong style={{ color: selectedItem.isCorrect !== false ? '#6EE7B7' : '#FCA5A5' }}>
              {selectedItem.isCorrect !== false ? 'Klinik İlerleme: ' : 'Farmakokinetik Risk: '}
            </strong>
            {selectedItem.consequenceFeedback || selectedItem.description}
          </div>
        </div>
      )}

      {/* Apply Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button
          type="primary"
          size="large"
          icon={<ThunderboltOutlined />}
          onClick={handleApply}
          disabled={disabled || !selectedItem}
          style={{
            height: 44,
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 14,
            background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
            border: 'none',
            boxShadow: selectedItem ? '0 4px 14px rgba(37, 99, 235, 0.4)' : 'none',
          }}
        >
          Moleküler Değişikliği Uygula & Test Et
        </Button>
      </div>
    </div>
  );
};
