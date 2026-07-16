import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canEditSpace,
  canReadLedgerBoundary,
  canReadScheduleBoundary,
  resolveScheduleTargetSpace,
} from '../src/lib/data-boundaries';

const owner = { userId: 'owner', spaceIds: ['personal-owner', 'shared'] } as const;
const member = { userId: 'member', spaceIds: ['personal-member', 'shared'] } as const;
const outsider = { userId: 'outsider', spaceIds: ['personal-outsider'] } as const;

test('private schedules stay visible only to their creator even inside a shared space', () => {
  const privateSchedule = { spaceId: 'shared', createdBy: 'owner', visibility: 'private' } as const;

  assert.equal(canReadScheduleBoundary(owner, privateSchedule), true);
  assert.equal(canReadScheduleBoundary(member, privateSchedule), false);
  assert.equal(canReadScheduleBoundary(outsider, privateSchedule), false);
});

test('shared schedules require membership but are visible to every member role', () => {
  const sharedSchedule = { spaceId: 'shared', createdBy: 'owner', visibility: 'space' } as const;

  assert.equal(canReadScheduleBoundary(owner, sharedSchedule), true);
  assert.equal(canReadScheduleBoundary(member, sharedSchedule), true);
  assert.equal(canReadScheduleBoundary(outsider, sharedSchedule), false);
});

test('personal ledger entries never leak to another member of the same space', () => {
  const personalEntry = { spaceId: 'shared', ownerId: 'owner', scope: 'personal' } as const;

  assert.equal(canReadLedgerBoundary(owner, personalEntry), true);
  assert.equal(canReadLedgerBoundary(member, personalEntry), false);
  assert.equal(canReadLedgerBoundary(outsider, personalEntry), false);
});

test('space ledger entries require membership and remain separate from outsiders', () => {
  const spaceEntry = { spaceId: 'shared', ownerId: 'owner', scope: 'space' } as const;

  assert.equal(canReadLedgerBoundary(owner, spaceEntry), true);
  assert.equal(canReadLedgerBoundary(member, spaceEntry), true);
  assert.equal(canReadLedgerBoundary(outsider, spaceEntry), false);
});

test('only admin and editor roles can mutate shared space content', () => {
  assert.equal(canEditSpace('admin'), true);
  assert.equal(canEditSpace('editor'), true);
  assert.equal(canEditSpace('viewer'), false);
  assert.equal(canEditSpace(null), false);
});

test('personal schedules always target the personal space', () => {
  assert.equal(resolveScheduleTargetSpace({
    type: 'personal',
    visibility: 'private',
    requestedSpaceId: 'shared',
    personalSpaceId: 'personal-owner',
    activeSpaceId: 'shared',
  }), 'personal-owner');
});

test('missing personal space never falls back to an active shared space', () => {
  assert.equal(resolveScheduleTargetSpace({
    type: 'personal',
    visibility: 'private',
    requestedSpaceId: 'shared',
    personalSpaceId: null,
    activeSpaceId: 'shared',
  }), null);
});

test('shared schedules target the requested shared space', () => {
  assert.equal(resolveScheduleTargetSpace({
    type: 'shared',
    visibility: 'space',
    requestedSpaceId: 'shared-two',
    personalSpaceId: 'personal-owner',
    activeSpaceId: 'shared-one',
  }), 'shared-two');
});
