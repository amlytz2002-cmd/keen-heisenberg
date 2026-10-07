import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, Alert, Empty, Badge, Space } from 'antd';
import { BugOutlined, WarningOutlined } from '@ant-design/icons';
import { supabase } from '../../lib/supabaseClient';

const { Title, Text, Paragraph } = Typography;

export interface ErrorEventRecord {
  id: string;
  concept_name: string;
  error_family: string;
  misconception_tag: string;
  failed_node: string;
  is_hypercorrection: boolean;
  resolved: boolean;
  created_at: string;
}

export const ErrorClinic: React.FC<{ localErrors: ErrorEventRecord[] }> = ({ localErrors }) => {
  const [errors, setErrors] = useState<ErrorEventRecord[]>(localErrors);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchErrors() {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data } = await supabase
            .from('error_events')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

          if (data && data.length > 0) {
            setErrors(data.map((e: any) => ({
              id: e.id,
              concept_name: e.concept_id || 'Farmakokinetik Hesaplama',
              error_family: e.error_family || 'DAG_NODE_FAILURE',
              misconception_tag: e.misconception_tag,
              failed_node: e.failed_node || '-',
              is_hypercorrection: Boolean(e.is_hypercorrection),
              resolved: Boolean(e.resolved),
              created_at: e.created_at || new Date().toISOString(),
            })));
          }
        }
      } catch (err) {
        console.warn('Using local errors buffer:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchErrors();
  }, [localErrors]);

  const hypercorrectionCount = errors.filter(e => e.is_hypercorrection).length;

  const columns = [
    {
      title: 'Kavram / Düğüm',
      key: 'node',
      render: (_: any, record: ErrorEventRecord) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{record.concept_name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>Adım: {record.failed_node}</Text>
        </div>
      ),
    },
    {
      title: 'Kavram Yanılgısı',
      key: 'misconception',
      render: (_: any, record: ErrorEventRecord) => (
        <Space direction="vertical" size={2}>
          <Tag color="red" style={{ fontSize: 11 }}>{record.misconception_tag}</Tag>
          {record.is_hypercorrection && (
            <Tag color="gold" icon={<WarningOutlined />} style={{ fontSize: 10 }}>
              Hiper-Düzeltme
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Tarih',
      dataIndex: 'created_at',
      key: 'date',
      render: (val: string) => (
        <Text type="secondary" style={{ fontSize: 11 }}>
          {new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 12px' }}>
      <div style={{ marginBottom: 12 }}>
        <Title level={4} style={{ margin: 0, color: '#0F172A' }}>
          <BugOutlined style={{ marginRight: 8, color: '#DC2626' }} />
          Hata Kliniği & Teşhis Defteri
        </Title>
        <Paragraph type="secondary" style={{ fontSize: 13, marginTop: 4 }}>
          Deterministik DAG motorunun izole ettiği basamak hataları ve distraktör kavram yanılgıları.
        </Paragraph>
      </div>

      {hypercorrectionCount > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message={`${hypercorrectionCount} Hiper-Düzeltme Olayı Tespit Edildi`}
          description="Emin olduğunuz halde yanlış yaptığınız basamaklar hafıza konsolidasyonu için 24 saat içinde yeniden test edilmek üzere FSRS tarafından kuyruğa alınmıştır."
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}

      <Card
        bordered={false}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Kayıtlı Teşhis Olayları</span>
            <Badge count={errors.length} overflowCount={99} style={{ backgroundColor: '#2563EB' }} />
          </div>
        }
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      >
        {errors.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Henüz kaydedilmiş basamak hatası bulunmuyor. Kusursuz ilerliyorsunuz!"
          />
        ) : (
          <Table
            dataSource={errors}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 5, size: 'small' }}
            loading={loading}
          />
        )}
      </Card>
    </div>
  );
};
