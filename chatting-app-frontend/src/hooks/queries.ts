"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type {
  ApiResponse,
  ChatListItem,
  FriendRequest,
  Message,
  Post,
  User,
} from "@/types";

type FeedPage = {
  posts: Post[];
  pagination: { page: number; totalPages: number };
};

export function useChatsQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.chats,
    queryFn: async () => {
      const res = await api<ApiResponse<ChatListItem[]>>("/chats");
      return res.data;
    },
    enabled,
    staleTime: 30 * 1000,
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
    staleTime: 3 * 60 * 1000,
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
    staleTime: 2 * 60 * 1000,
  });
}

export function useFeedInfiniteQuery() {
  return useInfiniteQuery({
    queryKey: queryKeys.feed,
    queryFn: async ({ pageParam }) => {
      const res = await api<ApiResponse<FeedPage>>(
        `/posts?page=${pageParam}&limit=10`,
      );
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages
        ? last.pagination.page + 1
        : undefined,
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
    staleTime: 60 * 1000,
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
    staleTime: 30 * 1000,
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
    staleTime: 30 * 1000,
  });
}

export function useMessagesQuery(otherUserId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.messages(otherUserId),
    queryFn: async () => {
      const res = await api<ApiResponse<{ messages: Message[] }>>(
        `/messages/${otherUserId}?limit=100`,
      );
      return res.data.messages;
    },
    enabled: enabled && !!otherUserId,
    staleTime: 30 * 1000,
  });
}
