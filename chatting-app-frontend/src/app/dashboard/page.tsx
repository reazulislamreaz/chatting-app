"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/PageHeader";
import { SignOutButton } from "@/components/SignOutButton";
import { DashboardSkeleton } from "@/components/skeletons";
import { api } from "@/lib/api";
import { invalidateProfile } from "@/lib/invalidateCache";
import { useProfileQuery } from "@/hooks/queries";
import { toastError, toastSuccess } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/types";
import { RELATION_STATUS_OPTIONS } from "@/lib/relationStatus";

function applyProfileToForm(
  profile: User,
  setters: {
    setName: (v: string) => void;
    setAddress: (v: string) => void;
    setProfessional: (v: string) => void;
    setReligious: (v: string) => void;
    setHobby: (v: string) => void;
    setRelationStatus: (v: string) => void;
    setDateOfBirth: (v: string) => void;
  },
) {
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

  const email = profile?.email || user?.email || "";

  return (
    <AppLayout>
      <div className="page-shell">
        <PageHeader
          title="Your Profile"
          subtitle="Update your personal information"
          refreshing={profileRefreshing && !fetching}
        />

        <div className="page-content">
          {fetching && !profile ? (
            <DashboardSkeleton />
          ) : (
            <div className="page-container mx-auto max-w-2xl space-y-4 md:space-y-5">
              <div className="card flex animate-fade-in flex-col items-center text-center">
                <Avatar
                  name={profile?.name || user?.name || "U"}
                  src={profile?.profilePicture || user?.profilePicture}
                  size="xl"
                />
                <h2 className="mt-4 text-xl font-bold text-slate-900">
                  {profile?.name || user?.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{email}</p>
                {profile?.relationStatus && (
                  <p className="mt-1 text-sm font-medium text-brand-600">
                    {profile.relationStatus}
                  </p>
                )}
              </div>

              <form onSubmit={handleProfileSubmit} className="form-card animate-fade-in">
                <div className="form-card-header">
                  <div className="flex items-start gap-3">
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        Profile details
                      </h3>
                      <p className="mt-0.5 text-sm text-slate-500">
                        Keep your information up to date
                      </p>
                    </div>
                  </div>
                </div>

                <div className="form-card-body">
                  <div className="form-field">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      value={email}
                      readOnly
                      disabled
                      className="input-field cursor-not-allowed bg-slate-50 text-slate-500"
                    />
                    <p className="form-hint">Email cannot be changed</p>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-field">
                      <label className="form-label">Full name</label>
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
                    <div className="form-field">
                      <label className="form-label">Date of birth</label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label className="form-label">Address</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="input-field resize-none"
                    placeholder="Street, city, country"
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-field">
                      <label className="form-label">Profession</label>
                    <input
                      type="text"
                      value={professional}
                      onChange={(e) => setProfessional(e.target.value)}
                      className="input-field"
                      placeholder="e.g. Software Engineer"
                    />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Religion</label>
                    <input
                      type="text"
                      value={religious}
                      onChange={(e) => setReligious(e.target.value)}
                      className="input-field"
                      placeholder="Your faith or belief"
                    />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-field">
                      <label className="form-label">Hobbies</label>
                  <input
                    type="text"
                    value={hobby}
                    onChange={(e) => setHobby(e.target.value)}
                    className="input-field"
                    placeholder="Reading, sports, music..."
                    />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Relation status</label>
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
                  </div>

                  <div className="form-field">
                    <label className="form-label">Profile photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                      className="form-file-input"
                    />
                    <p className="form-hint">
                      JPG or PNG. A square photo works best.
                    </p>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full sm:w-auto sm:min-w-[10rem]"
                  >
                    {loading ? "Saving..." : "Save profile"}
                  </button>
                </div>
              </form>

              <Link
                href="/settings"
                className="card group flex animate-fade-in items-center gap-4 transition hover:shadow-md"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-100">
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
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.75}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-slate-900">
                    Account settings
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-500">
                    Password, sounds, and account security
                  </span>
                </span>
                <svg
                  className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>

              <SignOutButton variant="card" />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
