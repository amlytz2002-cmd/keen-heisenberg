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
        message.success('Classroom created successfully');
        setCreateModalOpen(false);
        await fetchClassrooms();
      } else {
        message.error(res.error || 'Failed to create classroom');
      }
    } catch (err: any) {
      message.error(err.message || 'Error creating classroom');
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
        message.success('Cryptographic invitation created');
      } else {
        message.error(res.error || 'Failed to generate invitation');
      }
    } catch (err: any) {
      message.error(err.message || 'Error generating invitation');
    } finally {
      setGeneratingInvite(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Invitation link copied to clipboard!');
  };

  const columns = [
    {
      title: 'Classroom Name & Description',
      key: 'name',
      render: (_: any, r: any) => (
        <div>
          <Text strong style={{ fontSize: 15, color: '#0F172A', display: 'block' }}>
            {r.name}
          </Text>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {r.description || 'Academic study group.'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Courses',
      key: 'courses',
      render: (_: any, r: any) => (
        <Tag color="blue">{r.courses?.length || 0} Courses</Tag>
      ),
    },
    {
      title: 'Actions',
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
            Create Invite Link
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16, color: '#64748B' }}>Loading classroom administration...</Paragraph>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 16px 64px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
            Classroom Administration
          </Title>
          <Text style={{ fontSize: 15, color: '#64748B' }}>
            Manage academic classrooms, configure courses, and distribute cryptographic enrollment tokens.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalOpen(true)}
          style={{ backgroundColor: '#2563EB', borderRadius: 8, height: 40, fontWeight: 600 }}
        >
          Create Classroom
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
        title="Create New Academic Classroom"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleCreateClassroom} style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Classroom Name"
            rules={[{ required: true, message: 'Please enter a classroom name' }]}
          >
            <Input placeholder="e.g. Dönem 3 Biyofarmasötik & Farmakokinetik" size="large" />
          </Form.Item>

          <Form.Item name="description" label="Description / Academic Year">
            <Input.TextArea rows={3} placeholder="Faculty of Pharmacy, Fall 2026 cohort" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={creating}
            block
            size="large"
            style={{ backgroundColor: '#2563EB', borderRadius: 8 }}
          >
            Create Classroom
          </Button>
        </Form>
      </Modal>

      {/* Generate Invitation Modal */}
      <Modal
        title={`Generate Invite Link: ${selectedClassroom?.name}`}
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
                Generate a single-use or multi-use cryptographic enrollment token with expiration.
              </Paragraph>

              <Form.Item name="maxUses" label="Max Permitted Redemptions">
                <InputNumber min={1} max={500} style={{ width: '100%' }} size="large" />
              </Form.Item>

              <Form.Item name="expiresInDays" label="Link Validity (Days)">
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
                Generate Cryptographic Link
              </Button>
            </Form>
          ) : (
            <div>
              <Alert
                message="Invitation Token Ready"
                description="Share this link with your students. Upon clicking, their account will be enrolled into this classroom immediately."
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
                  Copy
                </Button>
              </div>

              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <Button onClick={() => setGeneratedInviteUrl(null)}>Create Another</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
