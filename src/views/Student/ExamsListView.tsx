import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, Button, Spin, Modal, Alert } from 'antd';
import {
  TrophyOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useRouter } from '../../context/RouterContext';
import { api } from '../../lib/api';

const { Title, Paragraph, Text } = Typography;

export const ExamsListView: React.FC = () => {
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      try {
        const res = await api.exams.list();
        if (res.success && res.data) {
          setExams(res.data);
        }
      } catch (err) {
        console.error('Error fetching exams:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  const handleStartExam = async () => {
    if (!selectedExam) return;
    setStarting(true);
    setErrorMsg(null);
    try {
      const res = await api.exams.start(selectedExam.id);
      if (res.success && res.data) {
        setConfirmModalOpen(false);
        navigate(`/app/exams/${selectedExam.id}/take?attemptId=${res.data.attempt_id}`);
      } else {
        setErrorMsg(res.error || 'Sınav oturumu başlatılamadı.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Sınav başlatılırken hata oluştu.');
    } finally {
      setStarting(false);
    }
  };

  const columns = [
    {
      title: 'Sınav Başlığı ve Açıklama',
      key: 'title',
      render: (_: any, record: any) => (
        <div>
          <Text strong style={{ fontSize: 15, color: '#F8FAFC', display: 'block' }}>
            {record.title}
          </Text>
          <Text type="secondary" style={{ fontSize: 13, color: '#94A3B8' }}>
            {record.description || 'Kapsamlı klinik aktif hatırlama ve değerlendirme sınavı.'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Süre',
      key: 'duration',
      render: (_: any, record: any) => (
        <Tag icon={<ClockCircleOutlined />} color="blue">
          {record.duration_minutes} Dakika
        </Tag>
      ),
    },
    {
      title: 'Geçme Notu',
      key: 'passing',
      render: (_: any, record: any) => (
        <Tag color="geekblue">%{record.passing_score_pct || 70}</Tag>
      ),
    },
    {
      title: 'İşlem',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => {
            setSelectedExam(record);
            setConfirmModalOpen(true);
          }}
          style={{ backgroundColor: '#2563EB', borderColor: '#2563EB', borderRadius: 6 }}
        >
          Sınava Gir
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16, color: '#94A3B8' }}>Deneme sınavları yükleniyor...</Paragraph>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 16px 64px' }}>
      <div style={{ marginBottom: 28 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#F8FAFC' }}>
          Süreli Deneme Sınavları
        </Title>
        <Text style={{ fontSize: 15, color: '#94A3B8' }}>
          Sunucu kontrollü geri sayım ve ayrıntılı kavram analiziyle resmi sınav koşullarını deneyimleyin.
        </Text>
      </div>

      <Card bordered style={{ borderRadius: 16, borderColor: '#1E293B', backgroundColor: '#0F172A' }}>
        {exams.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <TrophyOutlined style={{ fontSize: 44, color: '#64748B', marginBottom: 12 }} />
            <Title level={4} style={{ color: '#F8FAFC' }}>Aktif Deneme Sınavı Bulunmuyor</Title>
            <Paragraph style={{ color: '#94A3B8' }}>
              Kayıtlı olduğunuz derslerde henüz planlanmış bir deneme sınavı bulunmamaktadır.
            </Paragraph>
          </div>
        ) : (
          <Table
            dataSource={exams}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 8 }}
          />
        )}
      </Card>

      {/* Start Exam Confirmation Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExclamationCircleOutlined style={{ color: '#DC2626' }} />
            <span>Süreli Sınav Kuralları & Sunucu Süre Kontrolü</span>
          </div>
        }
        open={confirmModalOpen}
        onCancel={() => {
          setConfirmModalOpen(false);
          setErrorMsg(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setConfirmModalOpen(false)}>
            Vazgeç
          </Button>,
          <Button
            key="start"
            type="primary"
            loading={starting}
            onClick={handleStartExam}
            style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
          >
            Sınavı Şimdi Başlat
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          {errorMsg && (
            <Alert message={errorMsg} type="error" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />
          )}
          <Paragraph>
            <strong>{selectedExam?.title}</strong> sınavını başlatmak üzeresiniz.
          </Paragraph>
          <Alert
            message="Sunucu Tarafı Süre Sayacı Bildirimi"
            description={`'Sınavı Şimdi Başlat' butonuna tıkladığınız anda, ${selectedExam?.duration_minutes} dakikalık süreniz doğrudan sunucu tarafında işlemeye başlayacaktır. Tarayıcıyı kapatmanız süreyi DURDURMAZ. Cevaplarınız belirli aralıklarla otomatik olarak kaydedilir.`}
            type="warning"
            showIcon
            style={{ borderRadius: 8 }}
          />
        </div>
      </Modal>
    </div>
  );
};
