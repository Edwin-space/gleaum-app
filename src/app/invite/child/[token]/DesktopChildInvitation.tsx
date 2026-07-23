import { ChildInvitationPanel } from './ChildInvitationPanel';

export function DesktopChildInvitation({ token }: { token: string }) {
  return <ChildInvitationPanel token={token} desktop />;
}
