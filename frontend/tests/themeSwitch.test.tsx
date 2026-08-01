import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeModeProvider } from '../src/state/ThemeContext';
import { SpecificationProvider } from '../src/state/SpecificationContext';
import { DesignSystemDock } from '../src/components/layout/DesignSystemDock';
import { Navbar } from '../src/components/layout/Navbar';
import { UserMenu } from '../src/components/layout/UserMenu';

// The two theme controls moved out of the profile dropdown: the Classic/Material design-system
// switch now floats bottom-left (DesignSystemDock) and the light/dark toggle sits at the far
// right of the navbar. Both must work signed out, in either design system, and keep persisting
// through ThemeContext.

const authCtrl = vi.hoisted(() => ({
  user: null as { uid: string; email: string; displayName: string | null } | null,
  signOut: vi.fn(async () => {}),
}));

vi.mock('../src/state/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: authCtrl.user,
    loading: false,
    signOut: authCtrl.signOut,
    signIn: vi.fn(),
    signUp: vi.fn(),
  }),
}));

const SIGNED_IN = { uid: 'u1', email: 'jane.doe@example.com', displayName: null };

function renderChrome() {
  return render(
    <ThemeModeProvider>
      <MemoryRouter>
        <SpecificationProvider>
          <Navbar />
          <DesignSystemDock />
        </SpecificationProvider>
      </MemoryRouter>
    </ThemeModeProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
  authCtrl.user = null;
});

describe('design-system switch (floating dock)', () => {
  it('is visible without signing in and shows the active design system', () => {
    renderChrome();

    const dock = screen.getByRole('group', { name: 'Design system' });
    expect(within(dock).getByRole('button', { name: 'Classic' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(dock).getByRole('button', { name: 'Material' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('switches to Material and persists the choice to localStorage', async () => {
    const user = userEvent.setup();
    renderChrome();

    await user.click(screen.getByRole('button', { name: 'Material' }));

    await waitFor(() => {
      expect(localStorage.getItem('specpilot.theme')).toBe('material');
    });
    expect(document.documentElement.dataset.theme).toBe('material');
    // The dock re-renders in the Material design system and stays usable.
    expect(screen.getByRole('button', { name: 'Material' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('reads a persisted Material preference on mount', () => {
    localStorage.setItem('specpilot.theme', 'material');
    renderChrome();

    expect(screen.getByRole('button', { name: 'Material' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('keeps one neutral appearance in both design systems — only the selection moves', async () => {
    const user = userEvent.setup();
    renderChrome();

    // Snapshot the control's own styling while Classic is active...
    const dockBefore = screen.getByRole('group', { name: 'Design system' });
    const containerClass = dockBefore.className;
    const classicClass = screen.getByRole('button', { name: 'Classic' }).className;
    const materialClass = screen.getByRole('button', { name: 'Material' }).className;

    await user.click(screen.getByRole('button', { name: 'Material' }));

    // ...and it is unchanged under Material: same container, and the two segments have simply
    // swapped which one carries the selected styling.
    const dockAfter = screen.getByRole('group', { name: 'Design system' });
    expect(dockAfter.className).toBe(containerClass);
    expect(screen.getByRole('button', { name: 'Material' }).className).toBe(classicClass);
    expect(screen.getByRole('button', { name: 'Classic' }).className).toBe(materialClass);

    // No MUI markup crept back into the control in either state.
    expect(dockAfter.querySelector('.MuiToggleButtonGroup-root, .MuiToggleButton-root')).toBeNull();
  });
});

describe('light/dark toggle (navbar)', () => {
  it('offers dark mode while light is active, signed out', () => {
    renderChrome();
    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
  });

  it('toggles the colour mode and persists it', async () => {
    const user = userEvent.setup();
    renderChrome();

    await user.click(screen.getByRole('button', { name: /switch to dark mode/i }));

    await waitFor(() => {
      expect(localStorage.getItem('specpilot.colorMode')).toBe('dark');
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.dataset.colorMode).toBe('dark');

    // The icon flips to offer the way back.
    const back = screen.getByRole('button', { name: /switch to light mode/i });
    await user.click(back);

    await waitFor(() => {
      expect(localStorage.getItem('specpilot.colorMode')).toBe('light');
    });
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('is present in the Material navbar too', async () => {
    localStorage.setItem('specpilot.theme', 'material');
    const user = userEvent.setup();
    renderChrome();

    await user.click(screen.getByRole('button', { name: /switch to dark mode/i }));

    await waitFor(() => {
      expect(localStorage.getItem('specpilot.colorMode')).toBe('dark');
    });
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
  });

  it('stays available when signed in, alongside the profile menu', () => {
    authCtrl.user = SIGNED_IN;
    renderChrome();

    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /jane\.doe/i })).toBeInTheDocument();
  });
});

describe('profile menu after the move', () => {
  it('holds only account actions — no theme or appearance controls', async () => {
    authCtrl.user = SIGNED_IN;
    const user = userEvent.setup();
    render(
      <ThemeModeProvider>
        <MemoryRouter>
          <UserMenu />
        </MemoryRouter>
      </ThemeModeProvider>,
    );

    await user.click(screen.getByRole('button', { name: /jane\.doe/i }));

    expect(screen.getByRole('menuitem', { name: /my specifications/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /logout/i })).toBeInTheDocument();

    expect(screen.queryByText('Theme')).not.toBeInTheDocument();
    expect(screen.queryByText('Appearance')).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Design system' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Classic' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /switch to dark mode/i })).not.toBeInTheDocument();
  });
});
