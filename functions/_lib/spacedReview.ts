/**
 * CENNA.live Spaced Review & Mastery Engine
 * Implements the core 1-, 3-, 7-, and 14-day intervals with transparent 0-100 mastery scoring.
 */

export interface ReviewScheduleInput {
  currentStage: number; // 0 (new) to 4 (mastered)
  currentMastery: number; // 0 to 100
  isCorrect: boolean;
  hintsUsed: number;
  now?: Date;
}

export interface ReviewScheduleResult {
  newStage: number;
  newMastery: number;
  intervalDays: number;
  nextReviewAt: string; // ISO string
  eventType: 'initial_learning' | 'retrieval_success' | 'retrieval_failure' | 'lapse_reset';
}

export const INTERVAL_DAYS = [0, 1, 3, 7, 14] as const;

export function calculateSpacedReview(input: ReviewScheduleInput): ReviewScheduleResult {
  const now = input.now || new Date();
  const currentStage = Math.max(0, Math.min(4, Math.floor(input.currentStage || 0)));
  const currentMastery = Math.max(0, Math.min(100, Number(input.currentMastery) || 0));

  let newStage = currentStage;
  let masteryDelta = 0;
  let intervalDays = 1;
  let eventType: ReviewScheduleResult['eventType'] = 'retrieval_success';

  if (!input.isCorrect) {
    // Incorrect answer: lapse reset to stage 1 (due in 1 day for mandatory remediation)
    newStage = 1;
    intervalDays = 1;
    masteryDelta = -15;
    eventType = currentStage === 0 ? 'initial_learning' : 'retrieval_failure';
  } else {
    // Correct answer: advance through the 1 -> 3 -> 7 -> 14 day ladder
    if (currentStage === 0) {
      newStage = 1;
      intervalDays = 1;
      masteryDelta = 20;
      eventType = 'initial_learning';
    } else if (currentStage === 1) {
      newStage = 2;
      intervalDays = 3;
      masteryDelta = 18;
    } else if (currentStage === 2) {
      newStage = 3;
      intervalDays = 7;
      masteryDelta = 15;
    } else {
      newStage = 4;
      intervalDays = 14;
      masteryDelta = currentStage === 3 ? 12 : 5;
    }

    // Apply hint attenuation if hints were needed
    if (input.hintsUsed === 1) {
      masteryDelta = Math.round(masteryDelta * 0.85);
    } else if (input.hintsUsed === 2) {
      masteryDelta = Math.round(masteryDelta * 0.65);
    } else if (input.hintsUsed >= 3) {
      masteryDelta = Math.round(masteryDelta * 0.40);
    }
  }

  const newMastery = Math.max(0, Math.min(100, Math.round(currentMastery + masteryDelta)));
  const nextDueDate = new Date(now.getTime() + intervalDays * 86_400_000);

  return {
    newStage,
    newMastery,
    intervalDays,
    nextReviewAt: nextDueDate.toISOString(),
    eventType,
  };
}
