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
        message.success('Course created successfully');
        setCreateCourseOpen(false);
        await fetchData();
      } else {
        message.error(res.error || 'Failed to create course');
      }
    } catch (err: any) {
      message.error(err.message || 'Error creating course');
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
        message.success('Module added to syllabus');
        setAddModuleOpen(false);
        await fetchData();
      } else {
        message.error(res.error || 'Failed to add module');
      }
    } catch (err: any) {
      message.error(err.message || 'Error adding module');
    } finally {
      setCreatingModule(false);
    }
  };

  const columns = [
    {
      title: 'Course Title & Code',
      key: 'title',
      render: (_: any, r: any) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag color="blue">{r.code || 'COURSE'}</Tag>
            <Text strong style={{ fontSize: 15, color: '#0F172A' }}>
              {r.title}
            </Text>
          </div>
          <Text type="secondary" style={{ fontSize: 13, marginTop: 4, display: 'block' }}>
            {r.description || 'Structured retrieval syllabus.'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Classroom',
      key: 'classroom',
      render: (_: any, r: any) => (
        <span>{r.classroom?.name || 'General Course'}</span>
      ),
    },
    {
      title: 'Modules',
      key: 'modules',
      render: (_: any, r: any) => (
        <Tag color="cyan">{r.modules?.length || 0} Modules</Tag>
      ),
    },
    {
      title: 'Actions',
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
            Add Module
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16, color: '#64748B' }}>Loading course management...</Paragraph>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 16px 64px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
            Course & Syllabus Architecture
          </Title>
          <Text style={{ fontSize: 15, color: '#64748B' }}>
            Author structured learning modules and anchor curriculum concepts.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateCourseOpen(true)}
          style={{ backgroundColor: '#2563EB', borderRadius: 8, height: 40, fontWeight: 600 }}
        >
          Create Course
        </Button>
      </div>

      <Card bordered style={{ borderRadius: 16, borderColor: '#E2E8F0' }}>
        <Table
          dataSource={courses}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* Create Course Modal */}
      <Modal
        title="Create New Academic Course"
        open={createCourseOpen}
        onCancel={() => setCreateCourseOpen(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleCreateCourse} style={{ marginTop: 16 }}>
          <Form.Item name="classroom_id" label="Assigned Classroom">
            <Select placeholder="Select classroom (optional)" allowClear>
              {classrooms.map((cr) => (
                <Select.Option key={cr.id} value={cr.id}>
                  {cr.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="Course Title"
            rules={[{ required: true, message: 'Please enter course title' }]}
          >
            <Input placeholder="e.g. Clinical Pharmacokinetics" size="large" />
          </Form.Item>

          <Form.Item name="code" label="Course Code">
            <Input placeholder="e.g. PHA-304" size="large" />
          </Form.Item>

          <Form.Item name="description" label="Course Overview / Syllabus Objectives">
            <Input.TextArea rows={3} placeholder="Focus on clearance, volume of distribution, and dosing regimens." />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={creatingCourse}
            block
            size="large"
            style={{ backgroundColor: '#2563EB', borderRadius: 8 }}
          >
            Create Course
          </Button>
        </Form>
      </Modal>

      {/* Add Module Modal */}
      <Modal
        title={`Add Syllabus Module to ${selectedCourse?.title}`}
        open={addModuleOpen}
        onCancel={() => setAddModuleOpen(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleAddModule} style={{ marginTop: 16 }}>
          <Form.Item
            name="title"
            label="Module Title"
            rules={[{ required: true, message: 'Please enter module title' }]}
          >
            <Input placeholder="e.g. Module 1: Clearance & Cockcroft-Gault Equation" size="large" />
          </Form.Item>

          <Form.Item name="description" label="Module Scope / Learning Objectives">
            <Input.TextArea rows={3} placeholder="Calculate CrCl for male and female patients with adjusted weight." />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={creatingModule}
            block
            size="large"
            style={{ backgroundColor: '#2563EB', borderRadius: 8 }}
          >
            Add Module
          </Button>
        </Form>
      </Modal>
    </div>
  );
};
