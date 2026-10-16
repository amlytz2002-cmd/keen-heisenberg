import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, Button, Spin, Row, Col, Statistic, Alert } from 'antd';
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [queue, setQueue] = useState<any[]>([]);

  const fetchQueue = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.reviews.getQueue();
      if (res.success && res.data) {
        setQueue(res.data);
      } else {
        setErrorMsg(res.error || 'Aralıklı tekrar kuyruğu alınırken bir sorun oluştu.');
      }
    } catch (err: unknown) {
      console.error('Error fetching review queue:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
      title: 'Kavram ve Ders',
      key: 'concept',
      render: (_: any, record: any) => (
        <div>
          <Text strong style={{ fontSize: 14, color: '#F8FAFC', display: 'block' }}>
            {record.concept_name || record.name || 'Temel Kavram'}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, color: '#94A3B8' }}>
            {record.course_title || 'Genel Müfredat'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Aralık Kademesi',
      key: 'interval',
      render: (_: any, record: any) => {
        const interval = record.current_interval_days || 1;
        return (
          <Tag color="geekblue" style={{ borderRadius: 4 }}>
            {interval}. Gün Aralığı
          </Tag>
        );
      },
    },
    {
      title: 'Kavrama Skoru',
      key: 'mastery',
      render: (_: any, record: any) => {
        const score = record.mastery_score || 70;
        let color = 'green';
        if (score < 50) color = 'volcano';
        else if (score < 75) color = 'gold';
        return <Tag color={color}>%{score}</Tag>;
      },
    },
    {
      title: 'Hata Sayısı',
      key: 'lapses',
      render: (_: any, record: any) => (
        <span style={{ color: record.lapse_count > 0 ? '#DC2626' : '#64748B' }}>
          {record.lapse_count || 0}
        </span>
      ),
    },
    {
      title: 'İşlem',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          size="small"
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => handleStartReview(record.concept_id || record.id)}
          style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED', borderRadius: 6 }}
        >
          Tekrar Et
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16, color: '#94A3B8' }}>Aralıklı tekrar kuyruğu hesaplanıyor...</Paragraph>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ maxWidth: 640, margin: '60px auto', padding: '0 20px' }}>
        <Card bordered style={{ borderRadius: 16, textAlign: 'center', borderColor: '#DC2626' }}>
          <Alert
            message="Tekrar Kuyruğu Yüklenemedi"
            description={errorMsg}
            type="error"
            showIcon
            style={{ marginBottom: 20, textAlign: 'left', borderRadius: 8 }}
          />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button type="primary" onClick={fetchQueue} style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED', borderRadius: 8 }}>
              Tekrar Dene
            </Button>
            <Button onClick={() => navigate('/app/today')} style={{ borderRadius: 8 }}>
              Bugünün Paneline Dön
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 16px 64px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#F8FAFC' }}>
            Aralıklı Tekrar Kuyruğu (SRS)
          </Title>
          <Text style={{ fontSize: 15, color: '#94A3B8' }}>
            Hafızayı pekiştirmek ve unutmayı önlemek için bilimsel olarak planlanmış 1, 3, 7 ve 14 günlük tekrar aralıkları.
          </Text>
        </div>
        {queue.length > 0 && (
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={() => handleStartReview()}
            style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED', borderRadius: 8, height: 44, fontWeight: 600 }}
          >
            Günü Gelen Tüm Kavramları Tekrar Et
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card bordered style={{ borderRadius: 12, borderColor: '#1E293B', backgroundColor: '#0F172A' }}>
            <Statistic
              title={<span style={{ color: '#94A3B8' }}>Bugün Tekrar Edilecekler</span>}
              value={queue.length}
              valueStyle={{ color: queue.length > 0 ? '#A78BFA' : '#10B981', fontWeight: 800 }}
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered style={{ borderRadius: 12, borderColor: '#1E293B', backgroundColor: '#0F172A' }}>
            <Statistic
              title={<span style={{ color: '#94A3B8' }}>Geciken Kavramlar</span>}
              value={overdueCount}
              valueStyle={{ color: overdueCount > 0 ? '#F87171' : '#94A3B8', fontWeight: 800 }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered style={{ borderRadius: 12, borderColor: '#1E293B', backgroundColor: '#0F172A' }}>
            <Statistic
              title={<span style={{ color: '#94A3B8' }}>Tekrar Protokolü</span>}
              value="1 · 3 · 7 · 14"
              valueStyle={{ color: '#38BDF8', fontWeight: 800, fontSize: 22 }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Queue Table */}
      <Card bordered style={{ borderRadius: 16, borderColor: '#1E293B', backgroundColor: '#0B1120' }}>
        {queue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <CheckCircleOutlined style={{ fontSize: 44, color: '#10B981', marginBottom: 12 }} />
            <Title level={4} style={{ color: '#F8FAFC', margin: 0 }}>Tüm Tekrarlar Tamamlandı!</Title>
            <Paragraph style={{ color: '#94A3B8', marginTop: 4 }}>
              Bugün için planlanan tüm aralıklı tekrarları bitirdiniz. Yeni tekrarlar günleri geldikçe kuyruğa eklenecektir.
            </Paragraph>
            <Button onClick={() => navigate('/app/today')} style={{ marginTop: 12, borderRadius: 6 }}>
              Bugünün Paneline Dön
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
