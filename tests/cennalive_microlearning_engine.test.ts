import { describe, it, expect } from 'vitest';
import {
  MEDICINAL_CHEMISTRY_TIER_1,
  getAllTier1Lessons,
  getLessonById,
  getModuleByLessonId,
  getNextLesson,
} from '../src/data/courses/medicinalChemistryTier1';

describe('CENNA.live Brilliant-Tarzı Medisinal Kimya Mikro-Öğrenme Motoru', () => {
  describe('Kademe 1 Müfredat ve Modül Bütünlüğü (6 Modül, 21 Mikro-Ders)', () => {
    it('tam olarak 6 modül içermelidir', () => {
      expect(MEDICINAL_CHEMISTRY_TIER_1).toHaveLength(6);
      const moduleIds = MEDICINAL_CHEMISTRY_TIER_1.map((m) => m.id);
      expect(moduleIds).toEqual(['mod-1', 'mod-2', 'mod-3', 'mod-4', 'mod-5', 'mod-6']);
    });

    it('toplamda tam olarak 21 mikro-ders içermelidir', () => {
      const allLessons = getAllTier1Lessons();
      expect(allLessons).toHaveLength(21);
      // Check sequential lesson numbers 1 to 21
      allLessons.forEach((lesson, index) => {
        expect(lesson.lessonNumber).toBe(index + 1);
        expect(lesson.id).toBe(`les-${index + 1}`);
      });
    });

    it('her modül doğru sayıda mikro-ders barındırmalıdır', () => {
      const [mod1, mod2, mod3, mod4, mod5, mod6] = MEDICINAL_CHEMISTRY_TIER_1;
      expect(mod1.lessons).toHaveLength(4); // Fonksiyonel Gruplar (1-4)
      expect(mod2.lessons).toHaveLength(3); // İlaç-Reseptör Bağları (5-7)
      expect(mod3.lessons).toHaveLength(3); // Stereokimya & İzomeri (8-10)
      expect(mod4.lessons).toHaveLength(3); // Biyoizosterizm (11-13)
      expect(mod5.lessons).toHaveLength(4); // SAR & Çözünürlük (14-17)
      expect(mod6.lessons).toHaveLength(4); // Metabolizma (18-21)
    });

    it('her adım 3-aşamalı Sokratik ipucu zincirine sahip olmalıdır', () => {
      const allLessons = getAllTier1Lessons();
      allLessons.forEach((lesson) => {
        expect(lesson.steps.length).toBeGreaterThan(0);
        lesson.steps.forEach((step) => {
          expect(step.socraticHintChain).toBeDefined();
          expect(step.socraticHintChain).toHaveLength(3);
          expect(step.socraticHintChain[0].length).toBeGreaterThan(5);
          expect(step.socraticHintChain[1].length).toBeGreaterThan(5);
          expect(step.socraticHintChain[2].length).toBeGreaterThan(5);
        });
      });
    });

    it('tüm dersler pozitif xpReward ve tahmini süreye sahip olmalıdır', () => {
      const allLessons = getAllTier1Lessons();
      allLessons.forEach((lesson) => {
        expect(lesson.durationMinutes).toBeGreaterThanOrEqual(3);
        expect(lesson.durationMinutes).toBeLessThanOrEqual(10);
        expect(lesson.xpReward).toBeGreaterThanOrEqual(25);
        expect(lesson.xpReward).toBeLessThanOrEqual(50);
      });
    });
  });

  describe('Ders ve Modül Sorgu Yardımcı Fonksiyonları', () => {
    it('getLessonById geçerli dersleri getirmeli, geçersizler için undefined dönmelidir', () => {
      const lesson1 = getLessonById('les-1');
      expect(lesson1).toBeDefined();
      expect(lesson1?.title).toContain('Oksijenli');

      const lesson21 = getLessonById('les-21');
      expect(lesson21).toBeDefined();
      expect(lesson21?.title).toContain('Ön İlaç');

      expect(getLessonById('les-999')).toBeUndefined();
    });

    it('getModuleByLessonId ilgili ana modülü bulmalıdır', () => {
      const modOfLes1 = getModuleByLessonId('les-1');
      expect(modOfLes1?.id).toBe('mod-1');

      const modOfLes12 = getModuleByLessonId('les-12');
      expect(modOfLes12?.id).toBe('mod-4');
      expect(modOfLes12?.title).toContain('Biyoizosterizm');

      expect(getModuleByLessonId('invalid-id')).toBeUndefined();
    });

    it('getNextLesson sıralı bir sonraki dersi getirmeli, son derste undefined dönmelidir', () => {
      const nextAfter1 = getNextLesson('les-1');
      expect(nextAfter1?.id).toBe('les-2');

      const nextAfter20 = getNextLesson('les-20');
      expect(nextAfter20?.id).toBe('les-21');

      const nextAfter21 = getNextLesson('les-21');
      expect(nextAfter21).toBeUndefined();
    });
  });

  describe('Pedagojik ve Kimyasal Hesaplama Modelleri', () => {
    it('Henderson-Hasselbalch: Zayıf asit (Aspirin pKa 3.5) midede ağırlıklı nötr, kanda iyonize olmalıdır', () => {
      // Helper function matching PhIonizationGauge calculation
      const calculateWeakAcidIonization = (ph: number, pKa: number) => {
        const delta = ph - pKa;
        const ratio = Math.pow(10, delta);
        const ionized = (ratio / (1 + ratio)) * 100;
        return {
          ionizedPercent: parseFloat(ionized.toFixed(1)),
          neutralPercent: parseFloat((100 - ionized).toFixed(1)),
        };
      };

      // Mide (pH 1.5)
      const stomach = calculateWeakAcidIonization(1.5, 3.5);
      expect(stomach.ionizedPercent).toBeLessThan(2.0); // ~1%
      expect(stomach.neutralPercent).toBeGreaterThan(98.0); // ~99% nötr emilebilir!

      // Kan / Plazma (pH 7.4)
      const plasma = calculateWeakAcidIonization(7.4, 3.5);
      expect(plasma.ionizedPercent).toBeGreaterThan(99.0); // %99.9 iyonize
      expect(plasma.neutralPercent).toBeLessThan(1.0);
    });

    it('Henderson-Hasselbalch: Zayıf baz (Morfin pKa 8.4) midede iyonize, bazik ortamda nötrleşmelidir', () => {
      const calculateWeakBaseIonization = (ph: number, pKa: number) => {
        const delta = ph - pKa;
        const ratio = Math.pow(10, delta);
        const neutral = (ratio / (1 + ratio)) * 100;
        const ionized = 100 - neutral;
        return {
          ionizedPercent: parseFloat(ionized.toFixed(1)),
          neutralPercent: parseFloat((100 - ionized).toFixed(1)),
        };
      };

      // Mide (pH 1.5)
      const stomach = calculateWeakBaseIonization(1.5, 8.4);
      expect(stomach.ionizedPercent).toBeGreaterThan(99.9);

      // İnce bağırsak / bazik (pH 8.4) -> Tam yarı yarıya
      const equalPh = calculateWeakBaseIonization(8.4, 8.4);
      expect(equalPh.ionizedPercent).toBe(50.0);
      expect(equalPh.neutralPercent).toBe(50.0);
    });

    it('SAR sübstitüsyon hesaplaması: -Cl ve -CF3 LogP artışı yapmalıdır', () => {
      const baseLogP = 1.2;
      const clDelta = 0.71;
      const cf3Delta = 1.16;
      const ohDelta = -0.67;

      expect(parseFloat((baseLogP + clDelta).toFixed(2))).toBe(1.91);
      expect(parseFloat((baseLogP + cf3Delta).toFixed(2))).toBe(2.36);
      expect(parseFloat((baseLogP + ohDelta).toFixed(2))).toBe(0.53);
    });
  });

  describe('Ders Yıldız ve Oyunlaştırma (Gamification) Kuralları', () => {
    it('hata sayısına göre yıldız derecelendirmesi doğru çalışmalıdır', () => {
      const calculateStars = (mistakes: number) => {
        return mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      };

      expect(calculateStars(0)).toBe(3); // Kusursuz tamamlama
      expect(calculateStars(1)).toBe(2);
      expect(calculateStars(2)).toBe(2);
      expect(calculateStars(3)).toBe(1);
      expect(calculateStars(5)).toBe(1);
    });

    it('günlük seri (streak) mantığı ardışık günlerde artmalı, atlanan günde 1 olmalıdır', () => {
      const evaluateNextStreak = (currentStreak: number, lastActive: string, today: string) => {
        if (lastActive === today) return currentStreak;
        const yesterday = new Date(new Date(today).getTime() - 86400000).toISOString().split('T')[0];
        if (lastActive === yesterday) {
          return currentStreak + 1;
        }
        return 1;
      };

      const today = '2026-10-12';
      const yesterday = '2026-10-11';
      const twoDaysAgo = '2026-10-10';

      // Aynı gün tekrar ders tamamlama
      expect(evaluateNextStreak(5, today, today)).toBe(5);

      // Ertesi gün derse devam etme
      expect(evaluateNextStreak(5, yesterday, today)).toBe(6);

      // 2 gün ara verip geri dönme
      expect(evaluateNextStreak(5, twoDaysAgo, today)).toBe(1);
    });
  });
});
