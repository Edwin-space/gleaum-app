'use client';

import Link from 'next/link';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { GleaumAppIcon } from '@/components/ui/GleaumLogo';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/hooks/useAuth';

interface SettingRowProps {
  icon: string;
  label: string;
  value?: string;
  isToggle?: boolean;
  toggled?: boolean;
  danger?: boolean;
  href?: string;
  onClick?: () => void;
}

function SettingRow({ icon, label, value, isToggle, toggled, danger, href, onClick }: SettingRowProps) {
  const content = (
    <div
      className="flex items-center gap-3 px-4 py-3.5 active:bg-[rgba(0,132,204,0.03)]"
      onClick={onClick}
    >
      <div
        className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
        style={{ background: danger ? 'rgba(239,68,68,0.08)' : 'rgba(0,132,204,0.06)' }}
      >
        <span className="text-base">{icon}</span>
      </div>
      <span
        className="flex-1 text-[15px]"
        style={{
          fontFamily: "'Noto Sans KR',sans-serif",
          color: danger ? '#EF4444' : '#1A1B2E',
        }}
      >
        {label}
      </span>
      {isToggle ? (
        <div
          className="w-11 h-6 rounded-full relative transition-all"
          style={{ background: toggled ? '#0084CC' : '#E5E5EA' }}
        >
          <div
            className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
            style={{ left: toggled ? '22px' : '2px' }}
          />
        </div>
      ) : value ? (
        <span className="text-[13px]" style={{ color: '#8E8E93', fontFamily: "'Noto Sans KR',sans-serif" }}>
          {value}
        </span>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 18L15 12L9 6" stroke="#C7C7CC" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <p
      className="px-4 pt-5 pb-2 text-[11px] font-bold tracking-widest uppercase"
      style={{ color: '#8E8E93', fontFamily: "'Noto Sans KR',sans-serif" }}
    >
      {title}
    </p>
  );
}

export default function MyPage() {
  const { user, loading } = useCurrentUser();
  const { signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: '#FAFAFD' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'rgba(0,132,204,0.2)', borderTopColor: '#0084CC' }} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-28" style={{ background: '#FAFAFD' }}>
      <AppHeader title="마이페이지" showLogo={false} showNotification={false} />

      {/* 프로필 히어로 카드 */}
      <div
        className="mx-4 mt-4 mb-2 rounded-[28px] p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
          boxShadow: '0 12px 40px rgba(0,132,204,0.30)',
        }}
      >
        {/* 장식 원 */}
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '160px', height: '160px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-30px', left: '60px',
          width: '120px', height: '120px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          pointerEvents: 'none',
        }} />

        <div className="flex items-center gap-4 relative z-10">
          {/* 아바타 */}
          <div
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-[36px] flex-shrink-0"
            style={{
              background: 'rgba(255,255,255,0.20)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
          >
            {user?.avatar ?? '👤'}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[20px] font-bold text-white truncate" style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>
              {user?.name ?? '사용자'}
            </p>
            <p className="text-[13px] text-white/70 truncate mt-0.5" style={{ fontFamily: "'Noto Sans KR',sans-serif" }}>
              {user?.email ?? ''}
            </p>
            <span
              className="inline-block mt-2 px-3 py-1 rounded-full text-[11px] font-bold"
              style={{
                background: 'rgba(255,255,255,0.20)',
                color: 'white',
                fontFamily: "'Noto Sans KR',sans-serif",
              }}
            >
              {user?.role === 'parent' ? '👨‍👩‍👧‍👦 부모' : '👶 자녀'}
            </span>
          </div>

          <button
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-[13px] font-semibold"
            style={{
              background: 'rgba(255,255,255,0.20)',
              color: 'white',
              fontFamily: "'Noto Sans KR',sans-serif",
            }}
          >
            수정
          </button>
        </div>
      </div>

      {/* 알림 설정 */}
      <div className="mx-4 mt-3 bg-white rounded-[20px] overflow-hidden divide-y divide-[rgba(0,132,204,0.06)]"
        style={{ boxShadow: '0 4px 20px rgba(0,132,204,0.05)' }}>
        <SectionHeader title="알림 설정" />
        <SettingRow icon="📅" label="공유일정 알림" isToggle toggled={true} />
        <SettingRow icon="👤" label="개인일정 알림" isToggle toggled={true} />
        <SettingRow icon="👦" label="자녀일정 알림" isToggle toggled={true} />
        <SettingRow icon="🔔" label="미완료 재알림" isToggle toggled={true} />
        <SettingRow icon="💰" label="정기지출 결제 알림" isToggle toggled={true} />
        <SettingRow icon="🌙" label="방해금지 시간" value="오후 10시 ~ 오전 8시" />
      </div>

      {/* 연동 서비스 */}
      <div className="mx-4 mt-3 bg-white rounded-[20px] overflow-hidden divide-y divide-[rgba(0,132,204,0.06)]"
        style={{ boxShadow: '0 4px 20px rgba(0,132,204,0.05)' }}>
        <SectionHeader title="연동 서비스" />
        <SettingRow icon="📆" label="구글 캘린더 연동" value="연동됨" href="/settings/calendar" />
        <SettingRow icon="💾" label="구글 드라이브 연동" value="연동됨" />
        <SettingRow icon="👨‍👩‍👧‍👦" label="우리 가족 관리" href="/family" />
      </div>

      {/* 앱 정보 */}
      <div className="mx-4 mt-3 bg-white rounded-[20px] overflow-hidden divide-y divide-[rgba(0,132,204,0.06)]"
        style={{ boxShadow: '0 4px 20px rgba(0,132,204,0.05)' }}>
        <SectionHeader title="앱 정보" />
        <SettingRow icon="📋" label="개인정보 처리방침" />
        <SettingRow icon="📄" label="이용약관" />
        <SettingRow icon="ℹ️" label="버전 정보" value="v1.0.0" />
      </div>

      {/* 계정 */}
      <div className="mx-4 mt-3 bg-white rounded-[20px] overflow-hidden divide-y divide-[rgba(0,132,204,0.06)]"
        style={{ boxShadow: '0 4px 20px rgba(0,132,204,0.05)' }}>
        <SectionHeader title="계정" />
        <SettingRow icon="🚪" label="로그아웃" danger onClick={signOut} />
      </div>

      <p
        className="text-center mt-4 mb-2 text-[12px] underline"
        style={{ color: '#C7C7CC', fontFamily: "'Noto Sans KR',sans-serif" }}
      >
        회원탈퇴
      </p>

      <div className="flex justify-center py-4 opacity-20">
        <GleaumAppIcon size={28} />
      </div>

      <BottomNav />
    </div>
  );
}
