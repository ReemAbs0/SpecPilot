import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeModeProvider } from '../src/state/ThemeContext';
import { UserMenu } from '../src/components/layout/UserMenu';

// Verifies the theme switcher lives inside the profile dropdown (feature/material-theme): opening
// the menu reveals a Theme section, and choosing "Material" flips the active mode and persists it
// to localStorage. Auth is mocked so a user is always signed in.

const authCtrl = vi.hoisted(() => ({
  user: { uid: 'u1', email: 'jane.doe@example.com', displayName: null as string | null },
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

function renderMenu() {
  return render(
    <ThemeModeProvider>
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    </ThemeModeProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe('theme switcher in the profile menu', () => {
  it('exposes a Theme section with Classic/Material controls when the menu is open', async () => {
    const user = userEvent.setup();
    renderMenu();

    // The switcher is not in the navbar chrome — it only appears inside the open menu.
    await user.click(screen.getByRole('button', { name: /jane\.doe/i }));

    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Classic' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Material' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    // Menu items are preserved alongside the new Theme section.
    expect(screen.getByRole('menuitem', { name: /my specifications/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /logout/i })).toBeInTheDocument();
  });

  it('switches to Material and persists the choice to localStorage', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: /jane\.doe/i }));
    await user.click(screen.getByRole('button', { name: 'Material' }));

    await waitFor(() => {
      expect(localStorage.getItem('specpilot.theme')).toBe('material');
    });
    expect(document.documentElement.dataset.theme).toBe('material');
  });

  it('defaults to Classic and reads a persisted Material preference on mount', async () => {
    localStorage.setItem('specpilot.theme', 'material');
    const user = userEvent.setup();
    renderMenu();

    // In Material mode the profile trigger is an MUI button showing the same label.
    await user.click(screen.getByRole('button', { name: /jane\.doe/i }));

    // The Material segmented control (MUI ToggleButtonGroup) marks Material as selected.
    expect(screen.getByRole('button', { name: 'Material' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
