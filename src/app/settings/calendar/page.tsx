'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { GleaumAppIcon } from '@/components/ui/GleaumLogo';
import { useAuth } from '@/hooks/useAuth';

export default function CalendarSyncPage() {
  const { user } = useAuth();
  const [syncToGoogle,   setSyncToGoogle]   = useState(true);
  const [syncFromGoogle, setSyncFromGoogle] = useState(true);
  const [isSyncing,      setIsSyncing]      = useState(false);
  const [lastSynced,     setLastSynced]     = useState<Date | null>(new Date(Date.now() - 1000 * 60 * 30));
  const [isConnected,    setIsConnected]    = useState(!!user);

  const handleSync = async () => {
    setIsSyncing(true);
    // TODO: Google Calendar API 실제 동기화
    await new Promise((r) => setTimeout(r, 1500));
    setLastSynced(new Date());
    setIsSyncing(false);
  };

  const handleDisconnect = () => {
    if (confirm('구글 캘린더 연동을 해제할까요?')) {
      setIsConnected(false);
    }
  };

  const formatSyncTime = (date: Date) =>
    date.toLocaleString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-canvas-parchment)' }}>
      <AppHeader title="구글 캘린더 연동" showLogo={false} showBack showNotification={false} />

      <div className="px-4 pt-6 space-y-4">

        {/* 연동 상태 카드 */}
        <div className="bg-white rounded-3xl p-6" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
          {/* 로고 연결 표시 */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <GleaumAppIcon size={56} />
            <div className="flex items-center gap-1">
              {[0,1,2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: isConnected ? 'var(--brand-green)' : 'var(--color-hairline)',
                    opacity: isConnected ? (i === 1 ? 0.5 : 1) : 1,
                  }}
                />
              ))}
            </div>
            {/* Google Calendar 아이콘 */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'white', border: '1px solid var(--color-hairline)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="4" width="20" height="18" rx="2" fill="white" stroke="#E0E0E0" strokeWidth="1.5"/>
                <path d="M2 9H22" stroke="#E0E0E0" strokeWidth="1.5"/>
                <path d="M8 2V6M16 2V6" stroke="#9E9E9E" strokeWidth="1.5" strokeLinecap="round"/>
                <text x="12" y="18" textAnchor="middle" fontSize="7" fontWeight="600" fill="#4285F4">CAL</text>
              </svg>
            </div>
          </div>

          {isConnected ? (
            <>
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-2"
                  style={{ background: 'rgba(46,232,149,0.12)' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--brand-green)' }} />
                  <span className="text-[12px] font-semibold" style={{ color: '#0A9E5C', fontFamily: "'Noto Sans KR',sans-serif" }}>
                    연동됨
                  </span>
                </div>
                <p className="text-[14px]" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                  {user?.email ?? 'google@gmail.com'}
                </p>
                {lastSynced && (
                  <p className="text-[12px] mt-1" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                    마지막 동기화: {formatSyncTime(lastSynced)}
                  </p>
                )}
              </div>

              {/* 동기화 방향 설정 */}
              <div className="space-y-1 mb-4">
                <div className="flex items-center justify-between py-3 px-1 border-t" style={{ borderColor: 'var(--color-hairline)' }}>
                  <span className="text-[14px]" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                    글리움 → 구글 캘린더
                  </span>
                  <button
                    onClick={() => setSyncToGoogle(!syncToGoogle)}
                    className="w-11 h-6 rounded-full relative transition-all"
                    style={{ background: syncToGoogle ? 'var(--color-primary)' : 'var(--color-hairline)' }}
                  >
                    <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                      style={{ left: syncToGoogle ? '22px' : '2px' }} />
                  </button>
                </div>
                <div className="flex items-center justify-between py-3 px-1 border-t" style={{ borderColor: 'var(--color-hairline)' }}>
                  <span className="text-[14px]" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                    구글 캘린더 → 글리움
                  </span>
                  <button
                    onClick={() => setSyncFromGoogle(!syncFromGoogle)}
                    className="w-11 h-6 rounded-full relative transition-all"
                    style={{ background: syncFromGoogle ? 'var(--color-primary)' : 'var(--color-hairline)' }}
                  >
                    <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                      style={{ left: syncFromGoogle ? '22px' : '2px' }} />
                  </button>
                </div>
              </div>

              {/* 지금 동기화 */}
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-white mb-3 active:scale-[0.98] transition-all disabled:opacity-60"
                style={{ background: 'var(--color-primary)', fontFamily: "'Noto Sans KR',sans-serif" }}
              >
                {isSyncing ? '동기화 중...' : '🔄 지금 동기화'}
              </button>
              <button
                onClick={handleDisconnect}
                className="w-full py-3 rounded-2xl text-[14px] font-medium active:scale-[0.98] transition-all"
                style={{ color: '#EF4444', background: 'rgba(239,68,68,0.06)', fontFamily: "'Noto Sans KR',sans-serif" }}
              >
                연동 해제
              </button>
            </>
          ) : (
            <>
              <p className="text-[16px] font-semibold text-center mb-2" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                구글 캘린더와 연동하면
              </p>
              <p className="text-[14px] text-center mb-6" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                모든 일정이 자동으로 동기화됩니다
              </p>

              {/* 혜택 */}
              {[
                '글리움 일정이 구글 캘린더에 자동 반영',
                '구글 캘린더 일정을 글리움에서 확인',
                '모든 기기에서 실시간 동기화',
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 py-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-schedule-child)' }}>
                    <span className="text-[10px] font-bold text-black">✓</span>
                  </div>
                  <span className="text-[14px]" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                    {benefit}
                  </span>
                </div>
              ))}

              <button
                onClick={() => setIsConnected(true)}
                className="w-full flex items-center justify-center gap-3 mt-6 py-4 rounded-2xl text-[15px] font-semibold active:scale-[0.98] transition-transform"
                style={{ background: 'white', color: '#1A1A1A', border: '1px solid var(--color-hairline)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', fontFamily: "'Noto Sans KR',sans-serif" }}
              >
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                구글 계정으로 연동하기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
