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

  const url = new URL(request.url);
  const classroomId = url.searchParams.get('classroomId');
  const { client } = getSupabaseUserClient(request, env);

  // If instructor requested classroom-level analytics
  if (classroomId) {
    const { data: members } = await client
      .from('classroom_members')
      .select('id, user_id, role, status')
      .eq('classroom_id', classroomId);

    const { data: attempts } = await client
      .from('question_attempts')
      .select('id, is_correct, hints_used, score, question_id, questions (concept_id, concepts (title))')
      .limit(200);

    const totalAttempts = attempts?.length || 0;
    const correctAttempts = attempts?.filter((a) => a.is_correct).length || 0;
    const overallAccuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

    // Aggregate missed concepts
    const conceptMistakes: Record<string, { title: string; mistakes: number; total: number }> = {};
    for (const a of attempts || []) {
      const title = (a.questions as any)?.concepts?.title;
      if (title) {
        if (!conceptMistakes[title]) conceptMistakes[title] = { title, mistakes: 0, total: 0 };
        conceptMistakes[title].total += 1;
        if (!a.is_correct) conceptMistakes[title].mistakes += 1;
      }
    }

    const commonlyMissed = Object.values(conceptMistakes)
      .sort((a, b) => b.mistakes - a.mistakes)
      .slice(0, 5);

    return jsonResponse({
      mode: 'classroom',
      enrollmentCount: members?.length || 0,
      totalAttempts,
      overallAccuracy,
      commonlyMissed,
    });
  }

  // Student analytics
  const { data: progress } = await client
    .from('user_concept_progress')
    .select('id, concept_id, mastery_score, review_stage, total_attempts, correct_attempts, concepts (title)')
    .eq('user_id', user.id);

  const { data: examAttempts } = await client
    .from('exam_attempts')
    .select('id, exam_id, score, status, started_at, exams (title)')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(5);

  const conceptsCount = progress?.length || 0;
  const masteredCount = progress?.filter((p) => (Number(p.mastery_score) || 0) >= 80).length || 0;
  const avgMastery = conceptsCount > 0
    ? Math.round(progress!.reduce((acc, p) => acc + (Number(p.mastery_score) || 0), 0) / conceptsCount)
    : 0;

  const totalQuestionsAttempted = progress?.reduce((acc, p) => acc + (p.total_attempts || 0), 0) || 0;
  const totalCorrect = progress?.reduce((acc, p) => acc + (p.correct_attempts || 0), 0) || 0;
  const accuracy = totalQuestionsAttempted > 0
    ? Math.round((totalCorrect / totalQuestionsAttempted) * 100)
    : 0;

  return jsonResponse({
    mode: 'student',
    conceptsTracked: conceptsCount,
    conceptsMastered: masteredCount,
    averageMastery: avgMastery,
    accuracyRate: accuracy,
    totalAttempts: totalQuestionsAttempted,
    examHistory: examAttempts || [],
    conceptProgress: progress || [],
  });
}
