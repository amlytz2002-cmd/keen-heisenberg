import { handleOptions, jsonResponse, errorResponse } from '../../../../_lib/cors';
import { authenticateUser, getSupabaseUserClient, Env } from '../../../../_lib/supabaseServer';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestPost(context: { request: Request; params: { attemptId: string }; env: Env }) {
  const { request, params, env } = context;
  const user = await authenticateUser(request, env);
  if (!user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  const { questionId, answer } = body;

  if (!questionId || answer === undefined) {
    return errorResponse('VALIDATION_ERROR', 'questionId and answer are required', 400);
  }

  const { client } = getSupabaseUserClient(request, env);

  // 1. Verify attempt ownership and deadline
  const { data: attempt, error: attemptErr } = await client
    .from('exam_attempts')
    .select('id, status, deadline_at')
    .eq('id', params.attemptId)
    .eq('user_id', user.id)
    .single();

  if (attemptErr || !attempt) {
    return errorResponse('NOT_FOUND', 'Exam attempt not found', 404);
  }

  if (attempt.status !== 'in_progress') {
    return errorResponse('INVALID_STATE', `Attempt is already ${attempt.status}`, 400);
  }

  const now = new Date();
  if (new Date(attempt.deadline_at) < now) {
    await client
      .from('exam_attempts')
      .update({ status: 'timed_out', updated_at: now.toISOString() })
      .eq('id', attempt.id);

    return errorResponse('DEADLINE_EXPIRED', 'The exam deadline has passed', 403);
  }

  // 2. Persist answer
  const { data: savedAnswer, error: saveErr } = await client
    .from('exam_attempt_answers')
    .upsert({
      exam_attempt_id: attempt.id,
      question_id: questionId,
      answer_payload: { answer },
      question_version: 1,
      updated_at: now.toISOString(),
    }, { onConflict: 'exam_attempt_id, question_id' })
    .select()
    .single();

  if (saveErr) {
    return errorResponse('SAVE_FAILED', saveErr.message, 500);
  }

  return jsonResponse({
    success: true,
    savedAt: now.toISOString(),
    answer: savedAnswer,
  });
}
