import React from 'react';
import { useRouter } from '../context/RouterContext';

export const Footer: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <footer
      style={{
        backgroundColor: '#0F172A',
        color: '#94A3B8',
        padding: '48px 16px 32px',
        borderTop: '1px solid #1E293B',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 32,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: 16,
              }}
            >
              C
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>CENNA.live</span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 320, color: '#94A3B8' }}>
            Eczacılık ve sağlık bilimleri öğrencilerine yönelik, yapay zekâ destekli aktif geri çağırma ve amaçlı pratik platformu. Bütünleşik öğrenme döngüsü: Öğren, Hatırla, Uygula, Eksik Gider ve Pekiştir.
          </p>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 16 }}>
            © {new Date().getFullYear()} CENNA.live. Tüm hakları saklıdır.
          </div>
        </div>

        <div>
          <h4 style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Platform & Pedagoji
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
            <li>
              <button
                onClick={() => navigate('/how-it-works')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0, textAlign: 'left' }}
              >
                5 Aşamalı Öğrenme Döngüsü
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/features')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0, textAlign: 'left' }}
              >
                Belgeye Dayalı Yapay Zekâ & Kaynak Doğrulama
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/features')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0, textAlign: 'left' }}
              >
                3 Kademeli Sokratik İpucu Merdiveni
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/features')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0, textAlign: 'left' }}
              >
                Aralıklı Tekrar ve Pekiştirme (FSRS Algoritması)
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Hukuki Şartlar & İletişim
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
            <li>
              <button
                onClick={() => navigate('/terms')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0, textAlign: 'left' }}
              >
                Kullanım Koşulları
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/privacy')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0, textAlign: 'left' }}
              >
                Gizlilik Politikası
              </button>
            </li>
            <li>
              <a
                href="mailto:destek@cenna.live"
                style={{ color: '#94A3B8', textDecoration: 'none' }}
              >
                İletişim
              </a>
            </li>
            <li style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #1E293B' }}>
              <span style={{ color: '#64748B', fontSize: 13 }}>Eğitmen Onay Kapısı (Zorunlu)</span>
            </li>
            <li>
              <span style={{ color: '#64748B', fontSize: 13 }}>Satır Düzeyi Veri Güvenliği (PostgreSQL RLS)</span>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};
