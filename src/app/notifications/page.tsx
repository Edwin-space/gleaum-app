'use client';

import { useEffect, useState, useMemo } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/db';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatRelativeTime } from '@/lib/utils';
import type { Notification } from '@/types';

// ── 알림 유형별 설정 ──
const typeConfig: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  reminder:   { color: '#0084CC', bg: 'rgba(0,132,204,0.08)', label: '일정 리마인더', icon: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18' },
  re_notify:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', label: '재알림', icon: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0' },
  completion: { color: '#0CC9B5', bg: 'rgba(12,201,181,0.08)', label: '완료 보고', icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3' },
  invite:     { color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', label: '가족 초대', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75' },
  system:     { color: '#6B7280', bg: 'rgba(107,114,128,0.08)', label: '시스템', icon: 'M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z M12 16v-4 M12 8h.01' },
};

// ── 알림 그룹화 유틸리티 ──
function groupNotifications(notifs: Notification[]) {
  const groups: Record<string, Notification[]> = {
    '오늘': [],
    '어제': [],
    '이전 알림': []
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  notifs.forEach(n => {
    const d = new Date(n.createdAt);
    d.setHours(0, 0, 0, 0);

    if (d.getTime() === today.getTime()) groups['오늘'].push(n);
    else if (d.getTime() === yesterday.getTime()) groups['어제'].push(n);
    else groups['이전 알림'].push(n);
  });

  return groups;
}

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

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const grouped = useMemo(() => groupNotifications(notifications), [notifications]);

  return (
    <div className="min-h-dvh pb-32">
      <AppHeader
        title="알림 센터"
        showLogo={false}
        showNotification={false}
        showBack
        rightAction={
          unreadCount > 0 ? (
            <button
              onClick={handleMarkAllRead}
              className="text-[12px] font-black px-4 py-2 rounded-full transition-all active:scale-95 text-white shadow-lg"
              style={{ background: 'var(--brand-gradient)' }}
            >
              모두 읽음
            </button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-brand-blue border-t-transparent animate-spin" />
          <p className="text-[14px] font-bold text-gray-400">알림을 불러오는 중...</p>
        </div>
      ) : (
        <div className="px-6 pt-4">
          {notifications.length > 0 ? (
            Object.entries(grouped).map(([title, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={title} className="mb-8 animate-fade-in-up">
                  <h3 className="text-[12px] font-black text-[#8E8E93] uppercase tracking-[0.2em] mb-4 px-1">{title}</h3>
                  <div className="space-y-3">
                    {items.map((n) => {
                      const cfg = typeConfig[n.type] ?? typeConfig.system;
                      return (
                        <div
                          key={n.id}
                          onClick={() => !n.read && handleMarkRead(n.id)}
                          className="relative glass-card p-5 rounded-[32px] border border-white/60 shadow-sm transition-all active:scale-[0.98] cursor-pointer overflow-hidden"
                          style={{ opacity: n.read ? 0.6 : 1 }}
                        >
                          {!n.read && (
                            <div className="absolute top-0 left-0 w-1.5 h-full" style={{ background: cfg.color }} />
                          )}
                          
                          <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner" style={{ background: cfg.bg }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d={cfg.icon} />
                              </svg>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: cfg.color }}>{cfg.label}</span>
                                <span className="text-[11px] font-bold text-gray-400">{formatRelativeTime(n.createdAt)}</span>
                              </div>
                              <p className="text-[15px] font-black text-[#1A1B2E] mb-1 leading-tight">{n.title}</p>
                              <p className="text-[13px] text-[#8E8E93] font-bold leading-relaxed">{n.body}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center py-32 text-center">
              <div className="w-24 h-24 rounded-[40px] bg-white/50 backdrop-blur-xl border border-white flex items-center justify-center mb-6 shadow-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--brand-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </div>
              <p className="text-[18px] font-black text-[#1A1B2E] mb-2">조용하네요!</p>
              <p className="text-[14px] text-[#8E8E93] font-bold">새로운 소식이 오면<br/>여기에 예쁘게 담아드릴게요.</p>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
