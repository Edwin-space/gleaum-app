import { SpaceChildrenManager } from './SpaceChildrenManager';

export function DesktopSpaceChildren({ spaceId }: { spaceId: string }) {
  return <SpaceChildrenManager desktop spaceId={spaceId} />;
}
