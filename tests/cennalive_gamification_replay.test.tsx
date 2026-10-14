// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, waitFor, cleanup, screen, fireEvent } from '@testing-library/react';
import {
  MicrolearningProvider,
  useMicrolearning,
  getProgressStorageKey,
  getGamificationStorageKey,
} from '../src/context/MicrolearningContext';
import { InteractiveLessonPlayer } from '../src/views/Student/InteractiveLessonPlayer';
import { RouterProvider } from '../src/context/RouterContext';

// Mock Supabase client
const mockUpsertLesson = vi.fn().mockResolvedValue({ error: null });
const mockUpsertGame = vi.fn().mockResolvedValue({ error: null });
const mockSelectLesson = vi.fn();
const mockMaybeSingleGame = vi.fn();

vi.mock('../src/lib/supabaseClient', () => {
  return {
    supabase: {
      from: (table: string) => {
        if (table === 'user_lesson_progress') {
          return {
            select: () => ({
              eq: (col: string, val: string) => mockSelectLesson(col, val),
            }),
            upsert: (payload: any, opts: any) => mockUpsertLesson(payload, opts),
          };
        }
        if (table === 'user_gamification') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => mockMaybeSingleGame(),
              }),
            }),
            upsert: (payload: any) => mockUpsertGame(payload),
          };
        }
        return {};
      },
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    },
  };
});

// Mock AuthContext
let mockAuthUser: any = null;
let mockAuthLoading: boolean = false;

vi.mock('../src/context/AuthContext', () => {
  return {
    useAuth: () => ({
      user: mockAuthUser,
      loading: mockAuthLoading,
      session: null,
      profile: null,
      activeRole: 'student',
      setActiveRole: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
      signInDemo: vi.fn(),
    }),
  };
});

// Mock window.scrollTo and matchMedia for jsdom
window.scrollTo = vi.fn();
window.matchMedia =
  window.matchMedia ||
  vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

const TestConsumer: React.FC<{
  onState?: (state: ReturnType<typeof useMicrolearning>) => void;
}> = ({ onState }) => {
  const microlearning = useMicrolearning();
  if (onState) onState(microlearning);
  return (
    <div data-testid="consumer">
      <span data-testid="loading">{microlearning.isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="xp">{microlearning.gamification.xp}</span>
      <span data-testid="count">{microlearning.gamification.completedLessonsCount}</span>
      <span data-testid="streak">{microlearning.gamification.streak}</span>
      <span data-testid="les1-completed">
        {microlearning.userProgress['les-1']?.isCompleted ? 'yes' : 'no'}
      </span>
      <span data-testid="les1-stars">{microlearning.userProgress['les-1']?.starsEarned ?? 0}</span>
    </div>
  );
};

describe('Microlearning Gamification - Duplicate Rewards Prevention (Finding 3)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockAuthUser = null;
    mockAuthLoading = false;
    mockSelectLesson.mockResolvedValue({ data: [], error: null });
    mockMaybeSingleGame.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    cleanup();
  });

  it('1. First completion grants the expected XP and increments the count once', async () => {
    mockAuthUser = { id: 'student-first-run' };
    let latestState: any = null;

    const { getByTestId } = render(
      <MicrolearningProvider>
        <TestConsumer onState={(s) => (latestState = s)} />
      </MicrolearningProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('ready');
    });

    const initialXp = latestState.gamification.xp; // default 120
    const initialCount = latestState.gamification.completedLessonsCount; // default 0

    // Complete les-1 for the first time (+50 XP, 3 stars)
    await act(async () => {
      await latestState.completeLesson('les-1', 3, 50);
    });

    expect(latestState.gamification.xp).toBe(initialXp + 50);
    expect(latestState.gamification.completedLessonsCount).toBe(initialCount + 1);
    expect(latestState.userProgress['les-1']?.isCompleted).toBe(true);
    expect(latestState.userProgress['les-1']?.starsEarned).toBe(3);

    // Verify Supabase was updated with the new reward values
    expect(mockUpsertGame).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'student-first-run',
        xp: initialXp + 50,
        completed_lessons_count: initialCount + 1,
      })
    );
  });

  it('2. Replaying the same completed lesson does not grant duplicate rewards', async () => {
    mockAuthUser = { id: 'student-replay' };
    let latestState: any = null;

    const { getByTestId } = render(
      <MicrolearningProvider>
        <TestConsumer onState={(s) => (latestState = s)} />
      </MicrolearningProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('ready');
    });

    // 1. Initial completion of les-1
    await act(async () => {
      await latestState.completeLesson('les-1', 3, 50);
    });

    const xpAfterFirst = latestState.gamification.xp; // 170
    const countAfterFirst = latestState.gamification.completedLessonsCount; // 1
    mockUpsertGame.mockClear();
    mockUpsertLesson.mockClear();

    // 2. Replay les-1 with same or lower stars
    await act(async () => {
      await latestState.completeLesson('les-1', 2, 50);
    });

    // XP and completedLessonsCount MUST remain unchanged
    expect(latestState.gamification.xp).toBe(xpAfterFirst);
    expect(latestState.gamification.completedLessonsCount).toBe(countAfterFirst);

    // Highest stars earned must be preserved (Math.max(3, 2) = 3)
    expect(latestState.userProgress['les-1']?.starsEarned).toBe(3);

    // Supabase upsert must not have added XP or incremented the count
    expect(mockUpsertGame).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'student-replay',
        xp: xpAfterFirst,
        completed_lessons_count: countAfterFirst,
      })
    );

    // 3. Replay paired mission ('mission-1') also must not duplicate rewards
    await act(async () => {
      await latestState.completeMission('mission-1', 3, 35);
    });

    expect(latestState.gamification.xp).toBe(xpAfterFirst);
    expect(latestState.gamification.completedLessonsCount).toBe(countAfterFirst);

    // 4. Reverse direction: completing a new mission first grants rewards, then completing paired lesson does not duplicate
    const xpBeforeMission5 = latestState.gamification.xp;
    const countBeforeMission5 = latestState.gamification.completedLessonsCount;

    await act(async () => {
      await latestState.completeMission('mission-5', 3, 35);
    });

    expect(latestState.gamification.xp).toBe(xpBeforeMission5 + 35);
    expect(latestState.gamification.completedLessonsCount).toBe(countBeforeMission5 + 1);

    // Now completing paired 'les-5' must NOT award duplicate rewards
    await act(async () => {
      await latestState.completeLesson('les-5', 3, 30);
    });

    expect(latestState.gamification.xp).toBe(xpBeforeMission5 + 35);
    expect(latestState.gamification.completedLessonsCount).toBe(countBeforeMission5 + 1);
  });

  it('3. Completing a different lesson grants its rewards normally', async () => {
    mockAuthUser = { id: 'student-multi-lesson' };
    let latestState: any = null;

    const { getByTestId } = render(
      <MicrolearningProvider>
        <TestConsumer onState={(s) => (latestState = s)} />
      </MicrolearningProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('ready');
    });

    // 1. Complete les-1 (+50 XP)
    await act(async () => {
      await latestState.completeLesson('les-1', 3, 50);
    });

    const xpAfterLes1 = latestState.gamification.xp;
    const countAfterLes1 = latestState.gamification.completedLessonsCount;

    // 2. Complete a DIFFERENT lesson les-2 (+40 XP)
    await act(async () => {
      await latestState.completeLesson('les-2', 2, 40);
    });

    // Rewards for the new lesson MUST be awarded
    expect(latestState.gamification.xp).toBe(xpAfterLes1 + 40);
    expect(latestState.gamification.completedLessonsCount).toBe(countAfterLes1 + 1);
    expect(latestState.userProgress['les-2']?.isCompleted).toBe(true);
    expect(latestState.userProgress['les-2']?.starsEarned).toBe(2);

    expect(mockUpsertGame).toHaveBeenLastCalledWith(
      expect.objectContaining({
        user_id: 'student-multi-lesson',
        xp: xpAfterLes1 + 40,
        completed_lessons_count: countAfterLes1 + 1,
      })
    );
  });

  it('4. Repeated or rapid completion callbacks cannot double-count rewards', async () => {
    mockAuthUser = { id: 'student-rapid-click' };
    let latestState: any = null;

    const { getByTestId } = render(
      <MicrolearningProvider>
        <TestConsumer onState={(s) => (latestState = s)} />
      </MicrolearningProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('ready');
    });

    const initialXp = latestState.gamification.xp;
    const initialCount = latestState.gamification.completedLessonsCount;

    // Simulate multiple concurrent or rapid completion calls for the same lesson
    await act(async () => {
      await Promise.all([
        latestState.completeLesson('les-4', 3, 45),
        latestState.completeLesson('les-4', 3, 45),
        latestState.completeLesson('les-4', 3, 45),
      ]);
    });

    // XP and count must only be credited ONCE (+45 XP, +1 lesson)
    expect(latestState.gamification.xp).toBe(initialXp + 45);
    expect(latestState.gamification.completedLessonsCount).toBe(initialCount + 1);
  });

  it('5. Restored or persisted completion state prevents duplicate rewards after reload', async () => {
    // Simulate user state already saved in Supabase
    mockAuthUser = { id: 'student-persisted' };
    mockSelectLesson.mockResolvedValue({
      data: [
        {
          lesson_id: 'les-1',
          is_completed: true,
          current_step: 3,
          stars_earned: 3,
          completed_at: '2026-10-14T10:00:00Z',
        },
      ],
      error: null,
    });
    mockMaybeSingleGame.mockResolvedValue({
      data: {
        streak: 7,
        xp: 420,
        last_active_date: '2026-10-14',
        completed_lessons_count: 5,
      },
      error: null,
    });

    let latestState: any = null;
    const { getByTestId } = render(
      <MicrolearningProvider>
        <TestConsumer onState={(s) => (latestState = s)} />
      </MicrolearningProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('ready');
    });

    // State is restored: 420 XP, 5 completed lessons, les-1 completed
    expect(getByTestId('xp').textContent).toBe('420');
    expect(getByTestId('count').textContent).toBe('5');
    expect(getByTestId('les1-completed').textContent).toBe('yes');

    mockUpsertGame.mockClear();

    // Replay les-1 after page reload
    await act(async () => {
      await latestState.completeLesson('les-1', 3, 50);
    });

    // Must NOT award duplicate XP or count
    expect(getByTestId('xp').textContent).toBe('420');
    expect(getByTestId('count').textContent).toBe('5');
    expect(mockUpsertGame).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'student-persisted',
        xp: 420,
        completed_lessons_count: 5,
      })
    );
  });

  it('6. Full UI replay in InteractiveLessonPlayer does not duplicate XP or completedLessonsCount', async () => {
    // 1. Setup student who already completed les-1
    mockAuthUser = { id: 'student-ui-replay' };
    const userKey = getProgressStorageKey('student-ui-replay');
    const gameKey = getGamificationStorageKey('student-ui-replay');

    localStorage.setItem(
      userKey,
      JSON.stringify({
        'les-1': {
          lessonId: 'les-1',
          isCompleted: true,
          currentStep: 100,
          starsEarned: 3,
          completedAt: '2026-10-14T08:00:00Z',
        },
      })
    );
    localStorage.setItem(
      gameKey,
      JSON.stringify({
        streak: 4,
        xp: 300,
        lastActiveDate: new Date().toISOString().split('T')[0],
        completedLessonsCount: 3,
      })
    );

    mockSelectLesson.mockResolvedValue({
      data: [
        {
          lesson_id: 'les-1',
          is_completed: true,
          current_step: 100,
          stars_earned: 3,
          completed_at: '2026-10-14T08:00:00Z',
        },
      ],
      error: null,
    });
    mockMaybeSingleGame.mockResolvedValue({
      data: {
        streak: 4,
        xp: 300,
        last_active_date: new Date().toISOString().split('T')[0],
        completed_lessons_count: 3,
      },
      error: null,
    });

    window.history.pushState({}, '', '/learn/lesson/les-1');

    render(
      <RouterProvider>
        <MicrolearningProvider>
          <InteractiveLessonPlayer key="/learn/lesson/les-1" />
        </MicrolearningProvider>
      </RouterProvider>
    );

    // Initial state: Header displays 300 XP and Step 1 of 4
    await waitFor(() => {
      expect(screen.getByText(/Adım 1 \/ 4/i)).toBeTruthy();
      expect(screen.getByText(/300 XP/i)).toBeTruthy();
    });

    // Verify option radios are rendered
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);

    // Select Option B (correct answer for les-1-s1)
    fireEvent.click(radios[1]);

    await waitFor(() => {
      expect(radios[1].getAttribute('aria-checked')).toBe('true');
    });

    const checkBtn = screen.getByText('Kontrol Et').closest('button');
    expect(checkBtn?.disabled).toBe(false);
    fireEvent.click(checkBtn!);

    // Success feedback and Devam Et button appear
    await waitFor(() => {
      expect(screen.getByText('Doğru Çıkarım!')).toBeTruthy();
    });

    const continueBtn = screen.getByRole('button', { name: /Devam Et/i });
    fireEvent.click(continueBtn);

    // Step 2 reached
    await waitFor(() => {
      expect(screen.getByText(/Adım 2 \/ 4/i)).toBeTruthy();
    });

    // In the header, gamification XP remains exactly 300 XP (no duplicate reward)
    expect(screen.getByText(/300 XP/i)).toBeTruthy();
  });
});
