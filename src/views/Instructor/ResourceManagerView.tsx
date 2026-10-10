import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Typography,
  Spin,
  message,
  Space,
} from 'antd';
import {
  FileTextOutlined,
  UploadOutlined,
  SyncOutlined,
  RobotOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { api } from '../../lib/api';
import { useRouter } from '../../context/RouterContext';

const { Title, Paragraph, Text } = Typography;

export const ResourceManagerView: React.FC = () => {
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Chunks viewer modal
  const [chunksModalOpen, setChunksModalOpen] = useState(false);
  const [selectedResourceChunks, setSelectedResourceChunks] = useState<any[]>([]);
  const [selectedResourceTitle, setSelectedResourceTitle] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRes, coRes] = await Promise.all([
        api.resources.list(),
        api.courses.list(),
      ]);
      if (resRes.success && resRes.data) setResources(resRes.data);
      if (coRes.success && coRes.data) setCourses(coRes.data);
    } catch (err) {
      console.error('Error fetching resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUploadResource = async (values: any) => {
    setUploading(true);
    try {
      let filePath = `raw_text_${Date.now()}.txt`;
      let fileSize = values.rawText ? values.rawText.length : 1024;
      let mimeType = 'text/plain';

      // If user provided raw text directly
      const rawText = values.rawText?.trim();

      const res = await api.resources.create({
        course_id: values.course_id,
        title: values.title.trim(),
        file_path: filePath,
        file_type: 'txt',
        file_size_bytes: fileSize,
        mime_type: mimeType,
        raw_text: rawText,
      });

      if (res.success && res.data?.id) {
        message.success('Kaynak kaydedildi. Semantik parçalara ayrılıyor...');
        setUploadModalOpen(false);

        // Trigger immediate processing
        await api.resources.process(res.data.id, rawText);
        await fetchData();
      } else {
        message.error(res.error || 'Kaynak oluşturulamadı');
      }
    } catch (err: any) {
      message.error(err.message || 'Kaynak yüklenirken bir hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleProcessResource = async (resourceId: string) => {
    setProcessingId(resourceId);
    try {
      const res = await api.resources.process(resourceId);
      if (res.success) {
        message.success(`Belge başarıyla ${res.data?.chunks_count || 0} anlamsal parçaya ayrıldı`);
        await fetchData();
      } else {
        message.error(res.error || 'Belge işleme başarısız oldu');
      }
    } catch (err: any) {
      message.error(err.message || 'Kaynak işlenirken bir hata oluştu');
    } finally {
      setProcessingId(null);
    }
  };

  const handleGenerateAI = async (resourceId: string, courseId?: string) => {
    setProcessingId(resourceId);
    try {
      const res = await api.ai.generate({
        resource_id: resourceId,
        course_id: courseId,
        mode: 'all',
      });
      if (res.success) {
        message.success('Kavramlar ve sorular oluşturuldu ve İçerik İnceleme Alanı\'na aktarıldı!');
        navigate('/app/teach/content-review');
      } else {
        message.error(res.error || 'Yapay zekâ üretim süreci başarısız oldu');
      }
    } catch (err: any) {
      message.error(err.message || 'İçerik üretilirken bir hata oluştu');
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewChunks = (r: any) => {
    setSelectedResourceTitle(r.title);
    setSelectedResourceChunks(r.chunks || []);
    setChunksModalOpen(true);
  };

  const columns = [
    {
      title: 'Kaynak Başlığı ve Türü',
      key: 'title',
      render: (_: any, r: any) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ color: '#2563EB' }} />
            <Text strong style={{ fontSize: 15, color: '#0F172A' }}>
              {r.title}
            </Text>
            <Tag style={{ textTransform: 'uppercase', fontSize: 11 }}>{r.file_type || 'TXT'}</Tag>
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Ders: {r.course?.title || 'Atanmamış'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Durum ve Parçalar',
      key: 'status',
      render: (_: any, r: any) => {
        let color = 'default';
        let statusLabel = 'Beklemede';
        if (r.processing_status === 'completed') {
          color = 'green';
          statusLabel = 'Tamamlandı';
        } else if (r.processing_status === 'processing') {
          color = 'processing';
          statusLabel = 'İşleniyor';
        } else if (r.processing_status === 'failed') {
          color = 'error';
          statusLabel = 'Başarısız';
        }

        return (
          <Space>
            <Tag color={color}>
              {statusLabel}
            </Tag>
            {r.chunks && r.chunks.length > 0 && (
              <Tag color="purple">{r.chunks.length} Parça</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Kaynak Doğrulama ve Çıkarım',
      key: 'actions',
      render: (_: any, r: any) => (
        <Space>
          {r.processing_status !== 'completed' ? (
            <Button
              size="small"
              icon={<SyncOutlined spin={processingId === r.id} />}
              loading={processingId === r.id}
              onClick={() => handleProcessResource(r.id)}
            >
              Metni Parçala
            </Button>
          ) : (
            <>
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewChunks(r)}
              >
                Parçaları Görüntüle
              </Button>
              <Button
                size="small"
                type="primary"
                icon={<RobotOutlined />}
                loading={processingId === r.id}
                onClick={() => handleGenerateAI(r.id, r.course_id)}
                style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}
              >
                Yapay Zekâ ile Çıkar
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16, color: '#64748B' }}>Belge işleme hattı yükleniyor...</Paragraph>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 16px 64px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
            Ders Belgeleri ve Semantik Parçalama
          </Title>
          <Text style={{ fontSize: 15, color: '#64748B' }}>
            Yetkili ders materyallerini yükleyin, paragraf kaynak bağıyla semantik parçalara ayırın ve soru taslakları üretin.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={() => setUploadModalOpen(true)}
          style={{ backgroundColor: '#2563EB', borderRadius: 8, height: 40, fontWeight: 600 }}
        >
          Yeni Belge Ekle
        </Button>
      </div>

      <Card bordered style={{ borderRadius: 16, borderColor: '#E2E8F0' }}>
        <Table
          dataSource={resources}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* Upload / Ingest Document Modal */}
      <Modal
        title="Öğrenme Belgesini Depoya Ekle"
        open={uploadModalOpen}
        onCancel={() => setUploadModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form layout="vertical" onFinish={handleUploadResource} style={{ marginTop: 16 }}>
          <Form.Item name="course_id" label="Ders ile İlişkilendir">
            <Select placeholder="Ders seçin (isteğe bağlı)" allowClear>
              {courses.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="Belge Başlığı"
            rules={[{ required: true, message: 'Lütfen belge başlığını girin' }]}
          >
            <Input placeholder="Örn: Klinik Farmakokinetik 04. Hafta — Renal Klerens ve Doz Ayarı" size="large" />
          </Form.Item>

          <Form.Item
            name="rawText"
            label="Belge İçeriği / Ders Notu Metni"
            rules={[{ required: true, message: 'Lütfen semantik parçalama için kaynak metni girin' }]}
          >
            <Input.TextArea
              rows={8}
              placeholder="Ders notlarını, akademik kitap alıntılarını, formülleri veya klinik vaka çalışmalarını buraya yapıştırın..."
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={uploading}
            block
            size="large"
            style={{ backgroundColor: '#2563EB', borderRadius: 8 }}
          >
            Belgeyi Kaydet ve Parçala
          </Button>
        </Form>
      </Modal>

      {/* Chunks Viewer Modal */}
      <Modal
        title={`Ayrıştırılan Semantik Parçalar: ${selectedResourceTitle}`}
        open={chunksModalOpen}
        onCancel={() => setChunksModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setChunksModalOpen(false)}>
            Kapat
          </Button>,
        ]}
        width={720}
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '8px 0' }}>
          {selectedResourceChunks.length === 0 ? (
            <Paragraph style={{ color: '#64748B' }}>Henüz çıkarılmış bir semantik parça bulunmuyor.</Paragraph>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selectedResourceChunks.map((chunk, idx) => (
                <Card
                  key={chunk.id || idx}
                  size="small"
                  bordered
                  style={{ borderRadius: 8, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Tag color="blue">Parça #{chunk.chunk_index || idx + 1}</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Sayfa {chunk.page_number || 1} · {chunk.token_count || 120} belirteç
                    </Text>
                  </div>
                  <Paragraph style={{ margin: 0, fontSize: 13, color: '#334155' }}>
                    {chunk.content}
                  </Paragraph>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
