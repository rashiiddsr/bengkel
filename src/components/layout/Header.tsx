import { Menu, Bell, ChevronDown, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { api, resolveImageUrl, type Notification } from '../../lib/api';

interface HeaderProps {
  isSidebarOpen: boolean;
  onMenuClick: () => void;
}

export function Header({ isSidebarOpen, onMenuClick }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user, profile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const recipientId = profile?.id ?? user?.id ?? '';

  const displayName = profile?.full_name ?? user?.email ?? 'Akun';
  const avatarUrl = resolveImageUrl(profile?.avatar_url ?? null);
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

  const fetchNotifications = useCallback(async () => {
    if (!recipientId) return;
    try {
      const data = await api.listNotifications({ recipient_id: recipientId, limit: 20 });
      setNotifications(data);
    } catch (error) {
      console.error(error);
    }
  }, [recipientId]);

  const unreadCount = useMemo(
    () => notifications.filter(notification => !notification.is_read).length,
    [notifications]
  );

  const handleMarkAllRead = async () => {
    if (!recipientId) return;
    try {
      await api.markAllNotificationsRead(recipientId);
      setNotifications(prev => prev.map(item => ({ ...item, is_read: true })));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const formatTimestamp = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <header className="relative z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
      >
        {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      <div className="flex-1"></div>

      <div className="flex items-center space-x-4">
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => {
              const nextState = !isNotificationsOpen;
              setIsNotificationsOpen(nextState);
              if (nextState) {
                fetchNotifications();
              }
            }}
            className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Notifikasi"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            ) : null}
          </button>

          {isNotificationsOpen ? (
            <div className="absolute right-0 z-50 mt-3 w-80 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Notifikasi</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
                  </p>
                </div>
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Tandai semua
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    Belum ada notifikasi.
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-gray-700 ${
                        notification.is_read ? 'bg-white dark:bg-gray-800' : 'bg-blue-50/60 dark:bg-blue-900/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          {notification.message ? (
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                              {notification.message}
                            </p>
                          ) : null}
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                          {formatTimestamp(notification.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(prev => !prev)}
            className="flex items-center gap-3 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-sm font-semibold text-white">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
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
            <div className="absolute right-0 z-50 mt-3 w-72 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
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
