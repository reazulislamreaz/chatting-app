"use client";

import { FormEvent, useRef, useState } from "react";

interface ChatComposerProps {
  onSendText: (content: string) => void;
  onSendImage: (file: File, caption: string) => Promise<void>;
  onInputChange?: (value: string) => void;
  sending?: boolean;
}

export function ChatComposer({
  onSendText,
  onSendImage,
  onInputChange,
  sending,
}: ChatComposerProps) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const clearImage = () => {
    setImage(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleImagePick = (file: File | null) => {
    clearImage();
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const canSend = !sending && (content.trim().length > 0 || !!image);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSend) return;

    if (image) {
      const caption = content.trim();
      setContent("");
      clearImage();
      await onSendImage(image, caption);
      return;
    }

    const text = content.trim();
    setContent("");
    onSendText(text);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="safe-bottom shrink-0 border-t border-surface-border bg-wa-panel px-3 py-2 sm:px-4"
    >
      {preview && (
        <div className="page-container mb-2 flex items-start gap-2 rounded-xl bg-white p-2 shadow-sm">
          <img
            src={preview}
            alt="Preview"
            className="h-14 w-14 rounded-lg object-cover sm:h-16 sm:w-16"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-600">Image ready to send</p>
            <p className="truncate text-xs text-slate-400">{image?.name}</p>
          </div>
          <button
            type="button"
            onClick={clearImage}
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Remove image"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="page-container flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={sending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-white/80 disabled:opacity-50 sm:h-11 sm:w-11"
          aria-label="Attach image"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImagePick(e.target.files?.[0] || null)}
        />

        <input
          type="text"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            onInputChange?.(e.target.value);
          }}
          placeholder={image ? "Add a caption (optional)" : "Message"}
          className="min-h-[40px] flex-1 rounded-3xl border-0 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500/30 sm:min-h-[44px]"
        />

        <button
          type="submit"
          disabled={!canSend}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-300 sm:h-11 sm:w-11"
          aria-label="Send"
        >
          {sending ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.4 20.4 20.85 12.28c.8-.4.8-1.5 0-1.9L3.4 2.6c-.77-.38-1.66.22-1.5 1.08l1.25 6.3c.1.5.5.88 1 .94l7.9.95-7.9.95c-.5.06-.9.44-1 .94l-1.25 6.3c-.16.86.73 1.46 1.5 1.08z" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}
