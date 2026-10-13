import React, { useState, useEffect } from 'react';
import type { Task, User, Column } from '../../../types';
import { useUpdateTaskMutation, useDeleteTaskMutation } from '../../../api/taskApi';
import { useAppDispatch } from '../../../app/hooks';
import { setActiveTaskId } from '../../board/boardSlice';
import { X, Trash2, User as UserIcon } from 'lucide-react';
import { CommentSection } from './CommentSection';
import { TypingIndicator } from './TypingIndicator';
import { RichTextEditor } from '../../../components/RichTextEditor';
import type { TypingUser } from '../../../sockets/useSocketEvents';
import { motion } from 'framer-motion';

interface TaskModalProps {
  task: Task;
  boardId: string;
  members: User[];
  columns: Column[];
  typingUsers?: TypingUser[];
  onTypingStart: (taskId: string) => void;
  onTypingStop: (taskId: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  boardId,
  members,
  columns,
  typingUsers,
  onTypingStart,
  onTypingStop,
}) => {
  const dispatch = useAppDispatch();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>(task.priority || 'medium');
  const [columnId, setColumnId] = useState(task.columnId);
  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
    task.assignees ? task.assignees.map((a) => (typeof a === 'string' ? a : a._id)) : []
  );
  const [conflictError, setConflictError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority || 'medium');
    setColumnId(task.columnId);
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setSelectedAssignees(task.assignees ? task.assignees.map((a) => (typeof a === 'string' ? a : a._id)) : []);
    setConflictError(null);
  }, [task]);

  const handleClose = () => {
    dispatch(setActiveTaskId(null));
  };

  const handleSave = async () => {
    try {
      setConflictError(null);
      await updateTask({
        taskId: task._id,
        boardId,
        title,
        description,
        priority,
        dueDate: dueDate || null,
        assignees: selectedAssignees,
        version: task.version,
      }).unwrap();
      onTypingStop(task._id);
      handleClose();
    } catch (err: any) {
      if (err?.status === 409 || err?.data?.message === 'VERSION_CONFLICT') {
        setConflictError(
          'Simultaneous update conflict: Another team member saved changes to this task while you were editing. Review the latest values or make your edits again.'
        );
      } else {
        console.error('Failed to update task', err);
      }
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask({ taskId: task._id, boardId }).unwrap();
        handleClose();
      } catch (err) {
        console.error('Failed to delete task', err);
      }
    }
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="modal-scrim">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[90vh] modal-panel bg-card text-ink rounded-2xl p-6 border border-edge shadow-2xl overflow-y-auto relative flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-edge">
          <div className="flex items-center space-x-3">
            <TypingIndicator typingUsers={typingUsers} />
            {task.version && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface text-faint border border-edge">
                v{task.version}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="icon-btn ml-auto"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Simultaneous Update Conflict Warning */}
        {conflictError && (
          <div className="mt-3 p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs">
            <p className="font-semibold mb-1">⚠️ Simultaneous Update Conflict</p>
            <p>{conflictError}</p>
          </div>
        )}

        <div className="space-y-5 my-4">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold text-mute uppercase tracking-wider mb-1">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                onTypingStart(task._id);
              }}
              onBlur={() => onTypingStop(task._id)}
              className="input w-full text-lg font-bold"
            />
          </div>

          {/* TipTap Rich Text Description with Cloudinary Upload & @Member Tagging */}
          <div>
            <label className="block text-xs font-semibold text-mute uppercase tracking-wider mb-1">
              Formattable Description (@Member Tagging & Cloudinary Uploads)
            </label>
            <RichTextEditor
              content={description}
              onChange={(html) => setDescription(html)}
              onTypingStart={() => onTypingStart(task._id)}
              onTypingStop={() => onTypingStop(task._id)}
              members={members}
            />
          </div>

          {/* Priority & Column & Due Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="input w-full text-xs cursor-pointer"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wider mb-1">
                Status / Column
              </label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="input w-full text-xs cursor-pointer"
              >
                {columns.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wider mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input w-full text-xs"
              />
            </div>
          </div>

          {/* Assignees Selector */}
          <div>
            <label className="block text-xs font-semibold text-mute uppercase tracking-wider mb-2">
              Assignees
            </label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => {
                const isSelected = selectedAssignees.includes(member._id);
                return (
                  <button
                    key={member._id}
                    type="button"
                    onClick={() => toggleAssignee(member._id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-accent/20 text-ink border-accent font-semibold'
                        : 'bg-surface text-mute border-edge hover:bg-card-hover'
                    }`}
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>{member.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment Section */}
          <CommentSection taskId={task._id} onTypingStart={onTypingStart} onTypingStop={onTypingStop} />
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-edge mt-auto">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center space-x-1.5 text-xs text-rose-500 hover:text-rose-600 px-3 py-2 rounded-xl hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Task</span>
          </button>

          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="btn btn-primary"
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};