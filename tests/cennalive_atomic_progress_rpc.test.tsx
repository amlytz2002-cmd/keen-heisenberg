// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, waitFor, cleanup } from '@testing-library/react';
import {
  MicrolearningProvider,
  useMicrolearning,
  getPendingSyncStorageKey,
} from '../src/context/MicrolearningContext';

// Mock Supabase client
const mockRpc = vi.fn();
const mockSelectLesson = vi.fn();
const mockMaybeSingleGame = vi.fn();
const mockUpsertGame = vi.fn();

vi.mock('../src/lib/supabaseClient', () => {
  return {
    supabase: {
      rpc: (fn: string, args: any) => mockRpc(fn, args),
      from: (table: string) => {
        if (table === 'user_lesson_progress') {
          return {
            select: () => ({
              eq: (col: string, val: string) => mockSelectLesson(col, val),
            }),
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

// Mock jsdom environment globals
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
      <span data-testid="error">{microlearning.syncError || 'none'}</span>
    </div>
  );
};

describe('Microlearning - Atomic Concurrency-Safe RPC Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockAuthUser = null;
    mockAuthLoading = false;
    mockSelectLesson.mockResolvedValue({ data: [], error: null });
    mockMaybeSingleGame.mockResolvedValue({ data: null, error: null });
    mockUpsertGame.mockResolvedValue({ error: null });
    mockRpc.mockResolvedValue({
      data: {
        lesson_id: 'les-1',
        current_step: 3,
        is_completed: true,
        stars_earned: 3,
        completed_at: '2026-10-14T12:00:00Z',
        streak: 4,
        xp: 150,
        completed_lessons_count: 1,
        last_active_date: '2026-10-14',
      },
      error: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('1. Invokes public.sync_lesson_progress with correct parameters upon lesson completion', async () => {
    mockAuthUser = { id: 'user-rpc-1' };
    let latestState: any = null;

    const { getByTestId } = render(
      <MicrolearningProvider>
        <TestConsumer onState={(s) => (latestState = s)} />
      </MicrolearningProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('ready');
    });

    mockRpc.mockClear();

    await act(async () => {
      await latestState.completeLesson('les-1', 3, 30);
    });

    expect(mockRpc).toHaveBeenCalledWith('sync_lesson_progress', {
      p_lesson_id: 'les-1',
      p_current_step: 100,
      p_is_completed: true,
      p_stars_earned: 3,
      p_completed_at: expect.any(String),
    });

    // Authoritative reconciliation applied
    expect(latestState.gamification.xp).toBe(150);
    expect(latestState.gamification.completedLessonsCount).toBe(1);
    expect(latestState.gamification.streak).toBe(4);
    expect(latestState.userProgress['les-1']?.isCompleted).toBe(true);
    expect(latestState.userProgress['les-1']?.starsEarned).toBe(3);

    // Queue drained
    const queue = JSON.parse(localStorage.getItem(getPendingSyncStorageKey('user-rpc-1')) || '{}');
    expect(Object.keys(queue.lessons || {})).toHaveLength(0);
    expect(queue.gamificationPending).toBe(false);
  });

  it('2. Reconciles authoritative server progress and preserves monotonic step progress', async () => {
    mockAuthUser = { id: 'user-rpc-step' };
    mockRpc.mockResolvedValueOnce({
      data: {
        lesson_id: 'les-2',
        current_step: 2,
        is_completed: false,
        stars_earned: 0,
        completed_at: null,
        streak: 0,
        xp: 0,
        completed_lessons_count: 0,
        last_active_date: '2026-10-14',
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

    await act(async () => {
      await latestState.updateStepProgress('les-2', 2);
    });

    expect(mockRpc).toHaveBeenCalledWith('sync_lesson_progress', {
      p_lesson_id: 'les-2',
      p_current_step: 2,
      p_is_completed: false,
      p_stars_earned: 0,
      p_completed_at: null,
    });

    expect(latestState.userProgress['les-2']?.currentStep).toBe(2);
  });

  it('3. RPC error retains entry in pendingSync and retrySync() successfully retries upon recovery', async () => {
    mockAuthUser = { id: 'user-rpc-retry' };
    mockRpc.mockRejectedValueOnce(new Error('Network offline or database timeout'));

    let latestState: any = null;
    const { getByTestId } = render(
      <MicrolearningProvider>
        <TestConsumer onState={(s) => (latestState = s)} />
      </MicrolearningProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('ready');
    });

    await act(async () => {
      await latestState.updateStepProgress('les-3', 2);
    });

    // Pending sync queue retains the failed entry
    const savedQueue = JSON.parse(localStorage.getItem(getPendingSyncStorageKey('user-rpc-retry')) || '{}');
    expect(savedQueue.lessons['les-3']).toBeDefined();
    expect(savedQueue.lessons['les-3'].currentStep).toBe(2);
    expect(getByTestId('error').textContent).toContain('Network offline or database timeout');

    // Simulate network recovery and manual retry
    mockRpc.mockResolvedValueOnce({
      data: {
        lesson_id: 'les-3',
        current_step: 2,
        is_completed: false,
        stars_earned: 0,
        completed_at: null,
        streak: 0,
        xp: 0,
        completed_lessons_count: 0,
        last_active_date: '2026-10-14',
      },
      error: null,
    });

    await act(async () => {
      await latestState.retrySync();
    });

    // Queue drained and error cleared
    const recoveredQueue = JSON.parse(localStorage.getItem(getPendingSyncStorageKey('user-rpc-retry')) || '{}');
    expect(Object.keys(recoveredQueue.lessons || {})).toHaveLength(0);
    expect(getByTestId('error').textContent).toBe('none');
  });

  it('4. Concurrent update protection: newer local step update arriving during in-flight RPC triggers second sync and preserves monotonic progress', async () => {
    mockAuthUser = { id: 'user-concurrent-race' };
    let latestState: any = null;

    let resolveRpc: (val: any) => void;
    const rpcPromise = new Promise((resolve) => {
      resolveRpc = resolve;
    });

    // 1st call hangs until manually resolved; 2nd call completes with step 2
    mockRpc.mockReset();
    mockRpc.mockImplementationOnce(() => rpcPromise);
    mockRpc.mockResolvedValueOnce({
      data: {
        lesson_id: 'les-4',
        current_step: 2,
        is_completed: false,
        stars_earned: 0,
        completed_at: null,
        streak: 0,
        xp: 0,
        completed_lessons_count: 0,
        last_active_date: '2026-10-14',
      },
      error: null,
    });

    const { getByTestId } = render(
      <MicrolearningProvider>
        <TestConsumer onState={(s) => (latestState = s)} />
      </MicrolearningProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('ready');
    });

    // First step update starts in-flight
    act(() => {
      latestState.updateStepProgress('les-4', 1);
    });

    // While RPC for step 1 is in-flight, student advances to step 2
    act(() => {
      latestState.updateStepProgress('les-4', 2);
    });

    // Resolve the first RPC (step 1)
    await act(async () => {
      resolveRpc!({
        data: {
          lesson_id: 'les-4',
          current_step: 1,
          is_completed: false,
          stars_earned: 0,
          completed_at: null,
          streak: 0,
          xp: 0,
          completed_lessons_count: 0,
          last_active_date: '2026-10-14',
        },
        error: null,
      });
    });

    // Verify first RPC called with step 1, second RPC called with step 2
    expect(mockRpc).toHaveBeenNthCalledWith(1, 'sync_lesson_progress', expect.objectContaining({
      p_lesson_id: 'les-4',
      p_current_step: 1,
    }));
    expect(mockRpc).toHaveBeenNthCalledWith(2, 'sync_lesson_progress', expect.objectContaining({
      p_lesson_id: 'les-4',
      p_current_step: 2,
    }));

    // Local state monotonically preserved step 2
    expect(latestState.userProgress['les-4']?.currentStep).toBe(2);
  });

  it('5. User account switching isolates queues and does not leak or cross-sync data', async () => {
    mockAuthUser = { id: 'user-alice' };
    const { unmount } = render(
      <MicrolearningProvider>
        <TestConsumer />
      </MicrolearningProvider>
    );

    const aliceKey = getPendingSyncStorageKey('user-alice');
    localStorage.setItem(
      aliceKey,
      JSON.stringify({
        lessons: { 'les-1': { lessonId: 'les-1', currentStep: 2, isCompleted: false, starsEarned: 0 } },
        gamificationPending: false,
      })
    );

    unmount();

    // Switch to user Bob
    mockAuthUser = { id: 'user-bob' };
    let bobState: any = null;

    render(
      <MicrolearningProvider>
        <TestConsumer onState={(s) => (bobState = s)} />
      </MicrolearningProvider>
    );

    await waitFor(() => {
      expect(bobState.isLoading).toBe(false);
    });

    // Bob has zero pending lessons and no knowledge of Alice's progress
    const bobKey = getPendingSyncStorageKey('user-bob');
    const bobQueue = JSON.parse(localStorage.getItem(bobKey) || '{}');
    expect(Object.keys(bobQueue.lessons || {})).toHaveLength(0);
    expect(bobState.userProgress['les-1']).toBeUndefined();
  });
});
