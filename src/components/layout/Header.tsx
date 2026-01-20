import { Menu, Bell, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user, profile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = profile?.full_name ?? user?.email ?? 'Akun';
  const roleLabel = useMemo(() => {
    const role = profile?.role ?? user?.role;
    if (!role) {
      return 'User';
    }
    return role.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
  }, [profile?.role, user?.role]);

  const initials = useMemo(() => {
    const parts = displayName.trim().split(' ').filter(Boolean);
    const first = parts[0]?.[0] ?? 'U';
    const second = parts[1]?.[0] ?? '';
    return `${first}${second}`.toUpperCase();
  }, [displayName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="flex-1"></div>

      <div className="flex items-center space-x-4">
        <button
          className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(prev => !prev)}
            className="flex items-center gap-3 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              {initials}
            </div>
            <div className="hidden flex-col items-start text-left sm:flex">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {displayName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{roleLabel}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>

          {isMenuOpen ? (
            <div className="absolute right-0 mt-3 w-72 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{displayName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{roleLabel}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Theme
                </p>
                <select
                  value={theme}
                  onChange={event => setTheme(event.target.value as typeof theme)}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="system">System Default</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-700">
                <button
                  onClick={signOut}
                  className="w-full rounded-lg border border-red-200 px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
