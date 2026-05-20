'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GleaumBI } from '@/components/ui/GleaumLogo';
import type { NotificationSettings } from '@/types';

interface MobileMyPageProps {
  user: any;
  insights: any;
  notifSettings: NotificationSettings;
  handleToggle: (key: keyof NotificationSettings) => void;
  signOut: () => void;
  setShowEditModal: (v: boolean) => void;
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
        background: toggled ? '#0084CC' : '#E5E5EA',
        transition: 'background 0.22s ease',
      }}
    >
      <div style={{
        position: 'absolute',
        top: '3px',
        left: toggled ? '21px' : '3px',
        width: '20px', height: '20px', borderRadius: '50%',
        background: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.18)',
        transition: 'left 0.22s ease',
      }} />
    </div>
  );
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M9 18L15 12L9 6" stroke="#C7C7CC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
        <span style={{ fontSize: '15px', fontWeight: 600, color: danger ? '#EF4444' : '#1A1B2E' }}>
          {label}
        </span>
        {sub && (
          <p style={{ fontSize: '12px', color: '#8E8E93', margin: '1px 0 0', fontWeight: 500 }}>{sub}</p>
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
  return <div style={{ height: '1px', background: '#F2F2F7', marginLeft: '68px' }} />;
}

function MenuCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '18px',
      overflow: 'hidden',
      boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
      border: '1px solid rgba(0,0,0,0.04)',
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <p style={{
      fontSize: '12px', fontWeight: 700,
      color: '#8E8E93', margin: '0 0 8px',
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
  setShowPasswordModal,
  setShowDeleteModal,
}: MobileMyPageProps) {
  const router = useRouter();

  return (
    <div style={{
      background: '#F2F2F7',
      minHeight: '100dvh',
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
    }}>

      {/* ── 상단 프로필 카드 ─────────────────────────────────── */}
      <div style={{
        background: 'white',
        paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
        paddingBottom: '0',
        paddingLeft: '20px',
        paddingRight: '20px',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        {/* 상단 레이블 */}
        <p style={{
          fontSize: '22px', fontWeight: 800,
          color: '#1A1B2E', margin: '0 0 20px',
          letterSpacing: '-0.4px',
        }}>
          전체
        </p>

        {/* 프로필 행 */}
        <div
          onClick={() => setShowEditModal(true)}
          style={{
            display: 'flex', alignItems: 'center',
            gap: '16px', paddingBottom: '20px', cursor: 'pointer',
          }}
        >
          {/* 아바타 */}
          <div style={{
            width: '64px', height: '64px', borderRadius: '22px',
            background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '30px', flexShrink: 0,
            border: '2px solid rgba(0,132,204,0.15)',
          }}>
            {user?.avatar ?? '👤'}
          </div>

          {/* 이름 / 이메일 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{
              fontSize: '18px', fontWeight: 800,
              color: '#1A1B2E', margin: '0 0 3px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.name ?? '사용자'}
            </h2>
            <p style={{
              fontSize: '13px', color: '#8E8E93',
              fontWeight: 500, margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.email}
            </p>
          </div>

          {/* 수정 화살표 */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18L15 12L9 6"/>
          </svg>
        </div>

        {/* 통계 바 */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          borderTop: '1px solid #F2F2F7',
        }}>
          {[
            { label: '공간 멤버', value: insights?.memberCount ?? 0, unit: '명' },
            { label: '이번달 지출', value: `${((insights?.totalExpense ?? 0) / 10000).toFixed(0)}만`, unit: '원' },
            { label: '예정 일정', value: insights?.upcomingCount ?? 0, unit: '개' },
          ].map((s, i) => (
            <div key={s.label} style={{
              padding: '14px 0',
              textAlign: 'center',
              borderLeft: i > 0 ? '1px solid #F2F2F7' : 'none',
            }}>
              <p style={{ fontSize: '18px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 2px' }}>
                {s.value}
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#8E8E93', marginLeft: '1px' }}>{s.unit}</span>
              </p>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#8E8E93', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 빠른 메뉴 그리드 ─────────────────────────────────── */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{
          background: 'white', borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
          border: '1px solid rgba(0,0,0,0.04)',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
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
          ].map((item) => (
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
                  color: '#1A1B2E', letterSpacing: '-0.2px',
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
            background: 'white', borderRadius: '18px', padding: '18px 20px',
            boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)',
            marginBottom: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <p style={{ fontSize: '14px', fontWeight: 800, color: '#1A1B2E', margin: 0 }}>플랜 현황</p>
              <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 800, background: 'rgba(0,132,204,0.08)', color: '#0084CC' }}>FREE</span>
            </div>
            {/* 공간 */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93' }}>내 공간</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: (insights?.spaceCount ?? 0) >= 2 ? '#EF4444' : '#1A1B2E' }}>
                  {insights?.spaceCount ?? 0}/2
                </span>
              </div>
              <div style={{ height: '6px', borderRadius: '999px', background: '#F0F0F5', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(((insights?.spaceCount ?? 0) / 2) * 100, 100)}%`, borderRadius: '999px', background: (insights?.spaceCount ?? 0) >= 2 ? 'linear-gradient(90deg,#EF4444,#F97316)' : 'linear-gradient(90deg,#0CC9B5,#0084CC)', transition: 'width 0.4s' }} />
              </div>
            </div>
            {/* 멤버 */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#8E8E93' }}>공간 멤버</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: (insights?.memberCount ?? 0) >= 10 ? '#EF4444' : '#1A1B2E' }}>
                  {insights?.memberCount ?? 0}/10
                </span>
              </div>
              <div style={{ height: '6px', borderRadius: '999px', background: '#F0F0F5', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(((insights?.memberCount ?? 0) / 10) * 100, 100)}%`, borderRadius: '999px', background: (insights?.memberCount ?? 0) >= 10 ? 'linear-gradient(90deg,#EF4444,#F97316)' : 'linear-gradient(90deg,#0CC9B5,#0084CC)', transition: 'width 0.4s' }} />
              </div>
            </div>
            {/* 업그레이드 힌트 */}
            <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'linear-gradient(135deg,rgba(0,132,204,0.06),rgba(12,201,181,0.06))', border: '1px solid rgba(0,132,204,0.10)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>🎁</span>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#8E8E93', margin: 0, lineHeight: 1.5 }}>
                광고 시청 또는 인앱결제 포인트로 공간·멤버 슬롯 확장 가능 <span style={{ color: '#0084CC', fontWeight: 800 }}>준비 중</span>
              </p>
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

        {/* 3. 계정 & 보안 */}
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
            <MenuDivider />
            <MenuItem
              label="Apple 로그인"
              sub="준비 중"
              icon={
                <IconBox bg="rgba(0,0,0,0.06)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1B2E" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20.94c1.5 0 2.75-.6 3.95-1.56 1.2-.96 1.55-2.34 1.55-3.88 0-2.06-1.25-3.56-3.1-3.56-.55 0-1.1.15-1.4.3-.3-.15-.85-.3-1.4-.3C9.75 12 8.5 13.5 8.5 15.5c0 1.54.35 2.92 1.55 3.88C11.25 20.34 12.5 20.94 12 20.94z"/>
                    <path d="M12 8.5a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 0 0 5z"/>
                  </svg>
                </IconBox>
              }
              right={<span style={{ fontSize: '13px', color: '#8E8E93', fontWeight: 600 }}>준비 중</span>}
            />
          </MenuCard>
        </div>

        {/* 4. 서비스 */}
        <div>
          <SectionTitle title="서비스" />
          <MenuCard>
            <MenuItem
              href="/settings/calendar"
              label="기기 캘린더 연동"
              sub="스마트폰 캘린더와 동기화"
              icon={
                <IconBox bg="rgba(12,201,181,0.09)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0CC9B5" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </IconBox>
              }
              right={<span style={{ fontSize: '12px', fontWeight: 700, color: '#0CC9B5', background: 'rgba(12,201,181,0.10)', padding: '3px 8px', borderRadius: '6px' }}>준비 중</span>}
            />
          </MenuCard>
        </div>

        {/* 5. 앱 정보 */}
        <div>
          <SectionTitle title="앱 정보" />
          <MenuCard>
            <MenuItem
              label="버전 정보"
              icon={
                <IconBox bg="rgba(142,142,147,0.10)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </IconBox>
              }
              right={<span style={{ fontSize: '13px', color: '#8E8E93', fontWeight: 600 }}>v1.0.2</span>}
            />
            <MenuDivider />
            <MenuItem
              href="/legal/terms"
              label="이용약관"
              icon={
                <IconBox bg="rgba(142,142,147,0.10)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
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
