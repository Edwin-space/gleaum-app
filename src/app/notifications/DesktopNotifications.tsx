'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/db';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatRelativeTime } from '@/lib/utils';
import type { Notification } from '@/types';

const typeConfig: Record<string, { color: string; bg: string; label: string; emoji: string }> = {
  reminder:   { emoji: '📅', color: '#0084CC', bg: 'rgba(0,132,204,0.08)',   label: '일정' },
  re_notify:  { emoji: '🔔', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  label: '재알림' },
  completion: { emoji: '✅', color: '#0CC9B5', bg: 'rgba(12,201,181,0.08)',  label: '완료' },
  invite:     { emoji: '💌', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)',  label: '초대' },
  system:     { emoji: '⚙️', color: 'var(--theme-text-subtle)', bg: 'rgba(107,114,128,0.08)', label: '시스템' },
};

function groupNotifications(notifs: Notification[]) {
  const groups: Record<string, Notification[]> = { '오늘': [], '어제': [], '최근 소식': [] };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  notifs.forEach(n => {
    const d = new Date(n.createdAt); d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) groups['오늘'].push(n);
    else if (d.getTime() === yesterday.getTime()) groups['어제'].push(n);
    else groups['최근 소식'].push(n);
  });
  return groups;
}

const filterItems = [
  { key: 'all',        label: '전체',   emoji: '🔔' },
  { key: 'reminder',   label: '일정',   emoji: '📅' },
  { key: 'completion', label: '완료',   emoji: '✅' },
  { key: 'system',     label: '시스템', emoji: '⚙️' },
];

export function DesktopNotifications() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    if (userLoading) return;
    getNotifications().then(data => { setNotifications(data); setLoading(false); });
  }, [userLoading]);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) await handleMarkRead(notification.id);
    if (notification.scheduleId) router.push(`/schedules/${notification.scheduleId}`);
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  const filtered = useMemo(() =>
    activeFilter === 'all' ? notifications : notifications.filter(n => n.type === activeFilter),
    [notifications, activeFilter]
  );
  const grouped = useMemo(() => groupNotifications(filtered), [filtered]);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

      {/* ── 페이지 헤더 ── */}
      <div style={{
        position: 'relative',
        padding: '36px 44px',
        borderRadius: '28px',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
        color: 'white',
        marginBottom: '32px',
        boxShadow: '0 14px 44px rgba(26,27,46,0.22)',
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(0,132,204,0.18)', filter: 'blur(60px)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20px', left: '30%', width: '140px', height: '140px', background: 'rgba(12,201,181,0.12)', filter: 'blur(45px)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.5px', margin: 0 }}>알림 센터</h1>
              {unreadCount > 0 && (
                <div style={{ padding: '4px 12px', borderRadius: '999px', background: 'rgba(0,132,204,0.25)', border: '1px solid rgba(0,132,204,0.4)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#4DC8FF' }}>{unreadCount}개 미확인</span>
                </div>
              )}
            </div>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, margin: 0 }}>
              {unreadCount > 0 ? `${unreadCount}개의 읽지 않은 알림이 있습니다` : '모든 알림을 확인했습니다 ✓'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} style={{
              padding: '12px 24px', borderRadius: '16px',
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', fontSize: '14px', fontWeight: 800,
              cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'all 0.2s',
            }}>
              전체 읽음 처리
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px' }}>

        {/* ── 왼쪽: 필터 패널 ── */}
        <div>
          <div style={{
            background: 'var(--theme-surface)', borderRadius: '24px', padding: '20px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)',
            position: 'sticky', top: '24px',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: '#C7C7CC', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 12px 4px' }}>필터</p>

            {filterItems.map(f => (
              <button key={f.key} onClick={() => setActiveFilter(f.key)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 14px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                background: activeFilter === f.key ? 'rgba(0,132,204,0.08)' : 'transparent',
                color: activeFilter === f.key ? '#0084CC' : '#6E6E66',
                fontWeight: activeFilter === f.key ? 800 : 600,
                fontSize: '14px', transition: 'all 0.15s', marginBottom: '4px',
                textAlign: 'left',
              }}>
                <span style={{ fontSize: '16px' }}>{f.emoji}</span>
                <span style={{ flex: 1 }}>{f.label}</span>
                {activeFilter === f.key && (
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0084CC', flexShrink: 0 }} />
                )}
              </button>
            ))}

            {unreadCount > 0 && (
              <div style={{
                marginTop: '16px', padding: '16px', borderRadius: '16px',
                background: 'rgba(0,132,204,0.05)', border: '1px solid rgba(0,132,204,0.1)',
              }}>
                <p style={{ fontSize: '11px', fontWeight: 800, color: '#0084CC', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>미확인</p>
                <p style={{ fontSize: '28px', fontWeight: 900, color: 'var(--theme-text)', margin: 0, lineHeight: 1 }}>
                  {unreadCount}
                  <span style={{ fontSize: '14px', color: 'var(--theme-text-subtle)', fontWeight: 600, marginLeft: '4px' }}>개</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── 오른쪽: 알림 목록 ── */}
        <div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid rgba(0,132,204,0.15)', borderTopColor: '#0084CC', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '100px 0', textAlign: 'center' }}>
              <div style={{ width: '88px', height: '88px', borderRadius: '32px', background: 'var(--theme-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', marginBottom: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>✨</div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--theme-text)', margin: '0 0 8px' }}>모든 소식을 확인했어요</h3>
              <p style={{ fontSize: '14px', color: 'var(--theme-text-subtle)', fontWeight: 600 }}>새로운 알림이 도착하면 알려드릴게요</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {Object.entries(grouped).map(([title, items]) => {
                if (items.length === 0) return null;
                return (
                  <div key={title}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '11px', fontWeight: 900, color: 'var(--theme-text-subtle)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>{title}</h3>
                      <div style={{ flex: 1, height: '1px', background: '#F0F0F0' }} />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#C7C7CC' }}>{items.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {items.map(n => {
                        const cfg = typeConfig[n.type] ?? typeConfig.system;
                        return (
                          <button
                            type="button"
                            key={n.id}
                            onClick={() => void handleNotificationClick(n)}
                            disabled={n.read && !n.scheduleId}
                            style={{
                              width: '100%', textAlign: 'left', font: 'inherit',
                              display: 'flex', gap: '16px', padding: '20px 24px',
                              borderRadius: '20px', background: 'var(--theme-surface)',
                              boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
                              border: `1px solid ${n.read ? 'rgba(0,0,0,0.04)' : cfg.color + '22'}`,
                              cursor: n.scheduleId || !n.read ? 'pointer' : 'default',
                              opacity: n.read ? 0.65 : 1,
                              transition: 'all 0.15s',
                              borderLeft: n.read ? '1px solid rgba(0,0,0,0.04)' : `3px solid ${cfg.color}`,
                            }}
                          >
                            <div style={{
                              width: '48px', height: '48px', borderRadius: '16px',
                              background: cfg.bg, display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: '22px', flexShrink: 0,
                            }}>{cfg.emoji}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: cfg.color }}>{cfg.label}</span>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#C7C7CC' }}>{formatRelativeTime(n.createdAt)}</span>
                              </div>
                              <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--theme-text)', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</p>
                              <p style={{ fontSize: '13px', color: 'var(--theme-text-subtle)', fontWeight: 600, margin: 0 }}>{n.body}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
