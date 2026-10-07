import { SocraticTurnSchema, generateDeterministicFallbackTurn, SocraticRequest } from './socraticFSM';

export interface Env {
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  OPENROUTER_FALLBACK_MODEL?: string;
  OPENAI_API_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const { pathname } = new URL(request.url);

    if (pathname === '/api/tutor/turn') {
      let body: SocraticRequest | null = null;
      try {
        body = (await request.json()) as SocraticRequest;

        // Redirection guardrail against live clinical consultation
        const clinicalRegex = /(hasta|yaşında|erkek|kadın|ne vermeliyim|doz önerisi)/i;
        if (clinicalRegex.test(body.studentInput) && body.studentInput.length > 50) {
          return Response.json(
            {
              clinical_observation_tr: "PharmIQ yalnızca sentetik eğitim vakaları ve ders tekrarı için tasarlanmıştır.",
              conceptual_pivot_tr: "Gerçek hasta verileri veya klinik tedavi kararları sistem kapsamı dışındadır.",
              actionable_question_tr: "Bu konuyu ders slaytlarındaki teorik örnek üzerinden tekrar inceleyelim mi?",
              current_state: "PROBE",
              misconception_tag: null,
              reveals_answer: false,
            },
            {
              headers: { 'Access-Control-Allow-Origin': '*' },
            }
          );
        }

        const apiKey = env.OPENROUTER_API_KEY || env.OPENAI_API_KEY;

        // If no API key configured, use deterministic clinical fallback
        if (!apiKey) {
          const fallback = generateDeterministicFallbackTurn(body);
          return Response.json(fallback, {
            headers: { 'Access-Control-Allow-Origin': '*' },
          });
        }

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
  "current_state": "PROBE",
  "misconception_tag": "${body.misconceptionTag}",
  "reveals_answer": false
}
4. Dil: Türkçe. Tıbbi terminolojiyi koru. Sadece saf JSON döndür.`;

        // OpenRouter free models prioritized by capability and speed:
        // 1. nvidia/nemotron-3-ultra:free (Highest capacity, 1M context, 6T weekly tokens)
        // 2. nvidia/nemotron-3.5-lightning:free (Ultra-fast 619ms, 1M context)
        // 3. google/gemma-4-31b:free (Strong reasoning, 262K context)
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
          headers['HTTP-Referer'] = 'https://pharmiq.biruni.edu.tr';
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

    return new Response('Not Found', { status: 404 });
  },
};
