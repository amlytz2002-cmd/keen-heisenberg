import { describe, it, expect } from 'vitest';

/**
 * Server Exam Engine Grading and Deadline Enforcement Logic
 */
function evaluateDeadline(startedAtIso: string, durationMinutes: number, submissionTimeIso: string, graceSeconds: number = 30): { isValid: boolean; secondsLate: number } {
  const startedAt = new Date(startedAtIso).getTime();
  const durationMs = durationMinutes * 60_000;
  const deadlineMs = startedAt + durationMs;
  const submissionMs = new Date(submissionTimeIso).getTime();
  const graceMs = graceSeconds * 1000;

  if (submissionMs > deadlineMs + graceMs) {
    const secondsLate = Math.round((submissionMs - deadlineMs) / 1000);
    return { isValid: false, secondsLate };
  }
  return { isValid: true, secondsLate: 0 };
}

function gradeQuestion(
  type: 'single_choice' | 'multiple_choice' | 'numeric',
  userAnswer: any,
  correctAnswer: any,
  tolerance: number = 0.05
): boolean {
  if (type === 'single_choice') {
    return String(userAnswer).trim().toUpperCase() === String(correctAnswer).trim().toUpperCase();
  }

  if (type === 'multiple_choice') {
    if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) return false;
    const sortedUser = [...userAnswer].map((k) => String(k).trim().toUpperCase()).sort();
    const sortedCorrect = [...correctAnswer].map((k) => String(k).trim().toUpperCase()).sort();
    return sortedUser.length === sortedCorrect.length && sortedUser.every((v, i) => v === sortedCorrect[i]);
  }

  if (type === 'numeric') {
    const uNum = parseFloat(String(userAnswer));
    const cNum = parseFloat(String(correctAnswer));
    if (isNaN(uNum) || isNaN(cNum)) return false;
    const diff = Math.abs(uNum - cNum);
    const maxAllowedDiff = Math.abs(cNum * tolerance);
    return diff <= Math.max(maxAllowedDiff, 0.001);
  }

  return false;
}

function calculateExamDiagnostics(
  questions: Array<{ id: string; topic: string; type: any; correctAnswer: any }>,
  answers: { [qid: string]: any }
) {
  let totalPoints = 0;
  const topicStats: { [topic: string]: { total: number; correct: number } } = {};

  for (const q of questions) {
    if (!topicStats[q.topic]) {
      topicStats[q.topic] = { total: 0, correct: 0 };
    }
    topicStats[q.topic].total += 1;

    const uAns = answers[q.id];
    const isCorrect = uAns !== undefined && gradeQuestion(q.type, uAns, q.correctAnswer);
    if (isCorrect) {
      totalPoints += 1;
      topicStats[q.topic].correct += 1;
    }
  }

  const scorePct = Math.round((totalPoints / questions.length) * 100);
  const topicBreakdown = Object.entries(topicStats).map(([topic, stat]) => {
    const accuracy = Math.round((stat.correct / stat.total) * 100);
    return {
      topic,
      total: stat.total,
      correct: stat.correct,
      accuracy,
      needs_remediation: accuracy < 75,
    };
  });

  return {
    scorePct,
    topicBreakdown,
  };
}

describe('CENNA.live Timed Exam Engine', () => {
  describe('Server Deadline Enforcement', () => {
    it('approves submission made within allotted duration', () => {
      const startedAt = '2026-10-09T10:00:00.000Z';
      const durationMinutes = 30; // deadline: 10:30:00
      const submittedAt = '2026-10-09T10:28:45.000Z';

      const result = evaluateDeadline(startedAt, durationMinutes, submittedAt);
      expect(result.isValid).toBe(true);
      expect(result.secondsLate).toBe(0);
    });

    it('approves submission made within 30-second network grace window', () => {
      const startedAt = '2026-10-09T10:00:00.000Z';
      const durationMinutes = 30; // deadline: 10:30:00
      const submittedAt = '2026-10-09T10:30:20.000Z'; // 20s past deadline

      const result = evaluateDeadline(startedAt, durationMinutes, submittedAt);
      expect(result.isValid).toBe(true);
    });

    it('strictly rejects submission received after deadline and grace window', () => {
      const startedAt = '2026-10-09T10:00:00.000Z';
      const durationMinutes = 30; // deadline: 10:30:00
      const submittedAt = '2026-10-09T10:32:00.000Z'; // 120s past deadline

      const result = evaluateDeadline(startedAt, durationMinutes, submittedAt);
      expect(result.isValid).toBe(false);
      expect(result.secondsLate).toBe(120);
    });
  });

  describe('Question Evaluation & Types', () => {
    it('correctly evaluates single choice with case-insensitivity', () => {
      expect(gradeQuestion('single_choice', 'b', 'B')).toBe(true);
      expect(gradeQuestion('single_choice', 'A', 'B')).toBe(false);
    });

    it('correctly evaluates multiple choice with array order independence', () => {
      expect(gradeQuestion('multiple_choice', ['A', 'C'], ['C', 'A'])).toBe(true);
      expect(gradeQuestion('multiple_choice', ['A'], ['A', 'C'])).toBe(false);
      expect(gradeQuestion('multiple_choice', ['A', 'B', 'C'], ['A', 'C'])).toBe(false);
    });

    it('correctly evaluates numeric questions within ±5% scientific tolerance', () => {
      // Correct: 52.4 mL/min. ±5% range is [49.78, 55.02]
      expect(gradeQuestion('numeric', 52.4, 52.4)).toBe(true);
      expect(gradeQuestion('numeric', 51.5, 52.4)).toBe(true);
      expect(gradeQuestion('numeric', 54.0, 52.4)).toBe(true);
      // Beyond tolerance
      expect(gradeQuestion('numeric', 45.0, 52.4)).toBe(false);
      expect(gradeQuestion('numeric', 60.0, 52.4)).toBe(false);
    });
  });

  describe('Topic Diagnostics and Remediation Plan', () => {
    it('flags topics with <75% accuracy for mandatory review remediation', () => {
      const examQuestions = [
        { id: 'q1', topic: 'Cockcroft-Gault', type: 'single_choice' as const, correctAnswer: 'B' },
        { id: 'q2', topic: 'Cockcroft-Gault', type: 'single_choice' as const, correctAnswer: 'A' },
        { id: 'q3', topic: 'Elimination Kinetics', type: 'single_choice' as const, correctAnswer: 'C' },
        { id: 'q4', topic: 'Elimination Kinetics', type: 'single_choice' as const, correctAnswer: 'D' },
      ];

      const answers = {
        q1: 'B', // correct
        q2: 'A', // correct (Cockcroft-Gault: 2/2 = 100%)
        q3: 'C', // correct
        q4: 'A', // wrong (Elimination Kinetics: 1/2 = 50%)
      };

      const diagnostics = calculateExamDiagnostics(examQuestions, answers);
      expect(diagnostics.scorePct).toBe(75);

      const cgTopic = diagnostics.topicBreakdown.find((t) => t.topic === 'Cockcroft-Gault');
      expect(cgTopic?.needs_remediation).toBe(false);
      expect(cgTopic?.accuracy).toBe(100);

      const ekTopic = diagnostics.topicBreakdown.find((t) => t.topic === 'Elimination Kinetics');
      expect(ekTopic?.needs_remediation).toBe(true);
      expect(ekTopic?.accuracy).toBe(50);
    });
  });
});
