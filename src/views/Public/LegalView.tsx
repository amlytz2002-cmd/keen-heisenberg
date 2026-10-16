import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { Badge } from '../../components/ui/badge';

export const LegalView: React.FC<{ initialTab?: 'privacy' | 'terms' }> = ({
  initialTab = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(initialTab);
  const { navigate } = useRouter();

  // Sync state whenever initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tab: 'privacy' | 'terms') => {
    setActiveTab(tab);
    navigate(tab === 'privacy' ? '/privacy' : '/terms');
  };

  return (
    <div className="min-h-screen bg-[#060B14] py-16 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <Badge variant="cyan" className="uppercase tracking-wider">
            Akademik Yönetişim & Hukuki Uyum
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            CENNA.live Politikaları ve Kullanım Koşulları
          </h1>
          <p className="text-sm text-slate-400">
            Öğrenci veri gizliliği, PostgreSQL Satır Düzeyi Güvenlik (RLS) ve akademik sorumluluk ilkelerimiz.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => handleTabChange('privacy')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'privacy'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Gizlilik & Veri İzolasyonu</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('terms')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'terms'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Kullanım Koşulları</span>
          </button>
        </div>

        {/* Content Box */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-xl text-slate-300 leading-relaxed text-sm space-y-6">
          {activeTab === 'privacy' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-2">1. Varsayılan Olarak Tam Gizlilik</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  CENNA.live, öğrenci verilerinin gizliliğini ve akademik bağımsızlığını en üst düzeyde korur. Kişisel çalışma oturumları, soru denemeleri, Sokratik ipucu kayıtları ve sınav yanıtları PostgreSQL Satır Düzeyi Güvenlik (RLS) ile korunmaktadır. Öğrenciler yalnızca kendi akademik ilerlemelerini görebilir; eğitmenler ise yalnızca yetkili oldukları sınıflara kayıtlı öğrencilerin gelişim verilerini inceleyebilir.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-2">2. Kamuya Açık Akış veya Veri Sızıntısı Yoktur</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Ders kaynakları, eğitmen sunumları ve öğrenci cevapları asla herkese açık forumlarda veya kimlik doğrulaması yapılmamış alanlarda paylaşılmaz. Tüm belge depolama alanları kesinlikle gizlidir ve yalnızca yetkilendirilmiş, zaman sınırlı imzalı bağlantılar veya onaylı sunucu taraflı işleme hatları üzerinden erişilebilir.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-2">3. Yapay Zekâ Modeli Veri Güvenliği</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Kavram çıkarma ve soru üretimi amacıyla işlenen ders belgeleri, hiçbir koşulda genel yapay zekâ temel modellerini eğitmek için kullanılmaz. Tüm model istemleri kişisel verilerden arındırılır ve özel kurumsal edge uç noktaları üzerinden işlenir.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-2">4. Denetlenebilirlik & Yönetici Kısıtlamaları</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Sistem üzerindeki tüm işlemler değiştirilemez denetim kayıtlarında (audit logs) saklanır. Sistem yöneticileri dahi özel öğrenci yanıtlarını rastgele görüntüleyemez veya sınav sonuçlarını keyfi olarak değiştiremez.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-2">1. Akademik Dürüstlük & Platform Amacı</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  CENNA.live, aktif hatırlama yoluyla derin ve kalıcı öğrenmeyi sağlamak amacıyla geliştirilmiş bir akademik uzmanlaşma platformudur. Kullanıcılar, platform API'lerini kötüye kullanmamayı, süreli sınav sayaçlarını atlatmaya veya Sokratik ipucu kademelerini manipüle etmeye çalışmamayı kabul eder.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-2">2. Tıbbi veya Klinik Teşhis Niteliği Taşımamaktadır</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  CENNA.live, eczacılık ve sağlık bilimleri öğrencileri için yalnızca akademik eğitim ve pratik amacıyla sunulmaktadır. Platform; klinik karar destek sistemi, tanı aracı veya tıbbi tedavi kılavuzu DEĞİLDİR. Soru senaryoları ve ipuçları hiçbir koşulda gerçek hasta bakımında veya klinik teşhislerde dayanak olarak kullanılamaz.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-2">3. Eğitmen İçerik ve Yayınlama Sorumluluğu</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Yapay zekâ tarafından üretilen kavramlar, sorular ve ipuçları, ders eğitmeni tarafından incelenip onaylanana kadar taslak niteliğindedir. Ders materyallerinin doğruluğunu ve müfredata uygunluğunu onaylayarak öğrencilere yayınlama sorumluluğu ilgili dersin eğitmenine aittir.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-2">4. v2.0 Platform Sürümü</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Bu sürüm (v2.0), akademik değerlendirme ve pilot eğitim programları kapsamında sunulmaktadır. Platform işlevleri, pedagojik etki analizleri ve eğitmen geri bildirimleri doğrultusunda sürekli olarak geliştirilmektedir.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
