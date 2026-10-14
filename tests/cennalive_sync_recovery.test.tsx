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

  it('7. Concurrent step progression during in-flight network sync preserves the newer step', async () => {
    let resolveFirstUpsert: (val: any) => void;
    const firstUpsertPromise = new Promise((resolve) => {
      resolveFirstUpsert = resolve;
    });

    let upsertCount = 0;
    const recordedPayloads: any[] = [];
    mockUpsertLessonFn.mockImplementation((payload: any) => {
      upsertCount++;
      recordedPayloads.push({ ...payload });
      if (upsertCount === 1) {
        return firstUpsertPromise;
      }
      return Promise.resolve({ error: null });
    });

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

    // 1. Start Step 1 update (goes in-flight)
    const update1Promise = contextValue.updateStepProgress('les-1', 1);

    // 2. Before step 1 resolves, student quickly advances to Step 2
    await act(async () => {
      await contextValue.updateStepProgress('les-1', 2);
    });

    // 3. Resolve the in-flight Step 1 write
    await act(async () => {
      resolveFirstUpsert!({ error: null });
      await update1Promise;
    });

    // Both Step 1 and Step 2 must have been processed by the queue loop
    await waitFor(() => {
      expect(contextValue.syncError).toBeNull();
    });

    // The final payload sent to Supabase must reflect Step 2
    const lastPayload = recordedPayloads[recordedPayloads.length - 1];
    expect(lastPayload.current_step).toBe(2);

    // The queue should now be empty because Step 2 was confirmed
    const pendingKey = getPendingSyncStorageKey('user-sync-recovery');
    const stored = JSON.parse(localStorage.getItem(pendingKey) || '{}');
    expect(stored.lessons?.['les-1']).toBeUndefined();
  });

  it('8. Concurrent lesson completion during in-flight network sync preserves higher XP and completed count', async () => {
    let resolveFirstGame: (val: any) => void;
    const firstGamePromise = new Promise((resolve) => {
      resolveFirstGame = resolve;
    });

    let gameUpsertCount = 0;
    const recordedGamePayloads: any[] = [];
    mockUpsertGameFn.mockImplementation((payload: any) => {
      gameUpsertCount++;
      recordedGamePayloads.push({ ...payload });
      if (gameUpsertCount === 1) {
        return firstGamePromise;
      }
      return Promise.resolve({ error: null });
    });

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

    // Complete lesson 1 (+20 XP) -> goes in-flight
    const comp1Promise = contextValue.completeLesson('les-1', 3, 20);

    // Concurrently complete lesson 2 (+20 XP)
    await act(async () => {
      await contextValue.completeLesson('les-2', 3, 20);
    });

    // Resolve first gamification write
    await act(async () => {
      resolveFirstGame!({ error: null });
      await comp1Promise;
    });

    await waitFor(() => {
      expect(contextValue.syncError).toBeNull();
    });

    // Local XP must be 160 (120 starter + 20 + 20)
    expect(contextValue.gamification.xp).toBe(160);
    expect(contextValue.gamification.completedLessonsCount).toBe(2);

    // The final gamification payload sent to Supabase must have the full 160 XP
    const lastGamePayload = recordedGamePayloads[recordedGamePayloads.length - 1];
    expect(lastGamePayload.xp).toBe(160);
    expect(lastGamePayload.completed_lessons_count).toBe(2);
  });

  it('9. Storage quota failure (localStorage.setItem throws) populates syncError and notifies student', async () => {
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: any, key: string, _val: string) {
      if (key.includes('pending_sync')) {
        throw new Error('QuotaExceededError: DOM Exception 22');
      }
    });

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

    // syncError is populated due to storage failure
    expect(contextValue.syncError).toContain('Yerel depolama alanı dolu');

    storageSpy.mockRestore();
  });

  it('10. Unmounting provider while sync is in flight aborts cleanly without crashing', async () => {
    let resolveInFlight: (val: any) => void;
    const inFlightPromise = new Promise((resolve) => {
      resolveInFlight = resolve;
    });
    mockUpsertLessonFn.mockReturnValueOnce(inFlightPromise);

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

    // Start write
    const writePromise = contextValue.updateStepProgress('les-1', 2);

    // Unmount while in-flight
    unmount();

    // Resolve in-flight request after unmount
    await act(async () => {
      resolveInFlight!({ error: null });
      await writePromise;
    });

    // Successfully completed without throwing unhandled error
  });

  it('11. Reloading with multiple offline lesson completions merges monotonically and flushes all completions', async () => {
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

    // Complete 3 lessons offline
    await act(async () => {
      await contextValue.completeLesson('les-1', 3, 20);
      await contextValue.completeLesson('les-2', 3, 30);
      await contextValue.completeLesson('les-3', 2, 25);
    });

    // 120 + 20 + 30 + 25 = 195 XP, 3 completed lessons
    expect(contextValue.gamification.xp).toBe(195);
    expect(contextValue.gamification.completedLessonsCount).toBe(3);

    unmount();

    // Stale server baseline returns 120 XP, 0 completed
    mockSelectGameResult = {
      data: { streak: 3, xp: 120, completed_lessons_count: 0, last_active_date: '2026-10-14' },
      error: null,
    };
    mockSelectProgressResult = { data: [], error: null };

    // Connection restored
    mockUpsertLessonResult = { error: null };
    mockUpsertGameResult = { error: null };
    mockUpsertLessonFn.mockClear();
    mockUpsertGameFn.mockClear();

    render(
      <RouterProvider>
        <MicrolearningProvider>
          <TestConsumer />
        </MicrolearningProvider>
      </RouterProvider>
    );

    await waitFor(() => expect(contextValue.isLoading).toBe(false));

    // Preserved across reload!
    expect(contextValue.gamification.xp).toBe(195);
    expect(contextValue.gamification.completedLessonsCount).toBe(3);
    expect(contextValue.userProgress['les-1']?.isCompleted).toBe(true);
    expect(contextValue.userProgress['les-2']?.isCompleted).toBe(true);
    expect(contextValue.userProgress['les-3']?.isCompleted).toBe(true);

    // Pending writes were flushed to Supabase
    await waitFor(() => {
      expect(contextValue.syncError).toBeNull();
    });
    expect(mockUpsertLessonFn).toHaveBeenCalled();
    expect(mockUpsertGameFn).toHaveBeenCalled();
  });

  it('12. Independent error isolation: progress write success does not discard failed gamification, and vice versa', async () => {
    // Lesson 1 succeeds, gamification fails
    mockUpsertLessonResult = { error: null };
    mockUpsertGameResult = { error: { message: 'Gamification quota exceeded' } };

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

    const pendingKey = getPendingSyncStorageKey('user-sync-recovery');
    const stored1 = JSON.parse(localStorage.getItem(pendingKey) || '{}');

    // Lesson was successfully saved to cloud, so removed from lessons
    expect(stored1.lessons?.['les-1']).toBeUndefined();
    // Gamification failed, so gamificationPending MUST remain true
    expect(stored1.gamificationPending).toBe(true);
    expect(contextValue.syncError).toContain('Gamification quota exceeded');

    // Now lesson 2 progress fails, but gamification recovers
    mockUpsertLessonResult = { error: { message: 'Lesson write failed' } };
    mockUpsertGameResult = { error: null };

    await act(async () => {
      await contextValue.updateStepProgress('les-2', 2);
    });

    const stored2 = JSON.parse(localStorage.getItem(pendingKey) || '{}');
    // Gamification has now succeeded!
    expect(stored2.gamificationPending).toBe(false);
    // But lesson 2 failed, so it must stay in the queue
    expect(stored2.lessons?.['les-2']).toBeDefined();
    expect(contextValue.syncError).toContain('Lesson write failed');
  });
});
