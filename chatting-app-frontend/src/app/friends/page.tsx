"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { api } from "@/lib/api";
import { invalidateFriends } from "@/lib/invalidateCache";
import {
  useFriendsQuery,
  useFriendReceivedQuery,
  useFriendSentQuery,
} from "@/hooks/queries";
import { toastError, toastSuccess } from "@/lib/toast";

type Tab = "friends" | "received" | "sent";

export default function FriendsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("friends");

  const friendsQuery = useFriendsQuery();
  const receivedQuery = useFriendReceivedQuery();
  const sentQuery = useFriendSentQuery();

  const friends = friendsQuery.data ?? [];
  const received = receivedQuery.data ?? [];
  const sent = sentQuery.data ?? [];
  const loading =
    friendsQuery.isLoading ||
    receivedQuery.isLoading ||
    sentQuery.isLoading;

  const respond = async (id: string, action: "accept" | "reject") => {
    try {
      await api(`/friend-requests/${id}/respond`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      toastSuccess(
        action === "accept" ? "Friend request accepted" : "Request declined",
      );
      await invalidateFriends(queryClient);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Action failed");
    }
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "friends", label: "Friends", count: friends.length },
    { key: "received", label: "Received", count: received.length },
    { key: "sent", label: "Sent", count: sent.length },
  ];

  return (
    <AppLayout>
      <div className="page-shell">
        <PageHeader
          title="Friends"
          subtitle="Manage your connections and requests"
          action={
            <div className="flex flex-wrap gap-2">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    tab === t.key
                      ? "bg-brand-500 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs">
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          }
        />

        <div className="page-content">
          <div className="page-container">
            {loading ? (
              <div className="flex justify-center py-20">
                <Spinner />
              </div>
            ) : tab === "friends" ? (
              friends.length === 0 ? (
                <EmptyState
                  title="No friends yet"
                  description="Discover people and send friend requests to connect"
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {friends.map((friend) => (
                    <Link
                      key={friend.id}
                      href={`/users/${friend.id}`}
                      className="card flex items-center gap-4 p-4 transition hover:shadow-md"
                    >
                      <Avatar
                        src={friend.profilePicture}
                        name={friend.name}
                        size="lg"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">
                          {friend.name}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {friend.email}
                        </p>
                      </div>
                      <Link
                        href={`/chat/${friend.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="btn-primary shrink-0 !px-4 !py-2 text-sm"
                      >
                        Message
                      </Link>
                    </Link>
                  ))}
                </div>
              )
            ) : tab === "received" ? (
              received.length === 0 ? (
                <EmptyState title="No pending requests" />
              ) : (
                <div className="space-y-3">
                  {received.map((req) => (
                    <div
                      key={req.id}
                      className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <Avatar
                          src={req.sender?.profilePicture}
                          name={req.sender?.name ?? "User"}
                          size="lg"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {req.sender?.name ?? "Unknown"}
                          </p>
                          <p className="truncate text-sm text-slate-500">
                            {req.sender?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => respond(req.id, "accept")}
                          className="btn-primary flex-1 sm:flex-none"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => respond(req.id, "reject")}
                          className="btn-secondary flex-1 sm:flex-none"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : sent.length === 0 ? (
              <EmptyState title="No sent requests" />
            ) : (
              <div className="space-y-3">
                {sent.map((req) => (
                  <div key={req.id} className="card flex items-center gap-4 p-4">
                    <Avatar
                      src={req.receiver?.profilePicture}
                      name={req.receiver?.name ?? "User"}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        {req.receiver?.name ?? "Unknown"}
                      </p>
                      <p className="text-sm text-amber-600">Pending</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
