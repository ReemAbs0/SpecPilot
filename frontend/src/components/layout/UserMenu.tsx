import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, FolderOpen, LogOut } from 'lucide-react';
import type { User } from 'firebase/auth';
import { useAuth } from '../../state/AuthContext';
import { cn } from '../ui';

// Authenticated user profile menu (feature/firebase-auth). A single profile button on the right
// of the navbar opens a dropdown with the account actions, replacing the old inline email +
// "My Specifications" + "Sign out" items. Consumes the existing auth API only (user + signOut);
// it does not change any authentication logic.

/** Display name if set, otherwise the local part of the email (before "@"). */
function menuLabel(user: User): string {
  const displayName = user.displayName?.trim();
  if (displayName) {
    return displayName;
  }
  const email = user.email ?? '';
  const at = email.indexOf('@');
  return at > 0 ? email.slice(0, at) : email || 'Account';
}

export function UserMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click or Escape (only while open). Escape returns focus to the button.
  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!user) {
    return null;
  }

  const label = menuLabel(user);
  const initial = label.charAt(0).toUpperCase();
  // A library detail page (/library/:id) still belongs to the "My Specifications" section.
  const onLibrary = location.pathname === '/library' || location.pathname.startsWith('/library/');

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    navigate('/');
  }

  const itemBase =
    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500';
  const itemInactive = 'text-slate-700 hover:bg-slate-50';
  const itemActive = 'bg-brand-50 text-brand-700';

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="user-menu"
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white"
        >
          {initial}
        </span>
        <span className="hidden max-w-[16ch] truncate sm:inline">{label}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'h-4 w-4 text-slate-400 transition-transform duration-150',
            open && 'rotate-180',
          )}
        />
      </button>

      <div
        id="user-menu"
        role="menu"
        aria-hidden={!open}
        aria-label="Account menu"
        className={cn(
          'absolute right-0 top-full z-20 mt-2 w-56 origin-top-right rounded-xl border border-slate-100 bg-white p-1.5 shadow-lg transition duration-150 ease-out',
          open
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none -translate-y-1 scale-95 opacity-0',
        )}
      >
        <div className="truncate px-3 pb-2 pt-1 text-xs text-slate-400" aria-hidden="true">
          {user.email}
        </div>

        <Link
          to="/library"
          role="menuitem"
          tabIndex={open ? 0 : -1}
          aria-current={onLibrary ? 'page' : undefined}
          onClick={() => setOpen(false)}
          className={cn(itemBase, onLibrary ? itemActive : itemInactive)}
        >
          <FolderOpen className="h-4 w-4" aria-hidden="true" />
          My Specifications
        </Link>

        <hr className="my-1.5 border-slate-100" />

        <button
          type="button"
          role="menuitem"
          tabIndex={open ? 0 : -1}
          onClick={handleSignOut}
          className={cn(itemBase, 'w-full text-slate-700 hover:bg-red-50 hover:text-red-600')}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Logout
        </button>
      </div>
    </div>
  );
}
