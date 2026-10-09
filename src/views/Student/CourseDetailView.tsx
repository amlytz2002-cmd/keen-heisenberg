import React, { useEffect, useState } from 'react';
import { Card, Typography, Button, Tag, Row, Col, Spin, Alert } from 'antd';
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useRouter } from '../../context/RouterContext';
import { api } from '../../lib/api';

const { Title, Paragraph, Text } = Typography;

export const CourseDetailView: React.FC = () => {
  const { params, navigate } = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const courseId = params.courseId;

  useEffect(() => {
    if (!courseId) return;
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const res = await api.courses.get(courseId);
        if (res.success && res.data) {
          setCourse(res.data);
        } else {
          setErrorMsg(res.error || 'Failed to load course details.');
        }
      } catch (e: any) {
        setErrorMsg(e.message || 'Error fetching course.');
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
        setErrorMsg(res.error || 'No active study questions found for this topic.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error launching study session');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16, color: '#64748B' }}>Loading syllabus...</Paragraph>
      </div>
    );
  }

  if (!course) {
    return (
      <div style={{ maxWidth: 800, margin: '60px auto', padding: '0 20px' }}>
        <Card bordered style={{ borderRadius: 16, textAlign: 'center' }}>
          <Alert message={errorMsg || 'Course not found'} type="error" showIcon style={{ marginBottom: 16 }} />
          <Button onClick={() => navigate('/app/classrooms')}>Back to Classrooms</Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 16px 64px' }}>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/app/classrooms')}
        style={{ padding: 0, marginBottom: 16, color: '#64748B' }}
      >
        Back to Classrooms
      </Button>

      {/* Header */}
      <Card
        bordered
        style={{
          borderRadius: 16,
          borderColor: '#E2E8F0',
          marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Tag color="blue" style={{ marginBottom: 8 }}>{course.code || 'COURSE'}</Tag>
            <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
              {course.title}
            </Title>
            <Paragraph style={{ color: '#64748B', marginTop: 8, maxWidth: 640 }}>
              {course.description || 'Core academic curriculum with active recall practice.'}
            </Paragraph>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={() => handleStudyConcept()}
            style={{ backgroundColor: '#2563EB', borderRadius: 8, height: 44, fontWeight: 600 }}
          >
            Start Course Study
          </Button>
        </div>
      </Card>

      {/* Modules & Concepts */}
      <Title level={3} style={{ fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>
        Syllabus Modules & Concepts
      </Title>

      {(!course.modules || course.modules.length === 0) ? (
        <Card bordered style={{ borderRadius: 12, textAlign: 'center', padding: '32px 0' }}>
          <FileTextOutlined style={{ fontSize: 32, color: '#94A3B8', marginBottom: 8 }} />
          <Paragraph style={{ color: '#64748B' }}>
            No structured modules have been uploaded yet by the instructor.
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
                  <Tag style={{ borderRadius: 4, fontWeight: 700 }}>Module {idx + 1}</Tag>
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
                              Target 85%
                            </Tag>
                          </div>
                          <Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: 12, color: '#64748B', margin: '0 0 12px 0' }}>
                            {concept.description || 'Key scientific concept for retrieval.'}
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
                          Practice Concept
                        </Button>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div style={{ fontStyle: 'italic', color: '#94A3B8', fontSize: 13 }}>
                  Concepts for this module are currently undergoing instructor review.
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
