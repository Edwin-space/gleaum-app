'use client';

import Link from 'next/link';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { GleaumAppIcon } from '@/components/ui/GleaumLogo';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/hooks/useAuth';

interface SettingRowProps {
  icon: React.ReactNode;
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
      className="flex items-center gap-3 px-4 py-3.5 active:bg-[rgba(0,132,204,0.03)] transition-colors"
      onClick={onClick}
    >
      <div
        className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0"
        style={{ background: danger ? 'rgba(239,68,68,0.08)' : 'rgba(0,132,204,0.08)' }}
      >
        {icon}
      </div>
      <span
        className="flex-1 text-[15px] font-medium"
        style={{ color: danger ? '#EF4444' : 'var(--color-ink)' }}
      >
        {label}
      </span>
      {isToggle ? (
        <div
          className="w-11 h-6 rounded-full relative transition-all"
          style={{ background: toggled ? 'var(--brand-blue)' : '#E5E5EA' }}
        >
          <div
            className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
            style={{ left: toggled ? '22px' : '2px' }}
          />
        </div>
      ) : value ? (
        <span className="text-[13px] font-medium" style={{ color: 'var(--color-ink-muted-80)' }}>
          {value}
        </span>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 18L15 12L9 6" stroke="#C7C7CC" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="px-4 pt-5 pb-2 text-[11px] font-bold tracking-widest uppercase"
      style={{ color: 'var(--color-ink-muted-80)' }}>
      {title}
    </p>
  );
}

// SVG 아이콘 헬퍼
const Icon = ({ d, fill }: { d: string; fill?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export default function MyPage() {
  const { user, loading } = useCurrentUser();
  const { signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'rgba(0,132,204,0.2)', borderTopColor: 'var(--brand-blue)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-28">
      <AppHeader title="마이페이지" showLogo={false} showNotification={false} />

      {/* 프로필 히어로 카드 */}
      <div
        className="mx-4 mt-4 mb-4 rounded-[28px] p-6 relative overflow-hidden"
        style={{
          background: 'var(--brand-gradient)',
          boxShadow: '0 12px 40px rgba(0,132,204,0.30)',
        }}
      >
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '160px', height: '160px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-30px', left: '60px',
          width: '120px', height: '120px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
        }} />

        <div className="flex items-center gap-4 relative z-10">
          <div
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-[36px] flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.20)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
          >
            {user?.avatar ?? '👤'}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[20px] font-bold text-white truncate">{user?.name ?? '사용자'}</p>
            <p className="text-[13px] text-white/70 truncate mt-0.5">{user?.email ?? ''}</p>
            <span
              className="inline-block mt-2 px-3 py-1 rounded-full text-[11px] font-bold"
              style={{ background: 'rgba(255,255,255,0.20)', color: 'white' }}
            >
              {user?.role === 'parent' ? '부모' : '자녀'}
            </span>
          </div>

          <button
            className="flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold"
            style={{ background: 'rgba(255,255,255,0.20)', color: 'white' }}
          >
            수정
          </button>
        </div>
      </div>

      {/* 알림 설정 */}
      <div className="glass-card mx-4 mt-3 rounded-[20px] overflow-hidden divide-y divide-[rgba(0,132,204,0.06)]">
        <SectionHeader title="알림 설정" />
        <SettingRow icon={<Icon d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18" />} label="공유일정 알림" isToggle toggled={true} />
        <SettingRow icon={<Icon d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />} label="개인일정 알림" isToggle toggled={true} />
        <SettingRow icon={<Icon d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z M12 14c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4z" />} label="자녀일정 알림" isToggle toggled={true} />
        <SettingRow icon={<Icon d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0" />} label="미완료 재알림" isToggle toggled={true} />
        <SettingRow icon={<Icon d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M1 10h22" />} label="정기지출 결제 알림" isToggle toggled={true} />
        <SettingRow icon={<Icon d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />} label="방해금지 시간" value="오후 10시 ~ 오전 8시" />
      </div>

      {/* 연동 서비스 */}
      <div className="glass-card mx-4 mt-3 rounded-[20px] overflow-hidden divide-y divide-[rgba(0,132,204,0.06)]">
        <SectionHeader title="연동 서비스" />
        <SettingRow icon={<Icon d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18" />} label="구글 캘린더 연동" value="연동됨" href="/settings/calendar" />
        <SettingRow icon={<Icon d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />} label="구글 드라이브 연동" value="연동됨" />
        <SettingRow icon={<Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" />} label="나의 그룹 관리" href="/family" />
      </div>

      {/* 앱 정보 */}
      <div className="glass-card mx-4 mt-3 rounded-[20px] overflow-hidden divide-y divide-[rgba(0,132,204,0.06)]">
        <SectionHeader title="앱 정보" />
        <SettingRow icon={<Icon d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />} label="개인정보 처리방침" />
        <SettingRow icon={<Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" />} label="이용약관" />
        <SettingRow icon={<Icon d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z M12 16v-4 M12 8h.01" />} label="버전 정보" value="v1.0.0" />
      </div>

      {/* 계정 */}
      <div className="glass-card mx-4 mt-3 rounded-[20px] overflow-hidden divide-y divide-[rgba(239,68,68,0.06)]">
        <SectionHeader title="계정" />
        <SettingRow
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>}
          label="로그아웃"
          danger
          onClick={signOut}
        />
      </div>

      <p className="text-center mt-4 mb-2 text-[12px] underline" style={{ color: '#C7C7CC' }}>
        회원탈퇴
      </p>

      <div className="flex justify-center py-4 opacity-20">
        <GleaumAppIcon size={28} />
      </div>

      <BottomNav />
    </div>
  );
}
