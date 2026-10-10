import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Tag,
  Typography,
  Spin,
  Alert,
  message,
  Space,
} from 'antd';
import {
  PlusOutlined,
  LinkOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { api } from '../../lib/api';

const { Title, Paragraph, Text } = Typography;

export const ClassroomManagerView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Invite modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<any>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const res = await api.classrooms.list();
      if (res.success && res.data) {
        setClassrooms(res.data);
      }
    } catch (err) {
      console.error('Error fetching classrooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const handleCreateClassroom = async (values: any) => {
    setCreating(true);
    try {
      const res = await api.classrooms.create({
        name: values.name.trim(),
        description: values.description?.trim(),
      });
      if (res.success) {
        message.success('Sınıf başarıyla oluşturuldu');
        setCreateModalOpen(false);
        await fetchClassrooms();
      } else {
        message.error(res.error || 'Sınıf oluşturulamadı');
      }
    } catch (err: any) {
      message.error(err.message || 'Sınıf oluşturulurken hata oluştu');
    } finally {
      setCreating(false);
    }
  };

  const handleGenerateInvite = async (values: any) => {
    if (!selectedClassroom) return;
    setGeneratingInvite(true);
    try {
      const res = await api.classrooms.createInvitation(selectedClassroom.id, {
        max_uses: values.maxUses || 50,
        expires_in_days: values.expiresInDays || 14,
      });

      if (res.success && res.data) {
        const rawToken = res.data.raw_token;
        const fullUrl = `${window.location.origin}/invite/${rawToken}`;
        setGeneratedInviteUrl(fullUrl);
        message.success('Kriptografik davet bağlantısı oluşturuldu');
      } else {
        message.error(res.error || 'Davet bağlantısı oluşturulamadı');
      }
    } catch (err: any) {
      message.error(err.message || 'Davet oluşturulurken hata oluştu');
    } finally {
      setGeneratingInvite(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Davet bağlantısı panoya kopyalandı!');
  };

  const columns = [
    {
      title: 'Sınıf Adı ve Açıklaması',
      key: 'name',
      render: (_: any, r: any) => (
        <div>
          <Text strong style={{ fontSize: 15, color: '#0F172A', display: 'block' }}>
            {r.name}
          </Text>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {r.description || 'Akademik çalışma grubu.'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Ders Sayısı',
      key: 'courses',
      render: (_: any, r: any) => (
        <Tag color="blue">{r.courses?.length || 0} Ders</Tag>
      ),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, r: any) => (
        <Space>
          <Button
            size="small"
            icon={<LinkOutlined />}
            onClick={() => {
              setSelectedClassroom(r);
              setGeneratedInviteUrl(null);
              setInviteModalOpen(true);
            }}
          >
            Davet Bağlantısı Oluştur
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16, color: '#64748B' }}>Sınıf yönetim paneli yükleniyor...</Paragraph>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 16px 64px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
            Sınıf Yönetimi
          </Title>
          <Text style={{ fontSize: 15, color: '#64748B' }}>
            Akademik sınıfları yönetin, dersleri yapılandırın ve kriptografik katılım bağlantıları dağıtın.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalOpen(true)}
          style={{ backgroundColor: '#2563EB', borderRadius: 8, height: 40, fontWeight: 600 }}
        >
          Yeni Sınıf Oluştur
        </Button>
      </div>

      <Card bordered style={{ borderRadius: 16, borderColor: '#E2E8F0' }}>
        <Table
          dataSource={classrooms}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* Create Classroom Modal */}
      <Modal
        title="Yeni Akademik Sınıf Oluştur"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleCreateClassroom} style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Sınıf Adı"
            rules={[{ required: true, message: 'Lütfen bir sınıf adı giriniz' }]}
          >
            <Input placeholder="Örn: Dönem 3 Biyofarmasötik & Farmakokinetik" size="large" />
          </Form.Item>

          <Form.Item name="description" label="Açıklama / Akademik Dönem">
            <Input.TextArea rows={3} placeholder="Eczacılık Fakültesi, 2026 Güz Dönemi" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={creating}
            block
            size="large"
            style={{ backgroundColor: '#2563EB', borderRadius: 8 }}
          >
            Sınıfı Oluştur
          </Button>
        </Form>
      </Modal>

      {/* Generate Invitation Modal */}
      <Modal
        title={`Davet Bağlantısı Oluştur: ${selectedClassroom?.name || ''}`}
        open={inviteModalOpen}
        onCancel={() => {
          setInviteModalOpen(false);
          setGeneratedInviteUrl(null);
        }}
        footer={null}
      >
        <div style={{ padding: '8px 0' }}>
          {!generatedInviteUrl ? (
            <Form
              layout="vertical"
              onFinish={handleGenerateInvite}
              initialValues={{ maxUses: 50, expiresInDays: 14 }}
            >
              <Paragraph style={{ color: '#64748B' }}>
                Süreli ve kullanım sınırı belirlenmiş kriptografik sınıf kayıt bağlantısı oluşturun.
              </Paragraph>

              <Form.Item name="maxUses" label="Maksimum Katılımcı Sayısı">
                <InputNumber min={1} max={500} style={{ width: '100%' }} size="large" />
              </Form.Item>

              <Form.Item name="expiresInDays" label="Bağlantı Geçerlilik Süresi (Gün)">
                <InputNumber min={1} max={90} style={{ width: '100%' }} size="large" />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                loading={generatingInvite}
                block
                size="large"
                style={{ backgroundColor: '#2563EB', borderRadius: 8 }}
              >
                Kriptografik Bağlantı Üret
              </Button>
            </Form>
          ) : (
            <div>
              <Alert
                message="Davet Bağlantısı Hazır"
                description="Bu bağlantıyı öğrencilerinizle paylaşın. Bağlantıya tıklayan öğrenciler doğrudan bu sınıfa kaydedilecektir."
                type="success"
                showIcon
                style={{ marginBottom: 16, borderRadius: 8 }}
              />

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  backgroundColor: '#F8FAFC',
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  alignItems: 'center',
                }}
              >
                <Text ellipsis style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }}>
                  {generatedInviteUrl}
                </Text>
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(generatedInviteUrl)}
                  type="primary"
                  style={{ backgroundColor: '#2563EB' }}
                >
                  Kopyala
                </Button>
              </div>

              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <Button onClick={() => setGeneratedInviteUrl(null)}>Yeni Bağlantı Oluştur</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
