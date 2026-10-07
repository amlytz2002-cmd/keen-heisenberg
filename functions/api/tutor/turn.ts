import {
  SocraticTurnSchema,
  generateDeterministicFallbackTurn,
  SocraticRequest,
  CLINICAL_CONSULTATION_REGEX,
  CLINICAL_REFUSAL_TURN,
} from '../../_lib/socraticFSM';

export interface Env {
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  OPENROUTER_FALLBACK_MODEL?: string;
  OPENAI_API_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  let body: SocraticRequest | null = null;
  try {
    body = (await request.json()) as SocraticRequest;

    // 1. Redirection guardrail against live clinical consultation
    if (CLINICAL_CONSULTATION_REGEX.test(body.studentInput)) {
      return Response.json(CLINICAL_REFUSAL_TURN, {
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 2. Turn budget exhausted (turnCount >= 4) -> immediately return deterministic DIRECT_TEACH fallback
    if (body.turnCount >= 4) {
      const fallback = generateDeterministicFallbackTurn(body);
      return Response.json(fallback, {
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    const apiKey = env.OPENROUTER_API_KEY || env.OPENAI_API_KEY;

    // If no API key configured, use deterministic clinical fallback
    if (!apiKey) {
      const fallback = generateDeterministicFallbackTurn(body);
      return Response.json(fallback, {
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    const currentState = (body.turnCount ?? 1) >= 3 ? 'PATCH' : 'PROBE';
    const systemPrompt = `Sen bir klinik eczacılık preseptörüsün. Konu: ${body.conceptName}.
Öğrencinin kavram yanılgısı: ${body.misconceptionTag}.

GÖREV KURALLARI:
1. Nihai cevabı veya sayısal değeri asla doğrudan verme (reveals_answer: false).
2. Maksimum 3 cümle: 1 klinik gözlem, 1 kavram köprüsü, 1 net soru.
3. Çıktı kesinlikle belirtilen JSON şemasına uygun olmalıdır:
{
  "clinical_observation_tr": "...",
  "conceptual_pivot_tr": "...",
  "actionable_question_tr": "...",
  "current_state": "${currentState}",
  "misconception_tag": "${body.misconceptionTag}",
  "reveals_answer": false
}
4. Dil: Türkçe. Tıbbi terminolojiyi koru. Sadece saf JSON döndür.`;

    const isOpR = Boolean(env.OPENROUTER_API_KEY) || !env.OPENAI_API_KEY;
    const endpoint = isOpR
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';

    const candidateModels = isOpR
      ? [
          env.OPENROUTER_MODEL || 'nvidia/nemotron-3-ultra:free',
          env.OPENROUTER_FALLBACK_MODEL || 'nvidia/nemotron-3.5-lightning:free',
          'google/gemma-4-31b:free',
          'ling/ling-3.0-flash-sante:free',
        ]
      : [env.OPENAI_API_KEY ? 'gpt-4o-mini' : 'gpt-3.5-turbo'];

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };

    if (isOpR) {
      headers['HTTP-Referer'] = 'https://cenna.live';
      headers['X-Title'] = 'PharmIQ Pedagogical Engine';
    }

    let parsedTurn: any = null;

    // Cascade through candidate free models in case of rate limits
    for (const model of candidateModels) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: body.studentInput },
            ],
            temperature: 0.2,
          }),
        });

        if (response.ok) {
          const rawData = (await response.json()) as any;
          const contentStr = rawData.choices?.[0]?.message?.content || '{}';
          const cleanedJson = contentStr.replace(/```(?:json)?/g, '').trim();
          parsedTurn = SocraticTurnSchema.parse(JSON.parse(cleanedJson));
          break; // Success! Break out of model cascade
        } else {
          const errText = await response.text();
          console.warn(`Model ${model} failed (${response.status}): ${errText}`);
        }
      } catch (modelErr: any) {
        console.warn(`Error querying model ${model}:`, modelErr.message);
      }
    }

    if (parsedTurn) {
      return Response.json(parsedTurn, {
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    // If all models failed or were rate-limited, fall back to deterministic clinical engine
    const fallback = generateDeterministicFallbackTurn(body);
    return Response.json(fallback, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    console.warn('Fallback triggered on exception:', error.message);
    const fallback = generateDeterministicFallbackTurn(body || {
      conceptName: 'Genel Farmakokinetik',
      misconceptionTag: 'GENERAL_CALCULATION_ERROR',
      studentInput: '',
      turnCount: 1,
    });
    return Response.json(fallback, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
}
