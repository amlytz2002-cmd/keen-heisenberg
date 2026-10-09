import { handleOptions, jsonResponse, errorResponse } from '../../../../_lib/cors';
import { authenticateUser, getSupabaseUserClient, Env } from '../../../../_lib/supabaseServer';

export async function onRequestOptions() {
  return handleOptions();
}

function evaluateQuestion(questionType: string, answerKey: Record<string, any>, userAnswer: unknown): boolean {
  if (userAnswer === undefined || userAnswer === null) return false;

  if (questionType === 'single_choice' || questionType === 'true_false') {
    return String(answerKey.correctKey || '').trim().toUpperCase() === String(userAnswer).trim().toUpperCase();
  }

  if (questionType === 'multiple_select') {
    const expected = Array.isArray(answerKey.correctKeys)
      ? answerKey.correctKeys.map((k: string) => String(k).trim().toUpperCase()).sort()
      : [];
    const actual = Array.isArray(userAnswer)
      ? userAnswer.map((k: any) => String(k).trim().toUpperCase()).sort()
      : [];
    return expected.length > 0 && expected.length === actual.length && expected.every((v, i) => v === actual[i]);
  }

  if (questionType === 'numeric') {
    const exp = Number(answerKey.correctValue);
    const tol = Number(answerKey.tolerancePct) || 2.0;
    const act = Number(userAnswer);
    if (isNaN(exp) || isNaN(act)) return false;
    return Math.abs(act - exp) <= (exp * tol) / 100;
  }

  if (questionType === 'short_answer') {
    const exp = String(answerKey.correctAnswer || '').trim().toLowerCase();
    const act = String(userAnswer).trim().toLowerCase();
    return exp.length > 0 && (exp === act || act.includes(exp));
  }

  return false;
}

export async function onRequestPost(context: { request: Request; params: { attemptId: string }; env: Env }) {
  const { request, params, env } = context;
  const user = await authenticateUser(request, env);
  if (!user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  const { client } = getSupabaseUserClient(request, env);

  // 1. Fetch attempt and exam
  const { data: attempt, error: attemptErr } = await client
    .from('exam_attempts')
    .select(`
      id,
      exam_id,
      status,
      deadline_at,
      exams (
        id,
        title,
        scoring_config,
        exam_questions (
          question_id,
          position,
          points,
          questions (
            id,
            concept_id,
            question_type,
            answer_key,
            explanation,
            question_text,
            concepts (id, title)
          )
        )
      )
    `)
    .eq('id', params.attemptId)
    .eq('user_id', user.id)
    .single();

  if (attemptErr || !attempt) {
    return errorResponse('NOT_FOUND', 'Attempt not found', 404);
  }

  if (attempt.status === 'graded' || attempt.status === 'submitted') {
    return jsonResponse({
      message: 'Attempt already finalized',
      attemptId: attempt.id,
      score: attempt.score,
      resultSummary: attempt.result_summary,
    });
  }

  // 2. Fetch all saved answers for this attempt
  const { data: savedAnswers } = await client
    .from('exam_attempt_answers')
    .select('question_id, answer_payload')
    .eq('exam_attempt_id', attempt.id);

  const answerMap = new Map<string, any>();
  for (const a of savedAnswers || []) {
    answerMap.set(a.question_id, (a.answer_payload as any)?.answer);
  }

  // 3. Grade each question
  const examQuestions = (attempt.exams as any)?.exam_questions || [];
  let totalPointsEarned = 0;
  let totalPointsPossible = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const conceptPerformance: Record<string, { conceptId: string; title: string; correct: number; total: number }> = {};
  const questionResults: any[] = [];

  for (const eq of examQuestions) {
    const q = eq.questions;
    if (!q) continue;

    const points = Number(eq.points) || 1.0;
    totalPointsPossible += points;

    const userAnswer = answerMap.get(q.id);
    const isUnanswered = userAnswer === undefined || userAnswer === null || userAnswer === '';

    let isCorrect = false;
    if (!isUnanswered) {
      isCorrect = evaluateQuestion(q.question_type, q.answer_key, userAnswer);
    }

    if (isUnanswered) {
      unansweredCount++;
    } else if (isCorrect) {
      correctCount++;
      totalPointsEarned += points;
    } else {
      incorrectCount++;
    }

    // Concept breakdown
    if (q.concepts?.id) {
      const cId = q.concepts.id;
      if (!conceptPerformance[cId]) {
        conceptPerformance[cId] = {
          conceptId: cId,
          title: q.concepts.title || 'General Concept',
          correct: 0,
          total: 0,
        };
      }
      conceptPerformance[cId].total += 1;
      if (isCorrect) conceptPerformance[cId].correct += 1;
    }

    // Update individual answer record
    await client
      .from('exam_attempt_answers')
      .upsert({
        exam_attempt_id: attempt.id,
        question_id: q.id,
        answer_payload: { answer: userAnswer },
        is_correct: isCorrect,
        points_awarded: isCorrect ? points : 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'exam_attempt_id, question_id' });

    questionResults.push({
      questionId: q.id,
      questionText: q.question_text,
      userAnswer,
      isCorrect,
      explanation: q.explanation,
      conceptTitle: q.concepts?.title,
    });
  }

  // 4. Calculate percentage score
  const finalPercentage = totalPointsPossible > 0
    ? Math.round((totalPointsEarned / totalPointsPossible) * 100)
    : 0;

  const weakConcepts = Object.values(conceptPerformance)
    .filter((c) => c.correct < c.total)
    .map((c) => ({
      conceptId: c.conceptId,
      title: c.title,
      accuracy: Math.round((c.correct / c.total) * 100),
    }));

  const resultSummary = {
    totalQuestions: examQuestions.length,
    correctCount,
    incorrectCount,
    unansweredCount,
    pointsEarned: totalPointsEarned,
    pointsPossible: totalPointsPossible,
    weakConcepts,
    conceptBreakdown: Object.values(conceptPerformance),
  };

  // 5. Update attempt status to graded
  const now = new Date().toISOString();
  await client
    .from('exam_attempts')
    .update({
      status: 'graded',
      submitted_at: now,
      score: finalPercentage,
      result_summary: resultSummary,
      updated_at: now,
    })
    .eq('id', attempt.id);

  return jsonResponse({
    success: true,
    attemptId: attempt.id,
    score: finalPercentage,
    resultSummary,
    questionResults,
  });
}
