import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, Button, Spin, Modal, Alert } from 'antd';
import {
  TrophyOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useRouter } from '../../context/RouterContext';
import { api } from '../../lib/api';

const { Title, Paragraph, Text } = Typography;

export const ExamsListView: React.FC = () => {
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      try {
        const res = await api.exams.list();
        if (res.success && res.data) {
          setExams(res.data);
        }
      } catch (err) {
        console.error('Error fetching exams:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  const handleStartExam = async () => {
    if (!selectedExam) return;
    setStarting(true);
    setErrorMsg(null);
    try {
      const res = await api.exams.start(selectedExam.id);
      if (res.success && res.data) {
        setConfirmModalOpen(false);
        navigate(`/app/exams/${selectedExam.id}/take?attemptId=${res.data.attempt_id}`);
      } else {
        setErrorMsg(res.error || 'Failed to initialize exam attempt.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error starting exam');
    } finally {
      setStarting(false);
    }
  };

  const columns = [
    {
      title: 'Exam Title & Details',
      key: 'title',
      render: (_: any, record: any) => (
        <div>
          <Text strong style={{ fontSize: 15, color: '#0F172A', display: 'block' }}>
            {record.title}
          </Text>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {record.description || 'Comprehensive clinical retrieval evaluation.'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_: any, record: any) => (
        <Tag icon={<ClockCircleOutlined />} color="blue">
          {record.duration_minutes} Minutes
        </Tag>
      ),
    },
    {
      title: 'Passing Score',
      key: 'passing',
      render: (_: any, record: any) => (
        <Tag color="geekblue">{record.passing_score_pct || 70}%</Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => {
            setSelectedExam(record);
            setConfirmModalOpen(true);
          }}
          style={{ backgroundColor: '#2563EB', borderRadius: 6 }}
        >
          Take Exam
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16, color: '#64748B' }}>Loading mock exams...</Paragraph>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 16px 64px' }}>
      <div style={{ marginBottom: 28 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
          Timed Mock Exams
        </Title>
        <Text style={{ fontSize: 15, color: '#64748B' }}>
          Simulate official academic examination conditions with server-enforced countdowns and concept analysis.
        </Text>
      </div>

      <Card bordered style={{ borderRadius: 16, borderColor: '#E2E8F0' }}>
        {exams.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <TrophyOutlined style={{ fontSize: 44, color: '#94A3B8', marginBottom: 12 }} />
            <Title level={4} style={{ color: '#0F172A' }}>No Active Exams Available</Title>
            <Paragraph style={{ color: '#64748B' }}>
              Your instructors have not scheduled mock exams for your enrolled courses yet.
            </Paragraph>
          </div>
        ) : (
          <Table
            dataSource={exams}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 8 }}
          />
        )}
      </Card>

      {/* Start Exam Confirmation Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExclamationCircleOutlined style={{ color: '#DC2626' }} />
            <span>Timed Exam Rules & Server Enforcement</span>
          </div>
        }
        open={confirmModalOpen}
        onCancel={() => {
          setConfirmModalOpen(false);
          setErrorMsg(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setConfirmModalOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="start"
            type="primary"
            loading={starting}
            onClick={handleStartExam}
            style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
          >
            Start Exam Now
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          {errorMsg && (
            <Alert message={errorMsg} type="error" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />
          )}
          <Paragraph>
            You are about to start <strong>{selectedExam?.title}</strong>.
          </Paragraph>
          <Alert
            message="Server-Enforced Timer Notice"
            description={`Once you click 'Start Exam Now', your timer of ${selectedExam?.duration_minutes} minutes will begin running immediately on the server. Closing your browser will NOT pause the timer. Unsubmitted answers are auto-saved periodically.`}
            type="warning"
            showIcon
            style={{ borderRadius: 8 }}
          />
        </div>
      </Modal>
    </div>
  );
};
