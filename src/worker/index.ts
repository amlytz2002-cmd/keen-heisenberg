import { SocraticTurnSchema, generateDeterministicFallbackTurn, SocraticRequest } from './socraticFSM';

export interface Env {
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
      try {
        const body = (await request.json()) as SocraticRequest;

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

        // If OPENAI_API_KEY is not configured or in test mode, return deterministic fallback
        if (!env.OPENAI_API_KEY) {
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
3. Çıktı kesinlikle belirtilen JSON şemasına uygun olmalıdır.
4. Dil: Türkçe. Tıbbi terminolojiyi koru.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: body.studentInput },
            ],
            temperature: 0.2,
          }),
        });

        const rawData = (await response.json()) as any;
        const parsedTurn = SocraticTurnSchema.parse(JSON.parse(rawData.choices[0].message.content));

        return Response.json(parsedTurn, {
          headers: { 'Access-Control-Allow-Origin': '*' },
        });
      } catch (error: any) {
        return Response.json({ error: error.message }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};
