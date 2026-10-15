// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup, screen } from '@testing-library/react';
import { MoleculeInspector, MoleculeHotspot } from '../src/components/interactive/MoleculeInspector';
import { InteractiveLessonPlayer } from '../src/views/Student/InteractiveLessonPlayer';
import { RouterProvider } from '../src/context/RouterContext';
import { MicrolearningProvider } from '../src/context/MicrolearningContext';

// Mock Supabase client
vi.mock('../src/lib/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
      upsert: () => Promise.resolve({ error: null }),
    }),
    auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
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

// Mock window.scrollTo
window.scrollTo = vi.fn();

const sampleHotspots: MoleculeHotspot[] = [
  {
    id: 'hs-ester',
    label: 'Asetil Ester (-OCOCH₃)',
    x: 70,
    y: 72,
    groupType: 'ester',
    description: 'Reaktif açil kaynağı. COX Ser530 hidroksiline aktarılır.',
    isTarget: true,
  },
  {
    id: 'hs-carboxyl',
    label: 'Karboksilik Asit (-COOH)',
    x: 67,
    y: 18,
    groupType: 'karboksil',
    description: 'Reseptör Arg120 ile iyonik bağ yapar.',
  },
  {
    id: 'hs-benzene',
    label: 'Benzen Halkası',
    x: 42,
    y: 42,
    groupType: 'aromatik',
    description: 'Lipofilik kanal için hidrofobik iskelet.',
  },
];

describe('MoleculeInspector - Keyboard & Screen Reader Accessibility (Finding B3 Part 2)', () => {
  afterEach(() => {
    cleanup();
  });

  it('1. Hotspots have type="button", descriptive aria-label, and aria-pressed attributes', () => {
    render(
      <MoleculeInspector
        moleculeName="Aspirin"
        chemicalFormula="C9H8O4"
        svgType="aspirin"
        hotspots={sampleHotspots}
        selectedId="hs-ester"
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);

    const esterBtn = buttons[0];
    expect(esterBtn.getAttribute('type')).toBe('button');
    expect(esterBtn.getAttribute('aria-label')).toBe('Asetil Ester (-OCOCH₃) (ester)');
    expect(esterBtn.getAttribute('aria-pressed')).toBe('true');

    const carboxylBtn = buttons[1];
    expect(carboxylBtn.getAttribute('type')).toBe('button');
    expect(carboxylBtn.getAttribute('aria-label')).toBe('Karboksilik Asit (-COOH) (karboksil)');
    expect(carboxylBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('2. Hotspots have high-contrast focus-visible class and styling', () => {
    const { container } = render(
      <MoleculeInspector
        moleculeName="Aspirin"
        svgType="aspirin"
        hotspots={sampleHotspots}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn.classList.contains('cenna-molecule-hotspot')).toBe(true);
    });

    // Check style element defines focus-visible
    const styleTag = container.querySelector('style');
    expect(styleTag).not.toBeNull();
    expect(styleTag?.textContent).toContain('.cenna-molecule-hotspot:focus-visible');
  });

  it('3. Arrow key navigation cycles through hotspots and updates selection', () => {
    const onSelect = vi.fn();
    render(
      <MoleculeInspector
        moleculeName="Aspirin"
        svgType="aspirin"
        hotspots={sampleHotspots}
        selectedId="hs-ester"
        onSelectHotspot={onSelect}
      />
    );

    const buttons = screen.getAllByRole('button');
    const esterBtn = buttons[0];

    // ArrowRight moves from 0 to 1 (carboxyl)
    fireEvent.keyDown(esterBtn, { key: 'ArrowRight' });
    expect(onSelect).toHaveBeenCalledWith('hs-carboxyl');

    // ArrowDown moves from 0 to 1 (carboxyl)
    onSelect.mockClear();
    fireEvent.keyDown(esterBtn, { key: 'ArrowDown' });
    expect(onSelect).toHaveBeenCalledWith('hs-carboxyl');

    // ArrowLeft on first hotspot wraps to last (benzene)
    onSelect.mockClear();
    fireEvent.keyDown(esterBtn, { key: 'ArrowLeft' });
    expect(onSelect).toHaveBeenCalledWith('hs-benzene');
  });

  it('4. Space and Enter keys activate hotspot selection', () => {
    const onSelect = vi.fn();
    render(
      <MoleculeInspector
        moleculeName="Aspirin"
        svgType="aspirin"
        hotspots={sampleHotspots}
        onSelectHotspot={onSelect}
      />
    );

    const buttons = screen.getAllByRole('button');
    const benzeneBtn = buttons[2];

    fireEvent.keyDown(benzeneBtn, { key: ' ' });
    expect(onSelect).toHaveBeenCalledWith('hs-benzene');

    onSelect.mockClear();
    fireEvent.keyDown(benzeneBtn, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('hs-benzene');
  });

  it('5. Disabled/uninteractive inspector sets aria-disabled and prevents selection', () => {
    const onSelect = vi.fn();
    render(
      <MoleculeInspector
        moleculeName="Aspirin"
        svgType="aspirin"
        hotspots={sampleHotspots}
        interactive={false}
        onSelectHotspot={onSelect}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn.hasAttribute('disabled')).toBe(true);
      expect(btn.getAttribute('aria-disabled')).toBe('true');
    });

    fireEvent.click(buttons[0]);
    expect(onSelect).not.toHaveBeenCalled();

    fireEvent.keyDown(buttons[0], { key: ' ' });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('6. Explanation panel has aria-live="polite" and announces active hotspot details', () => {
    const { rerender } = render(
      <MoleculeInspector
        moleculeName="Aspirin"
        svgType="aspirin"
        hotspots={sampleHotspots}
        selectedId={undefined}
      />
    );

    // Initial state: prompt message
    expect(screen.getByText(/fonksiyonel grupları inceleyin/i)).toBeDefined();

    // Select ester
    rerender(
      <MoleculeInspector
        moleculeName="Aspirin"
        svgType="aspirin"
        hotspots={sampleHotspots}
        selectedId="hs-ester"
      />
    );

    const liveRegion = screen.getByRole('region', { name: /fonksiyonel grup açıklaması/i });
    expect(liveRegion.getAttribute('aria-live')).toBe('polite');
    expect(liveRegion.textContent).toContain('Asetil Ester (-OCOCH₃)');
    expect(liveRegion.textContent).toContain('Reaktif açil kaynağı');
  });

  it('7. Full lesson integration: les-1-s3 keyboard interaction validates correct and incorrect answers', async () => {
    // Navigate directly to les-1
    window.history.pushState({}, '', '/learn/lesson/les-1');

    render(
      <RouterProvider>
        <MicrolearningProvider>
          <InteractiveLessonPlayer />
        </MicrolearningProvider>
      </RouterProvider>
    );

    // Fast-forward step 0, 1 to reach step 2 (les-1-s3 molecule_inspector)
    // Step 0: MCQ (les-1-s1)
    fireEvent.click(screen.getByText(/Alkoller hem H-bağı donörü hem akseptörüdür/i));
    fireEvent.click(screen.getByRole('button', { name: /kontrol et/i }));
    fireEvent.click(screen.getByRole('button', { name: /devam et/i }));

    // Wait for Step 1 (les-1-s2) to appear
    await screen.findByText(/Ester Gruplarının Plazma Hassasiyeti/i);
    fireEvent.click(screen.getByText(/Ön ilaç \(prodrug\) tasarlayıp/i));
    fireEvent.click(screen.getByRole('button', { name: /kontrol et/i }));
    fireEvent.click(screen.getByRole('button', { name: /devam et/i }));

    // Wait for Step 2: les-1-s3 Aspirin Molecule Inspector
    await screen.findByText(/Aspirin Molekülünde Ester ve Karboksil Grupları/i);

    const checkBtn = screen.getByRole('button', { name: /kontrol et/i });
    expect(checkBtn.hasAttribute('disabled')).toBe(true);

    // Select incorrect hotspot via keyboard (carboxyl)
    const carboxylBtn = screen.getByRole('button', { name: /Karboksilik Asit/i });
    fireEvent.keyDown(carboxylBtn, { key: 'Enter' });

    expect(carboxylBtn.getAttribute('aria-pressed')).toBe('true');
    expect(checkBtn.hasAttribute('disabled')).toBe(false);

    // Check answer (incorrect)
    fireEvent.click(checkBtn);
    await screen.findByText(/Yeniden Dene/i);

    // Retry
    fireEvent.click(screen.getByRole('button', { name: /yeniden dene/i }));

    // Select correct hotspot (ester) via keyboard
    const esterBtn = screen.getByRole('button', { name: /Asetil Ester/i });
    fireEvent.keyDown(esterBtn, { key: ' ' });

    expect(esterBtn.getAttribute('aria-pressed')).toBe('true');
    expect(checkBtn.hasAttribute('disabled')).toBe(false);

    // Check answer (correct)
    fireEvent.click(checkBtn);
    await screen.findByText(/Doğru Çıkarım!/i);
    expect(screen.getByText(/Klinik İnci/i)).toBeDefined();
  }, 15000);
});
