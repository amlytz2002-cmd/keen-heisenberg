# Phase 3 Plan: Brilliant-Tarzı İnteraktif Medisinal Kimya Mikro-Öğrenme Platformu

## Objective
CENNA.live platformunu hantal eğitmen/LMS yönetim portalı modelinden çıkarıp; **Brilliant.org** seviyesinde tüketici odaklı, derin sezgi kazandıran interaktif bir **Medisinal Kimya Mikro-Öğrenme Platformu** haline getirmek. Masaüstündeki (`C:\Users\hp\OneDrive\Desktop\medisinal`) 26 PDF ders notunu (Prof. Dr. Bedia Kaymakçıoğlu) yapılandırarak **Kademe 1: Temel İlkeler & SAR** müfredatını (6 Modül, 21 Mikro-Ders, 100+ interaktif kart) tam etkileşimli bileşenlerle (MoleculeInspector, SarSimulator, BondPocketMatcher, PhIonizationGauge) canlıya almak.

---

## Execution Matrix & Quality Gates

- **Gate 1 (Arayüz & Beceri Ağacı İskeleti):** Eğitmen paneli ana menüden kaldırılır; uygulama doğrudan `/learn` (Skill Tree / Ders Haritası) rotasına bağlanır; `SkillTreeView` modül ve ders düğümlerini kilit/yıldız durumlarıyla render eder; üst barda Streak (🔥) ve XP (⚡) görünür.
- **Gate 2 (İnteraktif Kimya Widget Kütüphanesi):** SVG tabanlı `MoleculeInspector`, canlı LogP ibreli `SarSimulator`, reseptör cebi `BondPocketMatcher` ve Henderson-Hasselbalch eğrili `PhIonizationGauge` bileşenleri sıfır harici ağır kütüphane bağımlılığıyla yüksek performanslı olarak geliştirilir.
- **Gate 3 (Kademe 1 İçerik Paketi):** `Desktop/medisinal` altındaki ilk 6 modüle ait ders slaytları taranıp 21 mikro-ders ve 100+ kart halinde `src/data/courses/medicinalChemistryTier1.ts` dosyasına tip güvenli olarak derlenir.
- **Gate 4 (Ders Oynatıcı & Supabase Senkronizasyonu):** Tam ekran `InteractiveLessonPlayer` FSM akışı (Keşfet -> Tahmin Et -> Mekanistik Çözüm -> Klinik Uygulama) tamamlanır; kullanıcı ilerlemesi `user_lesson_progress` ve `user_gamification` tablolarına senkronize edilir.
- **Gate 5 (Bütünlük & Üretim Dağıtımı):** 355+ vitest testi korunur, yeni interaktif ders testleri eklenir; `npm run typecheck` ve `npm run build` sıfır hatayla geçer; Cloudflare Pages (`cenna.live`) üzerinde üretim dağıtımı doğrulanır.

---

## Detailed Task Breakdown

### Task 1: Tüketici Odaklı Navigasyon ve Beceri Ağacı (Skill Tree)
- **Hedef Dosyalar:**
  - `src/components/Navbar.tsx`
  - `src/views/Student/SkillTreeView.tsx` (Yeni)
  - `src/components/gamification/StreakBadge.tsx` (Yeni)
  - `src/App.tsx`
- **Yapılacaklar:**
  1. `Navbar.tsx` içerisinden karmaşık eğitmen bağlantılarını ve rol değiştirici butonları kaldır; tüketici odaklı temiz menü kur:
     - `Ders Haritası` (`/learn`)
     - `Günlük Pratik` (`/practice`)
     - `Ustalık & Gelişim` (`/progress`)
     - Profil açılır menüsü
  2. Başlığa `StreakBadge` (günlük seri ateşi 🔥) ve `XPBadge` (kazanılan deneyim puanı ⚡) ekle.
  3. `SkillTreeView.tsx` bileşenini geliştir:
     - Dikey/zigzag bağlantı çizgileriyle Brilliant/Duolingo tarzı ders düğümleri.
     - Düğüm durumları: `completed` (3 yıldız + yeşil), `active` (nabız animasyonu + Şimdi Başla butonu), `locked` (gri kilitli).
     - Modül başlık kartları (Modül 1: Fonksiyonel Gruplar, Modül 2: İlaç-Reseptör Bağları vb.).
  4. Rota varsayılanını `/learn` rotasına bağla.

### Task 2: Özel İnteraktif Kimya Bileşenleri Kütüphanesi
- **Hedef Dosyalar:**
  - `src/components/interactive/MoleculeInspector.tsx` (Yeni)
  - `src/components/interactive/SarSimulator.tsx` (Yeni)
  - `src/components/interactive/BondPocketMatcher.tsx` (Yeni)
  - `src/components/interactive/PhIonizationGauge.tsx` (Yeni)
  - `src/components/interactive/WidgetRenderer.tsx` (Yeni)
- **Yapılacaklar:**
  1. `MoleculeInspector.tsx`: 2D SVG molekül iskeleti üzerinde tıklanabilir interaktif atom ve fonksiyonel grup sıcak noktaları (ester, amit, karboksilat, amin, fenil halkası). Seçim durumunda parıltı ve açıklama balonu.
  2. `SarSimulator.tsx`: R-grubu değiştirici (örn. -H, -F, -Cl, -CF3, -OH) ve canlı LogP / KBB geçirgenliği / reseptör afinite ibresi.
  3. `BondPocketMatcher.tsx`: İlaç grubu ile reseptör amino asit yan zincirleri (Aspartat, Serin, Tirozin, Lizin) arasında doğru bağ türünü (İyonik, H-bağı, $\pi-\pi$, Van der Waals) eşleştirme sahnesi.
  4. `PhIonizationGauge.tsx`: Henderson-Hasselbalch interaktif pH kaydırıcısı (1.0 - 14.0) ve asit/baz ilaçların iyonize vs lipofilik fraksiyon değişimi.
  5. `WidgetRenderer.tsx`: Kart adımının `widgetType` parametresine göre ilgili interaktif sahneyi dinamik render eden adaptör.

### Task 3: Kademe 1 Müfredatını (21 Mikro-Ders) Kodlama ve Paketleme
- **Hedef Dosyalar:**
  - `src/types/microlearning.ts` (Yeni)
  - `src/data/courses/medicinalChemistryTier1.ts` (Yeni)
- **Yapılacaklar:**
  1. `src/types/microlearning.ts` veri sözleşmesini tanımla (`CourseModule`, `MicroLesson`, `LessonStep`, `InteractiveWidgetType`).
  2. `Desktop/medisinal` klasöründeki gerçek ders notlarından hareketle 6 modülü yapılandır:
     - **Modül 1 (Fonksiyonel Gruplar & İskelet - 4 Ders):** Oksijenli Gruplar, Karbonil & Açil, Azot & Kükürt, Heterosiklik Halkalar.
     - **Modül 2 (İlaç-Reseptör Etkileşimi & Bağlar - 3 Ders):** Kovalent & Güçlü Bağlar (Aspirin, Omeprazol), İyonik & H-Bağları, Zayıf Kuvvetler & Lipofilik Cep.
     - **Modül 3 (İlaçlarda İzomeri & Stereokimya - 3 Ders):** Geometrik İzomeri, Easson-Stedman 3-Nokta Hipotezi & Optik İzomeri, Talidomid & Kiral Geçiş.
     - **Modül 4 (Biyoizosterizm İlkeleri - 3 Ders):** Grimm Kuralı & Klasik Biyoizosterler, Tetrazol-Karboksilik Asit & Non-Klasik Biyoizosterler (Losartan), Metabolik Kararlılık & Prokainamid.
     - **Modül 5 (Yapı-Etki İlişkileri & Çözünürlük - 4 Ders):** LogP & Membran Geçirgenliği, Henderson-Hasselbalch İyonizasyonu, Lipinski 5 Kuralı (Ro5), SAR Analiz Metodu.
     - **Modül 6 (İlaç Metabolizması - 4 Ders):** Faz I Oksidasyon & CYP450, Faz I Redüksiyon & Hidroliz, Faz II Konjugasyon & Parasetamol/NAPQI, Ön İlaç Tasarımı (Enalapril).
  3. Her derse 4-7 interaktif kart adımı (Keşfet, Tahmin Et, Mekanistik Açıklama, Klinik Uygulama) ve 3 aşamalı Sokratik ipucu zinciri ekle.

### Task 4: Tam Ekran İnteraktif Ders Oynatıcı & Supabase Senkronizasyonu
- **Hedef Dosyalar:**
  - `src/views/Student/InteractiveLessonPlayer.tsx` (Yeni)
  - `src/context/MicrolearningContext.tsx` (Yeni)
  - `supabase/migrations/20261012170000_microlearning_progress.sql` (Yeni)
- **Yapılacaklar:**
  1. `InteractiveLessonPlayer.tsx` bileşenini kodla:
     - Üstte bölünmüş ilerleme çubuğu (segment progress bar) ve çıkış (X) butonu.
     - Ortada odak kartı ve interaktif widget alanı.
     - Altta "Kontrol Et" / "Devam Et" eylem alanı, anında yeşil (doğru) / sarı (ipucu) geri bildirim tepsisi.
     - Her kartta "💡 Cenna Sokratik Preseptör" ipucu paneli (Pro planda yapay zeka derinleşmesi için teaser rozetli).
     - Ders sonu tebrik ekranı (Kazanılan yıldızlar, XP, seri artışı ve "Sonraki Dersi Aç" butonu).
  2. `20261012170000_microlearning_progress.sql` göçünü hazırla:
     - `public.user_lesson_progress` (kullanıcı ders tamamlama, yıldız ve puan tablosu).
     - `public.user_gamification` (seri ve toplam XP tablosu).
  3. `MicrolearningContext.tsx` ile çevrimdışı öncelikli yerel depolama (localStorage) ve arka planda Supabase senkronizasyonu sağla.

### Task 5: Test, Tip Denetimi ve Canlı Üretim Dağıtımı
- **Hedef Dosyalar:**
  - `tests/cennalive_microlearning_engine.test.ts` (Yeni)
  - `dist/` (build çıktısı)
- **Yapılacaklar:**
  1. `tests/cennalive_microlearning_engine.test.ts` test paketini yaz:
     - 21 mikro-dersin bütünlük ve adım sayısı doğrulaması.
     - İnteraktif widget prop sözleşmeleri ve doğru cevap doğrulama kuralları.
     - FSM ders tamamlama ve puan hesaplama motoru testleri.
  2. `npm test` ile tüm testlerin (355+ mevcut + yeni ders testleri) başarıyla geçtiğini doğrula.
  3. `npm run typecheck` ile sıfır TypeScript derleme hatası sağla.
  4. `npm run build` ile Vite üretim paketini oluştur.
  5. Değişiklikleri git'e commit et.

---

## Acceptance Criteria
- [ ] Eğitmen paneli ana kullanıcı gezintisinden tamamen kaldırılmış ve uygulama varsayılan olarak `/learn` (Beceri Ağacı) ekranıyla açılmaktadır.
- [ ] `SkillTreeView` 6 modülü ve 21 ders düğümünü kilitli/açık durumlarıyla görsel olarak listelemektedir.
- [ ] 4 adet özel kimyasal widget (`MoleculeInspector`, `SarSimulator`, `BondPocketMatcher`, `PhIonizationGauge`) hatasız render edilmekte ve dokunulabilir etkileşim sunmaktadır.
- [ ] `Desktop/medisinal` slaytlarından çıkarılan 21 mikro-ders 100+ interaktif kart ile sıfır gecikmeli olarak oynatılabilmektedir.
- [ ] Öğrencinin tamamladığı dersler, kazandığı yıldızlar ve günlük serisi (streak) Supabase üzerinde kalıcı olarak saklanmaktadır.
- [ ] Tüm vitest testleri (%100 başarı) ve TypeScript derlemesi 0 hata ile tamamlanmaktadır.
