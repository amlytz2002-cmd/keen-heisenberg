import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Tag, Modal, Drawer, Tooltip, Progress } from 'antd';
import {
  CloseOutlined,
  ThunderboltFilled,
  BulbOutlined,
  BulbFilled,
  StarFilled,
  ArrowRightOutlined,
  RedoOutlined,
  CheckCircleFilled,
  AlertOutlined,
  SafetyCertificateOutlined,
  FireFilled,
} from '@ant-design/icons';
import type {
  ClinicalRescueMission,
  LiveGauges,
  PatientVitals,
} from '../../types/medicinalChemistry';
import {
  calculateModifiedGauges,
  evaluateVitalsResponse,
  validateMissionSolution,
} from '../../types/medicinalChemistry';
import {
  MEDICINAL_CHEMISTRY_MISSIONS,
  getMissionById,
  getNextMission,
} from '../../data/courses/medicinalChemistryMissions';
import { WidgetRenderer } from '../../components/interactive/WidgetRenderer';
import { PatientVitalsMonitor } from '../../components/interactive/PatientVitalsMonitor';
import { useMicrolearning } from '../../context/MicrolearningContext';
import { useRouter } from '../../context/RouterContext';

export const MissionPlayer: React.FC = () => {
  const { path, params, navigate } = useRouter();
  const { completeMission, updateMissionStepProgress, gamification } = useMicrolearning();

  // Resolve mission from route parameters or path pattern
  const missionId = useMemo(() => {
    if (params.missionId) return params.missionId;
    if (params.lessonId) return params.lessonId;
    if (params.id) return params.id;
    const match = path.match(/^\/learn\/(?:mission|lesson)\/([^/?#]+)/);
    return match ? match[1] : 'mission-1';
  }, [params, path]);

  const mission: ClinicalRescueMission = useMemo(() => {
    const found =
      getMissionById(missionId) ||
      getMissionById(`mission-${missionId}`) ||
      MEDICINAL_CHEMISTRY_MISSIONS.find((m) => `mission-${m.order}` === missionId);
    return found || MEDICINAL_CHEMISTRY_MISSIONS[0];
  }, [missionId]);

  const nextMission = useMemo(() => {
    return getNextMission(mission.id);
  }, [mission.id]);

  // Player state
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<any>(null);
  const [hasChecked, setHasChecked] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [hintStage, setHintStage] = useState<number>(0); // 0 = none, 1 = concept, 2 = mechanism, 3 = direct
  const [isHintDrawerOpen, setIsHintDrawerOpen] = useState<boolean>(false);
  const [mistakesCount, setMistakesCount] = useState<number>(0);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [clinicalFeedback, setClinicalFeedback] = useState<string>('');

  // Reset step states when mission or step changes
  useEffect(() => {
    setUserAnswer(null);
    setHasChecked(false);
    setIsCorrect(false);
    setHintStage(0);
    setFeedbackMessage('');
    setClinicalFeedback('');
  }, [currentStepIndex, mission.id]);

  const totalSteps = mission.steps?.length || 1;
  const safeStepIndex = Math.min(Math.max(0, currentStepIndex), totalSteps - 1);
  const currentStep = mission.steps?.[safeStepIndex] || mission.steps?.[0];

  // Selected tool items resolved from current answer
  const appliedTools = useMemo(() => {
    if (!userAnswer) return [];
    const toolIds: string[] = Array.isArray(userAnswer)
      ? userAnswer
      : typeof userAnswer === 'string'
      ? [userAnswer]
      : typeof userAnswer === 'object' && userAnswer?.id
      ? [userAnswer.id]
      : [];

    return (mission.molecularToolbox || []).filter((t) => toolIds.includes(t.id));
  }, [userAnswer, mission.molecularToolbox]);

  // Dynamic telemetry calculations
  const currentGauges: LiveGauges = useMemo(() => {
    if (appliedTools.length === 0) {
      return mission.initialGauges;
    }
    return calculateModifiedGauges(mission.initialGauges, appliedTools);
  }, [mission.initialGauges, appliedTools]);

  const currentVitals: PatientVitals = useMemo(() => {
    const initVitals = mission.clinicalCrisis.patientInitialVitals;
    return evaluateVitalsResponse(initVitals, currentGauges, mission);
  }, [mission, currentGauges]);

  // Validation logic
  const handleApplyModification = useCallback(() => {
    if (!currentStep) return;

    const selectedIds = appliedTools.map((t) => t.id);
    const validation = validateMissionSolution(mission, selectedIds, mistakesCount);

    if (validation.isSuccess) {
      setIsCorrect(true);
      setHasChecked(true);
      setFeedbackMessage(validation.feedback);
      setClinicalFeedback(validation.clinicalExplanation);

      // Check if this was the last step
      if (safeStepIndex >= totalSteps - 1) {
        const calculatedStars = mistakesCount === 0 ? 3 : mistakesCount <= 2 ? 2 : 1;
        completeMission(mission.id, calculatedStars, mission.xpReward);
        setIsVictoryModalOpen(true);
      }
    } else {
      setIsCorrect(false);
      setHasChecked(true);
      setMistakesCount((prev) => prev + 1);
      setFeedbackMessage(validation.feedback);
      setClinicalFeedback(validation.clinicalExplanation);
    }
  }, [currentStep, appliedTools, mission, mistakesCount, safeStepIndex, totalSteps, completeMission]);

  // Reset action
  const handleReset = useCallback(() => {
    setUserAnswer(null);
    setHasChecked(false);
    setIsCorrect(false);
    setFeedbackMessage('');
    setClinicalFeedback('');
  }, []);

  // Socratic Hint Progression: Stage 1 -> Stage 2 -> Stage 3
  const handleRequestHint = useCallback(() => {
    setHintStage((prev) => {
      const nextStage = Math.min(prev + 1, 3);
      return nextStage;
    });
    setIsHintDrawerOpen(true);
  }, []);

  // Advance to next step
  const handleNextStep = useCallback(async () => {
    await updateMissionStepProgress(mission.id, safeStepIndex + 1);

    if (safeStepIndex < totalSteps - 1) {
      setCurrentStepIndex(safeStepIndex + 1);
    } else {
      const calculatedStars = mistakesCount === 0 ? 3 : mistakesCount <= 2 ? 2 : 1;
      await completeMission(mission.id, calculatedStars, mission.xpReward);
      setIsVictoryModalOpen(true);
    }
  }, [safeStepIndex, totalSteps, mission.id, mistakesCount, completeMission, updateMissionStepProgress]);

  // Calculated stars for debrief
  const starsEarned = useMemo(() => {
    if (mistakesCount === 0) return 3;
    if (mistakesCount <= 2) return 2;
    return 1;
  }, [mistakesCount]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        height: '100vh',
        backgroundColor: '#0B0F19',
        color: '#F8FAFC',
        overflow: 'hidden',
        fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`,
      }}
    >
      {/* ==================================================================== */}
      {/* 1. CLINICAL COCKPIT HEADER                                            */}
      {/* ==================================================================== */}
      <header
        style={{
          height: 64,
          backgroundColor: '#0F172A',
          borderBottom: '1px solid #1E293B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          zIndex: 100,
          flexShrink: 0,
        }}
      >
        {/* Left: Exit & Mission Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Button
            type="text"
            icon={<CloseOutlined style={{ fontSize: 16, color: '#94A3B8' }} />}
            onClick={() => navigate('/learn')}
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1E293B',
            }}
          />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag
                color="red"
                style={{
                  fontWeight: 700,
                  fontSize: 11,
                  padding: '1px 8px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#F87171',
                }}
              >
                ACİL VAKA: {mission.clinicalCrisis.patientCode || `HASTA-${mission.order}`}
              </Tag>
              <Tag
                style={{
                  fontWeight: 600,
                  fontSize: 11,
                  padding: '1px 8px',
                  borderRadius: 6,
                  border: '1px solid #334155',
                  backgroundColor: '#1E293B',
                  color: '#94A3B8',
                }}
              >
                {mission.moduleTitle}
              </Tag>
            </div>
            <h1
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#F8FAFC',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Görev {mission.order}: {mission.title}
            </h1>
          </div>
        </div>

        {/* Center: Mission Progress Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 220 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
              Kurtarma Adımı {safeStepIndex + 1} / {totalSteps}
            </span>
            <span style={{ fontSize: 11, color: '#38BDF8', fontWeight: 700 }}>
              {Math.round(((safeStepIndex + 1) / totalSteps) * 100)}%
            </span>
          </div>
          <Progress
            percent={Math.round(((safeStepIndex + 1) / totalSteps) * 100)}
            showInfo={false}
            strokeColor="#0284C7"
            trailColor="#1E293B"
            size={['100%', 6]}
          />
        </div>

        {/* Right: Gamification HUD & Socratic Hint Launcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#1E293B',
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid #334155',
            }}
          >
            <span style={{ color: '#FB923C', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
              <FireFilled /> {gamification.streak} Gün
            </span>
            <span style={{ width: 1, height: 14, backgroundColor: '#334155' }} />
            <span style={{ color: '#38BDF8', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
              <ThunderboltFilled style={{ color: '#F59E0B' }} /> {gamification.xp} XP
            </span>
          </div>

          <Button
            type="primary"
            icon={hintStage > 0 ? <BulbFilled style={{ color: '#FBBF24' }} /> : <BulbOutlined />}
            onClick={handleRequestHint}
            style={{
              backgroundColor: hintStage > 0 ? 'rgba(245, 158, 11, 0.2)' : '#1E293B',
              borderColor: hintStage > 0 ? '#F59E0B' : '#334155',
              color: hintStage > 0 ? '#FBBF24' : '#E2E8F0',
              fontWeight: 600,
              fontSize: 13,
              borderRadius: 8,
              height: 38,
            }}
          >
            Sokratik İpucu {hintStage > 0 ? `(${hintStage}/3)` : ''}
          </Button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. SPLIT SCREEN COCKPIT WORKSPACE                                    */}
      {/* ==================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '420px 1fr',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* ------------------------------------------------------------------ */}
        {/* LEFT PANEL: BEDSIDE CLINICAL HUD & VITALS MONITOR                  */}
        {/* ------------------------------------------------------------------ */}
        <aside
          style={{
            backgroundColor: '#0F172A',
            borderRight: '1px solid #1E293B',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: 16,
            gap: 16,
          }}
        >
          {/* Patient Vignette Card */}
          <div
            style={{
              backgroundColor: '#1E293B',
              borderRadius: 12,
              padding: 14,
              border: '1px solid #334155',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    color: '#EF4444',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {mission.clinicalCrisis.patientCode || 'HASTA-ACİL'} ({mission.clinicalCrisis.patientAgeGender || '54K'})
                </span>
                <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>Acil Servis Yatağı</span>
              </div>
              <Tooltip title="Fakülte Ders Slaytı Referansı">
                <span style={{ fontSize: 11, color: '#64748B' }}>
                  {mission.facultySlideReference || 'Slayt Ref'}
                </span>
              </Tooltip>
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', marginBottom: 6 }}>
              {mission.clinicalCrisis.presentation}
            </div>

            <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.5, margin: '0 0 10px 0' }}>
              {mission.clinicalCrisis.vignette}
            </p>

            <div
              style={{
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                borderLeft: '3px solid #DC2626',
                padding: '6px 10px',
                borderRadius: '0 6px 6px 0',
                fontSize: 11.5,
                color: '#FCA5A5',
                lineHeight: 1.4,
              }}
            >
              <strong>Biyokimyasal Kusur:</strong> {mission.clinicalCrisis.biochemicalFlaw}
            </div>
          </div>

          {/* Failing Molecule Profile Card */}
          <div
            style={{
              backgroundColor: '#1E293B',
              borderRadius: 12,
              padding: 14,
              border: '1px solid #334155',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                Kurtarılacak Molekül
              </span>
              <Tag color="cyan" style={{ fontSize: 11, borderRadius: 4, margin: 0 }}>
                Hedef: {mission.targetTargetName}
              </Tag>
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#38BDF8', marginBottom: 4 }}>
              {mission.failingMoleculeName}
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>
              Konsept: <strong>{mission.conceptTag || mission.subtitle}</strong>
            </div>
          </div>

          {/* Bedside Live Patient Vitals Monitor */}
          <div style={{ flex: 1 }}>
            <PatientVitalsMonitor
              vitals={currentVitals}
              initialVitals={mission.clinicalCrisis.patientInitialVitals}
              patientCode={mission.clinicalCrisis.patientCode}
              patientAgeGender={mission.clinicalCrisis.patientAgeGender}
              clinicalPresentation={mission.clinicalCrisis.presentation}
              failingMoleculeName={mission.failingMoleculeName}
              gauges={currentGauges}
            />
          </div>
        </aside>

        {/* ------------------------------------------------------------------ */}
        {/* RIGHT PANEL: INTERACTIVE SANDBOX & TELEMETRY WORKSPACE             */}
        {/* ------------------------------------------------------------------ */}
        <main
          style={{
            backgroundColor: '#0B0F19',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: 20,
            gap: 16,
          }}
        >
          {/* Step Header & Mission Objective */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: 14,
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    backgroundColor: '#0284C7',
                    color: '#FFFFFF',
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {safeStepIndex + 1}
                </span>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                  {currentStep.title || currentStep.prompt || 'Moleküler Tasarım & Kurtarma'}
                </h2>
              </div>
              <Tag color="blue" style={{ fontSize: 11, fontWeight: 600, borderRadius: 6, margin: 0 }}>
                {mission.subtitle}
              </Tag>
            </div>

            {currentStep.instructionHtml && (
              <div
                style={{ fontSize: 13.5, color: '#CBD5E1', lineHeight: 1.5 }}
                dangerouslySetInnerHTML={{ __html: currentStep.instructionHtml }}
              />
            )}
          </div>

          {/* Interactive Molecular Sandbox Stage */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: 14,
              padding: 18,
              minHeight: 280,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <WidgetRenderer
              step={currentStep}
              currentAnswer={userAnswer}
              onAnswerChange={(ans) => {
                setUserAnswer(ans);
                setHasChecked(false);
              }}
              disabled={hasChecked && isCorrect}
              mission={mission}
              gauges={currentGauges}
              vitals={currentVitals}
              onSimulationComplete={(success) => {
                if (success) {
                  setUserAnswer(currentStep.optimalToolId || 'shielded');
                  setIsCorrect(true);
                  setHasChecked(true);
                  setFeedbackMessage('Enzimatik zırh başarılı! Parçalanma engellendi.');
                  setClinicalFeedback(
                    currentStep.simulationFeedback?.successExplanation ||
                      mission.victoryTrigger.ahaExplanation
                  );
                }
              }}
            />
          </div>

          {/* LiveGauges Telemetry Readouts */}
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                📊 Canlı Farmakokinetik & Termodinamik Telemetri
              </span>
              <span style={{ fontSize: 11, color: '#64748B' }}>
                Fizyolojik pH: 7.4 | Hedef Reseptör: {mission.targetTargetName}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: 12,
              }}
            >
              {/* LogP */}
              <div
                style={{
                  backgroundColor: '#1E293B',
                  borderRadius: 10,
                  padding: 12,
                  border: '1px solid #334155',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>
                  <span>LogP (Lipofiliklik)</span>
                  <span style={{ color: '#38BDF8', fontWeight: 700 }}>
                    Hedef: {mission.optimalGauges.logP ?? '1.5 - 2.5'}
                  </span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#F8FAFC', marginBottom: 6 }}>
                  {currentGauges.logP.toFixed(2)}
                </div>
                <Progress
                  percent={Math.min(100, Math.max(5, (currentGauges.logP / 5) * 100))}
                  showInfo={false}
                  strokeColor={
                    Math.abs(currentGauges.logP - (mission.optimalGauges.logP ?? 2.0)) < 0.5
                      ? '#10B981'
                      : '#F59E0B'
                  }
                  trailColor="#0B0F19"
                  size={['100%', 5]}
                />
              </div>

              {/* % Ionized */}
              <div
                style={{
                  backgroundColor: '#1E293B',
                  borderRadius: 10,
                  padding: 12,
                  border: '1px solid #334155',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>
                  <span>% İyonlaşma (pH 7.4)</span>
                  <span style={{ color: '#38BDF8', fontWeight: 700 }}>Henderson-H.</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#F8FAFC', marginBottom: 6 }}>
                  %{currentGauges.percentIonized.toFixed(1)}
                </div>
                <Progress
                  percent={currentGauges.percentIonized}
                  showInfo={false}
                  strokeColor="#0284C7"
                  trailColor="#0B0F19"
                  size={['100%', 5]}
                />
              </div>

              {/* t1/2 Half-Life */}
              <div
                style={{
                  backgroundColor: '#1E293B',
                  borderRadius: 10,
                  padding: 12,
                  border: '1px solid #334155',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>
                  <span>t₁/₂ Yarılanma Ömrü</span>
                  <span style={{ color: '#38BDF8', fontWeight: 700 }}>
                    Hedef: {mission.optimalGauges.metabolicHalfLifeMinutes ? `${mission.optimalGauges.metabolicHalfLifeMinutes} dk` : 'Stabil'}
                  </span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#F8FAFC', marginBottom: 6 }}>
                  {currentGauges.metabolicHalfLifeMinutes >= 60
                    ? `${(currentGauges.metabolicHalfLifeMinutes / 60).toFixed(1)} saat`
                    : `${currentGauges.metabolicHalfLifeMinutes.toFixed(1)} dk`}
                </div>
                <Progress
                  percent={Math.min(100, Math.max(5, (currentGauges.metabolicHalfLifeMinutes / 240) * 100))}
                  showInfo={false}
                  strokeColor={currentGauges.metabolicHalfLifeMinutes >= 30 ? '#10B981' : '#EF4444'}
                  trailColor="#0B0F19"
                  size={['100%', 5]}
                />
              </div>

              {/* Delta G Receptor Affinity */}
              <div
                style={{
                  backgroundColor: '#1E293B',
                  borderRadius: 10,
                  padding: 12,
                  border: '1px solid #334155',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>
                  <span>Reseptör Afinitesi ΔG</span>
                  <span style={{ color: '#38BDF8', fontWeight: 700 }}>
                    Hedef: {mission.optimalGauges.receptorAffinityDeltaG ?? -8.0} kcal
                  </span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#F8FAFC', marginBottom: 6 }}>
                  {currentGauges.receptorAffinityDeltaG.toFixed(2)} kcal
                </div>
                <Progress
                  percent={Math.min(100, Math.max(10, (Math.abs(currentGauges.receptorAffinityDeltaG) / 12) * 100))}
                  showInfo={false}
                  strokeColor={currentGauges.receptorAffinityDeltaG <= -6.0 ? '#10B981' : '#F59E0B'}
                  trailColor="#0B0F19"
                  size={['100%', 5]}
                />
              </div>

              {/* Blood-Brain Barrier Penetration */}
              <div
                style={{
                  backgroundColor: '#1E293B',
                  borderRadius: 10,
                  padding: 12,
                  border: '1px solid #334155',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>
                  <span>KBB Geçirgenliği</span>
                  <span style={{ color: '#38BDF8', fontWeight: 700 }}>Santral / Perifer</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#F8FAFC', marginBottom: 6 }}>
                  %{currentGauges.bloodBrainBarrierPenetration ?? 25}
                </div>
                <Progress
                  percent={currentGauges.bloodBrainBarrierPenetration ?? 25}
                  showInfo={false}
                  strokeColor="#8B5CF6"
                  trailColor="#0B0F19"
                  size={['100%', 5]}
                />
              </div>
            </div>
          </div>

          {/* Feedback Alert Card (if checked) */}
          {hasChecked && (
            <div
              style={{
                backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1.5px solid ${isCorrect ? '#10B981' : '#EF4444'}`,
                borderRadius: 12,
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                boxShadow: isCorrect ? '0 0 16px rgba(16, 185, 129, 0.2)' : '0 0 16px rgba(239, 68, 68, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isCorrect ? (
                  <CheckCircleFilled style={{ fontSize: 20, color: '#10B981' }} />
                ) : (
                  <AlertOutlined style={{ fontSize: 20, color: '#EF4444' }} />
                )}
                <span style={{ fontSize: 15, fontWeight: 800, color: isCorrect ? '#10B981' : '#EF4444' }}>
                  {feedbackMessage}
                </span>
              </div>
              {clinicalFeedback && (
                <p style={{ fontSize: 13, color: '#CBD5E1', margin: 0, paddingLeft: 30, lineHeight: 1.5 }}>
                  {clinicalFeedback}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              borderRadius: 14,
              padding: '14px 18px',
              marginTop: 'auto',
            }}
          >
            <div style={{ display: 'flex', gap: 10 }}>
              <Button
                icon={<RedoOutlined />}
                onClick={handleReset}
                disabled={!userAnswer}
                style={{
                  backgroundColor: '#1E293B',
                  borderColor: '#334155',
                  color: '#CBD5E1',
                  borderRadius: 8,
                  fontWeight: 600,
                  height: 42,
                }}
              >
                Sıfırla
              </Button>

              <Button
                icon={<BulbOutlined />}
                onClick={handleRequestHint}
                style={{
                  backgroundColor: '#1E293B',
                  borderColor: '#334155',
                  color: '#FBBF24',
                  borderRadius: 8,
                  fontWeight: 600,
                  height: 42,
                }}
              >
                Sokratik İpucu İste {hintStage > 0 ? `(${hintStage}/3)` : ''}
              </Button>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              {hasChecked && isCorrect ? (
                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  onClick={safeStepIndex < totalSteps - 1 ? handleNextStep : () => setIsVictoryModalOpen(true)}
                  style={{
                    backgroundColor: '#10B981',
                    borderColor: '#059669',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 14,
                    height: 42,
                    padding: '0 24px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  {safeStepIndex < totalSteps - 1 ? 'Sonraki Adıma Geç' : 'Zafer Raporunu İncele'}
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<ThunderboltFilled />}
                  onClick={handleApplyModification}
                  disabled={!userAnswer}
                  style={{
                    backgroundColor: '#0284C7',
                    borderColor: '#0369A1',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 14,
                    height: 42,
                    padding: '0 24px',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                  }}
                >
                  Modifikasyonu Uygula
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ==================================================================== */}
      {/* 3. 3-STAGE SOCRATIC PRECEPTOR DRAWER                                 */}
      {/* ==================================================================== */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#F8FAFC' }}>
            <BulbFilled style={{ color: '#F59E0B', fontSize: 18 }} />
            <span>Sokratik Klinik Preseptör Rehberliği</span>
          </div>
        }
        placement="bottom"
        onClose={() => setIsHintDrawerOpen(false)}
        open={isHintDrawerOpen}
        height={320}
        styles={{
          body: { backgroundColor: '#0F172A', color: '#F8FAFC', padding: 20 },
          header: { backgroundColor: '#1E293B', borderBottom: '1px solid #334155' },
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Stage 1 */}
          <div
            style={{
              backgroundColor: hintStage >= 1 ? '#1E293B' : 'rgba(30, 41, 59, 0.4)',
              border: hintStage >= 1 ? '1.5px solid #0284C7' : '1px dashed #334155',
              borderRadius: 10,
              padding: 12,
              opacity: hintStage >= 1 ? 1 : 0.5,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: hintStage >= 1 ? '#38BDF8' : '#64748B' }}>
                AŞAMA 1: SOKRATİK DÜŞÜNDÜRME (Kavramsal Odak)
              </span>
              <Tag color="cyan" style={{ fontSize: 10, borderRadius: 4 }}>
                0 XP Kesintisi
              </Tag>
            </div>
            <p style={{ fontSize: 13, color: hintStage >= 1 ? '#E2E8F0' : '#64748B', margin: 0, lineHeight: 1.4 }}>
              {hintStage >= 1
                ? mission.socraticHintChain[0]
                : 'Birinci aşama ipucunu açmak için "Sokratik İpucu İste" butonuna tıklayın.'}
            </p>
          </div>

          {/* Stage 2 */}
          <div
            style={{
              backgroundColor: hintStage >= 2 ? '#1E293B' : 'rgba(30, 41, 59, 0.4)',
              border: hintStage >= 2 ? '1.5px solid #F59E0B' : '1px dashed #334155',
              borderRadius: 10,
              padding: 12,
              opacity: hintStage >= 2 ? 1 : 0.5,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: hintStage >= 2 ? '#FBBF24' : '#64748B' }}>
                AŞAMA 2: MEKANİSTİK İPUCU (Kimyasal Prensip)
              </span>
              <Tag color="gold" style={{ fontSize: 10, borderRadius: 4 }}>
                -5 XP
              </Tag>
            </div>
            <p style={{ fontSize: 13, color: hintStage >= 2 ? '#E2E8F0' : '#64748B', margin: 0, lineHeight: 1.4 }}>
              {hintStage >= 2
                ? mission.socraticHintChain[1]
                : 'Mekanistik bağ/yapı ipucunu görmek için preseptörden 2. aşamayı talep edin.'}
            </p>
          </div>

          {/* Stage 3 */}
          <div
            style={{
              backgroundColor: hintStage >= 3 ? '#1E293B' : 'rgba(30, 41, 59, 0.4)',
              border: hintStage >= 3 ? '1.5px solid #10B981' : '1px dashed #334155',
              borderRadius: 10,
              padding: 12,
              opacity: hintStage >= 3 ? 1 : 0.5,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: hintStage >= 3 ? '#34D399' : '#64748B' }}>
                AŞAMA 3: DOĞRUDAN YAPISAL MÜDAHALE (Klinik Çözüm)
              </span>
              <Tag color="green" style={{ fontSize: 10, borderRadius: 4 }}>
                -10 XP
              </Tag>
            </div>
            <p style={{ fontSize: 13, color: hintStage >= 3 ? '#E2E8F0' : '#64748B', margin: 0, lineHeight: 1.4 }}>
              {hintStage >= 3
                ? mission.socraticHintChain[2]
                : 'Doğrudan farmakofor çözüm kılavuzu için 3. aşamayı etkinleştirin.'}
            </p>
          </div>

          {hintStage < 3 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="primary"
                size="small"
                onClick={handleRequestHint}
                style={{ backgroundColor: '#0284C7', borderRadius: 6, fontWeight: 600 }}
              >
                Sonraki İpucu Aşamasını Aç ({hintStage + 1}/3)
              </Button>
            </div>
          )}
        </div>
      </Drawer>

      {/* ==================================================================== */}
      {/* 4. VICTORY DEBRIEF CELEBRATION MODAL                                  */}
      {/* ==================================================================== */}
      <Modal
        open={isVictoryModalOpen}
        onCancel={() => setIsVictoryModalOpen(false)}
        footer={null}
        centered
        width={580}
        styles={{
          content: {
            backgroundColor: '#0F172A',
            border: '1px solid #334155',
            borderRadius: 20,
            padding: 32,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          },
        }}
      >
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Animated 3 Stars Badge */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            {[1, 2, 3].map((starIdx) => (
              <StarFilled
                key={starIdx}
                style={{
                  fontSize: 44,
                  color: starIdx <= starsEarned ? '#F59E0B' : '#334155',
                  filter: starIdx <= starsEarned ? 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.6))' : 'none',
                  transform: 'scale(1.1)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>

          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#F8FAFC', margin: '0 0 6px 0' }}>
              KLİNİK KURTARMA BAŞARILI! 🎉
            </h2>
            <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>
              Görev {mission.order}: <strong>{mission.title}</strong>
            </p>
          </div>

          {/* Gamification Reward Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            <div
              style={{
                backgroundColor: '#1E293B',
                borderRadius: 14,
                padding: '14px 16px',
                border: '1px solid #334155',
              }}
            >
              <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 2 }}>Kazanılan Deneyim</div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: '#38BDF8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <ThunderboltFilled style={{ color: '#F59E0B' }} /> +{mission.xpReward} XP
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#1E293B',
                borderRadius: 14,
                padding: '14px 16px',
                border: '1px solid #334155',
              }}
            >
              <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 2 }}>Günlük Seri</div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: '#FB923C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <FireFilled /> {gamification.streak} Gün
              </div>
            </div>
          </div>

          {/* Socratic "Aha!" Moment Card */}
          <div
            style={{
              backgroundColor: 'rgba(2, 132, 199, 0.1)',
              border: '1.5px solid #0284C7',
              borderRadius: 14,
              padding: 14,
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <BulbFilled style={{ color: '#38BDF8', fontSize: 16 }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: '#38BDF8' }}>
                Sokratik "Aha!" Keşfi
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#E2E8F0', margin: 0, lineHeight: 1.45 }}>
              {mission.victoryTrigger.ahaExplanation}
            </p>
          </div>

          {/* Clinical Pearl Card */}
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1.5px solid #10B981',
              borderRadius: 14,
              padding: 14,
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <SafetyCertificateOutlined style={{ color: '#34D399', fontSize: 16 }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: '#34D399' }}>
                Klinik İnci (Preseptör Notu)
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#E2E8F0', margin: 0, lineHeight: 1.45 }}>
              {mission.victoryTrigger.pearl}
            </p>
          </div>

          {/* Navigation Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
            {nextMission ? (
              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={() => {
                  setIsVictoryModalOpen(false);
                  navigate(`/learn/mission/${nextMission.id}`);
                }}
                style={{
                  backgroundColor: '#0284C7',
                  borderColor: '#0369A1',
                  borderRadius: 10,
                  fontWeight: 700,
                  height: 46,
                  fontSize: 15,
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                }}
              >
                Sonraki Göreve Geç ({nextMission.order}. {nextMission.title})
              </Button>
            ) : null}

            <Button
              size="large"
              onClick={() => {
                setIsVictoryModalOpen(false);
                navigate('/learn');
              }}
              style={{
                backgroundColor: '#1E293B',
                borderColor: '#334155',
                color: '#F8FAFC',
                borderRadius: 10,
                fontWeight: 600,
                height: 44,
              }}
            >
              Müfredat Haritasına Dön
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
