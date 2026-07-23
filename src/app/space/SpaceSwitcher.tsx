'use client';

import { useEffect, useRef, useState } from 'react';
import type { Space } from '@/types';
import { useAccountSession } from '@/components/AccountSessionProvider';

interface SpaceSwitcherProps {
  spaces: Space[];
  currentSpaceId: string | null;
  personalSpaceId: string | null;
  mobile?: boolean;
  onSelect: (space: Space, index: number) => void;
  onJoin: () => void;
  onCreate: () => void;
  createDisabled?: boolean;
}

export type SpaceSection = 'feed' | 'schedule' | 'members';

export function SpaceSectionTabs({ value, onChange, compact = false }: { value: SpaceSection; onChange: (value: SpaceSection) => void; compact?: boolean }) {
  const sections: { value: SpaceSection; label: string }[] = [
    { value: 'feed', label: '소식' },
    { value: 'schedule', label: '일정' },
    { value: 'members', label: '멤버' },
  ];
  return (
    <div role="tablist" aria-label="공간 메뉴" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', padding: '4px', borderRadius: '16px', background: 'var(--theme-surface-muted)', border: '1px solid var(--theme-border)' }}>
      {sections.map(section => {
        const active = section.value === value;
        return (
          <button
            key={section.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(section.value)}
            style={{
              minHeight: compact ? '38px' : '42px', padding: '0 16px', borderRadius: '12px',
              border: active ? '1px solid var(--theme-border)' : '1px solid transparent',
              background: active ? 'var(--theme-surface)' : 'transparent',
              boxShadow: active ? '0 2px 8px rgba(15,23,42,0.06)' : 'none',
              color: active ? 'var(--theme-text)' : 'var(--theme-text-subtle)',
              fontSize: '13px', fontWeight: active ? 850 : 700, cursor: 'pointer',
            }}
          >
            {section.label}
          </button>
        );
      })}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 160ms ease' }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function SpaceSwitcher({
  spaces,
  currentSpaceId,
  personalSpaceId,
  mobile = false,
  onSelect,
  onJoin,
  onCreate,
  createDisabled = false,
}: SpaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentSpace = spaces.find(space => space.id === currentSpaceId);
  const currentIsPersonal = currentSpaceId === personalSpaceId;
  const { capabilities } = useAccountSession();
  const showSpaceActions = capabilities.canInviteMembers || capabilities.canManageSpaces;

  useEffect(() => {
    if (!open || mobile) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    return () => document.removeEventListener('pointerdown', closeOnOutside);
  }, [mobile, open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  const selectSpace = (space: Space, index: number) => {
    onSelect(space, index);
    setOpen(false);
  };

  const menu = (
    <div
      role="dialog"
      aria-label="공간 선택"
      style={{
        width: mobile ? '100%' : '340px',
        background: 'var(--theme-surface)',
        border: '1px solid var(--theme-border)',
        borderRadius: mobile ? '24px 24px 0 0' : '20px',
        padding: mobile ? '12px 16px calc(20px + env(safe-area-inset-bottom))' : '12px',
        boxShadow: '0 20px 56px rgba(15,23,42,0.18)',
      }}
    >
      {mobile && (
        <div style={{ width: '40px', height: '4px', borderRadius: '999px', background: 'var(--theme-border)', margin: '0 auto 14px' }} />
      )}
      <div style={{ padding: '4px 4px 10px' }}>
        <p style={{ margin: 0, color: 'var(--theme-text)', fontSize: '16px', fontWeight: 800 }}>공간 전환</p>
        <p style={{ margin: '3px 0 0', color: 'var(--theme-text-subtle)', fontSize: '12px', fontWeight: 600 }}>보고 싶은 공간을 선택하세요.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {spaces.map((space, index) => {
          const active = space.id === currentSpaceId;
          const personal = space.id === personalSpaceId;
          return (
            <button
              key={space.id}
              type="button"
              onClick={() => selectSpace(space, index)}
              aria-current={active ? 'page' : undefined}
              style={{
                width: '100%', minHeight: '56px', padding: '8px 10px',
                display: 'flex', alignItems: 'center', gap: '12px',
                borderRadius: '16px', border: active ? '1px solid rgba(0,132,204,0.28)' : '1px solid transparent',
                background: active ? 'rgba(0,132,204,0.08)' : 'transparent',
                color: 'var(--theme-text)', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{
                width: '38px', height: '38px', borderRadius: '13px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: personal ? 'rgba(12,201,181,0.10)' : 'rgba(0,132,204,0.10)',
                color: personal ? '#0CC9B5' : '#0084CC',
              }}>
                {personal ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
                ) : (
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>
                )}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '14px', fontWeight: 800 }}>{space.name}</span>
                <span style={{ display: 'block', marginTop: '2px', color: 'var(--theme-text-subtle)', fontSize: '11px', fontWeight: 600 }}>{personal ? '개인 공간' : '공유 공간'}</span>
              </span>
              {active && (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#0084CC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-label="현재 공간"><path d="m5 12 4 4L19 6"/></svg>
              )}
            </button>
          );
        })}
      </div>

      {showSpaceActions && (
        <>
          <div style={{ height: '1px', background: 'var(--theme-border)', margin: '10px 4px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: capabilities.canInviteMembers && capabilities.canManageSpaces ? '1fr 1fr' : '1fr', gap: '8px' }}>
            {capabilities.canInviteMembers && (
              <button type="button" onClick={() => { setOpen(false); onJoin(); }} style={{ minHeight: '44px', borderRadius: '14px', border: '1px solid var(--theme-border)', background: 'var(--theme-surface-muted)', color: 'var(--theme-text)', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>
                코드로 참여
              </button>
            )}
            {capabilities.canManageSpaces && (
              <button type="button" disabled={createDisabled} onClick={() => { if (!createDisabled) { setOpen(false); onCreate(); } }} style={{ minHeight: '44px', borderRadius: '14px', border: '1px solid rgba(0,132,204,0.20)', background: 'rgba(0,132,204,0.08)', color: '#0084CC', fontSize: '13px', fontWeight: 800, cursor: createDisabled ? 'not-allowed' : 'pointer', opacity: createDisabled ? 0.48 : 1 }}>
                새 공간 만들기
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', minWidth: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
        style={{
          maxWidth: mobile ? '100%' : '360px', minHeight: mobile ? '42px' : '52px',
          padding: mobile ? '4px 6px' : '5px 10px 5px 6px',
          display: 'flex', alignItems: 'center', gap: mobile ? '8px' : '10px',
          borderRadius: mobile ? '12px' : '16px', border: mobile ? 'none' : '1px solid var(--theme-border)',
          background: mobile ? 'transparent' : 'var(--theme-surface)', color: 'var(--theme-text)', cursor: 'pointer',
        }}
      >
        <span style={{ width: mobile ? '34px' : '40px', height: mobile ? '34px' : '40px', borderRadius: mobile ? '11px' : '13px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: currentIsPersonal ? 'rgba(12,201,181,0.10)' : 'rgba(0,132,204,0.10)', color: currentIsPersonal ? '#0CC9B5' : '#0084CC' }}>
          {currentIsPersonal ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>
          )}
        </span>
        <span style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
          {!mobile && <span style={{ display: 'block', color: 'var(--theme-text-subtle)', fontSize: '10px', lineHeight: 1.2, fontWeight: 700 }}>현재 공간</span>}
          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: mobile ? '17px' : '15px', lineHeight: 1.3, fontWeight: 850 }}>{currentSpace?.name ?? '공간 선택'}</span>
        </span>
        <span style={{ color: 'var(--theme-text-subtle)', display: 'flex' }}><Chevron open={open} /></span>
      </button>

      {open && mobile && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', alignItems: 'flex-end', background: 'rgba(15,23,42,0.46)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
          <div onClick={event => event.stopPropagation()} style={{ width: '100%' }}>{menu}</div>
        </div>
      )}
      {open && !mobile && (
        <div style={{ position: 'absolute', zIndex: 80, top: 'calc(100% + 8px)', left: 0 }}>{menu}</div>
      )}
    </div>
  );
}
