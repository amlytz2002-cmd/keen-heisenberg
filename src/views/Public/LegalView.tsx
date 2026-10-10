import React, { useState } from 'react';
import { Card, Tabs, Typography, Tag } from 'antd';

const { Title, Paragraph } = Typography;

export const LegalView: React.FC<{ initialTab?: 'privacy' | 'terms' }> = ({ initialTab = 'privacy' }) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(initialTab);

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '60px 20px', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Tag color="geekblue">Uyumluluk & Akademik Yönetişim</Tag>
        <Title level={1} style={{ fontSize: 32, fontWeight: 850, marginTop: 8, color: '#0F172A' }}>
          CENNA.live Politikaları ve Kullanım Koşulları
        </Title>
      </div>

      <Card bordered style={{ borderRadius: 12, borderColor: '#E2E8F0', padding: '12px 16px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as 'privacy' | 'terms')}
          items={[
            {
              key: 'privacy',
              label: 'Gizlilik Politikası & Veri İzolasyonu',
              children: (
                <div style={{ padding: '16px 0', color: '#334155', lineHeight: 1.7 }}>
                  <Title level={3} style={{ color: '#0F172A' }}>1. Varsayılan Olarak Gizlilik</Title>
                  <Paragraph>
                    CENNA.live, öğrenci verilerinin gizliliğini ve akademik bağımsızlığını en üst düzeyde korur. Kişisel çalışma oturumları,
                    soru denemeleri, Sokratik ipucu kayıtları ve sınav yanıtları PostgreSQL Satır Düzeyi Güvenlik (RLS) ile korunmaktadır.
                    Öğrenciler yalnızca kendi akademik ilerlemelerini görebilir; eğitmenler ise yalnızca yetkili oldukları sınıflara kayıtlı
                    öğrencilerin gelişim verilerini inceleyebilir.
                  </Paragraph>

                  <Title level={3} style={{ color: '#0F172A', marginTop: 24 }}>2. Kamuya Açık Akış veya Veri Sızıntısı Yoktur</Title>
                  <Paragraph>
                    Ders kaynakları, eğitmen sunumları ve öğrenci cevapları asla herkese açık forumlarda veya kimlik doğrulaması yapılmamış
                    alanlarda paylaşılmaz. Tüm belge depolama alanları kesinlikle gizlidir ve yalnızca yetkilendirilmiş, zaman sınırlı imzalı
                    bağlantılar veya onaylı sunucu taraflı işleme hatları üzerinden erişilebilir.
                  </Paragraph>

                  <Title level={3} style={{ color: '#0F172A', marginTop: 24 }}>3. Yapay Zekâ Modeli Veri Güvenliği</Title>
                  <Paragraph>
                    Kavram çıkarma ve soru üretimi amacıyla işlenen ders belgeleri, hiçbir koşulda genel yapay zekâ temel modellerini eğitmek
                    için kullanılmaz. Tüm model istemleri kişisel verilerden arındırılır ve özel kurumsal edge uç noktaları üzerinden işlenir.
                  </Paragraph>

                  <Title level={3} style={{ color: '#0F172A', marginTop: 24 }}>4. Denetlenebilirlik & Yönetici Kısıtlamaları</Title>
                  <Paragraph>
                    Sistem üzerindeki tüm işlemler değiştirilemez denetim kayıtlarında (audit logs) saklanır. Sistem yöneticileri dahi
                    özel öğrenci yanıtlarını rastgele görüntüleyemez veya sınav sonuçlarını keyfi olarak değiştiremez.
                  </Paragraph>
                </div>
              ),
            },
            {
              key: 'terms',
              label: 'Kullanım Koşulları',
              children: (
                <div style={{ padding: '16px 0', color: '#334155', lineHeight: 1.7 }}>
                  <Title level={3} style={{ color: '#0F172A' }}>1. Akademik Dürüstlük & Platform Amacı</Title>
                  <Paragraph>
                    CENNA.live, aktif hatırlama yoluyla derin ve kalıcı öğrenmeyi sağlamak amacıyla geliştirilmiş bir akademik uzmanlaşma platformudur.
                    Kullanıcılar, platform API'lerini kötüye kullanmamayı, süreli sınav sayaçlarını atlatmaya veya Sokratik ipucu kademelerini
                    manipüle etmeye çalışmamayı kabul eder.
                  </Paragraph>

                  <Title level={3} style={{ color: '#0F172A', marginTop: 24 }}>2. Tıbbi veya Klinik Teşhis Niteliği Taşımamaktadır</Title>
                  <Paragraph>
                    CENNA.live, eczacılık ve sağlık bilimleri öğrencileri için yalnızca akademik eğitim ve pratik amacıyla sunulmaktadır. Platform;
                    klinik karar destek sistemi, tanı aracı veya tıbbi tedavi kılavuzu DEĞİLDİR. Soru senaryoları ve ipuçları hiçbir koşulda
                    gerçek hasta bakımında veya klinik teşhislerde dayanak olarak kullanılamaz.
                  </Paragraph>

                  <Title level={3} style={{ color: '#0F172A', marginTop: 24 }}>3. Eğitmen İçerik ve Yayınlama Sorumluluğu</Title>
                  <Paragraph>
                    Yapay zekâ tarafından üretilen kavramlar, sorular ve ipuçları, ders eğitmeni tarafından incelenip onaylanana kadar taslak
                    niteliğindedir. Ders materyallerinin doğruluğunu ve müfredata uygunluğunu onaylayarak öğrencilere yayınlama sorumluluğu
                    ilgili dersin eğitmenine aittir.
                  </Paragraph>

                  <Title level={3} style={{ color: '#0F172A', marginTop: 24 }}>4. Pilot Sürüm Statüsü</Title>
                  <Paragraph>
                    Bu sürüm (v1.0 Pilot), akademik değerlendirme ve pilot eğitim programları kapsamında sunulmaktadır. Platform işlevleri,
                    pedagojik etki analizleri ve eğitmen geri bildirimleri doğrultusunda sürekli olarak geliştirilmektedir.
                  </Paragraph>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
