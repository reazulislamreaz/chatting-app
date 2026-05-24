"use client";

import { PrefetchLink } from "./PrefetchLink";
import { Avatar } from "./Avatar";
import type { User } from "@/types";

interface UserCardProps {
  user: User;
  onAddFriend?: (userId: string) => void;
  sendingRequest?: boolean;
}

export function UserCard({ user, onAddFriend, sendingRequest }: UserCardProps) {
  const relationship = user.relationship?.status ?? "none";
  const subtitle =
    user.relationStatus ||
    user.professional ||
    (user.hobby ? `Likes ${user.hobby}` : "View profile");

  return (
    <article className="card group overflow-hidden !p-0 transition hover:shadow-md">
      <PrefetchLink
        href={`/users/${user.id}`}
        prefetchUserId={user.id}
        className="flex items-center gap-3 p-4 transition hover:bg-brand-50/30"
      >
        <Avatar
          name={user.name}
          src={user.profilePicture}
          online={user.isOnline}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-semibold text-slate-900 group-hover:text-brand-700">
              {user.name}
            </p>
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-brand-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p className="mt-0.5 truncate text-sm text-slate-500">{subtitle}</p>
          {user.isOnline ? (
            <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand-600">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Online
            </span>
          ) : user.professional ? (
            <p className="mt-1 truncate text-xs text-slate-400">{user.professional}</p>
          ) : null}
        </div>
      </PrefetchLink>

      {relationship === "none" && onAddFriend && (
        <div className="border-t border-surface-border px-4 py-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onAddFriend(user.id);
            }}
            disabled={sendingRequest}
            className="btn-primary w-full !py-2.5 text-sm"
          >
            {sendingRequest ? "Sending..." : "Add friend"}
          </button>
        </div>
      )}
      {relationship === "pending_sent" && (
        <div className="border-t border-surface-border px-4 py-3">
          <button type="button" disabled className="btn-secondary w-full !py-2.5 text-sm">
            Friend request sent
          </button>
        </div>
      )}
      {relationship === "friends" && (
        <div className="border-t border-surface-border px-4 py-3">
          <PrefetchLink
            href={`/chat/${user.id}`}
            className="btn-primary block w-full !py-2.5 text-center text-sm"
          >
            Send message
          </PrefetchLink>
        </div>
      )}
    </article>
  );
}
