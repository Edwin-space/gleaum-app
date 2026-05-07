'use client';

import { useIsDesktop } from '@/hooks/useMediaQuery';
import { MobileFamily } from './MobileFamily';
import { DesktopFamily } from './DesktopFamily';

export default function FamilyPage() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <DesktopFamily /> : <MobileFamily />;
}
