"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { MessageSoundSettings } from "@/components/MessageSoundSettings";
import { api, clearToken } from "@/lib/api";
import { getQueryClient } from "@/lib/queryClient";
import { disconnectSocket } from "@/lib/socket";
import { toastError, toastSuccess } from "@/lib/toast";
import type { ApiResponse } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toastError("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toastError("New password must be at least 6 characters");
      return;
    }

    setPasswordLoading(true);
    try {
      await api<ApiResponse<{ message: string }>>("/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      toastSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== "DELETE") {
      toastError("Type DELETE in the confirmation box to continue");
      return;
    }
    if (
      !confirm(
        "Delete your account permanently? All messages, posts, and data will be removed.",
      )
    ) {
      return;
    }

    setDeleteLoading(true);
    try {
      await api("/auth/account", {
        method: "DELETE",
        body: JSON.stringify({ password: deletePassword }),
      });
      toastSuccess("Account deleted");
      clearToken();
      disconnectSocket();
      getQueryClient().clear();
      router.push("/login");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-shell">
        <PageHeader
          title="Settings"
          subtitle="Password, sounds, and account security"
        />

        <div className="page-content">
          <div className="page-container mx-auto max-w-2xl animate-fade-in space-y-4 md:space-y-5">
            <MessageSoundSettings />

            <form onSubmit={handlePasswordSubmit} className="form-card">
              <div className="form-card-header">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.75}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      Change password
                    </h2>
                    <p className="text-sm text-slate-500">
                      Use a strong password you don&apos;t use elsewhere
                    </p>
                  </div>
                </div>
              </div>

              <div className="form-card-body">
                <div className="form-field">
                  <label className="form-label">Current password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="input-field"
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                </div>

                <div className="form-divider" aria-hidden />

                <div className="form-grid-2">
                  <div className="form-field">
                    <label className="form-label">New password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="input-field"
                      placeholder="Min. 6 characters"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Confirm new password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="input-field"
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="btn-primary w-full sm:w-auto sm:min-w-[10rem]"
                >
                  {passwordLoading ? "Updating..." : "Update password"}
                </button>
              </div>
            </form>

            <form
              onSubmit={handleDeleteAccount}
              className="form-card border-rose-200 bg-rose-50/20"
            >
              <div className="form-card-header border-rose-100 bg-gradient-to-br from-rose-50/80 to-white">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.75}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-rose-700">
                      Delete account
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-600">
                      Permanently remove your profile, messages, posts, and all
                      data. This cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="form-card-body">
                <div className="form-field">
                  <label className="form-label">Your password</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    required
                    className="input-field"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">
                    Type <span className="font-mono font-semibold">DELETE</span>{" "}
                    to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    required
                    className="input-field font-mono"
                    placeholder="DELETE"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="form-actions border-rose-100 bg-rose-50/50">
                <button
                  type="submit"
                  disabled={deleteLoading || deleteConfirmText !== "DELETE"}
                  className="w-full rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50 sm:w-auto sm:min-w-[10rem]"
                >
                  {deleteLoading ? "Deleting..." : "Delete my account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
