"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Avatar } from "@/components/Avatar";
import { ProfileDetailRow } from "@/components/ProfileDetailRow";
import { ProfileSkeleton } from "@/components/skeletons";
import { api } from "@/lib/api";
import { invalidateSocial } from "@/lib/invalidateCache";
import { useUserQuery } from "@/hooks/queries";
import { toastError, toastSuccess } from "@/lib/toast";
import { formatDateOfBirth, formatLastSeen, getAge } from "@/lib/userFormat";
import { useAuth } from "@/context/AuthContext";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = params.userId as string;
  const { user: currentUser } = useAuth();

  const { data: profile, isPending, isFetching, error } = useUserQuery(userId);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (error) {
      toastError(error instanceof Error ? error.message : "User not found");
      router.push("/users");
    }
  }, [error, router]);

  const sendRequest = async () => {
    setActionLoading(true);
    try {
      await api("/friend-requests", {
        method: "POST",
        body: JSON.stringify({ receiverId: userId }),
      });
      toastSuccess("Friend request sent!");
      await invalidateSocial(queryClient, userId);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to send request");
    } finally {
      setActionLoading(false);
    }
  };

  const respondToRequest = async (action: "accept" | "reject") => {
    if (!profile?.relationship?.requestId) return;
    setActionLoading(true);
    try {
      await api(`/friend-requests/${profile.relationship.requestId}/respond`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      toastSuccess(action === "accept" ? "You are now friends!" : "Request declined");
      await invalidateSocial(queryClient, userId);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const relationship = profile?.relationship?.status ?? "none";
  const age = getAge(profile?.dateOfBirth);
  const isSelf = currentUser?.id === userId;

  return (
    <AppLayout>
      <div className="page-shell">
        <header className="page-header flex items-center gap-3 !py-3">
          <Link
            href="/users"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-wa-panel"
            aria-label="Back to discover"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 truncate text-lg font-bold text-slate-900">
              Profile
              {isFetching && !isPending && (
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand-500" />
              )}
            </h1>
            <p className="text-xs text-slate-500">User details</p>
          </div>
        </header>

        <div className="page-content">
          {isPending && !profile ? (
            <ProfileSkeleton />
          ) : !profile ? null : (
            <div className="page-container mx-auto max-w-lg animate-fade-in space-y-4 pb-6">
              <div className="card flex flex-col items-center text-center">
                <Avatar
                  name={profile.name}
                  src={profile.profilePicture}
                  online={profile.isOnline}
                  size="xl"
                />
                <h2 className="mt-4 text-xl font-bold text-slate-900">{profile.name}</h2>
                {profile.relationStatus && (
                  <p className="mt-1 text-sm font-medium text-brand-600">
                    {profile.relationStatus}
                  </p>
                )}
                <p className="mt-2 text-sm text-slate-500">
                  {formatLastSeen(
                    profile.lastSeen
                      ? String(profile.lastSeen)
                      : undefined,
                    profile.isOnline
                  )}
                </p>
                {age !== null && (
                  <p className="mt-1 text-xs text-slate-400">{age} years old</p>
                )}
              </div>

              {!isSelf && (
                <div className="card space-y-3">
                  {relationship === "none" && (
                    <button
                      type="button"
                      onClick={sendRequest}
                      disabled={actionLoading}
                      className="btn-primary w-full"
                    >
                      {actionLoading ? "Sending..." : "Add friend"}
                    </button>
                  )}
                  {relationship === "pending_sent" && (
                    <button type="button" disabled className="btn-secondary w-full">
                      Friend request sent
                    </button>
                  )}
                  {relationship === "pending_received" && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => respondToRequest("accept")}
                        disabled={actionLoading}
                        className="btn-primary flex-1"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => respondToRequest("reject")}
                        disabled={actionLoading}
                        className="btn-secondary flex-1"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  {relationship === "friends" && (
                    <Link href={`/chat/${profile.id}`} className="btn-primary block w-full text-center">
                      Send message
                    </Link>
                  )}
                </div>
              )}

              <div className="card space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">About</h3>

                <ProfileDetailRow
                  label="Email"
                  value={profile.email}
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                />
                <ProfileDetailRow
                  label="Profession"
                  value={profile.professional || ""}
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                />
                <ProfileDetailRow
                  label="Address"
                  value={profile.address || ""}
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                />
                <ProfileDetailRow
                  label="Date of birth"
                  value={formatDateOfBirth(profile.dateOfBirth)}
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                />
                <ProfileDetailRow
                  label="Religion"
                  value={profile.religious || ""}
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  }
                />
                <ProfileDetailRow
                  label="Hobbies"
                  value={profile.hobby || ""}
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />

                {!profile.professional &&
                  !profile.address &&
                  !profile.dateOfBirth &&
                  !profile.religious &&
                  !profile.hobby && (
                    <p className="py-4 text-center text-sm text-slate-400">
                      This user hasn&apos;t added more details yet.
                    </p>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
