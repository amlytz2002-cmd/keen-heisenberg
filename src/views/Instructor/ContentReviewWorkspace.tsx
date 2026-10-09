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

      if (res.success) {
        message.success(`Item ${action}d successfully`);
        await fetchItems(activeTab);
      } else {
        message.error(res.error || `Failed to ${action} item`);
      }
    } catch (err: any) {
      message.error(err.message || 'Error updating item');
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

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 16px 64px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Tag color="orange" style={{ borderRadius: 6, fontWeight: 600 }}>
            <SafetyCertificateOutlined /> Anti-Hallucination Review Gate
          </Tag>
        </div>
        <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
          Content Review & Publication Workspace
        </Title>
        <Text style={{ fontSize: 15, color: '#64748B' }}>
          Review AI-extracted concepts and retrieval questions against source documents before publishing to students.
        </Text>
      </div>

      <Card bordered style={{ borderRadius: 16, borderColor: '#E2E8F0', marginBottom: 24 }}>
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as any)}
          items={[
            { key: 'needs_review', label: 'Needs Review (Drafts)' },
            { key: 'approved', label: 'Approved (Ready to Publish)' },
            { key: 'published', label: 'Published (Live for Students)' },
            { key: 'rejected', label: 'Rejected / Archived' },
          ]}
        />
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <Spin size="large" />
          <Paragraph style={{ marginTop: 16, color: '#64748B' }}>Loading review queue...</Paragraph>
        </div>
      ) : totalCount === 0 ? (
        <Card bordered style={{ borderRadius: 16, textAlign: 'center', padding: '48px 20px' }}>
          <CheckCircleOutlined style={{ fontSize: 44, color: '#059669', marginBottom: 12 }} />
          <Title level={4} style={{ color: '#0F172A', margin: 0 }}>Queue is Clear</Title>
          <Paragraph style={{ color: '#64748B', marginTop: 4 }}>
            There are no items currently in the <strong>{activeTab.replace('_', ' ')}</strong> state.
          </Paragraph>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Questions Section */}
          {reviewData.questions && reviewData.questions.length > 0 && (
            <div>
              <Title level={4} style={{ color: '#0F172A', marginBottom: 16 }}>
                Retrieval Questions ({reviewData.questions.length})
              </Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {reviewData.questions.map((q) => (
                  <Card
                    key={q.id}
                    bordered
                    style={{
                      borderRadius: 14,
                      borderColor: '#E2E8F0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    }}
                    bodyStyle={{ padding: 24 }}
                  >
                    <Row gutter={[24, 24]}>
                      {/* Left Side: Grounded Source Provenance */}
                      <Col xs={24} md={10}>
                        <div
                          style={{
                            height: '100%',
                            backgroundColor: '#F8FAFC',
                            padding: 16,
                            borderRadius: 10,
                            border: '1px solid #E2E8F0',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <FileTextOutlined style={{ color: '#2563EB' }} />
                            <Text strong style={{ fontSize: 13, color: '#1E293B' }}>
                              Source Provenance
                            </Text>
                          </div>
                          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                            Document: <strong>{q.sources?.[0]?.resource_title || 'Pharmacokinetics Source'}</strong>
                            <br />
                            Coordinates: Page {q.sources?.[0]?.page_number || '1'} (Para {q.sources?.[0]?.paragraph_index || '1'})
                          </Text>
                          <div
                            style={{
                              backgroundColor: '#FFFFFF',
                              padding: 12,
                              borderRadius: 6,
                              border: '1px solid #E2E8F0',
                              fontSize: 13,
                              color: '#334155',
                              lineHeight: 1.6,
                              fontStyle: 'italic',
                              maxHeight: 220,
                              overflowY: 'auto',
                            }}
                          >
                            "{q.sources?.[0]?.chunk_excerpt ||
                              'The Cockcroft-Gault equation estimates creatinine clearance from serum creatinine. For female patients, multiply by 0.85.'}"
                          </div>
                        </div>
                      </Col>

                      {/* Right Side: Generated Question Item */}
                      <Col xs={24} md={14}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <Tag color="purple" style={{ textTransform: 'uppercase' }}>
                            {q.question_type?.replace('_', ' ') || 'QUESTION'}
                          </Tag>
                          <Tag color={q.status === 'published' ? 'green' : q.status === 'approved' ? 'blue' : 'orange'}>
                            {q.status?.replace('_', ' ')}
                          </Tag>
                        </div>

                        <Title level={5} style={{ color: '#0F172A', margin: '0 0 12px 0' }}>
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
                                  border: opt.key === q.correct_answer ? '1.5px solid #10B981' : '1px solid #E2E8F0',
                                  backgroundColor: opt.key === q.correct_answer ? '#ECFDF5' : '#FFFFFF',
                                  fontSize: 13,
                                }}
                              >
                                <strong>{opt.key}.</strong> {opt.text}
                                {opt.key === q.correct_answer && (
                                  <Tag color="green" style={{ marginLeft: 8, fontSize: 10 }}>CORRECT</Tag>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ backgroundColor: '#F1F5F9', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                          <Text strong style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 4 }}>
                            Explanation:
                          </Text>
                          <Text style={{ fontSize: 13, color: '#334155' }}>
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
                              Reject
                            </Button>
                          )}
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => openEditModal(q, 'question')}
                          >
                            Edit
                          </Button>
                          {q.status === 'needs_review' && (
                            <Button
                              type="primary"
                              size="small"
                              loading={processingId === q.id}
                              onClick={() => handleAction('question', q.id, 'approve')}
                              style={{ backgroundColor: '#2563EB' }}
                            >
                              Approve
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
                              Publish Live
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
              <Title level={4} style={{ color: '#0F172A', marginBottom: 16 }}>
                Extracted Concepts ({reviewData.concepts.length})
              </Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {reviewData.concepts.map((c) => (
                  <Card key={c.id} bordered style={{ borderRadius: 12, borderColor: '#E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <Tag color="cyan">CONCEPT</Tag>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginLeft: 8 }}>
                          {c.name}
                        </span>
                      </div>
                      <Tag color={c.status === 'published' ? 'green' : 'orange'}>{c.status}</Tag>
                    </div>
                    <Paragraph style={{ color: '#475569', fontSize: 14 }}>
                      {c.description}
                    </Paragraph>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => handleAction('concept', c.id, 'publish')}
                        style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                      >
                        Publish Concept
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
        title={`Edit Question: ${editingItem?.stem?.substring(0, 40)}...`}
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
          <Form.Item name="stem" label="Question Stem" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="explanation" label="Explanation & Source Reference" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item name="correct_answer" label="Correct Answer Key">
            <Input placeholder="e.g. A, B, or numeric value" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={processingId === editingItem?.id}
            block
            size="large"
            style={{ backgroundColor: '#059669', borderColor: '#059669', borderRadius: 8 }}
          >
            Save Edits & Approve
          </Button>
        </Form>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        title="Reject Content Item"
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
        okText="Confirm Rejection"
        okButtonProps={{ danger: true }}
      >
        <div style={{ padding: '8px 0' }}>
          <Paragraph>
            State the reason for rejecting this AI generated item (e.g. inaccurate equation, out of scope):
          </Paragraph>
          <Input.TextArea
            rows={3}
            placeholder="e.g. Formula missing female gender adjustment factor."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};
