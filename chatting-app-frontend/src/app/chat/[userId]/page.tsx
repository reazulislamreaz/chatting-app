"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { Avatar } from "@/components/Avatar";
import { Spinner } from "@/components/Spinner";
import { ChatComposer } from "@/components/ChatComposer";
import { MessageBubble } from "@/components/MessageBubble";
import { EditMessageModal } from "@/components/EditMessageModal";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import type { User, Message, ApiResponse } from "@/types";
import { toastError, toastSuccess } from "@/lib/toast";

export default function ChatPage() {
  const params = useParams();
  const otherUserId = params.userId as string;
  const { user } = useAuth();
  const { refreshChatList, typingUsers } = useChat();

  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const appendMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  const replaceMessage = useCallback((message: Message) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === message.id ? message : m))
    );
  }, []);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, messagesRes] = await Promise.all([
        api<ApiResponse<User>>(`/users/${otherUserId}`),
        api<ApiResponse<{ messages: Message[] }>>(
          `/messages/${otherUserId}?limit=100`
        ),
      ]);
      setOtherUser(userRes.data);
      setMessages(messagesRes.data.messages);

      const socket = getSocket();
      socket.emit("message_read", { senderId: otherUserId });
      await api("/messages/read", {
        method: "PATCH",
        body: JSON.stringify({ senderId: otherUserId }),
      });
      refreshChatList();
    } finally {
      setLoading(false);
    }
  }, [otherUserId, refreshChatList]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();

    const onReceiveMessage = (message: Message) => {
      if (
        (message.senderId === otherUserId && message.receiverId === user.id) ||
        (message.senderId === user.id && message.receiverId === otherUserId)
      ) {
        appendMessage(message);

        if (message.senderId === otherUserId) {
          socket.emit("message_read", { senderId: otherUserId });
          api("/messages/read", {
            method: "PATCH",
            body: JSON.stringify({ senderId: otherUserId }),
          }).catch(() => {});
        }
      }
    };

    const onMessageUpdated = (message: Message) => {
      if (
        (message.senderId === otherUserId && message.receiverId === user.id) ||
        (message.senderId === user.id && message.receiverId === otherUserId)
      ) {
        replaceMessage(message);
        refreshChatList();
      }
    };

    const onMessageDeleted = (message: Message) => {
      if (
        (message.senderId === otherUserId && message.receiverId === user.id) ||
        (message.senderId === user.id && message.receiverId === otherUserId)
      ) {
        replaceMessage(message);
        refreshChatList();
      }
    };

    socket.on("receive_message", onReceiveMessage);
    socket.on("message_updated", onMessageUpdated);
    socket.on("message_deleted", onMessageDeleted);
    return () => {
      socket.off("receive_message", onReceiveMessage);
      socket.off("message_updated", onMessageUpdated);
      socket.off("message_deleted", onMessageDeleted);
    };
  }, [user, otherUserId, appendMessage, replaceMessage, refreshChatList]);

  const emitTyping = (isTyping: boolean) => {
    getSocket().emit("typing", { receiverId: otherUserId, isTyping });
  };

  const handleInputChange = (value: string) => {
    emitTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 1500);
    if (!value.trim()) emitTyping(false);
  };

  const handleSendText = (text: string) => {
    emitTyping(false);
    const socket = getSocket();
    socket.emit(
      "send_message",
      { receiverId: otherUserId, content: text },
      (response: { success: boolean; data?: Message; message?: string }) => {
        if (response.success && response.data) {
          appendMessage(response.data);
          refreshChatList();
        }
      }
    );
  };

  const handleSendImage = async (file: File, caption: string) => {
    setSending(true);
    emitTyping(false);
    try {
      const formData = new FormData();
      formData.append("receiverId", otherUserId);
      formData.append("content", caption);
      formData.append("image", file);

      const res = await api<ApiResponse<Message>>("/messages", {
        method: "POST",
        body: formData,
      });
      appendMessage(res.data);
      refreshChatList();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to send image");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      const res = await api<ApiResponse<Message>>(`/messages/${messageId}`, {
        method: "DELETE",
      });
      replaceMessage(res.data);
      refreshChatList();
      toastSuccess("Message deleted");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to delete message");
    }
  };

  const handleSaveEdit = async (
    content: string,
    removeImage: boolean,
    newImage?: File
  ) => {
    if (!editingMessage) return;
    const formData = new FormData();
    formData.append("content", content);
    if (removeImage) formData.append("removeImage", "true");
    if (newImage) formData.append("image", newImage);

    const res = await api<ApiResponse<Message>>(
      `/messages/${editingMessage.id}`,
      { method: "PATCH", body: formData }
    );
    replaceMessage(res.data);
    refreshChatList();
    toastSuccess("Message updated");
  };

  const isTyping = typingUsers[otherUserId];

  return (
    <AppLayout>
      <div className="flex h-full flex-col">
        <header className="page-header flex shrink-0 items-center gap-3 !border-brand-700/20 !bg-brand-700 !py-3 !text-white">
          <Link
            href="/chat"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10 lg:hidden"
            aria-label="Back to messages"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </Link>
          {otherUser ? (
            <>
              <Avatar
                name={otherUser.name}
                src={otherUser.profilePicture}
                online={otherUser.isOnline}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">
                  {otherUser.name}
                </p>
                <p className="text-xs text-brand-100">
                  {isTyping ? (
                    <span className="font-medium text-white">typing...</span>
                  ) : otherUser.isOnline ? (
                    <span className="text-brand-100">online</span>
                  ) : (
                    "offline"
                  )}
                </p>
              </div>
            </>
          ) : loading ? (
            <div className="h-10 w-32 animate-pulse rounded-xl bg-white/60" />
          ) : null}
        </header>

        <div className="wa-chat-bg flex-1 overflow-y-auto px-3 py-3 scrollbar-thin sm:px-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500">
              No messages yet. Say hello!
            </p>
          ) : (
            <div className="page-container mx-auto flex max-w-2xl flex-col gap-1.5">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.senderId === user?.id}
                  onEdit={
                    msg.senderId === user?.id && !msg.isDeleted
                      ? setEditingMessage
                      : undefined
                  }
                  onDelete={
                    msg.senderId === user?.id && !msg.isDeleted
                      ? handleDeleteMessage
                      : undefined
                  }
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <ChatComposer
          onSendText={handleSendText}
          onSendImage={handleSendImage}
          onInputChange={handleInputChange}
          sending={sending}
        />

        {editingMessage && (
          <EditMessageModal
            initialContent={editingMessage.content}
            hasImage={Boolean(editingMessage.imageUrl)}
            onSave={handleSaveEdit}
            onClose={() => setEditingMessage(null)}
          />
        )}
      </div>
    </AppLayout>
  );
}
