import type { QueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { ApiResponse, ChatListItem, Message, User } from "@/types";

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
  void qc.prefetchQuery({
    queryKey: queryKeys.messages(otherUserId),
    queryFn: async () => {
      const res = await api<ApiResponse<{ messages: Message[] }>>(
        `/messages/${otherUserId}?limit=100`,
      );
      return res.data.messages;
    },
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
