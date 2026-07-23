import { ChildInvitationPanel } from './ChildInvitationPanel';

export function MobileChildInvitation({ token }: { token: string }) {
  return <ChildInvitationPanel token={token} desktop={false} />;
}
