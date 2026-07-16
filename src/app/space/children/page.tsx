'use client';

import { useSearchParams } from 'next/navigation';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { DesktopSpaceChildren } from './DesktopSpaceChildren';
import { MobileSpaceChildren } from './MobileSpaceChildren';

export default function SpaceChildrenPage() {
  const isDesktop = useIsDesktop();
  const searchParams = useSearchParams();
  const spaceId = searchParams.get('sid')?.trim() ?? '';

  if (!spaceId) {
    return <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: 'var(--theme-bg)', color: 'var(--theme-text-muted)' }}>가족 공간 정보가 필요합니다.</main>;
  }
  return isDesktop
    ? <DesktopSpaceChildren spaceId={spaceId} />
    : <MobileSpaceChildren spaceId={spaceId} />;
}
