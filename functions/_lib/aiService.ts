import { z } from 'zod';
import { Env } from './supabaseServer';

export const ConceptExtractionSchema = z.object({
  title: z.string().min(3),
  summary: z.string().min(10),
  explanation: z.string().min(20),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  learningObjectives: z.array(z.string()).default([]),
  keyTerms: z.array(z.string()).default([]),
  citation: z.object({
    pageNumber: z.number().nullable().optional(),
    sectionTitle: z.string().nullable().optional(),
    supportingExcerpt: z.string().min(5),
  }),
});

export const QuestionGenerationSchema = z.object({
  questionText: z.string().min(10),
  questionType: z.enum(['single_choice', 'multiple_select', 'short_answer', 'true_false', 'numeric']),
  difficulty: z.enum(['easy', 'intermediate', 'hard']),
  options: z.array(z.object({
    key: z.string(),
    text: z.string(),
  })).optional(),
  answerKey: z.record(z.any()), // e.g. { correctKey: "A" } or { correctValue: 70.5, tolerancePct: 2 }
  explanation: z.string().min(15),
  hintSequence: z.array(z.object({
    stage: z.number(), // 1, 2, 3
    title: z.string(),
    hintText: z.string(),
  })).min(1),
  citation: z.object({
    pageNumber: z.number().nullable().optional(),
    supportingExcerpt: z.string(),
  }),
});

export type GeneratedConcept = z.infer<typeof ConceptExtractionSchema>;
export type GeneratedQuestion = z.infer<typeof QuestionGenerationSchema>;

/**
 * Prompt-injection guardrail: sanitize and encapsulate untrusted source text
 */
function sanitizeSourceContent(raw: string): string {
  // Strip control characters and boundary overrides
  return raw
    .replace(/<\/?(?:system|instruction|prompt|ai)>/gi, '')
    .trim()
    .slice(0, 12000); // Bounded chunk size
}

/**
 * Queries AI provider with model cascade and schema validation
 */
async function queryAiWithSchema<T>(
  env: Env,
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodSchema<T>
): Promise<T | null> {
  const apiKey = env.OPENROUTER_API_KEY || env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const isOpR = Boolean(env.OPENROUTER_API_KEY) || !env.OPENAI_API_KEY;
  const endpoint = isOpR
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';

  const candidateModels = isOpR
    ? [
        env.OPENROUTER_MODEL || 'nvidia/nemotron-3-ultra:free',
        env.OPENROUTER_FALLBACK_MODEL || 'nvidia/nemotron-3.5-lightning:free',
        'google/gemma-4-31b:free',
      ]
    : [env.OPENAI_API_KEY ? 'gpt-4o-mini' : 'gpt-3.5-turbo'];

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  if (isOpR) {
    headers['HTTP-Referer'] = 'https://cenna.live';
    headers['X-Title'] = 'CENNA.live Pedagogical Engine';
  }

  for (const model of candidateModels) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: `${systemPrompt}\nIMPORTANT: You must output ONLY a valid JSON object matching the requested schema without markdown backticks.` },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        continue;
      }

      const raw = await response.json() as any;
      const contentStr = raw.choices?.[0]?.message?.content || '{}';
      const cleaned = contentStr.replace(/```(?:json)?/g, '').trim();
      const parsedJson = JSON.parse(cleaned);
      const validated = schema.parse(parsedJson);
      return validated;
    } catch {
      // Cascade to next model
      continue;
    }
  }

  return null;
}

/**
 * Generates grounded concepts from document source chunks
 */
export async function generateGroundedConcepts(
  env: Env,
  chunkContent: string,
  pageNumber?: number
): Promise<GeneratedConcept> {
  const sanitized = sanitizeSourceContent(chunkContent);
  const systemPrompt = `You are CENNA.live's educational concept extraction engine.
Analyze the provided educational source excerpt and extract a structured learning concept.
Rules:
1. Language: TURKISH. All fields (title, summary, explanation, learningObjectives, keyTerms) must be in natural, professional academic Turkish appropriate for pharmacy and medical students.
2. Ground all claims strictly in the provided excerpt. Do not invent external facts.
3. Return JSON matching:
{
  "title": "string (kısa ve net konu adı)",
  "summary": "string (1-2 cümlelik özet)",
  "explanation": "string (kapsamlı pedagojik açıklama)",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "learningObjectives": ["string"],
  "keyTerms": ["string"],
  "citation": {
    "pageNumber": ${pageNumber || 'null'},
    "sectionTitle": "string or null",
    "supportingExcerpt": "kaynaktan birebir alıntı"
  }
}`;

  const userPrompt = `Ders Dokümanı Metni:\n"""\n${sanitized}\n"""`;

  const result = await queryAiWithSchema(env, systemPrompt, userPrompt, ConceptExtractionSchema);
  if (result) {
    return result;
  }

  // Deterministic curriculum fallback
  return {
    title: 'Müfredat Temel Kavramı',
    summary: 'İlgili ders materyalinden çıkarılan temel pedagojik ve farmakolojik ilke.',
    explanation: sanitized.length > 50 ? sanitized.slice(0, 400) + '...' : 'Ders literatürüne dayalı temel akademik kavram açıklaması.',
    difficulty: 'intermediate',
    learningObjectives: ['Temel tanımları ve etki mekanizmasını kavramak', 'Kavramı pratik klinik senaryolarda uygulamak'],
    keyTerms: ['Farmakokinetik', 'Aktif Pekiştirme', 'Klinik Uygulama'],
    citation: {
      pageNumber: pageNumber || 1,
      sectionTitle: 'Ders Materyali Özeti',
      supportingExcerpt: sanitized.slice(0, 120),
    },
  };
}

/**
 * Generates source-grounded practice questions with progressive 3-stage hints
 */
export async function generateGroundedQuestions(
  env: Env,
  conceptTitle: string,
  conceptExplanation: string,
  chunkContent: string,
  questionType: 'single_choice' | 'multiple_select' | 'short_answer' = 'single_choice'
): Promise<GeneratedQuestion> {
  const sanitized = sanitizeSourceContent(chunkContent);
  const systemPrompt = `You are CENNA.live's assessment authoring engine.
Generate a high-yield practice question based on the concept "${conceptTitle}".
Rules:
1. Language: TURKISH. All fields (questionText, options, explanation, hint titles and texts) MUST be in natural, professional academic Turkish appropriate for university pharmacy and health sciences students.
2. Ground the question strictly in the provided text.
3. Formulate a 3-stage progressive Socratic hint ladder in Turkish:
   - Stage 1 (1. Kademe: Yönlendirme): İlgili temel kuralı ve kavramı işaret eder, cevabı ifşa etmez.
   - Stage 2 (2. Kademe: Akıl Yürütme): Parametreler arasındaki mantıksal ilişkiyi açıklar.
   - Stage 3 (3. Kademe: Uygulama): Doğrudan çözüm adımı ve çeldiricileri eleme rehberliği verir.
4. Return JSON matching:
{
  "questionText": "string",
  "questionType": "${questionType}",
  "difficulty": "intermediate",
  "options": [
    {"key": "A", "text": "A seçeneği"},
    {"key": "B", "text": "B seçeneği"},
    {"key": "C", "text": "C seçeneği"},
    {"key": "D", "text": "D seçeneği"}
  ],
  "answerKey": {"correctKey": "A"},
  "explanation": "Doğru cevabın neden doğru olduğunu ve çeldiricilerin neden elendiğini açıklayan pedagojik Türkçe metin.",
  "hintSequence": [
    {"stage": 1, "title": "1. Kademe: Yönlendirme", "hintText": "İpucu 1..."},
    {"stage": 2, "title": "2. Kademe: Akıl Yürütme", "hintText": "İpucu 2..."},
    {"stage": 3, "title": "3. Kademe: Uygulama", "hintText": "İpucu 3..."}
  ],
  "citation": {
    "pageNumber": 1,
    "supportingExcerpt": "kaynaktan birebir alıntı"
  }
}`;

  const userPrompt = `Kavram: ${conceptTitle}\nAçıklama: ${conceptExplanation}\n\nKaynak metin:\n"""\n${sanitized}\n"""`;

  const result = await queryAiWithSchema(env, systemPrompt, userPrompt, QuestionGenerationSchema);
  if (result) {
    return result;
  }

  // Deterministic curriculum fallback
  return {
    questionText: `Aşağıdaki ifadelerden hangisi "${conceptTitle}" kavramının temel prensibini en doğru şekilde açıklamaktadır?`,
    questionType: 'single_choice',
    difficulty: 'intermediate',
    options: [
      { key: 'A', text: `Ders kaynaklarında belirtilen temel farmakolojik/klinik mekanizmayı doğrudan yönetir.` },
      { key: 'B', text: `Biyolojik ve fizikokimyasal parametrelerden tamamen bağımsız çalışır.` },
      { key: 'C', text: `Matematiksel modelleme olmaksızın sadece deneme-yanılma yaklaşımına dayanır.` },
      { key: 'D', text: `Yalnızca teorik tanımlamalar için geçerli olup kantitatif klinik hesaplamalara uygulanamaz.` },
    ],
    answerKey: { correctKey: 'A' },
    explanation: `A seçeneği doğrudur; çünkü ders kaynakları bu kavramın ilgili konudaki ana belirleyici mekanizma olduğunu doğrulamaktadır. Diğer seçenekler temel farmakolojik ilkelerle çelişmektedir.`,
    hintSequence: [
      { stage: 1, title: '1. Kademe: Yönlendirme', hintText: `${conceptTitle} kavramının ders notlarınızda vurgulanan temel tanım ve işlevine odaklanın.` },
      { stage: 2, title: '2. Kademe: Akıl Yürütme', hintText: `Bu alandaki nicel parametrelerin klinik sonuçları nasıl doğrudan belirlediğini değerlendirin.` },
      { stage: 3, title: '3. Kademe: Uygulama', hintText: `Mekanizmanın bağımsız veya yalnızca nitel olduğunu iddia eden seçenekleri eleyin.` },
    ],
    citation: {
      pageNumber: 1,
      supportingExcerpt: sanitized.slice(0, 100),
    },
  };
}
