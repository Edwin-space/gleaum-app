'use client';

import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/db';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatRelativeTime } from '@/lib/utils';
import type { Notification } from '@/types';

const typeConfig: Record<string, { color: string; path: string }> = {
  reminder:   { color: 'var(--brand-blue)',  path: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18' },
  re_notify:  { color: '#D97706', path: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0' },
  completion: { color: '#059669', path: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3' },
  invite:     { color: '#0891B2', path: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75' },
  system:     { color: '#6B7280', path: 'M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z M12 16v-4 M12 8h.01' },
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
    <div className="min-h-dvh pb-28">
      <AppHeader
        title="알림"
        showLogo={false}
        showNotification={false}
        showBack
        rightAction={
          unreadCount > 0 ? (
            <button
              onClick={handleMarkAllRead}
              className="text-[13px] font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95"
              style={{ background: 'rgba(0,132,204,0.08)', color: 'var(--brand-blue)' }}
            >
              모두 읽음
            </button>
          ) : undefined
        }
      />

      {/* 미읽음 카운트 */}
      {!loading && unreadCount > 0 && (
        <div className="mx-4 mt-4 mb-2">
          <span
            className="text-[13px] font-semibold px-3 py-1 rounded-full"
            style={{ background: 'rgba(0,132,204,0.08)', color: 'var(--brand-blue)' }}
          >
            읽지 않은 알림 {unreadCount}개
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(0,132,204,0.2)', borderTopColor: 'var(--brand-blue)' }} />
        </div>
      ) : (
        <div className="px-4 pt-2 space-y-2">
          {notifications.length > 0 ? (
            notifications.map((n) => {
              const cfg = typeConfig[n.type] ?? typeConfig.system;
              return (
                <div
                  key={n.id}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                  className="glass-card flex gap-3 p-4 rounded-[20px] transition-all cursor-pointer active:scale-[0.99]"
                  style={{
                    border: n.read ? '1px solid rgba(255,255,255,0.6)' : `1.5px solid ${cfg.color}40`,
                    opacity: n.read ? 0.75 : 1,
                  }}
                >
                  {/* 아이콘 */}
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${cfg.color}15` }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={cfg.path} />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[14px] font-semibold" style={{ color: 'var(--color-ink)' }}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: cfg.color }} />
                      )}
                    </div>
                    <p className="text-[13px] mt-0.5 leading-snug" style={{ color: 'var(--color-ink-muted-80)' }}>
                      {n.body}
                    </p>
                    <p className="text-[11px] mt-1.5" style={{ color: '#C7C7CC' }}>
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="glass-card flex flex-col items-center py-24 gap-4 rounded-[24px]">
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,132,204,0.06)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--brand-blue)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-ink)' }}>새로운 알림이 없어요</p>
              <p style={{ fontSize: '13px', color: 'var(--color-ink-muted-80)' }}>일정 알림이 오면 여기 표시됩니다</p>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
