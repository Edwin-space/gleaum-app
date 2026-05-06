// 전역 로딩 페이지 — Next.js App Router loading.tsx
// Glassmorphism + 브랜드 스피너

export default function Loading() {
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center gap-6"
      style={{ background: 'transparent' }}
    >
      {/* 브랜드 스피너 */}
      <div className="relative w-16 h-16">
        {/* 외부 링 */}
        <div
          className="absolute inset-0 rounded-full border-[3px] border-t-transparent animate-spin"
          style={{
            borderColor: 'rgba(0,132,204,0.15)',
            borderTopColor: '#0084CC',
            animationDuration: '0.9s',
          }}
        />
        {/* 내부 링 */}
        <div
          className="absolute inset-[6px] rounded-full border-[3px] border-t-transparent animate-spin"
          style={{
            borderColor: 'rgba(12,201,181,0.15)',
            borderTopColor: '#0CC9B5',
            animationDuration: '1.3s',
            animationDirection: 'reverse',
          }}
        />
        {/* 중앙 점 */}
        <div
          className="absolute inset-[14px] rounded-full"
          style={{ background: 'var(--brand-gradient)' }}
        />
      </div>

      <p className="text-[14px] font-medium" style={{ color: 'var(--color-ink-muted-80)' }}>
        불러오는 중...
      </p>
    </div>
  );
}
