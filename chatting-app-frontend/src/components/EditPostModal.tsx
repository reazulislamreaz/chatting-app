"use client";

import { FormEvent, useState } from "react";

interface EditPostModalProps {
  initialContent: string;
  hasImage: boolean;
  onSave: (content: string, removeImage: boolean, newImage?: File) => Promise<void>;
  onClose: () => void;
}

export function EditPostModal({
  initialContent,
  hasImage,
  onSave,
  onClose,
}: EditPostModalProps) {
  const [content, setContent] = useState(initialContent);
  const [removeImage, setRemoveImage] = useState(false);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(content, removeImage, newImage || undefined);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Edit post</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Post text
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="input-field resize-none"
              placeholder="What's on your mind? (optional)"
            />
          </div>
          {hasImage && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={removeImage}
                onChange={(e) => setRemoveImage(e.target.checked)}
              />
              Remove photo
            </label>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Replace photo (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewImage(e.target.files?.[0] || null)}
              className="w-full text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
