// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { RouterProvider, useRouter } from '../src/context/RouterContext';
import { MicrolearningProvider } from '../src/context/MicrolearningContext';
import { MissionPlayer } from '../src/views/Student/MissionPlayer';

// Mock scrollTo and matchMedia for jsdom
window.scrollTo = vi.fn();
window.matchMedia = window.matchMedia || vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Mock Supabase client
vi.mock('../src/lib/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  },
}));

// Mock AuthContext
vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    session: null,
    profile: null,
    activeRole: 'student',
    setActiveRole: vi.fn(),
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
    signInDemo: vi.fn(),
  }),
}));

// Mock medicinalChemistryMissions to include a multi-step mission alongside standard missions
vi.mock('../src/data/courses/medicinalChemistryMissions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/data/courses/medicinalChemistryMissions')>();
  return {
    ...actual,
    getMissionById: (id: string) => {
      if (id === 'mission-multi' || id === 'multi') {
        const base = actual.getMissionById('mission-1')!;
        return {
          ...base,
          id: 'mission-multi',
          title: 'Çok Adımlı Kurtarma Görevi',
          steps: [
            base.steps[0],
            {
              ...base.steps[0],
              id: 'step-multi-2',
              order: 2,
              stepNumber: 2,
              title: 'İkinci Aşama Modifikasyonu',
            },
          ],
        };
      }
      return actual.getMissionById(id);
    },
  };
});

// Route Navigation Test Harness that mirrors App.tsx routing pattern for MissionPlayer
const MissionHarness: React.FC = () => {
  const { path, navigate } = useRouter();

  return (
    <div>
      <div data-testid="nav-controls">
        <button onClick={() => navigate('/learn/mission/mission-1')}>Go Mission 1</button>
        <button onClick={() => navigate('/learn/mission/mission-2')}>Go Mission 2</button>
        <button onClick={() => navigate('/learn/mission/mission-multi')}>Go Mission Multi</button>
      </div>
      <div data-testid="active-path">{path}</div>
      <MissionPlayer key={path} />
    </div>
  );
};

describe('MissionPlayer - Mission State Isolation & History Navigation (Finding 1)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    window.history.pushState({}, '', '/learn/mission/mission-1');
  });

  afterEach(() => {
    cleanup();
  });

  it('1. Mistake count is isolated: mistakes in Mission 1 do not carry over to Mission 2', async () => {
    const { getByText } = render(
      <RouterProvider>
        <MicrolearningProvider>
          <MissionHarness />
        </MicrolearningProvider>
      </RouterProvider>
    );

    // Initial load: Mission 1 (Aspirin Ester Montajı)
    expect(getByText(/Aspirin Ester Montajı/i)).toBeTruthy();
    expect(getByText(/Kurtarma Adımı 1 \/ 1/i)).toBeTruthy();

    // In Mission 1: select incorrect tool 'Metil Grubu (Eter Tuzağı)'
    const wrongTool = getByText(/Metil Grubu/i);
    fireEvent.click(wrongTool);

    // Click 'Modifikasyonu Uygula'
    const applyBtn = getByText('Modifikasyonu Uygula');
    fireEvent.click(applyBtn);

    // Verify incorrect feedback received (1 mistake recorded in Mission 1)
    await waitFor(() => {
      expect(getByText(/Moleküler modifikasyon beklenen farmakokinetik/i)).toBeTruthy();
    });

    // Navigate to Mission 2
    fireEvent.click(getByText('Go Mission 2'));

    // Verify Mission 2 loaded (Prokainamid Amid Zırhı)
    await waitFor(() => {
      expect(getByText(/Prokainamid Amid Zırhı/i)).toBeTruthy();
    });

    // In Mission 2: select correct tool 'Amid Köprüsü (-CONH-)' on first attempt
    const correctTool = getByText(/Amid Köprüsü/i);
    fireEvent.click(correctTool);

    // Click 'Modifikasyonu Uygula'
    fireEvent.click(getByText('Modifikasyonu Uygula'));

    // Victory modal should appear
    await waitFor(() => {
      expect(getByText(/KLİNİK KURTARMA BAŞARILI! 🎉/i)).toBeTruthy();
    });

    // Confirm that 3 stars are awarded because mistakes in Mission 1 were NOT carried over
    // Check localStorage saved progress for Mission 2
    const saved = localStorage.getItem('cenna_microlearning_progress_guest');
    expect(saved).toBeTruthy();
    const progressMap = JSON.parse(saved!);
    expect(progressMap['mission-2']?.starsEarned).toBe(3);
    expect(progressMap['mission-2']?.isCompleted).toBe(true);
  }, 15000);

  it('2. Victory modal does not carry over to the next mission or across history navigation', async () => {
    const { getByText, queryByText } = render(
      <RouterProvider>
        <MicrolearningProvider>
          <MissionHarness />
        </MicrolearningProvider>
      </RouterProvider>
    );

    // Complete Mission 1 correctly on first attempt
    expect(getByText(/Aspirin Ester Montajı/i)).toBeTruthy();
    const correctTool = getByText(/Asetil Grubu/i);
    fireEvent.click(correctTool);
    fireEvent.click(getByText('Modifikasyonu Uygula'));

    // Victory modal appears in Mission 1
    await waitFor(() => {
      expect(getByText(/KLİNİK KURTARMA BAŞARILI! 🎉/i)).toBeTruthy();
    });

    // Navigate to Mission 2
    fireEvent.click(getByText('Go Mission 2'));

    // In Mission 2: Victory modal should NOT be displayed
    await waitFor(() => {
      expect(getByText(/Prokainamid Amid Zırhı/i)).toBeTruthy();
    });
    expect(queryByText(/KLİNİK KURTARMA BAŞARILI! 🎉/i)).toBeNull();

    // Now navigate back to Mission 1 using browser Back
    window.history.back();
    fireEvent(window, new PopStateEvent('popstate'));

    // Mission 1 reloads in fresh interactive state without victory modal blocking
    await waitFor(() => {
      expect(getByText(/Aspirin Ester Montajı/i)).toBeTruthy();
    });
    expect(queryByText(/KLİNİK KURTARMA BAŞARILI! 🎉/i)).toBeNull();
  }, 15000);

  it('3. Step progression and completion behavior remain intact within a mission', async () => {
    const { getByText } = render(
      <RouterProvider>
        <MicrolearningProvider>
          <MissionHarness />
        </MicrolearningProvider>
      </RouterProvider>
    );

    expect(getByText(/Kurtarma Adımı 1 \/ 1/i)).toBeTruthy();

    // Select correct tool for Mission 1
    const correctTool = getByText(/Asetil Grubu/i);
    fireEvent.click(correctTool);
    fireEvent.click(getByText('Modifikasyonu Uygula'));

    await waitFor(() => {
      expect(getByText(/KLİNİK KURTARMA BAŞARILI! 🎉/i)).toBeTruthy();
    });

    const saved = localStorage.getItem('cenna_microlearning_progress_guest');
    expect(saved).toBeTruthy();
    const progressMap = JSON.parse(saved!);
    expect(progressMap['mission-1']?.isCompleted).toBe(true);
    expect(progressMap['mission-1']?.starsEarned).toBe(3);
  });

  it('4. Navigating from a longer multi-step mission to a shorter mission safely resets step index and does not crash', async () => {
    // Start at multi-step mission
    window.history.pushState({}, '', '/learn/mission/mission-multi');

    const { getByText, getAllByText } = render(
      <RouterProvider>
        <MicrolearningProvider>
          <MissionHarness />
        </MicrolearningProvider>
      </RouterProvider>
    );

    // Initial load: multi-step mission step 1 of 2
    await waitFor(() => {
      expect(getByText(/Çok Adımlı Kurtarma Görevi/i)).toBeTruthy();
    });
    expect(getByText(/Kurtarma Adımı 1 \/ 2/i)).toBeTruthy();

    // Advance to step 2 of the longer mission
    const correctTool = getByText(/Asetil Grubu/i);
    fireEvent.click(correctTool);
    fireEvent.click(getByText('Modifikasyonu Uygula'));

    // Wait for "Sonraki Adıma Geç" button and click it to advance to step 2
    await waitFor(() => {
      expect(getByText('Sonraki Adıma Geç')).toBeTruthy();
    });
    fireEvent.click(getByText('Sonraki Adıma Geç'));

    // Verify step 2 is active
    await waitFor(() => {
      expect(getByText(/Kurtarma Adımı 2 \/ 2/i)).toBeTruthy();
      expect(getAllByText(/İkinci Aşama Modifikasyonu/i).length).toBeGreaterThanOrEqual(1);
    });

    // Now navigate to a shorter mission (Mission 1, which only has 1 step)
    fireEvent.click(getByText('Go Mission 1'));

    // Verify Mission 1 loaded cleanly at step 1/1 without index out of bounds or crash
    await waitFor(() => {
      expect(getByText(/Aspirin Ester Montajı/i)).toBeTruthy();
    });
    expect(getByText(/Kurtarma Adımı 1 \/ 1/i)).toBeTruthy();

    // Now trigger browser history back to the longer mission
    window.history.back();
    fireEvent(window, new PopStateEvent('popstate'));

    // Verify longer mission re-renders cleanly without crash
    await waitFor(() => {
      expect(getByText(/Çok Adımlı Kurtarma Görevi/i)).toBeTruthy();
    });
    expect(getByText(/Kurtarma Adımı 1 \/ 2/i)).toBeTruthy();
  });
});
