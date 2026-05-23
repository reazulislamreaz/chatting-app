"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { UserCard } from "@/components/UserCard";
import { api } from "@/lib/api";
import { invalidateSocial } from "@/lib/invalidateCache";
import { useUsersQuery } from "@/hooks/queries";
import { toastError, toastSuccess } from "@/lib/toast";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: users = [], isLoading, isFetching, error } = useUsersQuery(
    debouncedSearch,
  );

  useEffect(() => {
    if (error) {
      toastError(
        error instanceof Error ? error.message : "Failed to load users",
      );
    }
  }, [error]);

  const sendRequest = async (receiverId: string) => {
    setSendingTo(receiverId);
    try {
      await api("/friend-requests", {
        method: "POST",
        body: JSON.stringify({ receiverId }),
      });
      toastSuccess("Friend request sent!");
      await invalidateSocial(queryClient, receiverId);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to send request");
    } finally {
      setSendingTo(null);
    }
  };

  const loading = isLoading || (isFetching && users.length === 0);

  return (
    <AppLayout>
      <div className="page-shell">
        <PageHeader
          title="Discover People"
          subtitle="Browse profiles and connect with friends"
        />

        <div className="page-content">
          <div className="page-container space-y-4">
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="input-field !pl-11"
              />
            </div>

            {!loading && users.length > 0 && (
              <p className="text-sm text-slate-500">
                {users.length} {users.length === 1 ? "person" : "people"} found
                {search ? ` for "${search}"` : ""}
              </p>
            )}

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
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {users.map((u) => (
                  <UserCard
                    key={u.id}
                    user={u}
                    onAddFriend={sendRequest}
                    sendingRequest={sendingTo === u.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
