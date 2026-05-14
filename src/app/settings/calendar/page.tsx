'use client';

import { AppHeader } from '@/components/layout/AppHeader';

export default function CalendarSyncPage() {
  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-canvas-parchment)' }}>
      <AppHeader title="기기 캘린더 연동" showLogo={false} showBack showNotification={false} />

      <div className="px-4 pt-6 space-y-4">

        {/* 안내 카드 */}
        <div className="bg-white rounded-3xl p-6" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
          <div className="flex flex-col items-center text-center gap-3 mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0084CC 0%, #0CC9B5 100%)' }}
            >
              <span style={{ fontSize: 32 }}>📅</span>
            </div>
            <div>
              <p className="text-[17px] font-semibold" style={{ color: 'var(--color-ink)' }}>
                기기 캘린더 연동
              </p>
              <p className="text-[13px] mt-1" style={{ color: 'var(--color-ink-muted-48)' }}>
                스마트폰에 저장된 일정과 글리움을 연결합니다
              </p>
            </div>
          </div>

          {/* 혜택 목록 */}
          {[
            { icon: '📲', text: '기기 캘린더 앱의 일정을 글리움에서 확인' },
            { icon: '✍️', text: '글리움 일정이 기기 캘린더에 자동 저장' },
            { icon: '🔒', text: '외부 서버 전송 없이 기기 내에서만 처리' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3 py-3 border-t" style={{ borderColor: 'var(--color-hairline)' }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span className="text-[14px]" style={{ color: 'var(--color-ink)' }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* 준비 중 안내 */}
        <div
          className="rounded-3xl p-5 flex items-start gap-3"
          style={{ background: 'rgba(0,132,204,0.07)', border: '1px solid rgba(0,132,204,0.15)' }}
        >
          <span style={{ fontSize: 20 }}>🛠️</span>
          <div>
            <p className="text-[14px] font-semibold mb-1" style={{ color: '#0084CC' }}>
              업데이트 준비 중
            </p>
            <p className="text-[13px]" style={{ color: 'var(--color-ink-muted-48)' }}>
              기기 캘린더 연동 기능은 곧 업데이트될 예정입니다.
              현재는 글리움 앱 내에서 일정을 직접 등록하고 관리할 수 있습니다.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
