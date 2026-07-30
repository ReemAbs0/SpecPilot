import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, FolderOpen, LogOut } from 'lucide-react';
import { cn } from '../ui';
import { useUserMenu } from './userMenu.shared';
import { ThemeSwitcher } from './ThemeSwitcher';
import { ColorModeToggle } from './ColorModeToggle';

// Classic (Tailwind) profile menu — the original custom dropdown, unchanged in look and
// behaviour. A single profile button opens a dropdown with the account actions. Auth wiring lives
// in the shared useUserMenu hook so the Material variant behaves identically.

export function ClassicUserMenu() {
  const { user, label, initial, onLibrary, signOutAndGoHome } = useUserMenu();
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

  async function handleSignOut() {
    setOpen(false);
    await signOutAndGoHome();
  }

  const itemBase =
    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500';
  const itemInactive = 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800';
  const itemActive = 'bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300';

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="user-menu"
        className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1 pl-1 pr-2 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
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
            'h-4 w-4 text-slate-400 dark:text-slate-500 transition-transform duration-150',
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
          'absolute right-0 top-full z-20 mt-2 w-56 origin-top-right rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-lg transition duration-150 ease-out',
          open
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none -translate-y-1 scale-95 opacity-0',
        )}
      >
        <div className="truncate px-3 pb-2 pt-1 text-xs text-slate-400 dark:text-slate-500" aria-hidden="true">
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

        <hr className="my-1.5 border-slate-100 dark:border-slate-800" />

        <div className="px-3 py-1">
          <p className="pb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">Theme</p>
          <ThemeSwitcher tabIndex={open ? 0 : -1} />
        </div>

        <hr className="my-1.5 border-slate-100 dark:border-slate-800" />

        <div className="px-3 py-1">
          <p className="pb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">Appearance</p>
          <ColorModeToggle tabIndex={open ? 0 : -1} />
        </div>

        <hr className="my-1.5 border-slate-100 dark:border-slate-800" />

        <button
          type="button"
          role="menuitem"
          tabIndex={open ? 0 : -1}
          onClick={handleSignOut}
          className={cn(itemBase, 'w-full text-slate-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400')}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Logout
        </button>
      </div>
    </div>
  );
}
