'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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

// Inline Toggle component
function Toggle({ toggled, onToggle }: { toggled: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: '48px', height: '28px', borderRadius: '999px',
        position: 'relative', cursor: 'pointer', flexShrink: 0,
        background: toggled ? '#0084CC' : '#E5E5EA',
        transition: 'background 0.25s ease',
      }}
    >
      <div style={{
        position: 'absolute',
        top: '4px',
        left: toggled ? '24px' : '4px',
        width: '20px', height: '20px', borderRadius: '50%',
        background: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.18)',
        transition: 'left 0.25s ease',
      }} />
    </div>
  );
}

// Chevron icon
function Chevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M9 18L15 12L9 6" stroke="#C7C7CC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Section header row
function SectionLabel({ title }: { title: string }) {
  return (
    <p style={{
      padding: '20px 20px 8px',
      fontSize: '11px', fontWeight: 800,
      letterSpacing: '1.4px', textTransform: 'uppercase',
      color: '#8E8E93', margin: 0,
    }}>
      {title}
    </p>
  );
}

// Setting row divider
function Divider() {
  return <div style={{ height: '1px', background: '#F5F5F7', marginLeft: '68px' }} />;
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
  return (
    <div
      className="min-h-dvh"
      style={{ background: '#FAFAFD', paddingBottom: 'calc(env(safe-area-inset-bottom) + 96px)' }}
    >
      {/* ── Hero section ── */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
        borderRadius: '0 0 40px 40px',
        paddingTop: 'calc(env(safe-area-inset-top) + 40px)',
        paddingBottom: '32px',
        paddingLeft: '24px',
        paddingRight: '24px',
        color: 'white',
      }}>
        {/* Glow blobs */}
        <div style={{
          position: 'absolute', top: '-50px', right: '-50px',
          width: '220px', height: '220px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,132,204,0.22) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', left: '-40px',
          width: '180px', height: '180px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(12,201,181,0.14) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 10 }}>
          {/* Label */}
          <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.6px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: '20px' }}>
            마이페이지
          </p>

          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '28px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '28px',
              background: 'rgba(255,255,255,0.10)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '38px', flexShrink: 0,
            }}>
              {user?.avatar ?? '👤'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 900, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name ?? '사용자'}
                </h2>
                <button
                  onClick={() => setShowEditModal(true)}
                  style={{
                    width: '30px', height: '30px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.12)',
                    border: 'none', cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.50)', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </p>
            </div>
          </div>

          {/* 3-col stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {[
              { label: '공간 멤버', value: insights?.memberCount ?? 0, unit: '명' },
              { label: '이번달 지출', value: (insights?.totalExpense ?? 0).toLocaleString(), unit: '원' },
              { label: '예정 일정', value: insights?.upcomingCount ?? 0, unit: '개' },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: '18px',
                  padding: '14px 10px',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', margin: '0 0 6px' }}>
                  {stat.label}
                </p>
                <p style={{ fontSize: '17px', fontWeight: 900, margin: 0 }}>
                  {stat.value}
                  <span style={{ fontSize: '11px', fontWeight: 600, opacity: 0.6, marginLeft: '2px' }}>{stat.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Insight card ── */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.04)',
          padding: '18px 18px',
          display: 'flex', alignItems: 'flex-start', gap: '14px',
        }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '16px',
            background: 'rgba(0,132,204,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', flexShrink: 0,
          }}>
            💡
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1A1B2E', margin: '0 0 4px' }}>
              오늘의 한 줄 리포트
            </h3>
            <p style={{ fontSize: '13px', color: '#6E6E66', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
              {insights && insights.upcomingCount > 0
                ? `이번 주에는 ${insights.upcomingCount}개의 소중한 공간 일정이 기다리고 있어요. 미리 준비해볼까요?`
                : '공간이 한산한 편이네요. 멤버들과 여유로운 시간을 계획해 보는 건 어떨까요?'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Settings sections ── */}
      <div style={{ padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Account & security */}
        <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <SectionLabel title="계정 및 보안" />

          {/* Password */}
          <div
            onClick={() => setShowPasswordModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', cursor: 'pointer' }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(0,132,204,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0084CC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span style={{ flex: 1, fontSize: '15px', fontWeight: 700, color: '#1A1B2E' }}>비밀번호 설정</span>
            <Chevron />
          </div>

          <Divider />

          {/* Family / space */}
          <Link href="/family" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', cursor: 'pointer' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(0,132,204,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0084CC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span style={{ flex: 1, fontSize: '15px', fontWeight: 700, color: '#1A1B2E' }}>공간 관리 및 초대</span>
              <Chevron />
            </div>
          </Link>
        </div>

        {/* Service integrations */}
        <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <SectionLabel title="서비스 연동" />

          {/* Google Calendar */}
          <Link href="/settings/calendar" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', cursor: 'pointer' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(12,201,181,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0CC9B5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <span style={{ flex: 1, fontSize: '15px', fontWeight: 700, color: '#1A1B2E' }}>구글 캘린더</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#8E8E93', marginRight: '6px' }}>연동됨</span>
              <Chevron />
            </div>
          </Link>

          <Divider />

          {/* Apple login */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(12,201,181,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0CC9B5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <span style={{ flex: 1, fontSize: '15px', fontWeight: 700, color: '#1A1B2E' }}>Apple 로그인</span>
            <Toggle toggled={false} onToggle={() => {}} />
          </div>
        </div>

        {/* Notification settings */}
        <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <SectionLabel title="알림 설정" />

          {/* Schedule reminders */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(26,27,46,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1B2E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <span style={{ flex: 1, fontSize: '15px', fontWeight: 700, color: '#1A1B2E' }}>일정 리마인더</span>
            <Toggle toggled={notifSettings.scheduleReminders} onToggle={() => handleToggle('scheduleReminders')} />
          </div>

          <Divider />

          {/* Expense reminders */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(26,27,46,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1B2E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="7" r="5" />
                <path d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" />
              </svg>
            </div>
            <span style={{ flex: 1, fontSize: '15px', fontWeight: 700, color: '#1A1B2E' }}>가계부 결제 알림</span>
            <Toggle toggled={notifSettings.expenseReminders} onToggle={() => handleToggle('expenseReminders')} />
          </div>
        </div>

        {/* Sign out */}
        <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div
            onClick={signOut}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', cursor: 'pointer' }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <span style={{ flex: 1, fontSize: '15px', fontWeight: 700, color: '#EF4444' }}>로그아웃</span>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px 12px', opacity: 0.38 }}>
        <GleaumBI variant="dark" width={72} />
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1A1B2E', letterSpacing: '0.8px', margin: '8px 0 0', textTransform: 'uppercase' }}>
          Premium Dashboard
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          style={{ marginTop: '14px', fontSize: '11px', fontWeight: 700, color: '#1A1B2E', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          회원탈퇴
        </button>
      </div>
    </div>
  );
}
