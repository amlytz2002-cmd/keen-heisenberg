import React, { useState, useMemo } from 'react';
import { Tag, Button } from 'antd';
import {
  ThunderboltOutlined,
  CloseCircleFilled,
  CheckCircleFilled,
  SyncOutlined,
} from '@ant-design/icons';
import type {
  MolecularToolboxItem,
  SimulationFeedback,
} from '../../types/medicinalChemistry';

export interface EnzymeCleavageSimulatorProps {
  moleculeName?: string;
  enzymeName?: string;
  targetBond?: string;
  isShielded?: boolean;
  shieldType?: 'bioisostere_amide' | 'steric_dimethyl' | 'fluorine_block' | 'prodrug_mask' | string;
  initialHalfLifeMinutes?: number;
  stabilizedHalfLifeMinutes?: number;
  selectedToolId?: string;
  optimalToolId?: string;
  availableTools?: MolecularToolboxItem[];
  onSimulationComplete?: (success: boolean) => void;
  onSelectTool?: (toolId: string) => void;
  disabled?: boolean;
  compact?: boolean;
  title?: string;
  instructionHtml?: string;
  simulationFeedback?: SimulationFeedback;
}

type SimulationState = 'idle' | 'charging' | 'firing' | 'deflected' | 'cleaved';

export const EnzymeCleavageSimulator: React.FC<EnzymeCleavageSimulatorProps> = ({
  moleculeName = 'Prokain / Antiaritmik Çekirdek',
  enzymeName = 'Plazma Psödokolinesterazı (Butirilkolinesteraz)',
  targetBond = 'Ester Bağı (C-O-C=O)',
  isShielded: propIsShielded,
  shieldType = 'bioisostere_amide',
  initialHalfLifeMinutes = 2.0,
  stabilizedHalfLifeMinutes = 210.0,
  selectedToolId,
  optimalToolId = 'tool-m2-amide',
  availableTools,
  onSimulationComplete,
  onSelectTool,
  disabled = false,
  compact = false,
  title,
  instructionHtml,
  simulationFeedback,
}) => {
  // If propIsShielded is not directly given, infer from selectedToolId === optimalToolId
  const effectiveIsShielded = useMemo(() => {
    if (propIsShielded !== undefined) return propIsShielded;
    if (selectedToolId && optimalToolId) {
      return selectedToolId === optimalToolId || selectedToolId.includes('amide') || selectedToolId.includes('shield');
    }
    return false;
  }, [propIsShielded, selectedToolId, optimalToolId]);

  const [simState, setSimState] = useState<SimulationState>('idle');

  // Handle simulation trigger
  const handleStartSimulation = () => {
    if (disabled || simState === 'charging' || simState === 'firing') return;

    setSimState('charging');

    // Charge phase
    setTimeout(() => {
      setSimState('firing');

      // Impact phase after laser flight
      setTimeout(() => {
        if (effectiveIsShielded) {
          setSimState('deflected');
          onSimulationComplete?.(true);
        } else {
          setSimState('cleaved');
          onSimulationComplete?.(false);
        }
      }, 700);
    }, 450);
  };

  const handleReset = () => {
    if (disabled) return;
    setSimState('idle');
  };

  // Live telemetry values based on state
  const currentHalfLife = useMemo(() => {
    if (simState === 'deflected') return stabilizedHalfLifeMinutes;
    if (simState === 'cleaved') return Math.max(0.5, initialHalfLifeMinutes * 0.5);
    return effectiveIsShielded ? stabilizedHalfLifeMinutes : initialHalfLifeMinutes;
  }, [simState, effectiveIsShielded, stabilizedHalfLifeMinutes, initialHalfLifeMinutes]);

  const cleavageRate = useMemo(() => {
    if (simState === 'deflected') return 0;
    if (simState === 'cleaved') return 99;
    return effectiveIsShielded ? 2 : 94;
  }, [simState, effectiveIsShielded]);

  const shieldIntegrity = useMemo(() => {
    if (effectiveIsShielded) return 98;
    return 5;
  }, [effectiveIsShielded]);

  return (
    <div
      style={{
        borderRadius: 16,
        background: '#0F172A',
        border: '1px solid #1E293B',
        padding: compact ? 16 : 22,
        color: '#F8FAFC',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
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
                background: 'linear-gradient(135deg, #DC2626 0%, #EA580C 100%)',
                color: '#FFFFFF',
                fontSize: 14,
              }}
            >
              <ThunderboltOutlined />
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>
              {title || `Enzimatik Saldırı & Biyoizosterik Kalkan Simülatörü`}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
            Hedef Molekül: <strong style={{ color: '#E2E8F0' }}>{moleculeName}</strong> | Hedef Bağ: <strong style={{ color: '#FCD34D' }}>{targetBond}</strong> | Enzim: <strong style={{ color: '#F87171' }}>{enzymeName}</strong>
            {effectiveIsShielded && <span style={{ marginLeft: 8, color: '#6EE7B7' }}>({shieldType})</span>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag
            color={effectiveIsShielded ? 'green' : 'volcano'}
            style={{
              borderRadius: 6,
              padding: '2px 10px',
              fontWeight: 600,
            }}
          >
            {effectiveIsShielded ? '🛡️ Biyoizosterik Zırh Aktif' : '⚠️ Savunmasız Scissile Bağ'}
          </Tag>
          <Button
            size="small"
            icon={<SyncOutlined />}
            onClick={handleReset}
            disabled={disabled || simState === 'idle'}
            style={{
              borderRadius: 6,
              background: '#1E293B',
              borderColor: '#334155',
              color: '#CBD5E1',
              fontSize: 12,
            }}
          >
            Sıfırla
          </Button>
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
            borderLeft: '3px solid #DC2626',
          }}
          dangerouslySetInnerHTML={{ __html: instructionHtml }}
        />
      )}

      {/* Optional Available Tool Quick-Selector if tools are provided */}
      {availableTools && availableTools.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 8 }}>
            Enzime Karşı Test Edilecek Kimyasal Modifikasyonu Seçin:
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {availableTools.map((tool) => {
              const isSelected = tool.id === selectedToolId;
              return (
                <button
                  key={tool.id}
                  onClick={() => onSelectTool?.(tool.id)}
                  disabled={disabled}
                  style={{
                    background: isSelected ? '#2563EB' : '#1E293B',
                    border: isSelected ? '2px solid #38BDF8' : '1px solid #334155',
                    color: isSelected ? '#FFFFFF' : '#CBD5E1',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontFamily: 'monospace' }}>{tool.formula}</span>
                  <span>{tool.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main SVG Laser Assault Arena */}
      <div
        style={{
          background: 'radial-gradient(ellipse at center, #1E1B4B 0%, #0B0F19 100%)',
          borderRadius: 14,
          border: '1px solid #2E1065',
          padding: 16,
          marginBottom: 18,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: '#A5B4FC', letterSpacing: '0.05em' }}>
            METABOLİK LAZER HEDEFLEME SAHASI
          </span>
          <span style={{ fontSize: 12, color: simState === 'deflected' ? '#10B981' : simState === 'cleaved' ? '#EF4444' : '#94A3B8' }}>
            {simState === 'idle' && 'Lazer Beklemede (Test Et butonuna basın)'}
            {simState === 'charging' && '⚡ Enzimatik Serin Nükleofili Yükleniyor...'}
            {simState === 'firing' && '🔥 Hidrolitik Işın Fırlatıldı!'}
            {simState === 'deflected' && '🛡️ IŞIN SAPTIRILDI (Biyoizosterik Zafer)'}
            {simState === 'cleaved' && '💥 BAĞ PARÇALANDI (Hızlı Metabolizma)'}
          </span>
        </div>

        {/* Responsive Interactive SVG Canvas */}
        <div style={{ width: '100%', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg
            viewBox="0 0 640 220"
            style={{ width: '100%', height: '100%', maxHeight: 220, overflow: 'visible' }}
          >
            <defs>
              {/* Laser Core Gradient */}
              <linearGradient id="laserBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#DC2626" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#F97316" stopOpacity="1" />
                <stop offset="100%" stopColor="#FEF08A" stopOpacity="1" />
              </linearGradient>

              {/* Emerald Deflection Shield Gradient */}
              <radialGradient id="shieldAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.7" />
                <stop offset="70%" stopColor="#059669" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#047857" stopOpacity="0" />
              </radialGradient>

              {/* Deflection Vector Glow */}
              <filter id="laserGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 1. Enzyme Active Site Glyphs (Left Side: Ser-His-Asp Triad) */}
            <g transform="translate(60, 110)">
              {/* Pulsating Enzyme Catalytic Core */}
              <circle
                cx="0"
                cy="0"
                r="38"
                fill="rgba(220, 38, 38, 0.15)"
                stroke="#EF4444"
                strokeWidth="2.5"
                filter="url(#laserGlow)"
              />
              <circle
                cx="0"
                cy="0"
                r={simState === 'charging' ? 44 : 32}
                fill="none"
                stroke="#F87171"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
              <text x="0" y="-8" textAnchor="middle" fill="#FCA5A5" fontSize="10" fontWeight="700">
                ESTERAZ
              </text>
              <text x="0" y="8" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="800">
                Ser198:OH
              </text>
              <text x="0" y="22" textAnchor="middle" fill="#94A3B8" fontSize="8">
                Katalitik Triyad
              </text>
            </g>

            {/* Laser Emitter Nozzle */}
            <line x1="98" y1="110" x2="115" y2="110" stroke="#EF4444" strokeWidth="4" />

            {/* 2. Laser Attack Beam Path */}
            {(simState === 'firing' || simState === 'deflected' || simState === 'cleaved') && (
              <g filter="url(#laserGlow)">
                {/* Main Incoming Laser Vector */}
                <line
                  x1="115"
                  y1="110"
                  x2={370}
                  y2="110"
                  stroke="url(#laserBeamGrad)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <line
                  x1="115"
                  y1="110"
                  x2={370}
                  y2="110"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Laser Pulse Particles */}
                <circle cx="240" cy="110" r="4" fill="#FFFFFF" />
                <circle cx="310" cy="110" r="5" fill="#FEF08A" />
              </g>
            )}

            {/* 3. Substrate Molecule & Scissile Bond (Right Side) */}
            <g transform="translate(420, 110)">
              {/* Left Substrate Fragment (e.g. Aromatic PABA ring) */}
              <g transform={simState === 'cleaved' ? 'translate(-35, -20)' : 'translate(0, 0)'}>
                <polygon
                  points="-40,-25 -15,-38 10,-25 10,25 -15,38 -40,25"
                  fill="#1E293B"
                  stroke="#38BDF8"
                  strokeWidth="2"
                />
                <text x="-15" y="4" textAnchor="middle" fill="#38BDF8" fontSize="9" fontWeight="700">
                  Ar-C(=O)
                </text>
              </g>

              {/* Scissile Bond Core [ -O- or -NH- ] */}
              <g transform="translate(30, 0)">
                {effectiveIsShielded ? (
                  // Shielded Amide Core
                  <g>
                    <rect
                      x="-18"
                      y="-18"
                      width="36"
                      height="36"
                      rx="8"
                      fill="#065F46"
                      stroke="#10B981"
                      strokeWidth="2"
                      filter="url(#laserGlow)"
                    />
                    <text x="0" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="800">
                      -NH-
                    </text>
                  </g>
                ) : (
                  // Vulnerable Ester Core
                  <g>
                    <circle
                      cx="0"
                      cy="0"
                      r={simState === 'cleaved' ? 14 : 16}
                      fill={simState === 'cleaved' ? 'rgba(239, 68, 68, 0.3)' : '#1E293B'}
                      stroke={simState === 'cleaved' ? '#EF4444' : '#F59E0B'}
                      strokeWidth="2"
                      strokeDasharray={simState === 'cleaved' ? '3,3' : 'none'}
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill={simState === 'cleaved' ? '#EF4444' : '#FBBF24'}
                      fontSize="11"
                      fontWeight="800"
                    >
                      {simState === 'cleaved' ? '✕' : '-O-'}
                    </text>
                  </g>
                )}
              </g>

              {/* Right Substrate Fragment (e.g. Diethylaminoethyl chain) */}
              <g transform={simState === 'cleaved' ? 'translate(45, 25)' : 'translate(0, 0)'}>
                <line x1="50" y1="0" x2="80" y2="0" stroke="#64748B" strokeWidth="2.5" />
                <circle cx="85" cy="0" r="14" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
                <text x="85" y="4" textAnchor="middle" fill="#E2E8F0" fontSize="10" fontWeight="700">
                  -NEt2
                </text>
              </g>

              {/* Targeting Reticle over Scissile Bond */}
              {simState === 'idle' && (
                <circle
                  cx="30"
                  cy="0"
                  r="24"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
              )}
            </g>

            {/* 4. DEFLECTION SHIELD FORCEFIELD (If Shielded) */}
            {effectiveIsShielded && (
              <g transform="translate(435, 110)" filter="url(#laserGlow)">
                {/* Arc Shield Barrier */}
                <path
                  d="M -20 -50 Q -5 0 -20 50"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth={simState === 'deflected' ? '6' : '3.5'}
                  strokeLinecap="round"
                />
                <circle cx="-15" cy="0" r="38" fill="url(#shieldAura)" />
                <text x="-30" y="-55" textAnchor="middle" fill="#6EE7B7" fontSize="10" fontWeight="800">
                  AMİD REZONANS ZIRHI
                </text>

                {/* Deflected Laser Ray Angled 45 degrees up and away */}
                {simState === 'deflected' && (
                  <g>
                    <line
                      x1="-15"
                      y1="0"
                      x2="-100"
                      y2="-95"
                      stroke="#10B981"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="-15"
                      y1="0"
                      x2="-100"
                      y2="-95"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    {/* Deflection Sparks */}
                    <circle cx="-35" cy="-20" r="3" fill="#6EE7B7" />
                    <circle cx="-55" cy="-45" r="4" fill="#A7F3D0" />
                    <circle cx="-80" cy="-70" r="3" fill="#FFFFFF" />
                  </g>
                )}
              </g>
            )}

            {/* 5. CLEAVAGE SHATTER IMPACT (If Not Shielded & Impacted) */}
            {!effectiveIsShielded && simState === 'cleaved' && (
              <g transform="translate(450, 110)" filter="url(#laserGlow)">
                {/* Explosion Sparks */}
                <line x1="0" y1="0" x2="-25" y2="-30" stroke="#EF4444" strokeWidth="2.5" />
                <line x1="0" y1="0" x2="25" y2="-30" stroke="#F97316" strokeWidth="2.5" />
                <line x1="0" y1="0" x2="-20" y2="30" stroke="#EF4444" strokeWidth="2.5" />
                <line x1="0" y1="0" x2="30" y2="20" stroke="#F59E0B" strokeWidth="2.5" />
                <circle cx="0" cy="0" r="16" fill="rgba(239, 68, 68, 0.4)" stroke="#EF4444" strokeWidth="2" />
                <text x="0" y="4" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="900">
                  💥
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Telemetry Dashboard Counters */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ background: '#1E293B', padding: 12, borderRadius: 10, border: '1px solid #334155' }}>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>Plazma t½ Ömrü</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: currentHalfLife > 30 ? '#10B981' : '#EF4444', marginTop: 2 }}>
            {currentHalfLife} dk
          </div>
          <div style={{ fontSize: 10, color: '#64748B' }}>
            {currentHalfLife > 30 ? 'Kararlı Terapötik Düzey' : 'Aşırı Hızlı Klirens!'}
          </div>
        </div>

        <div style={{ background: '#1E293B', padding: 12, borderRadius: 10, border: '1px solid #334155' }}>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>Enzimatik Parçalanma</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: cleavageRate < 10 ? '#10B981' : '#EF4444', marginTop: 2 }}>
            %{cleavageRate} / dk
          </div>
          <div style={{ fontSize: 10, color: '#64748B' }}>
            {cleavageRate < 10 ? 'Nükleofilik Saldırı Engellendi' : 'Hızlı Hidrolitik Yıkım'}
          </div>
        </div>

        <div style={{ background: '#1E293B', padding: 12, borderRadius: 10, border: '1px solid #334155' }}>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>Zırh Bütünlüğü</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: shieldIntegrity > 80 ? '#10B981' : '#F59E0B', marginTop: 2 }}>
            %{shieldIntegrity}
          </div>
          <div style={{ fontSize: 10, color: '#64748B' }}>
            {effectiveIsShielded ? 'Mezomerik Rezonans Güçlü' : 'Serbest Karbonil Açıkta'}
          </div>
        </div>

        <div style={{ background: '#1E293B', padding: 12, borderRadius: 10, border: '1px solid #334155' }}>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>Durum Raporu</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: simState === 'deflected' ? '#10B981' : simState === 'cleaved' ? '#EF4444' : '#38BDF8', marginTop: 4 }}>
            {simState === 'deflected' ? 'ZIRH KORUDU' : simState === 'cleaved' ? 'HİDROLİZ OLDU' : 'HAZIR'}
          </div>
        </div>
      </div>

      {/* Real-Time Academic Feedback Banner upon simulation result */}
      {simState === 'deflected' && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid #10B981',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <CheckCircleFilled style={{ color: '#10B981', fontSize: 18, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#6EE7B7' }}>
              {simulationFeedback?.successTitle || 'Enzimatik Zırh Başarılı! (Defleksiyon Gerçekleşti)'}
            </div>
            <div style={{ fontSize: 12, color: '#E2E8F0', marginTop: 2, lineHeight: 1.5 }}>
              {simulationFeedback?.successExplanation ||
                'Ester oksijeni yerine konulan azot atomu (-CONH-), karbonil grubu ile güçlü mezomerik rezonans kurarak esteraz enziminin Ser198 nükleofilik saldırısını saptırdı. Yarı ömür saatlere uzadı ve antiaritmik etki korundu!'}
            </div>
          </div>
        </div>
      )}

      {simState === 'cleaved' && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid #EF4444',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <CloseCircleFilled style={{ color: '#EF4444', fontSize: 18, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FCA5A5' }}>
              {simulationFeedback?.failureTitle || 'Molekül Parçalandı: Hidrolitik Yıkım!'}
            </div>
            <div style={{ fontSize: 12, color: '#E2E8F0', marginTop: 2, lineHeight: 1.5 }}>
              {simulationFeedback?.failureExplanation ||
                'Korunmasız ester bağı plazma psödokolinesterazı tarafından 2 dakika içinde parçalandı. İlaç inaktif metabolitlerine ayrılarak miyokarda ulaşamadan tükendi.'}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button
          type="primary"
          size="large"
          danger={!effectiveIsShielded}
          icon={<ThunderboltOutlined />}
          onClick={handleStartSimulation}
          disabled={disabled || simState === 'charging' || simState === 'firing'}
          style={{
            height: 44,
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 14,
            background: effectiveIsShielded
              ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
              : 'linear-gradient(135deg, #DC2626 0%, #EA580C 100%)',
            border: 'none',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
          }}
        >
          {effectiveIsShielded ? '⚡ Zırhı Test Et (Enzimatik Saldırıyı Başlat)' : '⚡ Enzimatik Saldırıyı Simüle Et'}
        </Button>
      </div>
    </div>
  );
};
