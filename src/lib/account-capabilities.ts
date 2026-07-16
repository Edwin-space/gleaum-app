import type { AccountCapabilities, AccountMode, AccountSessionContext } from '@/types';

export type AccountCapability = keyof AccountCapabilities;

export function isManagedMinorAccountMode(mode: AccountMode): boolean {
  return mode === 'pending_guardian_consent'
    || mode === 'child_managed'
    || mode === 'teen_consent_pending'
    || mode === 'teen';
}

export const DENIED_ACCOUNT_CAPABILITIES: Readonly<AccountCapabilities> = Object.freeze({
  canManageSpaces: false,
  canInviteMembers: false,
  canViewHouseholdBudget: false,
  canCompleteRoutine: false,
  canUseCheckIn: false,
  canRequestLocationPermission: false,
  canShowAds: false,
});

export function capabilitiesForAccountMode(mode: AccountMode): AccountCapabilities {
  const isRestricted = isManagedMinorAccountMode(mode);

  return {
    canManageSpaces: !isRestricted,
    canInviteMembers: !isRestricted,
    canViewHouseholdBudget: !isRestricted,
    canCompleteRoutine: true,
    canUseCheckIn: mode === 'child_managed' || mode === 'teen',
    canRequestLocationPermission: false,
    canShowAds: mode === 'adult',
  };
}

export function hasAccountCapability(
  context: AccountSessionContext | null | undefined,
  capability: AccountCapability,
): boolean {
  return context?.capabilities[capability] === true;
}
