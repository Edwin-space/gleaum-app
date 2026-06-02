'use client';

import { useIsDesktop } from '@/hooks/useMediaQuery';
import { DesktopSecuritySettings } from './DesktopSecuritySettings';
import { MobileSecuritySettings } from './MobileSecuritySettings';

export default function SecuritySettingsPage() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <DesktopSecuritySettings /> : <MobileSecuritySettings />;
}
