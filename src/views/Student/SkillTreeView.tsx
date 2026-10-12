import React from 'react';
import { Card, Tag, Button, Progress } from 'antd';
import {
  LockFilled,
  CheckCircleFilled,
  StarFilled,
  PlayCircleFilled,
} from '@ant-design/icons';
import { MEDICINAL_CHEMISTRY_TIER_1, getAllTier1Lessons } from '../../data/courses/medicinalChemistryTier1';
import { useMicrolearning } from '../../context/MicrolearningContext';
import { useRouter } from '../../context/RouterContext';
import { StreakBadge } from '../../components/gamification/StreakBadge';

export const SkillTreeView: React.FC = () => {
  const { navigate } = useRouter();
  const { userProgress, isLessonUnlocked, gamification } = useMicrolearning();

  const allLessons = getAllTier1Lessons();
  const totalLessons = allLessons.length;
  const completedCount = allLessons.filter((l) => userProgress[l.id]?.isCompleted).length;
  const progressPercent = Math.round((completedCount / totalLessons) * 100);

  // Find the first unlocked but uncompleted lesson
  const currentActiveLesson = allLessons.find(
    (l) => isLessonUnlocked(l.id) && !userProgress[l.id]?.isCompleted
  ) || allLessons[0];

  const getThemeColors = (theme: string) => {
    switch (theme) {
      case 'emerald':
        return { bg: '#ECFDF5', border: '#A7F3D0', accent: '#059669', badge: 'green' };
      case 'purple':
        return { bg: '#FAF5FF', border: '#E9D5FF', accent: '#9333EA', badge: 'purple' };
      case 'amber':
        return { bg: '#FFFBEB', border: '#FDE68A', accent: '#D97706', badge: 'gold' };
      case 'rose':
        return { bg: '#FFF1F2', border: '#FECDD3', accent: '#E11D48', badge: 'volcano' };
      case 'cyan':
        return { bg: '#ECFEFF', border: '#A5F3FC', accent: '#0891B2', badge: 'cyan' };
      case 'blue':
      default:
        return { bg: '#F0F9FF', border: '#BAE6FD', accent: '#0284C7', badge: 'blue' };
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: 80 }}>
      {/* Hero Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          padding: '40px 24px 36px 24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Tag color="#0284C7" style={{ borderRadius: 12, fontWeight: 700, padding: '4px 12px', fontSize: 13 }}>
              KADEME 1: TEMEL İLKELER & SAR
            </Tag>
            <StreakBadge streak={gamification.streak} xp={gamification.xp} />
          </div>

          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#F8FAFC', margin: '0 0 10px 0' }}>
            Farmasötik ve Medisinal Kimya
          </h1>
          <p style={{ color: '#94A3B8', fontSize: 16, margin: '0 0 24px 0', maxWidth: 640 }}>
            Prof. Dr. Bedia Kaymakçıoğlu ders notlarından modellenmiş, aktif çıkarım ve Brilliant-tarzı interaktif kimyasal mikro-öğrenme yolu.
          </p>

          {/* Quick Stats & Progress Bar */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 18,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '18px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#CBD5E1', fontWeight: 600 }}>
                Müfredat İlerlemesi: {completedCount} / {totalLessons} Ders Tamamlandı
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#38BDF8' }}>
                %{progressPercent}
              </span>
            </div>
            <Progress
              percent={progressPercent}
              strokeColor={{ '0%': '#0284C7', '100%': '#10B981' }}
              showInfo={false}
              size={['100%', 10]}
            />
          </div>
        </div>
      </div>

      {/* Main Skill Path Container */}
      <div style={{ maxWidth: 880, margin: '-20px auto 0 auto', padding: '0 20px' }}>
        {/* Continue Next Lesson Card */}
        {currentActiveLesson && (
          <Card
            style={{
              borderRadius: 20,
              boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.25)',
              border: '2px solid #0284C7',
              marginBottom: 36,
              background: '#FFFFFF',
            }}
            bodyStyle={{ padding: 24 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <Tag color="blue" style={{ borderRadius: 8, fontWeight: 700, marginBottom: 6 }}>
                  Sıradaki Mikro-Ders
                </Tag>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
                  {currentActiveLesson.lessonNumber}. {currentActiveLesson.title}
                </h3>
                <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>
                  {currentActiveLesson.subtitle} · ⏱️ {currentActiveLesson.durationMinutes} dk · ⚡ +{currentActiveLesson.xpReward} XP
                </p>
              </div>

              <Button
                type="primary"
                size="large"
                icon={<PlayCircleFilled />}
                onClick={() => navigate(`/learn/lesson/${currentActiveLesson.id}`)}
                style={{
                  height: 48,
                  padding: '0 28px',
                  borderRadius: 14,
                  fontSize: 16,
                  fontWeight: 700,
                  background: '#0284C7',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                }}
              >
                Hemen Başla
              </Button>
            </div>
          </Card>
        )}

        {/* Modules Roadmap */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {MEDICINAL_CHEMISTRY_TIER_1.map((module) => {
            const theme = getThemeColors(module.colorTheme);

            return (
              <div key={module.id} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Module Header Card */}
                <div
                  style={{
                    background: theme.bg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 18,
                    padding: '20px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: theme.accent, textTransform: 'uppercase' }}>
                        Modül {module.moduleNumber}
                      </span>
                      <Tag color={theme.badge} style={{ borderRadius: 8, fontWeight: 600 }}>
                        {module.badgeText}
                      </Tag>
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
                      {module.title}
                    </h2>
                    <p style={{ color: '#64748B', fontSize: 13, margin: 0 }}>
                      {module.shortDescription}
                    </p>
                  </div>
                </div>

                {/* Lessons Node List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 12 }}>
                  {module.lessons.map((lesson) => {
                    const isUnlocked = isLessonUnlocked(lesson.id);
                    const progress = userProgress[lesson.id];
                    const isCompleted = !!progress?.isCompleted;
                    const stars = progress?.starsEarned || 0;

                    return (
                      <div
                        key={lesson.id}
                        onClick={() => {
                          if (isUnlocked) {
                            navigate(`/learn/lesson/${lesson.id}`);
                          }
                        }}
                        style={{
                          background: '#FFFFFF',
                          borderRadius: 16,
                          border: isCompleted
                            ? '1.5px solid #BBF7D0'
                            : isUnlocked
                            ? '1.5px solid #E2E8F0'
                            : '1.5px solid #F1F5F9',
                          padding: '16px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          cursor: isUnlocked ? 'pointer' : 'not-allowed',
                          opacity: isUnlocked ? 1 : 0.6,
                          transition: 'all 0.2s ease',
                          boxShadow: isUnlocked ? '0 2px 4px rgba(0, 0, 0, 0.02)' : 'none',
                        }}
                      >
                        {/* Node Status Circle */}
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20,
                            background: isCompleted
                              ? '#DCFCE7'
                              : isUnlocked
                              ? '#E0F2FE'
                              : '#F1F5F9',
                            color: isCompleted
                              ? '#16A34A'
                              : isUnlocked
                              ? '#0284C7'
                              : '#94A3B8',
                            flexShrink: 0,
                          }}
                        >
                          {isCompleted ? (
                            <CheckCircleFilled />
                          ) : isUnlocked ? (
                            <PlayCircleFilled />
                          ) : (
                            <LockFilled />
                          )}
                        </div>

                        {/* Title & Subtitle */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 16, fontWeight: 700, color: isUnlocked ? '#0F172A' : '#94A3B8' }}>
                              {lesson.title}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, color: '#64748B' }}>
                            {lesson.subtitle}
                          </div>
                        </div>

                        {/* Right: Stars or XP badge */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          {isCompleted ? (
                            <div style={{ display: 'flex', gap: 2 }}>
                              {[1, 2, 3].map((s) => (
                                <StarFilled
                                  key={s}
                                  style={{
                                    fontSize: 14,
                                    color: s <= stars ? '#F59E0B' : '#E2E8F0',
                                  }}
                                />
                              ))}
                            </div>
                          ) : (
                            <Tag color="blue" style={{ borderRadius: 8, fontWeight: 600, margin: 0 }}>
                              +{lesson.xpReward} XP
                            </Tag>
                          )}
                          <span style={{ fontSize: 11, color: '#94A3B8' }}>
                            {lesson.durationMinutes} dk
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
