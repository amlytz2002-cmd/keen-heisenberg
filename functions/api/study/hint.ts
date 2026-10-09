import { handleOptions, jsonResponse, errorResponse } from '../../_lib/cors';
import { authenticateUser, getSupabaseUserClient, Env } from '../../_lib/supabaseServer';

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
  const { questionId, attemptId, hintIndex = 1 } = body;

  if (!questionId) {
    return errorResponse('VALIDATION_ERROR', 'questionId is required', 400);
  }

  const { client } = getSupabaseUserClient(request, env);

  // Fetch question hint sequence
  const { data: question, error: qErr } = await client
    .from('questions')
    .select('id, hint_sequence, question_text, explanation')
    .eq('id', questionId)
    .single();

  if (qErr || !question) {
    return errorResponse('NOT_FOUND', 'Question not found', 404);
  }

  const hints = Array.isArray(question.hint_sequence) ? (question.hint_sequence as any[]) : [];
  const targetStage = Math.max(1, Math.min(3, Number(hintIndex) || 1));

  // Find matching hint from sequence, or generate standard Socratic hint stage
  let selectedHint = hints.find((h) => h.stage === targetStage);

  if (!selectedHint) {
    if (targetStage === 1) {
      selectedHint = {
        stage: 1,
        title: 'Orientation',
        hintText: 'Identify the underlying academic principle and consider the governing rules defined in the source material.',
      };
    } else if (targetStage === 2) {
      selectedHint = {
        stage: 2,
        title: 'Reasoning',
        hintText: 'Break down the question into intermediate steps. What is the next logical deduction from the given premises?',
      };
    } else {
      selectedHint = {
        stage: 3,
        title: 'Application',
        hintText: 'Eliminate choices that contradict the fundamental constraints or physical units of the problem.',
      };
    }
  }

  // Record hint event if attemptId is provided
  if (attemptId) {
    await client
      .from('hint_events')
      .upsert({
        question_attempt_id: attemptId,
        hint_index: targetStage,
        hint_source: 'pre_reviewed',
        requested_at: new Date().toISOString(),
      }, { onConflict: 'question_attempt_id, hint_index' });
  }

  return jsonResponse({
    hint: selectedHint,
    stage: targetStage,
    maxStages: 3,
  });
}
