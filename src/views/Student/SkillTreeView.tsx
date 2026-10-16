import React from 'react';
import { Card, Tag, Button, Progress } from 'antd';
import {
  LockFilled,
  CheckCircleFilled,
  StarFilled,
  PlayCircleFilled,
  CalendarOutlined,
  RocketFilled,
} from '@ant-design/icons';
import { MEDICINAL_CHEMISTRY_TIER_1, getAllTier1Lessons } from '../../data/courses/medicinalChemistryTier1';
import { useMicrolearning } from '../../context/MicrolearningContext';
import { useRouter } from '../../context/RouterContext';
import { StreakBadge } from '../../components/gamification/StreakBadge';

export const SkillTreeView: React.FC = () => {
  const { navigate } = useRouter();
  const { userProgress, isLessonUnlocked, gamification, isLoading } = useMicrolearning();

  if (isLoading) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Ders haritası ve öğrenci ilerlemesi yükleniyor..."
        style={{ minHeight: '100vh', background: '#060B14', paddingBottom: 80 }}
      >
        <span
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          Ders haritası ve öğrenci ilerlemesi yükleniyor...
        </span>

        {/* Hero Header Skeleton */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0B132B 0%, #0F172A 100%)',
            borderBottom: '1px solid #1E293B',
            color: '#FFFFFF',
            padding: '40px 24px 36px 24px',
          }}
        >
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ width: 220, height: 28, borderRadius: 12, background: 'rgba(255, 255, 255, 0.08)' }} />
              <div style={{ width: 140, height: 28, borderRadius: 20, background: 'rgba(255, 255, 255, 0.08)' }} />
            </div>

            <div style={{ width: 380, maxWidth: '85%', height: 36, borderRadius: 8, background: 'rgba(255, 255, 255, 0.12)', marginBottom: 14 }} />
            <div style={{ width: 520, maxWidth: '95%', height: 18, borderRadius: 6, background: 'rgba(255, 255, 255, 0.06)', marginBottom: 24 }} />

            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                borderRadius: 18,
                border: '1px solid #1E293B',
                padding: '18px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ width: '100%', height: 10, borderRadius: 5, background: '#1E293B' }} />
            </div>
          </div>
        </div>

        {/* Main Skill Path Container Skeleton */}
        <div style={{ maxWidth: 960, margin: '-20px auto 0 auto', padding: '0 20px' }}>
          <div
            style={{
              borderRadius: 20,
              background: '#0F172A',
              border: '1px solid #1E293B',
              marginBottom: 36,
              padding: 24,
              height: 120,
            }}
          />
        </div>
      </div>
    );
  }

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
        return { bg: 'rgba(5, 150, 105, 0.12)', border: '#065F46', accent: '#34D399', badge: 'green' };
      case 'purple':
        return { bg: 'rgba(147, 51, 234, 0.12)', border: '#581C87', accent: '#C084FC', badge: 'purple' };
      case 'amber':
        return { bg: 'rgba(217, 119, 6, 0.12)', border: '#78350F', accent: '#FBBF24', badge: 'gold' };
      case 'rose':
        return { bg: 'rgba(225, 29, 72, 0.12)', border: '#881337', accent: '#FB7185', badge: 'volcano' };
      case 'cyan':
        return { bg: 'rgba(8, 145, 178, 0.12)', border: '#164E63', accent: '#38BDF8', badge: 'cyan' };
      case 'blue':
      default:
        return { bg: 'rgba(2, 132, 199, 0.12)', border: '#0C4A6E', accent: '#38BDF8', badge: 'blue' };
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#060B14', color: '#F8FAFC', paddingBottom: 80 }}>
      {/* 1. Hero Dark-Mode Cockpit Header with Unified Bridge Navigation */}
      <div
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #0F223D 0%, #060B14 100%)',
          borderBottom: '1px solid #1E293B',
          padding: '40px 24px 36px 24px',
        }}
      >
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          {/* Top Pill & Streak */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Tag color="#0284C7" style={{ borderRadius: 12, fontWeight: 700, padding: '4px 12px', fontSize: 13, border: 'none' }}>
                KADEME 1: TEMEL İLKELER & SAR
              </Tag>
              <Tag color="cyan" style={{ borderRadius: 12, fontWeight: 700, padding: '4px 12px', fontSize: 12 }}>
                21 Klinik Kurtarma Görevi
              </Tag>
            </div>
            <StreakBadge streak={gamification.streak} xp={gamification.xp} />
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#FFFFFF', margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
            Farmasötik ve Medisinal Kimya
          </h1>
          <p style={{ color: '#94A3B8', fontSize: 15, margin: '0 0 24px 0', maxWidth: 680, lineHeight: 1.6 }}>
            Prof. Dr. Bedia Kaymakçıoğlu ders notlarından modellenmiş, aktif çıkarım ve Brilliant-tarzı interaktif kimyasal mikro-öğrenme yolu ile 21 gerçek klinik kurtarma simülasyonu.
          </p>

          {/* Direct Bridge Action Strip: /app/today and /learn/mission/mission-1 */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <Button
              type="primary"
              size="middle"
              icon={<RocketFilled />}
              onClick={() => navigate('/learn/mission/mission-1')}
              style={{
                height: 42,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                border: 'none',
                fontWeight: 700,
                fontSize: 13,
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
              }}
            >
              21 Klinik Kurtarma Görevini Başlat (Laboratuvar)
            </Button>

            <Button
              size="middle"
              icon={<CalendarOutlined />}
              onClick={() => navigate('/app/today')}
              style={{
                height: 42,
                borderRadius: 10,
                background: '#0F172A',
                border: '1px solid #334155',
                color: '#CBD5E1',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Bugünün Çalışma Paneline Dön
            </Button>
          </div>

          {/* Quick Stats & Progress Bar */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              borderRadius: 18,
              border: '1px solid #1E293B',
              padding: '18px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600 }}>
                {completedCount} / {totalLessons} Ders Tamamlandı
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#38BDF8', fontFamily: 'monospace' }}>
                %{progressPercent}
              </span>
            </div>
            <Progress
              percent={progressPercent}
              strokeColor={{ '0%': '#0284C7', '100%': '#10B981' }}
              trailColor="#1E293B"
              showInfo={false}
              size={['100%', 8]}
            />
          </div>
        </div>
      </div>

      {/* 2. Main Skill Path Container */}
      <div style={{ maxWidth: 960, margin: '-20px auto 0 auto', padding: '0 20px' }}>
        {/* Continue Next Lesson Highlight Card */}
        {currentActiveLesson && (
          <Card
            style={{
              borderRadius: 20,
              boxShadow: '0 12px 30px -5px rgba(2, 132, 199, 0.3)',
              border: '1.5px solid #0284C7',
              marginBottom: 36,
              background: '#0F172A',
            }}
            styles={{ body: { padding: 24 } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <Tag color="#0284C7" style={{ borderRadius: 8, fontWeight: 700, marginBottom: 8, border: 'none' }}>
                  Sıradaki Mikro-Ders
                </Tag>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px 0' }}>
                  {currentActiveLesson.lessonNumber}. {currentActiveLesson.title}
                </h3>
                <p style={{ color: '#94A3B8', fontSize: 14, margin: 0 }}>
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
                  fontSize: 15,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                }}
              >
                Hemen Başla
              </Button>
            </div>
          </Card>
        )}

        {/* 3. Modules Roadmap */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {MEDICINAL_CHEMISTRY_TIER_1.map((module) => {
            const theme = getThemeColors(module.colorTheme);

            return (
              <div key={module.id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                    <h2 style={{ fontSize: 19, fontWeight: 800, color: '#FFFFFF', margin: '0 0 4px 0' }}>
                      {module.title}
                    </h2>
                    <p style={{ color: '#94A3B8', fontSize: 13, margin: 0 }}>
                      {module.shortDescription}
                    </p>
                  </div>
                </div>

                {/* Lessons Node List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 8 }}>
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
                          background: isCompleted ? '#0A1829' : '#0F172A',
                          borderRadius: 16,
                          border: isCompleted
                            ? '1.5px solid #059669'
                            : isUnlocked
                            ? '1.5px solid #1E293B'
                            : '1.5px solid #141E33',
                          padding: '16px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          cursor: isUnlocked ? 'pointer' : 'not-allowed',
                          opacity: isUnlocked ? 1 : 0.5,
                          transition: 'all 0.2s ease',
                          boxShadow: isUnlocked ? '0 4px 12px rgba(0, 0, 0, 0.25)' : 'none',
                        }}
                      >
                        {/* Node Status Circle */}
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 18,
                            background: isCompleted
                              ? '#064E3B'
                              : isUnlocked
                              ? '#0C4A6E'
                              : '#1E293B',
                            color: isCompleted
                              ? '#34D399'
                              : isUnlocked
                              ? '#38BDF8'
                              : '#64748B',
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
                            <span style={{ fontSize: 15, fontWeight: 700, color: isUnlocked ? '#FFFFFF' : '#64748B' }}>
                              {lesson.title}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: '#94A3B8' }}>
                            {lesson.subtitle}
                          </div>
                        </div>

                        {/* Right: Stars or XP badge */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          {isCompleted ? (
                            <div style={{ display: 'flex', gap: 3 }}>
                              {[1, 2, 3].map((s) => (
                                <StarFilled
                                  key={s}
                                  style={{
                                    fontSize: 13,
                                    color: s <= stars ? '#F59E0B' : '#334155',
                                  }}
                                />
                              ))}
                            </div>
                          ) : (
                            <Tag color="blue" style={{ borderRadius: 8, fontWeight: 600, margin: 0, background: '#1E3A8A', borderColor: '#3B82F6', color: '#93C5FD' }}>
                              +{lesson.xpReward} XP
                            </Tag>
                          )}
                          <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>
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
