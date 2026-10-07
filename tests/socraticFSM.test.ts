import { describe, it, expect } from 'vitest';
import { 
  SocraticTurnSchema, 
  generateDeterministicFallbackTurn, 
  SocraticRequest 
} from '../src/worker/socraticFSM';

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
});
