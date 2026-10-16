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
import { PlusOutlined, AppstoreOutlined } from '@ant-design/icons';
import { api } from '../../lib/api';

const { Title, Paragraph, Text } = Typography;

export const CourseManagerView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [createCourseOpen, setCreateCourseOpen] = useState(false);
  const [creatingCourse, setCreatingCourse] = useState(false);

  const [addModuleOpen, setAddModuleOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [creatingModule, setCreatingModule] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coRes, clRes] = await Promise.all([
        api.courses.list(),
        api.classrooms.list(),
      ]);
      if (coRes.success && coRes.data) setCourses(coRes.data);
      if (clRes.success && clRes.data) setClassrooms(clRes.data);
    } catch (err) {
      console.error('Error fetching courses data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCourse = async (values: any) => {
    setCreatingCourse(true);
    try {
      const res = await api.courses.create({
        classroom_id: values.classroom_id,
        title: values.title.trim(),
        code: values.code?.trim(),
        description: values.description?.trim(),
      });

      if (res.success) {
        message.success('Ders başarıyla oluşturuldu');
        setCreateCourseOpen(false);
        await fetchData();
      } else {
        message.error(res.error || 'Ders oluşturulamadı');
      }
    } catch (err: any) {
      message.error(err.message || 'Ders oluşturulurken bir hata meydana geldi');
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleAddModule = async (values: any) => {
    if (!selectedCourse) return;
    setCreatingModule(true);
    try {
      const res = await api.courses.createModule(selectedCourse.id, {
        title: values.title.trim(),
        description: values.description?.trim(),
      });

      if (res.success) {
        message.success('Modül müfredata başarıyla eklendi');
        setAddModuleOpen(false);
        await fetchData();
      } else {
        message.error(res.error || 'Modül eklenemedi');
      }
    } catch (err: any) {
      message.error(err.message || 'Modül eklenirken bir hata meydana geldi');
    } finally {
      setCreatingModule(false);
    }
  };

  const columns = [
    {
      title: 'Ders Başlığı ve Kodu',
      key: 'title',
      render: (_: any, r: any) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag color="blue">{r.code || 'DERS'}</Tag>
            <Text strong style={{ fontSize: 15, color: '#F8FAFC' }}>
              {r.title}
            </Text>
          </div>
          <Text type="secondary" style={{ fontSize: 13, marginTop: 4, display: 'block', color: '#94A3B8' }}>
            {r.description || 'Yapılandırılmış aktif hatırlama müfredatı.'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Sınıf',
      key: 'classroom',
      render: (_: any, r: any) => (
        <span style={{ color: '#CBD5E1' }}>{r.classroom?.name || 'Genel Ders'}</span>
      ),
    },
    {
      title: 'Modüller',
      key: 'modules',
      render: (_: any, r: any) => (
        <Tag color="cyan">{r.modules?.length || 0} Modül</Tag>
      ),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, r: any) => (
        <Space>
          <Button
            size="small"
            icon={<AppstoreOutlined />}
            onClick={() => {
              setSelectedCourse(r);
              setAddModuleOpen(true);
            }}
          >
            Modül Ekle
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16, color: '#94A3B8' }}>Ders yönetimi yükleniyor...</Paragraph>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 16px 64px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#F8FAFC' }}>
            Ders ve Müfredat Mimarisi
          </Title>
          <Text style={{ fontSize: 15, color: '#94A3B8' }}>
            Yapılandırılmış öğrenme modülleri oluşturun ve müfredat kavramlarını sabitleyin.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateCourseOpen(true)}
          style={{ backgroundColor: '#2563EB', borderColor: '#2563EB', borderRadius: 8, height: 40, fontWeight: 600 }}
        >
          Yeni Ders Oluştur
        </Button>
      </div>

      <Card bordered style={{ borderRadius: 16, borderColor: '#1E293B', backgroundColor: '#0F172A' }}>
        <Table
          dataSource={courses}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* Create Course Modal */}
      <Modal
        title="Yeni Akademik Ders Oluştur"
        open={createCourseOpen}
        onCancel={() => setCreateCourseOpen(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleCreateCourse} style={{ marginTop: 16 }}>
          <Form.Item name="classroom_id" label="Atanan Sınıf">
            <Select placeholder="Sınıf seçin (isteğe bağlı)" allowClear>
              {classrooms.map((cr) => (
                <Select.Option key={cr.id} value={cr.id}>
                  {cr.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="Ders Başlığı"
            rules={[{ required: true, message: 'Lütfen ders başlığını girin' }]}
          >
            <Input placeholder="Örn: Klinik Farmakokinetik" size="large" />
          </Form.Item>

          <Form.Item name="code" label="Ders Kodu">
            <Input placeholder="Örn: FAR-304" size="large" />
          </Form.Item>

          <Form.Item name="description" label="Ders Özeti / Müfredat Hedefleri">
            <Input.TextArea rows={3} placeholder="Klerens, dağılım hacmi, yarılanma ömrü ve dozaj rejimleri odağında." />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={creatingCourse}
            block
            size="large"
            style={{ backgroundColor: '#2563EB', borderRadius: 8 }}
          >
            Dersi Oluştur
          </Button>
        </Form>
      </Modal>

      {/* Add Module Modal */}
      <Modal
        title={`${selectedCourse?.title || 'Derse'} Müfredat Modülü Ekle`}
        open={addModuleOpen}
        onCancel={() => setAddModuleOpen(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleAddModule} style={{ marginTop: 16 }}>
          <Form.Item
            name="title"
            label="Modül Başlığı"
            rules={[{ required: true, message: 'Lütfen modül başlığını girin' }]}
          >
            <Input placeholder="Örn: Modül 1: Klerens ve Cockcroft-Gault Denklemi" size="large" />
          </Form.Item>

          <Form.Item name="description" label="Modül Kapsamı / Öğrenme Hedefleri">
            <Input.TextArea rows={3} placeholder="Düzeltilmiş vücut ağırlığı ile kadın ve erkek hastalarda CrCl hesaplama prensipleri." />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={creatingModule}
            block
            size="large"
            style={{ backgroundColor: '#2563EB', borderRadius: 8 }}
          >
            Modülü Ekle
          </Button>
        </Form>
      </Modal>
    </div>
  );
};
