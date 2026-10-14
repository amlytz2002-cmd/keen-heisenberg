// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, waitFor, cleanup, screen } from '@testing-library/react';
import { MicrolearningProvider } from '../src/context/MicrolearningContext';
import { SkillTreeView } from '../src/views/Student/SkillTreeView';
import { RouterProvider } from '../src/context/RouterContext';

// Mock Supabase client
let mockSelectLessonPromise: Promise<any>;
let mockSelectLessonResolve: (val: any) => void;

let mockMaybeSingleGamePromise: Promise<any>;
let mockMaybeSingleGameResolve: (val: any) => void;

vi.mock('../src/lib/supabaseClient', () => {
  return {
    supabase: {
      from: (table: string) => {
        if (table === 'user_lesson_progress') {
          return {
            select: () => ({
              eq: () => mockSelectLessonPromise,
            }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === 'user_gamification') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => mockMaybeSingleGamePromise,
              }),
            }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
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

describe('SkillTreeView Loading Skeleton & Hydration Defense', () => {
  beforeEach(() => {
    localStorage.clear();
    mockAuthUser = null;
    mockAuthLoading = false;

    mockSelectLessonPromise = new Promise((resolve) => {
      mockSelectLessonResolve = resolve;
    });
    mockMaybeSingleGamePromise = new Promise((resolve) => {
      mockMaybeSingleGameResolve = resolve;
    });
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders accessible loading skeleton when remote progress is pending (isLoading=true)', async () => {
    // Authenticated user with pending remote fetch
    mockAuthUser = { id: 'user-hydration-1' };

    render(
      <RouterProvider>
        <MicrolearningProvider>
          <SkillTreeView />
        </MicrolearningProvider>
      </RouterProvider>
    );

    // Should display the loading skeleton
    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeDefined();
    expect(skeleton.getAttribute('aria-busy')).toBe('true');
    expect(skeleton.getAttribute('aria-label')).toMatch(/yükleniyor/i);

    // Should NOT display false 0% progress bar or false locked lesson list
    expect(screen.queryByText(/0 \/ 21 Ders Tamamlandı/i)).toBeNull();
    expect(screen.queryByText(/Hemen Başla/i)).toBeNull();
  });

  it('transitions from skeleton to hydrated content once remote progress resolves', async () => {
    mockAuthUser = { id: 'user-hydration-2' };

    render(
      <RouterProvider>
        <MicrolearningProvider>
          <SkillTreeView />
        </MicrolearningProvider>
      </RouterProvider>
    );

    // Skeleton is active
    expect(screen.getByRole('status')).toBeDefined();

    // Resolve remote Supabase responses with 2 completed lessons
    await act(async () => {
      mockSelectLessonResolve({
        data: [
          {
            lesson_id: 'les-1',
            is_completed: true,
            current_step: 2,
            stars_earned: 3,
            completed_at: '2026-10-10T10:00:00Z',
          },
          {
            lesson_id: 'les-2',
            is_completed: true,
            current_step: 2,
            stars_earned: 2,
            completed_at: '2026-10-10T11:00:00Z',
          },
        ],
        error: null,
      });

      mockMaybeSingleGameResolve({
        data: {
          streak: 5,
          xp: 450,
          completed_lessons_count: 2,
          last_active_date: '2026-10-14',
        },
        error: null,
      });
    });

    // Skeleton is removed, actual tree is rendered
    await waitFor(() => {
      expect(screen.queryByRole('status')).toBeNull();
    });

    // Hydrated values appear
    expect(screen.getByText(/2 \/ 21 Ders Tamamlandı/i)).toBeDefined();
    expect(screen.getByText(/%10/i)).toBeDefined();
    // Next lesson should be Lesson 3
    expect(screen.getByText(/Sıradaki Mikro-Ders/i)).toBeDefined();
    expect(screen.getByText(/3\. /i)).toBeDefined();
    expect(screen.getByText(/Hemen Başla/i)).toBeDefined();
  });

  it('renders immediately without skeleton if user is guest and isLoading is false', async () => {
    mockAuthUser = null; // Guest user loads synchronously from localStorage

    render(
      <RouterProvider>
        <MicrolearningProvider>
          <SkillTreeView />
        </MicrolearningProvider>
      </RouterProvider>
    );

    // Guest loads immediately, no pending remote fetch
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByText(/0 \/ 21 Ders Tamamlandı/i)).toBeDefined();
    expect(screen.getByText(/KADEME 1: TEMEL İLKELER & SAR/i)).toBeDefined();
  });
});
