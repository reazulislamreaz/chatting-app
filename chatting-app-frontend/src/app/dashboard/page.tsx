"use client";

import { FormEvent, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/PageHeader";
import { DashboardSkeleton } from "@/components/skeletons";
import { api, clearToken } from "@/lib/api";
import { invalidateProfile } from "@/lib/invalidateCache";
import { useProfileQuery } from "@/hooks/queries";
import { toastError, toastSuccess } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import type { User, ApiResponse } from "@/types";
import { RELATION_STATUS_OPTIONS } from "@/lib/relationStatus";

function applyProfileToForm(profile: User, setters: {
  setName: (v: string) => void;
  setAddress: (v: string) => void;
  setProfessional: (v: string) => void;
  setReligious: (v: string) => void;
  setHobby: (v: string) => void;
  setRelationStatus: (v: string) => void;
  setDateOfBirth: (v: string) => void;
}) {
  setters.setName(profile.name ?? "");
  setters.setAddress(profile.address ?? "");
  setters.setProfessional(profile.professional ?? "");
  setters.setReligious(profile.religious ?? "");
  setters.setHobby(profile.hobby ?? "");
  setters.setRelationStatus(profile.relationStatus ?? "");
  setters.setDateOfBirth(profile.dateOfBirth ?? "");
}

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data: profile,
    isPending: fetching,
    isFetching: profileRefreshing,
    refetch: refetchProfile,
  } = useProfileQuery();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [professional, setProfessional] = useState("");
  const [religious, setReligious] = useState("");
  const [hobby, setHobby] = useState("");
  const [relationStatus, setRelationStatus] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [formSynced, setFormSynced] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (profile && !formSynced) {
      applyProfileToForm(profile, {
        setName,
        setAddress,
        setProfessional,
        setReligious,
        setHobby,
        setRelationStatus,
        setDateOfBirth,
      });
      setFormSynced(true);
    }
  }, [profile, formSynced]);

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("address", address);
      formData.append("professional", professional);
      formData.append("religious", religious);
      formData.append("hobby", hobby);
      formData.append("relationStatus", relationStatus);
      formData.append("dateOfBirth", dateOfBirth);
      if (avatarFile) formData.append("profilePicture", avatarFile);

      await api("/users/profile", { method: "PATCH", body: formData });
      await refreshUser();
      await invalidateProfile(queryClient);
      await refetchProfile();
      setFormSynced(false);
      toastSuccess("Profile updated successfully");
      setAvatarFile(null);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  };

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
    if (
      !confirm(
        "Delete your account permanently? All messages, posts, and data will be removed."
      )
    ) {
      return;
    }

    setDeleteLoading(true);
    try {
      await api("/auth/account", {
        method: "DELETE",
        auth: true,
        body: JSON.stringify({ password: deletePassword }),
      });
      toastSuccess("Account deleted");
      clearToken();
      router.push("/login");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setDeleteLoading(false);
    }
  };

  const email = profile?.email || user?.email || "";

  return (
    <AppLayout>
      <div className="page-shell">
        <PageHeader
          title="Your Profile"
          subtitle="Update your personal information and security"
          refreshing={profileRefreshing && !fetching}
        />
        <div className="page-content">
          {fetching && !profile ? (
            <DashboardSkeleton />
          ) : (
            <div className="page-container mx-auto max-w-2xl animate-fade-in space-y-4 sm:space-y-6">
              <div className="card flex flex-col items-center text-center sm:flex-row sm:text-left">
                <Avatar
                  name={profile?.name || user?.name || "U"}
                  src={profile?.profilePicture || user?.profilePicture}
                  size="xl"
                />
                <div className="mt-4 sm:ml-6 sm:mt-0">
                  <h2 className="text-xl font-bold text-slate-900">
                    {profile?.name || user?.name}
                  </h2>
                  <p className="text-sm text-slate-500">{email}</p>
                  {profile?.relationStatus && (
                    <p className="mt-1 text-sm font-medium text-brand-600">
                      {profile.relationStatus}
                    </p>
                  )}
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="card space-y-5">
                <h3 className="text-base font-semibold text-slate-900">
                  Profile details
                </h3>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    disabled
                    className="input-field cursor-not-allowed bg-slate-50 text-slate-500"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    className="input-field"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Date of birth
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Address
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="input-field resize-none"
                    placeholder="Street, city, country"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Profession
                    </label>
                    <input
                      type="text"
                      value={professional}
                      onChange={(e) => setProfessional(e.target.value)}
                      className="input-field"
                      placeholder="e.g. Software Engineer"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Religion
                    </label>
                    <input
                      type="text"
                      value={religious}
                      onChange={(e) => setReligious(e.target.value)}
                      className="input-field"
                      placeholder="Your faith or belief"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Hobbies
                  </label>
                  <input
                    type="text"
                    value={hobby}
                    onChange={(e) => setHobby(e.target.value)}
                    className="input-field"
                    placeholder="Reading, sports, music..."
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Relation status
                  </label>
                  <select
                    value={relationStatus}
                    onChange={(e) => setRelationStatus(e.target.value)}
                    className="input-field"
                  >
                    {RELATION_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value || "none"} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Profile photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-brand-50 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
                  {loading ? "Saving..." : "Save profile"}
                </button>
              </form>

              <form onSubmit={handlePasswordSubmit} className="card space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
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
                    <h3 className="text-base font-semibold text-slate-900">
                      Change password
                    </h3>
                    <p className="text-sm text-slate-500">
                      Use a strong password you don&apos;t use elsewhere
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Current password
                  </label>
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
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    New password
                  </label>
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
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Confirm new password
                  </label>
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
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="btn-secondary w-full sm:w-auto"
                >
                  {passwordLoading ? "Updating..." : "Update password"}
                </button>
              </form>

              <form
                onSubmit={handleDeleteAccount}
                className="card space-y-5 border border-rose-200 bg-rose-50/30"
              >
                <div>
                  <h3 className="text-base font-semibold text-rose-700">
                    Delete account
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Permanently remove your profile, messages, posts, and all data.
                    This cannot be undone.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Confirm with your password
                  </label>
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

                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="w-full rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50 sm:w-auto"
                >
                  {deleteLoading ? "Deleting..." : "Delete my account"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
