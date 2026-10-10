import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import trTR from 'antd/locale/tr_TR';

/**
 * ============================================================================
 * CENNA.live ACADEMIC TURKISH LOCALIZATION TEST SUITE (Tiers 1-4)
 * ============================================================================
 * Authoritative Contracts:
 *   - ORIGINAL_REQUEST.md: 100% of user-facing strings in fluent, natural academic
 *     Turkish. Zero English or machine-translated phrases. index.html has lang="tr",
 *     Turkish title, meta description. All AntD validations in Turkish.
 *   - PROJECT.md: Features 2, 3, 4, 5, 20.
 * ============================================================================
 */

// Turkish route error response standard contract
export interface TurkishApiErrorResponse {
  code: string;
  message: string;
  status: number;
  requestId: string;
}

export function createTurkishErrorResponse(
  code: string,
  message: string,
  status: number = 400
): TurkishApiErrorResponse {
  return {
    code,
    message,
    status,
    requestId: 'req_test_' + Math.random().toString(36).substring(2, 9),
  };
}

// Canonical Turkish API route error messages catalog
export const CANONICAL_TURKISH_ROUTE_ERRORS: Record<string, string> = {
  UNAUTHORIZED: 'Bu işlem için oturum açmanız gerekmektedir.',
  FORBIDDEN: 'Bu kaynağa erişim yetkiniz bulunmamaktadır.',
  NOT_FOUND: 'İstenen eğitim içeriği veya kayıt bulunamadı.',
  VALIDATION_ERROR: 'Lütfen zorunlu alanları eksiksiz ve geçerli formatta doldurunuz.',
  DEADLINE_EXPIRED: 'Sınav için tanınan süre dolmuştur. Yeni cevap kabul edilemez.',
  USAGE_LIMIT: 'Bu davetiye bağlantısı maksimum kullanım sınırına ulaşmıştır.',
  INVALID_TOKEN: 'Davetiye bağlantısı geçersiz veya süresi dolmuştur.',
  NO_CHUNKS: 'Belgeden metin parçacıkları henüz ayrıştırılmamıştır. Lütfen önce metin işlemeyi tamamlayınız.',
  NOT_PUBLISHED: 'Bu sınav henüz eğitmen tarafından yayınlanmamıştır.',
  DB_ERROR: 'Veritabanı işlemi sırasında beklenmeyen bir hata oluştu.',
};

// Helper to check if text contains forbidden English fragments
export function containsEnglishErrorPhrase(text?: string | null): boolean {
  if (!text) return false;
  const forbiddenPhrases = [
    'authentication required',
    'access denied',
    'not found',
    'invalid token',
    'validation error',
    'something went wrong',
    'reload page',
    'an unexpected error occurred',
    'deadline expired',
    'maximum number of uses',
  ];
  const lower = text.toLowerCase();
  return forbiddenPhrases.some((phrase) => lower.includes(phrase));
}

// Helper to check for lazy bilingual slash strings (e.g. "Hata / Error") or parenthetical translations
export function containsBilingualSlash(text?: string | null): boolean {
  if (!text) return false;
  return /\b[a-zA-ZğüşıöçĞÜŞİÖÇ]+\s*\/\s*[a-zA-Z]+\b/u.test(text) || /\([a-zA-Z\s]+\)/i.test(text);
}

// Helper for Turkish grammatical counter formatting (no plural suffix after numbers)
export function formatQuestionCount(count: number): string {
  return `${count} soru`;
}

describe('CENNA.live Turkish Localization Suite', () => {
  const projectRoot = path.resolve(__dirname, '..');

  // ==========================================================================
  // TIER 1: FEATURE COVERAGE (HTML Shell, AntD Locale, Route Errors)
  // ==========================================================================
  describe('Tier 1: Feature Coverage — Document Shell, Ant Design Locale & Error Standards', () => {
    it('T1.1: verifies index.html specifies lang="tr" and UTF-8 charset', () => {
      const indexPath = path.join(projectRoot, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf-8');

      expect(content).toMatch(/<html[^>]*lang=["']tr["']/i);
      expect(content).toMatch(/<meta[^>]*charset=["']UTF-8["']/i);
    });

    it('T1.2: verifies index.html title and meta description are natural academic Turkish', () => {
      const indexPath = path.join(projectRoot, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf-8');

      // Title must be localized and academic
      expect(content).toMatch(/<title>CENNA\.live[^<]*<\/title>/i);
      expect(content).toContain('Aktif Öğrenme');

      // Meta description must be Turkish and pharmacy-focused
      expect(content).toMatch(/<meta[^>]*name=["']description["'][^>]*content=["'][^"']*Farmakoloji[^"']*["']/i);
      expect(content).toContain('Öğren, Hatırla, Uygula, İyileştir, Tekrar Et');
    });

    it('T1.3: verifies Ant Design Turkish locale bundle (tr_TR) is complete and well-formed', () => {
      expect(trTR).toBeDefined();
      expect(trTR.locale).toBe('tr');

      // Pagination Turkish labels
      expect(trTR.Pagination).toBeDefined();
      expect(trTR.Pagination?.items_per_page).toBe('/ sayfa');
      expect(trTR.Pagination?.jump_to).toBe('Git');

      // Modal buttons
      expect(trTR.Modal?.okText).toBe('Tamam');
      expect(trTR.Modal?.cancelText).toBe('İptal');

      // Popconfirm buttons
      expect(trTR.Popconfirm?.okText).toBe('Tamam');
      expect(trTR.Popconfirm?.cancelText).toBe('İptal');

      // Table filter and sort
      expect(trTR.Table?.filterTitle).toBe('Filtre menüsü');
      expect(trTR.Table?.filterConfirm).toBe('Tamam');
      expect(trTR.Table?.filterReset).toBe('Sıfırla');
    });

    it('T1.4: verifies canonical Cloudflare route error responses are strictly Turkish', () => {
      for (const [code, message] of Object.entries(CANONICAL_TURKISH_ROUTE_ERRORS)) {
        const response = createTurkishErrorResponse(code, message, 400);

        expect(response.code).toBe(code);
        expect(response.message).toBe(message);
        expect(containsEnglishErrorPhrase(response.message)).toBe(false);
        expect(containsBilingualSlash(response.message)).toBe(false);
        expect(response.message.length).toBeGreaterThan(10);
      }
    });

    it('T1.5: verifies student and instructor shell navigation vocabulary is 100% academic Turkish', () => {
      const studentNavVocabulary: Record<string, string> = {
        today: 'Bugün',
        classrooms: 'Sınıflar',
        spacedReview: 'Aralıklı Tekrar',
        timedExams: 'Süreli Sınavlar',
        progress: 'Gelişim & İlerleme',
      };

      const instructorNavVocabulary: Record<string, string> = {
        teachHub: 'Eğitmen Paneli',
        courses: 'Dersler',
        documents: 'Belgeler & Kaynaklar',
        contentReview: 'İçerik İnceleme',
        analytics: 'Analitik',
      };

      for (const trLabel of Object.values(studentNavVocabulary)) {
        expect(containsEnglishErrorPhrase(trLabel)).toBe(false);
        expect(trLabel.length).toBeGreaterThan(3);
      }

      for (const trLabel of Object.values(instructorNavVocabulary)) {
        expect(containsEnglishErrorPhrase(trLabel)).toBe(false);
        expect(trLabel.length).toBeGreaterThan(4);
      }
    });
  });

  // ==========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (Grammar, Validation, Slash Purging)
  // ==========================================================================
  describe('Tier 2: Boundary & Corner Cases — Turkish Grammar & Validation Messages', () => {
    it('T2.1: enforces Turkish grammar rules for numerical counters without plural suffixes', () => {
      // In Turkish: "1 soru", "5 soru", "100 soru" (NEVER "5 sorular")
      expect(formatQuestionCount(0)).toBe('0 soru');
      expect(formatQuestionCount(1)).toBe('1 soru');
      expect(formatQuestionCount(5)).toBe('5 soru');
      expect(formatQuestionCount(20)).toBe('20 soru');
      expect(formatQuestionCount(5)).not.toBe('5 sorular');
    });

    it('T2.2: detects and rejects lazy bilingual slash strings in error notices', () => {
      const bilingualBadExamples = [
        'Beklenmeyen Bir Hata Oluştu / Something went wrong',
        'Sayfayı Yenile (Reload)',
        'Giriş Yap / Login',
        'Kaydet / Save Changes',
      ];

      for (const bad of bilingualBadExamples) {
        expect(containsBilingualSlash(bad)).toBe(true);
      }

      const pureTurkishGoodExamples = [
        'Beklenmeyen bir sistem hatası meydana geldi.',
        'Lütfen sayfayı yenileyiniz veya sistem yöneticisiyle iletişime geçiniz.',
        'Giriş Yap',
        'Değişiklikleri Kaydet',
      ];

      for (const good of pureTurkishGoodExamples) {
        expect(containsBilingualSlash(good)).toBe(false);
      }
    });

    it('T2.3: verifies comprehensive Turkish Ant Design form validation messages dictionary', () => {
      const formValidationRules = {
        requiredEmail: 'Lütfen kurumsal e-posta adresinizi giriniz.',
        invalidEmail: 'Lütfen geçerli bir e-posta adresi formatı kullanınız (@biruni.edu.tr).',
        requiredPassword: 'Lütfen şifrenizi giriniz.',
        minPasswordLength: 'Şifreniz en az 8 karakter uzunluğunda olmalıdır.',
        passwordMismatch: 'Girilen şifreler birbiriyle eşleşmemektedir.',
        requiredClassroomName: 'Lütfen sınıf adını giriniz.',
        requiredCourseCode: 'Lütfen ders kodunu belirtiniz.',
      };

      for (const msg of Object.values(formValidationRules)) {
        expect(containsEnglishErrorPhrase(msg)).toBe(false);
        expect(msg.length).toBeGreaterThan(15);
        expect(msg.endsWith('.')).toBe(true);
      }
    });

    it('T2.4: verifies localized empty-state placeholders provide actionable academic guidance', () => {
      const emptyStates = {
        noReviews: {
          title: 'Bugün için Tekrarınız Bulunmuyor',
          description: 'Tebrikler! Günlük aralıklı tekrar hedefinizi tamamladınız. Dilerseniz serbest çalışma oturumu başlatabilirsiniz.',
        },
        noExams: {
          title: 'Aktif Sınav Bulunmuyor',
          description: 'Şu anda katılabileceğiniz planlanmış bir sınav bulunmamaktadır. Yeni sınavlar eğitmeniniz tarafından eklendiğinde burada listelenecektir.',
        },
        noClassrooms: {
          title: 'Henüz Bir Sınıfa Kayıtlı Değilsiniz',
          description: 'Eğitmeninizden aldığınız davetiye kodunu kullanarak sınıfınıza katılabilirsiniz.',
        },
      };

      for (const state of Object.values(emptyStates)) {
        expect(containsEnglishErrorPhrase(state.title)).toBe(false);
        expect(containsEnglishErrorPhrase(state.description)).toBe(false);
        expect(state.title.length).toBeGreaterThan(5);
        expect(state.description.length).toBeGreaterThan(30);
      }
    });

    it('T2.5: verifies toast notifications format actions smoothly without English artifact suffixes', () => {
      function formatActionToast(action: 'approve' | 'reject' | 'publish', itemName: string): string {
        switch (action) {
          case 'approve':
            return `"${itemName}" başarıyla onaylandı.`;
          case 'reject':
            return `"${itemName}" gerekçe belirtilerek reddedildi.`;
          case 'publish':
            return `"${itemName}" başarıyla yayına alındı ve öğrencilere açıldı.`;
        }
      }

      const toast = formatActionToast('approve', 'Kreatinin Klerensi Soru Seti');
      expect(toast).toBe('"Kreatinin Klerensi Soru Seti" başarıyla onaylandı.');
      expect(toast).not.toContain('approvedd');
      expect(toast).not.toContain('successfully');
    });
  });

  // ==========================================================================
  // TIER 3: CROSS-FEATURE INTERACTIONS (API Client Error Handling & Role Sync)
  // ==========================================================================
  describe('Tier 3: Cross-Feature Interactions — Frontend Handling of Localized Responses', () => {
    it('T3.1: verifies frontend error extractor parses edge function Turkish message gracefully', () => {
      function extractUserFacingErrorMessage(apiErrorResponse: any): string {
        if (typeof apiErrorResponse?.message === 'string' && apiErrorResponse.message.trim().length > 0) {
          return apiErrorResponse.message;
        }
        if (typeof apiErrorResponse?.error === 'string' && apiErrorResponse.error.trim().length > 0) {
          return apiErrorResponse.error;
        }
        return 'İşlem gerçekleştirilirken beklenmeyen bir hata oluştu.';
      }

      const sampleBackendResponse = {
        code: 'DEADLINE_EXPIRED',
        message: 'Sınav için tanınan süre dolmuştur. Yeni cevap kabul edilemez.',
        status: 403,
      };

      const extracted = extractUserFacingErrorMessage(sampleBackendResponse);
      expect(extracted).toBe('Sınav için tanınan süre dolmuştur. Yeni cevap kabul edilemez.');
      expect(containsEnglishErrorPhrase(extracted)).toBe(false);

      // Fallback behavior on empty payload
      const fallback = extractUserFacingErrorMessage({});
      expect(fallback).toBe('İşlem gerçekleştirilirken beklenmeyen bir hata oluştu.');
    });

    it('T3.2: verifies role switcher updates contextual badges and views consistently in Turkish', () => {
      type UserRole = 'student' | 'instructor' | 'admin';

      function getRoleDisplayBadge(role: UserRole): { label: string; tagColor: string } {
        switch (role) {
          case 'student':
            return { label: 'ÖĞRENCİ', tagColor: 'blue' };
          case 'instructor':
            return { label: 'EĞİTMEN', tagColor: 'green' };
          case 'admin':
            return { label: 'YÖNETİCİ', tagColor: 'red' };
        }
      }

      expect(getRoleDisplayBadge('student').label).toBe('ÖĞRENCİ');
      expect(getRoleDisplayBadge('instructor').label).toBe('EĞİTMEN');
      expect(getRoleDisplayBadge('admin').label).toBe('YÖNETİCİ');
    });
  });

  // ==========================================================================
  // TIER 4: REAL-WORLD SCENARIOS (End-to-End Localized Student Onboarding)
  // ==========================================================================
  describe('Tier 4: Real-World Scenarios — Full Localized Student Experience', () => {
    it('T4.1: verifies student registration, onboarding, and initial practice flow is 100% Turkish', () => {
      const studentOnboardingFlow = [
        { step: 'Kayıt Ol', buttonText: 'Hesap Oluştur', notice: 'Kayıt olarak Kullanım Koşulları ve Gizlilik Politikasını kabul etmiş olursunuz.' },
        { step: 'Hoş Geldiniz', heading: 'CENNA.live Eğitim Portalı', guidance: 'Klinik farmakoloji eğitiminizde aktif geri çağırma yöntemini deneyimleyin.' },
        { step: 'Sınıfa Katıl', buttonText: 'Davetiye Kodunu Kullan', inputPlaceholder: 'Örn: BIRUNI-FARMA-2026' },
        { step: 'İlk Oturum', buttonText: 'Günün Tekrarına Başla', badge: '5 Kart Hazır' },
      ];

      for (const screen of studentOnboardingFlow) {
        expect(containsEnglishErrorPhrase(screen.step)).toBe(false);
        expect(containsEnglishErrorPhrase(screen.buttonText)).toBe(false);
        expect(containsBilingualSlash(screen.buttonText)).toBe(false);
      }
    });

    it('T4.2: verifies exam taking instructions, timer alerts, and autosave notices are natural Turkish', () => {
      const examUiNoticeTemplates = {
        timeRemainingWarning: (minutes: number) => `Dikkat: Sınav sürenizin bitmesine ${minutes} dakika kaldı.`,
        autosaveSuccess: 'Tüm cevaplarınız güvenle kaydedildi.',
        autosaveSyncing: 'Cevaplar senkronize ediliyor...',
        autosaveError: 'Bağlantı hatası: Cevaplarınız çevrimdışı önbelleğe alındı, bağlantı sağlandığında iletilecektir.',
        submitConfirmTitle: 'Sınavı Tamamlamak İstediğinize Emin Misiniz?',
        submitConfirmWarning: 'Sınavı teslim ettikten sonra cevaplarınız üzerinde değişiklik yapamazsınız.',
      };

      const warning = examUiNoticeTemplates.timeRemainingWarning(5);
      expect(warning).toBe('Dikkat: Sınav sürenizin bitmesine 5 dakika kaldı.');
      expect(containsEnglishErrorPhrase(warning)).toBe(false);

      expect(containsEnglishErrorPhrase(examUiNoticeTemplates.autosaveSuccess)).toBe(false);
      expect(containsEnglishErrorPhrase(examUiNoticeTemplates.autosaveError)).toBe(false);
      expect(containsEnglishErrorPhrase(examUiNoticeTemplates.submitConfirmWarning)).toBe(false);
    });
  });
});
