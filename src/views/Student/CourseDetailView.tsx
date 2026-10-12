import React, { useEffect, useState } from 'react';
import { Card, Typography, Button, Tag, Row, Col, Spin, Alert, Progress, Tabs } from 'antd';
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  PlayCircleFilled,
  FileTextOutlined,
  CheckCircleFilled,
  LockFilled,
  StarFilled,
  ThunderboltOutlined,
  CompassOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  LockOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { useRouter } from '../../context/RouterContext';
import { useMicrolearning } from '../../context/MicrolearningContext';
import {
  MEDICINAL_CHEMISTRY_MODULES,
  getAllMissions,
} from '../../data/courses/medicinalChemistryMissions';
import { api } from '../../lib/api';

const { Title, Paragraph, Text } = Typography;

const defaultEcz304Course = {
  id: 'c0000000-0000-0000-0000-000000000001',
  code: 'ECZ304',
  title: 'Farmasötik ve Medisinal Kimya',
  description:
    'Prof. Dr. Bedia Kaymakçıoğlu ders notlarından modellenmiş, aktif çıkarım ve Brilliant-tarzı interaktif 21 Klinik Kurtarma Görevi ve Moleküler Tasarım Laboratuvarı.',
  faculty: 'Biruni Üniversitesi Eczacılık Fakültesi',
  term: 'Güz Dönemi',
  credits: 3,
  modules: [
    {
      id: 'mod-1',
      title: 'Modül 1: Fonksiyonel Gruplar & Moleküler İskelet',
      description: 'Açilasyon, esteraz direnci, sterik kalkanlar ve biyoizosterik değişimler.',
    },
    {
      id: 'mod-2',
      title: 'Modül 2: İlaç-Reseptör Bağları & Termodinamik',
      description: 'Kovalent disülfid kelepçeleri, Coulomb tuz köprüleri ve hidrofobik entropi tahliyesi.',
    },
    {
      id: 'mod-3',
      title: 'Modül 3: İzomeri & Stereokimya',
      description: 'Sisplatin kare düzlem geometrisi, Easson-Stedman 3-nokta kiral anahtarı ve rasemizasyon.',
    },
    {
      id: 'mod-4',
      title: 'Modül 4: Biyoizosterizm İlkeleri',
      description: 'Grimm hidrür kuralı flor zırhı, Losartan tetrazol hayaleti ve Lidokain 2,6-dimetil amid kalkanı.',
    },
    {
      id: 'mod-5',
      title: 'Modül 5: SAR & Çözünürlük İlkeleri',
      description: 'KBB LogP sızma operasyonu, Henderson-Hasselbalch iyon tuzağı ve Lipinski terazisi.',
    },
    {
      id: 'mod-6',
      title: 'Modül 6: İlaç Metabolizması (Biyotransformasyon)',
      description: 'CYP450 Faz I oksijen sondajı, Sülfasalazin kolon salımı ve Enalapril ön ilaç roketi.',
    },
  ],
};

const getModuleBadgeConfig = (colorTheme: string) => {
  switch (colorTheme) {
    case 'blue':
      return { tagColor: 'blue', border: '#BFDBFE', headerBg: '#EFF6FF', text: '#1D4ED8' };
    case 'emerald':
      return { tagColor: 'green', border: '#A7F3D0', headerBg: '#ECFDF5', text: '#047857' };
    case 'purple':
      return { tagColor: 'purple', border: '#E9D5FF', headerBg: '#FAF5FF', text: '#7E22CE' };
    case 'amber':
      return { tagColor: 'gold', border: '#FDE68A', headerBg: '#FFFBEB', text: '#B45309' };
    case 'rose':
      return { tagColor: 'magenta', border: '#FECDD3', headerBg: '#FFF1F2', text: '#BE123C' };
    case 'cyan':
      return { tagColor: 'cyan', border: '#A5F3FC', headerBg: '#ECFEFF', text: '#0E7490' };
    default:
      return { tagColor: 'default', border: '#CBD5E1', headerBg: '#F8FAFC', text: '#334155' };
  }
};

export const CourseDetailView: React.FC = () => {
  const { params, navigate } = useRouter();
  const { userProgress, isMissionUnlocked, gamification } = useMicrolearning();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('missions');

  const courseId = params.courseId;

  const isMedicinalChemistry =
    courseId === 'ECZ304' ||
    courseId === 'c0000000-0000-0000-0000-000000000001' ||
    course?.code === 'ECZ304' ||
    course?.title?.toLowerCase().includes('medisinal') ||
    course?.title?.toLowerCase().includes('farmasötik');

  // Mission progression calculations
  const allMissions = getAllMissions();
  const totalMissions = allMissions.length;

  const completedMissions = allMissions.filter((m) => {
    const p = userProgress[m.id] || userProgress[`mission-${m.order}`] || userProgress[`les-${m.order}`];
    return !!p?.isCompleted;
  });
  const completedCount = completedMissions.length;

  const totalStars = allMissions.reduce((acc, m) => {
    const p = userProgress[m.id] || userProgress[`mission-${m.order}`] || userProgress[`les-${m.order}`];
    return acc + (p?.starsEarned || 0);
  }, 0);

  const missionProgressPercent = Math.round((completedCount / totalMissions) * 100);

  const nextMission =
    allMissions.find((m) => {
      const p = userProgress[m.id] || userProgress[`mission-${m.order}`] || userProgress[`les-${m.order}`];
      return !p?.isCompleted && isMissionUnlocked(m.id);
    }) || allMissions[0];

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      setLoading(true);
      try {
        if (courseId === 'ECZ304' || courseId === 'c0000000-0000-0000-0000-000000000001') {
          setCourse(defaultEcz304Course);
        }

        const res = await api.courses.get(courseId);
        if (res.success && res.data) {
          setCourse(res.data);
        } else if (courseId === 'ECZ304' || courseId === 'c0000000-0000-0000-0000-000000000001') {
          setCourse(defaultEcz304Course);
        } else {
          setErrorMsg(res.error || 'Ders ayrıntıları yüklenemedi.');
        }
      } catch (e: any) {
        if (courseId === 'ECZ304' || courseId === 'c0000000-0000-0000-0000-000000000001') {
          setCourse(defaultEcz304Course);
        } else {
          setErrorMsg(e.message || 'Ders bilgisi alınırken hata oluştu.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const handleStudyConcept = async (conceptId?: string) => {
    try {
      const res = await api.study.getSession({
        course_id: courseId,
        concept_id: conceptId,
      });
      if (res.success && res.data?.session?.id) {
        navigate(`/app/study/${res.data.session.id}`);
      } else {
        setErrorMsg(res.error || 'Bu konu için henüz aktif çalışma sorusu bulunamadı.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Çalışma oturumu başlatılırken hata oluştu.');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16, color: '#64748B' }}>Ders izlencesi ve modüller yükleniyor...</Paragraph>
      </div>
    );
  }

  if (!course) {
    return (
      <div style={{ maxWidth: 800, margin: '60px auto', padding: '0 20px' }}>
        <Card bordered style={{ borderRadius: 16, textAlign: 'center' }}>
          <Alert message={errorMsg || 'Ders bulunamadı'} type="error" showIcon style={{ marginBottom: 16 }} />
          <Button onClick={() => navigate('/app/classrooms')}>Sınıflarıma Dön</Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '32px 16px 64px' }}>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/app/classrooms')}
        style={{ padding: 0, marginBottom: 16, color: '#64748B', fontWeight: 500 }}
      >
        Sınıflarıma Dön
      </Button>

      {/* Course Header Banner */}
      <Card
        bordered
        style={{
          borderRadius: 18,
          borderColor: '#E2E8F0',
          marginBottom: 28,
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
        }}
        bodyStyle={{ padding: 28 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ maxWidth: 720 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <Tag color="geekblue" style={{ borderRadius: 6, fontWeight: 700, padding: '2px 8px' }}>
                {course.code || 'ECZ304'}
              </Tag>
              {isMedicinalChemistry && (
                <Tag color="magenta" style={{ borderRadius: 6, fontWeight: 700 }}>
                  21 Klinik Görev & Simülasyon
                </Tag>
              )}
              <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600 }}>
                {course.faculty || 'Eczacılık Fakültesi'}
              </Tag>
              <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 600 }}>
                {course.term || 'Güz Dönemi'}
              </Tag>
              <Tag color="purple" style={{ borderRadius: 6, fontWeight: 600 }}>
                3 Kredi
              </Tag>
            </div>

            <Title level={2} style={{ margin: '0 0 10px 0', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.3px' }}>
              {course.title || 'Farmasötik ve Medisinal Kimya'}
            </Title>
            <Paragraph style={{ color: '#94A3B8', fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
              {course.description ||
                'Prof. Dr. Bedia Kaymakçıoğlu ders notlarından modellenmiş, aktif çıkarım ve Brilliant-tarzı interaktif 21 Klinik Kurtarma Görevi ve Moleküler Tasarım Laboratuvarı.'}
            </Paragraph>

            {/* Progress HUD */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                borderRadius: 12,
                padding: '12px 18px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <span style={{ color: '#94A3B8', fontSize: 12, display: 'block' }}>Laboratuvar İlerlemesi</span>
                <span style={{ color: '#38BDF8', fontWeight: 800, fontSize: 16 }}>
                  {completedCount} / {totalMissions} Görev (%{missionProgressPercent})
                </span>
              </div>
              <div style={{ width: 1, height: 28, backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
              <div>
                <span style={{ color: '#94A3B8', fontSize: 12, display: 'block' }}>Kazanılan Yıldızlar</span>
                <span style={{ color: '#FBBF24', fontWeight: 800, fontSize: 16 }}>
                  <StarFilled style={{ marginRight: 4 }} />
                  {totalStars} / 63 Yıldız
                </span>
              </div>
              <div style={{ width: 1, height: 28, backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
              <div>
                <span style={{ color: '#94A3B8', fontSize: 12, display: 'block' }}>Günlük Seri & XP</span>
                <span style={{ color: '#34D399', fontWeight: 800, fontSize: 16 }}>
                  <FireOutlined style={{ marginRight: 4 }} />
                  {gamification.streak} Gün • {gamification.xp} XP
                </span>
              </div>
            </div>

            <div style={{ marginTop: 12, maxWidth: 600 }}>
              <Progress
                percent={missionProgressPercent}
                strokeColor={{ '0%': '#2563EB', '100%': '#10B981' }}
                trailColor="rgba(255, 255, 255, 0.15)"
                showInfo={false}
                size={['100%', 6]}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 220 }}>
            <Button
              type="primary"
              size="large"
              icon={<ThunderboltOutlined />}
              onClick={() => navigate(`/learn/mission/${nextMission.id}`)}
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
                borderColor: '#4F46E5',
                borderRadius: 10,
                height: 46,
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              }}
            >
              Sıradaki Görevi Kurtar (Görev {nextMission.order})
            </Button>

            <Button
              size="large"
              icon={<CompassOutlined />}
              onClick={() => navigate('/learn')}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                borderRadius: 10,
                height: 44,
                fontWeight: 600,
              }}
            >
              Tüm Görev Haritası (21 Görev)
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs navigation: 21 Missions vs Concepts */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginBottom: 24 }}
        items={[
          {
            key: 'missions',
            label: (
              <span style={{ fontSize: 15, fontWeight: 700 }}>
                <ExperimentOutlined style={{ marginRight: 6 }} />
                21 Klinik Kurtarma Görevi & Laboratuvar ({completedCount}/{totalMissions})
              </span>
            ),
            children: (
              <div>
                {/* Curriculum Description & Summary */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 20,
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <Title level={3} style={{ fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      Müfredat Modülleri & 21 Klinik Kurtarma Görevi
                    </Title>
                    <Paragraph style={{ color: '#64748B', margin: '4px 0 0 0', fontSize: 14 }}>
                      6 modüle dağılmış 21 yüksek riskli klinik vaka simülasyonu. Her görevde bozulan molekülü kurtarın ve hastayı stabilize edin.
                    </Paragraph>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag color="green" style={{ borderRadius: 6, fontWeight: 700 }}>
                      <CheckCircleFilled style={{ marginRight: 4 }} />
                      {completedCount} Tamamlandı
                    </Tag>
                    <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700 }}>
                      <PlayCircleFilled style={{ marginRight: 4 }} />
                      {totalMissions - completedCount} Bekliyor
                    </Tag>
                  </div>
                </div>

                {/* All 6 Modules & 21 Clinical Rescue Missions Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  {MEDICINAL_CHEMISTRY_MODULES.map((module) => {
                    const badgeConfig = getModuleBadgeConfig(module.colorTheme);
                    const moduleMissions = module.missions;
                    const moduleCompleted = moduleMissions.filter((m) => {
                      const p = userProgress[m.id] || userProgress[`mission-${m.order}`] || userProgress[`les-${m.order}`];
                      return !!p?.isCompleted;
                    }).length;

                    return (
                      <Card
                        key={module.id}
                        bordered
                        style={{
                          borderRadius: 16,
                          borderColor: badgeConfig.border,
                          boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                          overflow: 'hidden',
                        }}
                        headStyle={{
                          backgroundColor: badgeConfig.headerBg,
                          borderBottom: `1px solid ${badgeConfig.border}`,
                          padding: '16px 24px',
                        }}
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Tag color={badgeConfig.tagColor} style={{ borderRadius: 6, fontWeight: 800, fontSize: 13, padding: '2px 10px', margin: 0 }}>
                                Modül {module.moduleNumber}
                              </Tag>
                              <Tag style={{ borderRadius: 6, fontWeight: 700, margin: 0, backgroundColor: '#FFFFFF', color: badgeConfig.text, borderColor: badgeConfig.border }}>
                                {module.badgeText}
                              </Tag>
                              <span style={{ fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
                                {module.title}
                              </span>
                            </div>
                            <Tag color={moduleCompleted === moduleMissions.length ? 'green' : 'blue'} style={{ borderRadius: 6, fontWeight: 700, margin: 0 }}>
                              {moduleCompleted} / {moduleMissions.length} Tamamlandı
                            </Tag>
                          </div>
                        }
                      >
                        {module.shortDescription && (
                          <Paragraph style={{ color: '#64748B', fontSize: 13, marginBottom: 20 }}>
                            {module.shortDescription}
                          </Paragraph>
                        )}

                        <Row gutter={[16, 16]}>
                          {moduleMissions.map((mission) => {
                            const progress =
                              userProgress[mission.id] ||
                              userProgress[`mission-${mission.order}`] ||
                              userProgress[`les-${mission.order}`];
                            const isCompleted = !!progress?.isCompleted;
                            const starsEarned = progress?.starsEarned || 0;
                            const isUnlocked = isMissionUnlocked(mission.id);
                            const isNext = isUnlocked && !isCompleted && nextMission?.id === mission.id;

                            return (
                              <Col xs={24} lg={12} key={mission.id}>
                                <Card
                                  type="inner"
                                  bordered
                                  style={{
                                    borderRadius: 12,
                                    borderColor: isNext ? '#3B82F6' : isCompleted ? '#86EFAC' : '#E2E8F0',
                                    backgroundColor: isNext ? '#F0F9FF' : isCompleted ? '#F0FDF4' : isUnlocked ? '#FFFFFF' : '#F8FAFC',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    boxShadow: isNext ? '0 4px 14px rgba(59, 130, 246, 0.15)' : 'none',
                                    transition: 'all 0.2s ease',
                                  }}
                                  bodyStyle={{ padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}
                                >
                                  <div>
                                    {/* Mission Card Top Bar: Order, Tags & Status */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        <Tag color={isNext ? 'blue' : 'geekblue'} style={{ borderRadius: 6, fontWeight: 800, margin: 0 }}>
                                          Görev {mission.order}
                                        </Tag>
                                        <Tag style={{ borderRadius: 6, fontSize: 11, fontWeight: 600, margin: 0 }}>
                                          {mission.conceptTag || mission.title}
                                        </Tag>
                                      </div>

                                      <div>
                                        {isCompleted ? (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Tag color="green" style={{ borderRadius: 6, fontWeight: 700, margin: 0 }}>
                                              <CheckCircleFilled style={{ marginRight: 4 }} />
                                              Tamamlandı
                                            </Tag>
                                            <Tag color="gold" style={{ borderRadius: 6, fontWeight: 700, margin: 0 }}>
                                              <StarFilled style={{ marginRight: 4 }} />
                                              {starsEarned}/3
                                            </Tag>
                                          </div>
                                        ) : isNext ? (
                                          <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700, margin: 0 }}>
                                            <PlayCircleFilled style={{ marginRight: 4 }} />
                                            Sıradaki
                                          </Tag>
                                        ) : isUnlocked ? (
                                          <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 600, margin: 0 }}>
                                            Açık
                                          </Tag>
                                        ) : (
                                          <Tag style={{ borderRadius: 6, color: '#94A3B8', margin: 0 }}>
                                            <LockFilled style={{ marginRight: 4 }} />
                                            Kilitli
                                          </Tag>
                                        )}
                                      </div>
                                    </div>

                                    {/* Mission Title & Subtitle */}
                                    <Title level={5} style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                                      Görev {mission.order}: {mission.title}
                                    </Title>
                                    <Text style={{ fontSize: 13, color: '#64748B', display: 'block', marginBottom: 12 }}>
                                      {mission.subtitle}
                                    </Text>

                                    {/* Crisis Summary Box */}
                                    <div
                                      style={{
                                        backgroundColor: isUnlocked ? 'rgba(241, 245, 249, 0.7)' : 'rgba(226, 232, 240, 0.4)',
                                        borderRadius: 8,
                                        padding: '10px 12px',
                                        marginBottom: 14,
                                        border: '1px solid rgba(226, 232, 240, 0.8)',
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                        <MedicineBoxOutlined style={{ color: '#EF4444', fontSize: 13 }} />
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626' }}>
                                          {mission.clinicalCrisis.patientCode || 'HASTA'} ({mission.clinicalCrisis.patientAgeGender || 'Yetişkin'})
                                        </span>
                                        <span style={{ color: '#94A3B8', fontSize: 11 }}>•</span>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: '#0284C7' }}>
                                          {mission.targetTargetName}
                                        </span>
                                      </div>
                                      <div style={{ fontSize: 12, color: '#334155', marginBottom: 4 }}>
                                        <strong style={{ color: '#D97706' }}>Hatalı Molekül:</strong> {mission.failingMoleculeName}
                                      </div>
                                      <Paragraph
                                        ellipsis={{ rows: 2 }}
                                        style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.5 }}
                                      >
                                        <strong>Klinik Kriz:</strong> {mission.clinicalCrisis.presentation} — {mission.clinicalCrisis.biochemicalFlaw}
                                      </Paragraph>
                                    </div>

                                    {/* Meta info: duration & XP */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, fontSize: 12, color: '#64748B' }}>
                                      <span>⏱️ ~{mission.estimatedMinutes} dk</span>
                                      <span>⚡ +{mission.xpReward} XP</span>
                                      {mission.difficulty && (
                                        <Tag style={{ borderRadius: 4, fontSize: 11, margin: 0 }}>
                                          {mission.difficulty === 'beginner'
                                            ? 'Temel'
                                            : mission.difficulty === 'intermediate'
                                            ? 'Orta'
                                            : 'İleri Seviye'}
                                        </Tag>
                                      )}
                                    </div>
                                  </div>

                                  {/* Direct 1-Click Launch Button */}
                                  <div>
                                    {isUnlocked ? (
                                      <Button
                                        block
                                        type={isNext ? 'primary' : isCompleted ? 'default' : 'primary'}
                                        ghost={isCompleted}
                                        icon={<PlayCircleOutlined />}
                                        onClick={() => navigate(`/learn/mission/${mission.id}`)}
                                        style={{
                                          borderRadius: 8,
                                          height: 38,
                                          fontWeight: 700,
                                          backgroundColor: isNext ? '#2563EB' : isCompleted ? undefined : '#2563EB',
                                          borderColor: isCompleted ? '#10B981' : '#2563EB',
                                          color: isCompleted ? '#059669' : undefined,
                                        }}
                                      >
                                        {isCompleted
                                          ? `Tekrar Oyna (${starsEarned} Yıldız)`
                                          : isNext
                                          ? 'Sıradaki Görevi Kurtar'
                                          : 'Görevi Başlat'}
                                      </Button>
                                    ) : (
                                      <Button
                                        block
                                        disabled
                                        icon={<LockOutlined />}
                                        style={{ borderRadius: 8, height: 38 }}
                                      >
                                        Önceki Görevi Tamamlayın
                                      </Button>
                                    )}
                                  </div>
                                </Card>
                              </Col>
                            );
                          })}
                        </Row>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ),
          },
          {
            key: 'concepts',
            label: (
              <span style={{ fontSize: 15, fontWeight: 700 }}>
                <FileTextOutlined style={{ marginRight: 6 }} />
                Müfredat Konuları & Sokratik Sorular ({course.modules?.length || 6} Modül)
              </span>
            ),
            children: (
              <div>
                <Title level={3} style={{ fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>
                  Müfredat Modülleri & Temel Kavramlar
                </Title>

                {(!course.modules || course.modules.length === 0) ? (
                  <Card bordered style={{ borderRadius: 12, textAlign: 'center', padding: '32px 0' }}>
                    <FileTextOutlined style={{ fontSize: 32, color: '#94A3B8', marginBottom: 8 }} />
                    <Paragraph style={{ color: '#64748B' }}>
                      Eğitmen tarafından henüz yapılandırılmış bir modül eklenmemiştir.
                    </Paragraph>
                  </Card>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {course.modules.map((module: any, idx: number) => (
                      <Card
                        key={module.id || idx}
                        bordered
                        style={{ borderRadius: 14, borderColor: '#E2E8F0' }}
                        title={
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Tag style={{ borderRadius: 4, fontWeight: 700 }}>Modül {idx + 1}</Tag>
                            <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{module.title}</span>
                          </div>
                        }
                      >
                        {module.description && (
                          <Paragraph style={{ color: '#64748B', marginBottom: 16 }}>
                            {module.description}
                          </Paragraph>
                        )}

                        {module.concepts && module.concepts.length > 0 ? (
                          <Row gutter={[12, 12]}>
                            {module.concepts.map((concept: any) => (
                              <Col xs={24} sm={12} key={concept.id}>
                                <Card
                                  type="inner"
                                  bordered
                                  style={{
                                    borderRadius: 8,
                                    borderColor: '#E2E8F0',
                                    backgroundColor: '#F8FAFC',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    height: '100%',
                                  }}
                                >
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                      <Text strong style={{ fontSize: 14, color: '#0F172A' }}>
                                        {concept.name}
                                      </Text>
                                      <Tag color="green" style={{ borderRadius: 4, fontSize: 11 }}>
                                        Hedef %85
                                      </Tag>
                                    </div>
                                    <Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: 12, color: '#64748B', margin: '0 0 12px 0' }}>
                                      {concept.description || 'Aktif hatırlama pratiği için temel kavram.'}
                                    </Paragraph>
                                  </div>
                                  <Button
                                    size="small"
                                    type="primary"
                                    ghost
                                    icon={<PlayCircleOutlined />}
                                    onClick={() => handleStudyConcept(concept.id)}
                                    style={{ borderRadius: 6, width: '100%', borderColor: '#2563EB', color: '#2563EB' }}
                                  >
                                    Kavramı Çalış
                                  </Button>
                                </Card>
                              </Col>
                            ))}
                          </Row>
                        ) : (
                          <div style={{ fontStyle: 'italic', color: '#94A3B8', fontSize: 13 }}>
                            Bu modüle ait kavramlar şu anda eğitmen inceleme ve onay aşamasındadır.
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};
