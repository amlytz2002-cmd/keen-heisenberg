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

export const CLINICAL_CONSULTATION_REGEX =
  /(ne vermeliyim|hangi doz(u)?|doz önerisi|kaç mg (ver\w*|başla\w*)|reçete önerisi|hastaya ne başlanmalı|tedavi önerisi)/i;

export const CLINICAL_REFUSAL_TURN: SocraticTurn = {
  clinical_observation_tr: "PharmIQ yalnızca sentetik eğitim vakaları ve ders tekrarı için tasarlanmıştır.",
  conceptual_pivot_tr: "Gerçek hasta verileri veya klinik tedavi kararları sistem kapsamı dışındadır.",
  actionable_question_tr: "Bu konuyu ders slaytlarındaki teorik örnek üzerinden tekrar inceleyelim mi?",
  current_state: "PROBE",
  misconception_tag: null,
  reveals_answer: false,
};

export function generateDeterministicFallbackTurn(req: SocraticRequest): SocraticTurn {
  const { misconceptionTag, turnCount } = req;

  // Turn budget exhausted -> DIRECT_TEACH with concept-specific remediation
  if (turnCount >= 4) {
    if (
      misconceptionTag === 'CONFUSED_KE_WITH_HALF_LIFE' ||
      misconceptionTag === 'DELTA_T_DIVIDED_BY_RATIO_ERROR' ||
      misconceptionTag === 'DIVIDED_BY_LN2_INSTEAD_OF_MULTIPLIED' ||
      /gentami[cs]in/i.test(req.conceptName)
    ) {
      return {
        clinical_observation_tr: "Gentamisin eliminasyon ve yarı ömür adımlarını birlikte inceledik.",
        conceptual_pivot_tr: "Eliminasyon hız sabiti ke = ln(C1/C2)/Δt olup, yarılanma ömrü doğrudan t1/2 = ln(2)/ke bağıntısından türetilir.",
        actionable_question_tr: "Bu kinetik bağıntıyı pekiştirmek için akşam seansındaki transfer sorusunu çözmeye hazır mısınız?",
        current_state: "DIRECT_TEACH",
        misconception_tag: misconceptionTag,
        reveals_answer: false,
      };
    }

    if (
      misconceptionTag === 'ERRONEOUSLY_DIVIDED_BY_AMINOPHYLLINE_SALT_FACTOR' ||
      misconceptionTag === 'INVERTED_VD_EQUATION' ||
      misconceptionTag === 'MISAPPLIED_CLEARANCE_PRODUCT' ||
      /teofilin|theophylline/i.test(req.conceptName)
    ) {
      return {
        clinical_observation_tr: "Teofilin yükleme dozu hesaplama basamaklarını gözden geçirdik.",
        conceptual_pivot_tr: "Hedef kitle Hedef=Vd*Ctarget olup aminofilin tuzu için S=0.8, anhidr teofilin için S=1.0 ile bölünür.",
        actionable_question_tr: "Bu tuz faktörü kuralını pekiştirmek için akşam seansındaki transfer sorusunu çözmeye hazır mısınız?",
        current_state: "DIRECT_TEACH",
        misconception_tag: misconceptionTag,
        reveals_answer: false,
      };
    }

    if (
      misconceptionTag === 'MISSED_FEMALE_FACTOR_0_85' ||
      misconceptionTag === 'USED_TBW_INSTEAD_OF_ADJ_OR_IBW' ||
      misconceptionTag === 'USED_IBW_WITHOUT_OBESITY_ADJUSTMENT' ||
      /cockcroft|crcl|ağırlık|weight/i.test(req.conceptName)
    ) {
      return {
        clinical_observation_tr: "Cockcroft-Gault klerens hesaplama adımlarını dikkatle takip ettiniz.",
        conceptual_pivot_tr: "Ders kurallarımıza göre obez hastalarda düzeltilmiş ağırlık (DVA), kadınlarda ise 0.85 katsayısı esastır.",
        actionable_question_tr: "Bu basamağı pekiştirmek için akşam seansındaki transfer sorusunu çözmeye hazır mısınız?",
        current_state: "DIRECT_TEACH",
        misconception_tag: misconceptionTag,
        reveals_answer: false,
      };
    }

    return {
      clinical_observation_tr: "Hesaplama adımlarını dikkatle takip ettiniz.",
      conceptual_pivot_tr: "Farmakokinetik formüllerde temel parametre bağıntıları ve katsayılar klinik doz doğruluğunun esasıdır.",
      actionable_question_tr: "Bu basamağı pekiştirmek için akşam seansındaki transfer sorusunu çözmeye hazır mısınız?",
      current_state: "DIRECT_TEACH",
      misconception_tag: misconceptionTag || null,
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

    case 'DELTA_T_DIVIDED_BY_RATIO_ERROR':
      return {
        clinical_observation_tr: "Konsantrasyon düşüşünü ve geçen zaman aralığını incelediniz.",
        conceptual_pivot_tr: "Birinci derece eliminasyon kinetiğinde plazma konsantrasyonu doğrusal değil, logaritmik azalır.",
        actionable_question_tr: "Eliminasyon hız sabiti hesaplanırken konsantrasyon oranının hangi matematiksel fonksiyonu alınır?",
        current_state: currentState,
        misconception_tag: 'DELTA_T_DIVIDED_BY_RATIO_ERROR',
        reveals_answer: false,
      };

    case 'DIVIDED_BY_LN2_INSTEAD_OF_MULTIPLIED':
      return {
        clinical_observation_tr: "Eliminasyon hız sabiti ve yarı ömür arasındaki ilişkiyi kurdunuz.",
        conceptual_pivot_tr: "Yarılanma süresi ile eliminasyon hız sabiti birbiriyle ters orantılı parametrelerdir.",
        actionable_question_tr: "0.693 sabiti yarı ömür formülünde pay kısmında mı yoksa paydada mı yer alır?",
        current_state: currentState,
        misconception_tag: 'DIVIDED_BY_LN2_INSTEAD_OF_MULTIPLIED',
        reveals_answer: false,
      };

    case 'ERRONEOUSLY_DIVIDED_BY_AMINOPHYLLINE_SALT_FACTOR':
      return {
        clinical_observation_tr: "Hedef konsantrasyona ulaşmak için gereken teofilin miktarını belirlediniz.",
        conceptual_pivot_tr: "Formülasyonda kullanılan tuz formu aktif teofilin fraksiyonunu belirler; anhidr formda tuz bulunmaz.",
        actionable_question_tr: "Teofilin anhidr formülasyonu için tuz faktörü S değeri kaç kabul edilmelidir?",
        current_state: currentState,
        misconception_tag: 'ERRONEOUSLY_DIVIDED_BY_AMINOPHYLLINE_SALT_FACTOR',
        reveals_answer: false,
      };

    case 'INVERTED_VD_EQUATION':
      return {
        clinical_observation_tr: "Dağılım hacmi ile hedef plazma konsantrasyonu verilerini eşleştirdiniz.",
        conceptual_pivot_tr: "Hedef kitle, plazma konsantrasyonu ile sanal dağılım hacminin doğrudan çarpımıdır.",
        actionable_question_tr: "Litre cinsinden hacim ile mg/L derişimi çarptığınızda hangi birimi elde edersiniz?",
        current_state: currentState,
        misconception_tag: 'INVERTED_VD_EQUATION',
        reveals_answer: false,
      };

    case 'MISAPPLIED_CLEARANCE_PRODUCT':
      return {
        clinical_observation_tr: "Hastanın yükleme dozu ihtiyacını hesaplamaya çalıştınız.",
        conceptual_pivot_tr: "Yükleme dozu vücut depolarını doldururken dağılım hacmine, idame dozu ise klerense dayanır.",
        actionable_question_tr: "Yükleme dozu hesabında klerens yerine hangi dağılım parametresi temel alınmalıdır?",
        current_state: currentState,
        misconception_tag: 'MISAPPLIED_CLEARANCE_PRODUCT',
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
