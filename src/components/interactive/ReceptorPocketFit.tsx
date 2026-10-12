import React, { useState, useMemo, useEffect } from 'react';
import { Tag, Button, Slider } from 'antd';
import {
  AimOutlined,
  CheckCircleFilled,
  SyncOutlined,
  WarningOutlined,
} from '@ant-design/icons';

export interface PocketResidue {
  id: string;
  name: string;
  code: string;
  residueType: 'anionic' | 'cationic' | 'hbond_donor' | 'hbond_acceptor' | 'aromatic_hydrophobic' | 'covalent';
  x: number;
  y: number;
  optimalInteraction: 'salt_bridge' | 'hbond' | 'pi_stack' | 'covalent' | 'van_der_waals';
  energyKcal: number;
}

export interface LigandGroup {
  id: string;
  name: string;
  formula: string;
  targetResidueId: string;
  offsetX: number;
  offsetY: number;
}

export interface ReceptorPocketFitProps {
  pocketName?: string;
  targetTargetName?: string;
  pocketResidues?: PocketResidue[];
  ligandGroups?: LigandGroup[];
  selectedToolId?: string;
  onBindingScoreChange?: (score: { deltaG: number; affinityPct: number; clashes: number; isOptimal: boolean }) => void;
  onDockComplete?: (success: boolean) => void;
  disabled?: boolean;
  compact?: boolean;
  title?: string;
  instructionHtml?: string;
}

// Canonical Default Residues: β2-Adrenergic Receptor Active Pocket
const DEFAULT_POCKET_RESIDUES: PocketResidue[] = [
  {
    id: 'res-asp113',
    name: 'Aspartat-113 (TM3)',
    code: 'Asp113 (-COO⁻)',
    residueType: 'anionic',
    x: 180,
    y: 70,
    optimalInteraction: 'salt_bridge',
    energyKcal: -8.5,
  },
  {
    id: 'res-ser204',
    name: 'Serin-204 (TM5)',
    code: 'Ser204 (-OH)',
    residueType: 'hbond_donor',
    x: 440,
    y: 75,
    optimalInteraction: 'hbond',
    energyKcal: -4.2,
  },
  {
    id: 'res-phe290',
    name: 'Fenilalanin-290 (TM6)',
    code: 'Phe290 (Aromatik)',
    residueType: 'aromatic_hydrophobic',
    x: 310,
    y: 175,
    optimalInteraction: 'pi_stack',
    energyKcal: -2.8,
  },
];

const DEFAULT_LIGAND_GROUPS: LigandGroup[] = [
  {
    id: 'lig-amine',
    name: 'Protonlanmış Amin',
    formula: '-NH₂⁺-R',
    targetResidueId: 'res-asp113',
    offsetX: -120,
    offsetY: -35,
  },
  {
    id: 'lig-catechol',
    name: 'Fenolik Hidroksil',
    formula: 'Ar-(OH)₂',
    targetResidueId: 'res-ser204',
    offsetX: 130,
    offsetY: -30,
  },
  {
    id: 'lig-benzene',
    name: 'Aromatik Halka',
    formula: 'C₆H₅',
    targetResidueId: 'res-phe290',
    offsetX: 5,
    offsetY: 65,
  },
];

export const ReceptorPocketFit: React.FC<ReceptorPocketFitProps> = ({
  pocketName = 'β₂-Adrenerjik Reseptör Bağlanma Cebi',
  targetTargetName,
  pocketResidues = DEFAULT_POCKET_RESIDUES,
  ligandGroups = DEFAULT_LIGAND_GROUPS,
  selectedToolId,
  onBindingScoreChange,
  onDockComplete,
  disabled = false,
  compact = false,
  title,
  instructionHtml,
}) => {
  // Docking manipulation state
  // Distance offset (0 is optimal docking locked in pocket)
  const [dockingProgress, setDockingProgress] = useState<number>(35); // 0 (far) to 100 (fully docked)
  const [rotationAngle, setRotationAngle] = useState<number>(-22); // -90 to +90 degrees

  // Closeness calculation
  // Optimal is dockingProgress around 90-100 and rotationAngle near 0 (-5 to +5)
  const isAngleAligned = Math.abs(rotationAngle) <= 6;
  const isDepthDocked = dockingProgress >= 85;
  const isOptimal = isAngleAligned && isDepthDocked;

  // Real-time Ångström distance calculation
  const distanceAngstrom = useMemo(() => {
    const rawDist = (100 - dockingProgress) * 0.04 + Math.abs(rotationAngle) * 0.05 + 1.8;
    return Number(Math.max(1.8, rawDist).toFixed(1));
  }, [dockingProgress, rotationAngle]);

  // Steric clashes check: if pushed too deep with bad angle
  const stericClashes = useMemo(() => {
    if (dockingProgress > 70 && Math.abs(rotationAngle) > 25) return 2;
    if (dockingProgress > 50 && Math.abs(rotationAngle) > 40) return 3;
    if (dockingProgress > 80 && Math.abs(rotationAngle) > 12) return 1;
    return 0;
  }, [dockingProgress, rotationAngle]);

  // Thermodynamic Binding Energy ΔG calculation
  const bindingScore = useMemo(() => {
    if (stericClashes > 0) {
      const clashPenalty = stericClashes * 12.0;
      return {
        deltaG: Number((1.5 + clashPenalty).toFixed(1)),
        affinityPct: Math.max(5, Math.round(25 - stericClashes * 8)),
        clashes: stericClashes,
        isOptimal: false,
      };
    }

    if (isOptimal) {
      // Sum optimal energies
      const baseEnergy = pocketResidues.reduce((acc, r) => acc + r.energyKcal, 0);
      return {
        deltaG: Number(baseEnergy.toFixed(1)), // ~ -15.5 kcal/mol
        affinityPct: 98,
        clashes: 0,
        isOptimal: true,
      };
    }

    // Proportional progress
    const ratio = dockingProgress / 100;
    const anglePenalty = Math.abs(rotationAngle) / 45;
    const currentG = -2.0 - ratio * 10.0 + anglePenalty * 4.0;
    const affinity = Math.min(90, Math.max(10, Math.round(ratio * 85 - anglePenalty * 30)));

    return {
      deltaG: Number(currentG.toFixed(1)),
      affinityPct: affinity,
      clashes: 0,
      isOptimal: false,
    };
  }, [dockingProgress, rotationAngle, isOptimal, stericClashes, pocketResidues]);

  // Emit score changes
  useEffect(() => {
    onBindingScoreChange?.(bindingScore);
    if (bindingScore.isOptimal) {
      onDockComplete?.(true);
    }
  }, [bindingScore, onBindingScoreChange, onDockComplete]);

  // Snap to optimal lock
  const handleSnapDock = () => {
    if (disabled) return;
    setDockingProgress(95);
    setRotationAngle(0);
  };

  const handleReset = () => {
    if (disabled) return;
    setDockingProgress(25);
    setRotationAngle(-30);
  };

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
                background: 'linear-gradient(135deg, #0284C7 0%, #06B6D4 100%)',
                color: '#FFFFFF',
                fontSize: 14,
              }}
            >
              <AimOutlined />
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>
              {title || `Reseptör Cebi Kilit-Anahtar Uyumu (2D Docking)`}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
            Hedef Reseptör: <strong style={{ color: '#E2E8F0' }}>{targetTargetName || pocketName}</strong>
            {selectedToolId && <span style={{ marginLeft: 8, color: '#38BDF8' }}>(Ligand: {selectedToolId})</span>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag
            color={isOptimal ? 'green' : stericClashes > 0 ? 'red' : 'cyan'}
            style={{
              borderRadius: 6,
              padding: '2px 10px',
              fontWeight: 600,
            }}
          >
            {isOptimal
              ? '🎯 Kilitlendi (Tam Uyum)'
              : stericClashes > 0
              ? '⚠️ Sterik Çakışma!'
              : '🔄 Kenetlenme Aranıyor'}
          </Tag>
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
            borderLeft: '3px solid #06B6D4',
          }}
          dangerouslySetInnerHTML={{ __html: instructionHtml }}
        />
      )}

      {/* SVG Docking Stage Arena */}
      <div
        style={{
          background: 'radial-gradient(ellipse at center, #0F223D 0%, #080D1A 100%)',
          borderRadius: 14,
          border: '1px solid #1E293B',
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
          <span style={{ fontSize: 12, fontWeight: 600, color: '#38BDF8', letterSpacing: '0.05em' }}>
            RESEPTÖR CEBİ YÜZEYİ & LİGAND DOCKING SAHASI
          </span>
          <span style={{ fontSize: 12, color: isOptimal ? '#10B981' : stericClashes > 0 ? '#EF4444' : '#94A3B8' }}>
            Mesafe: <strong style={{ color: '#F8FAFC' }}>{distanceAngstrom} Å</strong>
            {isOptimal && ' (Optimal van der Waals yarıçapı!)'}
          </span>
        </div>

        {/* Responsive Interactive SVG Canvas */}
        <div style={{ width: '100%', height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg
            viewBox="0 0 620 260"
            style={{ width: '100%', height: '100%', maxHeight: 260, overflow: 'visible' }}
          >
            <defs>
              {/* Pocket Cavity Wall Texture */}
              <linearGradient id="pocketCleftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1E293B" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0B132B" stopOpacity="0.95" />
              </linearGradient>

              {/* Force Vector Glow */}
              <filter id="forceGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 1. Receptor Pocket Cleft Boundary Contour (Lock Cavity) */}
            <path
              d="M 50 20 Q 90 220 310 230 Q 530 220 570 20 L 610 20 L 610 250 L 10 250 L 10 20 Z"
              fill="url(#pocketCleftGrad)"
              stroke="#1E3A8A"
              strokeWidth="2.5"
            />

            {/* Steric Boundary Warning Zone (Red striped collision wall) */}
            {stericClashes > 0 && (
              <path
                d="M 120 200 Q 310 220 500 200"
                fill="none"
                stroke="#EF4444"
                strokeWidth="6"
                strokeDasharray="6,4"
                filter="url(#forceGlow)"
              />
            )}

            {/* 2. Pocket Amino Acid Residue Targets Anchored on Walls */}
            {pocketResidues.map((res) => {
              const isSalt = res.optimalInteraction === 'salt_bridge';
              const isHBond = res.optimalInteraction === 'hbond';
              const isPi = res.optimalInteraction === 'pi_stack';

              const strokeColor = isSalt ? '#06B6D4' : isHBond ? '#10B981' : isPi ? '#F59E0B' : '#8B5CF6';

              return (
                <g key={res.id} transform={`translate(${res.x}, ${res.y})`}>
                  <circle
                    cx="0"
                    cy="0"
                    r="22"
                    fill="#1E293B"
                    stroke={strokeColor}
                    strokeWidth="2"
                    filter="url(#forceGlow)"
                  />
                  <text x="0" y="-4" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="800">
                    {res.code.split(' ')[0]}
                  </text>
                  <text x="0" y="8" textAnchor="middle" fill={strokeColor} fontSize="8" fontWeight="600">
                    {isSalt ? 'TUZ KÖPRÜSÜ' : isHBond ? 'H-BAĞI' : 'π-İSTİF'}
                  </text>
                </g>
              );
            })}

            {/* 3. Ligand Center Coordinates calculated based on dockingProgress & rotationAngle */}
            {/* Base target center is (310, 110) */}
            {(() => {
              const ligandY = 40 + (dockingProgress / 100) * 70; // 40 to 110
              const ligandX = 310;

              return (
                <g transform={`translate(${ligandX}, ${ligandY}) rotate(${rotationAngle})`}>
                  {/* Central Ligand Scaffold (Aromatic Core with Branches) */}
                  <g filter="url(#forceGlow)">
                    {/* Central Ligand Core */}
                    <polygon
                      points="0,-25 22,-12.5 22,12.5 0,25 -22,12.5 -22,-12.5"
                      fill="#0284C7"
                      stroke="#38BDF8"
                      strokeWidth="2"
                    />
                    <circle cx="0" cy="0" r="12" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="0" y="3" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="800">
                      LİGAND
                    </text>

                    {/* Ligand Functional Group Arms */}
                    {ligandGroups.map((lg) => (
                      <g key={lg.id}>
                        <line x1={lg.offsetX * 0.25} y1={lg.offsetY * 0.25} x2={lg.offsetX * 0.85} y2={lg.offsetY * 0.85} stroke="#38BDF8" strokeWidth="2.5" />
                        <circle cx={lg.offsetX} cy={lg.offsetY} r={14} fill="#1E3A8A" stroke="#06B6D4" strokeWidth="2" />
                        <text x={lg.offsetX} y={lg.offsetY + 4} textAnchor="middle" fill="#67E8F9" fontSize="8" fontWeight="800">
                          {lg.formula}
                        </text>
                      </g>
                    ))}
                  </g>
                </g>
              );
            })()}

            {/* 4. Dynamic Force Lines between Ligand & Residues */}
            {/* Draw interaction lines if dockingProgress > 30 */}
            {dockingProgress > 30 && (
              <g filter="url(#forceGlow)">
                {/* Asp113 Salt Bridge Vector (Cyan) */}
                <line
                  x1={310 - 85}
                  y1={40 + (dockingProgress / 100) * 70 - 32}
                  x2={180}
                  y2={70}
                  stroke="#06B6D4"
                  strokeWidth={isOptimal ? 4 : 2}
                  strokeDasharray={isOptimal ? 'none' : '4,4'}
                />

                {/* Ser204 H-Bond Vector (Green) */}
                <line
                  x1={310 + 90}
                  y1={40 + (dockingProgress / 100) * 70 - 30}
                  x2={440}
                  y2={75}
                  stroke="#10B981"
                  strokeWidth={isOptimal ? 3.5 : 2}
                  strokeDasharray="3,3"
                />

                {/* Phe290 Pi-Stacking Vector (Amber) */}
                <line
                  x1={310}
                  y1={40 + (dockingProgress / 100) * 70 + 52}
                  x2={310}
                  y2={175}
                  stroke="#F59E0B"
                  strokeWidth={isOptimal ? 3 : 1.5}
                  strokeDasharray="5,3"
                />

                {/* Steric Clash Halo if clashes occur */}
                {stericClashes > 0 && (
                  <circle
                    cx="310"
                    cy="160"
                    r="28"
                    fill="rgba(239, 68, 68, 0.25)"
                    stroke="#EF4444"
                    strokeWidth="2.5"
                  />
                )}
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Docking Manipulation Controls: Sliders */}
      <div
        style={{
          background: '#1E293B',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          border: '1px solid #334155',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Depth Docking Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: '#94A3B8' }}>
                Cepte İlerleme Derinliği (% Docking):
              </span>
              <span style={{ fontWeight: 700, color: isDepthDocked ? '#10B981' : '#38BDF8' }}>
                %{dockingProgress}
              </span>
            </div>
            <Slider
              min={0}
              max={100}
              value={dockingProgress}
              onChange={(val) => setDockingProgress(val)}
              disabled={disabled}
              trackStyle={{ background: isDepthDocked ? '#10B981' : '#0284C7' }}
            />
          </div>

          {/* Orientation Rotation Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: '#94A3B8' }}>
                Ligand Rotasyon Açısı (θ Derece):
              </span>
              <span style={{ fontWeight: 700, color: isAngleAligned ? '#10B981' : '#F59E0B' }}>
                {rotationAngle}° {isAngleAligned && '(Hizalı)'}
              </span>
            </div>
            <Slider
              min={-60}
              max={60}
              value={rotationAngle}
              onChange={(val) => setRotationAngle(val)}
              disabled={disabled}
              trackStyle={{ background: isAngleAligned ? '#10B981' : '#F59E0B' }}
            />
          </div>
        </div>
      </div>

      {/* Thermodynamic Binding Telemetry HUD */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ background: '#0F172A', padding: 12, borderRadius: 10, border: '1px solid #334155' }}>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>Bağlanma Serbest Enerjisi (ΔG)</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: bindingScore.deltaG < -8 ? '#10B981' : bindingScore.deltaG < 0 ? '#F59E0B' : '#EF4444', marginTop: 2 }}>
            {bindingScore.deltaG} kcal/mol
          </div>
          <div style={{ fontSize: 10, color: '#64748B' }}>
            {bindingScore.deltaG < -8 ? 'Termodinamik Spontan' : 'Yetersiz Tutunma Enerjisi'}
          </div>
        </div>

        <div style={{ background: '#0F172A', padding: 12, borderRadius: 10, border: '1px solid #334155' }}>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>Reseptör Doluluğu (Afinite)</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: bindingScore.affinityPct > 80 ? '#10B981' : '#38BDF8', marginTop: 2 }}>
            %{bindingScore.affinityPct}
          </div>
          <div style={{ fontSize: 10, color: '#64748B' }}>
            {bindingScore.affinityPct > 80 ? 'Yüksek Seçicilik' : 'Zayıf Bağlanma'}
          </div>
        </div>

        <div style={{ background: '#0F172A', padding: 12, borderRadius: 10, border: '1px solid #334155' }}>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>Sterik Çakışma Sayısı</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: stericClashes === 0 ? '#10B981' : '#EF4444', marginTop: 2 }}>
            {stericClashes} Engel
          </div>
          <div style={{ fontSize: 10, color: '#64748B' }}>
            {stericClashes === 0 ? 'Geometrik Çakışma Yok' : 'Hacimsel İtme (Pauli İlkesi)'}
          </div>
        </div>

        <div style={{ background: '#0F172A', padding: 12, borderRadius: 10, border: '1px solid #334155' }}>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>Kenetlenme Durumu</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: isOptimal ? '#10B981' : stericClashes > 0 ? '#EF4444' : '#38BDF8', marginTop: 4 }}>
            {isOptimal ? 'KİLİTLENDİ (3/3 BAĞ)' : stericClashes > 0 ? 'STERİK ENGEL' : 'HİZALANIYOR'}
          </div>
        </div>
      </div>

      {/* Socratic Academic Feedback */}
      {isOptimal ? (
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
              Optimal Reseptör Kenetlenmesi Sağlandı! (Kilit-Anahtar Uyumlu)
            </div>
            <div style={{ fontSize: 12, color: '#E2E8F0', marginTop: 2, lineHeight: 1.5 }}>
              Protonlanmış amin Asp113 ile Coulomb tuz köprüsü kurdu (-8.5 kcal/mol), katekol hidroksili Ser204 ile H-bağı oluşturdu (-4.2 kcal/mol) ve aromatik halka Phe290 ile π-π istiflendi. ΔG -15.5 kcal/mol ile reseptör aktivasyonu tetiklendi!
            </div>
          </div>
        </div>
      ) : stericClashes > 0 ? (
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
          <WarningOutlined style={{ color: '#EF4444', fontSize: 18, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FCA5A5' }}>
              Sterik Çakışma Engeli! (Repulsiyon Kuvvetleri)
            </div>
            <div style={{ fontSize: 12, color: '#E2E8F0', marginTop: 2, lineHeight: 1.5 }}>
              Ligand reseptör cebine hatalı açıyla zorlandı. van der Waals elektron bulutları çakışarak +15 kcal/mol enerji cezası üretiyor. Rotasyon açısını sıfırlayarak cebin doğal geometrisine uydurun.
            </div>
          </div>
        </div>
      ) : null}

      {/* Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button
          type="primary"
          size="large"
          icon={<AimOutlined />}
          onClick={handleSnapDock}
          disabled={disabled || isOptimal}
          style={{
            height: 44,
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 14,
            background: isOptimal
              ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
              : 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
            border: 'none',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
          }}
        >
          {isOptimal ? '🎯 Tam Kenetlenme Doğrulandı' : '🎯 Cebi Otomatik Hizala & Kilitlen'}
        </Button>
      </div>
    </div>
  );
};
