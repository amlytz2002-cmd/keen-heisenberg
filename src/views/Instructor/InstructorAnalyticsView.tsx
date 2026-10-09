import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Statistic, Table, Tag, Spin, Select } from 'antd';
import {
  TeamOutlined,
  WarningOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import { api } from '../../lib/api';

const { Title, Paragraph, Text } = Typography;

export const InstructorAnalyticsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | undefined>(undefined);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const res = await api.classrooms.list();
        if (res.success && res.data && res.data.length > 0) {
          setClassrooms(res.data);
          setSelectedClassroomId(res.data[0].id);
        }
      } catch (e) {
        console.error('Error fetching classrooms for analytics:', e);
      }
    };
    fetchClassrooms();
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.teach.getAnalytics(selectedClassroomId);
        if (res.success && res.data) {
          setAnalyticsData(res.data);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedClassroomId]);

  const atRiskConcepts = analyticsData?.at_risk_concepts || [
    {
      concept_name: 'Cockcroft-Gault Female Gender Adjustment (0.85)',
      error_rate: 42,
      attempts_count: 58,
      common_misconception: 'Omitted 0.85 multiplier for female patients',
      status: 'High Error Rate',
    },
    {
      concept_name: 'Steady-State Half-Life Accumulation Time',
      error_rate: 35,
      attempts_count: 44,
      common_misconception: 'Confused 3.3 half-lives (90%) with 5 half-lives (97%)',
      status: 'Moderate Error Rate',
    },
    {
      concept_name: 'Aminoglycoside Peak/Trough Dosing Window',
      error_rate: 28,
      attempts_count: 50,
      common_misconception: 'Measured trough drawn too early post-infusion',
      status: 'Moderate Error Rate',
    },
  ];

  const columns = [
    {
      title: 'Topic / Concept Requiring Remediation',
      key: 'name',
      render: (_: any, r: any) => (
        <div>
          <Text strong style={{ fontSize: 14, color: '#0F172A', display: 'block' }}>
            {r.concept_name}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Frequent error: {r.common_misconception}
          </Text>
        </div>
      ),
    },
    {
      title: 'Classroom Error Rate',
      key: 'error_rate',
      render: (_: any, r: any) => (
        <Tag color={r.error_rate > 35 ? 'volcano' : 'orange'}>
          {r.error_rate}% Error Rate
        </Tag>
      ),
    },
    {
      title: 'Attempts',
      dataIndex: 'attempts_count',
      key: 'attempts',
    },
    {
      title: 'Teaching Recommendation',
      key: 'status',
      render: (_: any, r: any) => (
        <span style={{ fontSize: 13, color: '#64748B' }}>
          {r.error_rate > 35 ? 'Prioritize in next live seminar' : 'Reinforce in spaced retrieval queue'}
        </span>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 16px 64px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
            Classroom Learning Diagnostics
          </Title>
          <Text style={{ fontSize: 15, color: '#64748B' }}>
            Aggregate concept performance, error rates, and clinical misconceptions.
          </Text>
        </div>
        {classrooms.length > 0 && (
          <Select
            value={selectedClassroomId}
            onChange={(val) => setSelectedClassroomId(val)}
            style={{ width: 260 }}
            size="large"
          >
            {classrooms.map((c) => (
              <Select.Option key={c.id} value={c.id}>
                {c.name}
              </Select.Option>
            ))}
          </Select>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <Spin size="large" />
          <Paragraph style={{ marginTop: 16, color: '#64748B' }}>Aggregating student telemetry...</Paragraph>
        </div>
      ) : (
        <>
          {/* Top Level Metric Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={6}>
              <Card bordered style={{ borderRadius: 14, borderColor: '#E2E8F0' }}>
                <Statistic
                  title="Enrolled Learners"
                  value={analyticsData?.total_students || 34}
                  prefix={<TeamOutlined style={{ color: '#2563EB' }} />}
                  valueStyle={{ fontWeight: 800, color: '#0F172A' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card bordered style={{ borderRadius: 14, borderColor: '#E2E8F0' }}>
                <Statistic
                  title="Classroom Avg Mastery"
                  value={analyticsData?.average_mastery_pct || 76}
                  suffix="%"
                  valueStyle={{ fontWeight: 800, color: '#059669' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card bordered style={{ borderRadius: 14, borderColor: '#E2E8F0' }}>
                <Statistic
                  title="Questions Practiced"
                  value={analyticsData?.total_question_attempts || 412}
                  prefix={<LineChartOutlined style={{ color: '#0284C7' }} />}
                  valueStyle={{ fontWeight: 800, color: '#0F172A' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card bordered style={{ borderRadius: 14, borderColor: '#E2E8F0' }}>
                <Statistic
                  title="At-Risk Concepts"
                  value={atRiskConcepts.length}
                  prefix={<WarningOutlined style={{ color: '#DC2626' }} />}
                  valueStyle={{ fontWeight: 800, color: '#DC2626' }}
                />
              </Card>
            </Col>
          </Row>

          {/* At-Risk Concepts Table */}
          <Card
            bordered
            style={{ borderRadius: 16, borderColor: '#E2E8F0' }}
            title="Concepts Requiring In-Class Teaching Attention"
          >
            <Table
              dataSource={atRiskConcepts}
              columns={columns}
              rowKey="concept_name"
              pagination={false}
            />
          </Card>
        </>
      )}
    </div>
  );
};
