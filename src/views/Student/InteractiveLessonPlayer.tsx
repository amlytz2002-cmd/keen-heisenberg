import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Star,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { getLessonById, getNextLesson } from '../../data/courses/medicinalChemistryTier1';
import { WidgetRenderer } from '../../components/interactive/WidgetRenderer';
import { useMicrolearning } from '../../context/MicrolearningContext';
import { useRouter } from '../../context/RouterContext';
import { StreakBadge } from '../../components/gamification/StreakBadge';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

export const InteractiveLessonPlayer: React.FC = () => {
  const { params, navigate } = useRouter();
  const lessonId = params.lessonId;
  const { completeLesson, updateStepProgress, gamification } = useMicrolearning();

  const lesson = lessonId ? getLessonById(lessonId) : undefined;
  const nextLesson = lessonId ? getNextLesson(lessonId) : undefined;

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<any>(null);
  const [hasChecked, setHasChecked] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [hintStage, setHintStage] = useState<number>(0);
  const [mistakesCount, setMistakesCount] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Reset entire lesson state when lessonId changes (state isolation)
  useEffect(() => {
    setCurrentStepIndex(0);
    setMistakesCount(0);
    setIsFinished(false);
  }, [lessonId]);

  // Reset step state when navigating or advancing step
  useEffect(() => {
    setUserAnswer(null);
    setHasChecked(false);
    setIsCorrect(false);
    setHintStage(0);
  }, [currentStepIndex, lessonId]);

  if (!lesson || !lesson.steps || lesson.steps.length === 0) {
    return (
      <div className="min-h-screen bg-[#060B14] flex flex-col items-center justify-center p-6 text-center text-slate-100 space-y-4">
        <h2 className="text-xl font-bold text-white">Ders Bulunamadı</h2>
        <p className="text-xs text-slate-400 max-w-md">
          İstediğiniz mikro-ders mevcut değil veya henüz yayına alınmadı.
        </p>
        <Button onClick={() => navigate('/learn')} className="bg-sky-500 hover:bg-sky-400 text-white text-xs">
          Ders Haritasına Dön
        </Button>
      </div>
    );
  }

  const totalSteps = lesson.steps.length;
  const safeStepIndex = Math.min(Math.max(0, currentStepIndex), totalSteps - 1);
  const currentStep = lesson.steps[safeStepIndex];

  const handleCheckAnswer = () => {
    if (!currentStep) return;

    let correct = false;

    if (currentStep.widgetType === 'multiple_choice') {
      correct = userAnswer === currentStep.correctAnswer;
    } else if (currentStep.widgetType === 'molecule_inspector') {
      correct = userAnswer === currentStep.correctAnswer;
    } else if (currentStep.widgetType === 'sar_slider') {
      correct = userAnswer === currentStep.correctAnswer;
    } else if (currentStep.widgetType === 'bond_matcher') {
      correct = userAnswer === true;
    } else if (currentStep.widgetType === 'ph_gauge') {
      const targetPh =
        typeof currentStep.correctAnswer === 'object' && currentStep.correctAnswer !== null
          ? currentStep.correctAnswer.ph
          : currentStep.correctAnswer;
      const userPh =
        typeof userAnswer === 'object' && userAnswer !== null
          ? userAnswer.ph
          : userAnswer;
      correct =
        typeof targetPh === 'number' && typeof userPh === 'number'
          ? Math.abs(userPh - targetPh) <= 0.15
          : false;
    } else {
      correct = true;
    }

    setIsCorrect(correct);
    setHasChecked(true);

    if (!correct) {
      setMistakesCount((prev) => prev + 1);
    }
  };

  const handleContinue = async () => {
    await updateStepProgress(lesson.id, safeStepIndex + 1);

    if (safeStepIndex >= totalSteps - 1) {
      const stars = mistakesCount === 0 ? 3 : mistakesCount <= 2 ? 2 : 1;
      await completeLesson(lesson.id, stars, lesson.xpReward);
      setIsFinished(true);
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const starsEarned = mistakesCount === 0 ? 3 : mistakesCount <= 2 ? 2 : 1;

  if (isFinished) {
    return (
      <div className="min-h-screen bg-[#060B14] flex items-center justify-center p-4 sm:p-6 text-slate-100">
        <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-2xl text-center space-y-6">
          <div className="flex justify-center gap-3">
            {[1, 2, 3].map((starIdx) => (
              <Star
                key={starIdx}
                className={`h-12 w-12 ${
                  starIdx <= starsEarned
                    ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)] scale-110'
                    : 'text-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Ders Tamamlandı! 🎉
            </h2>
            <p className="text-xs text-slate-400">
              {lesson.title} mikro-dersini tamamladınız.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400">Kazanılan XP</div>
              <div className="text-2xl font-black font-mono text-sky-400 mt-1">
                +{lesson.xpReward} XP
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400">Hata Sayısı</div>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                {mistakesCount}
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            {nextLesson && (
              <Button
                onClick={() => navigate(`/learn/lesson/${nextLesson.id}`)}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm h-11"
              >
                Sıradaki Derse Geç ({nextLesson.title})
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => navigate('/learn')}
              className="w-full text-xs h-10 border-slate-700"
            >
              Müfredat Haritasına Dön
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060B14] flex flex-col text-slate-100">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/learn')}
          className="flex items-center justify-center h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
          title="Kapat ve Müfredata Dön"
          aria-label="Kapat"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Segmented Progress Bar */}
        <div className="flex-1 max-w-md flex items-center gap-2">
          {lesson.steps.map((step, idx) => {
            const isDone = idx < safeStepIndex || (idx === safeStepIndex && hasChecked && isCorrect);
            const isCurrent = idx === safeStepIndex;

            return (
              <div
                key={step.id}
                className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                  isDone
                    ? 'bg-emerald-500'
                    : isCurrent
                    ? 'bg-sky-500/50'
                    : 'bg-slate-800'
                }`}
              />
            );
          })}
        </div>

        {/* Streak & XP */}
        <div className="flex items-center gap-2">
          <StreakBadge streak={gamification.streak} xp={gamification.xp} compact />
        </div>
      </header>

      {/* Main Lesson Content Area */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 pb-32 flex flex-col space-y-6">
        <div className="flex items-center gap-2">
          <Badge variant="cyan" className="text-xs font-semibold">
            {currentStep.conceptTag}
          </Badge>
          <span className="text-xs text-slate-500">
            Adım {safeStepIndex + 1} / {totalSteps}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {currentStep.title}
        </h1>

        <div
          className="text-sm text-slate-300 leading-relaxed rounded-xl bg-slate-900/60 border border-slate-800/80 p-4"
          dangerouslySetInnerHTML={{ __html: currentStep.instructionHtml }}
        />

        {/* Interactive Widget Stage */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl">
          <WidgetRenderer
            step={currentStep}
            currentAnswer={userAnswer}
            onAnswerChange={setUserAnswer}
            disabled={hasChecked && isCorrect}
          />
        </div>

        {/* Socratic Hint Chain Panel */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold text-white">
                Sokratik Preseptör İpucu
              </span>
            </div>

            {hintStage < 3 && (
              <button
                type="button"
                onClick={() => setHintStage((prev) => Math.min(3, prev + 1))}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
              >
                {hintStage === 0
                  ? 'İpucu Al (Aşama 1)'
                  : `Daha Derin İpucu (${hintStage + 1}/3)`}
              </button>
            )}
          </div>

          {hintStage > 0 && (
            <div className="space-y-2 pt-1">
              {currentStep.socraticHintChain.slice(0, hintStage).map((hint, idx) => (
                <div
                  key={idx}
                  className="rounded-lg bg-slate-950 border border-slate-800 p-3 text-xs text-slate-300 leading-relaxed"
                >
                  <span className="font-bold text-sky-400 mr-2">
                    Aşama {idx + 1}:
                  </span>
                  {hint}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Check / Continue Bar */}
      <footer
        className={`fixed bottom-0 left-0 right-0 z-30 border-t p-4 transition-colors ${
          hasChecked
            ? isCorrect
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100 backdrop-blur-md'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-100 backdrop-blur-md'
            : 'bg-slate-950/90 border-slate-800 backdrop-blur-md'
        }`}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          {hasChecked ? (
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    <span className="font-extrabold text-sm sm:text-base text-emerald-400">Doğru Çıkarım!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
                    <span className="font-extrabold text-sm sm:text-base text-rose-400">Tekrar Değerlendir</span>
                  </>
                )}
              </div>
              {currentStep.explanationHtml && (
                <div
                  className="text-xs sm:text-sm text-slate-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: currentStep.explanationHtml }}
                />
              )}
              {currentStep.clinicalPearl && isCorrect && (
                <div className="text-xs font-semibold text-sky-400 pt-0.5">
                  💊 Klinik İnci: {currentStep.clinicalPearl}
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-400">
              Soruyu dikkatle inceleyin veya molekülü etkileşimli deneyin.
            </div>
          )}

          <div>
            {hasChecked ? (
              isCorrect ? (
                <Button
                  onClick={handleContinue}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-6"
                >
                  Devam Et
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setHasChecked(false);
                  }}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm px-6"
                >
                  Yeniden Dene
                  <RotateCcw className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              )
            ) : (
              <Button
                onClick={handleCheckAnswer}
                disabled={userAnswer === null}
                className="bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs sm:text-sm px-6"
              >
                Kontrol Et
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
