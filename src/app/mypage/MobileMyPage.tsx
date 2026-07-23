'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { GleaumBI } from '@/components/ui/GleaumLogo';
import { getAppVersionInfo, isNativeApp } from '@/lib/native';
import { ThemeModeSelector } from '@/components/ui/ThemeModeSelector';
import { useAccountSession } from '@/components/AccountSessionProvider';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { NotificationSettings } from '@/types';

// ── 최신 앱 버전 (새 버전 출시 시 이 값만 업데이트) ──
// Vercel 환경변수 NEXT_PUBLIC_APP_LATEST_VERSION 이 있으면 그것을 우선 사용
const LATEST_VERSION = process.env.NEXT_PUBLIC_APP_LATEST_VERSION ?? '1.0.2';

const STORE_URL = {
  android: 'https://play.google.com/store/apps/details?id=com.gleaum.app',
  ios:     null as string | null, // App Store 등록 후 URL 교체
};

/** semver 간단 비교: a < b 이면 true */
function isOutdated(installed: string, latest: string): boolean {
  const toNum = (v: string) => v.split('.').map(Number);
  const [a, b] = [toNum(installed), toNum(latest)];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const ai = a[i] ?? 0, bi = b[i] ?? 0;
    if (ai < bi) return true;
    if (ai > bi) return false;
  }
  return false;
}

interface MobileMyPageProps {
  user: { name?: string; email?: string; avatar?: string } | null;
  insights: { memberCount?: number; totalExpense?: number; upcomingCount?: number; spaceCount?: number } | null;
  notifSettings: NotificationSettings;
  handleToggle: (key: keyof NotificationSettings) => void;
  signOut: () => void;
  setShowEditModal: (v: boolean) => void;
  setShowAvatarEditor?: (v: boolean) => void;
  setShowPasswordModal: (v: boolean) => void;
  setShowDeleteModal: (v: boolean) => void;
}

function Toggle({ toggled, onToggle }: { toggled: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: '44px', height: '26px', borderRadius: '999px',
        position: 'relative', cursor: 'pointer', flexShrink: 0,
        background: toggled ? '#0084CC' : 'var(--theme-disabled-bg)',
        transition: 'background 0.22s ease',
      }}
    >
      <div style={{
        position: 'absolute',
        top: '3px',
        left: toggled ? '21px' : '3px',
        width: '20px', height: '20px', borderRadius: '50%',
        background: 'var(--theme-surface)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.18)',
        transition: 'left 0.22s ease',
      }} />
    </div>
  );
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M9 18L15 12L9 6" stroke="var(--theme-text-subtle)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 메뉴 아이템 행
function MenuItem({
  icon, label, sub, href, onClick, danger = false, right,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  right?: React.ReactNode;
}) {
  const inner = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '13px 20px', cursor: href || onClick ? 'pointer' : 'default',
    }}>
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '15px', fontWeight: 600, color: danger ? '#EF4444' : 'var(--theme-text)' }}>
          {label}
        </span>
        {sub && (
          <p style={{ fontSize: '12px', color: 'var(--theme-text-subtle)', margin: '1px 0 0', fontWeight: 500 }}>{sub}</p>
        )}
      </div>
      {right ?? (href || onClick ? <Chevron /> : null)}
    </div>
  );

  if (href) return <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link>;
  if (onClick) return <div onClick={onClick}>{inner}</div>;
  return inner;
}

function MenuDivider() {
  return <div style={{ height: '1px', background: 'var(--theme-border)', marginLeft: '68px' }} />;
}

function MenuCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--theme-surface)',
      borderRadius: '18px',
      overflow: 'hidden',
      boxShadow: 'var(--theme-shadow-card)',
      border: '1px solid var(--theme-border)',
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <p style={{
      fontSize: '12px', fontWeight: 700,
      color: 'var(--theme-text-subtle)', margin: '0 0 8px',
      paddingLeft: '4px', letterSpacing: '0.2px',
    }}>
      {title}
    </p>
  );
}

function IconBox({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div style={{
      width: '36px', height: '36px', borderRadius: '10px',
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

export function MobileMyPage({
  user,
  insights,
  notifSettings,
  handleToggle,
  signOut,
  setShowEditModal,
  setShowAvatarEditor,
  setShowPasswordModal,
  setShowDeleteModal,
}: MobileMyPageProps) {
  const { capabilities } = useAccountSession();

  // ── 앱 버전 감지 ──────────────────────────────────────────
  const [installedVersion, setInstalledVersion] = useState<string | null>(null);
  const [appPlatform, setAppPlatform] = useState<'ios' | 'android' | 'web'>('web');

  useEffect(() => {
    getAppVersionInfo().then(info => {
      setInstalledVersion(info.installedVersion);
      setAppPlatform(info.platform);
    });
  }, []);

  const needsUpdate = !!installedVersion && isOutdated(installedVersion, LATEST_VERSION);
  const storeUrl = appPlatform === 'android' ? STORE_URL.android : appPlatform === 'ios' ? STORE_URL.ios : null;

  return (
    <div style={{
      background: 'var(--theme-bg)',
      minHeight: '100dvh',
      paddingBottom: 'var(--scroll-bottom, calc(env(safe-area-inset-bottom) + 80px))',
    }}>

      {/* ── 상단 프로필 카드 ─────────────────────────────────── */}
      <div style={{
        background: 'var(--theme-surface)',
        paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
        paddingBottom: '0',
        paddingLeft: '20px',
        paddingRight: '20px',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        {/* 상단 레이블 */}
        <p style={{
          fontSize: '22px', fontWeight: 800,
          color: 'var(--theme-text)', margin: '0 0 20px',
          letterSpacing: '-0.4px',
        }}>
          전체
        </p>

        {/* 프로필 행 */}
        <div
          style={{
            display: 'flex', alignItems: 'center',
            gap: '16px', paddingBottom: '20px', cursor: 'pointer',
          }}
        >
          {/* 아바타 — 탭 시 아바타 에디터 */}
          <div
            onClick={() => setShowAvatarEditor ? setShowAvatarEditor(true) : setShowEditModal(true)}
            style={{
              width: '64px', height: '64px', borderRadius: '22px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, position: 'relative',
            }}
          >
            <UserAvatar
              avatar={user?.avatar}
              name={user?.name}
              size={64}
              radius={22}
              fontSize={30}
              style={{
                background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
                border: '2px solid rgba(0,132,204,0.20)',
              }}
            />
            {/* Camera badge */}
            <div style={{
              position: 'absolute', bottom: -1, right: -1,
              width: '22px', height: '22px', borderRadius: '50%',
              background: '#0084CC',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid white',
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
          </div>

          {/* 이름 / 이메일 — 탭 시 이름 수정 모달 */}
          <div
            onClick={() => setShowEditModal(true)}
            style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
          >
            <h2 style={{
              fontSize: '18px', fontWeight: 800,
              color: 'var(--theme-text)', margin: '0 0 3px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.name ?? '사용자'}
            </h2>
            <p style={{
              fontSize: '13px', color: 'var(--theme-text-subtle)',
              fontWeight: 500, margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.email}
            </p>
          </div>

          {/* 수정 화살표 */}
          <div onClick={() => setShowEditModal(true)} style={{ cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--theme-text-subtle)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18L15 12L9 6"/>
            </svg>
          </div>
        </div>

        {/* 통계 바 */}
        <div style={{
          display: 'grid', gridTemplateColumns: capabilities.canViewHouseholdBudget ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
          borderTop: '1px solid #F2F2F7',
        }}>
          {[
            { label: '공간 멤버', value: insights?.memberCount ?? 0, unit: '명' },
            ...(capabilities.canViewHouseholdBudget
              ? [{ label: '이번달 지출', value: `${((insights?.totalExpense ?? 0) / 10000).toFixed(0)}만`, unit: '원' }]
              : []),
            { label: '예정 일정', value: insights?.upcomingCount ?? 0, unit: '개' },
          ].map((s, i) => (
            <div key={s.label} style={{
              padding: '14px 0',
              textAlign: 'center',
              borderLeft: i > 0 ? '1px solid var(--theme-border)' : 'none',
            }}>
              <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--theme-text)', margin: '0 0 2px' }}>
                {s.value}
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--theme-text-subtle)', marginLeft: '1px' }}>{s.unit}</span>
              </p>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--theme-text-subtle)', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 빠른 메뉴 그리드 ─────────────────────────────────── */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{
          background: 'var(--theme-surface)', borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: 'var(--theme-shadow-card)',
          border: '1px solid var(--theme-border)',
          display: 'grid', gridTemplateColumns: capabilities.canViewHouseholdBudget ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
        }}>
          {[
            {
              href: '/space', label: '공간',
              bg: 'rgba(0,132,204,0.10)', color: '#0084CC',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0084CC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              ),
            },
            {
              href: '/notifications', label: '알림',
              bg: 'rgba(255,149,0,0.10)', color: '#FF9500',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              ),
            },
            {
              href: '/schedules/new', label: '일정 추가',
              bg: 'rgba(12,201,181,0.10)', color: '#0CC9B5',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0CC9B5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              ),
            },
            {
              href: '/budget', label: '가계부',
              bg: 'rgba(52,199,89,0.10)', color: '#34C759',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="2"/>
                  <line x1="2" x2="22" y1="10" y2="10"/>
                </svg>
              ),
            },
          ].filter((item) => item.href !== '/budget' || capabilities.canViewHouseholdBudget).map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '18px 8px', gap: '8px',
                WebkitTapHighlightColor: 'transparent',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '16px',
                  background: item.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {item.icon}
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 600,
                  color: 'var(--theme-text)', letterSpacing: '-0.2px',
                }}>
                  {item.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── 메뉴 섹션 ──────────────────────────────────────────── */}
      <div style={{ padding: '24px 16px 0', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* 1. 공간 & 멤버 */}
        <div>
          <SectionTitle title="공간 & 멤버" />

          {/* 무료 플랜 현황 카드 */}
          <div style={{
            background: 'var(--theme-surface)', borderRadius: '18px', padding: '18px 20px',
            boxShadow: 'var(--theme-shadow-card)', border: '1px solid var(--theme-border)',
            marginBottom: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--theme-text)', margin: 0 }}>플랜 현황</p>
              <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 800, background: 'rgba(0,132,204,0.08)', color: '#0084CC' }}>FREE</span>
            </div>
            {/* 공간 */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)' }}>공유 공간</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: (insights?.spaceCount ?? 0) >= 2 ? '#EF4444' : 'var(--theme-text)' }}>
                  {insights?.spaceCount ?? 0}/2
                </span>
              </div>
              <div style={{ height: '6px', borderRadius: '999px', background: 'var(--theme-surface-muted)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(((insights?.spaceCount ?? 0) / 2) * 100, 100)}%`, borderRadius: '999px', background: (insights?.spaceCount ?? 0) >= 2 ? 'linear-gradient(90deg,#EF4444,#F97316)' : 'linear-gradient(90deg,#0CC9B5,#0084CC)', transition: 'width 0.4s' }} />
              </div>
            </div>
            {/* 멤버 */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)' }}>공간 멤버</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: (insights?.memberCount ?? 0) >= 10 ? '#EF4444' : 'var(--theme-text)' }}>
                  {insights?.memberCount ?? 0}/10
                </span>
              </div>
              <div style={{ height: '6px', borderRadius: '999px', background: 'var(--theme-surface-muted)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(((insights?.memberCount ?? 0) / 10) * 100, 100)}%`, borderRadius: '999px', background: (insights?.memberCount ?? 0) >= 10 ? 'linear-gradient(90deg,#EF4444,#F97316)' : 'linear-gradient(90deg,#0CC9B5,#0084CC)', transition: 'width 0.4s' }} />
              </div>
            </div>
          </div>

          <MenuCard>
            <MenuItem
              href="/space"
              label="공간 관리"
              sub="멤버 초대, 역할 설정, 일정 유형"
              icon={
                <IconBox bg="rgba(0,132,204,0.09)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0084CC" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </IconBox>
              }
            />
            <MenuDivider />
            <MenuItem
              href="/space/new"
              label="새 공간 만들기"
              sub="최대 2개 (무료 플랜)"
              icon={
                <IconBox bg="rgba(12,201,181,0.09)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0CC9B5" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </IconBox>
              }
            />
            <MenuDivider />
            <MenuItem
              href="/schedules/children"
              label="자녀 일정"
              sub="자녀 일정 현황 확인"
              icon={
                <IconBox bg="rgba(52,199,89,0.09)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M6 21v-1a6 6 0 0 1 12 0v1"/>
                  </svg>
                </IconBox>
              }
            />
          </MenuCard>
        </div>

        {/* 2. 알림 */}
        <div>
          <SectionTitle title="알림" />
          <MenuCard>
            <MenuItem
              href="/notifications"
              label="알림 목록"
              sub="받은 알림 전체 보기"
              icon={
                <IconBox bg="rgba(255,149,0,0.09)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </IconBox>
              }
            />
            <MenuDivider />
            <MenuItem
              label="일정 리마인더"
              sub="일정 시작 전 알림"
              icon={
                <IconBox bg="rgba(0,132,204,0.09)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0084CC" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </IconBox>
              }
              right={
                <Toggle toggled={notifSettings.scheduleReminders} onToggle={() => handleToggle('scheduleReminders')} />
              }
            />
            <MenuDivider />
            <MenuItem
              label="가계부 결제 알림"
              sub="정기 지출 D-1 알림"
              icon={
                <IconBox bg="rgba(52,199,89,0.09)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="14" x="2" y="5" rx="2"/>
                    <line x1="2" x2="22" y1="10" y2="10"/>
                  </svg>
                </IconBox>
              }
              right={
                <Toggle toggled={notifSettings.expenseReminders} onToggle={() => handleToggle('expenseReminders')} />
              }
            />
          </MenuCard>
        </div>

        {/* 3. 앱 설정 */}
        <div>
          <SectionTitle title="앱 설정" />
          <MenuCard>
            <div style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <IconBox bg="rgba(0,132,204,0.09)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0084CC" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4"/>
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
                  </svg>
                </IconBox>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--theme-text)', margin: '0 0 2px' }}>
                    화면 모드
                  </p>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--theme-text-subtle)', margin: 0 }}>
                    PC·모바일 웹·앱 화면을 같은 기준으로 표시합니다.
                  </p>
                </div>
              </div>
              <ThemeModeSelector compact />
            </div>
            <MenuDivider />
            <MenuItem
              href="/settings/home-layout"
              label="홈 레이아웃"
              sub="홈 화면 구성 변경"
              icon={
                <IconBox bg="rgba(0,132,204,0.09)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0084CC" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" rx="1"/>
                  </svg>
                </IconBox>
              }
            />
            {appPlatform !== 'web' && (
              <>
                <MenuDivider />
                <MenuItem
                  href="/settings/calendar"
                  label="기기 캘린더"
                  sub="스마트폰 캘린더 동기화"
                  icon={
                    <IconBox bg="rgba(12,201,181,0.09)">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0CC9B5" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="4" rx="2"/>
                        <line x1="16" x2="16" y1="2" y2="6"/>
                        <line x1="8" x2="8" y1="2" y2="6"/>
                        <line x1="3" x2="21" y1="10" y2="10"/>
                      </svg>
                    </IconBox>
                  }
                />
              </>
            )}
          </MenuCard>
        </div>

        {/* 4. 계정 & 보안 */}
        <div>
          <SectionTitle title="계정 & 보안" />
          <MenuCard>
            <MenuItem
              label="비밀번호 설정"
              onClick={() => setShowPasswordModal(true)}
              icon={
                <IconBox bg="rgba(88,86,214,0.09)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5856D6" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </IconBox>
              }
            />
            {appPlatform !== 'web' && (
              <>
                <MenuDivider />
                <MenuItem
                  href="/settings/security"
                  label="생체인증 보안"
                  sub="앱 잠금과 보호 구간 관리"
                  icon={
                    <IconBox bg="rgba(0,132,204,0.09)">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0084CC" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <path d="M9 12l2 2 4-4"/>
                      </svg>
                    </IconBox>
                  }
                />
              </>
            )}
          </MenuCard>
        </div>

        {/* 5. 앱 정보 */}
        <div>
          <SectionTitle title={appPlatform === 'web' ? '서비스' : '앱 정보'} />
          <MenuCard>
            {/* 업데이트 필요 배너 */}
            {needsUpdate && storeUrl && (
              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', textDecoration: 'none' }}
              >
                <div style={{
                  margin: '0', padding: '14px 20px',
                  background: 'linear-gradient(135deg, rgba(0,132,204,0.08) 0%, rgba(12,201,181,0.08) 100%)',
                  borderBottom: '1px solid rgba(0,132,204,0.10)',
                  display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(0,132,204,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '18px' }}>🆕</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: 800, color: '#0084CC', margin: '0 0 2px' }}>업데이트가 있어요</p>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--theme-text-subtle)', margin: 0 }}>
                      현재 v{installedVersion} → 최신 v{LATEST_VERSION}
                    </p>
                  </div>
                  <div style={{ padding: '6px 14px', borderRadius: '999px', background: '#0084CC', fontSize: '12px', fontWeight: 800, color: 'white', flexShrink: 0 }}>
                    업데이트
                  </div>
                </div>
              </a>
            )}
            {appPlatform !== 'web' && <MenuItem
              label="앱 버전"
              icon={
                <IconBox bg="rgba(142,142,147,0.10)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--theme-text-subtle)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </IconBox>
              }
              right={
                installedVersion ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', color: needsUpdate ? '#EF4444' : 'var(--theme-text-subtle)', fontWeight: 600 }}>v{installedVersion}</span>
                    {needsUpdate ? (
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#EF4444', background: 'rgba(239,68,68,0.10)', padding: '2px 7px', borderRadius: '999px' }}>구버전</span>
                    ) : (
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#0CC9B5', background: 'rgba(12,201,181,0.10)', padding: '2px 7px', borderRadius: '999px' }}>최신</span>
                    )}
                  </div>
                ) : (
                  <span style={{ fontSize: '13px', color: 'var(--theme-text-subtle)', fontWeight: 600 }}>
                    {isNativeApp() ? '확인 중...' : `웹 v${LATEST_VERSION}`}
                  </span>
                )
              }
            />}
            {appPlatform !== 'web' && <MenuDivider />}
            <MenuItem
              href="/legal/terms"
              label="이용약관"
              icon={
                <IconBox bg="rgba(142,142,147,0.10)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--theme-text-subtle)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </IconBox>
              }
            />
            <MenuDivider />
            <MenuItem
              href="/legal/privacy"
              label="개인정보처리방침"
              icon={
                <IconBox bg="rgba(142,142,147,0.10)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--theme-text-subtle)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </IconBox>
              }
            />
          </MenuCard>
        </div>

        {/* 6. 로그아웃 */}
        <div>
          <MenuCard>
            <MenuItem
              label="로그아웃"
              onClick={signOut}
              danger
              icon={
                <IconBox bg="rgba(239,68,68,0.09)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </IconBox>
              }
            />
          </MenuCard>
        </div>

        {/* 7. 푸터 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 16px', gap: '12px' }}>
          <GleaumBI variant="dark" width={60} />
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{
              fontSize: '12px', fontWeight: 600, color: '#C7C7CC',
              background: 'none', border: 'none', cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            회원탈퇴
          </button>
        </div>

      </div>
    </div>
  );
}
