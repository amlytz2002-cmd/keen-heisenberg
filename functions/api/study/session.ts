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

  // Check for existing in_progress session to support seamless resume on refresh
  const { data: session } = await client
    .from('study_sessions')
    .select(`
      id,
      course_id,
      session_type,
      status,
      started_at,
      planned_duration_seconds,
      courses (id, title)
    `)
    .eq('user_id', user.id)
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (!session) {
    return jsonResponse({ session: null });
  }

  // Fetch previous attempts in this session
  const { data: attempts } = await client
    .from('question_attempts')
    .select('id, question_id, is_correct, score, hints_used, submitted_at')
    .eq('study_session_id', session.id);

  return jsonResponse({
    session,
    completedAttempts: attempts || [],
  });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await authenticateUser(request, env);
  if (!user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  const { client } = getSupabaseUserClient(request, env);

  let courseId = body.courseId;

  // If no course specified, pick user's first enrolled or active course
  if (!courseId) {
    const { data: firstCourse } = await client
      .from('courses')
      .select('id')
      .eq('status', 'published')
      .limit(1)
      .single();

    courseId = firstCourse?.id;
  }

  if (!courseId) {
    return errorResponse('NO_COURSE', 'No published courses available to study', 400);
  }

  // 1. Fetch published concepts for this course
  const { data: concepts } = await client
    .from('concepts')
    .select('id, title, summary, explanation, difficulty')
    .eq('course_id', courseId)
    .eq('status', 'published')
    .limit(3);

  const conceptIds = (concepts || []).map((c) => c.id);

  // 2. Fetch published questions for these concepts
  let questions: any[] = [];
  if (conceptIds.length > 0) {
    const { data: qData } = await client
      .from('questions')
      .select(`
        id,
        concept_id,
        question_type,
        difficulty,
        question_text,
        options,
        status,
        version
      `)
      .in('concept_id', conceptIds)
      .eq('status', 'published')
      .limit(5);

    questions = qData || [];
  }

  // If no concept-specific questions exist, fetch any published question for the course
  if (questions.length === 0) {
    const { data: generalQuestions } = await client
      .from('questions')
      .select(`
        id,
        concept_id,
        question_type,
        difficulty,
        question_text,
        options,
        status,
        version
      `)
      .eq('course_id', courseId)
      .eq('status', 'published')
      .limit(5);

    questions = generalQuestions || [];
  }

  // 3. Create persistent study session
  const { data: newSession, error: sessionErr } = await client
    .from('study_sessions')
    .insert({
      user_id: user.id,
      course_id: courseId,
      session_type: body.sessionType || 'daily_study',
      status: 'in_progress',
      planned_duration_seconds: 1500, // ~25 min target
    })
    .select()
    .single();

  if (sessionErr) {
    return errorResponse('SESSION_CREATE_FAILED', sessionErr.message, 500);
  }

  return jsonResponse({
    session: newSession,
    concepts: concepts || [],
    questions,
    targetDurationMinutes: 25,
  }, 201);
}
