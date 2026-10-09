import { handleOptions, jsonResponse, errorResponse } from '../../../_lib/cors';
import { authenticateUser, getSupabaseUserClient, Env } from '../../../_lib/supabaseServer';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestPost(context: { request: Request; params: { id: string }; env: Env }) {
  const { request, params, env } = context;
  const user = await authenticateUser(request, env);
  if (!user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  const { client } = getSupabaseUserClient(request, env);

  // 1. Fetch exam metadata
  const { data: exam, error: examErr } = await client
    .from('exams')
    .select('id, title, duration_seconds, scoring_config, status')
    .eq('id', params.id)
    .single();

  if (examErr || !exam) {
    return errorResponse('NOT_FOUND', 'Exam not found or unauthorized', 404);
  }

  if (exam.status !== 'published') {
    return errorResponse('NOT_PUBLISHED', 'This exam is not yet available for testing', 403);
  }

  // 2. Check for active in_progress attempt
  const now = new Date();
  const { data: existingAttempt } = await client
    .from('exam_attempts')
    .select('id, started_at, deadline_at, status')
    .eq('exam_id', exam.id)
    .eq('user_id', user.id)
    .eq('status', 'in_progress')
    .single();

  let attemptId = existingAttempt?.id;
  let deadlineAt = existingAttempt?.deadline_at;

  if (existingAttempt) {
    // If deadline has passed, mark as timed_out
    if (new Date(existingAttempt.deadline_at) < now) {
      await client
        .from('exam_attempts')
        .update({ status: 'timed_out', updated_at: now.toISOString() })
        .eq('id', existingAttempt.id);
      attemptId = null;
    }
  }

  // 3. Create new attempt if no active one exists
  if (!attemptId) {
    const calculatedDeadline = new Date(now.getTime() + (exam.duration_seconds || 3600) * 1000);
    deadlineAt = calculatedDeadline.toISOString();

    const { data: newAttempt, error: attemptErr } = await client
      .from('exam_attempts')
      .insert({
        exam_id: exam.id,
        user_id: user.id,
        status: 'in_progress',
        started_at: now.toISOString(),
        deadline_at: deadlineAt,
      })
      .select('id, started_at, deadline_at')
      .single();

    if (attemptErr || !newAttempt) {
      return errorResponse('ATTEMPT_CREATE_FAILED', attemptErr?.message || 'Could not start exam', 500);
    }

    attemptId = newAttempt.id;
  }

  // 4. Fetch exam questions in order (stripping answer_key for security)
  const { data: examQuestions } = await client
    .from('exam_questions')
    .select(`
      position,
      points,
      questions (
        id,
        concept_id,
        question_type,
        question_text,
        options,
        difficulty
      )
    `)
    .eq('exam_id', exam.id)
    .order('position', { ascending: true });

  const sanitizedQuestions = (examQuestions || []).map((eq: any) => ({
    position: eq.position,
    points: eq.points,
    ...(eq.questions || {}),
  }));

  // Fetch already saved answers for this attempt (for refresh recovery)
  const { data: savedAnswers } = await client
    .from('exam_attempt_answers')
    .select('question_id, answer_payload')
    .eq('exam_attempt_id', attemptId);

  return jsonResponse({
    attemptId,
    examTitle: exam.title,
    deadlineAt,
    durationSeconds: exam.duration_seconds,
    questions: sanitizedQuestions,
    savedAnswers: savedAnswers || [],
  });
}
