import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Button, Tag, Progress, Spin } from 'antd';
import {
  HistoryOutlined,
  PlayCircleOutlined,
  BookOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  RightOutlined,
  ThunderboltOutlined,
  CompassOutlined,
  ExperimentOutlined,
  MedicineBoxOutlined,
  CheckCircleOutlined,
  StarFilled,
  FireOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { useMicrolearning } from '../../context/MicrolearningContext';
import { getAllMissions } from '../../data/courses/medicinalChemistryMissions';
import { api } from '../../lib/api';

const { Title, Paragraph, Text } = Typography;

const defaultMedicinalCourse = {
  id: 'c0000000-0000-0000-0000-000000000001',
  code: 'ECZ304',
  title: 'Farmasötik ve Medisinal Kimya',
  description: 'Prof. Dr. Bedia Kaymakçıoğlu ders notlarından modellenmiş, aktif çıkarım ve Brilliant-tarzı interaktif 21 Klinik Kurtarma Görevi ve Moleküler Tasarım Laboratuvarı.',
  modules: [
    { id: 'mod-1', title: 'Modül 1: Fonksiyonel Gruplar & Moleküler İskelet' },
    { id: 'mod-2', title: 'Modül 2: İlaç-Reseptör Bağları & Termodinamik' },
    { id: 'mod-3', title: 'Modül 3: İzomeri & Stereokimya' },
    { id: 'mod-4', title: 'Modül 4: Biyoizosterizm İlkeleri' },
    { id: 'mod-5', title: 'Modül 5: SAR & Çözünürlük İlkeleri' },
    { id: 'mod-6', title: 'Modül 6: İlaç Metabolizması (Biyotransformasyon)' },
  ],
};

export const TodayView: React.FC = () => {
  const { profile } = useAuth();
  const { navigate } = useRouter();
  const { userProgress, isMissionUnlocked, gamification } = useMicrolearning();
  const [loading, setLoading] = useState(true);
  const [reviewsDue, setReviewsDue] = useState<number>(0);
  const [courses, setCourses] = useState<any[]>([]);
  const [recommendedConcept, setRecommendedConcept] = useState<any>(null);
  const [overallMastery, setOverallMastery] = useState<number>(0);

  // Mission progression computations
  const allMissions = getAllMissions();
  const totalMissions = allMissions.length;

  const completedMissions = allMissions.filter((m) => {
    const p = userProgress[m.id] || userProgress[`mission-${m.order}`] || userProgress[`les-${m.order}`];
    return !!p?.isCompleted;
  });
  const completedCount = completedMissions.length;

  const totalMissionStars = allMissions.reduce((acc, m) => {
    const p = userProgress[m.id] || userProgress[`mission-${m.order}`] || userProgress[`les-${m.order}`];
    return acc + (p?.starsEarned || 0);
  }, 0);

  const missionProgressPercent = Math.round((completedCount / totalMissions) * 100);

  const nextMission =
    allMissions.find((m) => {
      const p = userProgress[m.id] || userProgress[`mission-${m.order}`] || userProgress[`les-${m.order}`];
      return !p?.isCompleted && isMissionUnlocked(m.id);
    }) || allMissions[0];

  const isAllMissionsCompleted = completedCount === totalMissions;

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        // Fetch review queue
        const revRes = await api.reviews.getQueue();
        if (revRes.success && revRes.data) {
          setReviewsDue(revRes.data.length);
        }

        // Fetch courses
        const courseRes = await api.courses.list();
        if (courseRes.success && courseRes.data && Array.isArray(courseRes.data) && courseRes.data.length > 0) {
          const hasEcz304 = courseRes.data.some(
            (c: any) => c.code === 'ECZ304' || c.id === defaultMedicinalCourse.id
          );
          setCourses(hasEcz304 ? courseRes.data : [defaultMedicinalCourse, ...courseRes.data]);
        } else {
          setCourses([defaultMedicinalCourse]);
        }

        // Fetch analytics
        const anaRes = await api.analytics.getStudentProgress();
        if (anaRes.success && anaRes.data) {
          setOverallMastery(anaRes.data.average_mastery_pct || 0);
          if (anaRes.data.concepts && anaRes.data.concepts.length > 0) {
            // Find concept needing practice
            const candidate =
              anaRes.data.concepts.find((c: any) => c.mastery_score < 70) ||
              anaRes.data.concepts[0];
            setRecommendedConcept(candidate);
          }
        }
      } catch (err) {
        console.error('Error loading Today dashboard:', err);
        setCourses([defaultMedicinalCourse]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleStartDailyStudy = async () => {
    // Start or resume a study session
    const res = await api.study.getSession({
      course_id: courses[0]?.id,
      concept_id: recommendedConcept?.id,
    });
    if (res.success && res.data) {
      navigate(`/app/study/${res.data.session.id}`);
    } else {
      // Direct to courses if no session
      navigate('/app/classrooms');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16, color: '#64748B' }}>Günlük çalışma planınız hazırlanıyor...</Paragraph>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '32px 16px 64px' }}>
      {/* Greeting & Daily Target Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Tag color="blue" style={{ borderRadius: 12 }}>Günün Hedefi: ~25 Dakika</Tag>
          <Text type="secondary" style={{ fontSize: 13, color: '#94A3B8' }}>
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
        </div>
        <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#F8FAFC' }}>
          İyi çalışmalar, {profile?.full_name?.split(' ')[0] || 'Değerli Öğrencimiz'}.
        </Title>
        <Text style={{ fontSize: 15, color: '#94A3B8' }}>
          Bugün için hazırlanan interaktif klinik kurtarma laboratuvarı ve aktif hatırlama programınız:
        </Text>
      </div>

      {/* Prominent High-Yield Clinical Rescue & Molecular Design Lab Hero Card */}
      <Card
        bordered
        style={{
          borderRadius: 18,
          background: 'linear-gradient(135deg, #0B1120 0%, #1E1B4B 50%, #0F172A 100%)',
          color: '#FFFFFF',
          borderColor: '#4338CA',
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.25)',
          marginBottom: 28,
          position: 'relative',
          overflow: 'hidden',
        }}
        bodyStyle={{ padding: '28px 32px' }}
      >
        {/* Glow Accent */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(99, 102, 241, 0) 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Card Header & Badges */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Tag
              color="#DC2626"
              style={{
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 12,
                padding: '4px 10px',
                border: 'none',
              }}
            >
              🔴 ACİL KLİNİK VAKA ÇAĞRISI
            </Tag>
            <Tag
              color="#4F46E5"
              style={{
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 12,
                padding: '4px 10px',
                border: 'none',
              }}
            >
              Modül {nextMission.moduleId.replace('mod-', '')}: {nextMission.moduleTitle}
            </Tag>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Tag
              style={{
                backgroundColor: 'rgba(234, 88, 12, 0.15)',
                color: '#FB923C',
                borderColor: 'rgba(234, 88, 12, 0.3)',
                borderRadius: 8,
                fontWeight: 700,
                padding: '4px 10px',
              }}
            >
              <FireOutlined style={{ marginRight: 4 }} />
              {gamification.streak} Günlük Seri
            </Tag>
            <Tag
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#FBBF24',
                borderColor: 'rgba(245, 158, 11, 0.3)',
                borderRadius: 8,
                fontWeight: 700,
                padding: '4px 10px',
              }}
            >
              <StarFilled style={{ marginRight: 4 }} />
              {totalMissionStars} / 63 Yıldız
            </Tag>
            <Tag
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#34D399',
                borderColor: 'rgba(16, 185, 129, 0.3)',
                borderRadius: 8,
                fontWeight: 700,
                padding: '4px 10px',
              }}
            >
              <ExperimentOutlined style={{ marginRight: 4 }} />
              Görev {completedCount} / {totalMissions} Tamamlandı
            </Tag>
            <Tag
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: '#60A5FA',
                borderColor: 'rgba(59, 130, 246, 0.3)',
                borderRadius: 8,
                fontWeight: 700,
                padding: '4px 10px',
              }}
            >
              <ThunderboltOutlined style={{ marginRight: 4 }} />
              +{nextMission.xpReward} XP ({gamification.xp} Toplam)
            </Tag>
          </div>
        </div>

        {/* Title and Subtitle */}
        <Title
          level={2}
          style={{
            color: '#FFFFFF',
            margin: '0 0 6px 0',
            fontWeight: 800,
            fontSize: 24,
            letterSpacing: '-0.3px',
          }}
        >
          Klinik Kurtarma & İlaç Tasarım Laboratuvarı
        </Title>
        <Text style={{ color: '#A5B4FC', fontSize: 15, fontWeight: 500, display: 'block', marginBottom: 20 }}>
          {isAllMissionsCompleted
            ? 'Tüm 21 Klinik Görevi başarıyla kurtardınız! Dilediğiniz vakayı yeniden optimize ederek 3 yıldız rekorunu tazeleyebilirsiniz.'
            : `Sıradaki Kritik Vaka — Görev ${nextMission.order}: ${nextMission.title} (${nextMission.subtitle})`}
        </Text>

        {/* Emergency Crisis Case Dispatch Telemetry Box */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            borderRadius: 14,
            border: '1px solid rgba(99, 102, 241, 0.35)',
            padding: '20px 24px',
            marginBottom: 20,
            backdropFilter: 'blur(8px)',
          }}
        >
          <Row gutter={[20, 16]} align="middle">
            <Col xs={24} md={15}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <MedicineBoxOutlined style={{ color: '#F87171', fontSize: 18 }} />
                <span style={{ color: '#F87171', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {nextMission.clinicalCrisis.patientCode || 'HASTA-ACIL-VAKA'} ({nextMission.clinicalCrisis.patientAgeGender || 'Yetişkin Hasta'})
                </span>
                <span style={{ color: '#64748B' }}>•</span>
                <span style={{ color: '#38BDF8', fontSize: 13, fontWeight: 600 }}>
                  {nextMission.targetTargetName}
                </span>
              </div>

              <div style={{ marginBottom: 10 }}>
                <span style={{ color: '#94A3B8', fontSize: 13, fontWeight: 600 }}>Tehdit Eden Molekül: </span>
                <span style={{ color: '#FCD34D', fontSize: 14, fontWeight: 700 }}>
                  {nextMission.failingMoleculeName}
                </span>
              </div>

              <Paragraph
                style={{
                  color: '#CBD5E1',
                  fontSize: 14,
                  lineHeight: 1.6,
                  margin: 0,
                  maxWidth: 680,
                }}
              >
                <strong style={{ color: '#FFFFFF' }}>Klinik Tablo:</strong> {nextMission.clinicalCrisis.presentation}.{' '}
                <span style={{ color: '#94A3B8' }}>{nextMission.clinicalCrisis.biochemicalFlaw}</span>
              </Paragraph>
            </Col>

            <Col xs={24} md={9}>
              <div
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 12,
                  padding: '14px 18px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94A3B8', fontSize: 12 }}>Hasta Vital Durumu:</span>
                  <Tag color="red" style={{ margin: 0, fontWeight: 700, borderRadius: 6 }}>
                    KRİTİK
                  </Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94A3B8', fontSize: 12 }}>Nabız / Tansiyon:</span>
                  <span style={{ color: '#F87171', fontWeight: 700, fontSize: 13 }}>
                    {nextMission.clinicalCrisis.patientInitialVitals.heartRate || nextMission.clinicalCrisis.patientInitialVitals.heartRateBpm} bpm / {nextMission.clinicalCrisis.patientInitialVitals.bloodPressure || `${nextMission.clinicalCrisis.patientInitialVitals.bloodPressureSys}/${nextMission.clinicalCrisis.patientInitialVitals.bloodPressureDia}`}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94A3B8', fontSize: 12 }}>Sistemik Stabilite:</span>
                  <span style={{ color: '#FBBF24', fontWeight: 800, fontSize: 13 }}>
                    %{nextMission.clinicalCrisis.patientInitialVitals.overallStabilityScore || 25}
                  </span>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        {/* Progress Bar & Summary */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ color: '#94A3B8', fontSize: 13, fontWeight: 600 }}>
              Klinik Kurtarma Müfredat İlerlemesi ({completedCount} / {totalMissions} Görev Tamamlandı)
            </span>
            <span style={{ color: '#38BDF8', fontSize: 14, fontWeight: 800 }}>
              %{missionProgressPercent}
            </span>
          </div>
          <Progress
            percent={missionProgressPercent}
            strokeColor={{
              '0%': '#4F46E5',
              '50%': '#2563EB',
              '100%': '#10B981',
            }}
            trailColor="rgba(255, 255, 255, 0.12)"
            showInfo={false}
            size={['100%', 8]}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Button
            type="primary"
            size="large"
            icon={<ThunderboltOutlined />}
            onClick={() => navigate(`/learn/mission/${nextMission.id}`)}
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
              borderColor: '#4F46E5',
              borderRadius: 10,
              height: 'auto',
              minHeight: 46,
              padding: '10px 24px',
              fontWeight: 700,
              fontSize: 15,
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
              whiteSpace: 'normal',
              textAlign: 'left',
            }}
          >
            {isAllMissionsCompleted
              ? 'Laboratuvarı Baştan Oyna (Görev 1)'
              : `Sıradaki Klinik Görevi Kurtar (Görev ${nextMission.order}: ${nextMission.title})`}
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
              height: 46,
              padding: '0 20px',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Tüm Görev Haritası (21 Görev)
          </Button>

          <Button
            type="link"
            icon={<BookOutlined />}
            onClick={() => navigate('/app/courses/c0000000-0000-0000-0000-000000000001')}
            style={{
              color: '#93C5FD',
              fontWeight: 600,
              padding: '0 8px',
              height: 46,
            }}
          >
            ECZ304 Ders İzlencesi
          </Button>
        </div>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Main Recommendation Column */}
        <Col xs={24} lg={16}>
          {/* Primary Study Call to Action Card */}
          <Card
            bordered
            style={{
              borderRadius: 16,
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              color: '#FFFFFF',
              borderColor: '#334155',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
              marginBottom: 24,
            }}
            bodyStyle={{ padding: 28 }}
          >
            <Row align="middle" gutter={[20, 20]}>
              <Col xs={24} sm={16}>
                <Tag color="cyan" style={{ borderRadius: 8, fontWeight: 600, marginBottom: 12 }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} /> Odaklı Aktif Oturum
                </Tag>
                <Title level={3} style={{ color: '#FFFFFF', margin: '0 0 8px 0', fontWeight: 700 }}>
                  {recommendedConcept ? recommendedConcept.name : 'Günün Aktif Hatırlama Pratiği'}
                </Title>
                <Paragraph style={{ color: '#94A3B8', fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
                  {recommendedConcept?.description ||
                    'Yetkili ders materyallerine dayalı kitapsız sorular ve 3 kademeli Sokratik yönlendirmeyle kavramları pekiştirin.'}
                </Paragraph>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlayCircleOutlined />}
                  onClick={handleStartDailyStudy}
                  style={{
                    backgroundColor: '#2563EB',
                    borderRadius: 8,
                    height: 44,
                    padding: '0 24px',
                    fontWeight: 600,
                  }}
                >
                  ~25 Dk Çalışma Oturumunu Başlat
                </Button>
              </Col>
              <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    padding: '20px',
                    borderRadius: 14,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Text style={{ color: '#94A3B8', fontSize: 12, display: 'block', textTransform: 'uppercase' }}>
                    Hedef Kavrama
                  </Text>
                  <div style={{ fontSize: 36, fontWeight: 800, color: '#38BDF8', margin: '4px 0' }}>
                    {recommendedConcept?.mastery_score ? `${recommendedConcept.mastery_score}%` : '85%'}
                  </div>
                  <Text style={{ color: '#94A3B8', fontSize: 12 }}>Kalıcılık eşiği</Text>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Active Courses / Enrolled Learning */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Title level={4} style={{ margin: 0, color: '#F8FAFC' }}>
                Kayıtlı Derslerim
              </Title>
              <Button type="link" onClick={() => navigate('/app/classrooms')} style={{ padding: 0 }}>
                Tümünü Gör <RightOutlined style={{ fontSize: 11 }} />
              </Button>
            </div>

            {courses.length === 0 ? (
              <Card bordered style={{ borderRadius: 12, textAlign: 'center', padding: '24px 0', borderColor: '#1E293B', backgroundColor: '#0F172A' }}>
                <BookOutlined style={{ fontSize: 32, color: '#94A3B8', marginBottom: 8 }} />
                <Paragraph style={{ color: '#94A3B8', margin: 0 }}>
                  Henüz kayıtlı olduğunuz bir ders bulunmuyor.
                </Paragraph>
                <Button
                  type="primary"
                  onClick={() => navigate('/app/classrooms')}
                  style={{ marginTop: 12, backgroundColor: '#2563EB', borderRadius: 6 }}
                >
                  Sınıflara Göz At veya Katıl
                </Button>
              </Card>
            ) : (
              <Row gutter={[16, 16]}>
                {courses.slice(0, 2).map((c) => (
                  <Col xs={24} sm={12} key={c.id}>
                    <Card
                      hoverable
                      bordered
                      style={{ borderRadius: 12, borderColor: '#1E293B', backgroundColor: '#0F172A', height: '100%' }}
                      onClick={() => navigate(`/app/courses/${c.id}`)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Tag color={c.code === 'ECZ304' ? 'purple' : 'geekblue'}>{c.code || 'DERS'}</Tag>
                        <Text type="secondary" style={{ fontSize: 12, color: '#94A3B8' }}>
                          {c.code === 'ECZ304' ? '6 Modül (21 Görev)' : `${c.modules?.length || 0} Modül`}
                        </Text>
                      </div>
                      <Title level={5} style={{ margin: '4px 0 8px 0', fontSize: 16, color: '#F8FAFC' }}>
                        {c.title}
                      </Title>
                      <Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>
                        {c.description || 'Yapılandırılmış akademik pratik modülü.'}
                      </Paragraph>
                      {c.code === 'ECZ304' && (
                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Tag color="cyan" style={{ borderRadius: 6, margin: 0 }}>
                            <CheckCircleOutlined style={{ marginRight: 4 }} />
                            {completedCount}/21 Görev
                          </Tag>
                          <Text type="secondary" style={{ fontSize: 12, color: '#94A3B8' }}>
                            Klinik Laboratuvar
                          </Text>
                        </div>
                      )}
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        </Col>

        {/* Sidebar / Memory Status Column */}
        <Col xs={24} lg={8}>
          {/* Spaced Review Queue Card */}
          <Card
            bordered
            style={{
              borderRadius: 14,
              borderColor: '#1E293B',
              backgroundColor: '#0F172A',
              marginBottom: 20,
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <HistoryOutlined style={{ fontSize: 18, color: '#A78BFA' }} />
                <Text strong style={{ fontSize: 16, color: '#F8FAFC' }}>Aralıklı Tekrarlar</Text>
              </div>
              <Tag color={reviewsDue > 0 ? 'red' : 'green'}>
                {reviewsDue > 0 ? `${reviewsDue} Bekliyor` : 'Tamamlandı'}
              </Tag>
            </div>
            <Paragraph style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5 }}>
              Unutma gerçekleşmeden önce bilginin pekişmesi için 1, 3, 7 ve 14 günlük aralıklarla planlanan kavramlar.
            </Paragraph>
            <Button
              block
              type={reviewsDue > 0 ? 'primary' : 'default'}
              disabled={reviewsDue === 0}
              onClick={() => navigate('/app/review')}
              style={{
                backgroundColor: reviewsDue > 0 ? '#7C3AED' : undefined,
                borderColor: reviewsDue > 0 ? '#7C3AED' : undefined,
                borderRadius: 8,
                fontWeight: 600,
              }}
            >
              {reviewsDue > 0 ? `${reviewsDue} Günü Gelen Kavramı Tekrar Et` : 'Bugünkü Tüm Tekrarlar Tamamlandı'}
            </Button>
          </Card>

          {/* Timed Exams Banner */}
          <Card
            bordered
            style={{
              borderRadius: 14,
              borderColor: '#1E293B',
              backgroundColor: '#0F172A',
              marginBottom: 20,
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <TrophyOutlined style={{ fontSize: 18, color: '#FBBF24' }} />
              <Text strong style={{ fontSize: 16, color: '#F8FAFC' }}>Süreli Deneme Sınavları</Text>
            </div>
            <Paragraph style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5 }}>
              Sunucu süre kontrollü deneme sınavlarına katılın; anlık soru analizi ve kişiselleştirilmiş eksik giderme raporu alın.
            </Paragraph>
            <Button block onClick={() => navigate('/app/exams')} style={{ borderRadius: 8 }}>
              Sınav Merkezine Git
            </Button>
          </Card>

          {/* Current Mastery Metric */}
          <Card
            bordered
            style={{ borderRadius: 14, borderColor: '#1E293B', backgroundColor: '#0F172A', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text strong style={{ color: '#F8FAFC' }}>Genel Kavram Hakimiyeti</Text>
              <Text strong style={{ color: '#38BDF8' }}>{overallMastery}%</Text>
            </div>
            <Progress percent={overallMastery} strokeColor="#2563EB" showInfo={false} />
            <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block', color: '#94A3B8' }}>
              Aktif hatırlama doğruluğu ve ipucu bağımsızlığına göre hesaplanmıştır.
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
