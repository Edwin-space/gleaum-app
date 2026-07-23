'use client';

import React from 'react';
import Link from 'next/link';
import { GleaumBI, GleaumLogoImg } from '@/components/ui/GleaumLogo';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ThemeModeSelector } from '@/components/ui/ThemeModeSelector';
import { useAccountSession } from '@/components/AccountSessionProvider';
import type { NotificationSettings } from '@/types';

// ── 아이콘 헬퍼 ──
const Icon = ({ d, stroke, size = 18 }: { d: string; stroke?: string; size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={stroke ?? 'currentColor'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

// ── 설정 행 컴포넌트 ──
interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  value?: string;
  isToggle?: boolean;
  toggled?: boolean;
  onToggle?: () => void;
  danger?: boolean;
  href?: string;
  onClick?: () => void;
}

function SettingRow({ icon, label, description, value, isToggle, toggled, onToggle, danger, href, onClick }: SettingRowProps) {
  const content = (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '18px 24px', cursor: 'pointer', transition: 'background 0.15s',
      }}
      onClick={isToggle ? onToggle : onClick}
    >
      <div style={{
        width: '44px', height: '44px', borderRadius: '15px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        background: danger ? 'rgba(239,68,68,0.08)' : 'rgba(0,132,204,0.07)',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{ fontSize: '15px', fontWeight: 800, color: danger ? '#EF4444' : 'var(--theme-text)', margin: '0 0 2px' }}>{label}</h4>
        {description && <p style={{ fontSize: '12px', color: 'var(--theme-text-subtle)', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>{description}</p>}
      </div>
      {isToggle ? (
        <div style={{ width: '50px', height: '28px', borderRadius: '999px', position: 'relative', background: toggled ? '#0084CC' : '#E5E5EA', transition: 'background 0.3s', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: '3px', width: '22px', height: '22px', background: 'var(--theme-surface)', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.3s', left: toggled ? '25px' : '3px' }} />
        </div>
      ) : value ? (
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--theme-text-subtle)', background: 'var(--theme-surface-muted)', padding: '5px 12px', borderRadius: '999px', flexShrink: 0 }}>{value}</span>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <path d="M9 18L15 12L9 6" stroke="#D0D0D0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  );

  return href ? <Link href={href} style={{ display: 'block', textDecoration: 'none' }}>{content}</Link> : content;
}

interface DesktopMyPageProps {
  user: { name?: string; email?: string; avatar?: string } | null;
  insights: { memberCount?: number; totalExpense?: number; upcomingCount?: number } | null;
  notifSettings: NotificationSettings;
  handleToggle: (key: keyof NotificationSettings) => void;
  signOut: () => void;
  setShowEditModal: (v: boolean) => void;
  setShowPasswordModal: (v: boolean) => void;
  setShowDeleteModal: (v: boolean) => void;
}

export function DesktopMyPage({
  user,
  insights,
  notifSettings,
  handleToggle,
  signOut,
  setShowEditModal,
  setShowPasswordModal,
  setShowDeleteModal,
}: DesktopMyPageProps) {
  const { capabilities } = useAccountSession();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

      {/* ── 페이지 헤더 ── */}
      <div style={{
        position: 'relative',
        padding: '36px 44px',
        borderRadius: '28px',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
        color: 'white',
        marginBottom: '28px',
        boxShadow: '0 14px 44px rgba(26,27,46,0.2)',
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(46,232,149,0.12)', filter: 'blur(60px)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20px', left: '40%', width: '150px', height: '150px', background: 'rgba(12,201,181,0.1)', filter: 'blur(48px)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.5px', margin: '0 0 6px' }}>설정 및 프로필</h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, margin: 0 }}>
              계정 정보와 알림 설정을 관리하세요
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', borderRadius: '14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
            <GleaumLogoImg size={22} />
            <GleaumBI variant="white" width={72} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', alignItems: 'start' }}>

        {/* ── 왼쪽: 프로필 카드 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* 프로필 다크 카드 */}
          <div style={{
            borderRadius: '28px', padding: '32px', color: 'white',
            background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 12px 36px rgba(26,27,46,0.25)',
          }}>
            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: 'rgba(0,132,204,0.2)', filter: 'blur(35px)', borderRadius: '50%', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ position: 'relative', marginBottom: '20px' }}>
                  <UserAvatar
                    avatar={user?.avatar}
                    name={user?.name}
                    size={96}
                    radius={32}
                    fontSize={48}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(12px)',
                      border: '1.5px solid rgba(255,255,255,0.15)',
                    }}
                  />
                  <button
                    onClick={() => setShowEditModal(true)}
                    style={{
                      position: 'absolute', bottom: '-6px', right: '-6px',
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'var(--theme-surface)', color: 'var(--theme-text)', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'transform 0.2s',
                    }}
                  >
                    <Icon d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" size={13} />
                  </button>
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 4px' }}>{user?.name ?? '사용자'}</h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontWeight: 600, margin: 0 }}>{user?.email}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: capabilities.canViewHouseholdBudget ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: '10px', marginTop: '24px' }}>
                {[
                  { label: '멤버', value: insights?.memberCount ?? 0 },
                  ...(capabilities.canViewHouseholdBudget
                    ? [{ label: '지출', value: (insights?.totalExpense ?? 0).toLocaleString() }]
                    : []),
                  { label: '일정', value: insights?.upcomingCount ?? 0 },
                ].map(item => (
                  <div key={item.label} style={{
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '18px', padding: '14px 10px', textAlign: 'center',
                    backdropFilter: 'blur(8px)',
                  }}>
                    <p style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>{item.label}</p>
                    <p style={{ fontSize: '18px', fontWeight: 900, margin: 0, lineHeight: 1 }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Android 전체 메뉴와 동일한 핵심 빠른 동작 */}
          <div style={{
            background: 'var(--theme-surface)', borderRadius: '24px', padding: '22px',
            boxShadow: 'var(--theme-shadow-card)', border: '1px solid var(--theme-border)',
          }}>
            <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--theme-text)', margin: '0 0 14px' }}>빠른 실행</p>
            <div style={{ display: 'grid', gap: '10px' }}>
              {[
                { href: '/schedules/new', label: '일정 추가' },
                { href: '/space', label: '공간 관리' },
                ...(capabilities.canViewHouseholdBudget ? [{ href: '/budget', label: '가계부' }] : []),
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    minHeight: '44px', borderRadius: '999px', padding: '0 18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'var(--theme-surface-muted)', color: 'var(--theme-text)',
                    textDecoration: 'none', fontSize: '14px', fontWeight: 800,
                  }}
                >
                  <span>{item.label}</span>
                  <span aria-hidden="true" style={{ color: 'var(--color-primary)' }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── 오른쪽: 설정 섹션 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* 앱 설정 */}
          <div style={{ background: 'var(--theme-surface)', borderRadius: '24px', overflow: 'hidden', boxShadow: 'var(--theme-shadow-card)', border: '1px solid var(--theme-border)' }}>
            <div style={{ padding: '18px 24px', background: 'var(--theme-surface-muted)', borderBottom: '1px solid var(--theme-border)' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>앱 설정</p>
            </div>
            <div style={{ padding: '18px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '15px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: 'rgba(0,132,204,0.07)',
                }}>
                  <Icon d="M12 3v2 M12 19v2 M5.64 5.64l1.41 1.41 M16.95 16.95l1.41 1.41 M3 12h2 M19 12h2 M5.64 18.36l1.41-1.41 M16.95 7.05l1.41-1.41 M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" stroke="#0084CC" />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--theme-text)', margin: '0 0 2px' }}>화면 모드</h4>
                  <p style={{ fontSize: '12px', color: 'var(--theme-text-subtle)', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
                    PC·모바일 웹·앱 화면을 같은 기준으로 표시합니다.
                  </p>
                </div>
              </div>
              <ThemeModeSelector />
            </div>
            <div style={{ height: '1px', background: 'var(--theme-border)', margin: '0 24px' }} />
            <SettingRow
              icon={<Icon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" stroke="#0084CC" />}
              label="홈 레이아웃"
              description="홈 화면의 구성과 우선 표시 항목을 선택합니다."
              href="/settings/home-layout"
            />
          </div>

          {/* 계정 및 보안 */}
          <div style={{ background: 'var(--theme-surface)', borderRadius: '24px', overflow: 'hidden', boxShadow: 'var(--theme-shadow-card)', border: '1px solid var(--theme-border)' }}>
            <div style={{ padding: '18px 24px', background: 'var(--theme-surface-muted)', borderBottom: '1px solid var(--theme-border)' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>계정 및 보안</p>
            </div>
            <div>
              <SettingRow
                icon={<Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#0084CC" />}
                label="비밀번호 재설정"
                description="이메일 로그인을 위한 보안 비밀번호를 설정하거나 변경합니다."
                onClick={() => setShowPasswordModal(true)}
              />
              <div style={{ height: '1px', background: 'var(--theme-surface-muted)', margin: '0 24px' }} />
              <SettingRow
                icon={<Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="#0084CC" />}
                label="공간(Space) 관리"
                description="연인, 친구와의 공간을 관리하고 새로운 멤버를 초대합니다."
                href="/space"
              />
            </div>
          </div>

          {/* 알림 설정 */}
          <div style={{ background: 'var(--theme-surface)', borderRadius: '24px', overflow: 'hidden', boxShadow: 'var(--theme-shadow-card)', border: '1px solid var(--theme-border)' }}>
            <div style={{ padding: '18px 24px', background: 'var(--theme-surface-muted)', borderBottom: '1px solid var(--theme-border)' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>서비스 연동 및 알림</p>
            </div>
            <SettingRow
              icon={<Icon d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0" stroke="#0084CC" />}
              label="알림 목록"
              description="받은 알림과 확인하지 않은 소식을 확인합니다."
              href="/notifications"
            />
            <div style={{ height: '1px', background: 'var(--theme-surface-muted)', margin: '0 24px' }} />
            <SettingRow
              icon={<Icon d="M12 6v6l4 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" stroke="#0084CC" />}
              label="일정 리마인더"
              description="일정 시작 전에 알림을 받습니다."
              isToggle
              toggled={notifSettings.scheduleReminders}
              onToggle={() => handleToggle('scheduleReminders')}
            />
            {capabilities.canViewHouseholdBudget && (
              <>
                <div style={{ height: '1px', background: 'var(--theme-surface-muted)', margin: '0 24px' }} />
                <SettingRow
                  icon={<Icon d="M2 5h20v14H2z M2 10h20" stroke="#0084CC" />}
                  label="가계부 결제 알림"
                  description="정기 지출 결제일 전에 알림을 받습니다."
                  isToggle
                  toggled={notifSettings.expenseReminders}
                  onToggle={() => handleToggle('expenseReminders')}
                />
              </>
            )}
          </div>

          <div style={{ background: 'var(--theme-surface)', borderRadius: '24px', overflow: 'hidden', boxShadow: 'var(--theme-shadow-card)', border: '1px solid var(--theme-border)' }}>
            <div style={{ padding: '18px 24px', background: 'var(--theme-surface-muted)', borderBottom: '1px solid var(--theme-border)' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>서비스</p>
            </div>
            <SettingRow
              icon={<Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" stroke="#0084CC" />}
              label="이용약관"
              description="글리움 서비스 이용 기준을 확인합니다."
              href="/legal/terms"
            />
            <div style={{ height: '1px', background: 'var(--theme-surface-muted)', margin: '0 24px' }} />
            <SettingRow
              icon={<Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#0084CC" />}
              label="개인정보처리방침"
              description="개인정보 수집·이용 및 보호 기준을 확인합니다."
              href="/legal/privacy"
            />
          </div>

          {/* 계정 액션 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{ fontSize: '13px', fontWeight: 700, color: 'var(--theme-text-subtle)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
            >
              회원탈퇴
            </button>
            <button
              onClick={signOut}
              style={{
                padding: '12px 28px', borderRadius: '16px',
                background: 'rgba(239,68,68,0.07)', color: '#EF4444',
                fontSize: '14px', fontWeight: 800, border: '1px solid rgba(239,68,68,0.12)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
