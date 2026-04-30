'use client';

// ============================================================
// 글리움 로고 컴포넌트
// Source: gleaum_design_system.html
// ============================================================

interface GleaumLogoProps {
  variant?: 'dark' | 'light' | 'white' | 'gradient' | 'mono';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

const sizes = {
  sm: { width: 80,  height: 22, fontSize: 18, diamond: [12,1,16,6,12,11,8,6]  },
  md: { width: 120, height: 32, fontSize: 26, diamond: [18,1,23,7,18,13,13,7] },
  lg: { width: 180, height: 48, fontSize: 38, diamond: [28,2,34,10,28,18,22,10] },
  xl: { width: 260, height: 60, fontSize: 48, diamond: [36,3,43,12,36,21,29,12] },
};

const textColors = {
  dark:     '#FFFFFF',
  light:    '#1A1B2E',
  white:    '#1A1B2E',
  gradient: '#FFFFFF',
  mono:     '#1A1B2E',
};

const diamondColors = {
  dark:     '#2EE895',
  light:    '#2EE895',
  white:    '#2EE895',
  gradient: 'rgba(255,255,255,0.9)',
  mono:     '#1A1B2E',
};

export function GleaumLogo({
  variant = 'dark',
  size = 'md',
  showTagline = false,
  className = '',
}: GleaumLogoProps) {
  const s = sizes[size];
  const [dx1,dy1,dx2,dy2,dx3,dy3,dx4,dy4] = s.diamond;
  const points = `${dx1},${dy1} ${dx2},${dy2} ${dx3},${dy3} ${dx4},${dy4}`;

  return (
    <div className={`flex flex-col items-start gap-1 ${className}`}>
      <svg
        width={s.width}
        height={s.height}
        viewBox={`0 0 ${s.width} ${s.height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="글리움 로고"
      >
        <polygon points={points} fill={diamondColors[variant]} />
        <text
          x="0"
          y={s.height - 4}
          fontFamily="DM Sans, sans-serif"
          fontSize={s.fontSize}
          fontWeight="300"
          fill={textColors[variant]}
          letterSpacing="-0.02em"
        >
          gleaum
        </text>
      </svg>
      {showTagline && (
        <span
          style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: '11px',
            color: variant === 'dark' || variant === 'gradient' ? '#6E6E66' : '#AEAEA8',
            fontWeight: 300,
            letterSpacing: '0.01em',
          }}
        >
          반짝이는 글이 모여있는 공간
        </span>
      )}
    </div>
  );
}

// ── 앱 아이콘 (gleaum_design_system.html 정확히 재현) ──
interface AppIconProps {
  size?: number;
  radius?: number;
  className?: string;
}

export function GleaumAppIcon({ size = 48, radius, className = '' }: AppIconProps) {
  const r = radius ?? Math.round(size * 0.22);
  const id = `grad-${size}`;
  return (
    <div
      className={className}
      style={{ width: size, height: size, borderRadius: r, overflow: 'hidden', flexShrink: 0 }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${id}-1`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#2EE895" />
            <stop offset="50%"  stopColor="#0CC9B5" />
            <stop offset="100%" stopColor="#0084CC" />
          </linearGradient>
          <linearGradient id={`${id}-2`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#1DC878" />
            <stop offset="100%" stopColor="#0AA8A0" />
          </linearGradient>
          <linearGradient id={`${id}-3`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#0AA8A0" />
            <stop offset="100%" stopColor="#006BAA" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="#0A0A0A" />
        <polygon points="50,70 78,56 50,42 22,56" fill={`url(#${id}-3)`} opacity="0.7" />
        <polygon points="50,60 78,46 50,32 22,46" fill={`url(#${id}-2)`} opacity="0.85" />
        <polygon points="50,50 78,36 50,22 22,36" fill={`url(#${id}-1)`} />
        <polygon points="47,38 42,50 49,48 43,62 58,46 51,48 57,34" fill="rgba(255,255,255,0.15)" />
      </svg>
    </div>
  );
}
