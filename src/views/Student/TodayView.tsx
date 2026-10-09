import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Button, Tag, Progress, Spin } from 'antd';
import {
  HistoryOutlined,
  PlayCircleOutlined,
  BookOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { api } from '../../lib/api';

const { Title, Paragraph, Text } = Typography;

export const TodayView: React.FC = () => {
  const { profile } = useAuth();
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(true);
  const [reviewsDue, setReviewsDue] = useState<number>(0);
  const [courses, setCourses] = useState<any[]>([]);
  const [recommendedConcept, setRecommendedConcept] = useState<any>(null);
  const [overallMastery, setOverallMastery] = useState<number>(0);

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
        if (courseRes.success && courseRes.data) {
          setCourses(courseRes.data);
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
        <Paragraph style={{ marginTop: 16, color: '#64748B' }}>Preparing your daily study plan...</Paragraph>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '32px 16px 64px' }}>
      {/* Greeting & Daily Target Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Tag color="blue" style={{ borderRadius: 12 }}>Daily Target: ~25 Minutes</Tag>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
        </div>
        <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
          Good day, {profile?.full_name?.split(' ')[0] || 'Scholar'}.
        </Title>
        <Text style={{ fontSize: 15, color: '#64748B' }}>
          Here is your recommended active retrieval sequence for today.
        </Text>
      </div>

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
                  <ClockCircleOutlined style={{ marginRight: 4 }} /> Focused Active Session
                </Tag>
                <Title level={3} style={{ color: '#FFFFFF', margin: '0 0 8px 0', fontWeight: 700 }}>
                  {recommendedConcept ? recommendedConcept.name : 'Today’s Retrieval Practice'}
                </Title>
                <Paragraph style={{ color: '#94A3B8', fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
                  {recommendedConcept?.description ||
                    'Review key concepts with closed-book retrieval questions and graduated Socratic guidance.'}
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
                  Start ~25 Min Study Session
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
                    Target Mastery
                  </Text>
                  <div style={{ fontSize: 36, fontWeight: 800, color: '#38BDF8', margin: '4px 0' }}>
                    {recommendedConcept?.mastery_score ? `${recommendedConcept.mastery_score}%` : '85%'}
                  </div>
                  <Text style={{ color: '#94A3B8', fontSize: 12 }}>Retention threshold</Text>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Active Courses / Enrolled Learning */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Title level={4} style={{ margin: 0, color: '#0F172A' }}>
                Active Courses
              </Title>
              <Button type="link" onClick={() => navigate('/app/classrooms')} style={{ padding: 0 }}>
                View All <RightOutlined style={{ fontSize: 11 }} />
              </Button>
            </div>

            {courses.length === 0 ? (
              <Card bordered style={{ borderRadius: 12, textAlign: 'center', padding: '24px 0' }}>
                <BookOutlined style={{ fontSize: 32, color: '#94A3B8', marginBottom: 8 }} />
                <Paragraph style={{ color: '#64748B', margin: 0 }}>
                  You are not yet enrolled in any courses.
                </Paragraph>
                <Button
                  type="primary"
                  onClick={() => navigate('/app/classrooms')}
                  style={{ marginTop: 12, backgroundColor: '#2563EB', borderRadius: 6 }}
                >
                  Browse or Join Classrooms
                </Button>
              </Card>
            ) : (
              <Row gutter={[16, 16]}>
                {courses.slice(0, 2).map((c) => (
                  <Col xs={24} sm={12} key={c.id}>
                    <Card
                      hoverable
                      bordered
                      style={{ borderRadius: 12, borderColor: '#E2E8F0', height: '100%' }}
                      onClick={() => navigate(`/app/courses/${c.id}`)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Tag color="geekblue">{c.code || 'COURSE'}</Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {c.modules?.length || 0} Modules
                        </Text>
                      </div>
                      <Title level={5} style={{ margin: '4px 0 8px 0', fontSize: 16 }}>
                        {c.title}
                      </Title>
                      <Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                        {c.description || 'Structured academic retrieval module.'}
                      </Paragraph>
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
              borderColor: '#E2E8F0',
              marginBottom: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <HistoryOutlined style={{ fontSize: 18, color: '#7C3AED' }} />
                <Text strong style={{ fontSize: 16 }}>Spaced Reviews</Text>
              </div>
              <Tag color={reviewsDue > 0 ? 'red' : 'green'}>
                {reviewsDue > 0 ? `${reviewsDue} Due` : 'Caught Up'}
              </Tag>
            </div>
            <Paragraph style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
              Concepts scheduled at 1, 3, 7, and 14-day intervals to consolidate memory before forgetting occurs.
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
              {reviewsDue > 0 ? `Review ${reviewsDue} Due Concepts` : 'All Caught Up Today'}
            </Button>
          </Card>

          {/* Timed Exams Banner */}
          <Card
            bordered
            style={{
              borderRadius: 14,
              borderColor: '#E2E8F0',
              marginBottom: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <TrophyOutlined style={{ fontSize: 18, color: '#D97706' }} />
              <Text strong style={{ fontSize: 16 }}>Timed Mock Exams</Text>
            </div>
            <Paragraph style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
              Take server-enforced timed exams with instant question analysis and personalized concept remediation.
            </Paragraph>
            <Button block onClick={() => navigate('/app/exams')} style={{ borderRadius: 8 }}>
              Open Mock Exam Center
            </Button>
          </Card>

          {/* Current Mastery Metric */}
          <Card
            bordered
            style={{ borderRadius: 14, borderColor: '#E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text strong>Overall Concept Mastery</Text>
              <Text strong style={{ color: '#2563EB' }}>{overallMastery}%</Text>
            </div>
            <Progress percent={overallMastery} strokeColor="#2563EB" showInfo={false} />
            <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
              Computed from demonstrated retrieval accuracy and hint independence.
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
