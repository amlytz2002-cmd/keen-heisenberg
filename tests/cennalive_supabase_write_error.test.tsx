// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, cleanup, waitFor } from '@testing-library/react';
import { message } from 'antd';
import {
  MicrolearningProvider,
  useMicrolearning,
} from '../src/context/MicrolearningContext';
import { RouterProvider } from '../src/context/RouterContext';

// Mock Supabase client
let mockUpsertLessonResult: any = { error: null };
let mockUpsertGameResult: any = { error: null };

vi.mock('../src/lib/supabaseClient', () => {
  return {
    supabase: {
      from: (table: string) => {
        if (table === 'user_lesson_progress') {
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: [], error: null }),
            }),
            upsert: vi.fn().mockImplementation(() => {
              if (mockUpsertLessonResult instanceof Error) {
                return Promise.reject(mockUpsertLessonResult);
              }
              return Promise.resolve(mockUpsertLessonResult);
            }),
          };
        }
        if (table === 'user_gamification') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
            upsert: vi.fn().mockImplementation(() => {
              if (mockUpsertGameResult instanceof Error) {
                return Promise.reject(mockUpsertGameResult);
              }
              return Promise.resolve(mockUpsertGameResult);
            }),
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

describe('Supabase Write Error Handling & Sync Notifications (Finding 4)', () => {
  let messageWarningSpy: any;

  beforeEach(() => {
    localStorage.clear();
    mockAuthUser = { id: 'test-user-sync' };
    mockAuthLoading = false;
    mockUpsertLessonResult = { error: null };
    mockUpsertGameResult = { error: null };
    messageWarningSpy = vi.spyOn(message, 'warning').mockImplementation(() => ({} as any));
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('notifies student and sets syncError when updateStepProgress fails on Supabase', async () => {
    mockUpsertLessonResult = { error: { message: 'Database connection failed (503)' } };

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

    // Initial state has no sync error
    expect(contextValue.syncError).toBeNull();

    // Call updateStepProgress
    await act(async () => {
      await contextValue.updateStepProgress('les-1', 2);
    });

    // Local state should still be updated (optimistic persistence)
    expect(contextValue.userProgress['les-1']?.currentStep).toBe(2);

    // syncError should be populated
    expect(contextValue.syncError).toContain('Database connection failed (503)');

    // Student should be notified via friendly warning toast
    expect(messageWarningSpy).toHaveBeenCalledTimes(1);
    expect(messageWarningSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'cenna-sync-status',
        content: expect.stringMatching(/sunucu senkronizasyonu başarısız/i),
      })
    );
  });

  it('notifies student and sets syncError when completeLesson gamification upsert fails on Supabase', async () => {
    mockUpsertLessonResult = { error: null };
    mockUpsertGameResult = { error: { message: 'RLS permission denied' } };

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

    // Call completeLesson
    await act(async () => {
      await contextValue.completeLesson('les-1', 3, 20);
    });

    // Local state and gamification are updated
    expect(contextValue.userProgress['les-1']?.isCompleted).toBe(true);
    expect(contextValue.gamification.completedLessonsCount).toBe(1);

    // syncError reflects the gamification failure
    expect(contextValue.syncError).toContain('RLS permission denied');
    expect(messageWarningSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'cenna-sync-status',
        content: expect.stringMatching(/senkronize edilemedi/i),
      })
    );
  });

  it('handles network throw exception and alerts student without crashing', async () => {
    mockUpsertLessonResult = new Error('Network offline or fetch failed');

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

    // Call completeLesson
    await act(async () => {
      await contextValue.completeLesson('les-1', 3, 20);
    });

    // Should catch gracefully, populate syncError, and alert
    expect(contextValue.syncError).toContain('Network offline or fetch failed');
    expect(messageWarningSpy).toHaveBeenCalled();
  });

  it('clears syncError when a subsequent Supabase write succeeds', async () => {
    // First call fails
    mockUpsertLessonResult = { error: { message: 'Temporary glitch' } };

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
      await contextValue.updateStepProgress('les-1', 1);
    });
    expect(contextValue.syncError).toBeTruthy();

    // Second call succeeds
    mockUpsertLessonResult = { error: null };
    await act(async () => {
      await contextValue.updateStepProgress('les-1', 2);
    });

    // syncError is now cleared
    expect(contextValue.syncError).toBeNull();
  });

  it('ensures guest user does not attempt server writes or generate syncError', async () => {
    mockAuthUser = null; // Guest user

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

    await act(async () => {
      await contextValue.completeLesson('les-1', 3, 20);
    });

    expect(contextValue.syncError).toBeNull();
    expect(messageWarningSpy).not.toHaveBeenCalled();
    expect(contextValue.userProgress['les-1']?.isCompleted).toBe(true);
  });
});
