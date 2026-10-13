// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
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

const ValidationHarness: React.FC = () => {
  const { path, navigate } = useRouter();

  return (
    <div>
      <div data-testid="nav-controls">
        <button onClick={() => navigate('/learn/lesson/les-14')}>Go les-14</button>
        <button onClick={() => navigate('/learn/lesson/les-15')}>Go les-15</button>
      </div>
      <InteractiveLessonPlayer key={path} />
    </div>
  );
};

describe('InteractiveLessonPlayer - Answer Validation Fixes (Lesson 14 & Lesson 15)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Bug 1: Lesson 14, Step 2 (sar_slider)', () => {
    it('initial state has no pre-selected option and Kontrol Et is disabled', async () => {
      window.history.pushState({}, '', '/learn/lesson/les-14');

      const { getByText, container } = render(
        <RouterProvider>
          <MicrolearningProvider>
            <ValidationHarness />
          </MicrolearningProvider>
        </RouterProvider>
      );

      // Advance past step 1 of les-14
      expect(getByText(/LogP Nedir\?/i)).toBeTruthy();
      fireEvent.click(getByText(/LogP çok yüksek \(>5\) olursa/i));
      fireEvent.click(getByText('Kontrol Et'));
      fireEvent.click(getByText('Devam Et'));

      // Now at Step 2 of les-14 (sar_slider)
      await waitFor(() => {
        expect(getByText(/SAR Simülatörü: Aromatik Halka Sübstitüsyonu/i)).toBeTruthy();
      });

      // 1. Check that "Kontrol Et" button is disabled
      const checkBtn = getByText('Kontrol Et').closest('button');
      expect(checkBtn?.disabled).toBe(true);

      // 2. Check that none of the radio buttons are pre-selected
      const radioInputs = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
      expect(radioInputs.length).toBeGreaterThan(0);
      radioInputs.forEach((input) => {
        expect(input.checked).toBe(false);
      });
    });

    it('selecting an option enables Kontrol Et and validates correct vs incorrect answers', async () => {
      window.history.pushState({}, '', '/learn/lesson/les-14');

      const { getByText, container } = render(
        <RouterProvider>
          <MicrolearningProvider>
            <ValidationHarness />
          </MicrolearningProvider>
        </RouterProvider>
      );

      // Advance past step 1
      fireEvent.click(getByText(/LogP çok yüksek \(>5\) olursa/i));
      fireEvent.click(getByText('Kontrol Et'));
      fireEvent.click(getByText('Devam Et'));

      await waitFor(() => {
        expect(getByText(/SAR Simülatörü: Aromatik Halka Sübstitüsyonu/i)).toBeTruthy();
      });

      // Select an incorrect option: -H (Hidrojen)
      const hRadio = container.querySelector<HTMLInputElement>('input[value="sub-h"]');
      expect(hRadio).toBeTruthy();
      fireEvent.click(hRadio!);

      // Kontrol Et should now be enabled
      const checkBtn = getByText('Kontrol Et').closest('button');
      expect(checkBtn?.disabled).toBe(false);

      // Submit incorrect answer
      fireEvent.click(checkBtn!);

      // Should receive incorrect feedback
      await waitFor(() => {
        expect(getByText(/Tekrar Değerlendir/i)).toBeTruthy();
      });

      // Click "Yeniden Dene"
      fireEvent.click(getByText('Yeniden Dene'));

      // Select the correct option: -Cl (Klor)
      const clRadio = container.querySelector<HTMLInputElement>('input[value="sub-cl"]');
      expect(clRadio).toBeTruthy();
      fireEvent.click(clRadio!);

      // Submit correct answer
      fireEvent.click(getByText('Kontrol Et'));

      // Should receive correct feedback
      await waitFor(() => {
        expect(getByText(/Doğru Çıkarım!/i)).toBeTruthy();
      });
    });
  });

  describe('Bug 2: Lesson 15, Step 2 (ph_gauge)', () => {
    it('initial state requires user interaction before Kontrol Et is enabled', async () => {
      window.history.pushState({}, '', '/learn/lesson/les-15');

      const { getByText } = render(
        <RouterProvider>
          <MicrolearningProvider>
            <ValidationHarness />
          </MicrolearningProvider>
        </RouterProvider>
      );

      // Advance past step 1 of les-15
      expect(getByText(/pH-Bölme \(pH-Partition\) Hipotezi/i)).toBeTruthy();
      fireEvent.click(getByText(/Zayıf asit ilaçlar asidik ortamda/i));
      fireEvent.click(getByText('Kontrol Et'));
      fireEvent.click(getByText('Devam Et'));

      // Now at Step 2 of les-15 (ph_gauge)
      await waitFor(() => {
        expect(getByText(/İnteraktif Henderson-Hasselbalch Göstergesi/i)).toBeTruthy();
      });

      // Kontrol Et button MUST be disabled on initial load before any interaction
      const checkBtn = getByText('Kontrol Et').closest('button');
      expect(checkBtn?.disabled).toBe(true);
    });

    it('incorrect pH submissions receive incorrect feedback and target pH 7.4 receives correct feedback', async () => {
      window.history.pushState({}, '', '/learn/lesson/les-15');

      const { getByText } = render(
        <RouterProvider>
          <MicrolearningProvider>
            <ValidationHarness />
          </MicrolearningProvider>
        </RouterProvider>
      );

      // Advance past step 1
      fireEvent.click(getByText(/Zayıf asit ilaçlar asidik ortamda/i));
      fireEvent.click(getByText('Kontrol Et'));
      fireEvent.click(getByText('Devam Et'));

      await waitFor(() => {
        expect(getByText(/İnteraktif Henderson-Hasselbalch Göstergesi/i)).toBeTruthy();
      });

      // Click an incorrect landmark: Duodenum (pH 6.0)
      fireEvent.click(getByText(/Duodenum/i));

      // Kontrol Et should now be enabled
      const checkBtn = getByText('Kontrol Et').closest('button');
      expect(checkBtn?.disabled).toBe(false);

      // Submit incorrect pH (6.0)
      fireEvent.click(checkBtn!);

      // Should receive incorrect feedback
      await waitFor(() => {
        expect(getByText(/Tekrar Değerlendir/i)).toBeTruthy();
      });

      // Click "Yeniden Dene"
      fireEvent.click(getByText('Yeniden Dene'));

      // Click target landmark: Kan / Plazma (pH 7.4)
      fireEvent.click(getByText(/Kan \/ Plazma/i));

      // Submit correct pH (7.4)
      fireEvent.click(getByText('Kontrol Et'));

      // Should receive correct feedback
      await waitFor(() => {
        expect(getByText(/Doğru Çıkarım!/i)).toBeTruthy();
      });
    });
  });
});
