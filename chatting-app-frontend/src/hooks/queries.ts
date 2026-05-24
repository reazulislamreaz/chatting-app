"use client";

import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type {
  ApiResponse,
  ChatListItem,
  FriendRequest,
  Message,
  Post,
  PostComment,
  User,
} from "@/types";

const MESSAGE_PAGE_SIZE = 30;
const FEED_PAGE_SIZE = 10;
const COMMENT_PAGE_SIZE = 20;

type FeedPage = {
  posts: Post[];
  pagination: { page: number; totalPages: number };
};

export type MessagesPage = {
  messages: Message[];
  pagination: {
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
    page?: number;
    total?: number;
    totalPages?: number;
  };
};

type CommentsPage = {
  comments: PostComment[];
  pagination: { page: number; totalPages: number; limit: number; total: number };
};

export function flattenMessagePages(
  pages: MessagesPage[] | undefined,
): Message[] {
  if (!pages?.length) return [];
  return pages
    .slice()
    .reverse()
    .flatMap((page) => page.messages);
}

export function useChatsQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.chats,
    queryFn: async () => {
      const res = await api<ApiResponse<ChatListItem[]>>("/chats");
      return res.data;
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useUsersQuery(search: string) {
  return useQuery({
    queryKey: queryKeys.users(search),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("limit", "30");
      const res = await api<ApiResponse<{ users: User[] }>>(
        `/users?${params.toString()}`,
      );
      return res.data.users;
    },
    staleTime: 2 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useUserQuery(userId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.user(userId),
    queryFn: async () => {
      const res = await api<ApiResponse<User>>(`/users/${userId}`);
      return res.data;
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProfileQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const res = await api<ApiResponse<User>>("/users/profile");
      return res.data;
    },
    enabled,
    staleTime: 3 * 60 * 1000,
  });
}

export function useFeedInfiniteQuery() {
  return useInfiniteQuery({
    queryKey: queryKeys.feed,
    queryFn: async ({ pageParam }) => {
      const res = await api<ApiResponse<FeedPage>>(
        `/posts?page=${pageParam}&limit=${FEED_PAGE_SIZE}`,
      );
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages
        ? last.pagination.page + 1
        : undefined,
    staleTime: 90 * 1000,
  });
}

export function useCommentsInfiniteQuery(postId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: queryKeys.comments(postId),
    queryFn: async ({ pageParam }) => {
      const res = await api<ApiResponse<CommentsPage>>(
        `/posts/${postId}/comments?page=${pageParam}&limit=${COMMENT_PAGE_SIZE}`,
      );
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages
        ? last.pagination.page + 1
        : undefined,
    enabled: enabled && !!postId,
    staleTime: 60 * 1000,
  });
}

export function useFriendsQuery() {
  return useQuery({
    queryKey: queryKeys.friends,
    queryFn: async () => {
      const res = await api<ApiResponse<User[]>>("/friend-requests/friends");
      return res.data;
    },
    staleTime: 90 * 1000,
  });
}

export function useFriendReceivedQuery() {
  return useQuery({
    queryKey: queryKeys.friendReceived,
    queryFn: async () => {
      const res = await api<ApiResponse<FriendRequest[]>>(
        "/friend-requests/received",
      );
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useFriendSentQuery() {
  return useQuery({
    queryKey: queryKeys.friendSent,
    queryFn: async () => {
      const res = await api<ApiResponse<FriendRequest[]>>(
        "/friend-requests/sent",
      );
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useMessagesInfiniteQuery(otherUserId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.messages(otherUserId),
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        limit: String(MESSAGE_PAGE_SIZE),
      });
      if (pageParam) {
        params.set("before", pageParam);
      }
      const res = await api<ApiResponse<MessagesPage>>(
        `/messages/${otherUserId}?${params.toString()}`,
      );
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.pagination.hasMore ? last.pagination.nextCursor : undefined,
    enabled: enabled && !!otherUserId,
    staleTime: 60 * 1000,
  });
}

export type MessagesInfiniteData = InfiniteData<MessagesPage, string | undefined>;
