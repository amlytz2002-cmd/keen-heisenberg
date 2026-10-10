# CENNA.live — Kapsamlı Sistem, Fonksiyonellik ve Metin Kalitesi Denetimi (Audit)

**Tarih:** 2026-10-10  
**Kapsam:** Tüm Frontend Görünümleri (Views), Bileşenler (Components), Backend Cloudflare Pages Fonksiyonları (`functions/api/`), AI Çıkarım/Soru Üretim Modülü (`functions/_lib/aiService.ts`), Sokratik Diyalog Motoru ve Çoklu Model Kaskadı (`src/worker/` & `functions/_lib/socraticFSM.ts`).  
**Denetim Seviyesi:** Kritik, Tavizsiz, Eksiksiz (Zero-Tolerance Deep Audit).

---

## 1. Yönetici Özeti & En Büyük Kusurlar

Uygulamanın arka planındaki matematiksel modeller (Cockcroft-Gault, Gentamicin, Theophylline DAG motorları), FSRS aralıklı tekrar algoritması ve Supabase veri tabanı şeması mimari olarak sağlamdır (290/290 test geçmekte, 0 TypeScript hatası bulunmaktadır). **Ancak kullanıcı deneyimi, arayüz metinleri (copywriting), hata yönetimi ve dil bütünlüğü açısından ürün kabul edilemez düzeyde kusurludur:**

1. **Dil Çorbası ve Yabancı Dil Hakimiyeti:**
   - Uygulamanın neredeyse tüm kullanıcı arayüzü (Landing, Auth, Sınıflar, Bugün, Ders Detay, Soru Çözümü, Sınavlar, İnceleme Kuyruğu, Eğitmen ve Yönetici Panelleri) İngilizce kalmıştır.
   - Bazı başlıklarda yarım yamalak Türkçe kullanılırken, menü öğeleri, butonlar, modal uyarıları, doğrulama mesajları ve boş durumlar (empty states) İngilizce'dir.
   - Farmasötik ve tıp fakültesi öğrencilerine hitap eden bir platformda "Study Session", "Timed Mock Exams", "Review Queue", "Teach Hub" gibi ifadelerin yer alması pedagojik ciddiyeti yok etmektedir.

2. **Kaba ve Gramer Hatalı Bildirimler (Trash Copywriting):**
   - İçerik onaylama ekranında `message.success('Item ' + action + 'd successfully')` şeklinde bozuk ("Item publishd successfully", "Item rejectd successfully") İngilizce bildirimler bulunmaktadır.
   - Form doğrulama mesajlarında "Please enter your password", "Enter a valid email" gibi standart, özenilmemiş metinler yer almaktadır.
   - Soru çözüm ekranında ipuçları "Orientation", "Reasoning", "Application" şeklinde pedagojik bağlamdan kopuk İngilizce etiketlerle sunulmaktadır.

3. **Eski Marka Adı İhlali (Eski Prototip Kalıntıları):**
   - Ürün kimliği kesin olarak **CENNA.live** olmasına rağmen; `supabaseClient.ts`, `tutorClient.ts`, `worker/index.ts`, `worker/socraticFSM.ts` ve `functions/_lib/socraticFSM.ts` dosyalarında hala eski prototip adı geçmektedir (Örn: `clinical_observation_tr: "Eski prototip yalnızca sentetik eğitim vakaları..."`).

4. **Yapay Zekâ ve Üretim Motorunun Yabancı Dil ve Zayıf Şablon Kusurları:**
   - `functions/_lib/aiService.ts` dosyasındaki sistem promptları yapay zekaya İngilizce soru ve kavram üretmesini emretmektedir.
   - Model başarısız olduğunda veya kaskad tükendiğinde devreye giren yedek (fallback) sorular ("Which of the following statements most accurately reflects the core principle of...") ve ipuçları İngilizce'dir.

5. **Backend Hata Yönetimi ve Lokalizasyon Eksikliği:**
   - Cloudflare Pages endpoint'leri (`functions/api/**/*.ts`) kullanıcıya `UNAUTHORIZED`, `Authentication required`, `Question not found or unauthorized`, `Validation failed` gibi İngilizce hata yanıtları döndürmektedir. Frontend bu hataları doğrudan ekrana yansıttığında kullanıcı teknik ve yabancı dilde bir hata mesajıyla baş başa kalmaktadır.

---

## 2. Detaylı Dosya ve Bileşen Bazlı Kusur Matrisi

### A. Genel Kabuk & Navigasyon
| Dosya | Tespit Edilen Kusur ve Yetersizlik | Gerekli Düzeltme & Standart |
| :--- | :--- | :--- |
| `index.html` | `<html lang="en">`, İngilizce title ve meta description. | `<html lang="tr">`, "CENNA.live — Farmakoloji ve Klinik Eğitimde Aktif Pekiştirme Platformu". |
| `src/components/Navbar.tsx` | Masaüstü ve mobil menü öğeleri İngilizce ("Today", "Classrooms", "Spaced Review", "Timed Exams", "Progress", "Teach Hub", "Content Review", "Analytics"). Rol değişim butonu "Switch to Instructor View" / "Switch to Student View". Çıkış butonu "Sign Out". Hesap etiketi "Account". | Tüm menü "Bugün", "Sınıflarım", "Aralıklı Tekrar", "Süreli Sınavlar", "Akademik Gelişim", "Eğitmen Portalı", "İçerik İnceleme & Onay", "Analitik" olarak profesyonel Türkçe'ye çevrilecek. Rol ve kullanıcı menüsü kusursuzlaştırılacak. |
| `src/components/Footer.tsx` | Tamamen İngilizce ("Platform & Pedagogy", "The 5-Stage Learning Cycle", "Source-Grounded AI & Provenance", "Security & Governance", "Privacy Policy & RLS Isolation", "Terms of Service"). | %100 profesyonel akademik Türkçe ile yeniden yazılacak. |
| `src/components/ErrorBoundary.tsx` | "Something went wrong", "Reload Application", "Error details". | "Beklenmeyen Bir Hata Oluştu", "Uygulamayı Yeniden Başlat", klinik çalışma kaybı olmadan oturumu kurtarma yönlendirmesi. |

### B. Kamusal & Kimlik Doğrulama Görünümleri (Public & Auth Views)
| Dosya | Tespit Edilen Kusur ve Yetersizlik | Gerekli Düzeltme & Standart |
| :--- | :--- | :--- |
| `src/views/Public/LandingView.tsx` | Hero başlığı ("Deliberate Practice Powered by Verified AI"), alt açıklama, 5 basamaklı öğrenme döngüsü ("Learn, Retrieve, Apply, Remediate, Review"), öğrenci ve eğitmen değer önermeleri tamamen İngilizce. | Farmasötik ve tıp fakültesi müfredatına uygun, etkileyici, akıcı akademik Türkçe: "Doğrulanmış Kaynaklarla Aktif Öğrenme ve Kalıcı Pekiştirme", "Öğren → Geri Çağır → Uygula → İyileştir → Tekrar Et". |
| `src/views/Public/AuthView.tsx` | Tablar ("Sign In", "Register", "Reset"), Form alanları ("Email Address", "Password", "Full Name", "Account Role"), validasyon uyarıları ("Enter a valid email", "Password must be at least 6 characters"), hızlı demo butonları ("Sign in as Demo Student", "Sign in as Demo Instructor"). | "Giriş Yap", "Kayıt Ol", "Şifremi Sıfırla", "Kurumsal E-posta", "Öğrenci / Asistan", "Öğretim Üyesi / Eğitmen", "Hızlı Demo ile İncele". Hata mesajları Türkçe standardına kavuşturulacak. |
| `src/views/Public/FeaturesView.tsx` | 6 temel özellik kartı ve etiketleri İngilizce ("Automated Document Ingestion & Provenance", "3-Stage Socratic Hint Ladders", "1, 3, 7, 14-Day Spaced Repetition Engine", "Authoritative Timed Mock Exams", "Instructor Content Review Workspace", "Enterprise Row Level Security"). | Tamamı akademik Türkçeye çevrilecek; "Kaynak Dayanaklı Doküman İşleme", "3 Kademeli Sokratik İpucu Merdiveni", "Ebbinghaus Aralıklı Tekrar Sistemi", "Sunucu Onaylı Süreli Deneme Sınavları", vb. |
| `src/views/Public/HowItWorksView.tsx` | Bilişsel psikoloji temelli öğrenme döngüsü açıklamaları tamamen İngilizce. | Doğrudan Türkçe pedagojik anlatım. |
| `src/views/Public/LegalView.tsx` | Gizlilik Sözleşmesi, KVKK/Veri İzolasyonu ve Kullanım Koşulları tamamen İngilizce. | Türkiye mevzuatına ve üniversite standartlarına uygun Türkçe hukuki/akademik metin. |
| `src/views/Public/InviteRedeemView.tsx` | Davet kodu doğrulama ve sınıfa katılma ekranı İngilizce ("Missing invitation token", "Failed to redeem invitation"). | Türkçe doğrulama, bilgilendirme ve yönlendirme. |

### C. Öğrenci Deneyimi (Student Experience Views)
| Dosya | Tespit Edilen Kusur ve Yetersizlik | Gerekli Düzeltme & Standart |
| :--- | :--- | :--- |
| `src/views/Student/TodayView.tsx` | "Daily Target: ~25 Minutes", "Good day, Scholar", "Focused Active Session", "Start ~25 Min Study Session", "Active Courses", "Spaced Reviews Due", "Timed Mock Exams". Boş ders durumu "You are not yet enrolled in any courses". | "Günün Hedefi: ~25 Dakika", "İyi çalışmalar, [İsim]", "Odaklanmış Pekiştirme Seansı", "Aktif Çalışmayı Başlat", "Kayıtlı Dersler", "Günü Gelen Aralıklı Tekrarlar", "Süreli Deneme Sınavları". |
| `src/views/Student/StudySessionView.tsx` | Soru başlığı "Question X of Y", ipucu butonu "Socratic Hint (X/3)", modal başlığı "Socratic Hint Progression Ladder", ipucu aşamaları ("Stage 1: Orientation", "Stage 2: Reasoning", "Stage 3: Application"), giriş placeholder'ları ("Enter numeric calculation result", "Type your answer concisely..."), cevap bildirimi ("Correct! Well Done.", "Incorrect Response", "Mastery: 75%", "Next Review in X days"). | Sorunun türüne göre ("Tekli Seçim", "Çoklu Seçim", "Sayısal Hesaplama", "Açık Uçlu"), 3 kademeli ipucu ("1. Kademe: Temel İlke ve Tanım", "2. Kademe: Parametre İlişkisi ve Akıl Yürütme", "3. Kademe: Sayısal Yerine Koyma ve Çözüm Adımı"), cevap bildirimleri ("Tebrikler! Doğru Çözüm.", "Eksik veya Hatalı Yanıt", "Kalıcılık Düzeyi", "Sonraki Tekrar: X gün sonra"). |
| `src/views/Student/ReviewQueueView.tsx` | Tablo başlıkları ("Concept & Course", "Interval Stage", "Mastery", "Lapses", "Action"), butonlar ("Review Due Concepts", "All Caught Up Today"). | "Kavram ve Ders", "Aralık Kademesi (1-3-7-14 Gün)", "Kavrama Skoru", "Hata/Unutma Sayısı", "Tekrarı Başlat". |
| `src/views/Student/ExamsListView.tsx` | Sınav listesi, süre etiketi ("X Minutes"), geçme notu barajı ("70%"), başlama onay modalı. | "Süreli Deneme ve Kurul Sınavları", "Sınav Süresi", "Baraj Notu", "Sınavı Başlat Onay Penceresi". |
| `src/views/Student/ExamTakeView.tsx` | Geri sayım sayacı ("Time Remaining"), soru paleti durumu ("Answered", "Unanswered", "Flagged"), soru bayraklama ("Flag Question"), otomatik kaydetme bildirimi ("Autosaved at..."), sınavı bitirme onay modalı. | Kesintisiz, dikkati dağıtmayan profesyonel Türkçe sınav arayüzü: "Kalan Süre", "İşaretlenen Sorular", "Otomatik Kaydedildi", "Sınavı Tamamla ve Gönder". |
| `src/views/Student/ExamResultsView.tsx` | Sınav sonucu kartı ("Examination Passed" / "Needs Further Retrieval Practice"), konu bazlı teşhis tablosu ("Creatinine Clearance", "One-Compartment Elimination", "Needs Remediation"). | "Sınav Başarıyla Tamamlandı" / "Eksik Konuların Tekrarı Gerekiyor", "Konu ve Hedef Analizi Tablosu", "Zayıf Konuları Aralıklı Tekrara Ekle". |
| `src/views/Student/ProgressView.tsx` | İstatistik kartları, kavram kavrama dağılımı, öğrenme geçmişi tablosu. | "Genel Akademik Başarı", "Kavranan Konular", "Çalışılmakta Olanlar", "Öncelikli Tekrar Gerekenler". |
| `src/views/Student/ClassroomsView.tsx` & `CourseDetailView.tsx` | Sınıf kartları, derse katılma modalı, müfredat yapısı, modül listesi. | Tamamen Türkçe ders ve sınıf görünümü. |

### D. Eğitmen & Yönetici Çalışma Alanı (Instructor & Admin Views)
| Dosya | Tespit Edilen Kusur ve Yetersizlik | Gerekli Düzeltme & Standart |
| :--- | :--- | :--- |
| `src/views/Instructor/TeachDashboardView.tsx` | Başlık ("Instructional Management"), özet istatistikler ("Classrooms", "Courses", "Documents", "Pending Reviews"), hızlı butonlar ("New Classroom", "Upload Document"). | "Eğitmen Yönetim Portalı", "Aktif Sınıflar", "Dersler", "Kaynak Belgeler", "Onay Bekleyen İçerikler". |
| `src/views/Instructor/ClassroomManagerView.tsx` | Sınıf oluşturma, öğrenci listesi, davet bağlantısı üretme ("Generate Invite Link", "Copy URL"). | "Yeni Sınıf Oluştur", "Davet Bağlantısı Üret", "Panoya Kopyala". |
| `src/views/Instructor/ResourceManagerView.tsx` | Doküman yükleme formu ("Resource registered. Processing semantic chunks..."), parça önizleme modalı ("Chunks Viewer"). | "Ders Notu / Slayt Yükle", "Anlamsal Parçalara Böl ve İşle", "Parça İnceleme Penceresi". |
| `src/views/Instructor/ContentReviewWorkspace.tsx` | Onay sekmeleri ("Needs Review", "Approved", "Published", "Rejected"), bozuk İngilizce toast bildirimleri (`Item ${action}d successfully`), red sebebi modalı, onay butonları. | "İçerik İnceleme & Yayınlama Kapısı", "İnceleme Bekleyenler", "Onaylananlar", "Yayındakiler", "Reddedilenler". Kusursuz Türkçe bildirimler: "Kavram başarıyla onaylandı ve yayına alındı", "Soru reddedildi". |
| `src/views/Instructor/InstructorAnalyticsView.tsx` | Kohort başarı grafikleri, hata oranları tablosu. | "Sınıf Başarı Analitiği", "En Çok Yanılınan Soru Düğümleri", "Risk Altındaki Öğrenciler". |
| `src/views/Admin/AdminAuditView.tsx` | Sistem denetim kayıtları tablosu, filtreler. | "Sistem Denetim ve Güvenlik Kayıtları", "Olay Türü", "İşlemi Yapan", "Zaman Damgası". |

### E. Backend Fonksiyonları & API Uç Noktaları (`functions/api/`)
| Dosya | Tespit Edilen Kusur ve Yetersizlik | Gerekli Düzeltme & Standart |
| :--- | :--- | :--- |
| `functions/api/study/hint.ts` | 42-60. satırlarda yer alan varsayılan ipucu metinleri ("Stage 1: Orientation - Identify the underlying academic principle...", "Stage 2: Reasoning...", "Stage 3: Application..."). | Yüksek standartlı akademik Türkçe ipucu basamakları ile değiştirilecek. |
| `functions/api/study/submit-answer.ts` | 209. satırdaki feedback özeti ("Correct! Excellent retrieval.", "Incorrect. Revisit the core concept below.") ve 70, 77, 105, 137. satırlardaki İngilizce hata yanıtları. | Türkçe geri bildirim ve standart hata nesneleri. |
| `functions/_lib/aiService.ts` | Sistem promptları İngilizce çıktı talep ediyor; deterministik yedekler İngilizce. | Sistem promptları müfredat terminolojisine uygun Türkçe kavram ve sorular üretmeye yönlendirilecek; deterministik yedekler Türkçe olacak. |
| `functions/_lib/socraticFSM.ts` & `src/worker/socraticFSM.ts` | Satır 28: `"Eski prototip yalnızca sentetik eğitim vakaları..."` (Eski marka adı kalıntısı). | `"CENNA.live yalnızca sentetik eğitim vakaları..."` olarak güncellenecek. |
| `functions/api/resources/[id]/process.ts` | Varsayılan bölüm başlığı `'Introduction'`, sayfa ayrıştırma ve başlık regex'i Türkçe karakter duyarsızlığı. | Varsayılan başlık `'Giriş'`, Türkçe karakterler (ç, ğ, ı, ö, ş, ü, İ) ile uyumlu chunking. |
| `functions/api/exams/attempts/[attemptId]/submit.ts` | Sınav süre aşımı ve değerlendirme teşhis metinleri İngilizce. | Türkçe sınav sonuç çıktısı ve klinik telafi önerileri. |
| Tüm `functions/api/**/*.ts` | 401, 400, 404, 500 dönen hata yanıtları saf İngilizce stringler içeriyor. | Kullanıcıya yansıyabilecek mesajlar Türkçe ve tutarlı kod formatında yapılandırılacak. |

---

## 3. Doğrulama ve Kalite Kriterleri

1. **Sıfır İngilizce Kuralı:** Kullanıcı arayüzünde (öğrenci veya eğitmen) hiçbir ekranda kontrolsüz veya çevrilmemiş İngilizce kelime kalmayacak.
2. **Pedagojik Türkçe Dil Standardı:** Kullanılan dil çeviri kokmayacak ("translated-sounding" olmayacak); Türk tıp ve eczacılık fakültelerinde kullanılan resmi ve akademik terminolojiye (klerens, eliminasyon hız sabiti, yarılanma ömrü, yükleme dozu, dağılım hacmi, aralıklı tekrar, geri çağırma pratiği) tam uyumlu olacak.
3. **Eski Marka Sıfırlaması:** Eski prototip ve gayriresmi referanslar tüm kod tabanında taranıp `CENNA.live` olarak teyit edilecek.
4. **Test ve Derleme Bütünlüğü:** Tüm değişiklikler sonrasında 290 testin tamamı firesiz geçecek, `npm run typecheck` ve `npm run build` sıfır hatayla tamamlanacak.
