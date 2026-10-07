import { z } from 'zod';

export const SocraticStateSchema = z.enum(['PREDICT', 'PROBE', 'PATCH', 'PROVE', 'DIRECT_TEACH']);
export type SocraticState = z.infer<typeof SocraticStateSchema>;

export const SocraticTurnSchema = z.object({
  clinical_observation_tr: z.string().max(200, "Max 1 sentence (≤40 words)"),
  conceptual_pivot_tr: z.string().max(200, "Max 1 sentence (≤40 words)"),
  actionable_question_tr: z.string().max(160, "Exactly 1 question (≤30 words)"),
  current_state: SocraticStateSchema,
  misconception_tag: z.string().nullable(),
  reveals_answer: z.literal(false),
});

export type SocraticTurn = z.infer<typeof SocraticTurnSchema>;

export interface SocraticRequest {
  conceptName: string;
  misconceptionTag: string;
  studentInput: string;
  turnCount: number;
}

export function generateDeterministicFallbackTurn(req: SocraticRequest): SocraticTurn {
  const { misconceptionTag, turnCount } = req;

  // Turn budget exhausted -> DIRECT_TEACH
  if (turnCount >= 4) {
    return {
      clinical_observation_tr: "Hesaplama adımlarını dikkatle takip ettiniz.",
      conceptual_pivot_tr: "Ders kurallarımıza göre obez hastalarda hidrofilik ilaç dağılımını yansıtmak için düzeltilmiş vücut ağırlığı esastır.",
      actionable_question_tr: "Bu basamağı pekiştirmek için akşam seansındaki transfer sorusunu çözmeye hazır mısınız?",
      current_state: "DIRECT_TEACH",
      misconception_tag: misconceptionTag,
      reveals_answer: false,
    };
  }

  // State escalation: Turn 1-2 = PROBE, Turn 3 = PATCH
  const currentState: SocraticState = turnCount >= 3 ? 'PATCH' : 'PROBE';

  switch (misconceptionTag) {
    case 'MISSED_FEMALE_FACTOR_0_85':
      return {
        clinical_observation_tr: "Kreatinin üretim hızının kas kitlesiyle doğrudan ilişkili olduğunu hatırlayınız.",
        conceptual_pivot_tr: "Kadın ve erkeklerde ortalama kas kitlesi ve kreatinin sentez hızı biyolojik olarak farklıdır.",
        actionable_question_tr: "Kadın hastalarda Cockcroft-Gault formülü sonucuna hangi ampirik çarpan uygulanmalıdır?",
        current_state: currentState,
        misconception_tag: 'MISSED_FEMALE_FACTOR_0_85',
        reveals_answer: false,
      };

    case 'USED_TBW_INSTEAD_OF_ADJ_OR_IBW':
      return {
        clinical_observation_tr: "Hastanın vücut kitle indeksini ve toplam ağırlığını değerlendirdiniz.",
        conceptual_pivot_tr: "Yağ dokusunun kanlanması ve kreatinin klerensine katkısı kas dokusundan düşüktür.",
        actionable_question_tr: "Hasta ağırlığı İVA'nın %120'sini aştığında hangi ağırlık parametresi tercih edilir?",
        current_state: currentState,
        misconception_tag: 'USED_TBW_INSTEAD_OF_ADJ_OR_IBW',
        reveals_answer: false,
      };

    case 'USED_IBW_WITHOUT_OBESITY_ADJUSTMENT':
      return {
        clinical_observation_tr: "İdeal vücut ağırlığını doğru tespit ettiniz.",
        conceptual_pivot_tr: "Fakat aşırı kilolu hastalarda sadece İVA kullanmak klerensi olduğundan düşük tahmin ettirebilir.",
        actionable_question_tr: "Toplam ağırlık ile İVA farkının yüzde kırkını eklediğimiz formül hangisidir?",
        current_state: currentState,
        misconception_tag: 'USED_IBW_WITHOUT_OBESITY_ADJUSTMENT',
        reveals_answer: false,
      };

    case 'CONFUSED_KE_WITH_HALF_LIFE':
      return {
        clinical_observation_tr: "Eliminasyon hız sabiti ile yarı ömür birbirine bağlı parametrelerdir.",
        conceptual_pivot_tr: "Biri birim zamanda atılan fraksiyonu, diğeri konsantrasyonun yarıya inme süresini gösterir.",
        actionable_question_tr: "0.693 sabiti ile ke arasındaki matematiksel ilişki nedir?",
        current_state: currentState,
        misconception_tag: 'CONFUSED_KE_WITH_HALF_LIFE',
        reveals_answer: false,
      };

    default:
      return {
        clinical_observation_tr: "Hesaplama adımlarınızda bir sapma tespit edildi.",
        conceptual_pivot_tr: "Farmakokinetik formüllerde birimler ve ara basamaklar nihai dozu belirler.",
        actionable_question_tr: "Formüldeki değişkenleri ve birim dönüşümlerini tekrar gözden geçirebilir misiniz?",
        current_state: currentState,
        misconception_tag: misconceptionTag || null,
        reveals_answer: false,
      };
  }
}
