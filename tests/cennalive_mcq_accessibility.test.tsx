// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, cleanup, waitFor } from '@testing-library/react';
import { WidgetRenderer } from '../src/components/interactive/WidgetRenderer';
import { InteractiveLessonPlayer } from '../src/views/Student/InteractiveLessonPlayer';
import { RouterProvider } from '../src/context/RouterContext';
import { MicrolearningProvider } from '../src/context/MicrolearningContext';
import type { LessonStep } from '../src/types/microlearning';

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

describe('WidgetRenderer MCQ Keyboard & Screen Reader Accessibility (Finding B3)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const mockStep: LessonStep = {
    id: 'les-1-s1',
    stepNumber: 1,
    type: 'reveal',
    title: 'Fonksiyonel Grup Tanıma',
    instructionHtml: '<p>Lütfen doğru kimyasal bağı seçin.</p>',
    conceptTag: 'Esterleşme',
    widgetType: 'multiple_choice',
    widgetProps: {},
    options: [
      { id: 'opt-a', label: 'Karboksilik asit + Alkol', isCorrect: true, feedback: 'Doğru!' },
      { id: 'opt-b', label: 'Amin + Keton', isCorrect: false, feedback: 'Yanlış!' },
      { id: 'opt-c', label: 'Eter + Aldehit', isCorrect: false, feedback: 'Yanlış!' },
      { id: 'opt-d', label: 'Fenol + Alkan', isCorrect: false, feedback: 'Yanlış!' },
    ],
    correctAnswer: 'opt-a',
    explanationHtml: 'Esterler karboksilik asit ile alkolün kondenzasyon reaksiyonu sonucu oluşur.',
    socraticHintChain: ['İpucu 1', 'İpucu 2', 'İpucu 3'],
  };

  it('1. Renders semantic WAI-ARIA radiogroup with accessible radio controls and roving tabindex', () => {
    const handleAnswerChange = vi.fn();

    render(
      <WidgetRenderer
        step={mockStep}
        currentAnswer={null}
        onAnswerChange={handleAnswerChange}
      />
    );

    // Radiogroup container exists with accessible label
    const group = screen.getByRole('radiogroup');
    expect(group).toBeTruthy();
    expect(group.getAttribute('aria-label')).toBe(mockStep.title);

    // Options are exposed as radio buttons with correct accessible names and unchecked states
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(4);

    radios.forEach((radio) => {
      expect(radio.getAttribute('aria-checked')).toBe('false');
      expect(radio.getAttribute('role')).toBe('radio');
    });

    // Check roving tabindex: with no selection, exactly one item is in tab sequence (tabIndex = 0)
    expect(radios.filter((r) => r.getAttribute('tabindex') === '0')).toHaveLength(1);
    expect(radios[0].getAttribute('tabindex')).toBe('0');
    expect(radios[1].getAttribute('tabindex')).toBe('-1');
    expect(radios[2].getAttribute('tabindex')).toBe('-1');
    expect(radios[3].getAttribute('tabindex')).toBe('-1');

    expect(radios[0].getAttribute('aria-label')).toBe('A: Karboksilik asit + Alkol');
    expect(radios[1].getAttribute('aria-label')).toBe('B: Amin + Keton');
  });

  it('2. MCQ options implement roving tabindex and can receive keyboard focus', () => {
    let currentAnswer: string | null = null;
    const handleAnswerChange = vi.fn((val: string) => {
      currentAnswer = val;
    });

    const { rerender } = render(
      <WidgetRenderer
        step={mockStep}
        currentAnswer={currentAnswer}
        onAnswerChange={handleAnswerChange}
      />
    );

    const radios = screen.getAllByRole('radio');

    // First radio button receives initial keyboard focus
    radios[0].focus();
    expect(document.activeElement).toBe(radios[0]);

    // When an option is selected, roving tabindex updates so exactly one item has tabIndex=0
    currentAnswer = 'opt-b';
    rerender(
      <WidgetRenderer
        step={mockStep}
        currentAnswer={currentAnswer}
        onAnswerChange={handleAnswerChange}
      />
    );

    const updatedRadios = screen.getAllByRole('radio');
    expect(updatedRadios.filter((r) => r.getAttribute('tabindex') === '0')).toHaveLength(1);
    expect(updatedRadios[0].getAttribute('tabindex')).toBe('-1');
    expect(updatedRadios[1].getAttribute('tabindex')).toBe('0');
    expect(updatedRadios[2].getAttribute('tabindex')).toBe('-1');
    expect(updatedRadios[3].getAttribute('tabindex')).toBe('-1');

    updatedRadios[1].focus();
    expect(document.activeElement).toBe(updatedRadios[1]);
  });

  it('3. Keyboard interaction with Enter and Space selects an answer and exposes aria-checked', () => {
    let currentAnswer: string | null = null;
    const handleAnswerChange = vi.fn((val: string) => {
      currentAnswer = val;
    });

    const { rerender } = render(
      <WidgetRenderer
        step={mockStep}
        currentAnswer={currentAnswer}
        onAnswerChange={handleAnswerChange}
      />
    );

    const radios = screen.getAllByRole('radio');

    // Focus and select Option A via Space key
    radios[0].focus();
    fireEvent.keyDown(radios[0], { key: ' ' });

    expect(handleAnswerChange).toHaveBeenCalledWith('opt-a');

    // Rerender with selected answer
    rerender(
      <WidgetRenderer
        step={mockStep}
        currentAnswer={currentAnswer}
        onAnswerChange={handleAnswerChange}
      />
    );

    const updatedRadios = screen.getAllByRole('radio');
    expect(updatedRadios.filter((r) => r.getAttribute('tabindex') === '0')).toHaveLength(1);
    expect(updatedRadios[0].getAttribute('aria-checked')).toBe('true');
    expect(updatedRadios[0].getAttribute('tabindex')).toBe('0');
    expect(updatedRadios[1].getAttribute('aria-checked')).toBe('false');
    expect(updatedRadios[1].getAttribute('tabindex')).toBe('-1');

    // Focus and select Option B via Enter key
    updatedRadios[1].focus();
    fireEvent.keyDown(updatedRadios[1], { key: 'Enter' });

    expect(handleAnswerChange).toHaveBeenCalledWith('opt-b');

    // Rerender with opt-b selected
    rerender(
      <WidgetRenderer
        step={mockStep}
        currentAnswer={currentAnswer}
        onAnswerChange={handleAnswerChange}
      />
    );

    const radiosAfterEnter = screen.getAllByRole('radio');
    expect(radiosAfterEnter.filter((r) => r.getAttribute('tabindex') === '0')).toHaveLength(1);
    expect(radiosAfterEnter[0].getAttribute('aria-checked')).toBe('false');
    expect(radiosAfterEnter[0].getAttribute('tabindex')).toBe('-1');
    expect(radiosAfterEnter[1].getAttribute('aria-checked')).toBe('true');
    expect(radiosAfterEnter[1].getAttribute('tabindex')).toBe('0');
  });

  it('4. Arrow key navigation traverses, selects, and moves focus with wrap-around', () => {
    let currentAnswer: string | null = 'opt-a';
    const handleAnswerChange = vi.fn((val: string) => {
      currentAnswer = val;
    });

    const { rerender } = render(
      <WidgetRenderer
        step={mockStep}
        currentAnswer={currentAnswer}
        onAnswerChange={handleAnswerChange}
      />
    );

    const radios = screen.getAllByRole('radio');
    radios[0].focus();

    // ArrowDown should select next option (opt-b) and move focus
    fireEvent.keyDown(radios[0], { key: 'ArrowDown' });
    expect(handleAnswerChange).toHaveBeenCalledWith('opt-b');
    expect(document.activeElement).toBe(radios[1]);

    rerender(
      <WidgetRenderer
        step={mockStep}
        currentAnswer={currentAnswer}
        onAnswerChange={handleAnswerChange}
      />
    );

    // ArrowUp on option B should select previous option (opt-a) and move focus back
    const radiosAfterDown = screen.getAllByRole('radio');
    fireEvent.keyDown(radiosAfterDown[1], { key: 'ArrowUp' });
    expect(handleAnswerChange).toHaveBeenCalledWith('opt-a');
    expect(document.activeElement).toBe(radiosAfterDown[0]);

    // ArrowUp on option A should wrap around to option D (opt-d)
    fireEvent.keyDown(radiosAfterDown[0], { key: 'ArrowUp' });
    expect(handleAnswerChange).toHaveBeenCalledWith('opt-d');
    expect(document.activeElement).toBe(radiosAfterDown[3]);
  });

  it('5. Mouse click interaction selects option and sets active focus', () => {
    const handleAnswerChange = vi.fn();

    render(
      <WidgetRenderer
        step={mockStep}
        currentAnswer={null}
        onAnswerChange={handleAnswerChange}
      />
    );

    const radios = screen.getAllByRole('radio');

    // Click on Option C
    fireEvent.click(radios[2]);
    expect(handleAnswerChange).toHaveBeenCalledWith('opt-c');
    expect(document.activeElement).toBe(radios[2]);

    // Click on inner text of Option D also triggers selection and sets focus
    fireEvent.click(screen.getByText('Fenol + Alkan'));
    expect(handleAnswerChange).toHaveBeenCalledWith('opt-d');
    expect(document.activeElement).toBe(radios[3]);
  });

  it('6. When disabled, keyboard and mouse interactions are ignored and tabIndex is -1', () => {
    const handleAnswerChange = vi.fn();

    render(
      <WidgetRenderer
        step={mockStep}
        currentAnswer={'opt-a'}
        onAnswerChange={handleAnswerChange}
        disabled={true}
      />
    );

    const radios = screen.getAllByRole('radio');

    // Check disabled attributes and tabindex (none has tabIndex=0)
    expect(radios.filter((r) => r.getAttribute('tabindex') === '0')).toHaveLength(0);
    radios.forEach((radio) => {
      expect(radio.getAttribute('aria-disabled')).toBe('true');
      expect(radio.getAttribute('tabindex')).toBe('-1');
    });

    // Attempt mouse click
    fireEvent.click(radios[1]);
    expect(handleAnswerChange).not.toHaveBeenCalled();

    // Attempt keyboard interaction
    fireEvent.keyDown(radios[1], { key: 'Enter' });
    fireEvent.keyDown(radios[1], { key: ' ' });
    fireEvent.keyDown(radios[1], { key: 'ArrowDown' });
    expect(handleAnswerChange).not.toHaveBeenCalled();
  });

  it('7. In InteractiveLessonPlayer, keyboard selection validates correct and incorrect answers properly', async () => {
    window.history.pushState({}, '', '/learn/lesson/les-1');

    render(
      <RouterProvider>
        <MicrolearningProvider>
          <InteractiveLessonPlayer key="/learn/lesson/les-1" />
        </MicrolearningProvider>
      </RouterProvider>
    );

    // Initial state: Step 1 (MCQ) is active, Kontrol Et button is disabled
    expect(screen.getByText(/Adım 1 \/ 4/i)).toBeTruthy();
    const checkBtn = screen.getByRole('button', { name: 'Kontrol Et' });
    expect((checkBtn as HTMLButtonElement).disabled).toBe(true);

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);

    // 1. Select incorrect option (opt-a) using keyboard Space
    radios[0].focus();
    fireEvent.keyDown(radios[0], { key: ' ' });

    // Option should be selected accessibly
    await waitFor(() => {
      expect(radios[0].getAttribute('aria-checked')).toBe('true');
    });

    // Kontrol Et button is now enabled
    const checkBtnEnabled = screen.getByText('Kontrol Et').closest('button');
    expect(checkBtnEnabled?.disabled).toBe(false);

    // Click Kontrol Et
    fireEvent.click(checkBtnEnabled!);

    // Failure feedback should appear
    await waitFor(() => {
      expect(screen.getByText('Tekrar Değerlendir')).toBeTruthy();
      expect(screen.getByText(/Alkol \(-OH\) oksijen üzerindeki ortaklanmamış elektron/i)).toBeTruthy();
    });

    // Click Yeniden Dene
    fireEvent.click(screen.getByRole('button', { name: /Yeniden Dene/i }));

    // 2. Select correct option (opt-b) using keyboard Enter
    const updatedRadios = screen.getAllByRole('radio');
    updatedRadios[1].focus();
    fireEvent.keyDown(updatedRadios[1], { key: 'Enter' });

    await waitFor(() => {
      expect(updatedRadios[1].getAttribute('aria-checked')).toBe('true');
    });

    const checkBtnReady = screen.getByText('Kontrol Et').closest('button');
    expect(checkBtnReady?.disabled).toBe(false);

    // Click Kontrol Et
    fireEvent.click(checkBtnReady!);

    // Success feedback should appear and Devam Et button rendered
    await waitFor(() => {
      expect(screen.getByText('Doğru Çıkarım!')).toBeTruthy();
      expect(screen.getByRole('button', { name: /Devam Et/i })).toBeTruthy();
    });
  });
});
