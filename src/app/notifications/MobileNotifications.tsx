'use client';

import { useEffect, useState, useMemo } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/db';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatRelativeTime } from '@/lib/utils';
import type { Notification } from '@/types';

const typeConfig: Record<string, { color: string; bg: string; icon: string; label: string; emoji: string }> = {
  reminder:   { emoji: '📅', color: '#0084CC', bg: 'rgba(0,132,204,0.07)', label: '일정', icon: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18' },
  re_notify:  { emoji: '🔔', color: '#F59E0B', bg: 'rgba(245,158,11,0.07)', label: '재알림', icon: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0' },
  completion: { emoji: '✅', color: '#0CC9B5', bg: 'rgba(12,201,181,0.07)', label: '완료', icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3' },
  invite:     { emoji: '💌', color: '#8B5CF6', bg: 'rgba(139,92,246,0.07)', label: '초대', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  system:     { emoji: '⚙️', color: '#6B7280', bg: 'rgba(107,114,128,0.07)', label: '시스템', icon: 'M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z M12 16v-4 M12 8h.01' },
};

function groupNotifications(notifs: Notification[]) {
  const groups: Record<string, Notification[]> = {
    '오늘': [],
    '어제': [],
    '최근 소식': [],
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  notifs.forEach((n) => {
    const d = new Date(n.createdAt);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) groups['오늘'].push(n);
    else if (d.getTime() === yesterday.getTime()) groups['어제'].push(n);
    else groups['최근 소식'].push(n);
  });

  return groups;
}

export function MobileNotifications() {
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
    <div
      className="min-h-dvh"
      style={{ background: '#FAFAFD', paddingBottom: 'calc(env(safe-area-inset-bottom) + 64px)' }}
    >
      {/* ── Sticky frosted header ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        padding: 'calc(env(safe-area-inset-top) + 12px) 20px 14px',
        background: 'rgba(250,250,253,0.82)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1B2E', letterSpacing: '-0.5px', margin: 0 }}>
            알림 센터
          </h1>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{
                fontSize: '12px', fontWeight: 800,
                padding: '8px 18px',
                borderRadius: '999px',
                color: 'white',
                background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
                border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,132,204,0.28)',
              }}
            >
              모두 읽음
            </button>
          )}
        </div>
      </header>

      {/* ── Hero banner (when notifications exist) ── */}
      {!loading && notifications.length > 0 && (
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
            borderRadius: '24px',
            padding: '20px 22px',
            color: 'white',
            boxShadow: '0 8px 32px rgba(26,27,46,0.22)',
          }}>
            {/* Glow */}
            <div style={{
              position: 'absolute', top: '-20px', right: '-20px',
              width: '100px', height: '100px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,132,204,0.28) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 900, margin: '0 0 4px' }}>새로운 소식</h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.50)', fontWeight: 600, margin: 0 }}>
                  {unreadCount > 0
                    ? `${unreadCount}개의 읽지 않은 알림이 있습니다.`
                    : '모든 소식을 확인했습니다.'}
                </p>
              </div>
              <div style={{
                width: '52px', height: '52px', borderRadius: '16px',
                background: 'rgba(255,255,255,0.10)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.16)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '26px',
              }}>
                {unreadCount > 0 ? '🔔' : '✨'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '120px', gap: '16px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            border: '3px solid #0084CC',
            borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#8E8E93' }}>알림을 동기화 중...</p>
        </div>
      ) : (
        <div style={{ padding: '20px 16px 0' }}>
          {notifications.length > 0 ? (
            Object.entries(grouped).map(([title, items], groupIdx) => {
              if (items.length === 0) return null;
              return (
                <div key={title} style={{ marginBottom: '32px' }}>
                  {/* Group header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', paddingLeft: '4px' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 900, color: '#1A1B2E', textTransform: 'uppercase', letterSpacing: '1.4px', margin: 0 }}>
                      {title}
                    </h3>
                    <div style={{ flex: 1, height: '1px', background: '#EBEBEB' }} />
                    <span style={{
                      fontSize: '11px', fontWeight: 800,
                      padding: '2px 8px', borderRadius: '999px',
                      background: '#F0F0F0', color: '#8E8E93',
                    }}>
                      {items.length}
                    </span>
                  </div>

                  {/* Notification cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {items.map((n) => {
                      const cfg = typeConfig[n.type] ?? typeConfig.system;
                      return (
                        <div
                          key={n.id}
                          onClick={() => !n.read && handleMarkRead(n.id)}
                          style={{
                            position: 'relative',
                            background: 'white',
                            borderRadius: '20px',
                            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                            border: '1px solid rgba(0,0,0,0.04)',
                            padding: '16px',
                            opacity: n.read ? 0.52 : 1,
                            cursor: n.read ? 'default' : 'pointer',
                            overflow: 'hidden',
                            borderLeft: n.read ? '1px solid rgba(0,0,0,0.04)' : `3px solid ${cfg.color}`,
                          }}
                        >
                          <div style={{ display: 'flex', gap: '14px' }}>
                            {/* Icon circle */}
                            <div style={{
                              width: '48px', height: '48px', borderRadius: '16px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0,
                              background: cfg.bg,
                              fontSize: '22px',
                            }}>
                              {cfg.emoji}
                            </div>

                            {/* Text */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '5px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: cfg.color }}>
                                  {cfg.label}
                                </span>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#8E8E93', whiteSpace: 'nowrap' }}>
                                  {formatRelativeTime(n.createdAt)}
                                </span>
                              </div>
                              <p style={{ fontSize: '15px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 4px', lineHeight: 1.3 }}>
                                {n.title}
                              </p>
                              <p style={{ fontSize: '13px', color: '#6E6E66', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
                                {n.body}
                              </p>
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '100px', textAlign: 'center' }}>
              <div style={{
                width: '96px', height: '96px', borderRadius: '36px',
                background: 'white',
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '44px',
                marginBottom: '24px',
              }}>
                ✨
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 10px' }}>
                모든 소식을 확인했어요
              </h3>
              <p style={{ fontSize: '15px', color: '#8E8E93', fontWeight: 500, lineHeight: 1.6, margin: 0 }}>
                새로운 알림이 도착하면<br />가장 먼저 알려드릴게요.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
