import { SpaceChildrenManager } from './SpaceChildrenManager';

export function MobileSpaceChildren({ spaceId }: { spaceId: string }) {
  return <SpaceChildrenManager desktop={false} spaceId={spaceId} />;
}
