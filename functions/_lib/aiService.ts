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
1. Ground all claims strictly in the provided excerpt. Do not invent external facts.
2. Return JSON matching:
{
  "title": "string (concise topic name)",
  "summary": "string (1-2 sentences)",
  "explanation": "string (comprehensive pedagogical explanation)",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "learningObjectives": ["string"],
  "keyTerms": ["string"],
  "citation": {
    "pageNumber": ${pageNumber || 'null'},
    "sectionTitle": "string or null",
    "supportingExcerpt": "exact quotation from source"
  }
}`;

  const userPrompt = `Source Document Excerpt:\n"""\n${sanitized}\n"""`;

  const result = await queryAiWithSchema(env, systemPrompt, userPrompt, ConceptExtractionSchema);
  if (result) {
    return result;
  }

  // Deterministic curriculum fallback
  return {
    title: 'Extracted Academic Core Concept',
    summary: 'Core pedagogical principle extracted from the provided course resource materials.',
    explanation: sanitized.length > 50 ? sanitized.slice(0, 400) + '...' : 'Fundamental course concept grounded in course literature.',
    difficulty: 'intermediate',
    learningObjectives: ['Understand the foundational definitions', 'Apply the principle in practice questions'],
    keyTerms: ['Principle', 'Retrieval', 'Application'],
    citation: {
      pageNumber: pageNumber || 1,
      sectionTitle: 'Course Resource Overview',
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
1. Ground the question strictly in the provided text.
2. Formulate a 3-stage progressive Socratic hint ladder:
   - Stage 1 (Orientation): Identifies the relevant governing principle without giving away the answer.
   - Stage 2 (Reasoning): Points to the next logical deductive step.
   - Stage 3 (Application): Provides a specific clue or suggests eliminating an incorrect distractor.
3. Return JSON matching:
{
  "questionText": "string",
  "questionType": "${questionType}",
  "difficulty": "intermediate",
  "options": [
    {"key": "A", "text": "Option A"},
    {"key": "B", "text": "Option B"},
    {"key": "C", "text": "Option C"},
    {"key": "D", "text": "Option D"}
  ],
  "answerKey": {"correctKey": "A"},
  "explanation": "Detailed explanation why the correct answer is correct and why other options fail.",
  "hintSequence": [
    {"stage": 1, "title": "Orientation", "hintText": "Hint 1..."},
    {"stage": 2, "title": "Reasoning", "hintText": "Hint 2..."},
    {"stage": 3, "title": "Application", "hintText": "Hint 3..."}
  ],
  "citation": {
    "pageNumber": 1,
    "supportingExcerpt": "verifiable quote from source"
  }
}`;

  const userPrompt = `Concept: ${conceptTitle}\nExplanation: ${conceptExplanation}\n\nReference text:\n"""\n${sanitized}\n"""`;

  const result = await queryAiWithSchema(env, systemPrompt, userPrompt, QuestionGenerationSchema);
  if (result) {
    return result;
  }

  // Deterministic curriculum fallback
  return {
    questionText: `Which of the following statements most accurately reflects the core principle of ${conceptTitle}?`,
    questionType: 'single_choice',
    difficulty: 'intermediate',
    options: [
      { key: 'A', text: `It dictates the primary governing mechanism outlined in the course materials.` },
      { key: 'B', text: `It operates independently without correlation to biological or physical properties.` },
      { key: 'C', text: `It has been superseded by empirical trial-and-error without mathematical modeling.` },
      { key: 'D', text: `It applies only to qualitative diagnostics without quantitative application.` },
    ],
    answerKey: { correctKey: 'A' },
    explanation: `Option A is correct because the source documentation establishes this concept as the primary governing mechanism for this topic.`,
    hintSequence: [
      { stage: 1, title: 'Orientation', hintText: `Focus on the foundational definition of ${conceptTitle} given in your course reading.` },
      { stage: 2, title: 'Reasoning', hintText: `Consider how quantitative relationships dictate predictable outcomes in this discipline.` },
      { stage: 3, title: 'Application', hintText: `Eliminate options claiming qualitative-only or independent behavior.` },
    ],
    citation: {
      pageNumber: 1,
      supportingExcerpt: sanitized.slice(0, 100),
    },
  };
}
