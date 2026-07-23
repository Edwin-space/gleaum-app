'use client';

import { useParams } from 'next/navigation';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { DesktopChildInvitation } from './DesktopChildInvitation';
import { MobileChildInvitation } from './MobileChildInvitation';

export default function ChildInvitationPage() {
  const isDesktop = useIsDesktop();
  const params = useParams<{ token: string }>();
  const token = typeof params.token === 'string' ? params.token.trim() : '';
  return isDesktop
    ? <DesktopChildInvitation token={token} />
    : <MobileChildInvitation token={token} />;
}
