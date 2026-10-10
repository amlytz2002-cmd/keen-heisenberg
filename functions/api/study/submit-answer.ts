import { handleOptions, jsonResponse, errorResponse } from '../../_lib/cors';
import { authenticateUser, getSupabaseUserClient, getSupabaseServiceClient, Env } from '../../_lib/supabaseServer';
import { calculateSpacedReview } from '../../_lib/spacedReview';

export async function onRequestOptions() {
  return handleOptions();
}

function evaluateAnswer(
  questionType: string,
  answerKey: Record<string, any>,
  userAnswer: unknown
): { isCorrect: boolean; score: number } {
  if (userAnswer === undefined || userAnswer === null) {
    return { isCorrect: false, score: 0 };
  }

  if (questionType === 'single_choice' || questionType === 'true_false') {
    const expected = String(answerKey.correctKey || '').trim().toUpperCase();
    const actual = String(userAnswer).trim().toUpperCase();
    const isCorrect = expected.length > 0 && expected === actual;
    return { isCorrect, score: isCorrect ? 1.0 : 0.0 };
  }

  if (questionType === 'multiple_select') {
    const expectedArr: string[] = Array.isArray(answerKey.correctKeys)
      ? answerKey.correctKeys.map((k: string) => String(k).trim().toUpperCase()).sort()
      : [];
    const actualArr: string[] = Array.isArray(userAnswer)
      ? userAnswer.map((k: any) => String(k).trim().toUpperCase()).sort()
      : [];

    const isCorrect =
      expectedArr.length > 0 &&
      expectedArr.length === actualArr.length &&
      expectedArr.every((val, idx) => val === actualArr[idx]);

    return { isCorrect, score: isCorrect ? 1.0 : 0.0 };
  }

  if (questionType === 'numeric') {
    const expectedVal = Number(answerKey.correctValue);
    const tolerancePct = Number(answerKey.tolerancePct) || 2.0;
    const actualVal = Number(userAnswer);

    if (isNaN(expectedVal) || isNaN(actualVal)) {
      return { isCorrect: false, score: 0 };
    }

    const delta = Math.abs(actualVal - expectedVal);
    const allowed = (expectedVal * tolerancePct) / 100;
    const isCorrect = delta <= allowed;
    return { isCorrect, score: isCorrect ? 1.0 : 0.0 };
  }

  if (questionType === 'short_answer') {
    const expected = String(answerKey.correctAnswer || '').trim().toLowerCase();
    const actual = String(userAnswer).trim().toLowerCase();
    const isCorrect = expected.length > 0 && (expected === actual || actual.includes(expected));
    return { isCorrect, score: isCorrect ? 1.0 : 0.0 };
  }

  return { isCorrect: false, score: 0 };
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await authenticateUser(request, env);
  if (!user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  const { questionId, studySessionId, answer, hintsUsed = 0 } = body;

  if (!questionId || answer === undefined) {
    return errorResponse('VALIDATION_ERROR', 'questionId and answer are required', 400);
  }

  const { client } = getSupabaseUserClient(request, env);
  const serviceClient = getSupabaseServiceClient(env);

  // 1. Fetch question and its answer key
  const { data: question, error: qErr } = await client
    .from('questions')
    .select(`
      id,
      concept_id,
      question_type,
      answer_key,
      explanation,
      version,
      status,
      question_sources (
        id,
        resource_id,
        page_number,
        supporting_excerpt
      )
    `)
    .eq('id', questionId)
    .single();

  if (qErr || !question) {
    return errorResponse('NOT_FOUND', 'Question not found or unauthorized', 404);
  }

  // 2. Authoritative grading
  const { isCorrect, score } = evaluateAnswer(
    question.question_type,
    question.answer_key as Record<string, any>,
    answer
  );

  // 3. Persist question attempt
  const { data: attempt, error: attemptErr } = await client
    .from('question_attempts')
    .insert({
      user_id: user.id,
      question_id: question.id,
      study_session_id: studySessionId || null,
      question_version: question.version || 1,
      answer_payload: { answer },
      is_correct: isCorrect,
      score,
      hints_used: Number(hintsUsed) || 0,
      feedback: {
        explanation: question.explanation,
        sources: question.question_sources || [],
      },
      grading_status: 'graded',
    })
    .select()
    .single();

  if (attemptErr) {
    return errorResponse('ATTEMPT_FAILED', attemptErr.message, 500);
  }

  // 4. If question is associated with a concept, update spaced review and mastery
  let masteryState: any = null;
  if (question.concept_id) {
    // Fetch existing progress
    const { data: progress } = await serviceClient
      .from('user_concept_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('concept_id', question.concept_id)
      .single();

    const currentStage = progress?.review_stage || 0;
    const currentMastery = progress?.mastery_score ? Number(progress.mastery_score) : 0;

    // Calculate updated review interval & score
    const reviewResult = calculateSpacedReview({
      currentStage,
      currentMastery,
      isCorrect,
      hintsUsed: Number(hintsUsed) || 0,
    });

    const consecutiveSuccesses = isCorrect ? (progress?.consecutive_successes || 0) + 1 : 0;
    const totalAttempts = (progress?.total_attempts || 0) + 1;
    const correctAttempts = isCorrect ? (progress?.correct_attempts || 0) + 1 : (progress?.correct_attempts || 0);

    const { data: updatedProgress } = await serviceClient
      .from('user_concept_progress')
      .upsert({
        user_id: user.id,
        concept_id: question.concept_id,
        mastery_score: reviewResult.newMastery,
        review_stage: reviewResult.newStage,
        last_reviewed_at: new Date().toISOString(),
        next_review_at: reviewResult.nextReviewAt,
        consecutive_successes: consecutiveSuccesses,
        total_attempts: totalAttempts,
        correct_attempts: correctAttempts,
        algorithm_version: 'cennalive_v1',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    // Log review event audit trail
    await serviceClient.from('review_events').insert({
      user_id: user.id,
      concept_id: question.concept_id,
      question_attempt_id: attempt.id,
      previous_stage: currentStage,
      new_stage: reviewResult.newStage,
      previous_due_at: progress?.next_review_at || null,
      next_due_at: reviewResult.nextReviewAt,
      event_type: reviewResult.eventType,
    });

    masteryState = {
      score: reviewResult.newMastery,
      reviewStage: reviewResult.newStage,
      nextReviewAt: reviewResult.nextReviewAt,
      intervalDays: reviewResult.intervalDays,
    };
  }

  return jsonResponse({
    attemptId: attempt.id,
    isCorrect,
    score,
    feedback: {
      summary: isCorrect ? 'Tebrikler! Doğru çözüm ve başarılı geri çağırma.' : 'Hatalı veya eksik yanıt. İlgili temel kavramı ve kaynak açıklamayı aşağıda inceleyin.',
      explanation: question.explanation,
      sources: question.question_sources || [],
    },
    mastery: masteryState,
  });
}
