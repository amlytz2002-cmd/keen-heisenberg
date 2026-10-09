import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Button, Statistic, Tag, Spin, Space } from 'antd';
import {
  TeamOutlined,
  BookOutlined,
  FileTextOutlined,
  PlusOutlined,
  UploadOutlined,
  SafetyCertificateOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import { useRouter } from '../../context/RouterContext';
import { api } from '../../lib/api';

const { Title, Paragraph, Text } = Typography;

export const TeachDashboardView: React.FC = () => {
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(true);
  const [classroomsCount, setClassroomsCount] = useState(0);
  const [coursesCount, setCoursesCount] = useState(0);
  const [resourcesCount, setResourcesCount] = useState(0);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      try {
        const [crRes, coRes, reRes, revRes] = await Promise.all([
          api.classrooms.list(),
          api.courses.list(),
          api.resources.list(),
          api.teach.getContentReview({ status: 'needs_review' }),
        ]);

        if (crRes.success && crRes.data) setClassroomsCount(crRes.data.length);
        if (coRes.success && coRes.data) setCoursesCount(coRes.data.length);
        if (reRes.success && reRes.data) setResourcesCount(reRes.data.length);
        if (revRes.success && revRes.data) {
          const concepts = revRes.data.concepts?.length || 0;
          const questions = revRes.data.questions?.length || 0;
          setPendingReviewCount(concepts + questions);
        }
      } catch (err) {
        console.error('Error fetching teach overview:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16, color: '#64748B' }}>Loading instructor hub...</Paragraph>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '32px 16px 64px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <Tag color="purple" style={{ marginBottom: 4 }}>Instructional Management</Tag>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
            Instructor Teaching Hub
          </Title>
          <Text style={{ fontSize: 15, color: '#64748B' }}>
            Classroom administration, document ingestion, AI curriculum generation, and publication gates.
          </Text>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/app/teach/classrooms')}
            style={{ backgroundColor: '#2563EB', borderRadius: 8, height: 40 }}
          >
            New Classroom
          </Button>
          <Button
            icon={<UploadOutlined />}
            onClick={() => navigate('/app/teach/resources')}
            style={{ borderRadius: 8, height: 40 }}
          >
            Upload Document
          </Button>
        </Space>
      </div>

      {/* Overview Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 14, borderColor: '#E2E8F0' }}>
            <Statistic
              title="Classrooms"
              value={classroomsCount}
              prefix={<TeamOutlined style={{ color: '#2563EB' }} />}
              valueStyle={{ fontWeight: 800, color: '#0F172A' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 14, borderColor: '#E2E8F0' }}>
            <Statistic
              title="Active Courses"
              value={coursesCount}
              prefix={<BookOutlined style={{ color: '#0284C7' }} />}
              valueStyle={{ fontWeight: 800, color: '#0F172A' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 14, borderColor: '#E2E8F0' }}>
            <Statistic
              title="Ingested Documents"
              value={resourcesCount}
              prefix={<FileTextOutlined style={{ color: '#D97706' }} />}
              valueStyle={{ fontWeight: 800, color: '#0F172A' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            bordered
            style={{
              borderRadius: 14,
              borderColor: pendingReviewCount > 0 ? '#FDE68A' : '#E2E8F0',
              backgroundColor: pendingReviewCount > 0 ? '#FFFBEB' : '#FFFFFF',
            }}
          >
            <Statistic
              title="Pending Content Review"
              value={pendingReviewCount}
              prefix={<SafetyCertificateOutlined style={{ color: '#D97706' }} />}
              valueStyle={{ fontWeight: 800, color: pendingReviewCount > 0 ? '#B45309' : '#059669' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Review Gate Banner */}
      {pendingReviewCount > 0 && (
        <Card
          bordered
          style={{
            borderRadius: 16,
            backgroundColor: '#FEF3C7',
            borderColor: '#FDE68A',
            marginBottom: 32,
          }}
          bodyStyle={{ padding: 24 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SafetyCertificateOutlined style={{ color: '#B45309', fontSize: 20 }} />
                <Title level={4} style={{ margin: 0, color: '#92400E' }}>
                  {pendingReviewCount} Generated Items Awaiting Review
                </Title>
              </div>
              <Paragraph style={{ color: '#78350F', margin: '4px 0 0 0', fontSize: 14 }}>
                Unverified AI items remain hidden from students until an instructor approves or publishes them.
              </Paragraph>
            </div>
            <Button
              type="primary"
              onClick={() => navigate('/app/teach/content-review')}
              style={{ backgroundColor: '#B45309', borderColor: '#B45309', borderRadius: 8, height: 40, fontWeight: 600 }}
            >
              Open Content Review Gate
            </Button>
          </div>
        </Card>
      )}

      {/* Quick Action Cards Grid */}
      <Row gutter={[20, 20]}>
        <Col xs={24} md={8}>
          <Card
            hoverable
            bordered
            style={{ borderRadius: 14, borderColor: '#E2E8F0', height: '100%' }}
            onClick={() => navigate('/app/teach/classrooms')}
          >
            <TeamOutlined style={{ fontSize: 32, color: '#2563EB', marginBottom: 16 }} />
            <Title level={4} style={{ margin: '0 0 8px 0', color: '#0F172A' }}>
              Classrooms & Invitations
            </Title>
            <Paragraph style={{ color: '#64748B', fontSize: 13, margin: 0 }}>
              Generate cryptographic invitation links, manage enrolled student rosters, and monitor membership.
            </Paragraph>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            hoverable
            bordered
            style={{ borderRadius: 14, borderColor: '#E2E8F0', height: '100%' }}
            onClick={() => navigate('/app/teach/resources')}
          >
            <FileTextOutlined style={{ fontSize: 32, color: '#D97706', marginBottom: 16 }} />
            <Title level={4} style={{ margin: '0 0 8px 0', color: '#0F172A' }}>
              Document Processing
            </Title>
            <Paragraph style={{ color: '#64748B', fontSize: 13, margin: 0 }}>
              Upload lecture notes, textbooks, and slides. Extract semantically grounded chunks with exact coordinates.
            </Paragraph>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            hoverable
            bordered
            style={{ borderRadius: 14, borderColor: '#E2E8F0', height: '100%' }}
            onClick={() => navigate('/app/teach/analytics')}
          >
            <LineChartOutlined style={{ fontSize: 32, color: '#059669', marginBottom: 16 }} />
            <Title level={4} style={{ margin: '0 0 8px 0', color: '#0F172A' }}>
              Classroom Analytics
            </Title>
            <Paragraph style={{ color: '#64748B', fontSize: 13, margin: 0 }}>
              Spot challenging topics with high error rates to guide in-person lecture review and remediation.
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
