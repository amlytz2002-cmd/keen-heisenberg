import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Statistic, Table, Tag, Spin, Select, Button } from 'antd';
import {
  TeamOutlined,
  WarningOutlined,
  LineChartOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useRouter } from '../../context/RouterContext';
import { api } from '../../lib/api';

const { Title, Paragraph, Text } = Typography;

export const InstructorAnalyticsView: React.FC = () => {
  const { navigate } = useRouter();
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
    if (!selectedClassroomId) {
      setLoading(false);
      return;
    }

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

  const atRiskConcepts = analyticsData?.at_risk_concepts || [];

  const columns = [
    {
      title: 'Pekiştirme Gerektiren Kavram / Konu',
      key: 'name',
      render: (_: any, r: any) => (
        <div>
          <Text strong style={{ fontSize: 14, color: '#F8FAFC', display: 'block' }}>
            {r.concept_name}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, color: '#94A3B8' }}>
            Sık Karşılaşılan Yanılgı: {r.common_misconception}
          </Text>
        </div>
      ),
    },
    {
      title: 'Sınıf Hata Oranı',
      key: 'error_rate',
      render: (_: any, r: any) => (
        <Tag color={r.error_rate > 35 ? 'volcano' : 'orange'}>
          %{r.error_rate} Hata Oranı
        </Tag>
      ),
    },
    {
      title: 'Deneme Sayısı',
      dataIndex: 'attempts_count',
      key: 'attempts',
    },
    {
      title: 'Eğitsel Müdahale Önerisi',
      key: 'status',
      render: (_: any, r: any) => (
        <span style={{ fontSize: 13, color: '#94A3B8' }}>
          {r.error_rate > 35 ? 'Gelecek seminerde öncelikli olarak işlenmeli' : 'Aralıklı hatırlama kuyruğunda pekiştirilmeli'}
        </span>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 16px 64px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#F8FAFC' }}>
            Sınıf Öğrenme Teşhisi ve Analitiği
          </Title>
          <Text style={{ fontSize: 15, color: '#94A3B8' }}>
            Kavram bazlı toplu başarı grafikleri, hata oranları ve klinik kavram yanılgıları.
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
          <Paragraph style={{ marginTop: 16, color: '#94A3B8' }}>Öğrenci telemetrisi ve başarı verileri derleniyor...</Paragraph>
        </div>
      ) : classrooms.length === 0 ? (
        <Card
          bordered
          style={{
            borderRadius: 16,
            borderColor: '#1E293B',
            backgroundColor: '#0B1120',
            textAlign: 'center',
            padding: '48px 20px',
          }}
        >
          <TeamOutlined style={{ fontSize: 44, color: '#38BDF8', marginBottom: 12 }} />
          <Title level={3} style={{ color: '#F8FAFC', margin: 0 }}>Henüz Kayıtlı Bir Sınıf Bulunmuyor</Title>
          <Paragraph style={{ color: '#94A3B8', maxWidth: 480, margin: '8px auto 24px' }}>
            Öğrenci telemetrisi, kavram hakimiyet oranları ve riskli kavram teşhislerini inceleyebilmek için önce bir akademik sınıf oluşturmalısınız.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            onClick={() => navigate('/app/instructor/classrooms')}
            style={{ backgroundColor: '#2563EB', borderRadius: 8, height: 44, fontWeight: 600 }}
          >
            Sınıf Yönetimine Git
          </Button>
        </Card>
      ) : (
        <>
          {/* Top Level Metric Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={6}>
              <Card bordered style={{ borderRadius: 14, borderColor: '#1E293B', backgroundColor: '#0F172A' }}>
                <Statistic
                  title={<span style={{ color: '#94A3B8' }}>Kayıtlı Öğrenciler</span>}
                  value={analyticsData?.total_students ?? 0}
                  prefix={<TeamOutlined style={{ color: '#38BDF8' }} />}
                  valueStyle={{ fontWeight: 800, color: '#F8FAFC' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card bordered style={{ borderRadius: 14, borderColor: '#1E293B', backgroundColor: '#0F172A' }}>
                <Statistic
                  title={<span style={{ color: '#94A3B8' }}>Sınıf Ortalama Yetkinliği</span>}
                  value={analyticsData?.average_mastery_pct ?? 0}
                  suffix="%"
                  valueStyle={{ fontWeight: 800, color: '#10B981' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card bordered style={{ borderRadius: 14, borderColor: '#1E293B', backgroundColor: '#0F172A' }}>
                <Statistic
                  title={<span style={{ color: '#94A3B8' }}>Çözülen Soru Sayısı</span>}
                  value={analyticsData?.total_question_attempts ?? 0}
                  prefix={<LineChartOutlined style={{ color: '#A78BFA' }} />}
                  valueStyle={{ fontWeight: 800, color: '#F8FAFC' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card bordered style={{ borderRadius: 14, borderColor: '#1E293B', backgroundColor: '#0F172A' }}>
                <Statistic
                  title={<span style={{ color: '#94A3B8' }}>Kritik/Riskli Kavramlar</span>}
                  value={atRiskConcepts.length}
                  prefix={<WarningOutlined style={{ color: '#F87171' }} />}
                  valueStyle={{ fontWeight: 800, color: atRiskConcepts.length > 0 ? '#F87171' : '#10B981' }}
                />
              </Card>
            </Col>
          </Row>

          {/* At-Risk Concepts Table */}
          <Card
            bordered
            style={{ borderRadius: 16, borderColor: '#1E293B', backgroundColor: '#0B1120' }}
            title={<span style={{ color: '#F8FAFC' }}>Ders İçi Müdahale ve Açıklama Gerektiren Kritik Kavramlar</span>}
          >
            {atRiskConcepts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 20px' }}>
                <CheckCircleOutlined style={{ fontSize: 36, color: '#10B981', marginBottom: 12 }} />
                <Title level={4} style={{ color: '#F8FAFC', margin: 0 }}>Kritik Yanılgı Tespit Edilmedi</Title>
                <Paragraph style={{ color: '#94A3B8', marginTop: 4 }}>
                  Tebrikler! Bu sınıfta kritik hata eşiğini aşan kavram tespit edilmedi. Öğrenciler hedeflenen yetkinlik düzeyinde ilerliyor.
                </Paragraph>
              </div>
            ) : (
              <Table
                dataSource={atRiskConcepts}
                columns={columns}
                rowKey="concept_name"
                pagination={false}
              />
            )}
          </Card>
        </>
      )}
    </div>
  );
};
