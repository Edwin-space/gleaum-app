import { GuardianConsentPanel } from './GuardianConsentPanel';

export function MobileGuardianVerify({ token }: { token: string }) {
  return <GuardianConsentPanel token={token} desktop={false} />;
}
