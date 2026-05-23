"use client";

import { AppLayout } from "@/components/AppLayout";
import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { PrefetchLink } from "@/components/PrefetchLink";
import { ChatListSkeleton } from "@/components/skeletons";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";
import { getMessagePreview } from "@/lib/messagePreview";

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ChatListPage() {
  const { chatList, loading, isFetching } = useChat();
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="page-shell">
        <PageHeader
          title="Messages"
          subtitle="Your conversations with friends"
          refreshing={isFetching && !loading}
        />

        <div className="page-content !p-0 sm:!p-0">
          {loading ? (
            <ChatListSkeleton />
          ) : chatList.length === 0 ? (
            <div className="px-4 sm:px-6">
              <EmptyState
                title="No conversations yet"
                description="Add friends to start chatting"
                icon={
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                    />
                  </svg>
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-surface-border animate-fade-in">
              {chatList.map((chat) => {
                const isOwnLast = chat.lastMessage?.senderId === user?.id;
                const preview = getMessagePreview(
                  chat.lastMessage,
                  isOwnLast,
                  user?.id,
                );

                return (
                  <PrefetchLink
                    key={chat.user.id}
                    href={`/chat/${chat.user.id}`}
                    prefetchUserId={chat.user.id}
                    prefetchChat
                    className="flex items-center gap-4 px-4 py-4 transition hover:bg-white sm:px-6"
                  >
                    <Avatar
                      name={chat.user.name}
                      src={chat.user.profilePicture}
                      online={chat.user.isOnline}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p
                          className={`truncate font-semibold ${
                            chat.unreadCount > 0
                              ? "text-slate-900"
                              : "text-slate-800"
                          }`}
                        >
                          {chat.user.name}
                        </p>
                        {chat.lastMessage && (
                          <span className="shrink-0 text-xs text-slate-400">
                            {formatTime(chat.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p
                          className={`truncate text-sm ${
                            chat.unreadCount > 0
                              ? "font-medium text-slate-700"
                              : "text-slate-500"
                          }`}
                        >
                          {preview}
                        </p>
                        {chat.unreadCount > 0 && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-semibold text-white">
                            {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </PrefetchLink>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
