import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 gap-6"
      style={{ background: 'transparent' }}
    >
      {/* 404 아이콘 */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(0,132,204,0.08)' }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--brand-blue)" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      </div>

      {/* 404 텍스트 */}
      <div className="text-center">
        <p
          className="text-[72px] font-black leading-none mb-3"
          style={{
            background: 'var(--brand-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          404
        </p>
        <h1 className="text-[22px] font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
          페이지를 찾을 수 없어요
        </h1>
        <p className="text-[14px] leading-relaxed" style={{ color: 'var(--color-ink-muted-80)' }}>
          요청하신 페이지가 존재하지 않거나<br/>이동되었을 수 있습니다.
        </p>
      </div>

      <Link
        href="/home"
        className="h-[52px] px-8 rounded-full text-[15px] font-bold text-white flex items-center justify-center active:scale-95 transition-all"
        style={{
          background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
          boxShadow: '0 8px 24px rgba(0,132,204,0.30)',
        }}
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
