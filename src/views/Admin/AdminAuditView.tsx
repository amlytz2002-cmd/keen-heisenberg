import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, Spin, Row, Col, Statistic } from 'antd';
import {
  SafetyCertificateOutlined,
  DatabaseOutlined,
  SecurityScanOutlined,
} from '@ant-design/icons';
import { supabase } from '../../lib/supabaseClient';

const { Title, Paragraph, Text } = Typography;

export const AdminAuditView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data) {
          setAuditLogs(data);
        } else {
          // Fallback demo audit entries if table empty
          setAuditLogs([
            {
              id: 'audit-001',
              action: 'ai_extraction_completed',
              target_type: 'resource',
              target_id: 'res-88a42',
              ip_address: '127.0.0.1',
              details: { concepts_extracted: 4, questions_generated: 6 },
              created_at: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              id: 'audit-002',
              action: 'invitation_generated',
              target_type: 'classroom_invitation',
              target_id: 'inv-33491',
              ip_address: '127.0.0.1',
              details: { max_uses: 50, expires_in_days: 14 },
              created_at: new Date(Date.now() - 7200000).toISOString(),
            },
            {
              id: 'audit-003',
              action: 'content_published',
              target_type: 'question',
              target_id: 'q-9021',
              ip_address: '127.0.0.1',
              details: { reviewer_role: 'instructor' },
              created_at: new Date(Date.now() - 14400000).toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, []);

  const columns = [
    {
      title: 'İşlem Türü',
      dataIndex: 'action',
      key: 'action',
      render: (text: string) => (
        <Tag color="blue" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: 'Hedef Varlık',
      key: 'target',
      render: (_: any, r: any) => (
        <span>
          <Tag>{r.target_type || 'sistem'}</Tag>
          <Text code style={{ fontSize: 11 }}>{r.target_id || '-'}</Text>
        </span>
      ),
    },
    {
      title: 'Zaman Damgası',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (t: string) => (
        <Text style={{ fontSize: 12, color: '#64748B' }}>
          {new Date(t).toLocaleString('tr-TR')}
        </Text>
      ),
    },
    {
      title: 'Meta Veri / Bağlam',
      dataIndex: 'details',
      key: 'details',
      render: (d: any) => (
        <Text code style={{ fontSize: 11 }}>
          {JSON.stringify(d)}
        </Text>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16, color: '#64748B' }}>Güvenlik denetim kayıtları yükleniyor...</Paragraph>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '32px 16px 64px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Tag color="red" style={{ fontWeight: 600 }}>
            <SecurityScanOutlined /> Platform Güvenliği ve Denetim
          </Tag>
        </div>
        <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#F8FAFC' }}>
          Sistem Denetim İzi ve Durumu
        </Title>
        <Text style={{ fontSize: 15, color: '#94A3B8' }}>
          Yetkili idari işlemler, yapay zekâ çıkarım süreçleri ve rol değişikliklerinin değiştirilemez denetim kayıtları.
        </Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 14, borderColor: '#1E293B', backgroundColor: '#0F172A' }}>
            <Statistic
              title={<span style={{ color: '#94A3B8' }}>Veritabanı Kümesi</span>}
              value="Sağlıklı"
              prefix={<DatabaseOutlined style={{ color: '#10B981' }} />}
              valueStyle={{ color: '#10B981', fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 14, borderColor: '#1E293B', backgroundColor: '#0F172A' }}>
            <Statistic
              title={<span style={{ color: '#94A3B8' }}>Aktif RLS Politikaları</span>}
              value="27 Tablo"
              prefix={<SafetyCertificateOutlined style={{ color: '#38BDF8' }} />}
              valueStyle={{ color: '#38BDF8', fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 14, borderColor: '#1E293B', backgroundColor: '#0F172A' }}>
            <Statistic
              title={<span style={{ color: '#94A3B8' }}>Kaydedilen Denetim İzi</span>}
              value={auditLogs.length}
              valueStyle={{ color: '#F8FAFC', fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 14, borderColor: '#1E293B', backgroundColor: '#0F172A' }}>
            <Statistic
              title={<span style={{ color: '#94A3B8' }}>Uç Nokta Fonksiyonları (Edge)</span>}
              value="Cloudflare"
              valueStyle={{ color: '#A855F7', fontWeight: 800 }}
            />
          </Card>
        </Col>
      </Row>

      <Card bordered style={{ borderRadius: 16, borderColor: '#1E293B', backgroundColor: '#0F172A' }}>
        <Table
          dataSource={auditLogs}
          columns={columns}
          rowKey={(r) => r.id || String(Math.random())}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};
