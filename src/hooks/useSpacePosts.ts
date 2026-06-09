'use client';
import { useState, useEffect, useCallback } from 'react';
import { getSpacePosts, createSpacePost, deleteSpacePost, type CreateSpacePostInput } from '@/lib/db';
import type { SpacePost } from '@/types';

export function useSpacePosts(spaceId: string | null) {
  const [posts, setPosts]     = useState<SpacePost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!spaceId) { setLoading(false); return; }
    setLoading(true);
    const data = await getSpacePosts(spaceId);
    setPosts(data);
    setLoading(false);
  }, [spaceId]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const create = async (input: CreateSpacePostInput) => {
    if (!spaceId) return null;
    const post = await createSpacePost(spaceId, input);
    if (post) setPosts(prev => [post, ...prev]);
    return post;
  };

  const remove = async (postId: string) => {
    const ok = await deleteSpacePost(postId);
    if (ok) setPosts(prev => prev.filter(p => p.id !== postId));
    return ok;
  };

  return { posts, loading, refresh: load, create, remove };
}
