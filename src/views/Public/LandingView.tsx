import React from 'react';
import { Button, Card, Col, Row, Tag, Typography, Space } from 'antd';
import {
  RocketOutlined,
  ReadOutlined,
  QuestionCircleOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  LockOutlined,
  FileSearchOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';

const { Title, Paragraph, Text } = Typography;

export const LandingView: React.FC = () => {
  const { navigate } = useRouter();
  const { user, activeRole } = useAuth();

  const handleStart = () => {
    if (user) {
      navigate(activeRole === 'instructor' ? '/app/teach' : '/app/today');
    } else {
      navigate('/auth/login');
    }
  };

  const steps = [
    {
      step: '1',
      title: 'Öğren',
      icon: <ReadOutlined style={{ fontSize: 24, color: '#2563EB' }} />,
      desc: 'Sayfa ve paragraf atıflarıyla yetkili ders belgelerine dayandırılmış temel kavramları özümseyin.',
    },
    {
      step: '2',
      title: 'Hatırla',
      icon: <QuestionCircleOutlined style={{ fontSize: 24, color: '#0284C7' }} />,
      desc: 'Tek seçenekli, çoktan seçmeli ve klinik hesaplama sorularıyla kitapsız aktif hatırlama pratiği yapın.',
    },
    {
      step: '3',
      title: 'Uygula',
      icon: <BulbOutlined style={{ fontSize: 24, color: '#D97706' }} />,
      desc: 'Cevap açıklanmadan önce 3 kademeli Sokratik ipucu merdiveninden (Yönlendirme → Akıl Yürütme → Uygulama) yararlanın.',
    },
    {
      step: '4',
      title: 'Eksik Gider',
      icon: <CheckCircleOutlined style={{ fontSize: 24, color: '#059669' }} />,
      desc: 'Kaynak belgenin ilgili bölümüne doğrudan atıf yapan ayrıntılı geri bildirimle kavram yanılgılarınızı anında teşhis edin.',
    },
    {
      step: '5',
      title: 'Tekrar Et',
      icon: <HistoryOutlined style={{ fontSize: 24, color: '#7C3AED' }} />,
      desc: 'Bilimsel olarak planlanmış 1, 3, 7 ve 14 günlük aralıklı tekrarlarla uzun süreli hafızayı ve klinik kavrayışı güçlendirin.',
    },
  ];

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #EFF6FF 100%)',
          padding: '80px 20px 60px',
          borderBottom: '1px solid #E2E8F0',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          <Tag color="blue" style={{ padding: '6px 14px', fontSize: 13, borderRadius: 20, fontWeight: 600 }}>
            <RocketOutlined style={{ marginRight: 6 }} /> CENNA.live Pilot 1.0 — Aktif Hatırlama & Bilinçli Pratik Motoru
          </Tag>
          <Title
            level={1}
            style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 850,
              color: '#0F172A',
              letterSpacing: '-1.5px',
              marginTop: 20,
              marginBottom: 16,
              lineHeight: 1.15,
            }}
          >
            Kanıta Dayalı Pratik, <span style={{ color: '#2563EB' }}>Doğrulanmış Yapay Zekâ</span>.
          </Title>
          <Paragraph
            style={{
              fontSize: 'clamp(16px, 2.5vw, 20px)',
              color: '#475569',
              lineHeight: 1.6,
              maxWidth: 720,
              margin: '0 auto 32px',
            }}
          >
            Pasif okuma yöntemlerinin ötesine geçin. CENNA.live yetkili ders materyallerinizi yapılandırılmış ~25 dakikalık
            çalışma oturumlarına, kademeli Sokratik ipuçlarına ve aralıklı tekrar kuyruklarına dönüştürür.
          </Paragraph>

          <Space direction="horizontal" size="middle" wrap style={{ justifyContent: 'center' }}>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={handleStart}
              style={{
                height: 50,
                padding: '0 32px',
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 10,
                backgroundColor: '#2563EB',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              }}
            >
              {user ? 'Öğrenme Panelinize Giriş Yapın' : 'Hemen Başlayın'}
            </Button>
            <Button
              size="large"
              onClick={() => navigate('/how-it-works')}
              style={{
                height: 50,
                padding: '0 28px',
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 10,
              }}
            >
              Pedagojik Çerçeve & Metot
            </Button>
          </Space>

          {/* Quick Metrics Bar */}
          <div
            style={{
              marginTop: 48,
              padding: '16px 24px',
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-around',
              gap: 16,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div>
              <Text strong style={{ fontSize: 18, color: '#0F172A', display: 'block' }}>
                ~25 Dakika
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Hedef Günlük Çalışma Oturumu
              </Text>
            </div>
            <div style={{ borderLeft: '1px solid #E2E8F0', height: 36 }} />
            <div>
              <Text strong style={{ fontSize: 18, color: '#0F172A', display: 'block' }}>
                1 · 3 · 7 · 14 Gün
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Aralıklı Tekrar Döngüsü
              </Text>
            </div>
            <div style={{ borderLeft: '1px solid #E2E8F0', height: 36 }} />
            <div>
              <Text strong style={{ fontSize: 18, color: '#0F172A', display: 'block' }}>
                3 Kademeli Merdiven
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                İlerleyici Sokratik İpuçları
              </Text>
            </div>
            <div style={{ borderLeft: '1px solid #E2E8F0', height: 36 }} />
            <div>
              <Text strong style={{ fontSize: 18, color: '#0F172A', display: 'block' }}>
                %100 Kaynağa Dayalı
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Eğitmen Onay Denetimi
              </Text>
            </div>
          </div>
        </div>
      </section>

      {/* The 5-Stage Learning Cycle */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Tag color="cyan">Pedagojik Çerçeve</Tag>
          <Title level={2} style={{ fontSize: 32, fontWeight: 800, marginTop: 12, color: '#0F172A' }}>
            Kesintisiz Çalışma Döngüsü
          </Title>
          <Paragraph style={{ fontSize: 16, color: '#64748B', maxWidth: 640, margin: '0 auto' }}>
            Derin kavramsal kavrayışı ve uzun vadeli kalıcılığı pekiştirmek için tasarlanmış bilimsel öğrenme modeli.
          </Paragraph>
        </div>

        <Row gutter={[20, 20]}>
          {steps.map((item) => (
            <Col xs={24} sm={12} lg={4} key={item.step} style={{ flex: '1 1 200px' }}>
              <Card
                bordered
                style={{
                  height: '100%',
                  borderRadius: 12,
                  borderColor: '#E2E8F0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                bodyStyle={{ padding: 20 }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      backgroundColor: '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </div>
                  <Tag style={{ borderRadius: 12, fontWeight: 700, margin: 0 }}>
                    Aşama {item.step}
                  </Tag>
                </div>
                <Title level={4} style={{ margin: '0 0 8px 0', fontSize: 18, color: '#0F172A' }}>
                  {item.title}
                </Title>
                <Text style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                  {item.desc}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* Dual Value Proposition: Students & Instructors */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '64px 20px', borderTop: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Row gutter={[40, 40]} align="middle">
            <Col xs={24} md={12}>
              <div style={{ paddingRight: 20 }}>
                <Tag color="blue" style={{ marginBottom: 12 }}>Öğrenciler İçin</Tag>
                <Title level={2} style={{ fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                  Bugün Neye Çalışmanız Gerektiğini Net Olarak Bilin
                </Title>
                <Paragraph style={{ fontSize: 15, color: '#475569', lineHeight: 1.7 }}>
                  Artık nereden başlayacağınızı düşünerek vakit kaybetmeyin. Kişiselleştirilmiş <strong>Bugün</strong> panonuz,
                  günü gelen aralıklı tekrarları hesaplar, eksik kaldığınız kavramları hedefler ve yüzeysel tanıma yerine
                  gerçek kavrayış oluşturan kademeli ipuçlarıyla odaklı çalışma oturumları sunar.
                </Paragraph>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <CheckCircleOutlined style={{ color: '#059669', fontSize: 18, marginTop: 2 }} />
                    <Text style={{ fontSize: 14, color: '#334155' }}>
                      <strong>Aktif Hatırlama:</strong> Anlık geri bildirim ve kaynak alıntıları içeren nitelikli sorular.
                    </Text>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <CheckCircleOutlined style={{ color: '#059669', fontSize: 18, marginTop: 2 }} />
                    <Text style={{ fontSize: 14, color: '#334155' }}>
                      <strong>Sokratik İpucu Merdiveni:</strong> Cevap gösterilmeden önce yönlendirme, akıl yürütme ve uygulama ipuçları.
                    </Text>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <CheckCircleOutlined style={{ color: '#059669', fontSize: 18, marginTop: 2 }} />
                    <Text style={{ fontSize: 14, color: '#334155' }}>
                      <strong>Süreli Deneme Sınavları:</strong> Sunucu kontrollü süre takibi ve sınav sonrası ayrıntılı konu analizi.
                    </Text>
                  </div>
                </div>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <Card
                bordered
                style={{
                  borderRadius: 16,
                  borderColor: '#E2E8F0',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                  backgroundColor: '#F8FAFC',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text strong style={{ color: '#0F172A' }}>Aktif Kavram Kartı</Text>
                  <Tag color="green">Kavrama: %72</Tag>
                </div>
                <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Klinik Farmakokinetik · Bölüm 4
                  </Text>
                  <Title level={4} style={{ margin: '4px 0 8px 0', fontSize: 17, color: '#0F172A' }}>
                    Kreatinin Klerensi & Cockcroft-Gault Eşitliği
                  </Title>
                  <Text style={{ fontSize: 13, color: '#475569' }}>
                    "Kadın hastalarda, ortalama kas kütlesinin daha düşük olması nedeniyle hesaplanan CrCl değeri 0.85 ile çarpılmalıdır."
                  </Text>
                  <div style={{ marginTop: 8, fontSize: 12, color: '#64748B' }}>
                    Kaynak: <span style={{ textDecoration: 'underline' }}>Klinik_Farmakokinetik_El_Kitabi.pdf (Sayfa 42, Paragraf 3)</span>
                  </div>
                </div>
                <Button block type="primary" onClick={handleStart} style={{ backgroundColor: '#2563EB', borderRadius: 8 }}>
                  Aktif Hatırlama Sorularını Başlat
                </Button>
              </Card>
            </Col>
          </Row>

          <div style={{ margin: '64px 0', borderTop: '1px solid #E2E8F0' }} />

          <Row gutter={[40, 40]} align="middle">
            <Col xs={24} md={12} order={2}>
              <div style={{ paddingLeft: 20 }}>
                <Tag color="purple" style={{ marginBottom: 12 }}>Eğitmenler İçin</Tag>
                <Title level={2} style={{ fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                  Ders Materyallerinizi Güvenle Yönetin ve Denetleyin
                </Title>
                <Paragraph style={{ fontSize: 15, color: '#475569', lineHeight: 1.7 }}>
                  Ders izlencelerini, sunum slaytlarını ve klinik notlarınızı yükleyin. CENNA.live belgelerinizden yapılandırılmış
                  kavramları çıkarır ve yalnızca bu kaynaklara dayalı sorular üretir. <strong>İçerik İnceleme & Onay</strong> iş akışıyla,
                  hiçbir yapay zekâ çıktısı eğitmen onayı olmadan öğrencilere ulaşmaz.
                </Paragraph>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <FileSearchOutlined style={{ color: '#7C3AED', fontSize: 18, marginTop: 2 }} />
                    <Text style={{ fontSize: 14, color: '#334155' }}>
                      <strong>Otomatik Anlamsal Bölümleme:</strong> Üretilen her soru kaynak belgedeki doğrudan ilgili paragrafa bağlanır.
                    </Text>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <LockOutlined style={{ color: '#7C3AED', fontSize: 18, marginTop: 2 }} />
                    <Text style={{ fontSize: 14, color: '#334155' }}>
                      <strong>Sıkı Onay Kapısı:</strong> Taslak içerikler incelenip onaylanana kadar <code>inceleme_bekliyor</code> durumunda tutulur.
                    </Text>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <ClockCircleOutlined style={{ color: '#7C3AED', fontSize: 18, marginTop: 2 }} />
                    <Text style={{ fontSize: 14, color: '#334155' }}>
                      <strong>Sınıf Analitiği:</strong> Sınavlar öncesinde öğrencilerin en çok zorlandığı kavramları ve hata oranlarını tespit edin.
                    </Text>
                  </div>
                </div>
              </div>
            </Col>
            <Col xs={24} md={12} order={1}>
              <Card
                bordered
                style={{
                  borderRadius: 16,
                  borderColor: '#E2E8F0',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                  backgroundColor: '#F8FAFC',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text strong style={{ color: '#0F172A' }}>Eğitmen İçerik Onay Kapısı</Text>
                  <Tag color="orange">Durum: İnceleme Bekliyor</Tag>
                </div>
                <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                    Soru: 65 yaşında bir kadın hasta için (60 kg, Serum Cr 1.2 mg/dL) CrCl değerini hesaplayınız.
                  </Text>
                  <div style={{ marginTop: 8, fontSize: 12, color: '#64748B' }}>
                    Kaynak Atfı: <Text code>Biyofarmasotik_Ders03.pdf (Bölüm #14)</Text>
                  </div>
                </div>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button size="small" danger>Reddet</Button>
                  <Button size="small">Düzenle</Button>
                  <Button size="small" type="primary" style={{ backgroundColor: '#059669' }}>
                    Onayla ve Yayınla
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* Call to action */}
      <section style={{ backgroundColor: '#1E293B', color: '#FFFFFF', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <Title level={2} style={{ color: '#FFFFFF', fontWeight: 800 }}>
            Kanıta Dayalı Öğrenmeye Hazır mısınız?
          </Title>
          <Paragraph style={{ color: '#94A3B8', fontSize: 16, marginBottom: 28 }}>
            CENNA.live pilot uygulamasına katılın ve yüksek akademik başarı için tasarlanmış kaynak odaklı, aktif pratik deneyimini yaşayın.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            onClick={handleStart}
            style={{
              height: 48,
              padding: '0 32px',
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 8,
              backgroundColor: '#2563EB',
            }}
          >
            CENNA.live'a Başlayın
          </Button>
        </div>
      </section>
    </div>
  );
};
