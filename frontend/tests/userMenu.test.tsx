import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { UserMenu } from '../src/components/layout/UserMenu';

// Tests the authenticated navbar profile menu: label (displayName vs email prefix), open/close
// via click / Escape / outside click, current-page highlight, and logout. Auth is mocked.

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

function renderMenu(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <UserMenu />
      <button>outside</button>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  authCtrl.user = { uid: 'u1', email: 'jane.doe@example.com', displayName: null };
  authCtrl.signOut.mockClear();
});

describe('UserMenu', () => {
  it('shows the email local-part when there is no display name', () => {
    renderMenu();
    expect(screen.getByRole('button', { name: /jane\.doe/i })).toBeInTheDocument();
    // The full email is not the button label.
    expect(
      screen.queryByRole('button', { name: /jane\.doe@example\.com/i }),
    ).not.toBeInTheDocument();
  });

  it('prefers the display name when available', () => {
    authCtrl.user = { uid: 'u1', email: 'jane.doe@example.com', displayName: 'Jane Doe' };
    renderMenu();
    expect(screen.getByRole('button', { name: /jane doe/i })).toBeInTheDocument();
  });

  it('opens on click and shows the menu items', async () => {
    const user = userEvent.setup();
    renderMenu();

    // Closed initially — the menu is aria-hidden so its items are out of the a11y tree.
    expect(screen.queryByRole('menuitem', { name: /my specifications/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /jane\.doe/i }));

    expect(screen.getByRole('menuitem', { name: /my specifications/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /logout/i })).toBeInTheDocument();
    // Account was removed from the menu.
    expect(screen.queryByRole('menuitem', { name: /account/i })).not.toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    renderMenu();
    const trigger = screen.getByRole('button', { name: /jane\.doe/i });

    await user.click(trigger);
    expect(screen.getByRole('menuitem', { name: /logout/i })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menuitem', { name: /logout/i })).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on an outside click', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: /jane\.doe/i }));
    expect(screen.getByRole('menuitem', { name: /logout/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'outside' }));
    expect(screen.queryByRole('menuitem', { name: /logout/i })).not.toBeInTheDocument();
  });

  it('highlights the current page (My Specifications on /library)', async () => {
    const user = userEvent.setup();
    renderMenu('/library');

    await user.click(screen.getByRole('button', { name: /jane\.doe/i }));
    expect(screen.getByRole('menuitem', { name: /my specifications/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('calls signOut from the Logout item', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: /jane\.doe/i }));
    await user.click(screen.getByRole('menuitem', { name: /logout/i }));

    expect(authCtrl.signOut).toHaveBeenCalledTimes(1);
  });
});
