"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { CreatePost } from "@/components/CreatePost";
import { PostCard } from "@/components/PostCard";
import { PageHeader } from "@/components/PageHeader";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { queryKeys } from "@/lib/queryKeys";
import { useFeedInfiniteQuery } from "@/hooks/queries";
import { useAuth } from "@/context/AuthContext";
import type { Post } from "@/types";

export default function FeedPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeedInfiniteQuery();

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  const handlePostCreated = (post: Post) => {
    queryClient.setQueryData(
      queryKeys.feed,
      (
        old:
          | {
              pages: { posts: Post[]; pagination: { page: number; totalPages: number } }[];
              pageParams: number[];
            }
          | undefined,
      ) => {
        if (!old?.pages.length) return old;
        return {
          ...old,
          pages: old.pages.map((page, i) =>
            i === 0 ? { ...page, posts: [post, ...page.posts] } : page,
          ),
        };
      },
    );
  };

  const handlePostUpdate = (postId: string, updates: Partial<Post>) => {
    queryClient.setQueryData(
      queryKeys.feed,
      (
        old:
          | {
              pages: { posts: Post[]; pagination: { page: number; totalPages: number } }[];
              pageParams: number[];
            }
          | undefined,
      ) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p) =>
              p.id === postId ? { ...p, ...updates } : p,
            ),
          })),
        };
      },
    );
  };

  const handlePostRemove = (postId: string) => {
    queryClient.setQueryData(
      queryKeys.feed,
      (
        old:
          | {
              pages: { posts: Post[]; pagination: { page: number; totalPages: number } }[];
              pageParams: number[];
            }
          | undefined,
      ) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.filter((p) => p.id !== postId),
          })),
        };
      },
    );
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

            {isLoading ? (
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
                {hasNextPage && (
                  <div className="flex justify-center pb-4">
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="btn-secondary"
                    >
                      {isFetchingNextPage ? "Loading..." : "Load more posts"}
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
