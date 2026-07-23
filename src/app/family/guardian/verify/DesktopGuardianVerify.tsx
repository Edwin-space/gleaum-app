import { GuardianConsentPanel } from './GuardianConsentPanel';

export function DesktopGuardianVerify({ token }: { token: string }) {
  return <GuardianConsentPanel token={token} desktop />;
}
