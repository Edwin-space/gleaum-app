'use client';

import { useIsDesktop } from '@/hooks/useMediaQuery';
import { MobileChildren } from './MobileChildren';
import { DesktopChildren } from './DesktopChildren';

export default function ChildrenSchedulePage() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <DesktopChildren /> : <MobileChildren />;
}
