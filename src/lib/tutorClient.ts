import { SocraticTurn, SocraticRequest, generateDeterministicFallbackTurn, SocraticTurnSchema } from '../worker/socraticFSM';

export async function requestTutorTurn(req: SocraticRequest): Promise<SocraticTurn> {
  // 1. Try Cloudflare Worker Gateway (/api/tutor/turn)
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

  // 2. Direct OpenRouter API call from client if VITE_OPENROUTER_API_KEY is available
  const clientKey = (import.meta as any).env?.VITE_OPENROUTER_API_KEY;
  if (clientKey) {
    try {
      const model = (import.meta as any).env?.VITE_OPENROUTER_MODEL || 'nvidia/nemotron-3-ultra:free';
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
  "current_state": "PROBE",
  "misconception_tag": "${req.misconceptionTag}",
  "reveals_answer": false
}
4. Dil: Türkçe. Tıbbi terminolojiyi koru. Sadece saf JSON döndür.`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clientKey}`,
          'HTTP-Referer': 'https://pharmiq.biruni.edu.tr',
          'X-Title': 'PharmIQ Pedagogical Engine',
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
      }
    } catch (e) {
      console.warn('Client OpenRouter fallback encountered an error, falling back to deterministic tutor.', e);
    }
  }

  // 3. Fallback to local deterministic tutor logic
  return generateDeterministicFallbackTurn(req);
}
