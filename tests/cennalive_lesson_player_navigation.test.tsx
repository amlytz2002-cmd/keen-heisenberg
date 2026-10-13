// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, waitFor, cleanup, screen } from '@testing-library/react';
import { RouterProvider, useRouter } from '../src/context/RouterContext';
import { MicrolearningProvider } from '../src/context/MicrolearningContext';
import { InteractiveLessonPlayer } from '../src/views/Student/InteractiveLessonPlayer';

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

// Mock Supabase client to prevent any remote network attempts
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

// Mock AuthContext with a guest user
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

// Route Navigation Test Harness that mirrors App.tsx routing pattern
const PlayerHarness: React.FC = () => {
  const { path, navigate } = useRouter();

  return (
    <div>
      <div data-testid="nav-controls">
        <button onClick={() => navigate('/learn/lesson/les-1')}>Go les-1</button>
        <button onClick={() => navigate('/learn/lesson/les-8')}>Go les-8</button>
        <button onClick={() => navigate('/learn/lesson/les-2')}>Go les-2</button>
        <button onClick={() => navigate('/learn/lesson/les-4')}>Go les-4</button>
        <button onClick={() => navigate('/learn/lesson/non-existent')}>Go Invalid</button>
      </div>
      <div data-testid="active-path">{path}</div>
      <InteractiveLessonPlayer key={path} />
    </div>
  );
};

describe('InteractiveLessonPlayer - Lesson State Isolation & History Navigation (Blocker #2)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    window.history.pushState({}, '', '/learn/lesson/les-1');
  });

  afterEach(() => {
    cleanup();
  });

  it('1. Mistake count is isolated: mistakes in lesson 1 do not carry over to lesson 8', async () => {
    const { getByText } = render(
      <RouterProvider>
        <MicrolearningProvider>
          <PlayerHarness />
        </MicrolearningProvider>
      </RouterProvider>
    );

    // Verify initial load of lesson 1
    expect(getByText(/Alkol \(-OH\) ve Eter \(-O-\) Polaritesi/i)).toBeTruthy();
    expect(getByText(/Adım 1 \/ 4/i)).toBeTruthy();

    // In les-1 step 1: opt-a is incorrect, opt-b is correct
    // Select incorrect answer opt-a
    const wrongOption = getByText(/Alkoller hidrojen bağı veremez, sadece alabilir/i);
    fireEvent.click(wrongOption);

    // Click "Kontrol Et"
    const checkBtn = getByText('Kontrol Et');
    fireEvent.click(checkBtn);

    // Verify feedback shows failure ("Tekrar Değerlendir") and mistake was recorded
    expect(getByText(/Tekrar Değerlendir/i)).toBeTruthy();

    // Now navigate to les-8 (single-step lesson)
    fireEvent.click(screen.getByText('Go les-8'));

    // les-8 should now be mounted
    await waitFor(() => {
      expect(getByText(/Çift Bağın Dönme Engeli/i)).toBeTruthy();
    });
    expect(getByText(/Adım 1 \/ 1/i)).toBeTruthy();

    // In les-8: opt-a is correct. Select it on first attempt (0 mistakes in les-8).
    const correctOption = getByText(/Cis ve Trans izomerlerin erime noktası/i);
    fireEvent.click(correctOption);

    fireEvent.click(getByText('Kontrol Et'));
    expect(getByText(/Doğru Çıkarım!/i)).toBeTruthy();

    // Continue to finish the lesson
    fireEvent.click(getByText('Devam Et'));

    // les-8 is completed. Because mistakes from les-1 did not carry over, mistakesCount in les-8 is 0.
    // 0 mistakes = 3 stars.
    await waitFor(() => {
      expect(getByText(/Ders Tamamlandı! 🎉/i)).toBeTruthy();
    });

    // Check celebration text
    expect(getByText(/Geometrik İzomeri & Konformasyon/i)).toBeTruthy();
  });

  it('2. Finished / celebration screen does not carry over to the next lesson', async () => {
    const { getByText, queryByText } = render(
      <RouterProvider>
        <MicrolearningProvider>
          <PlayerHarness />
        </MicrolearningProvider>
      </RouterProvider>
    );

    // Go directly to les-8 to quickly finish it
    fireEvent.click(screen.getByText('Go les-8'));
    await waitFor(() => {
      expect(getByText(/Adım 1 \/ 1/i)).toBeTruthy();
    });

    // Answer correctly and finish les-8
    const correctOption = getByText(/Cis ve Trans izomerlerin erime noktası/i);
    fireEvent.click(correctOption);
    fireEvent.click(getByText('Kontrol Et'));
    fireEvent.click(getByText('Devam Et'));

    // Confirm celebration screen is shown
    await waitFor(() => {
      expect(getByText(/Ders Tamamlandı! 🎉/i)).toBeTruthy();
    });

    // Now navigate to les-2
    fireEvent.click(screen.getByText('Go les-2'));

    // Must NOT show celebration screen; must show Step 1 of les-2
    await waitFor(() => {
      expect(queryByText(/Ders Tamamlandı! 🎉/i)).toBeNull();
      expect(getByText(/Adım 1 \/ 3/i)).toBeTruthy();
    });
  });

  it('3. Browser history popstate navigation from multi-step lesson back to single-step lesson does not crash and safely clamps step', async () => {
    const { getByText } = render(
      <RouterProvider>
        <MicrolearningProvider>
          <PlayerHarness />
        </MicrolearningProvider>
      </RouterProvider>
    );

    // In les-1 (4 steps): advance to step 2
    expect(getByText(/Adım 1 \/ 4/i)).toBeTruthy();

    // Select correct answer for step 1 (opt-b)
    const optB = getByText(/Alkoller hem H-bağı donörü hem akseptörüdür/i);
    fireEvent.click(optB);
    fireEvent.click(getByText('Kontrol Et'));
    fireEvent.click(getByText('Devam Et'));

    // Now on step 2 of les-1
    await waitFor(() => {
      expect(getByText(/Adım 2 \/ 4/i)).toBeTruthy();
    });

    // Advance to step 3 of les-1
    const optStep2 = getByText(/Ön ilaç \(prodrug\) tasarlayıp/i);
    fireEvent.click(optStep2);
    fireEvent.click(getByText('Kontrol Et'));
    fireEvent.click(getByText('Devam Et'));

    await waitFor(() => {
      expect(getByText(/Adım 3 \/ 4/i)).toBeTruthy();
    });

    // Simulate browser history navigation to les-8 (which has only 1 step)
    // Using window.history.pushState and popstate event
    window.history.pushState({}, '', '/learn/lesson/les-8');
    window.dispatchEvent(new PopStateEvent('popstate'));

    // Should safely display les-8 step 1 without throwing TypeError
    await waitFor(() => {
      expect(getByText(/Çift Bağın Dönme Engeli/i)).toBeTruthy();
      expect(getByText(/Adım 1 \/ 1/i)).toBeTruthy();
    });

    // Now simulate browser back navigation to les-1
    window.history.pushState({}, '', '/learn/lesson/les-1');
    window.dispatchEvent(new PopStateEvent('popstate'));

    // Should cleanly reset to Step 1 of les-1
    await waitFor(() => {
      expect(getByText(/Alkol \(-OH\) ve Eter \(-O-\) Polaritesi/i)).toBeTruthy();
      expect(getByText(/Adım 1 \/ 4/i)).toBeTruthy();
    });
  });

  it('4. Handles non-existent or empty lesson gracefully without crashing', async () => {
    const { getByText } = render(
      <RouterProvider>
        <MicrolearningProvider>
          <PlayerHarness />
        </MicrolearningProvider>
      </RouterProvider>
    );

    // Navigate to invalid lesson
    fireEvent.click(screen.getByText('Go Invalid'));

    await waitFor(() => {
      expect(getByText(/Ders Bulunamadı/i)).toBeTruthy();
    });
    expect(getByText(/Ders Haritasına Dön/i)).toBeTruthy();
  });

  it('5. Navigating to a shorter lesson immediately displays step 0 and never a clamped step from the previous lesson', async () => {
    const { getByText, queryByText } = render(
      <RouterProvider>
        <MicrolearningProvider>
          <PlayerHarness />
        </MicrolearningProvider>
      </RouterProvider>
    );

    // Navigate to les-2 (3 steps)
    fireEvent.click(screen.getByText('Go les-2'));
    await waitFor(() => {
      expect(getByText(/Adım 1 \/ 3/i)).toBeTruthy();
    });

    // Advance to Step 2 of les-2
    fireEvent.click(getByText(/Aldehitler, ketonlara göre nükleofilik saldırıya karşı daha reaktiftir/i));
    fireEvent.click(getByText('Kontrol Et'));
    fireEvent.click(getByText('Devam Et'));

    await waitFor(() => {
      expect(getByText(/Adım 2 \/ 3/i)).toBeTruthy();
    });

    // Advance to Step 3 of les-2 (currentStepIndex = 2)
    fireEvent.click(getByText(/Açil Klorür \(R-COCl\)/i));
    fireEvent.click(getByText('Kontrol Et'));
    fireEvent.click(getByText('Devam Et'));

    await waitFor(() => {
      expect(getByText(/Adım 3 \/ 3/i)).toBeTruthy();
    });

    // Now navigate to les-4 (2 steps)
    // If state persisted or clamped without starting at 0, it would display Step 2 / 2.
    fireEvent.click(screen.getByText('Go les-4'));

    // Must immediately render step 0 of les-4 (Adım 1 / 2)
    await waitFor(() => {
      expect(getByText(/Adım 1 \/ 2/i)).toBeTruthy();
      expect(getByText(/Heteroatomların Halka Aromatikliğine Katkısı/i)).toBeTruthy();
    });

    // Ensure it is NOT displaying Step 2 / 2
    expect(queryByText(/Adım 2 \/ 2/i)).toBeNull();
  });
});
