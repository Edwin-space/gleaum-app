'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { sampleFamily } from '@/lib/sampleData';

export default function FamilyPage() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`https://gleaum.com/invite/${sampleFamily.inviteCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-dvh pb-24">
      <AppHeader
        title="우리 가족"
        showLogo={false}
        showBack
        showNotification={false}
        rightAction={
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold text-white"
            style={{ background: 'var(--brand-gradient)' }}
          >
            <span>+</span>
            <span style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>초대하기</span>
          </button>
        }
      />

      <div className="px-4 pt-4">
        {/* 가족 그룹 헤더 */}
        <div
          className="rounded-3xl p-5 mb-4 relative overflow-hidden"
          style={{ background: 'var(--brand-black)' }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(46,232,149,0.15) 0%, transparent 70%)' }}
          />
          <div className="relative z-10">
            <p className="text-[12px] font-medium mb-1" style={{ color: 'var(--brand-teal)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Family Group
            </p>
            <p className="text-[22px] font-bold text-white mb-1" style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>
              {sampleFamily.name}
            </p>
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              구성원 {sampleFamily.members.length}명
            </p>
          </div>
        </div>

        {/* 구성원 목록 */}
        <h2 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
          구성원
        </h2>
        <div className="space-y-2 mb-6">
          {sampleFamily.members.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-2xl flex items-center gap-4 px-4 py-3.5"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            >
              {/* 아바타 */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: member.role === 'parent' ? 'rgba(0,132,204,0.1)' : 'rgba(46,232,149,0.12)' }}
              >
                {member.avatar}
              </div>
              {/* 정보 */}
              <div className="flex-1">
                <p className="text-[16px] font-semibold" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
                  {member.name}
                </p>
                {member.email && (
                  <p className="text-[12px]" style={{ color: 'var(--color-ink-muted-48)' }}>
                    {member.email}
                  </p>
                )}
              </div>
              {/* 역할 배지 */}
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0"
                style={{
                  background: member.role === 'parent' ? 'rgba(0,132,204,0.1)' : 'rgba(46,232,149,0.12)',
                  color:      member.role === 'parent' ? 'var(--color-primary)' : '#0A9E5C',
                  fontFamily: "'Noto Sans KR',sans-serif",
                }}
              >
                {member.role === 'parent' ? '부모' : '자녀'}
              </span>
            </div>
          ))}
        </div>

        {/* 초대 대기중 */}
        <div
          className="rounded-2xl px-4 py-3.5 flex items-center justify-between"
          style={{ background: 'white', border: '1px dashed var(--color-hairline)' }}
        >
          <div>
            <p className="text-[14px] font-semibold" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              초대 대기중
            </p>
            <p className="text-[12px]" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              아직 수락하지 않은 초대가 없습니다
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-3 py-1.5 rounded-full text-[12px] font-semibold"
            style={{ background: 'var(--color-primary)', color: 'white', fontFamily: "'Noto Sans KR',sans-serif" }}
          >
            초대하기
          </button>
        </div>
      </div>

      {/* 초대 모달 */}
      {showInviteModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowInviteModal(false)}
        >
          <div
            className="w-full max-w-[430px] bg-white rounded-t-3xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <p className="text-[20px] font-bold text-center mb-1" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              글리움에 가족을 초대하세요
            </p>
            <p className="text-[13px] text-center mb-6" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              초대 링크를 공유해 가족을 그룹에 추가하세요
            </p>

            {/* 초대 코드 */}
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-4"
              style={{ background: 'var(--color-canvas-parchment)', border: '1px solid var(--color-hairline)' }}
            >
              <span className="text-[13px] font-mono flex-1" style={{ color: 'var(--color-ink)' }}>
                gleaum.com/invite/{sampleFamily.inviteCode}
              </span>
              <button
                onClick={copyInviteLink}
                className="px-3 py-1.5 rounded-full text-[12px] font-semibold text-white transition-all"
                style={{ background: copied ? 'var(--color-schedule-child)' : 'var(--color-primary)', fontFamily: "'Noto Sans KR',sans-serif" }}
              >
                {copied ? '✓ 복사됨' : '복사'}
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <button
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[15px] font-semibold transition-all active:scale-95"
                style={{ background: '#FEE500', color: '#1A1A1A', fontFamily: "'Noto Sans KR',sans-serif" }}
              >
                <span>💬</span> 카카오톡으로 초대
              </button>
              <button
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[15px] font-semibold transition-all active:scale-95"
                style={{ background: 'var(--color-canvas-parchment)', color: 'var(--color-ink)', border: '1px solid var(--color-hairline)', fontFamily: "'Noto Sans KR',sans-serif" }}
              >
                <span>◻️</span> QR 코드 보기
              </button>
            </div>

            <button
              onClick={() => setShowInviteModal(false)}
              className="w-full py-3 rounded-2xl text-[14px] font-medium"
              style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
