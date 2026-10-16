import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Statistic, Table, Tag, Progress, Spin } from 'antd';
import {
  CheckCircleOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { api } from '../../lib/api';

const { Title, Paragraph, Text } = Typography;

export const ProgressView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<any>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      try {
        const res = await api.analytics.getStudentProgress();
        if (res.success && res.data) {
          setProgressData(res.data);
        }
      } catch (err) {
        console.error('Error fetching progress:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16, color: '#64748B' }}>Akademik kavrama ve gelişim analitiği derleniyor...</Paragraph>
      </div>
    );
  }

  const concepts = progressData?.concepts || [];
  const masteredCount = concepts.filter((c: any) => c.mastery_score >= 80).length;
  const inProgressCount = concepts.filter((c: any) => c.mastery_score >= 50 && c.mastery_score < 80).length;
  const needsAttentionCount = concepts.filter((c: any) => c.mastery_score < 50).length;

  const totalAttempts = progressData?.total_attempts || 0;
  const avgAccuracy = progressData?.accuracy_pct || 0;
  const avgMastery = progressData?.average_mastery_pct || 0;

  const columns = [
    {
      title: 'Kavram ve Konu Başlığı',
      key: 'name',
      render: (_: any, r: any) => (
        <div>
          <Text strong style={{ fontSize: 14, color: '#F8FAFC', display: 'block' }}>
            {r.name}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, color: '#94A3B8' }}>
            {r.course_title || 'Temel Müfredat'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Kavrama Düzeyi',
      key: 'mastery',
      render: (_: any, r: any) => (
        <div style={{ width: 140 }}>
          <Progress
            percent={r.mastery_score || 0}
            size="small"
            strokeColor={r.mastery_score >= 80 ? '#10B981' : r.mastery_score >= 50 ? '#38BDF8' : '#F43F5E'}
            trailColor="#1E293B"
          />
        </div>
      ),
    },
    {
      title: 'Kararlılık Aralığı',
      key: 'stability',
      render: (_: any, r: any) => (
        <Tag color="geekblue">
          {r.current_interval_days || 1}. Gün
        </Tag>
      ),
    },
    {
      title: 'Hata Sayısı',
      key: 'lapses',
      render: (_: any, r: any) => (
        <span style={{ color: r.lapse_count > 0 ? '#F43F5E' : '#94A3B8' }}>
          {r.lapse_count || 0}
        </span>
      ),
    },
    {
      title: 'Durum',
      key: 'status',
      render: (_: any, r: any) => {
        const score = r.mastery_score || 0;
        if (score >= 80) return <Tag color="green">Kavrandı</Tag>;
        if (score >= 50) return <Tag color="blue">Geliştiriliyor</Tag>;
        return <Tag color="volcano">Pratik Gerekli</Tag>;
      },
    },
  ];

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 16px 64px' }}>
      <div style={{ marginBottom: 28 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#F8FAFC' }}>
          Akademik Gelişim & Kalıcılık Analitiği
        </Title>
        <Text style={{ fontSize: 15, color: '#94A3B8' }}>
          Aktif hatırlama başarımı, ipucu bağımsızlığı ve aralıklı tekrar kararlılığını yansıtan gerçek öğrenme metrikleri.
        </Text>
      </div>

      {/* Top 4 Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 12, borderColor: '#1E293B', backgroundColor: '#0F172A' }}>
            <Statistic
              title={<span style={{ color: '#94A3B8' }}>Ortalama Kavrama</span>}
              value={avgMastery}
              suffix="%"
              valueStyle={{ color: '#38BDF8', fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 12, borderColor: '#1E293B', backgroundColor: '#0F172A' }}>
            <Statistic
              title={<span style={{ color: '#94A3B8' }}>İlk Deneme Doğruluğu</span>}
              value={avgAccuracy}
              suffix="%"
              valueStyle={{ color: '#10B981', fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 12, borderColor: '#1E293B', backgroundColor: '#0F172A' }}>
            <Statistic
              title={<span style={{ color: '#94A3B8' }}>Kavranan Kavramlar</span>}
              value={masteredCount}
              valueStyle={{ color: '#10B981', fontWeight: 800 }}
              prefix={<CheckCircleOutlined style={{ color: '#10B981' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 12, borderColor: '#1E293B', backgroundColor: '#0F172A' }}>
            <Statistic
              title={<span style={{ color: '#94A3B8' }}>Toplam Soru Denemesi</span>}
              value={totalAttempts}
              valueStyle={{ color: '#F8FAFC', fontWeight: 800 }}
              prefix={<BarChartOutlined style={{ color: '#F8FAFC' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Mastery Breakdown Distribution */}
      <Card bordered style={{ borderRadius: 14, borderColor: '#1E293B', backgroundColor: '#0F172A', marginBottom: 24 }}>
        <Title level={4} style={{ color: '#F8FAFC', marginBottom: 16 }}>
          Kavram Kalıcılık Dağılımı
        </Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <div style={{ padding: 16, backgroundColor: 'rgba(5, 150, 105, 0.15)', borderRadius: 10, border: '1px solid #065F46' }}>
              <Text strong style={{ color: '#34D399', display: 'block', fontSize: 16 }}>
                Kavrandı (≥%80)
              </Text>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#6EE7B7', margin: '4px 0' }}>
                {masteredCount}
              </div>
              <Text style={{ fontSize: 12, color: '#A7F3D0' }}>Yüksek tekrar aralıklarında kararlı hatırlama.</Text>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ padding: 16, backgroundColor: 'rgba(2, 132, 199, 0.15)', borderRadius: 10, border: '1px solid #0C4A6E' }}>
              <Text strong style={{ color: '#38BDF8', display: 'block', fontSize: 16 }}>
                Pekiştiriliyor (%50–%79)
              </Text>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#7DD3FC', margin: '4px 0' }}>
                {inProgressCount}
              </div>
              <Text style={{ fontSize: 12, color: '#BAE6FD' }}>3. ve 7. gün tekrar aralıklarında ilerleyen kavramlar.</Text>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ padding: 16, backgroundColor: 'rgba(225, 29, 72, 0.15)', borderRadius: 10, border: '1px solid #881337' }}>
              <Text strong style={{ color: '#FB7185', display: 'block', fontSize: 16 }}>
                Eksik Giderme Gerekli (&lt;%50)
              </Text>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#FDA4AF', margin: '4px 0' }}>
                {needsAttentionCount}
              </div>
              <Text style={{ fontSize: 12, color: '#FECDD3' }}>Hızlı toparlanma için 1. gün tekrar aralığına sıfırlandı.</Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Concepts Table */}
      <Card bordered style={{ borderRadius: 16, borderColor: '#1E293B', backgroundColor: '#0F172A' }} title={<span style={{ color: '#F8FAFC' }}>İzlenen Müfredat Kavramları</span>}>
        <Table
          dataSource={concepts}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};
