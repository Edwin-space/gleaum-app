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
      className="flex items-center gap-3 px-4 py-3.5 active:bg-gray-50"
      onClick={onClick}
    >
      <span className="text-lg w-7 text-center flex-shrink-0">{icon}</span>
      <span
        className="flex-1 text-[15px]"
        style={{
          fontFamily: "'Noto Sans KR',sans-serif",
          color: danger ? '#EF4444' : 'var(--color-ink)',
        }}
      >
        {label}
      </span>
      {isToggle ? (
        <div
          className="w-11 h-6 rounded-full relative transition-all"
          style={{ background: toggled ? 'var(--color-primary)' : 'var(--color-hairline)' }}
        >
          <div
            className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
            style={{ left: toggled ? '22px' : '2px' }}
          />
        </div>
      ) : value ? (
        <span className="text-[13px]" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
          {value}
        </span>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 18L15 12L9 6" stroke="var(--color-ink-muted-48)" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function SectionTitle({ title }: { title: string }) {
  return (
    <p
      className="px-4 pt-5 pb-1 text-[12px] font-semibold"
      style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif", letterSpacing: '0.05em' }}
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
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-24">
      <AppHeader title="마이페이지" showLogo={false} showNotification={false} />

      {/* 프로필 카드 */}
      <div className="mx-4 my-4 bg-white rounded-3xl p-5" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
            style={{ background: 'var(--brand-gradient)' }}
          >
            {user?.avatar ?? '👤'}
          </div>
          <div className="flex-1">
            <p className="text-[18px] font-bold" style={{ color: 'var(--color-ink)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              {user?.name ?? '사용자'}
            </p>
            <p className="text-[13px]" style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}>
              {user?.email ?? ''}
            </p>
            <span
              className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ background: 'rgba(0,132,204,0.1)', color: 'var(--color-primary)', fontFamily: "'Noto Sans KR',sans-serif" }}
            >
              {user?.role === 'parent' ? '부모' : '자녀'}
            </span>
          </div>
          <button
            className="px-3 py-1.5 rounded-full text-[13px] font-medium"
            style={{ border: '1px solid var(--color-hairline)', color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}
          >
            수정
          </button>
        </div>
      </div>

      {/* 설정 목록 */}
      <div className="mx-4 bg-white rounded-2xl overflow-hidden divide-y divide-[var(--color-hairline)]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <SectionTitle title="알림 설정" />
        <SettingRow icon="📅" label="공유일정 알림" isToggle toggled={true} />
        <SettingRow icon="👤" label="개인일정 알림" isToggle toggled={true} />
        <SettingRow icon="👦" label="자녀일정 알림" isToggle toggled={true} />
        <SettingRow icon="🔔" label="미완료 재알림" isToggle toggled={true} />
        <SettingRow icon="💰" label="정기지출 결제 알림" isToggle toggled={true} />
        <SettingRow icon="🌙" label="방해금지 시간" value="오후 10:00 ~ 오전 8:00" />
      </div>

      <div className="mx-4 mt-3 bg-white rounded-2xl overflow-hidden divide-y" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <SectionTitle title="연동 서비스" />
        <SettingRow icon="📆" label="구글 캘린더 연동" value="연동됨" href="/settings/calendar" />
        <SettingRow icon="💾" label="구글 드라이브 연동" value="연동됨" />
        <SettingRow icon="👨‍👩‍👧‍👦" label="우리 가족 관리" href="/family" />
      </div>

      <div className="mx-4 mt-3 bg-white rounded-2xl overflow-hidden divide-y" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <SectionTitle title="앱 정보" />
        <SettingRow icon="📋" label="개인정보 처리방침" />
        <SettingRow icon="📄" label="이용약관" />
        <SettingRow icon="ℹ️" label="버전 정보" value="v1.0.0" />
      </div>

      <div className="mx-4 mt-3 bg-white rounded-2xl overflow-hidden divide-y" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <SectionTitle title="계정" />
        <SettingRow icon="🚪" label="로그아웃" danger onClick={signOut} />
      </div>

      <p
        className="text-center mt-4 mb-2 text-[11px]"
        style={{ color: 'var(--color-ink-muted-48)', fontFamily: "'Noto Sans KR',sans-serif" }}
      >
        회원탈퇴
      </p>

      {/* 하단 로고 */}
      <div className="flex justify-center py-4 opacity-30">
        <GleaumAppIcon size={28} />
      </div>

      <BottomNav />
    </div>
  );
}
