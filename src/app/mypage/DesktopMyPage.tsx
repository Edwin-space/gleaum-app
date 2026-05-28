'use client';

import React from 'react';
import Link from 'next/link';
import { GleaumBI, GleaumLogoImg } from '@/components/ui/GleaumLogo';
import { UserAvatar } from '@/components/ui/UserAvatar';
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
        <h4 style={{ fontSize: '15px', fontWeight: 800, color: danger ? '#EF4444' : '#1A1B2E', margin: '0 0 2px' }}>{label}</h4>
        {description && <p style={{ fontSize: '12px', color: '#8E8E93', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>{description}</p>}
      </div>
      {isToggle ? (
        <div style={{ width: '50px', height: '28px', borderRadius: '999px', position: 'relative', background: toggled ? '#0084CC' : '#E5E5EA', transition: 'background 0.3s', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: '3px', width: '22px', height: '22px', background: 'white', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.3s', left: toggled ? '25px' : '3px' }} />
        </div>
      ) : value ? (
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#8E8E93', background: '#F5F5F9', padding: '5px 12px', borderRadius: '999px', flexShrink: 0 }}>{value}</span>
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
  user: any;
  insights: any;
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
                      background: 'white', color: '#1A1B2E', border: 'none', cursor: 'pointer',
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '24px' }}>
                {[
                  { label: '멤버', value: insights?.memberCount ?? 0 },
                  { label: '지출', value: (insights?.totalExpense ?? 0).toLocaleString() },
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

          {/* 프리미엄 혜택 카드 */}
          <div style={{
            background: 'white', borderRadius: '24px', padding: '22px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>💎</span>
              <p style={{ fontSize: '15px', fontWeight: 800, color: '#1A1B2E', margin: 0 }}>프리미엄 혜택</p>
            </div>
            <p style={{ fontSize: '13px', color: '#8E8E93', fontWeight: 600, lineHeight: 1.65, margin: 0 }}>
              글리움 프리미엄 사용 중입니다. 무제한 공간 생성과 고화질 파일 첨부 기능을 이용할 수 있습니다.
            </p>
          </div>
        </div>

        {/* ── 오른쪽: 설정 섹션 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* 앱 설정 */}
          <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '18px 24px', background: '#FAFAFA', borderBottom: '1px solid #F5F5F9' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#AEAEA8', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>앱 설정</p>
            </div>
            <SettingRow
              icon={<Icon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" stroke="#0084CC" />}
              label="홈 레이아웃"
              description="홈 화면의 구성과 우선 표시 항목을 선택합니다."
              href="/settings/home-layout"
            />
            <div style={{ height: '1px', background: '#F7F7FA', margin: '0 24px' }} />
            <SettingRow
              icon={<Icon d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18" stroke="#0084CC" />}
              label="캘린더 설정"
              description="기기 캘린더 연동 및 표시 옵션을 설정합니다."
              href="/settings/calendar"
            />
          </div>

          {/* 계정 및 보안 */}
          <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '18px 24px', background: '#FAFAFA', borderBottom: '1px solid #F5F5F9' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#AEAEA8', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>계정 및 보안</p>
            </div>
            <div style={{ divideY: '1px solid #F7F7FA' } as any}>
              <SettingRow
                icon={<Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#0084CC" />}
                label="비밀번호 재설정"
                description="이메일 로그인을 위한 보안 비밀번호를 설정하거나 변경합니다."
                onClick={() => setShowPasswordModal(true)}
              />
              <div style={{ height: '1px', background: '#F7F7FA', margin: '0 24px' }} />
              <SettingRow
                icon={<Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="#0084CC" />}
                label="공간(Space) 관리"
                description="연인, 친구와의 공간을 관리하고 새로운 멤버를 초대합니다."
                href="/space"
              />
            </div>
          </div>

          {/* 알림 설정 */}
          <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '18px 24px', background: '#FAFAFA', borderBottom: '1px solid #F5F5F9' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#AEAEA8', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>서비스 연동 및 알림</p>
            </div>
            <SettingRow
              icon={<Icon d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0" stroke="#1A1B2E" />}
              label="푸시 알림 리마인더"
              description="일정 시작 전 및 결제일 도래 시 알림을 받습니다."
              isToggle
              toggled={notifSettings.scheduleReminders}
              onToggle={() => handleToggle('scheduleReminders')}
            />
            <div style={{ height: '1px', background: '#F7F7FA', margin: '0 24px' }} />
            <SettingRow
              icon={<Icon d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z M21 21l-4.35-4.35" stroke="#1A1B2E" />}
              label="가계부 스마트 리포트"
              description="매월 말 지출 내역 요약 리포트를 푸시로 전송합니다."
              isToggle
              toggled={notifSettings.expenseReminders}
              onToggle={() => handleToggle('expenseReminders')}
            />
          </div>

          {/* 계정 액션 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{ fontSize: '13px', fontWeight: 700, color: '#AEAEA8', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
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
