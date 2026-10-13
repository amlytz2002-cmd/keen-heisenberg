import React, { useState, useEffect } from 'react';
import { Button, Tag } from 'antd';
import {
  CloseOutlined,
  CheckCircleFilled,
  BulbOutlined,
  ThunderboltFilled,
  StarFilled,
  ArrowRightOutlined,
  RedoOutlined,
  CompassOutlined,
} from '@ant-design/icons';
import { getLessonById, getNextLesson } from '../../data/courses/medicinalChemistryTier1';
import { WidgetRenderer } from '../../components/interactive/WidgetRenderer';
import { useMicrolearning } from '../../context/MicrolearningContext';
import { useRouter } from '../../context/RouterContext';
import { StreakBadge } from '../../components/gamification/StreakBadge';

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

  // Reset step state when navigating or advancing step
  useEffect(() => {
    setUserAnswer(null);
    setHasChecked(false);
    setIsCorrect(false);
    setHintStage(0);
  }, [currentStepIndex, lessonId]);

  if (!lesson || !lesson.steps || lesson.steps.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center', padding: 24 }}>
        <h2>Ders Bulunamadı</h2>
        <p style={{ color: '#64748B' }}>İstediğiniz mikro-ders mevcut değil veya henüz yayına alınmadı.</p>
        <Button type="primary" onClick={() => navigate('/learn')}>
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
      // Correct if user selected the optimal substituent
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

    if (safeStepIndex < totalSteps - 1) {
      setCurrentStepIndex(safeStepIndex + 1);
    } else {
      // Calculate earned stars (3 if <= 1 mistake, 2 if <= 3 mistakes, 1 otherwise)
      const stars = mistakesCount === 0 ? 3 : mistakesCount <= 2 ? 2 : 1;
      await completeLesson(lesson.id, stars, lesson.xpReward);
      setIsFinished(true);
    }
  };

  // Celebration Screen at finish
  if (isFinished) {
    const starsEarned = mistakesCount === 0 ? 3 : mistakesCount <= 2 ? 2 : 1;

    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0F172A',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 520,
            width: '100%',
            background: '#1E293B',
            borderRadius: 24,
            padding: '36px 32px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            border: '1px solid #334155',
          }}
        >
          {/* Animated Stars */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
            {[1, 2, 3].map((starIndex) => (
              <StarFilled
                key={starIndex}
                style={{
                  fontSize: 44,
                  color: starIndex <= starsEarned ? '#F59E0B' : '#475569',
                  filter: starIndex <= starsEarned ? 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.6))' : 'none',
                  transition: 'transform 0.3s ease',
                  transform: 'scale(1.1)',
                }}
              />
            ))}
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 8px 0', color: '#F8FAFC' }}>
            Ders Tamamlandı! 🎉
          </h1>
          <p style={{ color: '#94A3B8', fontSize: 15, marginBottom: 28 }}>
            <strong>{lesson.title}</strong> konusunu başarıyla kavradınız.
          </p>

          {/* Rewards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                background: '#0F172A',
                padding: '16px 12px',
                borderRadius: 16,
                border: '1px solid #334155',
              }}
            >
              <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 4 }}>Kazanılan Deneyim</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <ThunderboltFilled style={{ color: '#F59E0B' }} />
                +{lesson.xpReward} XP
              </div>
            </div>

            <div
              style={{
                background: '#0F172A',
                padding: '16px 12px',
                borderRadius: 16,
                border: '1px solid #334155',
              }}
            >
              <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 4 }}>Günlük Seri</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#FB923C' }}>
                🔥 {gamification.streak} Gün
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {nextLesson && (
              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={() => {
                  setIsFinished(false);
                  setCurrentStepIndex(0);
                  navigate(`/learn/lesson/${nextLesson.id}`);
                }}
                style={{
                  height: 52,
                  borderRadius: 14,
                  fontSize: 16,
                  fontWeight: 700,
                  background: '#0284C7',
                  border: 'none',
                }}
              >
                Sonraki Dersi Başlat ({nextLesson.title})
              </Button>
            )}

            <Button
              size="large"
              icon={<CompassOutlined />}
              onClick={() => navigate('/learn')}
              style={{
                height: 48,
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 600,
                background: 'transparent',
                borderColor: '#475569',
                color: '#E2E8F0',
              }}
            >
              Ders Haritasına Dön
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isCheckDisabled = userAnswer === null;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Navigation Bar */}
      <div
        style={{
          height: 64,
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 20,
          background: '#FFFFFF',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => navigate('/learn')}
          type="button"
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 8,
            color: '#64748B',
            display: 'flex',
            alignItems: 'center',
            fontSize: 18,
          }}
          aria-label="Kapat"
        >
          <CloseOutlined />
        </button>

        {/* Segmented Progress Bar */}
        <div style={{ flex: 1, display: 'flex', gap: 6, alignItems: 'center' }}>
          {lesson.steps.map((step, idx) => {
            const isDone = idx < safeStepIndex;
            const isCurrent = idx === safeStepIndex;

            return (
              <div
                key={step.id}
                style={{
                  flex: 1,
                  height: 8,
                  borderRadius: 4,
                  background: isDone ? '#22C55E' : isCurrent ? '#0284C7' : '#E2E8F0',
                  transition: 'all 0.3s ease',
                }}
              />
            );
          })}
        </div>

        {/* Gamification Streak & XP */}
        <StreakBadge streak={gamification.streak} xp={gamification.xp} />
      </div>

      {/* Main Lesson Content Area */}
      <div
        style={{
          flex: 1,
          maxWidth: 720,
          width: '100%',
          margin: '0 auto',
          padding: '32px 24px 140px 24px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Step Concept Tag & Stage Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Tag color="cyan" style={{ borderRadius: 8, fontWeight: 600 }}>
            {currentStep.conceptTag}
          </Tag>
          <span style={{ fontSize: 13, color: '#94A3B8' }}>
            Adım {safeStepIndex + 1} / {totalSteps}
          </span>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '0 0 12px 0' }}>
          {currentStep.title}
        </h1>

        <div
          style={{
            fontSize: 15,
            lineHeight: 1.6,
            color: '#334155',
            marginBottom: 24,
          }}
          dangerouslySetInnerHTML={{ __html: currentStep.instructionHtml }}
        />

        {/* Interactive Widget */}
        <div style={{ marginBottom: 28 }}>
          <WidgetRenderer
            step={currentStep}
            currentAnswer={userAnswer}
            onAnswerChange={setUserAnswer}
            disabled={hasChecked && isCorrect}
          />
        </div>

        {/* Socratic Hint Chain Panel */}
        <div style={{ marginTop: 'auto', marginBottom: 16 }}>
          <div
            style={{
              borderRadius: 14,
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BulbOutlined style={{ color: '#D97706', fontSize: 18 }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                  Cenna Sokratik Preseptör İpucu
                </span>
              </div>

              {hintStage < 3 && (
                <Button
                  size="small"
                  type="link"
                  onClick={() => setHintStage((prev) => Math.min(3, prev + 1))}
                  style={{ fontWeight: 600, color: '#0284C7' }}
                >
                  {hintStage === 0 ? 'İpucu Al (Aşama 1)' : `Daha Derin İpucu (${hintStage + 1}/3)`}
                </Button>
              )}
            </div>

            {hintStage > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {currentStep.socraticHintChain.slice(0, hintStage).map((hint, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: 10,
                      padding: '10px 14px',
                      fontSize: 13,
                      color: '#475569',
                      lineHeight: 1.5,
                    }}
                  >
                    <span style={{ fontWeight: 700, color: '#0284C7', marginRight: 6 }}>
                      İpucu {idx + 1}:
                    </span>
                    {hint}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Check / Continue Bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: hasChecked ? (isCorrect ? '#F0FDF4' : '#FEF2F2') : '#FFFFFF',
          borderTop: hasChecked
            ? isCorrect
              ? '2px solid #86EFAC'
              : '2px solid #FECACA'
            : '1px solid #E2E8F0',
          padding: '18px 24px',
          boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.05)',
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: 720,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          {/* Feedback message if checked */}
          {hasChecked ? (
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                {isCorrect ? (
                  <>
                    <CheckCircleFilled style={{ color: '#16A34A', fontSize: 20 }} />
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#15803D' }}>Doğru Çıkarım!</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#DC2626' }}>Tekrar Değerlendir</span>
                  </>
                )}
              </div>
              <div
                style={{ fontSize: 13, color: '#475569', lineHeight: 1.4 }}
                dangerouslySetInnerHTML={{ __html: currentStep.explanationHtml }}
              />
              {currentStep.clinicalPearl && isCorrect && (
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: '#0284C7' }}>
                  💊 Klinik İnci: {currentStep.clinicalPearl}
                </div>
              )}
            </div>
          ) : (
            <div style={{ flex: 1, color: '#64748B', fontSize: 13 }}>
              Soruyu dikkatle inceleyin veya molekülü etkileşimli deneyin.
            </div>
          )}

          {/* Action Button */}
          <div>
            {!hasChecked ? (
              <Button
                type="primary"
                size="large"
                disabled={isCheckDisabled}
                onClick={handleCheckAnswer}
                style={{
                  minWidth: 150,
                  height: 48,
                  borderRadius: 14,
                  fontSize: 16,
                  fontWeight: 700,
                  background: '#0284C7',
                  border: 'none',
                }}
              >
                Kontrol Et
              </Button>
            ) : isCorrect ? (
              <Button
                type="primary"
                size="large"
                onClick={handleContinue}
                icon={<ArrowRightOutlined />}
                style={{
                  minWidth: 150,
                  height: 48,
                  borderRadius: 14,
                  fontSize: 16,
                  fontWeight: 700,
                  background: '#16A34A',
                  border: 'none',
                }}
              >
                Devam Et
              </Button>
            ) : (
              <Button
                size="large"
                onClick={() => setHasChecked(false)}
                icon={<RedoOutlined />}
                style={{
                  minWidth: 150,
                  height: 48,
                  borderRadius: 14,
                  fontSize: 16,
                  fontWeight: 700,
                  borderColor: '#DC2626',
                  color: '#DC2626',
                }}
              >
                Yeniden Dene
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
