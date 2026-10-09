import { handleOptions, jsonResponse, errorResponse } from '../../_lib/cors';
import { authenticateUser, getSupabaseUserClient, Env } from '../../_lib/supabaseServer';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await authenticateUser(request, env);
  if (!user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  const { client } = getSupabaseUserClient(request, env);
  const { data: exams, error } = await client
    .from('exams')
    .select(`
      id,
      title,
      description,
      duration_seconds,
      max_attempts,
      status,
      created_at,
      course_id,
      courses (id, title),
      exam_questions (count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return errorResponse('DB_ERROR', error.message, 500);
  }

  return jsonResponse({ exams: exams || [] });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await authenticateUser(request, env);
  if (!user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const courseId = body.courseId;
  const durationSeconds = Number(body.durationSeconds) || 3600;
  const questionIds = Array.isArray(body.questionIds) ? body.questionIds : [];

  if (!title || !courseId) {
    return errorResponse('VALIDATION_ERROR', 'title and courseId are required', 400);
  }

  const { client } = getSupabaseUserClient(request, env);

  // Create exam record
  const { data: exam, error: examErr } = await client
    .from('exams')
    .insert({
      title,
      description: body.description || '',
      course_id: courseId,
      classroom_id: body.classroomId || null,
      created_by: user.id,
      duration_seconds: durationSeconds,
      status: body.status || 'published',
      scoring_config: body.scoringConfig || { passing_score: 70, penalty_per_incorrect: 0 },
    })
    .select()
    .single();

  if (examErr) {
    return errorResponse('INSERT_FAILED', examErr.message, 500);
  }

  // Associate questions with order and points
  if (questionIds.length > 0) {
    const examQuestions = questionIds.map((qId: string, idx: number) => ({
      exam_id: exam.id,
      question_id: qId,
      position: idx,
      points: 1.0,
    }));

    await client.from('exam_questions').insert(examQuestions);
  }

  return jsonResponse({ exam }, 201);
}
