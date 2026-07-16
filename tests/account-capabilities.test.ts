import assert from 'node:assert/strict';
import test from 'node:test';
import {
  capabilitiesForAccountMode,
  hasAccountCapability,
  isManagedMinorAccountMode,
} from '../src/lib/account-capabilities';
import type { AccountMode, AccountSessionContext } from '../src/types';

const restrictedModes: AccountMode[] = [
  'pending_guardian_consent',
  'child_managed',
  'teen_consent_pending',
  'teen',
];

test('managed and minor modes cannot manage spaces, use budget, invite, or see ads', () => {
  for (const mode of restrictedModes) {
    assert.equal(isManagedMinorAccountMode(mode), true, mode);
    const capabilities = capabilitiesForAccountMode(mode);
    assert.equal(capabilities.canManageSpaces, false, mode);
    assert.equal(capabilities.canInviteMembers, false, mode);
    assert.equal(capabilities.canViewHouseholdBudget, false, mode);
    assert.equal(capabilities.canShowAds, false, mode);
  }
});

test('adult mode enables general features and advertising', () => {
  assert.equal(isManagedMinorAccountMode('adult'), false);
  const capabilities = capabilitiesForAccountMode('adult');
  assert.equal(capabilities.canManageSpaces, true);
  assert.equal(capabilities.canInviteMembers, true);
  assert.equal(capabilities.canViewHouseholdBudget, true);
  assert.equal(capabilities.canShowAds, true);
});

test('unknown mode preserves general features but defaults advertising off', () => {
  assert.equal(isManagedMinorAccountMode('unknown'), false);
  const capabilities = capabilitiesForAccountMode('unknown');
  assert.equal(capabilities.canManageSpaces, true);
  assert.equal(capabilities.canInviteMembers, true);
  assert.equal(capabilities.canViewHouseholdBudget, true);
  assert.equal(capabilities.canShowAds, false);
});

test('missing session context fails closed', () => {
  assert.equal(hasAccountCapability(null, 'canManageSpaces'), false);
  const context: AccountSessionContext = {
    accountMode: 'adult',
    familyMemberships: [],
    capabilities: capabilitiesForAccountMode('adult'),
  };
  assert.equal(hasAccountCapability(context, 'canManageSpaces'), true);
});
