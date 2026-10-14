// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, waitFor, cleanup } from '@testing-library/react';
import {
  MicrolearningProvider,
  useMicrolearning,
  getProgressStorageKey,
} from '../src/context/MicrolearningContext';

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

const TestConsumer: React.FC<{
  onState?: (state: ReturnType<typeof useMicrolearning>) => void;
}> = ({ onState }) => {
  const microlearning = useMicrolearning();
  if (onState) onState(microlearning);
  return (
    <div data-testid="consumer">
      <span data-testid="loading">{microlearning.isLoading ? 'loading' : 'ready'}</span>
    </div>
  );
};

describe('MicrolearningContext - Step Progress Monotonicity & Server Rollback Prevention', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockAuthUser = { id: 'test-user-123' };
    mockAuthLoading = false;
    mockSelectLesson.mockResolvedValue({ data: [], error: null });
    mockMaybeSingleGame.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    cleanup();
  });

  it('1. updateStepProgress with a lower step does not roll back current_step on the server', async () => {
    // Initial remote state: student is at step 3
    mockSelectLesson.mockResolvedValue({
      data: [
        {
          lesson_id: 'les-1',
          is_completed: false,
          current_step: 3,
          stars_earned: 0,
          completed_at: null,
        },
      ],
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

    expect(latestState.userProgress['les-1']?.currentStep).toBe(3);

    // Student re-opens step 1 and advances step 1
    mockUpsertLesson.mockClear();
    await act(async () => {
      await latestState.updateStepProgress('les-1', 1);
    });

    // In local state, currentStep remains 3
    expect(latestState.userProgress['les-1']?.currentStep).toBe(3);

    // CRITICAL: On the server, current_step must NOT be rolled back to 1! It must be 3.
    expect(mockUpsertLesson).toHaveBeenCalledTimes(1);
    expect(mockUpsertLesson).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'test-user-123',
        lesson_id: 'les-1',
        current_step: 3,
      }),
      { onConflict: 'user_id,lesson_id' }
    );
  });

  it('2. updateStepProgress on an already completed lesson does not roll back current_step or erase completed status', async () => {
    // Initial remote state: lesson is already completed with 3 stars at step 100
    const completedAt = '2026-10-10T10:00:00Z';
    mockSelectLesson.mockResolvedValue({
      data: [
        {
          lesson_id: 'les-2',
          is_completed: true,
          current_step: 100,
          stars_earned: 3,
          completed_at: completedAt,
        },
      ],
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

    mockUpsertLesson.mockClear();

    // Student reviews step 1 of les-2
    await act(async () => {
      await latestState.updateStepProgress('les-2', 1);
    });

    expect(mockUpsertLesson).toHaveBeenCalledTimes(1);
    expect(mockUpsertLesson).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'test-user-123',
        lesson_id: 'les-2',
        current_step: 100,
        is_completed: true,
        stars_earned: 3,
        completed_at: completedAt,
      }),
      { onConflict: 'user_id,lesson_id' }
    );
  });

  it('3. completeLesson includes current_step (100) in the server upsert payload', async () => {
    let latestState: any = null;
    const { getByTestId } = render(
      <MicrolearningProvider>
        <TestConsumer onState={(s) => (latestState = s)} />
      </MicrolearningProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('ready');
    });

    mockUpsertLesson.mockClear();

    await act(async () => {
      await latestState.completeLesson('les-3', 3, 50);
    });

    expect(mockUpsertLesson).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'test-user-123',
        lesson_id: 'les-3',
        is_completed: true,
        current_step: 100,
        stars_earned: 3,
      }),
      { onConflict: 'user_id,lesson_id' }
    );
  });

  it('4. in-flight completed lessons include current_step when synced to server after load', async () => {
    mockSelectLesson.mockResolvedValue({
      data: [],
      error: null,
    });

    // Simulate pre-existing local storage with a completed lesson that has not synced to server yet
    localStorage.setItem(
      getProgressStorageKey('test-user-123'),
      JSON.stringify({
        'les-4': {
          lessonId: 'les-4',
          isCompleted: true,
          currentStep: 100,
          starsEarned: 2,
          completedAt: '2026-10-12T14:00:00Z',
        },
      })
    );

    render(
      <MicrolearningProvider>
        <TestConsumer />
      </MicrolearningProvider>
    );

    await waitFor(() => {
      expect(mockUpsertLesson).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'test-user-123',
          lesson_id: 'les-4',
          is_completed: true,
          current_step: 100,
          stars_earned: 2,
        }),
        { onConflict: 'user_id,lesson_id' }
      );
    });
  });

  it('5. updateMissionStepProgress canonicalizes ID and maintains monotonic step progress', async () => {
    let latestState: any = null;
    const { getByTestId } = render(
      <MicrolearningProvider>
        <TestConsumer onState={(s) => (latestState = s)} />
      </MicrolearningProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('ready');
    });

    mockUpsertLesson.mockClear();

    // Advance to step 2 of mission-1
    await act(async () => {
      await latestState.updateMissionStepProgress('mission-1', 2);
    });

    expect(mockUpsertLesson).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'test-user-123',
        lesson_id: 'mission-1',
        current_step: 2,
      }),
      { onConflict: 'user_id,lesson_id' }
    );

    mockUpsertLesson.mockClear();

    // Attempt to update with step 1
    await act(async () => {
      await latestState.updateMissionStepProgress('mission-1', 1);
    });

    // Server must retain step 2
    expect(mockUpsertLesson).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'test-user-123',
        lesson_id: 'mission-1',
        current_step: 2,
      }),
      { onConflict: 'user_id,lesson_id' }
    );
  });

  it('6. Rapid interleaved step updates preserve the maximum step achieved', async () => {
    let latestState: any = null;
    const { getByTestId } = render(
      <MicrolearningProvider>
        <TestConsumer onState={(s) => (latestState = s)} />
      </MicrolearningProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('ready');
    });

    mockUpsertLesson.mockClear();

    // Advance 1, 2, 3 rapidly with an accidental late arrival of step 1
    await act(async () => {
      await latestState.updateStepProgress('les-5', 1);
      await latestState.updateStepProgress('les-5', 2);
      await latestState.updateStepProgress('les-5', 3);
      await latestState.updateStepProgress('les-5', 1);
    });

    expect(latestState.userProgress['les-5'].currentStep).toBe(3);

    const calls = mockUpsertLesson.mock.calls;
    const lastCallPayload = calls[calls.length - 1][0];
    expect(lastCallPayload.current_step).toBe(3);
  });

  it('7. updateStepProgress on an uncompleted lesson omits completion fields so server completions cannot be overwritten', async () => {
    let latestState: any = null;
    const { getByTestId } = render(
      <MicrolearningProvider>
        <TestConsumer onState={(s) => (latestState = s)} />
      </MicrolearningProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('ready');
    });

    mockUpsertLesson.mockClear();

    await act(async () => {
      await latestState.updateStepProgress('les-6', 2);
    });

    expect(mockUpsertLesson).toHaveBeenCalledTimes(1);
    const payload = mockUpsertLesson.mock.calls[0][0];

    // Verify current_step and user/lesson keys are present
    expect(payload.user_id).toBe('test-user-123');
    expect(payload.lesson_id).toBe('les-6');
    expect(payload.current_step).toBe(2);

    // CRITICAL: is_completed, stars_earned, and completed_at MUST NOT be present
    // so an incomplete local state never downgrades or clears server completion
    expect(payload).not.toHaveProperty('is_completed');
    expect(payload).not.toHaveProperty('stars_earned');
    expect(payload).not.toHaveProperty('completed_at');
  });
});


