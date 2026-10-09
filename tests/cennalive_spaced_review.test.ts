import { describe, it, expect } from 'vitest';
import { calculateSpacedReview } from '../functions/_lib/spacedReview';

describe('CENNA.live Spaced Review Engine', () => {
  describe('Interval Progression (1, 3, 7, 14 Days)', () => {
    it('initializes brand new concept at stage 1 (Day 1)', () => {
      const result = calculateSpacedReview({
        currentStage: 0,
        currentMastery: 0,
        isCorrect: true,
        hintsUsed: 0,
      });

      expect(result.newStage).toBe(1);
      expect(result.intervalDays).toBe(1);
      expect(result.eventType).toBe('initial_learning');
      expect(new Date(result.nextReviewAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('advances from Stage 1 (Day 1) to Stage 2 (Day 3) on correct retrieval', () => {
      const result = calculateSpacedReview({
        currentStage: 1,
        currentMastery: 20,
        isCorrect: true,
        hintsUsed: 0,
      });

      expect(result.newStage).toBe(2);
      expect(result.intervalDays).toBe(3);
      expect(result.eventType).toBe('retrieval_success');
    });

    it('advances from Stage 2 (Day 3) to Stage 3 (Day 7) on correct retrieval', () => {
      const result = calculateSpacedReview({
        currentStage: 2,
        currentMastery: 50,
        isCorrect: true,
        hintsUsed: 0,
      });

      expect(result.newStage).toBe(3);
      expect(result.intervalDays).toBe(7);
      expect(result.eventType).toBe('retrieval_success');
    });

    it('advances from Stage 3 (Day 7) to Stage 4 (Day 14) on correct retrieval', () => {
      const result = calculateSpacedReview({
        currentStage: 3,
        currentMastery: 75,
        isCorrect: true,
        hintsUsed: 0,
      });

      expect(result.newStage).toBe(4);
      expect(result.intervalDays).toBe(14);
      expect(result.eventType).toBe('retrieval_success');
    });

    it('caps interval at Day 14 (Stage 4) in pilot schedule', () => {
      const result = calculateSpacedReview({
        currentStage: 4,
        currentMastery: 90,
        isCorrect: true,
        hintsUsed: 0,
      });

      expect(result.newStage).toBe(4);
      expect(result.intervalDays).toBe(14);
    });
  });

  describe('Lapse Reset on Error', () => {
    it('resets stage to 1 and interval to Day 1 when user answers incorrectly from Stage 4', () => {
      const result = calculateSpacedReview({
        currentStage: 4,
        currentMastery: 85,
        isCorrect: false,
        hintsUsed: 0,
      });

      expect(result.newStage).toBe(1);
      expect(result.intervalDays).toBe(1);
      expect(result.eventType).toBe('retrieval_failure');
      expect(result.newMastery).toBe(70); // 85 - 15
    });

    it('resets stage to 1 and interval to Day 1 when user answers incorrectly from Stage 2', () => {
      const result = calculateSpacedReview({
        currentStage: 2,
        currentMastery: 45,
        isCorrect: false,
        hintsUsed: 1,
      });

      expect(result.newStage).toBe(1);
      expect(result.intervalDays).toBe(1);
      expect(result.eventType).toBe('retrieval_failure');
    });
  });

  describe('Hint Attenuation and Mastery Score Clamping', () => {
    it('awards full mastery gain with 0 hints used', () => {
      const res0 = calculateSpacedReview({
        currentStage: 1,
        currentMastery: 30,
        isCorrect: true,
        hintsUsed: 0,
      });

      expect(res0.newMastery).toBe(48); // 30 + 18
    });

    it('applies attenuation when 1 hint used (85% multiplier)', () => {
      const res1 = calculateSpacedReview({
        currentStage: 1,
        currentMastery: 30,
        isCorrect: true,
        hintsUsed: 1,
      });

      const res0 = calculateSpacedReview({
        currentStage: 1,
        currentMastery: 30,
        isCorrect: true,
        hintsUsed: 0,
      });

      expect(res1.newMastery).toBeLessThan(res0.newMastery);
    });

    it('applies heavier attenuation when 3 hints used (40% multiplier)', () => {
      const res3 = calculateSpacedReview({
        currentStage: 1,
        currentMastery: 30,
        isCorrect: true,
        hintsUsed: 3,
      });

      const res1 = calculateSpacedReview({
        currentStage: 1,
        currentMastery: 30,
        isCorrect: true,
        hintsUsed: 1,
      });

      expect(res3.newMastery).toBeLessThan(res1.newMastery);
    });

    it('strictly clamps mastery score between 0 and 100', () => {
      const clampedMax = calculateSpacedReview({
        currentStage: 4,
        currentMastery: 98,
        isCorrect: true,
        hintsUsed: 0,
      });
      expect(clampedMax.newMastery).toBe(100);

      const clampedMin = calculateSpacedReview({
        currentStage: 1,
        currentMastery: 5,
        isCorrect: false,
        hintsUsed: 3,
      });
      expect(clampedMin.newMastery).toBe(0);
    });
  });
});
