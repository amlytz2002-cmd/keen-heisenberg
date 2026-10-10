import React from 'react';
import { Card, Col, Row, Tag, Typography, Button } from 'antd';
import {
  FileTextOutlined,
  BulbOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useRouter } from '../../context/RouterContext';

const { Title, Paragraph } = Typography;

export const FeaturesView: React.FC = () => {
  const { navigate } = useRouter();

  const features = [
    {
      icon: <FileTextOutlined style={{ fontSize: 28, color: '#2563EB' }} />,
      title: 'Otomatik Belge Ayrıştırma & Kaynak Kanıtı',
      desc: 'PDF, Word belgeleri, Markdown dosyaları veya ders notlarını yükleyin. CENNA.live belgeleri anlamsal olarak tutarlı bölümlere ayırır; sayfa ve paragraf koordinatlarını eksiksiz koruyarak temel kavramları ve soruları çıkarır.',
      tags: ['PDF & DOCX', 'Anlamsal Bölümleme', 'Paragraf Kanıtı'],
    },
    {
      icon: <BulbOutlined style={{ fontSize: 28, color: '#D97706' }} />,
      title: '3 Kademeli Sokratik İpucu Merdiveni',
      desc: 'İpuçları üç pedagojik seviyede sunulur: 1. Kademe (Yönlendirme: temel ilkeler), 2. Kademe (Akıl Yürütme: yapısal ilişkiler ve ara adımlar) ve 3. Kademe (Uygulama: adım adım klinik/matematiksel çözüm rehberliği). Doğru cevap öğrenci düşünmeden asla doğrudan verilmez.',
      tags: ['Yönlendirme', 'Akıl Yürütme', 'Uygulama', 'Cevap Gizliliği'],
    },
    {
      icon: <HistoryOutlined style={{ fontSize: 28, color: '#7C3AED' }} />,
      title: '1, 3, 7, 14 Günlük Aralıklı Tekrar (SRS) Motoru',
      desc: 'Ebbinghaus unutma eğrisine dayalı matematiksel bellek konsolidasyonu. Başarılı hatırlamalar kararlılığı 1, 3, 7 ve 14 günlük aralıklarla artırır. Yanlış cevaplar aralık sayacını anında 1. güne sıfırlar.',
      tags: ['Aralıklı Konsolidasyon', 'Sıfırlama Mekanizması', 'Dinamik Kavrama (0–100)'],
    },
    {
      icon: <ClockCircleOutlined style={{ fontSize: 28, color: '#DC2626' }} />,
      title: 'Yetkili & Süreli Deneme Sınavları',
      desc: 'Sınav başlangıcında sunucu tarafında kesin son teslim tarihi atanır (deadline_at = NOW() + süre). Periyodik ara cevap otomatik kaydı olası bağlantı kopmalarına karşı koruma sağlar. Süre dolduğunda geç teslimler kesinlikle reddedilir.',
      tags: ['Sunucu Süre Kontrolü', 'Otomatik Kayıt', 'Soru Paleti', 'Konu İyileştirme'],
    },
    {
      icon: <SafetyCertificateOutlined style={{ fontSize: 28, color: '#059669' }} />,
      title: 'Eğitmen İçerik İnceleme & Onay Çalışma Alanı',
      desc: 'Yapay zekâ tarafından üretilen hiçbir içerik denetimsiz olarak öğrencilere ulaşamaz. Çıkarılan sorular ve kavramlar zorunlu bir "İnceleme Bekliyor" aşamasında toplanır; eğitmenler yan yana kaynak metin karşılaştırmasıyla inceler, düzenler, onaylar veya reddeder.',
      tags: ['Halüsinasyon Engeli', 'Yan Yana İnceleme', 'Yayınlama Onay Kapısı'],
    },
    {
      icon: <DatabaseOutlined style={{ fontSize: 28, color: '#0284C7' }} />,
      title: 'Kurumsal Satır Düzeyi Güvenlik (RLS)',
      desc: 'PostgreSQL Satır Düzeyi Güvenlik (RLS) politikaları sınıflar, kurumlar ve öğrenciler arasında tam veri izolasyonu sağlar. Sunucu gizli anahtarları Cloudflare Pages edge işlevlerinde korunur ve tarayıcıya asla sızdırılmaz.',
      tags: ['PostgreSQL RLS', 'Edge Fonksiyonları', 'Sıfır Anahtar Sızıntısı'],
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 20px', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <Tag color="blue">Platform Mimarisi</Tag>
        <Title level={1} style={{ fontSize: 36, fontWeight: 800, marginTop: 12, color: '#0F172A' }}>
          Derinlemesine Entegre Eğitim Teknolojisi
        </Title>
        <Paragraph style={{ fontSize: 16, color: '#64748B', maxWidth: 680, margin: '0 auto' }}>
          CENNA.live'daki her bir modül, veritabanı katmanından kullanıcı arayüzüne kadar gerçek öğrenmeyi ve klinik kavrayışı pekiştirmek için tasarlanmıştır.
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        {features.map((f, i) => (
          <Col xs={24} md={12} key={i}>
            <Card
              bordered
              style={{
                height: '100%',
                borderRadius: 14,
                borderColor: '#E2E8F0',
                display: 'flex',
                flexDirection: 'column',
              }}
              bodyStyle={{ padding: 24 }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </div>
                <div>
                  <Title level={4} style={{ margin: 0, fontSize: 18, color: '#0F172A' }}>
                    {f.title}
                  </Title>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {f.tags.map((t) => (
                      <Tag key={t} style={{ fontSize: 11, borderRadius: 4, margin: 0 }}>
                        {t}
                      </Tag>
                    ))}
                  </div>
                </div>
              </div>
              <Paragraph style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                {f.desc}
              </Paragraph>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ textAlign: 'center', marginTop: 48 }}>
        <Button
          type="primary"
          size="large"
          icon={<ArrowRightOutlined />}
          onClick={() => navigate('/auth/login')}
          style={{ height: 48, padding: '0 32px', borderRadius: 8, backgroundColor: '#2563EB' }}
        >
          CENNA.live'ı Hemen Deneyin
        </Button>
      </div>
    </div>
  );
};
