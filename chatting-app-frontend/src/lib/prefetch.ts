import type { QueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiResponse, ChatListItem, User } from "@/types";
import type { MessagesPage } from "@/hooks/queries";

export function prefetchUserProfile(qc: QueryClient, userId: string) {
  if (!userId) return;
  void qc.prefetchQuery({
    queryKey: queryKeys.user(userId),
    queryFn: async () => {
      const res = await api<ApiResponse<User>>(`/users/${userId}`);
      return res.data;
    },
    staleTime: 3 * 60 * 1000,
  });
}

export function prefetchMessages(qc: QueryClient, otherUserId: string) {
  if (!otherUserId) return;
  void qc.prefetchInfiniteQuery({
    queryKey: queryKeys.messages(otherUserId),
    queryFn: async () => {
      const res = await api<ApiResponse<MessagesPage>>(
        `/messages/${otherUserId}?limit=30`,
      );
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.pagination.hasMore ? last.pagination.nextCursor : undefined,
    pages: 1,
    staleTime: 30 * 1000,
  });
}

export function prefetchChats(qc: QueryClient) {
  void qc.prefetchQuery({
    queryKey: queryKeys.chats,
    queryFn: async () => {
      const res = await api<ApiResponse<ChatListItem[]>>("/chats");
      return res.data;
    },
    staleTime: 30 * 1000,
  });
}
