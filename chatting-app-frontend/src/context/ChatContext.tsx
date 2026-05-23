"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { queryKeys } from "@/lib/queryKeys";
import { invalidateChats } from "@/lib/invalidateCache";
import {
  applyUserPresence,
  type UserPresencePayload,
} from "@/lib/presenceCache";
import { useChatsQuery } from "@/hooks/queries";
import { useAuth } from "./AuthContext";
import type { ChatListItem, Message } from "@/types";

interface ChatContextType {
  chatList: ChatListItem[];
  loading: boolean;
  isFetching: boolean;
  refreshChatList: () => Promise<void>;
  typingUsers: Record<string, boolean>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    data: chatList = [],
    isPending,
    isFetching,
    refetch,
  } = useChatsQuery(!!user);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const typingClearTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );

  const refreshChatList = useCallback(async () => {
    await refetch();
  }, [refetch]);

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();

    const onReceiveMessage = (message: Message) => {
      queryClient.setQueryData<ChatListItem[]>(queryKeys.chats, (prev) => {
        if (!prev) return prev;

        const otherId =
          message.senderId === user.id ? message.receiverId : message.senderId;
        const existing = prev.find((c) => c.user.id === otherId);

        if (!existing) {
          void invalidateChats(queryClient);
          return prev;
        }

        return prev
          .map((chat) => {
            if (chat.user.id !== otherId) return chat;
            const isIncoming = message.senderId !== user.id;
            return {
              ...chat,
              lastMessage: {
                id: message.id,
                messageType: message.messageType,
                content: message.content,
                imageUrl: message.imageUrl,
                voiceUrl: message.voiceUrl,
                voiceDuration: message.voiceDuration,
                callStatus: message.callStatus,
                callDuration: message.callDuration,
                isDeleted: message.isDeleted,
                senderId: message.senderId,
                createdAt: message.createdAt,
                read: message.read,
              },
              unreadCount:
                isIncoming && message.messageType !== "call"
                  ? chat.unreadCount + 1
                  : chat.unreadCount,
            };
          })
          .sort((a, b) => {
            const aTime = a.lastMessage?.createdAt
              ? new Date(a.lastMessage.createdAt).getTime()
              : 0;
            const bTime = b.lastMessage?.createdAt
              ? new Date(b.lastMessage.createdAt).getTime()
              : 0;
            return bTime - aTime;
          });
      });
    };

    const onMessagesRead = (data: { readerId: string }) => {
      queryClient.setQueryData<ChatListItem[]>(queryKeys.chats, (prev) => {
        if (!prev) return prev;
        return prev.map((chat) =>
          chat.user.id === data.readerId && chat.lastMessage
            ? {
                ...chat,
                lastMessage: { ...chat.lastMessage, read: true },
              }
            : chat,
        );
      });
    };

    const onTyping = (data: { userId: string; isTyping: boolean }) => {
      const { userId: typerId } = data;

      if (typingClearTimers.current[typerId]) {
        clearTimeout(typingClearTimers.current[typerId]);
        delete typingClearTimers.current[typerId];
      }

      setTypingUsers((prev) => ({
        ...prev,
        [typerId]: data.isTyping,
      }));

      if (data.isTyping) {
        typingClearTimers.current[typerId] = setTimeout(() => {
          setTypingUsers((prev) => ({ ...prev, [typerId]: false }));
          delete typingClearTimers.current[typerId];
        }, 3000);
      }
    };

    const onUserPresence = (payload: UserPresencePayload) => {
      applyUserPresence(queryClient, payload);
    };

    socket.on("receive_message", onReceiveMessage);
    socket.on("messages_read", onMessagesRead);
    socket.on("typing", onTyping);
    socket.on("user_presence", onUserPresence);

    return () => {
      socket.off("receive_message", onReceiveMessage);
      socket.off("messages_read", onMessagesRead);
      socket.off("typing", onTyping);
      socket.off("user_presence", onUserPresence);
      Object.values(typingClearTimers.current).forEach(clearTimeout);
      typingClearTimers.current = {};
    };
  }, [user, queryClient]);

  return (
    <ChatContext.Provider
      value={{
        chatList,
        loading: isPending,
        isFetching,
        refreshChatList,
        typingUsers,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
}
