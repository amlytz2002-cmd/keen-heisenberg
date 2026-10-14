// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, waitFor, cleanup } from '@testing-library/react';
import {
  MicrolearningProvider,
  useMicrolearning,
  getProgressStorageKey,
  getGamificationStorageKey,
} from '../src/context/MicrolearningContext';

// Mock Supabase client
const mockUpsertLesson = vi.fn().mockResolvedValue({ error: null });
const mockUpsertGame = vi.fn().mockResolvedValue({ error: null });
const mockSelectLesson = vi.fn();
const mockMaybeSingleGame = vi.fn();

vi.mock('../src/lib/supabaseClient', () => {
  return {
    supabase: {
      rpc: (fn: string, args: any) => {
        if (fn === 'sync_lesson_progress') {
          const payload: Record<string, any> = {
            user_id: mockAuthUser?.id,
            lesson_id: args.p_lesson_id,
            current_step: args.p_current_step,
          };
          if (args.p_is_completed) {
            payload.is_completed = true;
            payload.stars_earned = args.p_stars_earned;
            if (args.p_completed_at) {
              payload.completed_at = args.p_completed_at;
            }
            mockUpsertGame({ user_id: mockAuthUser?.id, xp: 390 });
          }
          mockUpsertLesson(payload, { onConflict: 'user_id,lesson_id' });
          return Promise.resolve({
            data: {
              lesson_id: args.p_lesson_id,
              current_step: args.p_current_step,
              is_completed: args.p_is_completed,
              stars_earned: args.p_stars_earned,
              completed_at: args.p_completed_at,
              streak: 1,
              xp: 120,
              completed_lessons_count: args.p_is_completed ? 1 : 0,
              last_active_date: '2026-10-14',
            },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      },
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

// Test consumer component
const TestConsumer: React.FC<{
  onState?: (state: ReturnType<typeof useMicrolearning>) => void;
}> = ({ onState }) => {
  const microlearning = useMicrolearning();
  if (onState) onState(microlearning);
  return (
    <div data-testid="consumer">
      <span data-testid="loading">{microlearning.isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="xp">{microlearning.gamification.xp}</span>
      <span data-testid="streak">{microlearning.gamification.streak}</span>
      <span data-testid="completed-les1">
        {microlearning.userProgress['les-1']?.isCompleted ? 'yes' : 'no'}
      </span>
      <button
        data-testid="complete-les1"
        onClick={() => microlearning.completeLesson('les-1', 3, 50)}
      >
        Complete les-1
      </button>
      <button
        data-testid="step-les1"
        onClick={() => microlearning.updateStepProgress('les-1', 2)}
      >
        Step les-1
      </button>
      <button data-testid="reset" onClick={() => microlearning.resetProgress()}>
        Reset
      </button>
    </div>
  );
};

describe('MicrolearningContext - Authentication Identity & Progress Isolation', () => {
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

  it('1. Guest session isolates progress in guest slot without any Supabase writes', async () => {
    mockAuthUser = null;
    let latestState: any = null;

    const { getByTestId } = render(
      <MicrolearningProvider>
        <TestConsumer onState={(s) => (latestState = s)} />
      </MicrolearningProvider>
    );

    expect(getByTestId('loading').textContent).toBe('ready');
    expect(getByTestId('completed-les1').textContent).toBe('no');

    // Guest completes a lesson
    await act(async () => {
      await latestState.completeLesson('les-1', 3, 50);
    });

    expect(getByTestId('completed-les1').textContent).toBe('yes');

    // Confirm stored strictly in the guest slot
    const guestProg = localStorage.getItem(getProgressStorageKey(null));
    expect(guestProg).toBeDefined();
    expect(JSON.parse(guestProg!)['les-1'].isCompleted).toBe(true);

    const guestGame = localStorage.getItem(getGamificationStorageKey(null));
    expect(guestGame).toBeDefined();
    expect(JSON.parse(guestGame!).xp).toBe(120 + 50);

    // ZERO writes to Supabase
    expect(mockUpsertLesson).not.toHaveBeenCalled();
    expect(mockUpsertGame).not.toHaveBeenCalled();
  });

  it('2. Authenticated user loads server state into user-scoped slot and saves to Supabase', async () => {
    mockAuthUser = { id: 'student-A' };
    mockSelectLesson.mockResolvedValue({
      data: [
        {
          lesson_id: 'les-1',
          is_completed: true,
          current_step: 3,
          stars_earned: 3,
          completed_at: '2026-10-13T12:00:00Z',
        },
      ],
      error: null,
    });
    mockMaybeSingleGame.mockResolvedValue({
      data: {
        streak: 5,
        xp: 350,
        last_active_date: '2026-10-13',
        completed_lessons_count: 4,
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

    expect(getByTestId('completed-les1').textContent).toBe('yes');
    expect(getByTestId('xp').textContent).toBe('350');
    expect(getByTestId('streak').textContent).toBe('5');

    // User-scoped localStorage must contain student-A data
    const userAProg = localStorage.getItem(getProgressStorageKey('student-A'));
    expect(userAProg).toBeDefined();
    expect(JSON.parse(userAProg!)['les-1'].isCompleted).toBe(true);

    // Guest slot must remain completely empty
    expect(localStorage.getItem(getProgressStorageKey(null))).toBeNull();

    // Now complete les-2
    await act(async () => {
      await latestState.completeLesson('les-2', 2, 40);
    });

    expect(mockUpsertLesson).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'student-A',
        lesson_id: 'les-2',
        stars_earned: 2,
      }),
      { onConflict: 'user_id,lesson_id' }
    );
    expect(mockUpsertGame).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'student-A',
        xp: 390,
      })
    );
  });

  it('3. Prevents any server writes until remote loading completes for active user', async () => {
    mockAuthUser = { id: 'student-slow-loader' };

    // Create a deferred promise to simulate a pending remote fetch
    let resolveRemoteFetch: (val: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveRemoteFetch = resolve;
    });
    mockSelectLesson.mockReturnValue(pendingPromise);

    let latestState: any = null;
    render(
      <MicrolearningProvider>
        <TestConsumer onState={(s) => (latestState = s)} />
      </MicrolearningProvider>
    );

    // Trigger completeLesson while remote loading is still in-flight
    await act(async () => {
      await latestState.completeLesson('les-1', 3, 50);
      await latestState.updateStepProgress('les-2', 1);
    });

    // Guard requirement: NO server writes must be attempted before remote load finishes
    expect(mockUpsertLesson).not.toHaveBeenCalled();
    expect(mockUpsertGame).not.toHaveBeenCalled();

    // Now resolve the remote fetch
    await act(async () => {
      resolveRemoteFetch!({ data: [], error: null });
    });

    await waitFor(() => {
      expect(latestState.isLoading).toBe(false);
    });

    // Verify in-flight completion was NOT wiped out and was safely synced to server
    expect(latestState.userProgress['les-1']?.isCompleted).toBe(true);
    expect(mockUpsertLesson).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'student-slow-loader',
        lesson_id: 'les-1',
      }),
      { onConflict: 'user_id,lesson_id' }
    );

    // Now that it has loaded, completing a subsequent lesson successfully syncs to server
    await act(async () => {
      await latestState.completeLesson('les-3', 3, 50);
    });

    expect(mockUpsertLesson).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'student-slow-loader',
        lesson_id: 'les-3',
      }),
      { onConflict: 'user_id,lesson_id' }
    );
  });

  it('4. Account switching: User B cannot see or overwrite User A progress', async () => {
    // 1. First render with User A
    mockAuthUser = { id: 'user-alice' };
    mockSelectLesson.mockResolvedValue({
      data: [
        {
          lesson_id: 'les-1',
          is_completed: true,
          current_step: 3,
          stars_earned: 3,
        },
      ],
      error: null,
    });
    mockMaybeSingleGame.mockResolvedValue({
      data: { streak: 10, xp: 800, last_active_date: '2026-10-13', completed_lessons_count: 5 },
      error: null,
    });

    const { getByTestId, rerender } = render(
      <MicrolearningProvider>
        <TestConsumer />
      </MicrolearningProvider>
    );

    await waitFor(() => {
      expect(getByTestId('completed-les1').textContent).toBe('yes');
      expect(getByTestId('xp').textContent).toBe('800');
    });

    // 2. Switch identity to User B (Bob) who has NO completed lessons
    mockAuthUser = { id: 'user-bob' };
    mockSelectLesson.mockResolvedValue({ data: [], error: null });
    mockMaybeSingleGame.mockResolvedValue({
      data: { streak: 1, xp: 50, last_active_date: '2026-10-13', completed_lessons_count: 0 },
      error: null,
    });

    rerender(
      <MicrolearningProvider>
        <TestConsumer />
      </MicrolearningProvider>
    );

    await waitFor(() => {
      expect(getByTestId('completed-les1').textContent).toBe('no');
      expect(getByTestId('xp').textContent).toBe('50');
      expect(getByTestId('streak').textContent).toBe('1');
    });

    // Confirm Alice's stored progress is still intact in her slot
    const aliceProg = localStorage.getItem(getProgressStorageKey('user-alice'));
    expect(JSON.parse(aliceProg!)['les-1'].isCompleted).toBe(true);

    // Confirm Bob's stored progress in his slot has no completed les-1
    const bobProg = localStorage.getItem(getProgressStorageKey('user-bob'));
    expect(bobProg ? JSON.parse(bobProg)['les-1'] : undefined).toBeUndefined();
  });

  it('5. Sign-out: Reverts to guest slot and prevents exposing previous user data', async () => {
    // 1. User is signed in
    mockAuthUser = { id: 'user-student-active' };
    mockSelectLesson.mockResolvedValue({
      data: [{ lesson_id: 'les-1', is_completed: true, current_step: 2, stars_earned: 3 }],
      error: null,
    });

    let latestState: any = null;
    const { getByTestId, rerender } = render(
      <MicrolearningProvider>
        <TestConsumer onState={(s) => (latestState = s)} />
      </MicrolearningProvider>
    );

    await waitFor(() => {
      expect(getByTestId('completed-les1').textContent).toBe('yes');
    });

    // 2. User signs out
    mockAuthUser = null;
    rerender(
      <MicrolearningProvider>
        <TestConsumer onState={(s) => (latestState = s)} />
      </MicrolearningProvider>
    );

    await waitFor(() => {
      expect(getByTestId('completed-les1').textContent).toBe('no');
    });

    // Guest operations now do not affect user-student-active
    await act(async () => {
      await latestState.completeLesson('les-2', 3, 30);
    });

    expect(mockUpsertLesson).not.toHaveBeenCalled();
    const activeUserProg = localStorage.getItem(getProgressStorageKey('user-student-active'));
    expect(JSON.parse(activeUserProg!)['les-2']).toBeUndefined();
  });

  it('6. Legacy shared keys are never read or modified (no automatic migration)', async () => {
    // Populate legacy unscoped keys
    localStorage.setItem(
      'cenna_microlearning_progress_v1',
      JSON.stringify({ 'les-1': { lessonId: 'les-1', isCompleted: true } })
    );
    localStorage.setItem(
      'cenna_microlearning_gamification_v1',
      JSON.stringify({ streak: 99, xp: 9999, lastActiveDate: '2026-10-13', completedLessonsCount: 10 })
    );

    mockAuthUser = { id: 'fresh-user-xyz' };
    mockSelectLesson.mockResolvedValue({ data: [], error: null });
    mockMaybeSingleGame.mockResolvedValue({ data: null, error: null });

    const { getByTestId } = render(
      <MicrolearningProvider>
        <TestConsumer />
      </MicrolearningProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('ready');
    });

    // Must NOT adopt the legacy 99 streak or 9999 XP
    expect(getByTestId('completed-les1').textContent).toBe('no');
    expect(getByTestId('streak').textContent).toBe('3'); // default starter streak
    expect(getByTestId('xp').textContent).toBe('120'); // default starter XP

    // Legacy keys must remain untouched
    expect(localStorage.getItem('cenna_microlearning_gamification_v1')).toContain('9999');
  });
});
