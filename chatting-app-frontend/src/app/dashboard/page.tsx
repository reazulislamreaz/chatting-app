"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/PageHeader";
import { DashboardSkeleton } from "@/components/skeletons";
import { api } from "@/lib/api";
import { invalidateProfile } from "@/lib/invalidateCache";
import { useProfileQuery } from "@/hooks/queries";
import { toastError, toastSuccess } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/types";
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
          action={
            <Link href="/settings" className="btn-secondary text-sm">
              Account settings
            </Link>
          }
        />
        <div className="page-content">
          {fetching && !profile ? (
            <DashboardSkeleton />
          ) : (
            <div className="page-container animate-fade-in space-y-4 sm:space-y-6 lg:max-w-5xl">
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start xl:grid-cols-[minmax(0,320px)_1fr]">
              <div className="card flex flex-col items-center text-center sm:flex-row sm:text-left lg:flex-col lg:items-center lg:text-center">
                <Avatar
                  name={profile?.name || user?.name || "U"}
                  src={profile?.profilePicture || user?.profilePicture}
                  size="xl"
                />
                <div className="mt-4 sm:ml-6 sm:mt-0 lg:ml-0 lg:mt-4">
                  <h2 className="text-xl font-bold text-slate-900 lg:text-2xl">
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

              <form onSubmit={handleProfileSubmit} className="card space-y-5 lg:space-y-6">
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

                <div className="grid gap-5 md:grid-cols-2">
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
              </div>

              <div className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:max-w-5xl">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Password & account
                  </h3>
                  <p className="text-sm text-slate-500">
                    Change password or permanently delete your account
                  </p>
                </div>
                <Link href="/settings" className="btn-secondary shrink-0 text-center">
                  Open settings
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
