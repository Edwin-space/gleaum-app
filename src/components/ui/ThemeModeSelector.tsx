'use client';

import { useTheme } from '@/components/ThemeProvider';
import type { ThemeMode } from '@/lib/theme';

const OPTIONS: Array<{ mode: ThemeMode; label: string; desc: string; icon: string }> = [
  { mode: 'system', label: '자동', desc: '기기 설정에 맞춤', icon: '◐' },
  { mode: 'light',  label: '라이트', desc: '밝은 흰 배경',   icon: '☀' },
  { mode: 'dark',   label: '다크', desc: '어두운 배경',     icon: '●' },
];

export function ThemeModeSelector({ compact = false }: { compact?: boolean }) {
  const { mode, setMode } = useTheme();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: compact ? 'repeat(3, 1fr)' : 'repeat(3, minmax(0, 1fr))',
        gap: compact ? '6px' : '8px',
        width: '100%',
      }}
    >
      {OPTIONS.map((item) => {
        const active = mode === item.mode;
        return (
          <button
            key={item.mode}
            onClick={() => setMode(item.mode)}
            style={{
              minHeight: compact ? '42px' : '56px',
              borderRadius: compact ? '14px' : '16px',
              border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--theme-border)'}`,
              background: active ? 'var(--theme-selected-bg)' : 'var(--theme-surface-muted)',
              color: active ? 'var(--color-primary)' : 'var(--theme-text-muted)',
              padding: compact ? '8px 6px' : '10px 12px',
              display: 'flex',
              flexDirection: compact ? 'row' : 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: compact ? '5px' : '3px',
              cursor: 'pointer',
              transition: 'border-color 0.18s, background 0.18s, color 0.18s',
            }}
          >
            <span style={{ fontSize: compact ? '13px' : '16px', lineHeight: 1 }}>{item.icon}</span>
            <span style={{ fontSize: compact ? '12px' : '13px', fontWeight: 900, lineHeight: 1.15 }}>
              {item.label}
            </span>
            {!compact && (
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--theme-text-subtle)', lineHeight: 1.2 }}>
                {item.desc}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

