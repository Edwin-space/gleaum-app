'use client';

import { useSearchParams } from 'next/navigation';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { DesktopGuardianVerify } from './DesktopGuardianVerify';
import { MobileGuardianVerify } from './MobileGuardianVerify';

export default function GuardianVerifyPage() {
  const isDesktop = useIsDesktop();
  const token = useSearchParams().get('token')?.trim() ?? '';
  return isDesktop
    ? <DesktopGuardianVerify token={token} />
    : <MobileGuardianVerify token={token} />;
}
