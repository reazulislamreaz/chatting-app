"use client";

import { FormEvent, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { api } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import type { Post, ApiResponse } from "@/types";

interface CreatePostProps {
  onPostCreated: (post: Post) => void;
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (file: File | null) => {
    setImage(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const canPost = content.trim().length > 0 || !!image;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canPost) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("content", content.trim());
      if (image) formData.append("image", image);

      const res = await api<ApiResponse<Post>>("/posts", {
        method: "POST",
        body: formData,
      });

      onPostCreated(res.data);
      setContent("");
      handleImageChange(null);
      if (fileRef.current) fileRef.current.value = "";
      toastSuccess("Post shared!");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card overflow-hidden !p-0">
      <div className="flex gap-3 p-4 pb-2">
        <Avatar name={user?.name || "U"} src={user?.profilePicture} size="md" />
        <div className="min-w-0 flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Post title or caption (optional)"
            rows={2}
            className="w-full resize-none border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          <p className="mt-1 text-xs text-slate-400">
            Text and photo are optional — share at least one
          </p>
        </div>
      </div>

      {preview && (
        <div className="relative mx-4 mb-3 overflow-hidden rounded-xl border border-surface-border">
          <img src={preview} alt="Preview" className="max-h-56 w-full object-cover" />
          <button
            type="button"
            onClick={() => handleImageChange(null)}
            className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
            aria-label="Remove photo"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-surface-border bg-wa-panel/50 px-4 py-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-brand-600 transition hover:bg-white"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Photo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
        />
        <button
          type="submit"
          disabled={loading || !canPost}
          className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
