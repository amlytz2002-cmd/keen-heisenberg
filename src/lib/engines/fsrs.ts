/**
 * Free Spaced Repetition Scheduler (FSRS) and Mastery Scoring Engine
 *
 * Implements:
 * 1. Retrievability decay curve R(t, S) = (1 + 19/81 * (t / S))^(-0.5)
 * 2. Dynamic review scheduling with hypercorrection detection & confidence calibration
 * 3. Bounded concept mastery tracking theta in [0.0, 1.0]
 */

export interface FSRSReviewScheduleResult {
  stability: number;
  difficulty: number;
  dueAt: string; // ISO 8601 date string
  intervalDays: number;
  isHypercorrection: boolean;
}

export interface FSRSItemState {
  stability: number;
  difficulty: number;
  lastReviewed?: string;
}

export interface FSRSAttemptInput {
  isCorrect: boolean;
  confidence: number;
  now?: Date;
}

/**
 * 24 hours in milliseconds
 */
const ONE_DAY_MS = 86_400_000;

/**
 * Helper to eliminate IEEE-754 floating-point drift while preserving mathematical precision.
 */
function roundPrecision(val: number, decimals: number = 4): number {
  return Number(val.toFixed(decimals));
}

/**
 * Calculates current memory retrievability probability R(t, S) given:
 * - S: memory stability in days (time required for retrievability to fall to 90%)
 * - t: elapsed time in days since last review
 *
 * Formula:
 *   R(t, S) = (1 + (19 / 81) * (t / S))^(-0.5)
 * Properties:
 *   R(0, S) = 1.0
 *   R(S, S) = (1 + 19/81)^(-0.5) = (100/81)^(-0.5) = 9/10 = 0.90
 */
export function calculateRetrievability(stability: number, elapsedDays: number): number {
  if (elapsedDays <= 0) {
    return 1.0;
  }
  if (stability <= 0) {
    return 0.0;
  }

  const factor = (19 / 81) * (elapsedDays / stability);
  const r = Math.pow(1 + factor, -0.5);

  return Math.max(0.0, Math.min(1.0, r));
}

/**
 * Schedules the next review date and computes updated memory stability and difficulty.
 *
 * Scheduling Rules:
 * - Hypercorrection: confidence >= 4 and isCorrect === false
 *     S = 0.0
 *     intervalDays = 1 (mandatory re-test at T + 24 h)
 *     isHypercorrection = true
 *     D = min(10.0, D + 1.5)
 * - Regular incorrect: confidence < 4 and isCorrect === false
 *     S = max(0.2, S * 0.25)
 *     intervalDays = 1 (due in 1 day, T + 24 h)
 *     isHypercorrection = false
 *     D = min(10.0, D + 0.8)
 * - Correct answers: isCorrect === true
 *     Confidence 5 (Easy):  S = S * 2.8,  D = max(1.0, D - 0.5)
 *     Confidence 4 (Good):  S = S * 2.0,  D = D
 *     Confidence 3 (Hard):  S = S * 1.25, D = min(10.0, D + 0.2)
 *     Confidence 1-2 (Guess): S = max(1.0, S * 1.05), D = min(10.0, D + 0.4)
 *     intervalDays = max(1, Math.round(S))
 *     dueAt = now + intervalDays * 86,400,000 ms
 */
export function scheduleNextReview(
  current: { stability: number; difficulty: number; lastReviewed?: string },
  attempt: { isCorrect: boolean; confidence: number; now?: Date }
): FSRSReviewScheduleResult {
  const now = attempt.now instanceof Date ? attempt.now : new Date();
  const curStability = typeof current.stability === 'number' && !isNaN(current.stability)
    ? current.stability
    : 1.0;
  const curDifficulty = typeof current.difficulty === 'number' && !isNaN(current.difficulty)
    ? current.difficulty
    : 5.0;

  let newStability: number;
  let newDifficulty: number;
  let intervalDays: number;
  let isHypercorrection = false;

  if (!attempt.isCorrect) {
    if (attempt.confidence >= 4) {
      // Hypercorrection rule: High confidence error
      newStability = 0.0;
      newDifficulty = Math.min(10.0, curDifficulty + 1.5);
      intervalDays = 1;
      isHypercorrection = true;
    } else {
      // Regular incorrect error: Low/moderate confidence lapse
      newStability = Math.max(0.2, curStability * 0.25);
      newDifficulty = Math.min(10.0, curDifficulty + 0.8);
      intervalDays = 1;
      isHypercorrection = false;
    }
  } else {
    // Correct answers
    isHypercorrection = false;
    // If stability was 0 (e.g. from prior hypercorrection), initialize to base 1.0 for scaling
    const baseS = curStability > 0 ? curStability : 1.0;

    if (attempt.confidence >= 5) {
      // Confidence 5 (Easy)
      newStability = baseS * 2.8;
      newDifficulty = Math.max(1.0, curDifficulty - 0.5);
    } else if (attempt.confidence === 4) {
      // Confidence 4 (Good)
      newStability = baseS * 2.0;
      newDifficulty = curDifficulty;
    } else if (attempt.confidence === 3) {
      // Confidence 3 (Hard)
      newStability = baseS * 1.25;
      newDifficulty = Math.min(10.0, curDifficulty + 0.2);
    } else {
      // Confidence 1-2 (Guess)
      newStability = Math.max(1.0, curStability * 1.05);
      newDifficulty = Math.min(10.0, curDifficulty + 0.4);
    }

    intervalDays = Math.max(1, Math.round(newStability));
  }

  const dueAtDate = new Date(now.getTime() + intervalDays * ONE_DAY_MS);

  return {
    stability: roundPrecision(newStability),
    difficulty: roundPrecision(Math.max(1.0, Math.min(10.0, newDifficulty))),
    dueAt: dueAtDate.toISOString(),
    intervalDays,
    isHypercorrection,
  };
}

/**
 * Updates running concept mastery score theta strictly bounded in [0.0, 1.0].
 *
 * Scoring Dynamics:
 * - Hypercorrection error (confidence >= 4, incorrect): Delta theta = -0.25
 * - Regular incorrect (confidence < 4, incorrect):       Delta theta = -0.10
 * - Correct (Confidence 5):                             Delta theta = +0.20
 * - Correct (Confidence 4):                             Delta theta = +0.15
 * - Correct (Confidence 3):                             Delta theta = +0.10
 * - Correct (Confidence 1-2):                           Delta theta = +0.05
 *
 * Result is strictly clamped within [0.0, 1.0].
 */
export function updateMasteryScore(
  currentTheta: number,
  attempt: { isCorrect: boolean; confidence: number }
): number {
  let delta: number;

  if (!attempt.isCorrect) {
    if (attempt.confidence >= 4) {
      delta = -0.25;
    } else {
      delta = -0.10;
    }
  } else {
    if (attempt.confidence >= 5) {
      delta = 0.20;
    } else if (attempt.confidence === 4) {
      delta = 0.15;
    } else if (attempt.confidence === 3) {
      delta = 0.10;
    } else {
      delta = 0.05;
    }
  }

  const newTheta = currentTheta + delta;
  const clamped = Math.max(0.0, Math.min(1.0, newTheta));

  return roundPrecision(clamped);
}
