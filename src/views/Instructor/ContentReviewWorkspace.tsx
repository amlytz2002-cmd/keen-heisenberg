import React, { useEffect, useState } from 'react';
import {
  Card,
  Tabs,
  Typography,
  Button,
  Tag,
  Row,
  Col,
  Modal,
  Form,
  Input,
  Spin,
  message,
} from 'antd';
import {
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  EditOutlined,
  SendOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { api } from '../../lib/api';

const { Title, Paragraph, Text } = Typography;

export const ContentReviewWorkspace: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'needs_review' | 'approved' | 'published' | 'rejected'>('needs_review');
  const [reviewData, setReviewData] = useState<{ concepts: any[]; questions: any[] }>({
    concepts: [],
    questions: [],
  });

  // Action states
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingItem, setRejectingItem] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchItems = async (status: string) => {
    setLoading(true);
    try {
      const res = await api.teach.getContentReview({ status });
      if (res.success && res.data) {
        setReviewData(res.data);
      }
    } catch (err) {
      console.error('Error fetching review items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(activeTab);
  }, [activeTab]);

  const handleAction = async (
    itemType: 'concept' | 'question',
    itemId: string,
    action: 'approve' | 'publish' | 'reject' | 'edit_and_approve',
    reason?: string,
    editedPayload?: any
  ) => {
    setProcessingId(itemId);
    try {
      const res = await api.teach.reviewAction({
        item_type: itemType,
        item_id: itemId,
        action,
        rejection_reason: reason,
        edited_payload: editedPayload,
      });

      const actionLabels: Record<string, string> = {
        approve: 'onaylandı',
        publish: 'yayımlandı',
        reject: 'reddedildi',
        edit_and_approve: 'düzenlenip onaylandı',
      };
      const actionErrorLabels: Record<string, string> = {
        approve: 'onaylanamadı',
        publish: 'yayımlanamadı',
        reject: 'reddedilemedi',
        edit_and_approve: 'düzenleme kaydedilemedi',
      };

      if (res.success) {
        message.success(`İçerik başarıyla ${actionLabels[action] || 'işlendi'}.`);
        await fetchItems(activeTab);
      } else {
        message.error(res.error || `İçerik ${actionErrorLabels[action] || 'işlenemedi'}.`);
      }
    } catch (err: any) {
      message.error(err.message || 'Öğe güncellenirken bir hata oluştu');
    } finally {
      setProcessingId(null);
      setEditModalOpen(false);
      setRejectModalOpen(false);
    }
  };

  const openEditModal = (item: any, type: 'concept' | 'question') => {
    setEditingItem({ ...item, _type: type });
    setEditModalOpen(true);
  };

  const openRejectModal = (item: any, type: 'concept' | 'question') => {
    setRejectingItem({ ...item, _type: type });
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const totalCount = (reviewData.concepts?.length || 0) + (reviewData.questions?.length || 0);

  const tabLabels: Record<string, string> = {
    needs_review: 'İnceleme Bekleyenler',
    approved: 'Onaylananlar',
    published: 'Yayındakiler',
    rejected: 'Reddedilenler',
  };

  const questionTypeMap: Record<string, string> = {
    multiple_choice: 'ÇOKTAN SEÇMELİ',
    open_ended: 'AÇIK UÇLU',
    formula: 'FARMAKOKİNETİK HESAPLAMA',
    case_study: 'KLİNİK VAKA',
    cloze: 'BOŞLUK DOLDURMA',
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    published: { label: 'Yayında', color: 'green' },
    approved: { label: 'Onaylandı', color: 'blue' },
    needs_review: { label: 'İnceleme Bekliyor', color: 'orange' },
    rejected: { label: 'Reddedildi', color: 'red' },
  };

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 16px 64px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Tag color="orange" style={{ borderRadius: 6, fontWeight: 600 }}>
            <SafetyCertificateOutlined /> Halüsinasyon Önleyici İnceleme Geçidi
          </Tag>
        </div>
        <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#F8FAFC' }}>
          İçerik İnceleme ve Yayımlama Alanı
        </Title>
        <Text style={{ fontSize: 15, color: '#94A3B8' }}>
          Yapay zekâ tarafından çıkarılan kavram ve aktif hatırlama sorularını öğrencilere sunmadan önce kaynak belgelerle karşılaştırarak doğrulayın.
        </Text>
      </div>

      <Card bordered style={{ borderRadius: 16, borderColor: '#1E293B', backgroundColor: '#0F172A', marginBottom: 24 }}>
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as any)}
          items={[
            { key: 'needs_review', label: 'İnceleme Bekleyenler (Taslak)' },
            { key: 'approved', label: 'Onaylananlar (Yayıma Hazır)' },
            { key: 'published', label: 'Yayındakiler (Öğrencilere Açık)' },
            { key: 'rejected', label: 'Reddedilenler / Arşiv' },
          ]}
        />
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <Spin size="large" />
          <Paragraph style={{ marginTop: 16, color: '#94A3B8' }}>İnceleme kuyruğu yükleniyor...</Paragraph>
        </div>
      ) : totalCount === 0 ? (
        <Card bordered style={{ borderRadius: 16, borderColor: '#1E293B', backgroundColor: '#0F172A', textAlign: 'center', padding: '48px 20px' }}>
          <CheckCircleOutlined style={{ fontSize: 44, color: '#10B981', marginBottom: 12 }} />
          <Title level={4} style={{ color: '#F8FAFC', margin: 0 }}>İnceleme Kuyruğu Boş</Title>
          <Paragraph style={{ color: '#94A3B8', marginTop: 4 }}>
            Şu anda <strong>{tabLabels[activeTab] || activeTab}</strong> aşamasında incelenecek bir içerik bulunmuyor.
          </Paragraph>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Questions Section */}
          {reviewData.questions && reviewData.questions.length > 0 && (
            <div>
              <Title level={4} style={{ color: '#F8FAFC', marginBottom: 16 }}>
                Aktif Hatırlama Soruları ({reviewData.questions.length})
              </Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {reviewData.questions.map((q) => (
                  <Card
                    key={q.id}
                    bordered
                    style={{
                      borderRadius: 14,
                      borderColor: '#1E293B',
                      backgroundColor: '#0F172A',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                    }}
                    bodyStyle={{ padding: 24 }}
                  >
                    <Row gutter={[24, 24]}>
                      {/* Left Side: Grounded Source Provenance */}
                      <Col xs={24} md={10}>
                        <div
                          style={{
                            height: '100%',
                            backgroundColor: '#0B132B',
                            padding: 16,
                            borderRadius: 10,
                            border: '1px solid #1E293B',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <FileTextOutlined style={{ color: '#38BDF8' }} />
                            <Text strong style={{ fontSize: 13, color: '#F8FAFC' }}>
                              Kaynak Bağı (Grounded Provenance)
                            </Text>
                          </div>
                          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8, color: '#94A3B8' }}>
                            Kaynak Belge: <strong style={{ color: '#E2E8F0' }}>{q.sources?.[0]?.resource_title || 'Klinik Farmakokinetik Kaynağı'}</strong>
                            <br />
                            Konum: Sayfa {q.sources?.[0]?.page_number || '1'} (Paragraf {q.sources?.[0]?.paragraph_index || '1'})
                          </Text>
                          <div
                            style={{
                              backgroundColor: '#070D1E',
                              padding: 12,
                              borderRadius: 6,
                              border: '1px solid #1E293B',
                              fontSize: 13,
                              color: '#CBD5E1',
                              lineHeight: 1.6,
                              fontStyle: 'italic',
                              maxHeight: 220,
                              overflowY: 'auto',
                            }}
                          >
                            "{q.sources?.[0]?.chunk_excerpt ||
                              'Cockcroft-Gault denklemi, serum kreatinin düzeyinden kreatinin klerensini tahmin eder. Kadın hastalar için bulunan değer 0.85 katsayısı ile çarpılır.'}"
                          </div>
                        </div>
                      </Col>

                      {/* Right Side: Generated Question Item */}
                      <Col xs={24} md={14}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <Tag color="purple">
                            {questionTypeMap[q.question_type] || q.question_type?.toUpperCase() || 'SORU'}
                          </Tag>
                          <Tag color={statusMap[q.status]?.color || 'default'}>
                            {statusMap[q.status]?.label || q.status}
                          </Tag>
                        </div>

                        <Title level={5} style={{ color: '#F8FAFC', margin: '0 0 12px 0' }}>
                          {q.stem}
                        </Title>

                        {/* Options */}
                        {q.options && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                            {q.options.map((opt: any) => (
                              <div
                                key={opt.key}
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: 6,
                                  border: opt.key === q.correct_answer ? '1.5px solid #10B981' : '1px solid #1E293B',
                                  backgroundColor: opt.key === q.correct_answer ? 'rgba(16, 185, 129, 0.15)' : '#070D1E',
                                  color: '#F8FAFC',
                                  fontSize: 13,
                                }}
                              >
                                <strong style={{ color: opt.key === q.correct_answer ? '#34D399' : '#38BDF8' }}>{opt.key}.</strong> {opt.text}
                                {opt.key === q.correct_answer && (
                                  <Tag color="green" style={{ marginLeft: 8, fontSize: 10 }}>DOĞRU CEVAP</Tag>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ backgroundColor: '#0B132B', padding: 12, borderRadius: 8, border: '1px solid #1E293B', marginBottom: 16 }}>
                          <Text strong style={{ fontSize: 12, color: '#38BDF8', display: 'block', marginBottom: 4 }}>
                            Akademik Açıklama ve Gerekçe:
                          </Text>
                          <Text style={{ fontSize: 13, color: '#CBD5E1' }}>
                            {q.explanation}
                          </Text>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                          {q.status !== 'rejected' && (
                            <Button
                              danger
                              size="small"
                              onClick={() => openRejectModal(q, 'question')}
                            >
                              Reddet
                            </Button>
                          )}
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => openEditModal(q, 'question')}
                          >
                            Düzenle
                          </Button>
                          {q.status === 'needs_review' && (
                            <Button
                              type="primary"
                              size="small"
                              loading={processingId === q.id}
                              onClick={() => handleAction('question', q.id, 'approve')}
                              style={{ backgroundColor: '#2563EB' }}
                            >
                              Onayla
                            </Button>
                          )}
                          {(q.status === 'needs_review' || q.status === 'approved') && (
                            <Button
                              type="primary"
                              size="small"
                              icon={<SendOutlined />}
                              loading={processingId === q.id}
                              onClick={() => handleAction('question', q.id, 'publish')}
                              style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                            >
                              Öğrencilere Yayımla
                            </Button>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Concepts Section */}
          {reviewData.concepts && reviewData.concepts.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Title level={4} style={{ color: '#F8FAFC', marginBottom: 16 }}>
                Çıkarılan Akademik Kavramlar ({reviewData.concepts.length})
              </Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {reviewData.concepts.map((c) => (
                  <Card key={c.id} bordered style={{ borderRadius: 12, borderColor: '#1E293B', backgroundColor: '#0F172A' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <Tag color="cyan">KAVRAM</Tag>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC', marginLeft: 8 }}>
                          {c.name}
                        </span>
                      </div>
                      <Tag color={c.status === 'published' ? 'green' : 'orange'}>
                        {c.status === 'published' ? 'Yayında' : 'İnceleme Bekliyor'}
                      </Tag>
                    </div>
                    <Paragraph style={{ color: '#94A3B8', fontSize: 14 }}>
                      {c.description}
                    </Paragraph>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => handleAction('concept', c.id, 'publish')}
                        style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                      >
                        Kavramı Yayımla
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Item Modal */}
      <Modal
        title={`Soru Düzenleme: ${editingItem?.stem?.substring(0, 40) || ''}...`}
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={null}
        width={680}
      >
        <Form
          layout="vertical"
          initialValues={{
            stem: editingItem?.stem,
            explanation: editingItem?.explanation,
            correct_answer: editingItem?.correct_answer,
          }}
          onFinish={(values) => {
            handleAction(
              editingItem?._type || 'question',
              editingItem?.id,
              'edit_and_approve',
              undefined,
              values
            );
          }}
          style={{ marginTop: 16 }}
        >
          <Form.Item name="stem" label="Soru Kökü" rules={[{ required: true, message: 'Lütfen soru kökünü girin' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="explanation" label="Akademik Açıklama ve Kaynak Referansı" rules={[{ required: true, message: 'Lütfen açıklamayı girin' }]}>
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item name="correct_answer" label="Doğru Cevap Anahtarı">
            <Input placeholder="Örn: A, B veya sayısal değer" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={processingId === editingItem?.id}
            block
            size="large"
            style={{ backgroundColor: '#059669', borderColor: '#059669', borderRadius: 8 }}
          >
            Değişiklikleri Kaydet ve Onayla
          </Button>
        </Form>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        title="İçeriği Reddet"
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        onOk={() => {
          handleAction(
            rejectingItem?._type || 'question',
            rejectingItem?.id,
            'reject',
            rejectReason
          );
        }}
        okText="Reddetmeyi Onayla"
        cancelText="Vazgeç"
        okButtonProps={{ danger: true }}
      >
        <div style={{ padding: '8px 0' }}>
          <Paragraph>
            Bu yapay zekâ üretimini reddetme gerekçenizi belirtin (örn: formül katsayısı eksik, müfredat dışı):
          </Paragraph>
          <Input.TextArea
            rows={3}
            placeholder="Örn: Cockcroft-Gault formülünde kadın cinsiyet düzeltme katsayısı (0.85) atlanmış."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};
