'use client';

import { useEffect, useState, useMemo } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/db';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatRelativeTime } from '@/lib/utils';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import type { Notification } from '@/types';

const typeConfig: Record<string, { color: string; bg: string; label: string; emoji: string }> = {
  reminder:   { emoji:'📅', color:'#0084CC', bg:'rgba(0,132,204,0.06)',   label:'일정' },
  re_notify:  { emoji:'🔔', color:'#F59E0B', bg:'rgba(245,158,11,0.06)',  label:'재알림' },
  completion: { emoji:'✅', color:'#0CC9B5', bg:'rgba(12,201,181,0.06)',  label:'완료' },
  invite:     { emoji:'💌', color:'#8B5CF6', bg:'rgba(139,92,246,0.06)',  label:'초대' },
  system:     { emoji:'⚙️', color:'#6B7280', bg:'rgba(107,114,128,0.06)', label:'시스템' },
};

function groupNotifications(notifs: Notification[]) {
  const groups: Record<string, Notification[]> = { '오늘':[], '어제':[], '최근 소식':[] };
  const today = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
  notifs.forEach(n => {
    const d = new Date(n.createdAt); d.setHours(0,0,0,0);
    if (d.getTime()===today.getTime()) groups['오늘'].push(n);
    else if (d.getTime()===yesterday.getTime()) groups['어제'].push(n);
    else groups['최근 소식'].push(n);
  });
  return groups;
}

export function DesktopNotifications() {
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
    setNotifications(prev => prev.map(n => n.id===id ? {...n, read:true} : n));
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifications(prev => prev.map(n => ({...n, read:true})));
  };

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  const filtered = useMemo(() => activeFilter==='all' ? notifications : notifications.filter(n=>n.type===activeFilter), [notifications, activeFilter]);
  const grouped = useMemo(() => groupNotifications(filtered), [filtered]);

  const filters = [
    { key:'all', label:'전체', emoji:'🔔' },
    { key:'reminder', label:'일정', emoji:'📅' },
    { key:'completion', label:'완료', emoji:'✅' },
    { key:'system', label:'시스템', emoji:'⚙️' },
  ];

  return (
    <div style={{ display:'flex', minHeight:'100dvh', background:'#F5F5F9' }}>
      <DesktopSidebar />
      <main style={{ flex:1, padding:'48px 40px', overflowY:'auto' }}>
        {/* 타이틀 */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'32px' }}>
          <div>
            <h1 style={{ fontSize:'28px', fontWeight:900, color:'#1A1B2E', letterSpacing:'-0.5px', margin:'0 0 6px' }}>알림 센터</h1>
            <p style={{ fontSize:'14px', color:'#8E8E93', fontWeight:600, margin:0 }}>
              {unreadCount>0 ? `${unreadCount}개의 읽지 않은 알림` : '모든 알림을 확인했습니다'}
            </p>
          </div>
          {unreadCount>0 && (
            <button onClick={handleMarkAllRead} style={{ padding:'10px 20px', borderRadius:'14px', background:'linear-gradient(135deg, #0CC9B5, #0084CC)', color:'white', fontSize:'13px', fontWeight:900, border:'none', cursor:'pointer' }}>
              모두 읽음 처리
            </button>
          )}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:'24px', maxWidth:'1000px' }}>
          {/* 왼쪽: 필터 사이드바 */}
          <div>
            <div style={{ background:'white', borderRadius:'20px', padding:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.04)', position:'sticky', top:'24px' }}>
              <p style={{ fontSize:'11px', fontWeight:900, color:'#C7C7CC', letterSpacing:'0.1em', textTransform:'uppercase', margin:'0 0 12px 8px' }}>필터</p>
              {filters.map(f => (
                <button key={f.key} onClick={() => setActiveFilter(f.key)} style={{ width:'100%', display:'flex', alignItems:'center', gap:'12px', padding:'12px 14px', borderRadius:'14px', border:'none', cursor:'pointer', background: activeFilter===f.key?'rgba(0,132,204,0.08)':'transparent', color: activeFilter===f.key?'#0084CC':'#1A1B2E', fontWeight: activeFilter===f.key?900:600, fontSize:'14px', transition:'all 0.15s', marginBottom:'4px' }}>
                  <span>{f.emoji}</span>
                  <span style={{ flex:1, textAlign:'left' }}>{f.label}</span>
                  {activeFilter===f.key && <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#0084CC' }} />}
                </button>
              ))}

              {/* 미읽음 요약 */}
              {unreadCount>0 && (
                <div style={{ marginTop:'16px', padding:'14px', borderRadius:'14px', background:'rgba(0,132,204,0.05)', border:'1px solid rgba(0,132,204,0.1)' }}>
                  <p style={{ fontSize:'12px', fontWeight:700, color:'#0084CC', margin:'0 0 4px' }}>읽지 않은 알림</p>
                  <p style={{ fontSize:'24px', fontWeight:900, color:'#1A1B2E', margin:0 }}>{unreadCount}<span style={{ fontSize:'13px', color:'#8E8E93', fontWeight:600 }}>개</span></p>
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 알림 목록 */}
          <div>
            {loading ? (
              <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}>
                <div style={{ width:'32px', height:'32px', borderRadius:'50%', border:'3px solid rgba(0,132,204,0.2)', borderTopColor:'#0084CC', animation:'spin 0.8s linear infinite' }} />
              </div>
            ) : filtered.length===0 ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'80px 0', textAlign:'center' }}>
                <div style={{ width:'80px', height:'80px', borderRadius:'28px', background:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'36px', marginBottom:'20px', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>✨</div>
                <h3 style={{ fontSize:'18px', fontWeight:900, color:'#1A1B2E', margin:'0 0 8px' }}>모든 소식을 확인했어요</h3>
                <p style={{ fontSize:'14px', color:'#8E8E93', fontWeight:600 }}>새로운 알림이 도착하면 알려드릴게요</p>
              </div>
            ) : (
              Object.entries(grouped).map(([title, items]) => {
                if (items.length===0) return null;
                return (
                  <div key={title} style={{ marginBottom:'32px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px' }}>
                      <h3 style={{ fontSize:'12px', fontWeight:900, color:'#1A1B2E', letterSpacing:'0.1em', textTransform:'uppercase', margin:0 }}>{title}</h3>
                      <div style={{ flex:1, height:'1px', background:'#EBEBF0' }} />
                      <span style={{ fontSize:'11px', fontWeight:700, color:'#C7C7CC' }}>{items.length}</span>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                      {items.map(n => {
                        const cfg = typeConfig[n.type] ?? typeConfig.system;
                        return (
                          <div key={n.id} onClick={() => !n.read && handleMarkRead(n.id)} style={{ display:'flex', gap:'16px', padding:'20px 24px', borderRadius:'20px', background:'white', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', cursor: n.read?'default':'pointer', opacity: n.read?0.6:1, transition:'all 0.15s', borderLeft: n.read?'none':`3px solid ${cfg.color}` }}>
                            <div style={{ width:'48px', height:'48px', borderRadius:'16px', background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>{cfg.emoji}</div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'4px' }}>
                                <span style={{ fontSize:'11px', fontWeight:900, letterSpacing:'0.08em', textTransform:'uppercase', color:cfg.color }}>{cfg.label}</span>
                                <span style={{ fontSize:'11px', fontWeight:600, color:'#C7C7CC' }}>{formatRelativeTime(n.createdAt)}</span>
                              </div>
                              <p style={{ fontSize:'15px', fontWeight:800, color:'#1A1B2E', margin:'0 0 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.title}</p>
                              <p style={{ fontSize:'13px', color:'#8E8E93', fontWeight:600, margin:0 }}>{n.body}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
