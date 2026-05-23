"use client";

import { FormEvent, useEffect, useState } from "react";
import { Avatar } from "./Avatar";
import { Spinner } from "./Spinner";
import { EditPostModal } from "./EditPostModal";
import { api } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/toast";
import type { Post, PostComment, ApiResponse } from "@/types";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface PostCardProps {
  post: Post;
  onUpdate: (postId: string, updates: Partial<Post>) => void;
  onRemove?: (postId: string) => void;
  currentUserId?: string;
}

export function PostCard({ post, onUpdate, onRemove, currentUserId }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liking, setLiking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

  const isOwner = currentUserId === post.author.id;

  useEffect(() => {
    if (!showComments) return;

    let cancelled = false;
    setLoadingComments(true);

    api<ApiResponse<{ comments: PostComment[] }>>(`/posts/${post.id}/comments`)
      .then((res) => {
        if (!cancelled) setComments(res.data.comments);
      })
      .finally(() => {
        if (!cancelled) setLoadingComments(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showComments, post.id]);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const res = await api<ApiResponse<{ liked: boolean; likesCount: number }>>(
        `/posts/${post.id}/like`,
        { method: "POST" }
      );
      onUpdate(post.id, {
        isLiked: res.data.liked,
        likesCount: res.data.likesCount,
      });
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const res = await api<ApiResponse<PostComment>>(`/posts/${post.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: commentText.trim() }),
      });
      setComments((prev) => [...prev, res.data]);
      setCommentText("");
      onUpdate(post.id, { commentsCount: post.commentsCount + 1 });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    try {
      await api(`/posts/${post.id}`, { method: "DELETE" });
      onRemove?.(post.id);
      toastSuccess("Post deleted");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to delete post");
    }
  };

  const handleSavePost = async (
    content: string,
    removeImage: boolean,
    newImage?: File
  ) => {
    const formData = new FormData();
    formData.append("content", content);
    if (removeImage) formData.append("removeImage", "true");
    if (newImage) formData.append("image", newImage);

    try {
      const res = await api<ApiResponse<Post>>(`/posts/${post.id}`, {
        method: "PATCH",
        body: formData,
      });
      onUpdate(post.id, res.data);
      toastSuccess("Post updated");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to update post");
      throw err;
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await api<ApiResponse<{ postId: string }>>(
        `/posts/${post.id}/comments/${commentId}`,
        { method: "DELETE" }
      );
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onUpdate(post.id, { commentsCount: Math.max(0, post.commentsCount - 1) });
      toastSuccess("Comment deleted");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to delete comment");
    }
  };

  const handleSaveComment = async (commentId: string) => {
    if (!editCommentText.trim()) return;
    try {
      const res = await api<ApiResponse<PostComment>>(
        `/posts/${post.id}/comments/${commentId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ content: editCommentText.trim() }),
        }
      );
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? res.data : c))
      );
      setEditingCommentId(null);
      setEditCommentText("");
      toastSuccess("Comment updated");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to update comment");
    }
  };

  return (
    <article className="card overflow-hidden !p-0">
      <div className="flex items-center gap-3 p-4 pb-0">
        <Avatar name={post.author.name} src={post.author.profilePicture} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{post.author.name}</p>
          <p className="text-xs text-slate-400">{timeAgo(post.createdAt)}</p>
        </div>
        {isOwner && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Post options"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 4a2 2 0 110-4 2 2 0 010 4zm0 4a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-surface-border bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setEditingPost(true);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Edit post
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      handleDeletePost();
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                  >
                    Delete post
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {post.content?.trim() && (
        <div className="px-4 py-3">
          <p className="whitespace-pre-wrap text-sm text-slate-800">{post.content}</p>
        </div>
      )}

      {post.imageUrl && (
        <div className="border-y border-surface-border">
          <img
            src={post.imageUrl}
            alt="Post"
            className="max-h-[28rem] w-full object-cover"
          />
        </div>
      )}

      <div className="flex items-center gap-1 border-t border-surface-border px-2 py-1">
        <button
          type="button"
          onClick={handleLike}
          disabled={liking}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
            post.isLiked
              ? "text-rose-600 hover:bg-rose-50"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <svg
            className={`h-5 w-5 ${post.isLiked ? "fill-current" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          {post.likesCount}
        </button>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {post.commentsCount}
        </button>
      </div>

      {showComments && (
        <div className="border-t border-surface-border bg-slate-50/80 p-4">
          {loadingComments ? (
            <div className="flex justify-center py-4">
              <Spinner className="h-6 w-6" />
            </div>
          ) : (
            <div className="mb-3 max-h-60 space-y-3 overflow-y-auto scrollbar-thin">
              {comments.length === 0 ? (
                <p className="text-center text-sm text-slate-400">No comments yet</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-2">
                    <Avatar name={c.author.name} src={c.author.profilePicture} size="sm" />
                    <div className="min-w-0 flex-1 rounded-2xl bg-white px-3 py-2 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-800">{c.author.name}</p>
                        {currentUserId === c.author.id && (
                          <div className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId(c.id);
                                setEditCommentText(c.content);
                              }}
                              className="text-[10px] font-medium text-brand-600 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(c.id)}
                              className="text-[10px] font-medium text-rose-600 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                      {editingCommentId === c.id ? (
                        <div className="mt-2 space-y-2">
                          <input
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            className="input-field !py-2 text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveComment(c.id)}
                              className="text-xs font-semibold text-brand-600"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCommentId(null)}
                              className="text-xs text-slate-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-700">{c.content}</p>
                      )}
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {timeAgo(c.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="input-field flex-1 !py-2.5"
            />
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              className="btn-primary shrink-0 !px-4 !py-2.5"
            >
              {submittingComment ? "..." : "Post"}
            </button>
          </form>
        </div>
      )}

      {editingPost && (
        <EditPostModal
          initialContent={post.content}
          hasImage={Boolean(post.imageUrl)}
          onSave={handleSavePost}
          onClose={() => setEditingPost(false)}
        />
      )}
    </article>
  );
}
