"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar } from "@/components/Avatar";
import { MessageListSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/skeletons/Skeleton";
import { ChatComposer } from "@/components/ChatComposer";
import { MessageBubble } from "@/components/MessageBubble";
import { EditMessageModal } from "@/components/EditMessageModal";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import {
  flattenMessagePages,
  useMessagesInfiniteQuery,
  useUserQuery,
  type MessagesInfiniteData,
} from "@/hooks/queries";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import type { Message, ApiResponse, ChatListItem } from "@/types";
import { toastError, toastSuccess } from "@/lib/toast";
import { invalidateMessages } from "@/lib/invalidateCache";
import { useCall } from "@/context/CallContext";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const otherUserId = params.userId as string;
  const { user } = useAuth();
  const { refreshChatList, typingUsers } = useChat();
  const { startCall, phase: callPhase } = useCall();
  const queryClient = useQueryClient();

  const { data: otherUser, isPending: userPending } = useUserQuery(otherUserId);
  const {
    data: messagesData,
    isPending: messagesPending,
    isFetching: messagesFetching,
    isSuccess: messagesReady,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessagesInfiniteQuery(otherUserId);

  const [sending, setSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingEmitRef = useRef(0);
  const markedReadRef = useRef(false);
  const prevFirstIdRef = useRef<string | null>(null);
  const prevLastIdRef = useRef<string | null>(null);

  const messages = useMemo(
    () => flattenMessagePages(messagesData?.pages),
    [messagesData?.pages],
  );

  const markConversationRead = useCallback(() => {
    getSocket().emit("message_read", { senderId: otherUserId });
    queryClient.setQueryData<ChatListItem[]>(queryKeys.chats, (prev) => {
      if (!prev) return prev;
      return prev.map((c) =>
        c.user.id === otherUserId ? { ...c, unreadCount: 0 } : c,
      );
    });
  }, [otherUserId, queryClient]);

  const showMessagesSkeleton = messagesPending && messages.length === 0;
  const headerLoading = userPending && !otherUser;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const updateMessagesCache = useCallback(
    (updater: (old: MessagesInfiniteData | undefined) => MessagesInfiniteData | undefined) => {
      queryClient.setQueryData(queryKeys.messages(otherUserId), updater);
    },
    [queryClient, otherUserId],
  );

  const appendMessage = useCallback(
    (message: Message) => {
      updateMessagesCache((old) => {
        if (!old?.pages.length) {
          return {
            pages: [
              {
                messages: [message],
                pagination: { limit: 30, hasMore: false },
              },
            ],
            pageParams: [undefined],
          };
        }

        const pages = [...old.pages];
        const newest = pages[0];
        if (newest.messages.some((m) => m.id === message.id)) return old;

        pages[0] = {
          ...newest,
          messages: [...newest.messages, message],
        };

        return { ...old, pages };
      });
    },
    [updateMessagesCache],
  );

  const replaceMessage = useCallback(
    (message: Message) => {
      updateMessagesCache((old) => {
        if (!old?.pages.length) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            messages: page.messages.map((m) =>
              m.id === message.id ? message : m,
            ),
          })),
        };
      });
    },
    [updateMessagesCache],
  );

  const loadOlderMessages = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const container = scrollContainerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    void fetchNextPage().then(() => {
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }
      });
    });
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const topSentinelRef = useIntersectionObserver(loadOlderMessages, {
    enabled: hasNextPage && !showMessagesSkeleton && messages.length > 0,
    rootMargin: "120px",
  });

  useEffect(() => {
    markedReadRef.current = false;
    prevFirstIdRef.current = null;
    prevLastIdRef.current = null;
    setReplyTo(null);
  }, [otherUserId]);

  useEffect(() => {
    if (!messagesReady || !user || markedReadRef.current) return;
    markedReadRef.current = true;
    markConversationRead();
  }, [messagesReady, user, markConversationRead]);

  useEffect(() => {
    if (messages.length === 0) return;

    const firstId = messages[0].id;
    const lastId = messages[messages.length - 1].id;

    if (prevLastIdRef.current === null) {
      scrollToBottom();
    } else if (
      lastId !== prevLastIdRef.current &&
      firstId === prevFirstIdRef.current
    ) {
      scrollToBottom();
    }

    prevFirstIdRef.current = firstId;
    prevLastIdRef.current = lastId;
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
          markConversationRead();
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

    const onConversationDeleted = (payload: { otherUserId: string }) => {
      if (payload.otherUserId === otherUserId) {
        void invalidateMessages(queryClient, otherUserId);
        refreshChatList();
      }
    };

    socket.on("receive_message", onReceiveMessage);
    socket.on("message_updated", onMessageUpdated);
    socket.on("message_deleted", onMessageDeleted);
    socket.on("conversation_deleted", onConversationDeleted);
    return () => {
      socket.off("receive_message", onReceiveMessage);
      socket.off("message_updated", onMessageUpdated);
      socket.off("message_deleted", onMessageDeleted);
      socket.off("conversation_deleted", onConversationDeleted);
    };
  }, [user, otherUserId, appendMessage, replaceMessage, markConversationRead, refreshChatList, queryClient]);

  const emitTyping = (isTyping: boolean) => {
    const now = Date.now();
    if (isTyping) {
      if (now - lastTypingEmitRef.current < 2000) return;
      lastTypingEmitRef.current = now;
    }
    getSocket().emit("typing", { receiverId: otherUserId, isTyping });
  };

  const handleInputChange = (value: string) => {
    if (value.trim()) {
      emitTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => emitTyping(false), 1500);
    } else {
      emitTyping(false);
    }
  };

  const handleSendText = (text: string, replyToId?: string) => {
    emitTyping(false);
    const socket = getSocket();
    socket.emit(
      "send_message",
      { receiverId: otherUserId, content: text, replyToId },
      (response: { success: boolean; data?: Message; message?: string }) => {
        if (response.success && response.data) {
          appendMessage(response.data);
          refreshChatList();
          setReplyTo(null);
        }
      }
    );
  };

  const handleSendImage = async (file: File, caption: string, replyToId?: string) => {
    setSending(true);
    emitTyping(false);
    try {
      const formData = new FormData();
      formData.append("receiverId", otherUserId);
      formData.append("content", caption);
      formData.append("image", file);
      if (replyToId) formData.append("replyToId", replyToId);

      const res = await api<ApiResponse<Message>>("/messages", {
        method: "POST",
        body: formData,
      });
      appendMessage(res.data);
      refreshChatList();
      setReplyTo(null);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to send image");
    } finally {
      setSending(false);
    }
  };

  const handleSendVoice = async (
    file: File,
    durationSeconds: number,
    caption: string,
    replyToId?: string,
  ) => {
    setSending(true);
    emitTyping(false);
    try {
      const formData = new FormData();
      formData.append("receiverId", otherUserId);
      formData.append("content", caption);
      formData.append("voice", file);
      formData.append("voiceDuration", String(durationSeconds));
      if (replyToId) formData.append("replyToId", replyToId);

      const res = await api<ApiResponse<Message>>("/messages", {
        method: "POST",
        body: formData,
      });
      appendMessage(res.data);
      refreshChatList();
      setReplyTo(null);
    } catch (err) {
      toastError(
        err instanceof Error ? err.message : "Failed to send voice message",
      );
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (
      !confirm(
        "Delete this entire conversation? All messages will be permanently removed.",
      )
    ) {
      return;
    }
    setHeaderMenuOpen(false);
    try {
      await api(`/chats/${otherUserId}`, { method: "DELETE" });
      await invalidateMessages(queryClient, otherUserId);
      refreshChatList();
      toastSuccess("Conversation deleted");
      router.push("/chat");
    } catch (err) {
      toastError(
        err instanceof Error ? err.message : "Failed to delete conversation",
      );
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
      <div className="flex h-full flex-col">
        <header className="page-header flex shrink-0 items-center gap-3 !border-brand-700/20 !bg-brand-700 !py-3 !text-white md:!px-5 lg:!px-6">
          <Link
            href="/chat"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10 md:hidden"
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
              {otherUser && (
                <button
                  type="button"
                  onClick={() => startCall(otherUserId, otherUser.name)}
                  disabled={callPhase !== "idle"}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10 disabled:opacity-40"
                  aria-label="Voice call"
                  title="Voice call"
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
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                    />
                  </svg>
                </button>
              )}
            </>
          ) : headerLoading ? (
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full bg-white/40" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28 bg-white/40" />
                <Skeleton className="h-3 w-16 bg-white/30" />
              </div>
            </div>
          ) : null}
        </header>

        <div
          ref={scrollContainerRef}
          className="wa-chat-bg flex-1 overflow-y-auto scroll-pb-28 px-3 py-3 scrollbar-thin sm:scroll-pb-24 sm:px-4"
        >
          {showMessagesSkeleton ? (
            <MessageListSkeleton count={8} />
          ) : messages.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500">
              No messages yet. Say hello!
            </p>
          ) : (
            <div className="page-container mx-auto flex max-w-2xl animate-fade-in flex-col gap-1.5 lg:max-w-3xl xl:max-w-4xl">
              <div ref={topSentinelRef} className="flex h-6 shrink-0 items-center justify-center">
                {isFetchingNextPage && (
                  <span className="text-xs text-slate-400">Loading older messages…</span>
                )}
              </div>
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.senderId === user?.id}
                  onEdit={
                    msg.senderId === user?.id &&
                    !msg.isDeleted &&
                    !msg.voiceUrl
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
              <div ref={messagesEndRef} className="h-3 shrink-0 sm:h-2" />
            </div>
          )}
        </div>

        <ChatComposer
          onSendText={handleSendText}
          onSendImage={handleSendImage}
          onSendVoice={handleSendVoice}
          onInputChange={handleInputChange}
          sending={sending || (messagesFetching && showMessagesSkeleton)}
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
  );
}
