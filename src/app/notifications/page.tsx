'use client';

import { useIsDesktop } from '@/hooks/useMediaQuery';
import { MobileNotifications } from './MobileNotifications';
import { DesktopNotifications } from './DesktopNotifications';

export default function NotificationsPage() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <DesktopNotifications /> : <MobileNotifications />;
}
