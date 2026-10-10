import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Button, Tag, Input, Modal, Alert, Spin, Empty } from 'antd';
import { TeamOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import { useRouter } from '../../context/RouterContext';
import { api } from '../../lib/api';

const { Title, Paragraph, Text } = Typography;

export const ClassroomsView: React.FC = () => {
  const { navigate } = useRouter();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const [submittingToken, setSubmittingToken] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const res = await api.classrooms.list();
      if (res.success && res.data) {
        setClassrooms(res.data);
      }
    } catch (e) {
      console.error('Error fetching classrooms:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const handleRedeemInvite = async () => {
    if (!inviteToken.trim()) return;
    setSubmittingToken(true);
    setInviteError(null);
    try {
      // If user pasted a full URL, extract token from path
      const token = inviteToken.includes('/')
        ? inviteToken.split('/').pop()?.split('?')[0] || inviteToken.trim()
        : inviteToken.trim();

      const res = await api.classrooms.redeemInvitation(token);
      if (res.success) {
        setInviteModalOpen(false);
        setInviteToken('');
        await fetchClassrooms();
      } else {
        setInviteError(res.error || 'Bu davet kodu ile sınıfa katılınamadı.');
      }
    } catch (err: any) {
      setInviteError(err.message || 'Davet kodu kullanılırken hata oluştu.');
    } finally {
      setSubmittingToken(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16, color: '#64748B' }}>Kayıtlı sınıflarınız yükleniyor...</Paragraph>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '32px 16px 64px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
            Akademik Sınıflar & Dersler
          </Title>
          <Text style={{ fontSize: 15, color: '#64748B' }}>
            Kayıtlı olduğunuz sınıflar, yapılandırılmış ders modülleri ve eğitim materyalleri.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setInviteModalOpen(true)}
          style={{ backgroundColor: '#2563EB', borderRadius: 8, height: 40, fontWeight: 600 }}
        >
          Sınıfa Katıl
        </Button>
      </div>

      {classrooms.length === 0 ? (
        <Card bordered style={{ borderRadius: 16, textAlign: 'center', padding: '48px 20px' }}>
          <Empty
            description={
              <div>
                <Title level={4} style={{ color: '#334155' }}>Henüz Bir Sınıfa Kayıtlı Değilsiniz</Title>
                <Paragraph style={{ color: '#64748B' }}>
                  Henüz herhangi bir akademik sınıfa eklenmediniz. Eğitmeninizden sınıf davet bağlantısı veya kodu talep edebilirsiniz.
                </Paragraph>
              </div>
            }
          >
            <Button
              type="primary"
              onClick={() => setInviteModalOpen(true)}
              style={{ backgroundColor: '#2563EB', borderRadius: 8 }}
            >
              Davet Kodu Gir
            </Button>
          </Empty>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {classrooms.map((cr) => (
            <Card
              key={cr.id}
              bordered
              style={{
                borderRadius: 16,
                borderColor: '#E2E8F0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TeamOutlined style={{ color: '#2563EB', fontSize: 20 }} />
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{cr.name}</span>
                </div>
              }
              extra={
                <Tag color="blue" style={{ borderRadius: 6 }}>
                  {cr.courses?.length || 0} Ders
                </Tag>
              }
            >
              {cr.description && (
                <Paragraph style={{ color: '#64748B', marginBottom: 20 }}>
                  {cr.description}
                </Paragraph>
              )}

              {cr.courses && cr.courses.length > 0 ? (
                <Row gutter={[16, 16]}>
                  {cr.courses.map((course: any) => (
                    <Col xs={24} sm={12} md={8} key={course.id}>
                      <Card
                        hoverable
                        bordered
                        style={{
                          borderRadius: 12,
                          borderColor: '#E2E8F0',
                          backgroundColor: '#F8FAFC',
                          height: '100%',
                        }}
                        onClick={() => navigate(`/app/courses/${course.id}`)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Tag color="geekblue">{course.code || 'DERS'}</Tag>
                          <RightOutlined style={{ fontSize: 12, color: '#94A3B8' }} />
                        </div>
                        <Title level={5} style={{ margin: '4px 0 8px 0', fontSize: 16, color: '#0F172A' }}>
                          {course.title}
                        </Title>
                        <Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                          {course.description || 'Yapılandırılmış akademik pratik müfredatı.'}
                        </Paragraph>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div style={{ padding: '16px 0', color: '#94A3B8', fontStyle: 'italic' }}>
                  Bu sınıfta henüz yayınlanmış bir ders bulunmamaktadır.
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Join Classroom Modal */}
      <Modal
        title="Sınıfa Katıl"
        open={inviteModalOpen}
        onCancel={() => {
          setInviteModalOpen(false);
          setInviteError(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setInviteModalOpen(false)}>
            Vazgeç
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submittingToken}
            onClick={handleRedeemInvite}
            style={{ backgroundColor: '#2563EB' }}
          >
            Kodu Kullan ve Katıl
          </Button>,
        ]}
      >
        <div style={{ padding: '12px 0' }}>
          <Paragraph style={{ color: '#64748B' }}>
            Ders eğitmeniniz tarafından paylaşılan davet kodunu veya bağlantısını yapıştırın:
          </Paragraph>
          {inviteError && (
            <Alert message={inviteError} type="error" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />
          )}
          <Input
            placeholder="Örn: inv_4f89ab... veya https://cenna.live/invite/..."
            value={inviteToken}
            onChange={(e) => setInviteToken(e.target.value)}
            size="large"
          />
        </div>
      </Modal>
    </div>
  );
};
