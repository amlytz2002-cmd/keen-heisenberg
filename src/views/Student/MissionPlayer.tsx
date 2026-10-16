import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Zap,
  Lightbulb,
  Star,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Flame,
  ChevronDown,
  ChevronUp,
  Activity,
} from 'lucide-react';
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
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Sheet } from '../../components/ui/sheet';

export const MissionPlayer: React.FC = () => {
  const { path, params, navigate } = useRouter();
  const { completeMission, gamification } = useMicrolearning();

  // Mobile vitals expansion toggle
  const [mobileVitalsExpanded, setMobileVitalsExpanded] = useState<boolean>(false);

  // Resolve mission from route parameters or path pattern with alias support
  const missionId = useMemo(() => {
    if (params.missionId) return params.missionId;
    if (params.lessonId) return params.lessonId;
    if (params.id) return params.id;
    const match = path.match(/^\/learn\/(?:mission|lesson)\/([^/?#]+)/);
    return match ? match[1] : 'mission-1';
  }, [params, path]);

  const mission: ClinicalRescueMission = useMemo(() => {
    const found = getMissionById(missionId);
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

  // Reset mission state when mission changes (state isolation)
  useEffect(() => {
    setCurrentStepIndex(0);
    setMistakesCount(0);
    setIsVictoryModalOpen(false);
  }, [mission.id]);

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

  const handleNextStep = useCallback(() => {
    if (safeStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [safeStepIndex, totalSteps]);

  const handleReset = useCallback(() => {
    setUserAnswer(null);
    setHasChecked(false);
    setIsCorrect(false);
    setFeedbackMessage('');
    setClinicalFeedback('');
  }, []);

  const handleRequestHint = useCallback(() => {
    setHintStage((prev) => Math.min(3, prev + 1));
    setIsHintDrawerOpen(true);
  }, []);

  const starsEarned = mistakesCount === 0 ? 3 : mistakesCount <= 2 ? 2 : 1;

  // Real progress percentage (not 100% on start!)
  const progressPercent = Math.round(
    ((safeStepIndex + (isCorrect ? 1 : 0)) / totalSteps) * 100
  );

  return (
    <div className="flex flex-col min-h-screen lg:h-screen lg:overflow-hidden bg-[#060B14] text-slate-100">
      {/* 1. TOP COCKPIT HEADER BAR */}
      <header className="flex-shrink-0 h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30">
        {/* Left: Exit & Mission Title */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={() => navigate('/learn')}
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            title="Müfredat Haritasına Dön"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="cyan" className="text-[10px] py-0">
                {mission.moduleTitle}
              </Badge>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                {mission.conceptTag}
              </span>
            </div>
            <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md mt-0.5">
              Görev {mission.order}: {mission.title}
            </h1>
          </div>
        </div>

        {/* Center: Mission Progress Bar */}
        <div className="hidden md:flex flex-col items-center w-52">
          <div className="flex justify-between w-full text-[11px] mb-1">
            <span className="text-slate-400 font-semibold">
              Kurtarma Adımı {safeStepIndex + 1} / {totalSteps}
            </span>
            <span className="text-sky-400 font-bold font-mono">
              %{progressPercent}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Right: Gamification HUD & Socratic Hint Launcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <Flame className="h-3.5 w-3.5" /> {gamification.streak} Gün
            </span>
            <span className="w-px h-3 bg-slate-800" />
            <span className="text-sky-400 font-bold flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-sky-400" /> {gamification.xp} XP
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleRequestHint}
            className={`text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/10 ${
              hintStage > 0 ? 'bg-amber-500/15 border-amber-500 text-amber-300' : ''
            }`}
          >
            <Lightbulb className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
            <span>Sokratik İpucu {hintStage > 0 ? `(${hintStage}/3)` : ''}</span>
          </Button>
        </div>
      </header>

      {/* Mobile Sticky Vitals Summary Strip */}
      <div className="lg:hidden flex-shrink-0 sticky top-16 z-20 bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="font-mono text-slate-300 truncate">
            {mission.clinicalCrisis.patientCode} ({mission.clinicalCrisis.patientAgeGender})
          </span>
          <span className="text-slate-500 hidden sm:inline truncate">
            • {mission.clinicalCrisis.presentation}
          </span>
        </div>
        <button
          onClick={() => setMobileVitalsExpanded((prev) => !prev)}
          className="flex items-center gap-1 text-sky-400 font-semibold text-xs ml-2 shrink-0 hover:underline"
        >
          <span>{mobileVitalsExpanded ? 'Vakayı Kapat' : 'Hasta Takibi'}</span>
          {mobileVitalsExpanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* 2. SPLIT SCREEN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* LEFT PANEL: PATIENT VITALS & CLINICAL CRISIS (Desktop sticky / Mobile collapsible) */}
        <aside
          className={`lg:flex flex-col bg-slate-950 border-r border-slate-800 p-4 space-y-4 overflow-y-auto ${
            mobileVitalsExpanded ? 'block' : 'hidden'
          }`}
        >
          {/* Clinical Vignette & Biochemical Flaw */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <Badge variant="destructive" className="font-mono text-[10px]">
                ACİL KRİZ DURUMU
              </Badge>
              <span className="text-[11px] text-slate-500">
                {mission.facultySlideReference || 'Ders Notu Ref'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {mission.clinicalCrisis.vignette}
            </p>

            <div className="rounded-lg bg-rose-950/40 border border-rose-500/30 p-2.5 text-[11px] text-rose-200 leading-relaxed">
              <strong className="text-rose-300">Biyokimyasal Kusur: </strong>
              {mission.clinicalCrisis.biochemicalFlaw}
            </div>
          </div>

          {/* Bedside Live Patient Vitals Monitor */}
          <div className="flex-1">
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

        {/* RIGHT PANEL: INTERACTIVE SIMULATOR & TELEMETRY WORKSPACE */}
        <main className="flex flex-col overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#080D1A] min-h-0 flex-1">
          {/* Step Header & Mission Objective */}
          <div className="flex-shrink-0 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center h-7 w-7 rounded-full bg-sky-500 text-white font-extrabold text-xs shadow-md shadow-sky-500/25">
                  {safeStepIndex + 1}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {currentStep.title || currentStep.prompt || 'Moleküler Tasarım & Kurtarma'}
                </h2>
              </div>
              <Badge variant="cyan" className="text-xs font-semibold">
                {mission.subtitle}
              </Badge>
            </div>

            {currentStep.instructionHtml && (
              <div
                className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1"
                dangerouslySetInnerHTML={{ __html: currentStep.instructionHtml }}
              />
            )}
          </div>

          {/* Interactive Molecular Sandbox Stage (NO crushed flexbox!) */}
          <div className="flex-shrink-0 w-full rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 shadow-xl">
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

          {/* Live Pharmacokinetic & Thermodynamic Telemetry HUD */}
          <div className="flex-shrink-0 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-3">
            <div className="flex flex-wrap items-center justify-between text-xs pb-2 border-b border-slate-800/80 gap-2">
              <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-sky-400" />
                Canlı Farmakokinetik & Termodinamik Telemetri
              </span>
              <span className="text-[11px] text-slate-500">
                Fizyolojik pH: 7.4 | Hedef: {mission.targetTargetName}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* LogP */}
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>LogP</span>
                  <span className="text-sky-400 font-mono font-bold">
                    {mission.optimalGauges.logP ?? '1.5-2.5'}
                  </span>
                </div>
                <div className="text-lg font-black font-mono text-white">
                  {currentGauges.logP.toFixed(2)}
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      Math.abs(currentGauges.logP - (mission.optimalGauges.logP ?? 2.0)) < 0.5
                        ? 'bg-emerald-400'
                        : 'bg-amber-400'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(10, (currentGauges.logP / 5) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* % Ionized */}
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>% İyonlaşma</span>
                  <span className="text-sky-400 font-mono font-bold">pH 7.4</span>
                </div>
                <div className="text-lg font-black font-mono text-white">
                  %{currentGauges.percentIonized.toFixed(1)}
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{ width: `${currentGauges.percentIonized}%` }}
                  />
                </div>
              </div>

              {/* t1/2 */}
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Yarı Ömür t½</span>
                  <span className="text-sky-400 font-mono font-bold">Stabil</span>
                </div>
                <div className="text-lg font-black font-mono text-white">
                  {currentGauges.metabolicHalfLifeMinutes >= 60
                    ? `${(currentGauges.metabolicHalfLifeMinutes / 60).toFixed(1)} sa`
                    : `${currentGauges.metabolicHalfLifeMinutes.toFixed(1)} dk`}
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      currentGauges.metabolicHalfLifeMinutes >= 30
                        ? 'bg-emerald-400'
                        : 'bg-rose-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(5, (currentGauges.metabolicHalfLifeMinutes / 240) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Delta G */}
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Afinitesi ΔG</span>
                  <span className="text-amber-400 font-mono font-bold">
                    {mission.optimalGauges.receptorAffinityDeltaG ?? -8.0} kcal
                  </span>
                </div>
                <div className="text-lg font-black font-mono text-white">
                  {currentGauges.receptorAffinityDeltaG.toFixed(2)} kcal
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      currentGauges.receptorAffinityDeltaG <= -6.0
                        ? 'bg-emerald-400'
                        : 'bg-amber-400'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(10, (Math.abs(currentGauges.receptorAffinityDeltaG) / 12) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* BBB Penetration */}
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>KBB Bariyeri</span>
                  <span className="text-purple-400 font-mono font-bold">Perifer</span>
                </div>
                <div className="text-lg font-black font-mono text-white">
                  %{currentGauges.bloodBrainBarrierPenetration ?? 25}
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${currentGauges.bloodBrainBarrierPenetration ?? 25}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Alert Card (if checked) */}
          {hasChecked && (
            <div
              className={`flex-shrink-0 rounded-2xl border p-4 sm:p-5 flex items-start gap-3 transition-all ${
                isCorrect
                  ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
                  : 'border-rose-500/40 bg-rose-950/40 text-rose-200'
              }`}
            >
              {isCorrect ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-6 w-6 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <h4 className="font-bold text-sm sm:text-base text-white">{feedbackMessage}</h4>
                {clinicalFeedback && (
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {clinicalFeedback}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons Toolbar */}
          <div className="flex-shrink-0 sticky bottom-0 z-20 py-3 mt-auto bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl px-4 sm:px-6 flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!userAnswer}
                className="text-xs border-slate-700 text-slate-300"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Sıfırla
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestHint}
                className="text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
              >
                <Lightbulb className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                İpucu İste
              </Button>
            </div>

            <div>
              {hasChecked && isCorrect ? (
                <Button
                  size="default"
                  onClick={
                    safeStepIndex < totalSteps - 1
                      ? handleNextStep
                      : () => setIsVictoryModalOpen(true)
                  }
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 px-6"
                >
                  <span>{safeStepIndex < totalSteps - 1 ? 'Sonraki Adıma Geç' : 'Zafer Raporunu Gör'}</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  size="default"
                  onClick={handleApplyModification}
                  disabled={!userAnswer}
                  className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-500/25 px-6"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Modifikasyonu Uygula
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* 3. 3-STAGE SOCRATIC PRECEPTOR DRAWER (SHEET) */}
      <Sheet
        open={isHintDrawerOpen}
        onOpenChange={setIsHintDrawerOpen}
        side="bottom"
        title="Sokratik Klinik Preseptör Rehberliği"
      >
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Stage 1 */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              hintStage >= 1
                ? 'bg-slate-900 border-sky-500/40 text-slate-100'
                : 'bg-slate-950 border-slate-800 text-slate-500 opacity-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-sky-400">AŞAMA 1: SOKRATİK DÜŞÜNDÜRME</span>
              <Badge variant="cyan" className="text-[10px]">
                0 XP Kesintisi
              </Badge>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed">
              {hintStage >= 1
                ? mission.socraticHintChain[0]
                : 'Birinci aşama ipucunu açmak için "Sokratik İpucu İste" butonuna tıklayınız.'}
            </p>
          </div>

          {/* Stage 2 */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              hintStage >= 2
                ? 'bg-slate-900 border-amber-500/40 text-slate-100'
                : 'bg-slate-950 border-slate-800 text-slate-500 opacity-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-amber-400">AŞAMA 2: MEKANİSTİK İPUCU</span>
              <Badge variant="warning" className="text-[10px]">
                -5 XP
              </Badge>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed">
              {hintStage >= 2
                ? mission.socraticHintChain[1]
                : 'Mekanistik bağ/yapı ipucunu görmek için bir sonraki aşamayı açın.'}
            </p>
          </div>

          {/* Stage 3 */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              hintStage >= 3
                ? 'bg-slate-900 border-emerald-500/40 text-slate-100'
                : 'bg-slate-950 border-slate-800 text-slate-500 opacity-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-emerald-400">AŞAMA 3: DOĞRUDAN YAPISAL MÜDAHALE</span>
              <Badge variant="success" className="text-[10px]">
                -10 XP
              </Badge>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed">
              {hintStage >= 3
                ? mission.socraticHintChain[2]
                : 'Doğrudan farmakofor çözüm kılavuzu için 3. aşamayı etkinleştirin.'}
            </p>
          </div>

          {hintStage < 3 && (
            <div className="flex justify-end pt-2">
              <Button
                size="sm"
                onClick={handleRequestHint}
                className="bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs whitespace-normal h-auto py-2 px-4"
              >
                Sonraki İpucu Aşamasını Aç ({hintStage + 1}/3)
              </Button>
            </div>
          )}
        </div>
      </Sheet>

      {/* 4. VICTORY DEBRIEF MODAL */}
      {isVictoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl text-center space-y-6">
            {/* Stars */}
            <div className="flex justify-center gap-3">
              {[1, 2, 3].map((starIdx) => (
                <Star
                  key={starIdx}
                  className={`h-10 w-10 transition-all ${
                    starIdx <= starsEarned
                      ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)] scale-110'
                      : 'text-slate-700'
                  }`}
                />
              ))}
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight">
                KLİNİK KURTARMA BAŞARILI! 🎉
              </h2>
              <p className="text-xs text-slate-400">
                Görev {mission.order}: <strong>{mission.title}</strong>
              </p>
            </div>

            {/* Reward Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">Kazanılan XP</div>
                <div className="text-xl font-black font-mono text-sky-400 mt-1 flex items-center justify-center gap-1">
                  <Zap className="h-4 w-4 text-sky-400" />
                  +{mission.xpReward}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">Günlük Seri</div>
                <div className="text-xl font-black font-mono text-amber-400 mt-1 flex items-center justify-center gap-1">
                  <Flame className="h-4 w-4 text-amber-400" />
                  {gamification.streak} Gün
                </div>
              </div>
            </div>

            {/* Aha moment */}
            <div className="rounded-xl bg-sky-950/40 border border-sky-500/30 p-3.5 text-left text-xs text-slate-300 space-y-1">
              <div className="font-bold text-sky-400 flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4" /> Sokratik "Aha!" Keşfi
              </div>
              <p className="leading-relaxed">{mission.victoryTrigger.ahaExplanation}</p>
            </div>

            {/* Clinical Pearl */}
            <div className="rounded-xl bg-emerald-950/40 border border-emerald-500/30 p-3.5 text-left text-xs text-slate-300 space-y-1">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Klinik İnci (Preseptör Notu)
              </div>
              <p className="leading-relaxed">{mission.victoryTrigger.pearl}</p>
            </div>

            {/* Modal Actions */}
            <div className="space-y-2 pt-2">
              {nextMission && (
                <Button
                  onClick={() => {
                    setIsVictoryModalOpen(false);
                    navigate(`/learn/mission/${nextMission.id}`);
                  }}
                  className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm h-11"
                >
                  Sonraki Göreve Geç ({nextMission.order}. {nextMission.title})
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  setIsVictoryModalOpen(false);
                  navigate('/learn');
                }}
                className="w-full text-xs h-10 border-slate-700"
              >
                Müfredat Haritasına Dön
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
