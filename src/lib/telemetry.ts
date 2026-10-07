import { supabase } from './supabaseClient';
import { scheduleNextReview, updateMasteryScore, FSRSReviewScheduleResult } from './engines/fsrs';

export interface AttemptPayload {
  itemId: string;
  conceptId: string;
  selectedKey?: string;
  confidence: number;
  isCorrect: boolean;
  timeSpentMs?: number;
  scratchpadData?: Record<string, number>;
  primaryMisconceptionTag?: string;
  firstFailingNodeId?: string;
  currentTheta?: number;
}

export interface TelemetryResult {
  attemptId: string;
  nextSchedule: FSRSReviewScheduleResult;
  updatedTheta: number;
}

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isValidUuid(val?: string): boolean {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

export async function recordAttemptAndTelemetry(payload: AttemptPayload): Promise<TelemetryResult> {
  // 1. Calculate FSRS review schedule
  const nextSchedule = scheduleNextReview(
    { stability: 1.0, difficulty: 5.0 },
    { isCorrect: payload.isCorrect, confidence: payload.confidence }
  );

  // 2. Calculate updated concept mastery theta
  const baseTheta = typeof payload.currentTheta === 'number' ? payload.currentTheta : 0.5;
  const updatedTheta = updateMasteryScore(baseTheta, {
    isCorrect: payload.isCorrect,
    confidence: payload.confidence,
  });

  const attemptId = generateUuid();

  // 3. Persist to Supabase if session active
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: attemptRow } = await supabase
        .from('attempts')
        .insert({
          id: attemptId,
          user_id: session.user.id,
          item_id: isValidUuid(payload.itemId) ? payload.itemId : null,
          submitted_answer: JSON.stringify(payload.scratchpadData || {}),
          is_correct: payload.isCorrect,
          confidence: payload.confidence,
          latency_ms: payload.timeSpentMs ?? 4000,
          hint_level: 0,
          assisted: false,
        })
        .select()
        .maybeSingle();

      const resolvedAttemptId = attemptRow?.id || attemptId;

      if (!payload.isCorrect && payload.primaryMisconceptionTag) {
        await supabase.from('error_events').insert({
          attempt_id: resolvedAttemptId,
          user_id: session.user.id,
          concept_id: isValidUuid(payload.conceptId) ? payload.conceptId : null,
          error_family: 'DAG_NODE_FAILURE',
          misconception_tag: payload.primaryMisconceptionTag,
          failed_node: payload.firstFailingNodeId || null,
        });
      }

      if (isValidUuid(payload.conceptId)) {
        await supabase.from('user_mastery').upsert({
          user_id: session.user.id,
          concept_id: payload.conceptId,
          mastery_score: updatedTheta,
        });
      }

      if (isValidUuid(payload.itemId)) {
        await supabase.from('review_schedule').upsert({
          user_id: session.user.id,
          item_id: payload.itemId,
          stability: nextSchedule.stability,
          difficulty: nextSchedule.difficulty,
          due_at: nextSchedule.dueAt,
        });
      }
    }
  } catch (err) {
    console.warn('Telemetry persistence encountered error:', err);
  }

  return {
    attemptId,
    nextSchedule,
    updatedTheta,
  };
}
