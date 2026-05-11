'use client';

import { useIsDesktop } from '@/hooks/useMediaQuery';
import { MobileSpace } from './MobileSpace';
import { DesktopSpace } from './DesktopSpace';

export default function SpacePage() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <DesktopSpace /> : <MobileSpace />;
}
