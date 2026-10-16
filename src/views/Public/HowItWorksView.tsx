import React from 'react';
import {
  BookOpen,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  History,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardHeader, CardTitle } from '../../components/ui/card';

export const HowItWorksView: React.FC = () => {
  const { navigate } = useRouter();

  const cycleDetails = [
    {
      title: '1. Öğren (Kaynak Belgeli Kavram Odaklılık)',
      icon: BookOpen,
      iconColor: 'text-sky-400 bg-sky-500/15 border-sky-500/30',
      description:
        'Genel internet özetleri veya doğrulanmamış yapay zekâ metinleri yerine, öğrenci doğrudan ders eğitmeninin sisteme yüklediği yetkili kaynaklardan çıkarılmış odak kavram kartlarıyla çalışır. Her tanım ve formül dosya adı, sayfa numarası ve paragraf koordinatlarıyla belgelenir.',
    },
    {
      title: '2. Hatırla (Kitapsız Aktif Geri Çağırma)',
      icon: HelpCircle,
      iconColor: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
      description:
        'Öğrenci kavramı inceledikten hemen sonra notlara bakmadan aktif hatırlama sorularıyla karşılaşır. Bilgiyi bellekten geri çağırma eylemi, test etme etkisi sayesinde nöral yolları derinlemesine pekiştirir (Roediger & Karpicke, 2006).',
    },
    {
      title: '3. Uygula (3 Kademeli Sokratik İpucu İlerlemesi)',
      icon: Lightbulb,
      iconColor: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
      description:
        'Öğrenci zorlandığında doğru cevap doğrudan verilmez. Bunun yerine kademeli Sokratik rehberlik devreye girer: 1. Kademe temel prensibi hatırlatır, 2. Kademe değişkenler arası mantıksal bağı kurar, 3. Kademe ise somut uygulama adımlarını gösterir.',
    },
    {
      title: '4. Eksik Gider (Kaynak Atıflı Anlık Teşhis)',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
      description:
        'Cevap verildiğinde sistem seçilen seçeneğin neden doğru veya yanlış olduğunu ders metnine atıfta bulunarak ayrıntılı şekilde açıklar. Kavram yanılgıları hemen işaretlenir ve öğrencinin kavram kavrama skoru gerçek zamanlı güncellenir.',
    },
    {
      title: '5. Tekrar Et (Aralıklı Konsolidasyon Takvimi - FSRS)',
      icon: History,
      iconColor: 'text-purple-400 bg-purple-500/15 border-purple-500/30',
      description:
        'Çözülen sorular aralıklı tekrar kuyruğuna aktarılır. Başarılı hatırlamalar bir sonraki tekrarı 1, 3, 7 ve 14 günlük optimal aralıklara öteler. Bir kavram unutulduğunda, aralık sayacı sınavlar öncesinde tam ustalık sağlamak üzere 1. güne geri alınır.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#060B14] py-16 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <Badge variant="purple" className="uppercase tracking-wider">
            Pedagojik Tasarım & Eğitim Metodu
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Kesintisiz 5 Aşamalı Öğrenme Döngüsü
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Öğren → Hatırla → Uygula → Eksik Gider → Tekrar Et: CENNA.live kapsamlı tıp ve eczacılık ders notlarını nasıl kalıcı klinik reflekslere dönüştürür?
          </p>
        </div>

        {/* Evidence Banner */}
        <div className="rounded-2xl border border-sky-500/30 bg-sky-950/30 p-5 flex items-start gap-4">
          <ShieldCheck className="h-6 w-6 text-sky-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm">
            <h4 className="font-bold text-white">Kanıta Dayalı Öğrenme Güvencesi</h4>
            <p className="text-slate-300 leading-relaxed">
              Eğitim bilimleri araştırmaları; aralıklı tekrar ve kademeli iskeleleme (scaffolding) ile birleştirilen aktif hatırlama yönteminin, pasif tekrar okuma ve kontrolsüz sohbet botu etkileşimlerine kıyasla çok daha üstün kalıcılık sağladığını kanıtlamaktadır.
            </p>
          </div>
        </div>

        {/* Steps Stack */}
        <div className="space-y-4">
          {cycleDetails.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card
                key={idx}
                className="hover:border-slate-700 transition-all duration-200"
              >
                <CardHeader className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 ${item.iconColor}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <CardTitle className="text-base font-bold text-white">
                        {item.title}
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <h3 className="text-xl font-bold text-white">Bu Metodolojiyi Deneyimleyin</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Öğrenci veya eğitmen olarak kaydolun ve ders notlarınızı aktif bir klinik simülasyona dönüştürün.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              onClick={() => navigate('/auth/register')}
              className="bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs"
            >
              Hemen Başla
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
