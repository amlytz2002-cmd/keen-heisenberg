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
          <Text strong style={{ fontSize: 14, color: '#0F172A', display: 'block' }}>
            {r.name}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
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
            strokeColor={r.mastery_score >= 80 ? '#059669' : r.mastery_score >= 50 ? '#2563EB' : '#DC2626'}
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
        <span style={{ color: r.lapse_count > 0 ? '#DC2626' : '#64748B' }}>
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
        <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
          Akademik Gelişim & Kalıcılık Analitiği
        </Title>
        <Text style={{ fontSize: 15, color: '#64748B' }}>
          Aktif hatırlama başarımı, ipucu bağımsızlığı ve aralıklı tekrar kararlılığını yansıtan gerçek öğrenme metrikleri.
        </Text>
      </div>

      {/* Top 4 Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 12, borderColor: '#E2E8F0' }}>
            <Statistic
              title="Ortalama Kavrama"
              value={avgMastery}
              suffix="%"
              valueStyle={{ color: '#2563EB', fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 12, borderColor: '#E2E8F0' }}>
            <Statistic
              title="İlk Deneme Doğruluğu"
              value={avgAccuracy}
              suffix="%"
              valueStyle={{ color: '#059669', fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 12, borderColor: '#E2E8F0' }}>
            <Statistic
              title="Kavranan Kavramlar"
              value={masteredCount}
              valueStyle={{ color: '#059669', fontWeight: 800 }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 12, borderColor: '#E2E8F0' }}>
            <Statistic
              title="Toplam Soru Denemesi"
              value={totalAttempts}
              valueStyle={{ color: '#0F172A', fontWeight: 800 }}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Mastery Breakdown Distribution */}
      <Card bordered style={{ borderRadius: 14, borderColor: '#E2E8F0', marginBottom: 24 }}>
        <Title level={4} style={{ color: '#0F172A', marginBottom: 16 }}>
          Kavram Kalıcılık Dağılımı
        </Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <div style={{ padding: 16, backgroundColor: '#F0FDF4', borderRadius: 10, border: '1px solid #BBF7D0' }}>
              <Text strong style={{ color: '#166534', display: 'block', fontSize: 16 }}>
                Kavrandı (≥%80)
              </Text>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#15803D', margin: '4px 0' }}>
                {masteredCount}
              </div>
              <Text style={{ fontSize: 12, color: '#166534' }}>Yüksek tekrar aralıklarında kararlı hatırlama.</Text>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ padding: 16, backgroundColor: '#EFF6FF', borderRadius: 10, border: '1px solid #BFDBFE' }}>
              <Text strong style={{ color: '#1E40AF', display: 'block', fontSize: 16 }}>
                Pekiştiriliyor (%50–%79)
              </Text>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#1D4ED8', margin: '4px 0' }}>
                {inProgressCount}
              </div>
              <Text style={{ fontSize: 12, color: '#1E40AF' }}>3. ve 7. gün tekrar aralıklarında ilerleyen kavramlar.</Text>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ padding: 16, backgroundColor: '#FEF2F2', borderRadius: 10, border: '1px solid #FECACA' }}>
              <Text strong style={{ color: '#991B1B', display: 'block', fontSize: 16 }}>
                Eksik Giderme Gerekli (&lt;%50)
              </Text>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#B91C1C', margin: '4px 0' }}>
                {needsAttentionCount}
              </div>
              <Text style={{ fontSize: 12, color: '#991B1B' }}>Hızlı toparlanma için 1. gün tekrar aralığına sıfırlandı.</Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Concepts Table */}
      <Card bordered style={{ borderRadius: 16, borderColor: '#E2E8F0' }} title="İzlenen Müfredat Kavramları">
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
