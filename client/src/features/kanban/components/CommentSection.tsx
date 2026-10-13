import React, { useState } from 'react';
import { useGetTaskCommentsQuery, useCreateCommentMutation } from '../../../api/commentApi';
import { Send, MessageSquare } from 'lucide-react';
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
  const { data, isLoading } = useGetTaskCommentsQuery(taskId);
  const [createComment, { isLoading: isPosting }] = useCreateCommentMutation();

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

  return (
    <div className="mt-6 pt-6 border-t divider">
      <h4 className="label flex items-center space-x-2 mb-4">
        <MessageSquare className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        <span>Comments ({comments.length})</span>
      </h4>

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
          <Send className="w-3.5 h-3.5" />
          <span>Post</span>
        </button>
      </form>

      <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
        {isLoading ? (
          <p className="text-meta text-xs text-faint">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-meta text-xs text-faint italic">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment: Comment) => (
            <div key={comment._id} className="glass-card p-3 rounded-xl text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <div className="avatar w-5 h-5 text-[10px]">
                    {comment.author?.name ? comment.author.name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="font-semibold text-ink">{comment.author?.name || 'User'}</span>
                </div>
                <span className="text-meta text-[10px] text-faint">
                  {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-mute pl-7">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};