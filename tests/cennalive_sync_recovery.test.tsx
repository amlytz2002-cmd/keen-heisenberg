// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, cleanup, waitFor } from '@testing-library/react';
import { message } from 'antd';
import {
  MicrolearningProvider,
  useMicrolearning,
  getPendingSyncStorageKey,
} from '../src/context/MicrolearningContext';
import { RouterProvider } from '../src/context/RouterContext';

// Mock Supabase client
let mockUpsertLessonResult: any = { error: null };
let mockUpsertGameResult: any = { error: null };
let mockSelectProgressResult: any = { data: [], error: null };
let mockSelectGameResult: any = { data: null, error: null };

const mockUpsertLessonFn = vi.fn();
const mockUpsertGameFn = vi.fn();

vi.mock('../src/lib/supabaseClient', () => {
  return {
    supabase: {
      from: (table: string) => {
        if (table === 'user_lesson_progress') {
          return {
            select: () => ({
              eq: () => Promise.resolve(mockSelectProgressResult),
            }),
            upsert: (payload: any, options?: any) => {
              mockUpsertLessonFn(payload, options);
              if (mockUpsertLessonResult instanceof Error) {
                return Promise.reject(mockUpsertLessonResult);
              }
              return Promise.resolve(mockUpsertLessonResult || { error: null });
            },
          };
        }
        if (table === 'user_gamification') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve(mockSelectGameResult),
              }),
            }),
            upsert: (payload: any) => {
              mockUpsertGameFn(payload);
              if (mockUpsertGameResult instanceof Error) {
                return Promise.reject(mockUpsertGameResult);
              }
              return Promise.resolve(mockUpsertGameResult || { error: null });
            },
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
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    }),
  };
});

describe('Cloud Progress Sync Recovery & Resilience', () => {
  beforeEach(() => {
    localStorage.clear();
    mockAuthUser = { id: 'user-sync-recovery' };
    mockAuthLoading = false;
    mockUpsertLessonResult = { error: null };
    mockUpsertGameResult = { error: null };
    mockSelectProgressResult = { data: [], error: null };
    mockSelectGameResult = { data: null, error: null };
    mockUpsertLessonFn.mockClear();
    mockUpsertGameFn.mockClear();
    vi.spyOn(message, 'warning').mockImplementation(() => ({} as any));
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('1. Durably stores pending writes in user-scoped localStorage when offline', async () => {
    mockUpsertLessonResult = { error: { message: 'Network offline (503)' } };

    let contextValue!: ReturnType<typeof useMicrolearning>;
    const TestConsumer = () => {
      contextValue = useMicrolearning();
      return <div>Ready</div>;
    };

    render(
      <RouterProvider>
        <MicrolearningProvider>
          <TestConsumer />
        </MicrolearningProvider>
      </RouterProvider>
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    // Update step while offline
    await act(async () => {
      await contextValue.updateStepProgress('les-1', 2);
    });

    // Check that pending write was durably saved in user's key
    const pendingKey = getPendingSyncStorageKey('user-sync-recovery');
    const storedPending = JSON.parse(localStorage.getItem(pendingKey) || '{}');
    expect(storedPending.lessons).toBeDefined();
    expect(storedPending.lessons['les-1']).toBeDefined();
    expect(storedPending.lessons['les-1'].currentStep).toBe(2);

    // Another user's pending storage is non-existent
    expect(localStorage.getItem(getPendingSyncStorageKey('other-user'))).toBeNull();
  });

  it('2. Automatically retries pending writes when "online" event triggers', async () => {
    // Initial write fails
    mockUpsertLessonResult = { error: { message: 'Connection dropped' } };

    let contextValue!: ReturnType<typeof useMicrolearning>;
    const TestConsumer = () => {
      contextValue = useMicrolearning();
      return <div>Ready</div>;
    };

    render(
      <RouterProvider>
        <MicrolearningProvider>
          <TestConsumer />
        </MicrolearningProvider>
      </RouterProvider>
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    await act(async () => {
      await contextValue.updateStepProgress('les-1', 2);
    });

    expect(contextValue.syncError).toBeTruthy();
    const pendingKey = getPendingSyncStorageKey('user-sync-recovery');
    expect(JSON.parse(localStorage.getItem(pendingKey) || '{}').lessons['les-1']).toBeDefined();

    // Connection is restored
    mockUpsertLessonResult = { error: null };
    mockUpsertLessonFn.mockClear();

    // Trigger window online event
    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });

    // Pending writes should be automatically flushed and syncError cleared
    await waitFor(() => {
      expect(contextValue.syncError).toBeNull();
    });

    expect(mockUpsertLessonFn).toHaveBeenCalled();
    const updatedPending = JSON.parse(localStorage.getItem(pendingKey) || '{}');
    expect(Object.keys(updatedPending.lessons || {}).length).toBe(0);
  });

  it('3. Preserves offline-earned XP and completed lessons across page reload', async () => {
    // User completes a lesson offline
    mockUpsertLessonResult = { error: { message: 'Offline' } };
    mockUpsertGameResult = { error: { message: 'Offline' } };

    let contextValue!: ReturnType<typeof useMicrolearning>;
    const TestConsumer = () => {
      contextValue = useMicrolearning();
      return <div>Ready</div>;
    };

    const { unmount } = render(
      <RouterProvider>
        <MicrolearningProvider>
          <TestConsumer />
        </MicrolearningProvider>
      </RouterProvider>
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    await act(async () => {
      await contextValue.completeLesson('les-1', 3, 20);
    });

    // Local XP is 140 (120 starter + 20)
    expect(contextValue.gamification.xp).toBe(140);
    expect(contextValue.gamification.completedLessonsCount).toBe(1);

    // Unmount (simulating page close / reload)
    unmount();

    // Server returns the OLD stale baseline (120 XP, 0 completed)
    mockSelectGameResult = {
      data: {
        streak: 3,
        xp: 120,
        completed_lessons_count: 0,
        last_active_date: '2026-10-14',
      },
      error: null,
    };
    mockSelectProgressResult = { data: [], error: null };

    // Connection is back online
    mockUpsertLessonResult = { error: null };
    mockUpsertGameResult = { error: null };

    // Remount (reload)
    render(
      <RouterProvider>
        <MicrolearningProvider>
          <TestConsumer />
        </MicrolearningProvider>
      </RouterProvider>
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    // Offline-earned XP and completion must NOT be wiped out by the stale server row!
    expect(contextValue.gamification.xp).toBe(140);
    expect(contextValue.gamification.completedLessonsCount).toBe(1);
    expect(contextValue.userProgress['les-1']?.isCompleted).toBe(true);
  });

  it('4. Does not clear syncError on partial success until all pending items succeed', async () => {
    // Lesson progress succeeds, but gamification fails
    mockUpsertLessonResult = { error: null };
    mockUpsertGameResult = { error: { message: 'Gamification write timeout' } };

    let contextValue!: ReturnType<typeof useMicrolearning>;
    const TestConsumer = () => {
      contextValue = useMicrolearning();
      return <div>Ready</div>;
    };

    render(
      <RouterProvider>
        <MicrolearningProvider>
          <TestConsumer />
        </MicrolearningProvider>
      </RouterProvider>
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    await act(async () => {
      await contextValue.completeLesson('les-1', 3, 20);
    });

    // syncError is active due to gamification failure
    expect(contextValue.syncError).toContain('Gamification write timeout');

    // Now, student performs a step update on lesson 2 while gamification is STILL failing
    await act(async () => {
      await contextValue.updateStepProgress('les-2', 1);
    });

    // syncError MUST NOT be cleared because gamification is still pending!
    expect(contextValue.syncError).toContain('Gamification write timeout');

    // Now gamification recovers
    mockUpsertGameResult = { error: null };

    // Student performs another action or calls retrySync()
    await act(async () => {
      await contextValue.retrySync();
    });

    // Now that everything succeeded, syncError is cleanly cleared
    expect(contextValue.syncError).toBeNull();
  });

  it('5. Prevents cross-account leakage during account switching', async () => {
    // User A has offline pending writes
    mockAuthUser = { id: 'user-A' };
    mockUpsertLessonResult = { error: { message: 'Offline' } };

    let contextValue!: ReturnType<typeof useMicrolearning>;
    const TestConsumer = () => {
      contextValue = useMicrolearning();
      return <div>Ready</div>;
    };

    const { rerender } = render(
      <RouterProvider>
        <MicrolearningProvider>
          <TestConsumer />
        </MicrolearningProvider>
      </RouterProvider>
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    await act(async () => {
      await contextValue.updateStepProgress('les-1', 3);
    });

    // Switch to User B
    mockAuthUser = { id: 'user-B' };
    mockUpsertLessonFn.mockClear();

    rerender(
      <RouterProvider>
        <MicrolearningProvider>
          <TestConsumer />
        </MicrolearningProvider>
      </RouterProvider>
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    // User B should not see User A's progress or pending sync
    expect(contextValue.userProgress['les-1']).toBeUndefined();
    expect(contextValue.syncError).toBeNull();
  });

  it('6. Multiple retries are idempotent and do not duplicate rewards', async () => {
    mockUpsertLessonResult = { error: null };
    mockUpsertGameResult = { error: null };

    let contextValue!: ReturnType<typeof useMicrolearning>;
    const TestConsumer = () => {
      contextValue = useMicrolearning();
      return <div>Ready</div>;
    };

    render(
      <RouterProvider>
        <MicrolearningProvider>
          <TestConsumer />
        </MicrolearningProvider>
      </RouterProvider>
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    await act(async () => {
      await contextValue.completeLesson('les-1', 3, 20);
    });

    const initialXp = contextValue.gamification.xp;
    const initialCount = contextValue.gamification.completedLessonsCount;

    // Call retrySync() 3 times
    await act(async () => {
      await contextValue.retrySync();
      await contextValue.retrySync();
      await contextValue.retrySync();
    });

    // XP and counts must remain strictly identical
    expect(contextValue.gamification.xp).toBe(initialXp);
    expect(contextValue.gamification.completedLessonsCount).toBe(initialCount);
  });
});
