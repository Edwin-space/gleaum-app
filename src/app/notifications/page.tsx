'use client';

import { useEffect, useState, useMemo } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/db';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatRelativeTime } from '@/lib/utils';
import type { Notification } from '@/types';

// ── 알림 유형별 설정 고도화 ──
const typeConfig: Record<string, { color: string; bg: string; icon: string; label: string; emoji: string }> = {
  reminder:   { emoji: '📅', color: '#0084CC', bg: 'rgba(0,132,204,0.06)', label: '일정', icon: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18' },
  re_notify:  { emoji: '🔔', color: '#F59E0B', bg: 'rgba(245,158,11,0.06)', label: '재알림', icon: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0' },
  completion: { emoji: '✅', color: '#0CC9B5', bg: 'rgba(12,201,181,0.06)', label: '완료', icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3' },
  invite:     { emoji: '💌', color: '#8B5CF6', bg: 'rgba(139,92,246,0.06)', label: '초대', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  system:     { emoji: '⚙️', color: '#6B7280', bg: 'rgba(107,114,128,0.06)', label: '시스템', icon: 'M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z M12 16v-4 M12 8h.01' },
};

function groupNotifications(notifs: Notification[]) {
  const groups: Record<string, Notification[]> = {
    '오늘': [],
    '어제': [],
    '최근 소식': []
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
    else groups['최근 소식'].push(n);
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
    <div className="min-h-dvh pb-32 bg-transparent font-sans">
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        padding: '48px 20px 16px',
        background: 'rgba(250,250,253,0.7)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.5px', margin: 0 }}>
            알림 센터
          </h1>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{
                fontSize: '12px', fontWeight: 900, padding: '8px 16px',
                borderRadius: '999px', color: 'white',
                background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
                border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,132,204,0.3)',
              }}
            >
              모두 읽음
            </button>
          )}
        </div>
      </header>

      {/* 프리미엄 헤더 배너 */}
      {!loading && notifications.length > 0 && (
        <div className="px-6 mt-4 mb-8 animate-fade-in">
           <div className="relative p-6 rounded-[36px] overflow-hidden text-white shadow-xl" style={{ background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)' }}>
              <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-brand-blue/20 blur-[40px] rounded-full" />
              <div className="relative z-10 flex items-center justify-between">
                 <div>
                    <h2 className="text-[20px] font-black mb-1">새로운 소식</h2>
                    <p className="text-[13px] text-white/50 font-bold">
                       {unreadCount > 0 ? `${unreadCount}개의 읽지 않은 알림이 있습니다.` : '모든 소식을 확인했습니다.'}
                    </p>
                 </div>
                 <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-[28px] border border-white/20">
                    {unreadCount > 0 ? '🔔' : '✨'}
                 </div>
              </div>
           </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-brand-blue border-t-transparent animate-spin" />
          <p className="text-[14px] font-bold text-gray-400">알림을 동기화 중...</p>
        </div>
      ) : (
        <div className="px-6">
          {notifications.length > 0 ? (
            Object.entries(grouped).map(([title, items], groupIdx) => {
              if (items.length === 0) return null;
              return (
                <div key={title} className="mb-10 animate-fade-in-up" style={{ animationDelay: `${groupIdx * 0.1}s` }}>
                  <div className="flex items-center gap-3 mb-5 px-1">
                    <h3 className="text-[13px] font-black text-[#1A1B2E] uppercase tracking-widest">{title}</h3>
                    <div className="flex-1 h-[1px] bg-gray-100" />
                    <span className="text-[11px] font-black text-gray-300">{items.length}</span>
                  </div>
                  
                  <div className="space-y-4">
                    {items.map((n, idx) => {
                      const cfg = typeConfig[n.type] ?? typeConfig.system;
                      return (
                        <div
                          key={n.id}
                          onClick={() => !n.read && handleMarkRead(n.id)}
                          className="relative glass-card p-6 rounded-[40px] border border-white shadow-[0_8px_32px_rgba(0,0,0,0.03)] transition-all active:scale-[0.97] cursor-pointer overflow-hidden animate-fade-in-up"
                          style={{ 
                            opacity: n.read ? 0.5 : 1,
                            animationDelay: `${(groupIdx * 0.1) + (idx * 0.05)}s`
                          }}
                        >
                          {!n.read && (
                            <div className="absolute top-6 left-2 w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                          )}
                          
                          <div className="flex gap-5">
                            <div className="w-14 h-14 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-sm border border-white/50" style={{ background: cfg.bg }}>
                              <span className="text-[24px]">{cfg.emoji}</span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: cfg.color }}>{cfg.label}</span>
                                <span className="text-[11px] font-bold text-gray-400">{formatRelativeTime(n.createdAt)}</span>
                              </div>
                              <p className="text-[16px] font-black text-[#1A1B2E] mb-1.5 leading-tight">{n.title}</p>
                              <p className="text-[14px] text-[#8E8E93] font-bold leading-relaxed">{n.body}</p>
                            </div>
                          </div>
                          
                          {/* 하단 화살표 장식 */}
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10">
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 18l6-6-6-6"/>
                             </svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center py-32 text-center animate-fade-in">
              <div className="w-28 h-28 rounded-[48px] bg-white/50 backdrop-blur-xl border border-white flex items-center justify-center mb-8 shadow-2xl animate-float">
                <span className="text-[48px]">✨</span>
              </div>
              <h3 className="text-[20px] font-black text-[#1A1B2E] mb-3">모든 소식을 확인했어요</h3>
              <p className="text-[15px] text-[#8E8E93] font-bold leading-relaxed">새로운 알림이 도착하면<br/>가장 먼저 알려드릴게요.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
