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
        <Paragraph style={{ marginTop: 16, color: '#64748B' }}>Eğitmen kontrol paneli yükleniyor...</Paragraph>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '32px 16px 64px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <Tag color="purple" style={{ marginBottom: 4 }}>Eğitim & Müfredat Yönetimi</Tag>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#F8FAFC' }}>
            Eğitmen Yönetim Paneli
          </Title>
          <Text style={{ fontSize: 15, color: '#94A3B8' }}>
            Sınıf yönetimi, ders materyali ayrıştırma, yapay zekâ soru üretimi ve eğitmen onay kapısı.
          </Text>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/app/teach/classrooms')}
            style={{ backgroundColor: '#2563EB', borderColor: '#2563EB', borderRadius: 8, height: 40 }}
          >
            Yeni Sınıf
          </Button>
          <Button
            icon={<UploadOutlined />}
            onClick={() => navigate('/app/teach/resources')}
            style={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#CBD5E1', borderRadius: 8, height: 40 }}
          >
            Ders Belgesi Yükle
          </Button>
        </Space>
      </div>

      {/* Overview Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 14, borderColor: '#1E293B', backgroundColor: '#0F172A' }}>
            <Statistic
              title={<span style={{ color: '#94A3B8' }}>Kayıtlı Sınıflar</span>}
              value={classroomsCount}
              prefix={<TeamOutlined style={{ color: '#38BDF8' }} />}
              valueStyle={{ fontWeight: 800, color: '#F8FAFC' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 14, borderColor: '#1E293B', backgroundColor: '#0F172A' }}>
            <Statistic
              title={<span style={{ color: '#94A3B8' }}>Aktif Dersler</span>}
              value={coursesCount}
              prefix={<BookOutlined style={{ color: '#818CF8' }} />}
              valueStyle={{ fontWeight: 800, color: '#F8FAFC' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 14, borderColor: '#1E293B', backgroundColor: '#0F172A' }}>
            <Statistic
              title={<span style={{ color: '#94A3B8' }}>İşlenen Belgeler</span>}
              value={resourcesCount}
              prefix={<FileTextOutlined style={{ color: '#FBBF24' }} />}
              valueStyle={{ fontWeight: 800, color: '#F8FAFC' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            bordered
            style={{
              borderRadius: 14,
              borderColor: pendingReviewCount > 0 ? '#78350F' : '#1E293B',
              backgroundColor: pendingReviewCount > 0 ? 'rgba(217, 119, 6, 0.12)' : '#0F172A',
            }}
          >
            <Statistic
              title={<span style={{ color: '#94A3B8' }}>İnceleme Bekleyenler</span>}
              value={pendingReviewCount}
              prefix={<SafetyCertificateOutlined style={{ color: '#F59E0B' }} />}
              valueStyle={{ fontWeight: 800, color: pendingReviewCount > 0 ? '#FBBF24' : '#10B981' }}
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
            backgroundColor: 'rgba(217, 119, 6, 0.12)',
            borderColor: '#78350F',
            marginBottom: 32,
          }}
          bodyStyle={{ padding: 24 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SafetyCertificateOutlined style={{ color: '#F59E0B', fontSize: 20 }} />
                <Title level={4} style={{ margin: 0, color: '#FDE68A' }}>
                  {pendingReviewCount} Yeni İçerik Eğitmen İncelemesi Bekliyor
                </Title>
              </div>
              <Paragraph style={{ color: '#FCD34D', margin: '4px 0 0 0', fontSize: 14 }}>
                Yapay zekâ tarafından oluşturulan hiçbir içerik eğitmen onaylayıp yayınlayana kadar öğrencilere gösterilmez.
              </Paragraph>
            </div>
            <Button
              type="primary"
              onClick={() => navigate('/app/teach/content-review')}
              style={{ backgroundColor: '#D97706', borderColor: '#D97706', borderRadius: 8, height: 40, fontWeight: 600, color: '#FFFFFF' }}
            >
              İçerik İnceleme Kapısını Aç
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
            style={{ borderRadius: 14, borderColor: '#1E293B', backgroundColor: '#0F172A', height: '100%' }}
            onClick={() => navigate('/app/teach/classrooms')}
          >
            <TeamOutlined style={{ fontSize: 32, color: '#38BDF8', marginBottom: 16 }} />
            <Title level={4} style={{ margin: '0 0 8px 0', color: '#F8FAFC' }}>
              Sınıflar & Davet Yönetimi
            </Title>
            <Paragraph style={{ color: '#94A3B8', fontSize: 13, margin: 0 }}>
              Kriptografik davet bağlantıları oluşturun, kayıtlı öğrenci listelerini yönetin ve katılımı denetleyin.
            </Paragraph>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            hoverable
            bordered
            style={{ borderRadius: 14, borderColor: '#1E293B', backgroundColor: '#0F172A', height: '100%' }}
            onClick={() => navigate('/app/teach/resources')}
          >
            <FileTextOutlined style={{ fontSize: 32, color: '#FBBF24', marginBottom: 16 }} />
            <Title level={4} style={{ margin: '0 0 8px 0', color: '#F8FAFC' }}>
              Belge İşleme & Ayrıştırma
            </Title>
            <Paragraph style={{ color: '#94A3B8', fontSize: 13, margin: 0 }}>
              Ders notlarını, slaytları ve kaynak kitapları yükleyin; kaynak koordinatları korunmuş anlamsal bölümler çıkarın.
            </Paragraph>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            hoverable
            bordered
            style={{ borderRadius: 14, borderColor: '#1E293B', backgroundColor: '#0F172A', height: '100%' }}
            onClick={() => navigate('/app/teach/analytics')}
          >
            <LineChartOutlined style={{ fontSize: 32, color: '#34D399', marginBottom: 16 }} />
            <Title level={4} style={{ margin: '0 0 8px 0', color: '#F8FAFC' }}>
              Sınıf Başarı Analitiği
            </Title>
            <Paragraph style={{ color: '#94A3B8', fontSize: 13, margin: 0 }}>
              Öğrencilerin en çok zorlandığı kavramları ve yüksek hata oranına sahip konuları tespit edin.
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
