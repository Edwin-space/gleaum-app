'use client';

import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/db';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatRelativeTime } from '@/lib/utils';
import type { Notification } from '@/types';

const typeConfig: Record<string, { icon: string; bg: string; color: string }> = {
  reminder:   { icon: '⏰', bg: 'rgba(0,132,204,0.10)',  color: '#0084CC' },
  re_notify:  { icon: '🔔', bg: 'rgba(245,158,11,0.10)', color: '#D97706' },
  completion: { icon: '✅', bg: 'rgba(16,185,129,0.10)', color: '#059669' },
  invite:     { icon: '👥', bg: 'rgba(6,182,212,0.10)',  color: '#0891B2' },
  system:     { icon: 'ℹ️', bg: 'rgba(156,163,175,0.15)', color: '#6B7280' },
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
    <div className="min-h-dvh pb-28" style={{ background: '#FAFAFD' }}>
      <AppHeader
        title="알림"
        showLogo={false}
        showNotification={false}
        showBack
        rightAction={
          unreadCount > 0 ? (
            <button
              onClick={handleMarkAllRead}
              className="text-[13px] font-semibold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(0,132,204,0.08)', color: '#0084CC', fontFamily: "'Noto Sans KR',sans-serif" }}
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
            style={{ background: 'rgba(0,132,204,0.08)', color: '#0084CC', fontFamily: "'Noto Sans KR',sans-serif" }}
          >
            읽지 않은 알림 {unreadCount}개
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(0,132,204,0.2)', borderTopColor: '#0084CC' }} />
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
                  className="flex gap-3 p-4 rounded-[20px] transition-all cursor-pointer active:scale-[0.99]"
                  style={{
                    background: n.read ? 'white' : 'rgba(0,132,204,0.05)',
                    border: n.read ? '1px solid rgba(0,132,204,0.06)' : '1.5px solid rgba(0,132,204,0.18)',
                    boxShadow: n.read ? '0 2px 12px rgba(0,132,204,0.04)' : '0 4px 20px rgba(0,132,204,0.08)',
                  }}
                >
                  {/* 아이콘 원형 */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.bg }}
                  >
                    <span className="text-lg">{cfg.icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className="text-[14px] font-semibold"
                        style={{ color: '#1A1B2E', fontFamily: "'Noto Sans KR',sans-serif" }}
                      >
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: '#0084CC' }} />
                      )}
                    </div>
                    <p
                      className="text-[13px] mt-0.5 leading-snug"
                      style={{ color: '#8E8E93', fontFamily: "'Noto Sans KR',sans-serif" }}
                    >
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
            <div className="flex flex-col items-center py-24 gap-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,132,204,0.06)' }}
              >
                <span className="text-4xl">🔕</span>
              </div>
              <p style={{ fontFamily: "'Noto Sans KR',sans-serif", fontSize: '15px', fontWeight: 600, color: '#1A1B2E' }}>
                새로운 알림이 없어요
              </p>
              <p style={{ fontFamily: "'Noto Sans KR',sans-serif", fontSize: '13px', color: '#8E8E93' }}>
                일정 알림이 오면 여기 표시됩니다
              </p>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
