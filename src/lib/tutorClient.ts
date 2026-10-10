import {
  SocraticTurn,
  SocraticRequest,
  generateDeterministicFallbackTurn,
  SocraticTurnSchema,
  CLINICAL_CONSULTATION_REGEX,
  CLINICAL_REFUSAL_TURN,
} from '../worker/socraticFSM';

export const OPENROUTER_MODEL_CASCADE = [
  'nvidia/nemotron-3-ultra:free',
  'nvidia/nemotron-3.5-lightning:free',
  'google/gemma-4-31b:free',
  'ling/ling-3.0-flash-sante:free',
] as const;

export async function requestTutorTurn(req: SocraticRequest): Promise<SocraticTurn> {
  // 0. Redirection guardrail against live clinical consultation
  if (CLINICAL_CONSULTATION_REGEX.test(req.studentInput)) {
    return CLINICAL_REFUSAL_TURN;
  }

  // 1. Turn budget exhausted (turnCount >= 4) -> deterministic DIRECT_TEACH fallback immediately
  if (req.turnCount >= 4) {
    return generateDeterministicFallbackTurn(req);
  }

  // 2. Try Cloudflare Worker Gateway (/api/tutor/turn)
  try {
    const res = await fetch('/api/tutor/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (res.ok) {
      const data = await res.json();
      return data as SocraticTurn;
    }
  } catch {
    // Proceed to client direct OpenRouter fallback or deterministic engine
  }

  // 3. Direct OpenRouter API call from client if VITE_OPENROUTER_API_KEY is available
  const clientKey = (import.meta as any).env?.VITE_OPENROUTER_API_KEY;
  if (clientKey) {
    const candidateModels = [
      (import.meta as any).env?.VITE_OPENROUTER_MODEL || OPENROUTER_MODEL_CASCADE[0],
      (import.meta as any).env?.VITE_OPENROUTER_FALLBACK_MODEL || OPENROUTER_MODEL_CASCADE[1],
      OPENROUTER_MODEL_CASCADE[2],
      OPENROUTER_MODEL_CASCADE[3],
    ];

    const currentState = req.turnCount >= 3 ? 'PATCH' : 'PROBE';
    const prompt = `Sen bir klinik eczacılık preseptörüsün. Konu: ${req.conceptName}.
Öğrencinin kavram yanılgısı: ${req.misconceptionTag}.

GÖREV KURALLARI:
1. Nihai cevabı veya sayısal değeri asla doğrudan verme (reveals_answer: false).
2. Maksimum 3 cümle: 1 klinik gözlem, 1 kavram köprüsü, 1 net soru.
3. Çıktı kesinlikle belirtilen JSON formatında olmalıdır:
{
  "clinical_observation_tr": "...",
  "conceptual_pivot_tr": "...",
  "actionable_question_tr": "...",
  "current_state": "${currentState}",
  "misconception_tag": "${req.misconceptionTag}",
  "reveals_answer": false
}
4. Dil: Türkçe. Tıbbi terminolojiyi koru. Sadece saf JSON döndür.`;

    for (const model of candidateModels) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${clientKey}`,
            'HTTP-Referer': 'https://cenna.live',
            'X-Title': 'CENNA.live Pedagogical Engine',
          },
          body: JSON.stringify({
            model,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: prompt },
              { role: 'user', content: req.studentInput },
            ],
            temperature: 0.2,
          }),
        });

        if (response.ok) {
          const rawData = await response.json();
          const contentStr = rawData.choices?.[0]?.message?.content || '{}';
          const cleanedJson = contentStr.replace(/```(?:json)?/g, '').trim();
          const parsedTurn = SocraticTurnSchema.parse(JSON.parse(cleanedJson));
          return parsedTurn;
        } else {
          console.warn(`OpenRouter model ${model} failed with HTTP ${response.status}, continuing cascade.`);
        }
      } catch (e) {
        console.warn(`OpenRouter model ${model} encountered an error, falling back to next cascade model:`, e);
      }
    }
  }

  // 3. Fallback to local deterministic tutor logic
  return generateDeterministicFallbackTurn(req);
}
