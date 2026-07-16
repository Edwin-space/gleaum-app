export type BoundarySpaceRole = 'admin' | 'editor' | 'viewer';
export type BoundaryVisibility = 'private' | 'space' | 'selected' | null;
export type BoundaryLedgerScope = 'personal' | 'space';

export interface BoundaryActor {
  userId: string;
  spaceIds: readonly string[];
}

export function canEditSpace(role: BoundarySpaceRole | null | undefined): boolean {
  return role === 'admin' || role === 'editor';
}

export function canReadScheduleBoundary(
  actor: BoundaryActor,
  schedule: { spaceId: string; createdBy: string; visibility: BoundaryVisibility },
): boolean {
  if (!actor.spaceIds.includes(schedule.spaceId)) return false;
  return schedule.visibility !== 'private' || schedule.createdBy === actor.userId;
}

export function canReadLedgerBoundary(
  actor: BoundaryActor,
  entry: { spaceId: string; ownerId: string; scope: BoundaryLedgerScope },
): boolean {
  if (!actor.spaceIds.includes(entry.spaceId)) return false;
  return entry.scope === 'space' || entry.ownerId === actor.userId;
}

export function resolveScheduleTargetSpace(input: {
  type: string;
  visibility: BoundaryVisibility;
  requestedSpaceId?: string;
  personalSpaceId: string | null;
  activeSpaceId: string | null;
}): string | null {
  const sharedSpaceId = input.activeSpaceId && input.activeSpaceId !== input.personalSpaceId
    ? input.activeSpaceId
    : null;
  const isPrivateTarget = input.type === 'personal' || input.visibility === 'private';

  if (isPrivateTarget) {
    return input.personalSpaceId ?? (sharedSpaceId ? null : input.activeSpaceId);
  }

  return input.requestedSpaceId ?? sharedSpaceId;
}
