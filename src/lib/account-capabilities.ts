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
    // 기존 일반 계정은 가족/자녀 기능 도입 전에 생성되어 연령 프로필이 없고
    // `unknown`으로 분류된다. 제한 계정은 항상 명시적인 managed mode를 가지므로
    // 일반 기능과 동일하게 unknown을 레거시 표준 계정으로 취급한다.
    canShowAds: !isRestricted,
  };
}

export function hasAccountCapability(
  context: AccountSessionContext | null | undefined,
  capability: AccountCapability,
): boolean {
  return context?.capabilities[capability] === true;
}
