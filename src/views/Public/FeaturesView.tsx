import React from 'react';
import {
  FileText,
  Lightbulb,
  History,
  ShieldCheck,
  ArrowRight,
  Atom,
  Activity,
} from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';

export const FeaturesView: React.FC = () => {
  const { navigate } = useRouter();

  const features = [
    {
      icon: Atom,
      title: '21 İnteraktif Klinik Kurtarma Görevi',
      desc: 'Aspirin ester montajı, Lidokain pKa optimizasyonu, Doksorubisin kardiyotoksisite kalkanı ve Siprofloksasin kelasyon direnci dahil 21 gerçek vaka. Molekülü tasarlayın, canlı EKG ve hasta parametrelerinin iyileşmesini izleyin.',
      tags: ['Farmakofor Montajı', 'Canlı Telemetri', 'EKG & Vitals HUD'],
      badgeVariant: 'cyan' as const,
    },
    {
      icon: Lightbulb,
      title: '3 Kademeli Sokratik İpucu İskelesi',
      desc: 'İpuçları üç bilişsel seviyede sunulur: 1. Kademe (Temel İlke ve Mekanizma), 2. Kademe (Yapısal İlişki & Yan Zincirler) ve 3. Kademe (Klinik Uygulama ve Dozaj Rehberliği). Doğru cevap öğrenci düşünmeden asla doğrudan ifşa edilmez.',
      tags: ['Yönlendirme', 'Akıl Yürütme', 'Klinik Karar', 'Cevap Gizliliği'],
      badgeVariant: 'warning' as const,
    },
    {
      icon: Activity,
      title: 'Cockcroft-Gault & PK/PD Dozaj Motoru',
      desc: 'Renal yetmezlikli hastalarda kreatinin klirensine (CrCl) bağlı aminoglikozid (Gentamisin) ve Teofilin klerens simülasyonları. Toksik Cmax ve suboptimal vadi konsantrasyonu risklerini gerçek zamanlı hesaplayın.',
      tags: ['CrCl Formülü', 'Terapötik İlaç İzlemi', 'Toksisite Bariyeri'],
      badgeVariant: 'default' as const,
    },
    {
      icon: History,
      title: 'FSRS Aralıklı Tekrar (Spaced Repetition) Motoru',
      desc: 'Ebbinghaus unutma eğrisini yenen modern FSRS algoritması. Başarılı hatırlamalar kararlılığı 1, 3, 7 ve 14 günlük optimal aralıklara yayar. Yanlış cevaplanan kavramlar derhal tekrar kuyruğuna alınır.',
      tags: ['FSRS Algoritması', 'Kişiselleştirilmiş Aralık', 'Hafıza Retansiyonu'],
      badgeVariant: 'purple' as const,
    },
    {
      icon: FileText,
      title: 'Ders Notundan Otomatik Kavram & Soru Çıkarımı',
      desc: 'PDF, Word ve slayt ders notlarını yükleyin. CENNA.live anlamsal bölümleme motoru belgeleri analiz eder, sayfa/paragraf koordinatlarını koruyarak Sokratik aktif hatırlama soruları ve kavram grafiği oluşturur.',
      tags: ['PDF & DOCX', 'Sayfa Atfı', 'Halüsinasyon Engeli'],
      badgeVariant: 'success' as const,
    },
    {
      icon: ShieldCheck,
      title: 'PostgreSQL RLS Satır Güvenliği & Eğitmen Onay Kapısı',
      desc: 'Üretilen tüm sorular önce fakülte onay kapısına gelir. Eğitmen yan yana kaynak doğrulaması yapmadan hiçbir soru yayına giremez. Satır düzeyi veri güvenliği (RLS) ile öğrenci verileri 100% izoledir.',
      tags: ['Fakülte Onay Kapısı', 'PostgreSQL RLS', 'Edge API Güvenliği'],
      badgeVariant: 'destructive' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-[#060B14] py-16 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <Badge variant="cyan" className="uppercase tracking-wider">
            Platform Mimarisi & Yetenekler
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Derinlemesine Entegre Klinik Teknoloji
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            CENNA.live'daki her bir simülatör ve modül, ezberi ortadan kaldırmak ve kalıcı klinik muhakeme yetisi kazandırmak için tasarlandı.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Card
                key={i}
                className="flex flex-col justify-between hover:border-slate-700 transition-all duration-300"
              >
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-sky-400 mb-3">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg text-white font-bold">{f.title}</CardTitle>
                  <CardDescription className="text-xs text-slate-400 leading-relaxed pt-2">
                    {f.desc}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800">
                    {f.tags.map((t, idx) => (
                      <Badge key={idx} variant={f.badgeVariant} className="text-[10px]">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Banner */}
        <div className="p-8 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 text-center space-y-4 mt-8">
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Klinik Kurtarma Laboratuvarını Hemen Keşfedin
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Ücretsiz hesap oluşturarak ilk kurtarma görevine başlayabilir veya 1-tıkla canlı demoyu deneyebilirsiniz.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button
              onClick={() => navigate('/auth/register')}
              className="bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs"
            >
              Hemen Kaydol
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/how-it-works')}
              className="text-xs"
            >
              Pedagojik Yöntemi İncele
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
