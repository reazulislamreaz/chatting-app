"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/AppLayout";
import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { api } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/toast";
import type { User, FriendRequest, ApiResponse } from "@/types";

type Tab = "friends" | "received" | "sent";

export default function FriendsPage() {
  const [friends, setFriends] = useState<User[]>([]);
  const [received, setReceived] = useState<FriendRequest[]>([]);
  const [sent, setSent] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("friends");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [friendsRes, receivedRes, sentRes] = await Promise.all([
        api<ApiResponse<User[]>>("/friend-requests/friends"),
        api<ApiResponse<FriendRequest[]>>("/friend-requests/received"),
        api<ApiResponse<FriendRequest[]>>("/friend-requests/sent"),
      ]);
      setFriends(friendsRes.data);
      setReceived(receivedRes.data);
      setSent(sentRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const respond = async (id: string, action: "accept" | "reject") => {
    try {
      await api(`/friend-requests/${id}/respond`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      toastSuccess(action === "accept" ? "Friend request accepted" : "Request declined");
      fetchData();
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
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                      tab === t.key
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {t.count}
                  </span>
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
                description="Discover people and send friend requests to start chatting"
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
                      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l-.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                    />
                  </svg>
                }
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {friends.map((f) => (
                  <Link
                    key={f.id}
                    href={`/chat/${f.id}`}
                    className="card flex items-center gap-4 transition hover:border-brand-200 hover:shadow-md"
                  >
                    <Avatar
                      name={f.name}
                      src={f.profilePicture}
                      online={f.isOnline}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">
                        {f.name}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {f.email}
                      </p>
                    </div>
                    <svg
                      className="h-5 w-5 shrink-0 text-brand-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                      />
                    </svg>
                  </Link>
                ))}
              </div>
            )
          ) : tab === "received" ? (
            received.length === 0 ? (
              <EmptyState
                title="No pending requests"
                description="When someone sends you a request, it will appear here"
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
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                }
              />
            ) : (
              <div className="space-y-3">
                {received.map((r) => (
                  <div
                    key={r.id}
                    className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={r.sender?.name || "U"}
                        src={r.sender?.profilePicture}
                      />
                      <div>
                        <p className="font-semibold text-slate-900">
                          {r.sender?.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          Wants to be friends
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => respond(r.id, "accept")}
                        className="btn-primary flex-1 sm:flex-none"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respond(r.id, "reject")}
                        className="btn-secondary flex-1 sm:flex-none"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : sent.length === 0 ? (
            <EmptyState
              title="No sent requests"
              description="Friend requests you send will show up here until accepted"
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
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                  />
                </svg>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {sent.map((r) => (
                <div key={r.id} className="card flex items-center gap-4">
                  <Avatar
                    name={r.receiver?.name || "U"}
                    src={r.receiver?.profilePicture}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">
                      {r.receiver?.name}
                    </p>
                    <span className="mt-1 inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                      Pending
                    </span>
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
