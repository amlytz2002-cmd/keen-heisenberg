import { describe, it, expect } from 'vitest';
import {
  calculateRetrievability,
  scheduleNextReview,
  updateMasteryScore,
  FSRSReviewScheduleResult,
} from '../src/lib/engines/fsrs';

describe('FSRS Engine: Retrievability Decay Curve', () => {
  it('yields R(0, S) = 1.0 at zero elapsed time across different stability values', () => {
    expect(calculateRetrievability(1.0, 0)).toBe(1.0);
    expect(calculateRetrievability(5.0, 0)).toBe(1.0);
    expect(calculateRetrievability(10.0, 0)).toBe(1.0);
    expect(calculateRetrievability(30.0, 0)).toBe(1.0);
  });

  it('yields R(S, S) = 0.90 when elapsed time equals stability', () => {
    // Exact mathematical formula: (1 + 19/81)^(-0.5) = (100/81)^(-0.5) = 9/10 = 0.90
    expect(calculateRetrievability(1.0, 1.0)).toBeCloseTo(0.90, 5);
    expect(calculateRetrievability(5.0, 5.0)).toBeCloseTo(0.90, 5);
    expect(calculateRetrievability(10.0, 10.0)).toBeCloseTo(0.90, 5);
    expect(calculateRetrievability(100.0, 100.0)).toBeCloseTo(0.90, 5);
  });

  it('strictly exhibits monotonic decay as elapsed days increase', () => {
    const stability = 10.0;
    const r1 = calculateRetrievability(stability, 1);
    const r5 = calculateRetrievability(stability, 5);
    const r10 = calculateRetrievability(stability, 10);
    const r30 = calculateRetrievability(stability, 30);
    const r60 = calculateRetrievability(stability, 60);

    expect(r1).toBeGreaterThan(r5);
    expect(r5).toBeGreaterThan(r10);
    expect(r10).toBeGreaterThan(r30);
    expect(r30).toBeGreaterThan(r60);
    expect(r60).toBeGreaterThan(0.0);
    expect(r1).toBeLessThanOrEqual(1.0);
  });

  it('handles boundary and edge cases: negative days and zero/negative stability', () => {
    // Negative elapsed time defaults to 1.0
    expect(calculateRetrievability(10.0, -1)).toBe(1.0);
    expect(calculateRetrievability(10.0, -5)).toBe(1.0);

    // Zero stability with elapsed days > 0 has completely decayed to 0.0
    expect(calculateRetrievability(0.0, 1)).toBe(0.0);
    expect(calculateRetrievability(-2.0, 5)).toBe(0.0);

    // Zero elapsed days on 0 stability is 1.0
    expect(calculateRetrievability(0.0, 0)).toBe(1.0);
  });
});

describe('FSRS Engine: Hypercorrection Rule', () => {
  const baseDate = new Date('2026-10-07T12:00:00.000Z');
  const expectedNextDayIso = '2026-10-08T12:00:00.000Z'; // T + 24 h

  it('triggers hypercorrection on confidence 4 failure: resets S to 0, sets dueAt to 24h, flags isHypercorrection', () => {
    const current = { stability: 4.5, difficulty: 5.0 };
    const attempt = { isCorrect: false, confidence: 4, now: baseDate };

    const result: FSRSReviewScheduleResult = scheduleNextReview(current, attempt);

    expect(result.isHypercorrection).toBe(true);
    expect(result.stability).toBe(0.0);
    expect(result.difficulty).toBe(6.5); // min(10.0, 5.0 + 1.5)
    expect(result.intervalDays).toBe(1);
    expect(result.dueAt).toBe(expectedNextDayIso);
  });

  it('triggers hypercorrection on confidence 5 failure: resets S to 0, sets dueAt to 24h, flags isHypercorrection', () => {
    const current = { stability: 12.0, difficulty: 6.0 };
    const attempt = { isCorrect: false, confidence: 5, now: baseDate };

    const result = scheduleNextReview(current, attempt);

    expect(result.isHypercorrection).toBe(true);
    expect(result.stability).toBe(0.0);
    expect(result.difficulty).toBe(7.5); // min(10.0, 6.0 + 1.5)
    expect(result.intervalDays).toBe(1);
    expect(result.dueAt).toBe(expectedNextDayIso);
  });

  it('clamps difficulty at 10.0 maximum when hypercorrection increases difficulty', () => {
    const current = { stability: 5.0, difficulty: 9.2 };
    const attempt = { isCorrect: false, confidence: 5, now: baseDate };

    const result = scheduleNextReview(current, attempt);

    expect(result.difficulty).toBe(10.0);
    expect(result.stability).toBe(0.0);
    expect(result.isHypercorrection).toBe(true);
  });
});

describe('FSRS Engine: Regular Incorrect Reviews', () => {
  const baseDate = new Date('2026-10-07T12:00:00.000Z');
  const expectedNextDayIso = '2026-10-08T12:00:00.000Z';

  it('does not set isHypercorrection on confidence 1, 2, or 3 lapses', () => {
    for (const conf of [1, 2, 3]) {
      const current = { stability: 4.0, difficulty: 5.0 };
      const attempt = { isCorrect: false, confidence: conf, now: baseDate };

      const result = scheduleNextReview(current, attempt);

      expect(result.isHypercorrection).toBe(false);
      expect(result.intervalDays).toBe(1);
      expect(result.dueAt).toBe(expectedNextDayIso);
    }
  });

  it('decays stability to max(0.2, S * 0.25) on regular errors', () => {
    // S = 4.0 -> S * 0.25 = 1.0 (greater than 0.2)
    const res1 = scheduleNextReview(
      { stability: 4.0, difficulty: 5.0 },
      { isCorrect: false, confidence: 3, now: baseDate }
    );
    expect(res1.stability).toBe(1.0);
    expect(res1.difficulty).toBe(5.8); // min(10.0, 5.0 + 0.8)

    // S = 0.4 -> S * 0.25 = 0.1 -> clamped to minimum 0.2
    const res2 = scheduleNextReview(
      { stability: 0.4, difficulty: 5.0 },
      { isCorrect: false, confidence: 2, now: baseDate }
    );
    expect(res2.stability).toBe(0.2);

    // S = 0.0 -> max(0.2, 0) = 0.2
    const res3 = scheduleNextReview(
      { stability: 0.0, difficulty: 5.0 },
      { isCorrect: false, confidence: 1, now: baseDate }
    );
    expect(res3.stability).toBe(0.2);
  });

  it('caps difficulty at 10.0 on regular lapse', () => {
    const res = scheduleNextReview(
      { stability: 3.0, difficulty: 9.6 },
      { isCorrect: false, confidence: 2, now: baseDate }
    );
    expect(res.difficulty).toBe(10.0);
  });
});

describe('FSRS Engine: Correct Answers at All Confidence Levels', () => {
  const baseDate = new Date('2026-10-07T12:00:00.000Z');

  it('scales S by 2.8 and decreases D by 0.5 on Confidence 5 (Easy)', () => {
    const current = { stability: 2.0, difficulty: 5.0 };
    const attempt = { isCorrect: true, confidence: 5, now: baseDate };

    const result = scheduleNextReview(current, attempt);

    expect(result.isHypercorrection).toBe(false);
    expect(result.stability).toBe(5.6); // 2.0 * 2.8
    expect(result.difficulty).toBe(4.5); // max(1.0, 5.0 - 0.5)
    expect(result.intervalDays).toBe(6); // round(5.6) = 6
    const expectedDue = new Date(baseDate.getTime() + 6 * 86_400_000).toISOString();
    expect(result.dueAt).toBe(expectedDue);
  });

  it('clamps minimum difficulty at 1.0 on Confidence 5', () => {
    const current = { stability: 2.0, difficulty: 1.2 };
    const attempt = { isCorrect: true, confidence: 5, now: baseDate };

    const result = scheduleNextReview(current, attempt);
    expect(result.difficulty).toBe(1.0); // max(1.0, 1.2 - 0.5)
  });

  it('scales S by 2.0 and keeps D unchanged on Confidence 4 (Good)', () => {
    const current = { stability: 3.0, difficulty: 5.4 };
    const attempt = { isCorrect: true, confidence: 4, now: baseDate };

    const result = scheduleNextReview(current, attempt);

    expect(result.isHypercorrection).toBe(false);
    expect(result.stability).toBe(6.0); // 3.0 * 2.0
    expect(result.difficulty).toBe(5.4); // unchanged
    expect(result.intervalDays).toBe(6); // round(6.0)
    const expectedDue = new Date(baseDate.getTime() + 6 * 86_400_000).toISOString();
    expect(result.dueAt).toBe(expectedDue);
  });

  it('scales S by 1.25 and increases D by 0.2 on Confidence 3 (Hard)', () => {
    const current = { stability: 4.0, difficulty: 5.0 };
    const attempt = { isCorrect: true, confidence: 3, now: baseDate };

    const result = scheduleNextReview(current, attempt);

    expect(result.isHypercorrection).toBe(false);
    expect(result.stability).toBe(5.0); // 4.0 * 1.25
    expect(result.difficulty).toBe(5.2); // min(10.0, 5.0 + 0.2)
    expect(result.intervalDays).toBe(5);
    const expectedDue = new Date(baseDate.getTime() + 5 * 86_400_000).toISOString();
    expect(result.dueAt).toBe(expectedDue);
  });

  it('scales S by 1.05 with min 1.0 and increases D by 0.4 on Confidence 1-2 (Guess)', () => {
    // Confidence 2
    const current1 = { stability: 2.0, difficulty: 5.0 };
    const result1 = scheduleNextReview(current1, { isCorrect: true, confidence: 2, now: baseDate });

    expect(result1.stability).toBe(2.1); // max(1.0, 2.0 * 1.05)
    expect(result1.difficulty).toBe(5.4); // min(10.0, 5.0 + 0.4)
    expect(result1.intervalDays).toBe(2); // round(2.1)

    // Confidence 1 with low initial stability S = 0.5 -> clamps S to at least 1.0
    const current2 = { stability: 0.5, difficulty: 5.0 };
    const result2 = scheduleNextReview(current2, { isCorrect: true, confidence: 1, now: baseDate });

    expect(result2.stability).toBe(1.0); // max(1.0, 0.5 * 1.05 = 0.525) -> 1.0
    expect(result2.difficulty).toBe(5.4);
    expect(result2.intervalDays).toBe(1);
  });

  it('recovers properly from stability 0 after a prior hypercorrection', () => {
    const current = { stability: 0.0, difficulty: 6.5 };
    const attempt = { isCorrect: true, confidence: 4, now: baseDate };

    const result = scheduleNextReview(current, attempt);

    // base 1.0 * 2.0 = 2.0 days
    expect(result.stability).toBe(2.0);
    expect(result.difficulty).toBe(6.5);
    expect(result.intervalDays).toBe(2);
    expect(result.isHypercorrection).toBe(false);
  });
});

describe('Mastery Scoring: Concept Mastery Theta Updates and Clamping', () => {
  it('decreases theta by 0.25 on hypercorrection error', () => {
    expect(updateMasteryScore(0.80, { isCorrect: false, confidence: 4 })).toBe(0.55);
    expect(updateMasteryScore(0.80, { isCorrect: false, confidence: 5 })).toBe(0.55);
  });

  it('decreases theta by 0.10 on regular incorrect response', () => {
    expect(updateMasteryScore(0.50, { isCorrect: false, confidence: 3 })).toBe(0.40);
    expect(updateMasteryScore(0.50, { isCorrect: false, confidence: 2 })).toBe(0.40);
    expect(updateMasteryScore(0.50, { isCorrect: false, confidence: 1 })).toBe(0.40);
  });

  it('increases theta by +0.20 on correct Confidence 5 (Easy)', () => {
    expect(updateMasteryScore(0.40, { isCorrect: true, confidence: 5 })).toBe(0.60);
    expect(updateMasteryScore(0.10, { isCorrect: true, confidence: 5 })).toBe(0.30);
  });

  it('increases theta by +0.15 on correct Confidence 4 (Good)', () => {
    expect(updateMasteryScore(0.50, { isCorrect: true, confidence: 4 })).toBe(0.65);
    expect(updateMasteryScore(0.20, { isCorrect: true, confidence: 4 })).toBe(0.35);
  });

  it('increases theta by +0.10 on correct Confidence 3 (Hard)', () => {
    expect(updateMasteryScore(0.50, { isCorrect: true, confidence: 3 })).toBe(0.60);
    expect(updateMasteryScore(0.25, { isCorrect: true, confidence: 3 })).toBe(0.35);
  });

  it('increases theta by +0.05 on correct Confidence 1-2 (Guess)', () => {
    expect(updateMasteryScore(0.50, { isCorrect: true, confidence: 2 })).toBe(0.55);
    expect(updateMasteryScore(0.50, { isCorrect: true, confidence: 1 })).toBe(0.55);
  });

  it('strictly clamps theta to lower bound 0.0', () => {
    // Hypercorrection from near-zero
    expect(updateMasteryScore(0.15, { isCorrect: false, confidence: 5 })).toBe(0.0);
    expect(updateMasteryScore(0.0, { isCorrect: false, confidence: 4 })).toBe(0.0);

    // Regular error from near-zero
    expect(updateMasteryScore(0.05, { isCorrect: false, confidence: 2 })).toBe(0.0);
    expect(updateMasteryScore(0.0, { isCorrect: false, confidence: 1 })).toBe(0.0);

    // Already below 0.0
    expect(updateMasteryScore(-0.2, { isCorrect: false, confidence: 3 })).toBe(0.0);
  });

  it('strictly clamps theta to upper bound 1.0', () => {
    // Correct conf 5 from high theta
    expect(updateMasteryScore(0.90, { isCorrect: true, confidence: 5 })).toBe(1.0);
    expect(updateMasteryScore(0.85, { isCorrect: true, confidence: 5 })).toBe(1.0);

    // Correct conf 4 from high theta
    expect(updateMasteryScore(0.95, { isCorrect: true, confidence: 4 })).toBe(1.0);

    // Already at or above 1.0
    expect(updateMasteryScore(1.0, { isCorrect: true, confidence: 3 })).toBe(1.0);
    expect(updateMasteryScore(1.2, { isCorrect: true, confidence: 5 })).toBe(1.0);
  });
});
