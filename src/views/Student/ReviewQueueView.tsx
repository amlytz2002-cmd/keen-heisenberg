import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, Button, Spin, Row, Col, Statistic } from 'antd';
import {
  HistoryOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useRouter } from '../../context/RouterContext';
import { api } from '../../lib/api';

const { Title, Paragraph, Text } = Typography;

export const ReviewQueueView: React.FC = () => {
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<any[]>([]);

  useEffect(() => {
    const fetchQueue = async () => {
      setLoading(true);
      try {
        const res = await api.reviews.getQueue();
        if (res.success && res.data) {
          setQueue(res.data);
        }
      } catch (err) {
        console.error('Error fetching review queue:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, []);

  const overdueCount = queue.filter((item) => item.status === 'overdue' || (item.days_overdue && item.days_overdue > 0)).length;

  const handleStartReview = async (conceptId?: string) => {
    const res = await api.study.getSession({ concept_id: conceptId });
    if (res.success && res.data?.session?.id) {
      navigate(`/app/study/${res.data.session.id}`);
    } else {
      navigate('/app/classrooms');
    }
  };

  const columns = [
    {
      title: 'Concept & Course',
      key: 'concept',
      render: (_: any, record: any) => (
        <div>
          <Text strong style={{ fontSize: 14, color: '#0F172A', display: 'block' }}>
            {record.concept_name || record.name || 'Core Concept'}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.course_title || 'General Curriculum'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Interval Stage',
      key: 'interval',
      render: (_: any, record: any) => {
        const interval = record.current_interval_days || 1;
        return (
          <Tag color="geekblue" style={{ borderRadius: 4 }}>
            Day {interval} Interval
          </Tag>
        );
      },
    },
    {
      title: 'Mastery',
      key: 'mastery',
      render: (_: any, record: any) => {
        const score = record.mastery_score || 70;
        let color = 'green';
        if (score < 50) color = 'volcano';
        else if (score < 75) color = 'gold';
        return <Tag color={color}>{score}%</Tag>;
      },
    },
    {
      title: 'Lapses',
      key: 'lapses',
      render: (_: any, record: any) => (
        <span style={{ color: record.lapse_count > 0 ? '#DC2626' : '#64748B' }}>
          {record.lapse_count || 0}
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          size="small"
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => handleStartReview(record.concept_id || record.id)}
          style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED', borderRadius: 6 }}
        >
          Review
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16, color: '#64748B' }}>Calculating spaced repetition queue...</Paragraph>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 16px 64px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
            Spaced Repetition Review Queue
          </Title>
          <Text style={{ fontSize: 15, color: '#64748B' }}>
            Scientifically scheduled 1, 3, 7, and 14-day intervals to consolidate memory.
          </Text>
        </div>
        {queue.length > 0 && (
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={() => handleStartReview()}
            style={{ backgroundColor: '#7C3AED', borderRadius: 8, height: 44, fontWeight: 600 }}
          >
            Review All Due Concepts
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card bordered style={{ borderRadius: 12, borderColor: '#E2E8F0' }}>
            <Statistic
              title="Due for Review Today"
              value={queue.length}
              valueStyle={{ color: queue.length > 0 ? '#7C3AED' : '#059669', fontWeight: 800 }}
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered style={{ borderRadius: 12, borderColor: '#E2E8F0' }}>
            <Statistic
              title="Overdue Items"
              value={overdueCount}
              valueStyle={{ color: overdueCount > 0 ? '#DC2626' : '#64748B', fontWeight: 800 }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered style={{ borderRadius: 12, borderColor: '#E2E8F0' }}>
            <Statistic
              title="Interval Protocol"
              value="1 · 3 · 7 · 14"
              valueStyle={{ color: '#2563EB', fontWeight: 800, fontSize: 22 }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Queue Table */}
      <Card bordered style={{ borderRadius: 16, borderColor: '#E2E8F0' }}>
        {queue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <CheckCircleOutlined style={{ fontSize: 44, color: '#059669', marginBottom: 12 }} />
            <Title level={4} style={{ color: '#0F172A', margin: 0 }}>All Caught Up!</Title>
            <Paragraph style={{ color: '#64748B', marginTop: 4 }}>
              You have completed all scheduled spaced reviews for today. New items will appear as their intervals mature.
            </Paragraph>
            <Button onClick={() => navigate('/app/today')} style={{ marginTop: 12, borderRadius: 6 }}>
              Back to Today's Dashboard
            </Button>
          </div>
        ) : (
          <Table
            dataSource={queue}
            columns={columns}
            rowKey={(r) => r.concept_id || r.id}
            pagination={{ pageSize: 8 }}
          />
        )}
      </Card>
    </div>
  );
};
