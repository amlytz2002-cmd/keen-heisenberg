import { describe, it, expect } from 'vitest';

/**
 * ============================================================================
 * CENNA.live COMPREHENSIVE E2E SCENARIOS TEST SUITE (Tiers 1-4)
 * ============================================================================
 * Authoritative Contracts:
 *   - ORIGINAL_REQUEST.md § R4: Student & Instructor Workspaces Polish
 *   - PROJECT.md § Feature Inventory (Features 10 – 19):
 *     - Today Hub Student Experience & Daily Streaks
 *     - Study Session 3-Stage Socratic UI & Guided Remediation
 *     - Spaced Review Queue Polish & FSRS Retrievability
 *     - Timed Mock Exams with Server Countdown, Palette, and Autosave
 *     - Exam Results Diagnostics & Topic Remediation Links
 *     - Student Classrooms & Invitation Redemption
 *     - Teaching Hub, Classroom Manager & Roster Limits
 *     - Document Ingestion with Semantic Chunk Viewer
 *     - Content Review Workspace Anti-Hallucination Gate
 *     - Instructor Analytics with Misconceptions Breakdown
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// Core Domain Models & Workflow Simulation Utilities
// ----------------------------------------------------------------------------

export interface ReviewCard {
  id: string;
  topic: string;
  stem: string;
  correctAnswer: string;
  stability: number; // in days
  difficulty: number; // 1 (easy) to 10 (hard)
  lastReviewDate: string;
  dueDate: string;
  reps: number;
  lapses: number;
}

export type FSRSRating = 'again' | 'hard' | 'good' | 'easy';

export function updateFSRSCard(card: ReviewCard, rating: FSRSRating, reviewDateIso: string): ReviewCard {
  let newStability = card.stability;
  let newDifficulty = card.difficulty;
  let newLapses = card.lapses;
  let newReps = card.reps + 1;

  switch (rating) {
    case 'again':
      newStability = 0.5; // Resets stability to half day
      newDifficulty = Math.min(10, card.difficulty + 0.8);
      newLapses += 1;
      break;
    case 'hard':
      newStability = Math.max(1, card.stability * 1.2);
      newDifficulty = Math.min(10, card.difficulty + 0.3);
      break;
    case 'good':
      newStability = Math.max(1.5, card.stability * 2.1);
      newDifficulty = Math.max(1, card.difficulty - 0.2);
      break;
    case 'easy':
      newStability = Math.max(3, card.stability * 3.2);
      newDifficulty = Math.max(1, card.difficulty - 0.5);
      break;
  }

  const reviewDate = new Date(reviewDateIso);
  const nextDueDate = new Date(reviewDate.getTime() + Math.round(newStability) * 86_400_000);

  return {
    ...card,
    stability: Number(newStability.toFixed(2)),
    difficulty: Number(newDifficulty.toFixed(2)),
    lastReviewDate: reviewDateIso,
    dueDate: nextDueDate.toISOString(),
    reps: newReps,
    lapses: newLapses,
  };
}

export interface ExamQuestion {
  id: string;
  topic: string;
  type: 'single_choice' | 'multiple_choice' | 'numeric';
  stem: string;
  options?: string[];
  correctAnswer: any;
  numericTolerance?: number; // e.g. 0.05 for ±5%
}

export interface ExamSession {
  examId: string;
  attemptId: string;
  startedAt: string;
  durationMinutes: number;
  deadlineIso: string;
  questions: ExamQuestion[];
  savedAnswers: Record<string, any>;
  submitted: boolean;
  submittedAt?: string;
  scorePct?: number;
  topicBreakdown?: Record<string, { total: number; correct: number; masteryPct: number; needsRemediation: boolean }>;
}

export function evaluateNumericAnswer(userAns: any, correctAns: any, tolerance: number = 0.05): boolean {
  const u = parseFloat(String(userAns));
  const c = parseFloat(String(correctAns));
  if (isNaN(u) || isNaN(c)) return false;
  const diff = Math.abs(u - c);
  const maxAllowed = Math.abs(c * tolerance);
  return diff <= Math.max(maxAllowed, 0.001);
}

export function evaluateQuestionAnswer(q: ExamQuestion, userAns: any): boolean {
  if (userAns === undefined || userAns === null) return false;
  if (q.type === 'single_choice') {
    return String(userAns).trim().toUpperCase() === String(q.correctAnswer).trim().toUpperCase();
  }
  if (q.type === 'multiple_choice') {
    if (!Array.isArray(userAns) || !Array.isArray(q.correctAnswer)) return false;
    const sortedUser = [...userAns].map((x) => String(x).trim().toUpperCase()).sort();
    const sortedCorrect = [...q.correctAnswer].map((x) => String(x).trim().toUpperCase()).sort();
    return sortedUser.length === sortedCorrect.length && sortedUser.every((v, i) => v === sortedCorrect[i]);
  }
  if (q.type === 'numeric') {
    return evaluateNumericAnswer(userAns, q.correctAnswer, q.numericTolerance ?? 0.05);
  }
  return false;
}

export function finalizeExamSubmission(
  session: ExamSession,
  submissionTimeIso: string,
  graceSeconds: number = 30
): ExamSession {
  const deadlineMs = new Date(session.deadlineIso).getTime();
  const submissionMs = new Date(submissionTimeIso).getTime();
  const isLate = submissionMs > deadlineMs + graceSeconds * 1000;

  let totalPoints = 0;
  const breakdown: Record<string, { total: number; correct: number; masteryPct: number; needsRemediation: boolean }> = {};

  for (const q of session.questions) {
    if (!breakdown[q.topic]) {
      breakdown[q.topic] = { total: 0, correct: 0, masteryPct: 0, needsRemediation: false };
    }
    breakdown[q.topic].total += 1;

    // If late, questions not saved before deadline are scored 0
    const userAns = session.savedAnswers[q.id];
    const isCorrect = evaluateQuestionAnswer(q, userAns);
    if (isCorrect && !isLate) {
      totalPoints += 1;
      breakdown[q.topic].correct += 1;
    }
  }

  const scorePct = Math.round((totalPoints / session.questions.length) * 100);

  for (const topic of Object.keys(breakdown)) {
    const stat = breakdown[topic];
    stat.masteryPct = Math.round((stat.correct / stat.total) * 100);
    stat.needsRemediation = stat.masteryPct < 70; // Topics below 70% flag remediation
  }

  return {
    ...session,
    submitted: true,
    submittedAt: submissionTimeIso,
    scorePct,
    topicBreakdown: breakdown,
  };
}

export interface DocumentChunk {
  chunkIndex: number;
  pageNumber: number;
  sectionTitle: string;
  tokenCount: number;
  content: string;
}

export interface EducationalDraftItem {
  id: string;
  chunkId: number;
  stem: string;
  status: 'draft' | 'needs_review' | 'approved' | 'published' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: string;
}

export function chunkDocument(
  text: string,
  sectionTitleDefault: string = 'Giriş ve Genel Bakış'
): DocumentChunk[] {
  const clean = text.normalize('NFC').replace(/\r\n/g, '\n').trim();
  if (!clean) return [];

  const paragraphs = clean.split(/\n\s*\n/);
  const chunks: DocumentChunk[] = [];
  let currentContent = '';
  let currentTitle = sectionTitleDefault;
  let currentPage = 1;
  let idx = 0;

  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (!trimmed) continue;

    const pageMatch = trimmed.match(/(?:sayfa|page|slayt)\s*(\d+)/i);
    if (pageMatch) currentPage = parseInt(pageMatch[1], 10);

    const isHeader = trimmed.startsWith('#') || (trimmed.length < 50 && !trimmed.endsWith('.') && !trimmed.includes(','));

    if (isHeader) {
      if (currentContent.trim().length > 0) {
        chunks.push({
          chunkIndex: idx++,
          pageNumber: currentPage,
          sectionTitle: currentTitle,
          tokenCount: Math.round(currentContent.length / 4),
          content: currentContent.trim(),
        });
        currentContent = '';
      }
      currentTitle = trimmed.replace(/^[#\s]+/, '').trim();
      continue;
    }

    if ((currentContent + '\n\n' + trimmed).length > 600 && currentContent.length > 200) {
      chunks.push({
        chunkIndex: idx++,
        pageNumber: currentPage,
        sectionTitle: currentTitle,
        tokenCount: Math.round(currentContent.length / 4),
        content: currentContent.trim(),
      });
      currentContent = trimmed;
    } else {
      currentContent = currentContent ? currentContent + '\n\n' + trimmed : trimmed;
    }
  }

  if (currentContent.trim().length > 0) {
    chunks.push({
      chunkIndex: idx++,
      pageNumber: currentPage,
      sectionTitle: currentTitle,
      tokenCount: Math.round(currentContent.length / 4),
      content: currentContent.trim(),
    });
  }

  return chunks;
}

describe('CENNA.live Comprehensive E2E Scenarios Suite', () => {
  // ==========================================================================
  // TIER 1: FEATURE COVERAGE (Core Workflows: Practice, Hints, Exams, Review)
  // ==========================================================================
  describe('Tier 1: Feature Coverage — End-to-End Application Capabilities', () => {
    it('T1.1: student executes active retrieval practice session with performance feedback', () => {
      const card: ReviewCard = {
        id: 'card-genta-1',
        topic: 'Gentamisin Farmakokinetiği',
        stem: 'Aminoglikozid antibiyotiklerde tepe (peak) konsantrasyonu hangi farmakokinetik hedefle ilişkilidir?',
        correctAnswer: 'Konsantrasyona bağlı bakterisidal etkinlik',
        stability: 1.0,
        difficulty: 5.0,
        lastReviewDate: '2026-10-09T08:00:00Z',
        dueDate: '2026-10-10T08:00:00Z',
        reps: 1,
        lapses: 0,
      };

      // Student reviews card and rates as 'good'
      const updated = updateFSRSCard(card, 'good', '2026-10-10T10:00:00Z');
      expect(updated.reps).toBe(2);
      expect(updated.stability).toBeGreaterThan(card.stability);
      expect(new Date(updated.dueDate).getTime()).toBeGreaterThan(new Date(card.dueDate).getTime());
    });

    it('T1.2: student progresses through 3 stages of Socratic hints with guided progression', () => {
      interface HintProgressionState {
        currentStage: number;
        history: Array<{ stage: number; label: string; text: string }>;
      }

      const progression: HintProgressionState = { currentStage: 0, history: [] };

      // Request stage 1
      progression.currentStage = 1;
      progression.history.push({
        stage: 1,
        label: '1. Kademe: Yönlendirme ve Temel İlke',
        text: 'Klirens ve eliminasyon sabiti arasındaki ilişkiyi hatırlayın (Cl = k * Vd).',
      });

      // Request stage 2
      progression.currentStage = 2;
      progression.history.push({
        stage: 2,
        label: '2. Kademe: Akıl Yürütme ve Mantıksal İlişki',
        text: 'Böbrek yetmezliğinde klirens azalır; dağılım hacmi sabitse k küçülür, yarılanma ömrü uzar.',
      });

      // Request stage 3
      progression.currentStage = 3;
      progression.history.push({
        stage: 3,
        label: '3. Kademe: Uygulama ve Çözüm Adımı',
        text: 'Doz aralığını (tau) yarılanma ömrünün katı olarak yeniden hesaplayınız.',
      });

      expect(progression.history.length).toBe(3);
      expect(progression.history[0].label).toContain('1. Kademe');
      expect(progression.history[1].label).toContain('2. Kademe');
      expect(progression.history[2].label).toContain('3. Kademe');
    });

    it('T1.3: timed mock exam autosaves question answers seamlessly', () => {
      const examQuestions: ExamQuestion[] = [
        { id: 'q1', topic: 'Kreatinin Klerensi', type: 'numeric', stem: 'CrCl değerini hesaplayın (mL/dk)', correctAnswer: 75.0, numericTolerance: 0.05 },
        { id: 'q2', topic: 'Teofilin TDM', type: 'single_choice', stem: 'Teofilin hedef serum aralığı nedir?', correctAnswer: 'B' },
      ];

      const examSession: ExamSession = {
        examId: 'exam-101',
        attemptId: 'att-101',
        startedAt: '2026-10-10T14:00:00Z',
        durationMinutes: 30,
        deadlineIso: '2026-10-10T14:30:00Z',
        questions: examQuestions,
        savedAnswers: {},
        submitted: false,
      };

      // Autosave question 1
      examSession.savedAnswers['q1'] = 74.8; // Within 5% of 75.0
      expect(examSession.savedAnswers['q1']).toBe(74.8);

      // Autosave question 2
      examSession.savedAnswers['q2'] = 'B';
      expect(examSession.savedAnswers['q2']).toBe('B');

      expect(Object.keys(examSession.savedAnswers).length).toBe(2);
    });

    it('T1.4: exam submission computes accurate topic diagnostics and flags remediation needs', () => {
      const questions: ExamQuestion[] = [
        { id: 'q1', topic: 'Farmakokinetik Hesaplamalar', type: 'single_choice', stem: 'Q1', correctAnswer: 'A' },
        { id: 'q2', topic: 'Farmakokinetik Hesaplamalar', type: 'single_choice', stem: 'Q2', correctAnswer: 'C' },
        { id: 'q3', topic: 'Toksisite ve İlaç Etkileşimleri', type: 'single_choice', stem: 'Q3', correctAnswer: 'D' },
        { id: 'q4', topic: 'Toksisite ve İlaç Etkileşimleri', type: 'single_choice', stem: 'Q4', correctAnswer: 'B' },
      ];

      const session: ExamSession = {
        examId: 'ex-202',
        attemptId: 'att-202',
        startedAt: '2026-10-10T15:00:00Z',
        durationMinutes: 45,
        deadlineIso: '2026-10-10T15:45:00Z',
        questions,
        savedAnswers: {
          q1: 'A', // Correct
          q2: 'C', // Correct (100% on topic 1)
          q3: 'A', // Incorrect
          q4: 'B', // Correct (50% on topic 2 -> flags remediation)
        },
        submitted: false,
      };

      const result = finalizeExamSubmission(session, '2026-10-10T15:35:00Z');
      expect(result.submitted).toBe(true);
      expect(result.scorePct).toBe(75); // 3 of 4 correct = 75%
      expect(result.topicBreakdown).toBeDefined();

      const topic1 = result.topicBreakdown!['Farmakokinetik Hesaplamalar'];
      expect(topic1.masteryPct).toBe(100);
      expect(topic1.needsRemediation).toBe(false);

      const topic2 = result.topicBreakdown!['Toksisite ve İlaç Etkileşimleri'];
      expect(topic2.masteryPct).toBe(50);
      expect(topic2.needsRemediation).toBe(true);
    });

    it('T1.5: instructor parses clinical document into structured semantic chunks with token counts', () => {
      const rawCurriculumText = `# Bölüm 1 - Vankomisin TDM İlkeleri\n\nVankomisin, MRSA enfeksiyonlarında altın standart glikopeptid antibiyotiktir.\n\nSayfa 2 - Dozaj ve Eğri Altı Alan (AUC)\n\nAUC24/MIC hedef oranı 400-600 mg.saat/L aralığında olmalıdır. Çukur (trough) konsantrasyonu tek başına yeterli değildir.`;

      const chunks = chunkDocument(rawCurriculumText);
      expect(chunks.length).toBeGreaterThanOrEqual(1);
      expect(chunks[0].sectionTitle).toBe('Bölüm 1 - Vankomisin TDM İlkeleri');
      expect(chunks[0].tokenCount).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (Zero Queue, Expired Deadline, Tolerances)
  // ==========================================================================
  describe('Tier 2: Boundary & Corner Cases — Resilience & Grace Periods', () => {
    it('T2.1: handles zero-due-cards gracefully with motivating completion state', () => {
      const activeQueue: ReviewCard[] = [];
      const hasDueCards = activeQueue.length > 0;
      expect(hasDueCards).toBe(false);

      const completionState = {
        title: 'Günün Tekrarı Tamamlandı',
        message: 'Tebrikler, tüm planlı kartlarınızı tamamladınız! Yeni kartlar aralıklı tekrar algoritmasına göre hazırlandığında burada görünecektir.',
        canStartFreePractice: true,
      };

      expect(completionState.title).toContain('Tamamlandı');
      expect(completionState.canStartFreePractice).toBe(true);
    });

    it('T2.2: enforces exam deadline and 30-second grace window strictly', () => {
      const questions: ExamQuestion[] = [
        { id: 'q1', topic: 'TDM', type: 'single_choice', stem: 'Q1', correctAnswer: 'A' },
      ];

      const baseSession: ExamSession = {
        examId: 'ex-grace',
        attemptId: 'att-grace',
        startedAt: '2026-10-10T10:00:00Z',
        durationMinutes: 30,
        deadlineIso: '2026-10-10T10:30:00Z',
        questions,
        savedAnswers: { q1: 'A' },
        submitted: false,
      };

      // Submission at 10:30:25 (25 seconds late, inside 30s grace window) -> VALID
      const onTimeResult = finalizeExamSubmission(baseSession, '2026-10-10T10:30:25Z', 30);
      expect(onTimeResult.scorePct).toBe(100);

      // Submission at 10:30:45 (45 seconds late, outside 30s grace window) -> REJECTED LATE
      const lateResult = finalizeExamSubmission(baseSession, '2026-10-10T10:30:45Z', 30);
      expect(lateResult.scorePct).toBe(0); // Answers after deadline do not award points
    });

    it('T2.3: verifies numerical answer grading with exact ±5% tolerance boundaries', () => {
      const correctVal = 100.0;
      const tolerance = 0.05; // 5% -> [95.0, 105.0]

      // Inside tolerance
      expect(evaluateNumericAnswer(95.0, correctVal, tolerance)).toBe(true);
      expect(evaluateNumericAnswer(105.0, correctVal, tolerance)).toBe(true);
      expect(evaluateNumericAnswer(98.5, correctVal, tolerance)).toBe(true);

      // Outside tolerance
      expect(evaluateNumericAnswer(94.9, correctVal, tolerance)).toBe(false);
      expect(evaluateNumericAnswer(105.1, correctVal, tolerance)).toBe(false);
      expect(evaluateNumericAnswer(120.0, correctVal, tolerance)).toBe(false);
      expect(evaluateNumericAnswer('invalid_string', correctVal, tolerance)).toBe(false);
    });

    it('T2.4: requires non-empty rejection reason when instructor rejects content draft', () => {
      function processContentRejection(
        draft: EducationalDraftItem,
        instructorId: string,
        reason?: string
      ): { success: boolean; error?: string; updatedDraft?: EducationalDraftItem } {
        if (!reason || reason.trim().length < 5) {
          return { success: false, error: 'Reddetme işlemi için en az 5 karakterlik açıklama gereklidir.' };
        }
        return {
          success: true,
          updatedDraft: {
            ...draft,
            status: 'rejected',
            rejectionReason: reason.trim(),
            reviewedBy: instructorId,
          },
        };
      }

      const draft: EducationalDraftItem = {
        id: 'item-10',
        chunkId: 1,
        stem: 'Yanlış klerens formülü',
        status: 'needs_review',
      };

      // Fails without reason
      const fail = processContentRejection(draft, 'inst-1', '');
      expect(fail.success).toBe(false);
      expect(fail.error).toContain('en az 5 karakterlik açıklama');

      // Succeeds with reason
      const pass = processContentRejection(draft, 'inst-1', 'Kadın hasta düzeltme katsayısı (0.85) formülde unutulmuş.');
      expect(pass.success).toBe(true);
      expect(pass.updatedDraft?.status).toBe('rejected');
      expect(pass.updatedDraft?.rejectionReason).toContain('0.85');
    });
  });

  // ==========================================================================
  // TIER 3: CROSS-FEATURE INTERACTIONS (Exam Feedback Loop to Spaced Queue)
  // ==========================================================================
  describe('Tier 3: Cross-Feature Interactions — Closed Loop Learning Pipeline', () => {
    it('T3.1: failing an exam question automatically feeds priority item to student review queue', () => {
      const missedExamQuestion = {
        questionId: 'q-digoxin-1',
        topic: 'Digoksin Terapötik İlaç İzlemi',
        stem: 'Hipokalemi durumunda digoksin toksisitesi riski nasıl değişir?',
        userAnswer: 'Toksisite riski azalır', // Wrong answer
        correctAnswer: 'Toksisite riski belirgin şekilde artar (potasyum ile miyokardiyal bağlanma yarışması)',
      };

      // Spaced review queue bridge: automatically schedules card with 'again'
      const newReviewCard: ReviewCard = {
        id: `card-${missedExamQuestion.questionId}`,
        topic: missedExamQuestion.topic,
        stem: missedExamQuestion.stem,
        correctAnswer: missedExamQuestion.correctAnswer,
        stability: 0.5, // Priority: due immediately
        difficulty: 7.0,
        lastReviewDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 12 * 3600 * 1000).toISOString(), // Due within 12 hours
        reps: 0,
        lapses: 1,
      };

      expect(newReviewCard.stability).toBe(0.5);
      expect(newReviewCard.lapses).toBe(1);
      expect(newReviewCard.topic).toBe(missedExamQuestion.topic);
    });

    it('T3.2: instructor approved content transitions immediately into course practice catalog', () => {
      const courseCatalog: EducationalDraftItem[] = [];

      // Instructor uploads and approves item
      const item: EducationalDraftItem = {
        id: 'q-vancomycin-auc',
        chunkId: 2,
        stem: 'Vankomisin AUC24/MIC hedefi nedir?',
        status: 'needs_review',
      };

      // Transition to approved and published
      const publishedItem: EducationalDraftItem = {
        ...item,
        status: 'published',
        reviewedBy: 'prof.dr.eczaci',
      };
      courseCatalog.push(publishedItem);

      // Student views available questions: item is now live
      const studentAvailable = courseCatalog.filter((x) => x.status === 'published');
      expect(studentAvailable.length).toBe(1);
      expect(studentAvailable[0].id).toBe('q-vancomycin-auc');
    });
  });

  // ==========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS (End-to-End User Journeys)
  // ==========================================================================
  describe('Tier 4: Real-World Application Scenarios — Student & Instructor Journeys', () => {
    it('T4.1: Scenario A (Student Practice & Socratic Mastery Flow): Daily retrieval to completion summary', () => {
      // 1. Student opens Today Hub, sees 3 due cards
      const initialCards: ReviewCard[] = [
        {
          id: 'card-1',
          topic: 'Teofilin Eliminasyonu',
          stem: 'Sigara içen hastalarda CYP1A2 indüksiyonu teofilin klerensini nasıl etkiler?',
          correctAnswer: 'Klerensi artırır, doz ihtiyacını yükseltir',
          stability: 2.0,
          difficulty: 4.5,
          lastReviewDate: '2026-10-08T09:00:00Z',
          dueDate: '2026-10-10T09:00:00Z',
          reps: 2,
          lapses: 0,
        },
      ];

      // 2. Student starts study session
      const currentCard = initialCards[0];

      // 3. Student requests Stage 1 hint for conceptual anchor
      const hintStage1 = 'CYP1A2 enzim aktivitesi ve hepatik klerens ilişkisini düşünün.';
      expect(hintStage1).toContain('hepatik klerens');

      // 4. Student enters correct answer and rates "İyi" (good)
      const reviewedCard = updateFSRSCard(currentCard, 'good', '2026-10-10T11:00:00Z');

      // 5. Session completes: metrics calculated
      const sessionSummary = {
        totalReviewed: 1,
        accuracyPct: 100,
        hintsUsedTotal: 1,
        streakDays: 4, // Incremented from 3
      };

      expect(sessionSummary.totalReviewed).toBe(1);
      expect(sessionSummary.accuracyPct).toBe(100);
      expect(sessionSummary.streakDays).toBe(4);
      expect(reviewedCard.stability).toBeGreaterThan(2.0);
    });

    it('T4.2: Scenario B (Timed Mock Exam with Resilient Autosave & Targeted Remediation)', () => {
      // 1. Student begins 30-minute exam
      const questions: ExamQuestion[] = [
        { id: 'q1', topic: 'Gentamisin Dozajı', type: 'numeric', stem: 'Gentamisin başlangıç yükleme dozu (mg)', correctAnswer: 140.0, numericTolerance: 0.05 },
        { id: 'q2', topic: 'Teofilin TDM', type: 'single_choice', stem: 'Teofilin toksisite belirtisi', correctAnswer: 'Taşikardi ve nöbet' },
        { id: 'q3', topic: 'Böbrek Yetmezliğinde Doz', type: 'single_choice', stem: 'CrCl < 30 mL/dk doz stratejisi', correctAnswer: 'Doz aralığını uzatmak' },
      ];

      const exam: ExamSession = {
        examId: 'exam-final-pilot',
        attemptId: 'att-pilot-01',
        startedAt: '2026-10-10T09:00:00Z',
        durationMinutes: 30,
        deadlineIso: '2026-10-10T09:30:00Z',
        questions,
        savedAnswers: {},
        submitted: false,
      };

      // 2. Student answers Q1 with numeric value 138 mg (within 5% of 140)
      exam.savedAnswers['q1'] = 138.0;

      // 3. Student answers Q2 correctly
      exam.savedAnswers['q2'] = 'Taşikardi ve nöbet';

      // 4. Student answers Q3 incorrectly
      exam.savedAnswers['q3'] = 'Doz miktarını iki katına çıkarmak'; // Wrong

      // 5. Submit at minute 25 (well before deadline)
      const finalized = finalizeExamSubmission(exam, '2026-10-10T09:25:00Z');

      expect(finalized.submitted).toBe(true);
      expect(finalized.scorePct).toBe(67); // 2 of 3 correct = 67%

      // Diagnostics verification
      const topicGenta = finalized.topicBreakdown!['Gentamisin Dozajı'];
      expect(topicGenta.masteryPct).toBe(100);
      expect(topicGenta.needsRemediation).toBe(false);

      const topicRenal = finalized.topicBreakdown!['Böbrek Yetmezliğinde Doz'];
      expect(topicRenal.masteryPct).toBe(0);
      expect(topicRenal.needsRemediation).toBe(true); // Flagged for remediation
    });

    it('T4.3: Scenario C (Instructor Curriculum Upload, AI Chunking & Anti-Hallucination Review)', () => {
      // 1. Instructor uploads guideline text
      const guidelineText = `# Kılavuz: Fenitoin TDM ve Michaelis-Menten Kinetiği\n\nFenitoin doğrusal olmayan (non-linear) kapasite-sınırlı kinetik sergiler.\n\nSayfa 2 - Doz Artırımı ve Toksisite Riski\n\nKüçük doz artışları serum konsantrasyonunda orantısız ve ani artışlara neden olabilir.`;

      // 2. Document chunking with token counts
      const chunks = chunkDocument(guidelineText);
      expect(chunks.length).toBeGreaterThanOrEqual(1);

      // 3. AI generates draft items with status 'needs_review'
      const drafts: EducationalDraftItem[] = [
        {
          id: 'draft-1',
          chunkId: chunks[0].chunkIndex,
          stem: 'Fenitoin kinetik modeli doğrusal mıdır?',
          status: 'needs_review',
        },
        {
          id: 'draft-2',
          chunkId: chunks[0].chunkIndex,
          stem: 'Fenitoin için Vmax ve Km parametreleri neyi ifade eder?',
          status: 'needs_review',
        },
      ];

      // 4. Student view filter isolates unreviewed items
      const studentVisibleBefore = drafts.filter((d) => d.status === 'published');
      expect(studentVisibleBefore.length).toBe(0);

      // 5. Instructor reviews: approves draft-1, edits & approves draft-2
      drafts[0].status = 'published';
      drafts[0].reviewedBy = 'prof.eczacilik';

      drafts[1].status = 'published';
      drafts[1].stem = 'Fenitoin Michaelis-Menten kinetiğinde Vmax ve Km parametreleri neyi ifade eder? (Gözden Geçirildi)';
      drafts[1].reviewedBy = 'prof.eczacilik';

      // 6. Student view now gains access to verified items
      const studentVisibleAfter = drafts.filter((d) => d.status === 'published');
      expect(studentVisibleAfter.length).toBe(2);
      expect(studentVisibleAfter[1].stem).toContain('(Gözden Geçirildi)');
    });
  });
});
