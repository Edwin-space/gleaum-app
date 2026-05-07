'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSpace } from '@/hooks/useSpace';
import { useSchedules } from '@/hooks/useSchedules';
import { formatTime, formatDateShort } from '@/lib/utils';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import type { Schedule, ScheduleStatus } from '@/types';

async function sendReNotify(schedule: Schedule, memberNames: string) {
  try {
    const res = await fetch('/api/notifications/renotify', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ scheduleId:schedule.id, title:`🔔 재알림: ${schedule.title}`, body:`${memberNames?memberNames+' · ':''}놓친 일정을 확인해주세요`, url:`/schedules/${schedule.id}` }),
    });
    return res.ok;
  } catch { return false; }
}

const steps: { key: ScheduleStatus; label: string }[] = [
  { key:'pending', label:'대기' }, { key:'in_progress', label:'진행중' }, { key:'completed', label:'완료' },
];

const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  pending:     { bg:'rgba(156,163,175,0.12)', color:'#9CA3AF',  label:'대기' },
  in_progress: { bg:'rgba(0,132,204,0.10)',   color:'#0084CC',  label:'진행중' },
  completed:   { bg:'rgba(16,185,129,0.10)',  color:'#059669',  label:'완료' },
  missed:      { bg:'rgba(239,68,68,0.10)',   color:'#EF4444',  label:'미완료' },
};

export function DesktopChildren() {
  const [activeChild, setActiveChild] = useState<string>('all');
  const [completionModal, setCompletionModal] = useState<Schedule | null>(null);
  const [reNotifyingId, setReNotifyingId] = useState<string | null>(null);
  const router = useRouter();

  const { spaceId } = useCurrentUser();
  const { members, loading: spaceLoading } = useSpace(spaceId);
  const { schedules, loading: schedulesLoading, updateStatus } = useSchedules(spaceId);

  const loading = spaceLoading || schedulesLoading;
  const children = members.filter(u => u.role==='child');
  const today = new Date();

  const childSchedules = schedules.filter(s => {
    if (s.type!=='child') return false;
    if (activeChild==='all') return true;
    return s.participants.includes(activeChild);
  });

  const todaySchedules = childSchedules.filter(s => s.startTime.toDateString()===today.toDateString());
  const completedCount = todaySchedules.filter(s => s.status==='completed').length;
  const missedCount    = todaySchedules.filter(s => s.status==='missed').length;
  const completePct    = todaySchedules.length>0 ? Math.round((completedCount/todaySchedules.length)*100) : 0;

  const r = 30, circumference = 2*Math.PI*r;
  const dashOffset = circumference*(1-completePct/100);

  const selectedChild = children.find(c => c.id===activeChild);

  return (
    <div style={{ display:'flex', minHeight:'100dvh', background:'#F5F5F9' }}>
      <DesktopSidebar />
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* 상단 헤더 */}
        <div style={{ padding:'32px 40px 24px', background:'white', borderBottom:'1px solid #F0F0F5', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
            <button onClick={()=>router.back()} style={{ width:'36px', height:'36px', borderRadius:'12px', background:'#F5F5F9', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18L9 12L15 6"/></svg>
            </button>
            <div>
              <h1 style={{ fontSize:'22px', fontWeight:900, color:'#1A1B2E', margin:0, letterSpacing:'-0.3px' }}>자녀 일정 관리</h1>
              <p style={{ fontSize:'13px', color:'#8E8E93', fontWeight:600, margin:'2px 0 0' }}>{formatDateShort(today)} · {children.length}명의 자녀</p>
            </div>
          </div>
          <button onClick={()=>router.push('/schedules/new')} style={{ padding:'10px 20px', borderRadius:'14px', background:'linear-gradient(135deg, #0084CC, #0CC9B5)', color:'white', fontSize:'13px', fontWeight:900, border:'none', cursor:'pointer' }}>
            + 일정 추가
          </button>
        </div>

        <div style={{ flex:1, display:'grid', gridTemplateColumns:'260px 1fr', overflow:'hidden' }}>
          {/* 왼쪽: 자녀 선택 패널 */}
          <div style={{ borderRight:'1px solid #F0F0F5', padding:'24px 20px', overflowY:'auto', background:'white' }}>
            {/* 오늘 요약 */}
            <div style={{ position:'relative', padding:'20px', borderRadius:'20px', background:'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)', color:'white', marginBottom:'20px', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:'-20px', right:'-20px', width:'80px', height:'80px', background:'rgba(255,255,255,0.1)', borderRadius:'50%' }} />
              <div style={{ position:'relative', zIndex:1 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                  <p style={{ fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.7)', margin:0 }}>오늘 달성률</p>
                  <svg viewBox="0 0 68 68" style={{ width:'44px', height:'44px', transform:'rotate(-90deg)' }}>
                    <circle cx="34" cy="34" r={r} stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="none"/>
                    <circle cx="34" cy="34" r={r} stroke="white" strokeWidth="6" fill="none" strokeDasharray={circumference} strokeDashoffset={todaySchedules.length===0?circumference:dashOffset} strokeLinecap="round" style={{ transition:'stroke-dashoffset 0.8s ease' }}/>
                  </svg>
                </div>
                <div style={{ display:'flex', gap:'16px' }}>
                  <div><p style={{ fontSize:'22px', fontWeight:900, color:'white', margin:0, lineHeight:1 }}>{todaySchedules.length}</p><p style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', margin:'4px 0 0', fontWeight:600 }}>전체</p></div>
                  <div><p style={{ fontSize:'22px', fontWeight:900, color:'white', margin:0, lineHeight:1 }}>{completedCount}</p><p style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', margin:'4px 0 0', fontWeight:600 }}>완료</p></div>
                  {missedCount>0 && <div><p style={{ fontSize:'22px', fontWeight:900, color:'#FFD166', margin:0, lineHeight:1 }}>{missedCount}</p><p style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', margin:'4px 0 0', fontWeight:600 }}>미완료</p></div>}
                </div>
              </div>
            </div>

            {/* 자녀 선택 버튼 */}
            <p style={{ fontSize:'11px', fontWeight:900, color:'#C7C7CC', letterSpacing:'0.1em', textTransform:'uppercase', margin:'0 0 10px 4px' }}>자녀 선택</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
              <button onClick={()=>setActiveChild('all')} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 14px', borderRadius:'14px', border:'none', cursor:'pointer', background: activeChild==='all'?'rgba(0,132,204,0.08)':'transparent', color: activeChild==='all'?'#0084CC':'#1A1B2E', fontWeight: activeChild==='all'?900:600, fontSize:'14px', transition:'all 0.15s' }}>
                <span style={{ fontSize:'18px' }}>👥</span> 전체 보기
                <span style={{ marginLeft:'auto', fontSize:'12px', fontWeight:700, color:'#8E8E93' }}>{schedules.filter(s=>s.type==='child').length}</span>
              </button>
              {children.map(child => {
                const cnt = schedules.filter(s=>s.type==='child'&&s.participants.includes(child.id)).length;
                return (
                  <button key={child.id} onClick={()=>setActiveChild(child.id)} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 14px', borderRadius:'14px', border:'none', cursor:'pointer', background: activeChild===child.id?'rgba(0,132,204,0.08)':'transparent', color: activeChild===child.id?'#0084CC':'#1A1B2E', fontWeight: activeChild===child.id?900:600, fontSize:'14px', transition:'all 0.15s' }}>
                    <span style={{ fontSize:'18px' }}>{child.avatar}</span> {child.name}
                    <span style={{ marginLeft:'auto', fontSize:'12px', fontWeight:700, color:'#8E8E93' }}>{cnt}</span>
                  </button>
                );
              })}
              {children.length===0 && (
                <p style={{ fontSize:'13px', color:'#C7C7CC', fontWeight:600, textAlign:'center', padding:'20px 0' }}>등록된 자녀가 없습니다</p>
              )}
            </div>
          </div>

          {/* 오른쪽: 일정 목록 */}
          <div style={{ overflowY:'auto', padding:'24px 32px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
              <h2 style={{ fontSize:'18px', fontWeight:900, color:'#1A1B2E', margin:0 }}>
                {activeChild==='all' ? '전체 자녀 일정' : `${selectedChild?.name}의 일정`}
              </h2>
              <span style={{ fontSize:'13px', fontWeight:700, color:'#8E8E93' }}>{childSchedules.length}개</span>
            </div>

            {loading ? (
              <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
                <div style={{ width:'32px', height:'32px', borderRadius:'50%', border:'3px solid rgba(0,132,204,0.2)', borderTopColor:'#0084CC', animation:'spin 0.8s linear infinite' }} />
              </div>
            ) : childSchedules.length===0 ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 0', textAlign:'center' }}>
                <div style={{ fontSize:'48px', marginBottom:'16px' }}>📭</div>
                <h3 style={{ fontSize:'16px', fontWeight:900, color:'#1A1B2E', margin:'0 0 8px' }}>자녀 일정이 없어요</h3>
                <p style={{ fontSize:'13px', color:'#8E8E93', fontWeight:600 }}>일정 추가에서 자녀 일정을 등록하세요</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {childSchedules.map(schedule => {
                  const ss = statusStyle[schedule.status] ?? statusStyle.pending;
                  const currentStepIdx = steps.findIndex(s=>s.key===schedule.status);
                  const participantChildren = children.filter(c=>schedule.participants.includes(c.id));
                  const isMissed = schedule.status==='missed';

                  return (
                    <div key={schedule.id} style={{ background:'white', borderRadius:'20px', padding:'20px 24px', boxShadow:'0 2px 12px rgba(0,0,0,0.04)', display:'grid', gridTemplateColumns:'1fr auto', gap:'16px', alignItems:'start' }}>
                      <div>
                        {/* 헤더 */}
                        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                          <p style={{ fontSize:'16px', fontWeight:800, color:'#1A1B2E', margin:0, flex:1 }}>{schedule.title}</p>
                          <span style={{ padding:'4px 10px', borderRadius:'999px', fontSize:'11px', fontWeight:800, background:ss.bg, color:ss.color, flexShrink:0 }}>{ss.label}</span>
                        </div>
                        <p style={{ fontSize:'12px', color:'#8E8E93', fontWeight:600, margin:'0 0 10px' }}>
                          {formatDateShort(schedule.startTime)} · {formatTime(schedule.startTime)}{schedule.endTime && ` ~ ${formatTime(schedule.endTime)}`}
                        </p>
                        {/* 참여 자녀 칩 */}
                        {participantChildren.length>0 && (
                          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'10px' }}>
                            {participantChildren.map(c=>(
                              <span key={c.id} style={{ padding:'4px 10px', borderRadius:'999px', fontSize:'11px', fontWeight:700, background:'rgba(16,185,129,0.1)', color:'#059669' }}>{c.avatar} {c.name}</span>
                            ))}
                          </div>
                        )}
                        {/* 진행 스텝퍼 */}
                        {!isMissed && (
                          <div style={{ display:'flex', alignItems:'center', maxWidth:'280px' }}>
                            {steps.map((step, i) => {
                              const isActive = schedule.status===step.key;
                              const isPast = i<currentStepIdx;
                              const dotColor = isPast||isActive ? (step.key==='completed'?'#10B981':step.key==='in_progress'?'#0084CC':'#9CA3AF') : '#E5E5EA';
                              return (
                                <div key={step.key} style={{ display:'flex', alignItems:'center', flex:1 }}>
                                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                                    <div style={{ width:'24px', height:'24px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:800, background: isPast||isActive?dotColor:'#F0F0F0', color: isPast||isActive?'white':'#C7C7CC', boxShadow: isActive?`0 2px 8px ${dotColor}50`:'none' }}>
                                      {isPast?'✓':i+1}
                                    </div>
                                    <span style={{ fontSize:'10px', color: isActive?dotColor:'#C7C7CC', fontWeight: isActive?800:400 }}>{step.label}</span>
                                  </div>
                                  {i<2 && <div style={{ flex:1, height:'2px', margin:'0 4px 16px', borderRadius:'2px', background: isPast?'#10B981':'#E5E5EA' }}/>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {isMissed && (
                          <div style={{ padding:'8px 12px', borderRadius:'10px', background:'rgba(239,68,68,0.06)', display:'inline-flex', alignItems:'center', gap:'6px' }}>
                            <span style={{ fontSize:'12px' }}>⚠️</span>
                            <p style={{ fontSize:'12px', fontWeight:700, color:'#EF4444', margin:0 }}>미완료 처리된 일정</p>
                          </div>
                        )}
                      </div>

                      {/* 액션 버튼 */}
                      <div style={{ display:'flex', flexDirection:'column', gap:'8px', minWidth:'120px' }}>
                        {schedule.status==='in_progress' && (
                          <button onClick={()=>setCompletionModal(schedule)} style={{ padding:'10px 16px', borderRadius:'12px', background:'linear-gradient(135deg, #34D399, #10B981)', color:'white', fontSize:'13px', fontWeight:800, border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>✓ 완료 확인</button>
                        )}
                        {(schedule.status==='pending'||schedule.status==='missed') && (
                          <button disabled={reNotifyingId===schedule.id} onClick={async()=>{ setReNotifyingId(schedule.id); const ok=await sendReNotify(schedule, participantChildren.map(c=>c.name).join(', ')); setReNotifyingId(null); alert(ok?`✅ 재알림 발송 완료`:'❌ 발송 실패'); }} style={{ padding:'10px 16px', borderRadius:'12px', background:'rgba(0,132,204,0.08)', color:'#0084CC', fontSize:'13px', fontWeight:800, border:'none', cursor:'pointer', whiteSpace:'nowrap', opacity: reNotifyingId===schedule.id?0.6:1 }}>
                            {reNotifyingId===schedule.id?'발송 중...':'🔔 재알림'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 완료 확인 모달 */}
      {completionModal && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(8px)' }} onClick={()=>setCompletionModal(null)}>
          <div style={{ width:'100%', maxWidth:'400px', background:'white', borderRadius:'32px', padding:'32px', margin:'0 20px' }} onClick={e=>e.stopPropagation()}>
            <p style={{ fontSize:'20px', fontWeight:900, textAlign:'center', color:'#1A1B2E', margin:'0 0 8px' }}>일정을 완료했나요?</p>
            <p style={{ fontSize:'14px', textAlign:'center', color:'#8E8E93', fontWeight:600, margin:'0 0 28px' }}>{completionModal.title}</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <button onClick={()=>{updateStatus(completionModal.id,'missed');setCompletionModal(null);}} style={{ padding:'16px', borderRadius:'16px', background:'rgba(239,68,68,0.08)', color:'#EF4444', fontSize:'15px', fontWeight:800, border:'none', cursor:'pointer' }}>✗ 미완료</button>
              <button onClick={()=>{updateStatus(completionModal.id,'completed');setCompletionModal(null);}} style={{ padding:'16px', borderRadius:'16px', background:'linear-gradient(135deg, #34D399, #10B981)', color:'white', fontSize:'15px', fontWeight:800, border:'none', cursor:'pointer' }}>✓ 완료</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
