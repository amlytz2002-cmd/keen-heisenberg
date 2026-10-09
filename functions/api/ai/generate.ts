import { handleOptions, jsonResponse, errorResponse } from '../../_lib/cors';
import { authenticateUser, getSupabaseUserClient, getSupabaseServiceClient, Env } from '../../_lib/supabaseServer';
import { generateGroundedConcepts, generateGroundedQuestions } from '../../_lib/aiService';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await authenticateUser(request, env);
  if (!user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  const resourceId = body.resourceId;
  const courseId = body.courseId;
  const taskType = body.taskType || 'both'; // 'concepts', 'questions', or 'both'

  if (!resourceId) {
    return errorResponse('VALIDATION_ERROR', 'resourceId is required', 400);
  }

  const { client } = getSupabaseUserClient(request, env);
  const serviceClient = getSupabaseServiceClient(env);

  // 1. Fetch resource and its extracted chunks
  const { data: resource, error: resErr } = await client
    .from('resources')
    .select('id, course_id, classroom_id, title')
    .eq('id', resourceId)
    .single();

  if (resErr || !resource) {
    return errorResponse('NOT_FOUND', 'Resource not found or unauthorized', 404);
  }

  const effectiveCourseId = courseId || resource.course_id;

  const { data: chunks, error: chunkErr } = await client
    .from('resource_chunks')
    .select('id, chunk_index, page_number, section_title, content')
    .eq('resource_id', resourceId)
    .order('chunk_index', { ascending: true })
    .limit(5); // Process up to first 5 chunks for pilot generation

  if (chunkErr || !chunks || chunks.length === 0) {
    return errorResponse('NO_CHUNKS', 'Resource has no extracted chunks. Run extraction first.', 400);
  }

  const generatedConceptsList: any[] = [];
  const generatedQuestionsList: any[] = [];

  // Log AI generation start
  const { data: runLog } = await serviceClient.from('ai_generation_runs').insert({
    requested_by: user.id,
    course_id: effectiveCourseId,
    resource_id: resource.id,
    task_type: taskType === 'both' ? 'concept_extraction' : taskType,
    model_identifier: env.OPENROUTER_MODEL || 'nvidia/nemotron-3-ultra:free',
    prompt_version: 'v1.0-grounded',
    status: 'processing',
  }).select().single();

  for (const chunk of chunks) {
    // 2. Generate Concept
    if (taskType === 'both' || taskType === 'concepts') {
      const conceptData = await generateGroundedConcepts(env, chunk.content, chunk.page_number || 1);

      // Insert concept with 'needs_review' status (Instructor Gate)
      const { data: newConcept, error: conceptInsertErr } = await serviceClient
        .from('concepts')
        .insert({
          course_id: effectiveCourseId,
          title: conceptData.title,
          summary: conceptData.summary,
          explanation: conceptData.explanation,
          difficulty: conceptData.difficulty,
          status: 'needs_review',
          version: 1,
          created_by: user.id,
          pillar: 'Curriculum Core',
          slug: `${conceptData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`,
        })
        .select()
        .single();

      if (!conceptInsertErr && newConcept) {
        generatedConceptsList.push(newConcept);

        // Record citation provenance
        await serviceClient.from('concept_sources').insert({
          concept_id: newConcept.id,
          resource_id: resource.id,
          chunk_id: chunk.id,
          page_number: chunk.page_number,
          citation_text: conceptData.citation?.supportingExcerpt || chunk.content.slice(0, 100),
        });

        // 3. Generate Question for this Concept
        if (taskType === 'both' || taskType === 'questions') {
          const questionData = await generateGroundedQuestions(
            env,
            newConcept.title,
            newConcept.explanation || '',
            chunk.content,
            'single_choice'
          );

          const { data: newQuestion, error: qInsertErr } = await serviceClient
            .from('questions')
            .insert({
              course_id: effectiveCourseId,
              concept_id: newConcept.id,
              question_type: questionData.questionType,
              difficulty: questionData.difficulty,
              question_text: questionData.questionText,
              options: questionData.options || null,
              answer_key: questionData.answerKey,
              explanation: questionData.explanation,
              hint_sequence: questionData.hintSequence,
              status: 'needs_review', // Instructor Gate
              version: 1,
              created_by: user.id,
            })
            .select()
            .single();

          if (!qInsertErr && newQuestion) {
            generatedQuestionsList.push(newQuestion);

            await serviceClient.from('question_sources').insert({
              question_id: newQuestion.id,
              resource_id: resource.id,
              chunk_id: chunk.id,
              page_number: chunk.page_number,
              supporting_excerpt: questionData.citation?.supportingExcerpt || chunk.content.slice(0, 100),
            });
          }
        }
      }
    }
  }

  // Update AI run log
  if (runLog) {
    await serviceClient.from('ai_generation_runs').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      validation_result: {
        conceptsCount: generatedConceptsList.length,
        questionsCount: generatedQuestionsList.length,
      },
    }).eq('id', runLog.id);
  }

  return jsonResponse({
    success: true,
    conceptsGenerated: generatedConceptsList.length,
    questionsGenerated: generatedQuestionsList.length,
    status: 'needs_review',
    concepts: generatedConceptsList,
    questions: generatedQuestionsList,
  }, 201);
}
