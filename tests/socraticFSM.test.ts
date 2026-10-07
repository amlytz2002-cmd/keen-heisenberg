import { describe, it, expect } from 'vitest';
import { 
  SocraticTurnSchema, 
  generateDeterministicFallbackTurn, 
  SocraticRequest,
  CLINICAL_CONSULTATION_REGEX,
  CLINICAL_REFUSAL_TURN,
} from '../src/worker/socraticFSM';
import workerHandler from '../src/worker/index';
import { OPENROUTER_MODEL_CASCADE, requestTutorTurn } from '../src/lib/tutorClient';
import { recordAttemptAndTelemetry, AttemptPayload } from '../src/lib/telemetry';

describe('Socratic FSM and Guardrail Verification', () => {
  it('validates schema compliance and denies answers in Socratic turns', () => {
    const validTurn = {
      clinical_observation_tr: "Kreatinin üretim hızının kas kitlesiyle doğrudan ilişkili olduğunu hatırlayınız.",
      conceptual_pivot_tr: "Kadın ve erkeklerde ortalama kas kitlesi biyolojik olarak farklıdır.",
      actionable_question_tr: "Kadın hastalarda Cockcroft-Gault sonucuna hangi ampirik çarpan uygulanmalıdır?",
      current_state: "PROBE" as const,
      misconception_tag: "MISSED_FEMALE_FACTOR_0_85",
      reveals_answer: false as const,
    };

    const parsed = SocraticTurnSchema.safeParse(validTurn);
    expect(parsed.success).toBe(true);
  });

  it('rejects turn if reveals_answer is true (guardrail enforcement)', () => {
    const invalidTurn = {
      clinical_observation_tr: "Cevabınız yanlış.",
      conceptual_pivot_tr: "Sonuç 41.93 olmalıydı.",
      actionable_question_tr: "Anladınız mı?",
      current_state: "PROBE" as const,
      misconception_tag: "MISSED_FEMALE_FACTOR_0_85",
      reveals_answer: true, // Forbidden!
    };

    const parsed = SocraticTurnSchema.safeParse(invalidTurn);
    expect(parsed.success).toBe(false);
  });

  it('escalates to DIRECT_TEACH when turnCount reaches budget (4 turns)', () => {
    const req: SocraticRequest = {
      conceptName: 'Cockcroft-Gault CrCl',
      misconceptionTag: 'MISSED_FEMALE_FACTOR_0_85',
      studentInput: 'Hala anlayamadım, sonuç ne olmalı?',
      turnCount: 4,
    };

    const turn = generateDeterministicFallbackTurn(req);
    expect(turn.current_state).toBe('DIRECT_TEACH');
    expect(turn.reveals_answer).toBe(false);
    expect(SocraticTurnSchema.safeParse(turn).success).toBe(true);
  });

  it('provides specific misconception hints for weight selection errors', () => {
    const req: SocraticRequest = {
      conceptName: 'Ağırlık Seçimi',
      misconceptionTag: 'USED_TBW_INSTEAD_OF_ADJ_OR_IBW',
      studentInput: 'Toplam vücut ağırlığı 85 kg aldım.',
      turnCount: 1,
    };

    const turn = generateDeterministicFallbackTurn(req);
    expect(turn.current_state).toBe('PROBE');
    expect(turn.misconception_tag).toBe('USED_TBW_INSTEAD_OF_ADJ_OR_IBW');
    expect(turn.actionable_question_tr).toContain('İVA');
    expect(SocraticTurnSchema.safeParse(turn).success).toBe(true);
  });

  describe('Comprehensive Coverage of All 9 Seed Misconception Tags', () => {
    const allNineSeedTags = [
      'MISSED_FEMALE_FACTOR_0_85',
      'USED_TBW_INSTEAD_OF_ADJ_OR_IBW',
      'USED_IBW_WITHOUT_OBESITY_ADJUSTMENT',
      'CONFUSED_KE_WITH_HALF_LIFE',
      'DELTA_T_DIVIDED_BY_RATIO_ERROR',
      'DIVIDED_BY_LN2_INSTEAD_OF_MULTIPLIED',
      'ERRONEOUSLY_DIVIDED_BY_AMINOPHYLLINE_SALT_FACTOR',
      'INVERTED_VD_EQUATION',
      'MISAPPLIED_CLEARANCE_PRODUCT',
    ] as const;

    for (const tag of allNineSeedTags) {
      it(`generates bespoke, compliant clinical preceptor turn for ${tag}`, () => {
        const turn = generateDeterministicFallbackTurn({
          conceptName: 'Klinik Farmakokinetik Testi',
          misconceptionTag: tag,
          studentInput: 'Burada nasıl ilerlemeliyim?',
          turnCount: 1,
        });

        // 1. Zod schema strict compliance
        const validation = SocraticTurnSchema.safeParse(turn);
        expect(validation.success).toBe(true);

        // 2. Strict character constraints
        expect(turn.clinical_observation_tr.length).toBeLessThanOrEqual(200);
        expect(turn.conceptual_pivot_tr.length).toBeLessThanOrEqual(200);
        expect(turn.actionable_question_tr.length).toBeLessThanOrEqual(160);

        // 3. Absolute answer secrecy guardrail
        expect(turn.reveals_answer).toBe(false);
        expect(turn.misconception_tag).toBe(tag);
        expect(turn.current_state).toBe('PROBE');

        // 4. Must be bespoke (NOT default generic fallback)
        expect(turn.clinical_observation_tr).not.toBe('Hesaplama adımlarınızda bir sapma tespit edildi.');
        expect(turn.conceptual_pivot_tr).not.toBe('Farmakokinetik formüllerde birimler ve ara basamaklar nihai dozu belirler.');
        expect(turn.actionable_question_tr).not.toBe('Formüldeki değişkenleri ve birim dönüşümlerini tekrar gözden geçirebilir misiniz?');
      });
    }

    it('escalates state to PATCH on turn 3 for all 9 tags', () => {
      for (const tag of allNineSeedTags) {
        const turn = generateDeterministicFallbackTurn({
          conceptName: 'Klinik Farmakokinetik',
          misconceptionTag: tag,
          studentInput: 'Hala kafam karışık.',
          turnCount: 3,
        });
        expect(turn.current_state).toBe('PATCH');
        expect(turn.reveals_answer).toBe(false);
        expect(SocraticTurnSchema.safeParse(turn).success).toBe(true);
      }
    });
  });

  describe('OpenRouter Model Cascade Verification', () => {
    it('defines the 4 required free models in order of priority', () => {
      expect(OPENROUTER_MODEL_CASCADE).toEqual([
        'nvidia/nemotron-3-ultra:free',
        'nvidia/nemotron-3.5-lightning:free',
        'google/gemma-4-31b:free',
        'ling/ling-3.0-flash-sante:free',
      ]);
    });

    it('falls back seamlessly to deterministic preceptor if network or worker is unavailable', async () => {
      const turn = await requestTutorTurn({
        conceptName: 'Cockcroft-Gault CrCl',
        misconceptionTag: 'MISSED_FEMALE_FACTOR_0_85',
        studentInput: 'Neden 0.85 ile çarpmam gerekiyor?',
        turnCount: 1,
      });

      expect(turn).toBeDefined();
      expect(turn.misconception_tag).toBe('MISSED_FEMALE_FACTOR_0_85');
      expect(turn.reveals_answer).toBe(false);
      expect(SocraticTurnSchema.safeParse(turn).success).toBe(true);
    });
  });

  describe('Safety Consultation Regex & Intent Interception', () => {
    it('catches short live consultation queries without length threshold', () => {
      const consultationQueries = [
        'Hasta 70 kg kadın, ne vermeliyim?',
        'Bu hastaya hangi dozu vermeliyiz?',
        'hangi doz önerisi uygundur?',
        'Klinik doz önerisi nedir?',
        'Kaç mg vermeliyim?',
        'Kaç mg başlanmalı?',
        'kaç mg başlamalıyım?',
        'Kaç mg başlamalıyım?',
        'Reçete önerisi alabilir miyim?',
        'Hastaya ne başlanmalı?',
        'Tedavi önerisi rica ediyorum.',
      ];

      for (const query of consultationQueries) {
        expect(
          CLINICAL_CONSULTATION_REGEX.test(query),
          `Expected query "${query}" to trigger consultation regex`
        ).toBe(true);
      }
    });

    it('permits legitimate Turkish student explanations with clinical terminology', () => {
      const legitimateExplanations = [
        'Kadın hastalarda kas kütlesi erkeklere göre daha az olduğu için 0.85 katsayısı formüle eklenmelidir.',
        '64 yaşında kadın hasta için Cockcroft-Gault formülünde ideal vücut ağırlığı kullanılmalıdır.',
        'Erkek hastalarda katsayı 1.0 iken kadınlarda 0.85 alınır.',
        'Hasta obez olduğu için DVA hesapladım.',
        "Hasta ağırlığı İVA'nın %120'sini aştığında hangi formül kullanılır?",
        'Yaşında ve cinsiyetinde bir kısıtlama var mı?',
      ];

      for (const explanation of legitimateExplanations) {
        expect(
          CLINICAL_CONSULTATION_REGEX.test(explanation),
          `Expected explanation "${explanation}" NOT to trigger consultation regex`
        ).toBe(false);
      }
    });

    it('intercepts consultation queries in requestTutorTurn client API', async () => {
      const turn = await requestTutorTurn({
        conceptName: 'Klinik Karar',
        misconceptionTag: 'GENERAL_ERROR',
        studentInput: 'Hasta 70 kg kadın, ne vermeliyim?',
        turnCount: 1,
      });

      expect(turn).toEqual(CLINICAL_REFUSAL_TURN);
      expect(turn.reveals_answer).toBe(false);
      expect(turn.clinical_observation_tr).toContain('sentetik');
    });

    it('intercepts consultation queries in Worker Gateway (/api/tutor/turn)', async () => {
      const req = new Request('http://localhost/api/tutor/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptName: 'Klinik Karar',
          misconceptionTag: 'GENERAL_ERROR',
          studentInput: 'Hasta 70 kg kadın, ne vermeliyim?',
          turnCount: 1,
        }),
      });

      const res = await workerHandler.fetch(req, {});
      const turn = await res.json();
      expect(turn.clinical_observation_tr).toContain('sentetik');
      expect(turn.reveals_answer).toBe(false);
    });

    it('asserts "kaç mg başlamalıyım?" triggers CLINICAL_CONSULTATION_REGEX.test() === true and is intercepted', async () => {
      expect(CLINICAL_CONSULTATION_REGEX.test('kaç mg başlamalıyım?')).toBe(true);

      // Intercepted in client tutorClient
      const clientTurn = await requestTutorTurn({
        conceptName: 'Klinik Karar',
        misconceptionTag: 'GENERAL_ERROR',
        studentInput: 'kaç mg başlamalıyım?',
        turnCount: 1,
      });
      expect(clientTurn).toEqual(CLINICAL_REFUSAL_TURN);
      expect(clientTurn.reveals_answer).toBe(false);

      // Intercepted in Worker Gateway
      const req = new Request('http://localhost/api/tutor/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptName: 'Klinik Karar',
          misconceptionTag: 'GENERAL_ERROR',
          studentInput: 'kaç mg başlamalıyım?',
          turnCount: 1,
        }),
      });
      const res = await workerHandler.fetch(req, {});
      expect(res.status).toBe(200);
      const workerTurn = await res.json();
      expect(workerTurn).toEqual(CLINICAL_REFUSAL_TURN);
      expect(workerTurn.reveals_answer).toBe(false);
    });

    it('permits legitimate student explanations through Worker Gateway without refusal', async () => {
      const req = new Request('http://localhost/api/tutor/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptName: 'Cockcroft-Gault CrCl',
          misconceptionTag: 'MISSED_FEMALE_FACTOR_0_85',
          studentInput: 'Kadın hastalarda kas kütlesi erkeklere göre daha az olduğu için 0.85 katsayısı formüle eklenmelidir.',
          turnCount: 1,
        }),
      });

      const res = await workerHandler.fetch(req, {});
      const turn = await res.json();
      expect(turn.clinical_observation_tr).not.toContain('sentetik');
      expect(turn.misconception_tag).toBe('MISSED_FEMALE_FACTOR_0_85');
      expect(turn.reveals_answer).toBe(false);
    });
  });

  describe('Turn 4 Concept-Specific DIRECT_TEACH Escalation', () => {
    const gentamicinTags = [
      'CONFUSED_KE_WITH_HALF_LIFE',
      'DELTA_T_DIVIDED_BY_RATIO_ERROR',
      'DIVIDED_BY_LN2_INSTEAD_OF_MULTIPLIED',
    ] as const;

    const theophyllineTags = [
      'ERRONEOUSLY_DIVIDED_BY_AMINOPHYLLINE_SALT_FACTOR',
      'INVERTED_VD_EQUATION',
      'MISAPPLIED_CLEARANCE_PRODUCT',
    ] as const;

    const cockcroftGaultTags = [
      'MISSED_FEMALE_FACTOR_0_85',
      'USED_TBW_INSTEAD_OF_ADJ_OR_IBW',
      'USED_IBW_WITHOUT_OBESITY_ADJUSTMENT',
    ] as const;

    for (const tag of gentamicinTags) {
      it(`serves Gentamicin-specific DIRECT_TEACH copy for ${tag} at turn 4`, () => {
        const turn = generateDeterministicFallbackTurn({
          conceptName: 'Gentamisin Eliminasyon',
          misconceptionTag: tag,
          studentInput: 'Çözümü bulamadım.',
          turnCount: 4,
        });

        expect(turn.current_state).toBe('DIRECT_TEACH');
        expect(turn.reveals_answer).toBe(false);
        expect(turn.conceptual_pivot_tr).toContain('ke');
        expect(turn.conceptual_pivot_tr).toContain('t1/2');
        expect(turn.conceptual_pivot_tr).not.toContain('DVA');
        expect(turn.conceptual_pivot_tr).not.toContain('obez');

        // Character constraints
        expect(turn.clinical_observation_tr.length).toBeLessThanOrEqual(200);
        expect(turn.conceptual_pivot_tr.length).toBeLessThanOrEqual(200);
        expect(turn.actionable_question_tr.length).toBeLessThanOrEqual(160);
      });
    }

    for (const tag of theophyllineTags) {
      it(`serves Theophylline-specific DIRECT_TEACH copy for ${tag} at turn 4`, () => {
        const turn = generateDeterministicFallbackTurn({
          conceptName: 'Teofilin Yükleme Dozu',
          misconceptionTag: tag,
          studentInput: 'Çözümü bulamadım.',
          turnCount: 4,
        });

        expect(turn.current_state).toBe('DIRECT_TEACH');
        expect(turn.reveals_answer).toBe(false);
        expect(turn.conceptual_pivot_tr).toContain('S=0.8');
        expect(turn.conceptual_pivot_tr).toContain('S=1.0');
        expect(turn.conceptual_pivot_tr).not.toContain('DVA');
        expect(turn.conceptual_pivot_tr).not.toContain('obez');

        // Character constraints
        expect(turn.clinical_observation_tr.length).toBeLessThanOrEqual(200);
        expect(turn.conceptual_pivot_tr.length).toBeLessThanOrEqual(200);
        expect(turn.actionable_question_tr.length).toBeLessThanOrEqual(160);
      });
    }

    for (const tag of cockcroftGaultTags) {
      it(`serves Cockcroft-Gault-specific DIRECT_TEACH copy for ${tag} at turn 4`, () => {
        const turn = generateDeterministicFallbackTurn({
          conceptName: 'Cockcroft-Gault CrCl',
          misconceptionTag: tag,
          studentInput: 'Çözümü bulamadım.',
          turnCount: 4,
        });

        expect(turn.current_state).toBe('DIRECT_TEACH');
        expect(turn.reveals_answer).toBe(false);
        expect(turn.conceptual_pivot_tr).toContain('0.85');
        expect(turn.conceptual_pivot_tr).toContain('DVA');

        // Character constraints
        expect(turn.clinical_observation_tr.length).toBeLessThanOrEqual(200);
        expect(turn.conceptual_pivot_tr.length).toBeLessThanOrEqual(200);
        expect(turn.actionable_question_tr.length).toBeLessThanOrEqual(160);
      });
    }

    it('strictly guarantees deterministic DIRECT_TEACH return in requestTutorTurn at turn 4', async () => {
      const turn = await requestTutorTurn({
        conceptName: 'Gentamisin Eliminasyon',
        misconceptionTag: 'CONFUSED_KE_WITH_HALF_LIFE',
        studentInput: 'Bilemedim',
        turnCount: 4,
      });

      expect(turn.current_state).toBe('DIRECT_TEACH');
      expect(turn.reveals_answer).toBe(false);
      expect(turn.conceptual_pivot_tr).toContain('ke');
      expect(turn.conceptual_pivot_tr).toContain('t1/2');
    });

    it('strictly guarantees deterministic DIRECT_TEACH return in Worker Gateway at turn 4', async () => {
      const req = new Request('http://localhost/api/tutor/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptName: 'Teofilin Yükleme Dozu',
          misconceptionTag: 'ERRONEOUSLY_DIVIDED_BY_AMINOPHYLLINE_SALT_FACTOR',
          studentInput: 'Sonucu verin artık',
          turnCount: 4,
        }),
      });

      const res = await workerHandler.fetch(req, {});
      const turn = await res.json();
      expect(turn.current_state).toBe('DIRECT_TEACH');
      expect(turn.reveals_answer).toBe(false);
      expect(turn.conceptual_pivot_tr).toContain('S=0.8');
    });
  });

  describe('Telemetry Contract Verification (src/lib/telemetry.ts)', () => {
    it('records successful attempt and returns valid FSRS schedule and theta', async () => {
      const payload: AttemptPayload = {
        itemId: 'crcl-obese-female-ceftazidime',
        conceptId: 'cockcroft-gault-crcl',
        confidence: 4,
        isCorrect: true,
        timeSpentMs: 3500,
        scratchpadData: { ibw: 48.4, weightUsed: 63.04, finalCrCl: 41.93 },
      };

      const result = await recordAttemptAndTelemetry(payload);
      expect(result).toHaveProperty('attemptId');
      expect(typeof result.attemptId).toBe('string');
      expect(result.nextSchedule.isHypercorrection).toBe(false);
      expect(result.nextSchedule.stability).toBeGreaterThan(1.0);
      expect(result.updatedTheta).toBeGreaterThan(0.5);
    });

    it('detects hypercorrection when confidence >= 4 and isCorrect is false', async () => {
      const payload: AttemptPayload = {
        itemId: 'pk-ke-half-life-gentamicin',
        conceptId: 'gentamicin-elimination',
        confidence: 5, // High confidence error
        isCorrect: false,
        primaryMisconceptionTag: 'CONFUSED_KE_WITH_HALF_LIFE',
        firstFailingNodeId: 'half_life_node',
      };

      const result = await recordAttemptAndTelemetry(payload);
      expect(result.nextSchedule.isHypercorrection).toBe(true);
      expect(result.nextSchedule.stability).toBe(0.0);
      expect(result.nextSchedule.intervalDays).toBe(1);
      expect(result.updatedTheta).toBeLessThan(0.5); // Punished by hypercorrection penalty
    });

    it('supports optional currentTheta in AttemptPayload for mastery tracking', async () => {
      // 1. Correct attempt with custom initial theta 0.8
      const highPayload: AttemptPayload = {
        itemId: 'crcl-obese-female-ceftazidime',
        conceptId: 'cockcroft-gault-crcl',
        confidence: 5,
        isCorrect: true,
        currentTheta: 0.8,
      };
      const highResult = await recordAttemptAndTelemetry(highPayload);
      expect(highResult.updatedTheta).toBeGreaterThan(0.8);

      // 2. Incorrect attempt with custom initial theta 0.7
      const lowPayload: AttemptPayload = {
        itemId: 'pk-ke-half-life-gentamicin',
        conceptId: 'gentamicin-elimination',
        confidence: 3,
        isCorrect: false,
        currentTheta: 0.7,
      };
      const lowResult = await recordAttemptAndTelemetry(lowPayload);
      expect(lowResult.updatedTheta).toBeLessThan(0.7);

      // 3. Omitted currentTheta defaults to 0.5
      const defaultPayload: AttemptPayload = {
        itemId: 'theophylline-target-dl',
        conceptId: 'theophylline-loading-dose',
        confidence: 4,
        isCorrect: true,
      };
      const defaultResult = await recordAttemptAndTelemetry(defaultPayload);
      expect(defaultResult.updatedTheta).toBeGreaterThan(0.5);
    });
  });
});

