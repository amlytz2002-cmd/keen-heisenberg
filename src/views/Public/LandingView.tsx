import React, { useState, useRef } from 'react';
import {
  Sparkles,
  FlaskConical,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Atom,
  Activity,
  FileText,
  Brain,
  Lightbulb,
  HeartPulse,
  Clock,
  Layers,
  Zap,
} from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { BorderBeam } from '../../components/magicui/border-beam';
import { Spotlight } from '../../components/magicui/spotlight';
import { AnimatedBeam } from '../../components/magicui/animated-beam';
import { NumberTicker } from '../../components/magicui/number-ticker';
import { BentoGrid, BentoCard } from '../../components/magicui/bento-grid';

export const LandingView: React.FC = () => {
  const { navigate } = useRouter();
  const { user, activeRole, signInDemo } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);

  // Live Hero Interactive Mini-Toolbox state
  const [selectedGroup, setSelectedGroup] = useState<'aspirin' | 'ester' | 'salicylate'>('aspirin');

  // Animated pipeline refs
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const labRef = useRef<HTMLDivElement>(null);

  const handleLaunchDemo = async (role: 'student' | 'instructor') => {
    setDemoLoading(true);
    const ok = await signInDemo(role);
    setDemoLoading(false);
    if (ok) {
      navigate(role === 'instructor' ? '/app/teach' : '/app/today');
    }
  };

  // Telemetry computation for the live Hero preview
  const telemetry = {
    aspirin: {
      logP: '1.19',
      safety: 96,
      status: 'MUKOZAL HASAR ÖNLENDİ',
      color: 'text-emerald-400',
      tagColor: 'success' as const,
      name: 'Asetilsalisilik Asit (Aspirin)',
      desc: 'Ester bağı fenolik -OH grubunu maskeleyerek gastrik mukozadaki erozyon riskini bloke etti.',
    },
    ester: {
      logP: '1.85',
      safety: 82,
      status: 'YÜKSEK LİPOFİLİSİTE',
      color: 'text-sky-400',
      tagColor: 'default' as const,
      name: 'Salisilik Asit Etil Esteri',
      desc: 'Lipofilik bariyer aşımı arttı, oral biyoyararlanım %92 seviyesine yükseldi.',
    },
    salicylate: {
      logP: '0.42',
      safety: 34,
      status: 'KRİTİK MUKOZAL HASAR',
      color: 'text-rose-400',
      tagColor: 'destructive' as const,
      name: 'Serbest Salisilik Asit',
      desc: 'Korumasız fenol grubu mide çeperinde lokal mikrovasküler kanamaya ve erozyona yol açıyor!',
    },
  }[selectedGroup];

  return (
    <div className="relative min-h-screen bg-[#060B14] text-slate-100 overflow-x-hidden">
      {/* 1. HERO SECTION WITH SPOTLIGHT & LIVE PREVIEW */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 overflow-hidden">
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#0EA5E9" />

        <div className="max-w-7xl mx-auto">
          {/* Badge & Headline */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-sky-400 animate-pulse" />
              <span>CENNA.live v2.0 • Yeni Nesil İlaç Tasarım & Klinik Kurtarma Laboratuvarı</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
              Farmasötik Kimyayı <br />
              <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                Yaşamsal Simülasyonlarla
              </span>{' '}
              Pekiştirin.
            </h1>

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Statik slaytları unutun. PDF ders notlarından çıkarılan kavram grafikleri, 21 interaktif moleküler kurtarma görevi ve 3 kademeli Sokratik akıl yürütme iskelesiyle klinik yetkinliğinizi üst düzeye taşıyın.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              {user ? (
                <Button
                  size="lg"
                  onClick={() => navigate(activeRole === 'instructor' ? '/app/teach' : '/app/today')}
                  className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold shadow-xl shadow-sky-500/25 px-8"
                >
                  <FlaskConical className="h-5 w-5 mr-2" />
                  {activeRole === 'instructor' ? 'Eğitmen Çalışma Masasına Dön' : 'Klinik Laboratuvara Dön'}
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={() => navigate('/auth/register')}
                    className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold shadow-xl shadow-sky-500/25 px-7"
                  >
                    Hemen Başla (Ücretsiz Kayıt)
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    disabled={demoLoading}
                    onClick={() => handleLaunchDemo('student')}
                    className="border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:border-slate-600 px-6"
                  >
                    <Zap className="h-4 w-4 mr-2 text-amber-400" />
                    {demoLoading ? 'Demo Başlatılıyor...' : '1-Tıkla Canlı Demo'}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Interactive Live Mini-Toolbox Preview Card */}
          <div className="relative mt-16 max-w-4xl mx-auto">
            <div className="relative rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
              <BorderBeam size={280} duration={14} colorFrom="#0EA5E9" colorTo="#10B981" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <h3 className="text-base font-bold text-white">
                      Canlı İnteraktif Simülatör Önizlemesi
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Aşağıdaki fonksiyonel grupları değiştirerek molekülün LogP ve gastrik mukozal etkisini anında gözlemleyin.
                  </p>
                </div>
                <Badge variant={telemetry.tagColor} className="self-start sm:self-auto font-mono text-[11px]">
                  {telemetry.status}
                </Badge>
              </div>

              {/* Functional Group Switcher */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
                <button
                  type="button"
                  onClick={() => setSelectedGroup('aspirin')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedGroup === 'aspirin'
                      ? 'border-sky-500 bg-sky-500/15 shadow-sm'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold text-white">+ Asetil Kalkanı (-COCH₃)</div>
                  <div className="text-[11px] text-slate-400 mt-1">Ester bağı ile fenolü maskele (Aspirin)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedGroup('ester')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedGroup === 'ester'
                      ? 'border-sky-500 bg-sky-500/15 shadow-sm'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold text-white">+ Etil Ester Maskesi (-COOC₂H₅)</div>
                  <div className="text-[11px] text-slate-400 mt-1">Lipofilik absorbsiyonu artır</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedGroup('salicylate')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedGroup === 'salicylate'
                      ? 'border-rose-500 bg-rose-500/15 shadow-sm'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold text-rose-300">Maskesiz Salisilat (-OH)</div>
                  <div className="text-[11px] text-slate-400 mt-1">Lokal asidik tahriş riski</div>
                </button>
              </div>

              {/* Chemical SVG & Live Telemetry Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-slate-950/70 p-5 rounded-xl border border-slate-800/80">
                {/* SVG Visualizer */}
                <div className="flex flex-col items-center justify-center py-2">
                  <svg className="w-48 h-36 overflow-visible" viewBox="0 0 200 160">
                    {/* Benzene Ring */}
                    <polygon
                      points="100,45 135,65 135,105 100,125 65,105 65,65"
                      fill="#0F172A"
                      stroke="#38BDF8"
                      strokeWidth="2.5"
                    />
                    <circle cx="100" cy="85" r="20" fill="none" stroke="#0284C7" strokeWidth="1.5" strokeDasharray="3 3" />

                    {/* Functional group bonds */}
                    <line x1="100" y1="45" x2="100" y2="15" stroke="#F59E0B" strokeWidth="2.5" />
                    <text x="100" y="10" fill="#F59E0B" fontSize="11" fontWeight="bold" textAnchor="middle">
                      -COOH (Karboksil)
                    </text>

                    <line x1="135" y1="65" x2="175" y2="50" stroke={selectedGroup === 'salicylate' ? '#F43F5E' : '#10B981'} strokeWidth="2.5" />
                    <text x="180" y="52" fill={selectedGroup === 'salicylate' ? '#F43F5E' : '#10B981'} fontSize="11" fontWeight="bold" textAnchor="start">
                      {selectedGroup === 'aspirin' ? '-O-COCH₃' : selectedGroup === 'ester' ? '-COOCH₂CH₃' : '-OH (Açık Fenol)'}
                    </text>
                  </svg>
                  <div className="text-xs font-semibold text-slate-300 mt-2">{telemetry.name}</div>
                </div>

                {/* Telemetry HUD */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
                    <span className="text-slate-400">Hesaplanan LogP:</span>
                    <span className="font-mono font-bold text-white">{telemetry.logP}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Gastrik Mukozal Güvenlik:</span>
                      <span className={`font-mono font-bold ${telemetry.color}`}>%{telemetry.safety}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          telemetry.safety > 80 ? 'bg-emerald-500' : telemetry.safety > 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${telemetry.safety}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    {telemetry.desc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PEDAGOGICAL PIPELINE (ANIMATED BEAMS) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-[#060B14]">
        <div className="max-w-7xl mx-auto text-center space-y-4 mb-16">
          <Badge variant="cyan" className="uppercase tracking-wider">
            Bütünleşik Eğitim Metodolojisi
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Belgeden Kliniğe: 4 Kademeli Bilişsel İskele
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            Bilginin ezberden çıkıp klinik refleks haline gelmesini sağlayan kesintisiz veri ve yapay zekâ akışı.
          </p>

          <div
            ref={containerRef}
            className="relative flex flex-col md:flex-row items-center justify-between gap-6 p-8 max-w-5xl mx-auto rounded-2xl bg-slate-900/40 border border-slate-800/80 mt-12"
          >
            {/* Stage 1 */}
            <div
              ref={pdfRef}
              className="z-10 flex flex-col items-center p-4 rounded-xl bg-slate-900 border border-slate-800 w-full md:w-52 text-center"
            >
              <div className="h-12 w-12 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-3">
                <FileText className="h-6 w-6" />
              </div>
              <div className="text-xs font-bold text-white">1. Yetkili Ders Notu</div>
              <div className="text-[11px] text-slate-400 mt-1">PDF / DOCX doğrulanmış kaynaklar</div>
            </div>

            {/* Stage 2 */}
            <div
              ref={aiRef}
              className="z-10 flex flex-col items-center p-4 rounded-xl bg-slate-900 border border-slate-800 w-full md:w-52 text-center"
            >
              <div className="h-12 w-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
                <Brain className="h-6 w-6" />
              </div>
              <div className="text-xs font-bold text-white">2. AI Kavram Grafiği</div>
              <div className="text-[11px] text-slate-400 mt-1">Önkoşul ilişkileri ve kavram haritası</div>
            </div>

            {/* Stage 3 */}
            <div
              ref={hintRef}
              className="z-10 flex flex-col items-center p-4 rounded-xl bg-slate-900 border border-slate-800 w-full md:w-52 text-center"
            >
              <div className="h-12 w-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                <Lightbulb className="h-6 w-6" />
              </div>
              <div className="text-xs font-bold text-white">3. Sokratik İpucu İskelesi</div>
              <div className="text-[11px] text-slate-400 mt-1">3 kademeli zihinsel yönlendirme</div>
            </div>

            {/* Stage 4 */}
            <div
              ref={labRef}
              className="z-10 flex flex-col items-center p-4 rounded-xl bg-slate-900 border border-slate-800 w-full md:w-52 text-center"
            >
              <div className="h-12 w-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div className="text-xs font-bold text-white">4. Moleküler Kurtarma</div>
              <div className="text-[11px] text-slate-400 mt-1">Canlı hasta telemetrisi kurtarma</div>
            </div>

            {/* Animated Beams between stages */}
            <AnimatedBeam containerRef={containerRef} fromRef={pdfRef} toRef={aiRef} />
            <AnimatedBeam containerRef={containerRef} fromRef={aiRef} toRef={hintRef} />
            <AnimatedBeam containerRef={containerRef} fromRef={hintRef} toRef={labRef} />
          </div>
        </div>
      </section>

      {/* 3. PLATFORM METRICS STRIP WITH NUMBER TICKER */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-slate-950/70">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-sky-400">
              <NumberTicker value={21} />
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-300">Klinik Kurtarma Görevi</div>
            <div className="text-[11px] text-slate-500">Moleküler tasarım simülatörleri</div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">
              <NumberTicker value={412} />
              <span>+</span>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-300">Aktif Hatırlama Sorusu</div>
            <div className="text-[11px] text-slate-500">Sokratik ipucu basamaklı</div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-amber-400">
              <span>%</span>
              <NumberTicker value={94} />
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-300">Uzun Süreli Hafıza Retansiyonu</div>
            <div className="text-[11px] text-slate-500">FSRS aralıklı tekrar optimizasyonu</div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-purple-400">
              <span>&lt;</span>
              <NumberTicker value={45} />
              <span>ms</span>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-300">Edge Yanıt Süresi</div>
            <div className="text-[11px] text-slate-500">Cloudflare Pages & Workers altyapısı</div>
          </div>
        </div>
      </section>

      {/* 4. BENTO GRID FEATURES */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="purple" className="uppercase tracking-wider">
              Yüksek Çözünürlüklü Özellikler
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Klinik Karar Verme Becerinizi Şekillendirin
            </h2>
            <p className="text-sm text-slate-400">
              Hem öğrenciler hem de fakülte üyeleri için tasarlanmış bütünleşik araç seti.
            </p>
          </div>

          <BentoGrid>
            <BentoCard
              name="21 İnteraktif Klinik Kurtarma Görevi"
              description="Aspirin ester montajından doksorubisin kardiyotoksisite kalkanına kadar 21 gerçek vaka simülasyonu. Molekülü sentezleyin, hasta EKG ve hemodinamiğini kurtarın."
              Icon={Atom}
              badge="MED-CHEM HUD"
              cta="Görevleri İncele"
              href="/features"
            />

            <BentoCard
              name="3 Kademeli Sokratik İpucu İskelesi"
              description="Sistem cevabı doğrudan sunmaz. 1. Aşama Yönlendirme, 2. Aşama Farmakofor Hatırlatması ve 3. Aşama Uygulama Analizi ile öğrencinin kendi akıl yürütmesini sağlar."
              Icon={Lightbulb}
              badge="SOCRATIC FSM"
              cta="Pedagojiyi Gör"
              href="/how-it-works"
            />

            <BentoCard
              name="Cockcroft-Gault & CrCl Hesaplayıcı"
              description="Böbrek yetmezliği olan hastalarda aminoglikozid (Gentamisin) ve Teofilin dozlamasını hastanın serum kreatininine göre hassasça simüle edin."
              Icon={Activity}
              badge="PK/PD ENGINE"
              cta="Klinik Motoru Gör"
              href="/features"
            />

            <BentoCard
              name="FSRS Aralıklı Tekrar Algoritması"
              description="Unutma eğrisini yenen 1, 3, 7 ve 14 günlük optimal bellek takvimi. Hangi kavramın ne zaman tekrarlanacağını kişiselleştirilmiş FSRS skorları yönetir."
              Icon={Clock}
              badge="SPACED REVIEW"
              cta="Algoritmayı İncele"
              href="/features"
            />

            <BentoCard
              name="Fakülte İçerik & Sınıf Yönetimi"
              description="Öğretim üyeleri kendi ders notlarını (PDF/DOCX) yükleyebilir, tek tıkla yapay zekâ kavram grafiğini onaylayabilir ve sınıf başarı dağılımını canlı takip edebilir."
              Icon={Layers}
              badge="FACULTY HUB"
              cta="Eğitmen Özellikleri"
              href="/features"
            />

            <BentoCard
              name="Sıfır Halüsinasyon & PostgreSQL RLS"
              description="Tüm sorular kaynak ders notunun belirli sayfa ve paragraflarına atıfla kilitlenir. Satır düzeyi veri güvenliği (RLS) ile öğrenci verileri tam koruma altındadır."
              Icon={ShieldCheck}
              badge="VERIFIED TRUTH"
              cta="Güvenlik Detayları"
              href="/privacy"
            />
          </BentoGrid>
        </div>
      </section>

      {/* 5. ONBOARDING ROLE BRIDGE & FINAL CALL TO ACTION */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#060B14] to-[#0B1528]">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge variant="cyan" className="uppercase tracking-wider">
            Hemen Başlayın
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Klinik Farmakoloji Yetkinliğinizi <br />
            Bugün Üst Seviyeye Taşıyın.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            İster sınavlara hazırlanan bir eczacılık/tıp öğrencisi olun, ister müfredatını güçlendirmek isteyen bir öğretim üyesi.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4">
            {/* Student Card */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 text-left space-y-4 hover:border-sky-500/50 transition-all">
              <div className="h-10 w-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Öğrenci & Stajyer Girişi</h3>
                <p className="text-xs text-slate-400 mt-1">
                  21 Kurtarma Görevi, Sokratik İpuçları ve FSRS Aralıklı Tekrar kütüphanesi.
                </p>
              </div>
              <Button
                onClick={() => navigate('/auth/register')}
                className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs"
              >
                Öğrenci Olarak Kaydol
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>

            {/* Instructor Card */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 text-left space-y-4 hover:border-emerald-500/50 transition-all">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FlaskConical className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Fakülte & Eğitmen Girişi</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ders notu işleme, sınıf oluşturma ve öğrenci kavram yanılgı analitiği.
                </p>
              </div>
              <Button
                variant="emerald"
                onClick={() => navigate('/auth/register')}
                className="w-full font-semibold text-xs"
              >
                Eğitmen Olarak Kaydol
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
