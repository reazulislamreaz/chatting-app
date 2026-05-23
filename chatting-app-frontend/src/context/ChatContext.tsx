"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuth } from "./AuthContext";
import type { ChatListItem, Message, ApiResponse } from "@/types";

interface ChatContextType {
  chatList: ChatListItem[];
  loading: boolean;
  refreshChatList: () => Promise<void>;
  typingUsers: Record<string, boolean>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [chatList, setChatList] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  const refreshChatList = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api<ApiResponse<ChatListItem[]>>("/chats");
      setChatList(res.data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshChatList();
    }
  }, [user, refreshChatList]);

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();

    const onReceiveMessage = (message: Message) => {
      setChatList((prev) => {
        const otherId =
          message.senderId === user.id ? message.receiverId : message.senderId;
        const existing = prev.find((c) => c.user.id === otherId);

        if (!existing) {
          refreshChatList();
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
                content: message.content,
                imageUrl: message.imageUrl,
                isDeleted: message.isDeleted,
                senderId: message.senderId,
                createdAt: message.createdAt,
                read: message.read,
              },
              unreadCount: isIncoming ? chat.unreadCount + 1 : chat.unreadCount,
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

    const onMessagesRead = () => {
      refreshChatList();
    };

    const onTyping = (data: { userId: string; isTyping: boolean }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [data.userId]: data.isTyping,
      }));
    };

    socket.on("receive_message", onReceiveMessage);
    socket.on("messages_read", onMessagesRead);
    socket.on("typing", onTyping);

    return () => {
      socket.off("receive_message", onReceiveMessage);
      socket.off("messages_read", onMessagesRead);
      socket.off("typing", onTyping);
    };
  }, [user, refreshChatList]);

  return (
    <ChatContext.Provider
      value={{ chatList, loading, refreshChatList, typingUsers }}
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
