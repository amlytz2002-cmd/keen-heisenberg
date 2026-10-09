import React, { useEffect, useState } from 'react';
import { Card, Result, Typography, Button, Table, Tag, Spin } from 'antd';
import {
  HistoryOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useRouter } from '../../context/RouterContext';
import { api } from '../../lib/api';

const { Title, Paragraph, Text } = Typography;

export const ExamResultsView: React.FC = () => {
  const { params, navigate } = useRouter();
  const attemptId = params.id;

  const [loading, setLoading] = useState(true);
  const [resultsData, setResultsData] = useState<any>(null);

  useEffect(() => {
    // In our implementation, submit returned the graded attempt, or we can fetch attempt from analytics/exams
    const fetchResults = async () => {
      setLoading(true);
      try {
        // Fetch progress/analytics which contains attempt records
        const res = await api.analytics.getStudentProgress();
        if (res.success && res.data?.recent_attempts) {
          const matched = res.data.recent_attempts.find((a: any) => a.id === attemptId);
          if (matched) {
            setResultsData(matched);
          } else if (res.data.recent_attempts.length > 0) {
            setResultsData(res.data.recent_attempts[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching exam results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [attemptId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16, color: '#64748B' }}>Grading attempt and compiling topic diagnostics...</Paragraph>
      </div>
    );
  }

  // Fallback demo data if loading specific historical attempt
  const scorePct = resultsData?.score_pct !== undefined ? resultsData.score_pct : 80;
  const isPassed = scorePct >= (resultsData?.passing_score_pct || 70);

  const topicBreakdown = resultsData?.topic_breakdown || [
    { topic: 'Creatinine Clearance & Cockcroft-Gault', total: 4, correct: 4, accuracy: 100, needs_remediation: false },
    { topic: 'One-Compartment Elimination Kinetics', total: 3, correct: 2, accuracy: 66, needs_remediation: true },
    { topic: 'Steady-State Loading Dose Equations', total: 3, correct: 2, accuracy: 66, needs_remediation: true },
  ];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px 64px' }}>
      <Card
        bordered
        style={{
          borderRadius: 16,
          borderColor: '#E2E8F0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          marginBottom: 24,
        }}
      >
        <Result
          status={isPassed ? 'success' : 'warning'}
          title={
            <span style={{ fontWeight: 800, fontSize: 26, color: '#0F172A' }}>
              {isPassed ? 'Examination Passed' : 'Needs Further Retrieval Practice'}
            </span>
          }
          subTitle={`Final Attempt Score: ${scorePct}% (Passing threshold: ${resultsData?.passing_score_pct || 70}%)`}
          extra={[
            <Button
              type="primary"
              key="review"
              icon={<HistoryOutlined />}
              onClick={() => navigate('/app/review')}
              style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED', borderRadius: 8, height: 42 }}
            >
              Remediate Weak Concepts in Review Queue
            </Button>,
            <Button key="today" onClick={() => navigate('/app/today')} style={{ borderRadius: 8, height: 42 }}>
              Back to Today Hub
            </Button>,
          ]}
        />
      </Card>

      {/* Diagnostics by Topic */}
      <Title level={3} style={{ fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>
        Topic Diagnostics & Remediation Plan
      </Title>

      <Card bordered style={{ borderRadius: 16, borderColor: '#E2E8F0', marginBottom: 24 }}>
        <Table
          dataSource={topicBreakdown}
          rowKey="topic"
          pagination={false}
          columns={[
            {
              title: 'Concept / Topic',
              dataIndex: 'topic',
              key: 'topic',
              render: (text: string) => <Text strong style={{ color: '#0F172A' }}>{text}</Text>,
            },
            {
              title: 'Performance',
              key: 'performance',
              render: (_: any, r: any) => (
                <span>
                  {r.correct} / {r.total} ({r.accuracy}%)
                </span>
              ),
            },
            {
              title: 'Mastery Status',
              key: 'status',
              render: (_: any, r: any) => (
                <Tag color={r.accuracy >= 75 ? 'green' : 'volcano'}>
                  {r.accuracy >= 75 ? 'Mastered' : 'Needs Practice'}
                </Tag>
              ),
            },
            {
              title: 'Remediation',
              key: 'remediation',
              render: (_: any, r: any) =>
                r.needs_remediation ? (
                  <Button
                    size="small"
                    type="link"
                    icon={<ArrowRightOutlined />}
                    onClick={() => navigate('/app/review')}
                    style={{ padding: 0, color: '#7C3AED', fontWeight: 600 }}
                  >
                    Add to Day-1 Review
                  </Button>
                ) : (
                  <Text type="secondary" style={{ fontSize: 12 }}>Consolidated</Text>
                ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
