"use client";

import { useCallback, useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { CreatePost } from "@/components/CreatePost";
import { PostCard } from "@/components/PostCard";
import { PageHeader } from "@/components/PageHeader";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Post, ApiResponse } from "@/types";

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchFeed = useCallback(async (pageNum: number, append = false) => {
    const res = await api<
      ApiResponse<{
        posts: Post[];
        pagination: { page: number; totalPages: number };
      }>
    >(`/posts?page=${pageNum}&limit=10`);

    setPosts((prev) => (append ? [...prev, ...res.data.posts] : res.data.posts));
    setHasMore(res.data.pagination.page < res.data.pagination.totalPages);
    setPage(pageNum);
  }, []);

  useEffect(() => {
    fetchFeed(1).finally(() => setLoading(false));
  }, [fetchFeed]);

  const handlePostCreated = (post: Post) => {
    setPosts((prev) => [post, ...prev]);
  };

  const handlePostUpdate = (postId: string, updates: Partial<Post>) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, ...updates } : p))
    );
  };

  const handlePostRemove = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      await fetchFeed(page + 1, true);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-shell">
        <PageHeader
          title="News Feed"
          subtitle="Share updates and see what everyone is posting"
        />
        <div className="page-content">
          <div className="page-container mx-auto max-w-2xl space-y-4 sm:space-y-6">
            <CreatePost onPostCreated={handlePostCreated} />

            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner />
              </div>
            ) : posts.length === 0 ? (
              <EmptyState
                title="No posts yet"
                description="Be the first to share something with the community!"
                icon={
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
                  </svg>
                }
              />
            ) : (
              <>
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onUpdate={handlePostUpdate}
                      onRemove={handlePostRemove}
                      currentUserId={user?.id}
                    />
                  ))}
                </div>
                {hasMore && (
                  <div className="flex justify-center pb-4">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="btn-secondary"
                    >
                      {loadingMore ? "Loading..." : "Load more posts"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
