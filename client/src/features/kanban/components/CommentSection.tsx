import React, { useState } from 'react';
import {
  useGetTaskCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} from '../../../api/commentApi';
import { useAppSelector } from '../../../app/hooks';
import { Send, MessageSquare, Trash2, Edit2, Check, X, Loader2 } from 'lucide-react';
import type { Comment } from '../../../types';

interface CommentSectionProps {
  taskId: string;
  onTypingStart?: (taskId: string) => void;
  onTypingStop?: (taskId: string) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  taskId,
  onTypingStart,
  onTypingStop,
}) => {
  const [content, setContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { user } = useAppSelector((state) => state.auth);
  const currentUserId = user?._id || user?.id;

  const { data, isLoading } = useGetTaskCommentsQuery(taskId);
  const [createComment, { isLoading: isPosting }] = useCreateCommentMutation();
  const [updateComment, { isLoading: isUpdating }] = useUpdateCommentMutation();
  const [deleteComment, { isLoading: isDeleting }] = useDeleteCommentMutation();

  const comments: Comment[] = data?.data || [];

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await createComment({ taskId, content: content.trim() }).unwrap();
      setContent('');
      if (onTypingStop) onTypingStop(taskId);
    } catch (err) {
      console.error('Failed to post comment', err);
    }
  };

  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      await updateComment({ commentId, taskId, content: editContent.trim() }).unwrap();
      setEditingCommentId(null);
      setEditContent('');
    } catch (err: any) {
      console.error('Failed to update comment', err);
    }
  };

  const handleDelete = async (commentId: string) => {
    setDeleteError(null);
    try {
      await deleteComment({ commentId, taskId }).unwrap();
      setConfirmDeleteId(null);
    } catch (err: any) {
      console.error('Failed to delete comment', err);
      setDeleteError(err.data?.message || 'Failed to delete comment');
    }
  };

  return (
    <div className="mt-6 pt-6 border-t divider">
      <h4 className="label flex items-center space-x-2 mb-4">
        <MessageSquare className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        <span>Comments ({comments.length})</span>
      </h4>

      {deleteError && (
        <div className="mb-3 p-2 text-xs rounded bg-red-500/15 border border-red-500/30 text-red-300 flex items-center justify-between">
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError(null)} className="text-red-400 hover:text-red-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <form onSubmit={handlePostComment} className="flex gap-2 mb-6">
        <input
          type="text"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (onTypingStart) onTypingStart(taskId);
          }}
          onBlur={() => {
            if (onTypingStop) onTypingStop(taskId);
          }}
          placeholder="Write a comment..."
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={isPosting || !content.trim()}
          className="btn btn-primary px-4"
        >
          {isPosting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Post</span>
            </>
          )}
        </button>
      </form>

      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
        {isLoading ? (
          <p className="text-meta text-xs text-faint">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-meta text-xs text-faint italic">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment: Comment) => {
            const authorId =
              comment.author?._id ||
              comment.author?.id ||
              comment.user?._id ||
              comment.user?.id ||
              (typeof comment.author === 'string' ? comment.author : '');
            const isAuthor = Boolean(currentUserId && authorId && currentUserId === authorId);

            return (
              <div key={comment._id} className="glass-card p-3 rounded-xl text-xs group relative transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <div className="avatar w-5 h-5 text-[10px]">
                      {comment.author?.name ? comment.author.name[0].toUpperCase() : 'U'}
                    </div>
                    <span className="font-semibold text-ink">{comment.author?.name || 'User'}</span>
                    <span className="text-meta text-[10px] text-faint">
                      {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {isAuthor && (
                    <div className="flex items-center space-x-1">
                      {confirmDeleteId === comment._id ? (
                        <div className="flex items-center space-x-1 bg-red-500/15 px-1.5 py-0.5 rounded-lg border border-red-500/30">
                          <span className="text-[10px] text-red-400 font-medium">Delete?</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(comment._id)}
                            disabled={isDeleting}
                            className="text-red-400 hover:text-red-200 p-0.5 cursor-pointer"
                            title="Confirm Delete"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-mute hover:text-ink p-0.5 cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(comment._id);
                              setEditContent(comment.content);
                            }}
                            className="p-1 rounded hover:bg-white/10 text-mute hover:text-ink transition-colors cursor-pointer"
                            title="Edit comment"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(comment._id)}
                            className="p-1 rounded hover:bg-red-500/15 text-mute hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {editingCommentId === comment._id ? (
                  <div className="mt-1 pl-7 space-y-2">
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="input w-full text-xs py-1 px-2"
                      autoFocus
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingCommentId(null)}
                        className="text-[11px] text-mute hover:text-ink px-2 py-0.5 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating || !editContent.trim()}
                        onClick={() => handleUpdate(comment._id)}
                        className="btn btn-primary text-[11px] px-2.5 py-0.5 cursor-pointer"
                      >
                        {isUpdating ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-mute pl-7 whitespace-pre-wrap break-words">{comment.content}</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};