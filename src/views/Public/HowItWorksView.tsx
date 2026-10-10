import React from 'react';
import { Card, Typography, Button, Tag, Alert } from 'antd';
import {
  ReadOutlined,
  QuestionCircleOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useRouter } from '../../context/RouterContext';

const { Title, Paragraph } = Typography;

export const HowItWorksView: React.FC = () => {
  const { navigate } = useRouter();

  const cycleDetails = [
    {
      title: '1. Öğren (Kaynak Belgeli Kavram Odaklılık)',
      icon: <ReadOutlined />,
      description:
        'Genel internet özetleri veya doğrulanmamış yapay zekâ metinleri yerine, öğrenci doğrudan ders eğitmeninin sisteme yüklediği yetkili kaynaklardan çıkarılmış odak kavram kartlarıyla çalışır. Her tanım ve formül dosya adı, sayfa numarası ve paragraf koordinatlarıyla belgelenir.',
    },
    {
      title: '2. Hatırla (Kitapsız Aktif Geri Çağırma)',
      icon: <QuestionCircleOutlined />,
      description:
        'Öğrenci kavramı inceledikten hemen sonra notlara bakmadan aktif hatırlama sorularıyla karşılaşır. Bilgiyi bellekten geri çağırma eylemi, test etme etkisi sayesinde nöral yolları derinlemesine pekiştirir (Roediger & Karpicke, 2006).',
    },
    {
      title: '3. Uygula (3 Kademeli Sokratik İpucu İlerlemesi)',
      icon: <BulbOutlined />,
      description:
        'Öğrenci zorlandığında doğru cevap doğrudan verilmez. Bunun yerine kademeli Sokratik rehberlik devreye girer: 1. Kademe temel prensibi hatırlatır, 2. Kademe değişkenler arası mantıksal bağı kurar, 3. Kademe ise somut uygulama adımlarını gösterir.',
    },
    {
      title: '4. Eksik Gider (Kaynak Atıflı Anlık Teşhis)',
      icon: <CheckCircleOutlined />,
      description:
        'Cevap verildiğinde sistem seçilen seçeneğin neden doğru veya yanlış olduğunu ders metnine atıfta bulunarak ayrıntılı şekilde açıklar. Kavram yanılgıları hemen işaretlenir ve öğrencinin kavram kavrama skoru gerçek zamanlı güncellenir.',
    },
    {
      title: '5. Tekrar Et (Aralıklı Konsolidasyon Takvimi)',
      icon: <HistoryOutlined />,
      description:
        'Çözülen sorular aralıklı tekrar kuyruğuna aktarılır. Başarılı hatırlamalar bir sonraki tekrarı 1, 3, 7 ve 14 günlük aralıklara öteler. Bir kavram unutulduğunda, aralık sayacı sınavlar öncesinde tam ustalık sağlamak üzere 1. güne geri alınır.',
    },
  ];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '60px 20px', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Tag color="purple">Pedagojik Tasarım</Tag>
        <Title level={1} style={{ fontSize: 36, fontWeight: 800, marginTop: 12, color: '#0F172A' }}>
          Kesintisiz Öğrenme Döngüsü
        </Title>
        <Paragraph style={{ fontSize: 16, color: '#64748B', maxWidth: 640, margin: '0 auto' }}>
          Öğren → Hatırla → Uygula → Eksik Gider → Tekrar Et: CENNA.live kapsamlı ders belgelerini nasıl kalıcı akademik uzmanlığa dönüştürür?
        </Paragraph>
      </div>

      <Alert
        message="Kanıta Dayalı Öğrenme Güvencesi"
        description="Eğitim bilimleri araştırmaları; aralıklı tekrar ve kademeli iskeleleme (scaffolding) ile birleştirilen aktif hatırlama yönteminin, pasif tekrar okuma ve kontrolsüz sohbet botu etkileşimlerine kıyasla çok daha üstün kalıcılık sağladığını kanıtlamaktadır."
        type="info"
        showIcon
        icon={<SafetyOutlined />}
        style={{ marginBottom: 36, borderRadius: 10 }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {cycleDetails.map((item, idx) => (
          <Card
            key={idx}
            bordered
            style={{
              borderRadius: 12,
              borderColor: '#E2E8F0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div>
                <Title level={3} style={{ margin: 0, fontSize: 18, color: '#0F172A' }}>
                  {item.title}
                </Title>
                <Paragraph style={{ marginTop: 8, fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
                  {item.description}
                </Paragraph>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 48 }}>
        <Button
          type="primary"
          size="large"
          onClick={() => navigate('/auth/login')}
          style={{ height: 48, padding: '0 32px', borderRadius: 8, backgroundColor: '#2563EB' }}
        >
          CENNA.live ile Öğrenmeye Başlayın
        </Button>
      </div>
    </div>
  );
};
