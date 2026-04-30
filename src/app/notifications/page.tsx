'use client';

import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/db';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatRelativeTime } from '@/lib/utils';
import type { Notification } from '@/types';

const typeIcons: Record<string, string> = {
  reminder:   '⏰',
  re_notify:  '🔔',
  completion: '✅',
  invite:     '👥',
  system:     'ℹ️',
};

export default function NotificationsPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    getNotifications().then((data) => {
      setNotifications(data);
      setLoading(false);
    });
  }, [userLoading]);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-dvh pb-24">
      <AppHeader
        title="알림"
        showLogo={false}
        showNotification={false}
        showBack
        rightAction={
          unreadCount > 0 ? (
            <button
              onClick={handleMarkAllRead}
              className="text-[13px] font-medium"
              style={{ color: 'var(--color-primary)', fontFamily: "'Noto Sans KR',sans-serif" }}
            >
              모두 읽음
            </button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="px-4 pt-3 space-y-2">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.read && handleMarkRead(n.id)}
                className="flex gap-3 p-4 rounded-2xl transition-colors cursor-pointer"
                style={{
                  background: n.read ? 'white' : 'rgba(0,132,204,0.05)',
                  border: n.read ? '1px solid var(--color-hairline)' : '1px solid rgba(0,132,204,0.15)',
                }}
              >
                <span className="text-xl flex-shrink-0">{typeIcons[n.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[14px] font-semibold" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: 'var(--color-primary)' }} />
                    )}
                  </div>
                  <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                    {n.body}
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--color-body-muted)' }}>
                    {formatRelativeTime(n.createdAt)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center py-20 gap-3">
              <span className="text-5xl">🔕</span>
              <p style={{ fontFamily: "'Noto Sans KR',sans-serif", fontSize: '14px', color: 'var(--color-ink-muted-48)' }}>
                새로운 알림이 없습니다
              </p>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
