"use client";

import { useCallback, useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { api } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/toast";
import type { User, ApiResponse } from "@/types";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await api<ApiResponse<{ users: User[] }>>(
        `/users?${params.toString()}`
      );
      setUsers(res.data.users);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const sendRequest = async (receiverId: string) => {
    setSendingTo(receiverId);
    try {
      await api("/friend-requests", {
        method: "POST",
        body: JSON.stringify({ receiverId }),
      });
      toastSuccess("Friend request sent!");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to send request");
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <AppLayout>
      <div className="page-shell">
        <PageHeader
          title="Discover People"
          subtitle="Search and connect with other users"
        />
        <div className="page-content">
          <div className="page-container mx-auto mb-4 max-w-xl sm:mb-6">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="input-field"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner />
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              title="No users found"
              description={
                search
                  ? "Try a different search term"
                  : "There are no users to show right now"
              }
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
                    d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                  />
                </svg>
              }
            />
          ) : (
            <div className="page-container grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="card flex flex-col items-center text-center sm:items-stretch sm:text-left"
                >
                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
                    <Avatar
                      name={u.name}
                      src={u.profilePicture}
                      online={u.isOnline}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">
                        {u.name}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {u.email}
                      </p>
                      {u.isOnline && (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                          Online
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => sendRequest(u.id)}
                    disabled={sendingTo === u.id}
                    className="btn-primary mt-4 w-full sm:mt-5"
                  >
                    {sendingTo === u.id ? "Sending..." : "Add Friend"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
