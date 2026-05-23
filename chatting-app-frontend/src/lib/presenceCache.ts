import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { ChatListItem, User } from "@/types";

export interface UserPresencePayload {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
}

export function applyUserPresence(
  queryClient: QueryClient,
  { userId, isOnline, lastSeen }: UserPresencePayload,
): void {
  queryClient.setQueryData<User | undefined>(queryKeys.user(userId), (prev) =>
    prev ? { ...prev, isOnline, lastSeen: lastSeen ?? prev.lastSeen } : prev,
  );

  queryClient.setQueryData<ChatListItem[]>(queryKeys.chats, (prev) => {
    if (!prev) return prev;
    return prev.map((chat) =>
      chat.user.id === userId
        ? {
            ...chat,
            user: {
              ...chat.user,
              isOnline,
              lastSeen: lastSeen ?? chat.user.lastSeen,
            },
          }
        : chat,
    );
  });

  queryClient.setQueryData<User[]>(queryKeys.friends, (prev) => {
    if (!prev) return prev;
    return prev.map((u) =>
      u.id === userId ? { ...u, isOnline, lastSeen: lastSeen ?? u.lastSeen } : u,
    );
  });
}
