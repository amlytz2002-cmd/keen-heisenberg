import React, { useMemo } from 'react';
import {
  HeartFilled,
  SafetyCertificateOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import type {
  PatientVitals,
  PatientVitalsStatus,
  LiveGauges,
} from '../../types/medicinalChemistry';

export interface PatientVitalsMonitorProps {
  vitals?: PatientVitals;
  initialVitals?: PatientVitals;
  targetVitals?: Partial<PatientVitals>;
  patientCode?: string;
  patientAgeGender?: string;
  clinicalPresentation?: string;
  failingMoleculeName?: string;
  gauges?: LiveGauges;
  compact?: boolean;
  title?: string;
  instructionHtml?: string;
  preceptorNote?: string;
}

const DEFAULT_VITALS: PatientVitals = {
  heartRateBpm: 120,
  bloodPressureSys: 95,
  bloodPressureDia: 60,
  gastricPh: 1.5,
  liverEnzymeAlt: 35,
  status: 'critical',
  heartRate: 120,
  bloodPressure: '95/60',
  gastricBleedingRiskPercent: 85,
  liverToxicityPercent: 15,
  targetOrganPerfusionPercent: 60,
  overallStabilityScore: 25,
};

const STATUS_CONFIG: Record<
  PatientVitalsStatus,
  { label: string; color: string; bg: string; border: string; glow: string }
> = {
  critical: {
    label: 'KRİTİK ACİL TABLO',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: '#DC2626',
    glow: '0 0 16px rgba(239, 68, 68, 0.4)',
  },
  unstable: {
    label: 'KARARSIZ VİTALLER',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: '#D97706',
    glow: '0 0 16px rgba(245, 158, 11, 0.4)',
  },
  stabilizing: {
    label: 'STABİLİZASYON BAŞLADI',
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: '#0284C7',
    glow: '0 0 16px rgba(56, 189, 248, 0.4)',
  },
  normalized: {
    label: 'NORMAL & STABİL',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: '#059669',
    glow: '0 0 16px rgba(16, 185, 129, 0.4)',
  },
};

export const PatientVitalsMonitor: React.FC<PatientVitalsMonitorProps> = ({
  vitals = DEFAULT_VITALS,
  initialVitals,
  targetVitals,
  patientCode = 'HASTA-ACİL-101',
  patientAgeGender = '58E',
  clinicalPresentation = 'Kritik Hemodinamik Kararsızlık',
  failingMoleculeName,
  gauges,
  compact = false,
  title,
  instructionHtml,
  preceptorNote,
}) => {
  const currentStatus: PatientVitalsStatus = vitals.status || 'critical';
  const statusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.critical;

  // Mean Arterial Pressure calculation: MAP = DBP + 1/3 (SBP - DBP)
  const map = useMemo(() => {
    const sbp = vitals.bloodPressureSys || 120;
    const dbp = vitals.bloodPressureDia || 80;
    return Math.round(dbp + (sbp - dbp) / 3);
  }, [vitals.bloodPressureSys, vitals.bloodPressureDia]);

  // Rhythm classification
  const rhythmType = useMemo(() => {
    if (currentStatus === 'normalized') return 'sinus';
    if (vitals.heartRateBpm > 130) return 'vtach';
    if (vitals.heartRateBpm < 55) return 'bradycardia';
    if (currentStatus === 'stabilizing') return 'transition';
    return 'arrhythmia';
  }, [vitals.heartRateBpm, currentStatus]);

  // EKG Waveform Path generation based on rhythm
  const ekgPath = useMemo(() => {
    if (rhythmType === 'sinus') {
      // Crisp repeating normal P-Q-R-S-T waves across 600px width
      let d = 'M 0 50 ';
      for (let i = 0; i < 4; i++) {
        const x = i * 150;
        d += `L ${x + 20} 50 `;
        // P wave
        d += `Q ${x + 30} 42 ${x + 40} 50 `;
        d += `L ${x + 55} 50 `;
        // Q dip
        d += `L ${x + 60} 55 `;
        // R spike
        d += `L ${x + 68} 10 `;
        // S dip
        d += `L ${x + 76} 75 `;
        d += `L ${x + 82} 50 `;
        // T wave
        d += `Q ${x + 105} 35 ${x + 125} 50 `;
        d += `L ${x + 150} 50 `;
      }
      return d;
    } else if (rhythmType === 'vtach') {
      // Rapid jagged polyphasic ventricular tachycardia wave
      let d = 'M 0 50 ';
      for (let i = 0; i < 8; i++) {
        const x = i * 75;
        d += `L ${x + 10} 50 `;
        d += `L ${x + 20} 82 `;
        d += `L ${x + 38} 8 `;
        d += `L ${x + 55} 80 `;
        d += `L ${x + 75} 50 `;
      }
      return d;
    } else {
      // Irregular stabilizing or arrhythmia rhythm
      let d = 'M 0 50 ';
      for (let i = 0; i < 5; i++) {
        const x = i * 120;
        d += `L ${x + 25} 50 `;
        d += `Q ${x + 35} 44 ${x + 45} 50 `;
        d += `L ${x + 55} 55 `;
        d += `L ${x + 62} 18 `;
        d += `L ${x + 70} 68 `;
        d += `L ${x + 78} 50 `;
        d += `Q ${x + 95} 40 ${x + 110} 50 `;
        d += `L ${x + 120} 50 `;
      }
      return d;
    }
  }, [rhythmType]);

  const ekgStrokeColor = useMemo(() => {
    if (rhythmType === 'sinus') return '#10B981';
    if (rhythmType === 'vtach') return '#EF4444';
    if (rhythmType === 'transition') return '#38BDF8';
    return '#F59E0B';
  }, [rhythmType]);

  return (
    <div
      style={{
        borderRadius: 16,
        background: '#0B0F19',
        border: `1px solid ${statusConfig.border}`,
        padding: compact ? 16 : 22,
        color: '#F8FAFC',
        boxShadow: statusConfig.glow,
        transition: 'all 0.3s ease',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 8,
              background: statusConfig.bg,
              color: statusConfig.color,
              border: `1px solid ${statusConfig.border}`,
              fontSize: 16,
            }}
          >
            <MedicineBoxOutlined />
          </span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC' }}>
              {title || `Hasta Başucu Telemetri Monitörü (ICU HUD)`}
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
              Hasta: <strong style={{ color: '#E2E8F0' }}>{patientCode} ({patientAgeGender})</strong> | {clinicalPresentation}
              {failingMoleculeName && <span> | Tehdit: <strong style={{ color: '#F87171' }}>{failingMoleculeName}</strong></span>}
              {gauges && <span style={{ marginLeft: 6, color: '#38BDF8' }}>(LogP {gauges.logP})</span>}
            </div>
          </div>
        </div>

        {/* Dynamic Status Badge */}
        <div
          style={{
            background: statusConfig.bg,
            border: `1.5px solid ${statusConfig.border}`,
            color: statusConfig.color,
            borderRadius: 10,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: statusConfig.glow,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: statusConfig.color,
            }}
          />
          {statusConfig.label}
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
            borderLeft: `3px solid ${statusConfig.color}`,
          }}
          dangerouslySetInnerHTML={{ __html: instructionHtml }}
        />
      )}

      {/* Bedside Oscilloscope EKG Waveform Arena */}
      <div
        style={{
          background: 'linear-gradient(180deg, #050811 0%, #0D1322 100%)',
          borderRadius: 14,
          border: '1px solid #1E293B',
          padding: 14,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <HeartFilled style={{ color: ekgStrokeColor, fontSize: 14 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#E2E8F0', letterSpacing: '0.05em' }}>
              EKG DERİVASYON II RİTMİ (CANLI)
            </span>
          </div>
          <div style={{ fontSize: 12, color: ekgStrokeColor, fontWeight: 700 }}>
            {rhythmType === 'sinus' && 'Normal Sinüs Ritmi (Stabil)'}
            {rhythmType === 'vtach' && 'Ventriküler Taşikardi (Acil!)'}
            {rhythmType === 'transition' && 'Kardiyak Polarizasyon Dengeleniyor'}
            {rhythmType === 'arrhythmia' && 'Kardiyak Disritmi'}
          </div>
        </div>

        {/* EKG Vector Wave SVG */}
        <div style={{ width: '100%', height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg
            viewBox="0 0 600 100"
            style={{ width: '100%', height: '100%', maxHeight: 110, overflow: 'visible' }}
          >
            <defs>
              <filter id="ekgGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Oscilloscope Background Grid */}
            <g stroke="rgba(30, 41, 59, 0.4)" strokeWidth="0.8">
              <line x1="0" y1="25" x2="600" y2="25" />
              <line x1="0" y1="50" x2="600" y2="50" />
              <line x1="0" y1="75" x2="600" y2="75" />
              <line x1="100" y1="0" x2="100" y2="100" />
              <line x1="200" y1="0" x2="200" y2="100" />
              <line x1="300" y1="0" x2="300" y2="100" />
              <line x1="400" y1="0" x2="400" y2="100" />
              <line x1="500" y1="0" x2="500" y2="100" />
            </g>

            {/* Glowing EKG Trace Path */}
            <path
              d={ekgPath}
              fill="none"
              stroke={ekgStrokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#ekgGlow)"
            />

            {/* Real-time Blinking Cardiac Pulse Dot at head */}
            <circle
              cx="580"
              cy="50"
              r="4.5"
              fill={ekgStrokeColor}
              filter="url(#ekgGlow)"
            />
          </svg>
        </div>
      </div>

      {/* Multi-Organ Bedside Parameter Gauges Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {/* 1. Heart Rate BPM */}
        <div style={{ background: '#1E293B', padding: 14, borderRadius: 12, border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94A3B8' }}>
            <span>Kalp Hızı (HR)</span>
            <span style={{ fontWeight: 700, color: vitals.heartRateBpm > 100 || vitals.heartRateBpm < 60 ? '#EF4444' : '#10B981' }}>
              {vitals.heartRateBpm > 100 ? 'Taşikardi' : vitals.heartRateBpm < 60 ? 'Bradikardi' : 'Normal'}
            </span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: ekgStrokeColor, marginTop: 4 }}>
            {vitals.heartRateBpm} <span style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8' }}>BPM</span>
          </div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
            Hedef: {targetVitals?.heartRateBpm ?? '60-100'} BPM {initialVitals ? `(Başlangıç: ${initialVitals.heartRateBpm})` : ''}
          </div>
        </div>

        {/* 2. Blood Pressure with MAP */}
        <div style={{ background: '#1E293B', padding: 14, borderRadius: 12, border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94A3B8' }}>
            <span>Tansiyon (TA / MAP)</span>
            <span style={{ fontWeight: 700, color: map < 65 ? '#EF4444' : '#10B981' }}>
              MAP {map} mmHg
            </span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#F8FAFC', marginTop: 4 }}>
            {vitals.bloodPressureSys}/{vitals.bloodPressureDia} <span style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8' }}>mmHg</span>
          </div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
            Hedef: {targetVitals?.bloodPressureSys ? `${targetVitals.bloodPressureSys}/${targetVitals.bloodPressureDia}` : '120/80'} mmHg
          </div>
        </div>

        {/* 3. Gastric pH & Bleeding Risk */}
        <div style={{ background: '#1E293B', padding: 14, borderRadius: 12, border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94A3B8' }}>
            <span>Gastrik Mukoza pH</span>
            <span style={{ fontWeight: 700, color: vitals.gastricPh < 2.0 ? '#EF4444' : '#38BDF8' }}>
              {vitals.gastricPh < 2.0 ? 'Erozyon Riski' : 'Korunmuş'}
            </span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: vitals.gastricPh < 2.0 ? '#EF4444' : '#38BDF8', marginTop: 4 }}>
            pH {vitals.gastricPh}
          </div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
            Kanama Riski: %{vitals.gastricBleedingRiskPercent ?? (vitals.gastricPh < 2.0 ? 80 : 10)}
          </div>
        </div>

        {/* 4. Liver Toxicity ALT */}
        <div style={{ background: '#1E293B', padding: 14, borderRadius: 12, border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94A3B8' }}>
            <span>Karaciğer ALT Enzimi</span>
            <span style={{ fontWeight: 700, color: vitals.liverEnzymeAlt > 50 ? '#EF4444' : '#10B981' }}>
              {vitals.liverEnzymeAlt > 50 ? 'Hepatotoksik' : 'Normal'}
            </span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: vitals.liverEnzymeAlt > 50 ? '#EF4444' : '#10B981', marginTop: 4 }}>
            {vitals.liverEnzymeAlt} <span style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8' }}>U/L</span>
          </div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
            Toksisite Oranı: %{vitals.liverToxicityPercent ?? (vitals.liverEnzymeAlt > 50 ? 65 : 8)}
          </div>
        </div>
      </div>

      {/* Preceptor Clinical Bedside Commentary */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
          borderRadius: 12,
          padding: '12px 16px',
          border: '1px solid #334155',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <SafetyCertificateOutlined style={{ color: statusConfig.color, fontSize: 18, marginTop: 2 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>
            Preseptör Klinik Yorumu:
          </div>
          <div style={{ fontSize: 12, color: '#CBD5E1', marginTop: 2, lineHeight: 1.5 }}>
            {preceptorNote ||
              (currentStatus === 'normalized'
                ? 'Moleküler optimizasyon başarılı oldu; kardiyak sodyum/potasyum akımları dengelendi ve hastanın ventriküler ritmi kalıcı olarak sinüs ritmine döndü.'
                : currentStatus === 'stabilizing'
                ? 'İlaç reseptöre tutunmaya başladı ve yarılanma ömrü uzuyor. Vitaller normalleşme trendine girdi.'
                : 'Failing molekül plazmada yetersiz kalıyor veya toksik metabolit üretiyor. Hastanın organ perfüzyonu kritik seviyede!')}
          </div>
        </div>
      </div>
    </div>
  );
};
