import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, User, Column } from '../../../types';
import { useAppDispatch } from '../../../app/hooks';
import { setActiveTaskId } from '../../board/boardSlice';
import { useMoveTaskMutation, useDeleteTaskMutation } from '../../../api/taskApi';
import { MessageSquare, Trash2, User as UserIcon, ChevronDown, Check, Move, Calendar } from 'lucide-react';
import { TypingIndicator } from './TypingIndicator';
import { columnColor, priorityLabel } from '../../../utils/columnTheming';
import type { TypingUser, DraggingUser } from '../../../sockets/useSocketEvents';

interface TaskCardProps {
  task: Task;
  currentColumn?: Column;
  columns?: Column[];
  boardId?: string;
  typingUsers?: TypingUser[];
  draggingUser?: DraggingUser;
  isOverlay?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  currentColumn,
  columns = [],
  boardId,
  typingUsers,
  draggingUser,
  isOverlay = false,
}) => {
  const dispatch = useAppDispatch();
  const [moveTask, { isLoading: isMoving }] = useMoveTaskMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: { task },
    disabled: isOverlay,
  });

  const assignees = (task.assignees || []) as User[];
  const primaryAssignee = assignees.length > 0 ? assignees[0] : null;
  const critical = task.priority === 'critical';
  const isBeingMoved = !!draggingUser;

  // Derive column information
  const activeCol = columns.find((c) => c._id === task.columnId) || currentColumn;
  const colName = activeCol?.name || 'To Do';
  const colColor = activeCol ? columnColor(activeCol.name) : '#3b82f6';
  const isCompleted =
    colName.toLowerCase().includes('done') ||
    colName.toLowerCase().includes('complete');

  const dueStatus = (() => {
    if (!task.dueDate) return null;
    const due = new Date(task.dueDate);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    if (due < startOfToday) return 'overdue' as const;
    if (due < endOfToday) return 'today' as const;
    return 'upcoming' as const;
  })();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    borderTopColor: colColor,
    '--card-col': colColor,
  } as React.CSSProperties;

  const handleCardClick = () => {
    dispatch(setActiveTaskId(task._id));
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(setActiveTaskId(task._id));
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!boardId) return;
    if (window.confirm(`Delete task "${task.title}"?`)) {
      try {
        await deleteTask({ taskId: task._id, boardId }).unwrap();
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const targetColumnId = e.target.value;
    if (!targetColumnId || targetColumnId === task.columnId || !boardId) return;

    try {
      await moveTask({
        taskId: task._id,
        boardId,
        columnId: targetColumnId,
      }).unwrap();
    } catch (err) {
      console.error('Failed to change task status:', err);
    }
  };

  const getPriorityStyle = (priority?: string) => {
    switch (priority) {
      case 'critical':
        return 'border-rose-500/60 bg-rose-500/15 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]';
      case 'high':
        return 'border-rose-500/50 bg-rose-500/15 text-rose-300';
      case 'medium':
        return 'border-pink-500/50 bg-pink-500/10 text-pink-300';
      case 'low':
        return 'border-blue-500/40 bg-blue-500/10 text-blue-300';
      default:
        return 'border-slate-600/50 bg-slate-700/20 text-slate-300';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
      onClick={handleCardClick}
      className={`group task-card p-3.5 sm:p-4 cursor-pointer relative overflow-hidden transition-all rounded-xl select-none border border-white/10 border-t-[3.5px] shadow-sm hover:shadow-lg ${
        critical ? 'task-critical' : ''
      } ${
        isBeingMoved
          ? 'ring-2 ring-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.3)] bg-amber-950/20'
          : ''
      }`}
    >
      {/* Live Movement Indicator */}
      {isBeingMoved && (
        <div className="mb-2.5 flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
          <Move className="w-3 h-3 text-amber-400 animate-spin" />
          <span className="truncate">Moved by {draggingUser.userName}...</span>
        </div>
      )}

      {/* Task Title */}
      <h4 className="text-card-title text-sm font-bold text-ink line-clamp-2 mb-2 tracking-tight hover:text-accent transition-colors">
        {task.title}
      </h4>

      {/* Urgency & Completed Badges + Typing Indicator */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Urgency Badge */}
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase border ${getPriorityStyle(
              task.priority
            )}`}
          >
            {priorityLabel(task.priority).toUpperCase()}
          </span>

          {/* Completed Badge (Shown when in Done column, matching Image 2) */}
          {isCompleted && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
              <Check className="w-2.5 h-2.5 text-emerald-500 stroke-[3]" />
              <span>COMPLETED</span>
            </span>
          )}
        </div>

        {typingUsers && typingUsers.length > 0 && (
          <TypingIndicator typingUsers={typingUsers} />
        )}
      </div>

      {/* Description Preview (if present) */}
      {task.description && (
        <div
          className="card-tiptap-preview text-xs text-mute line-clamp-1 mb-3 opacity-90"
          dangerouslySetInnerHTML={{ __html: task.description }}
        />
      )}

      {/* Due Date Indicator (if present) */}
      {task.dueDate && (
        <div
          className={`inline-flex items-center space-x-1.5 text-[11px] font-semibold mb-3 px-2 py-0.5 rounded-full border ${
            dueStatus === 'overdue'
              ? 'text-rose-500 bg-rose-500/10 border-rose-500/30'
              : dueStatus === 'today'
                ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
                : 'text-mute bg-surface border-edge'
          }`}
        >
          <Calendar className="w-3 h-3" />
          <span>
            {new Date(task.dueDate).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            })}
          </span>
          {!isCompleted && dueStatus === 'overdue' && (
            <span className="uppercase tracking-wide text-[9px] font-extrabold">Overdue</span>
          )}
          {!isCompleted && dueStatus === 'today' && (
            <span className="uppercase tracking-wide text-[9px] font-extrabold">Today</span>
          )}
        </div>
      )}

      {/* Bottom Row: Assignee Name, Comment Option, Status Dropdown, Delete Option */}
      <div className="flex items-center justify-between pt-2.5 border-t border-edge gap-2">
        {/* Assignee Name & Yellow/Amber Icon */}
        <div className="flex items-center space-x-1.5 min-w-0 flex-1">
          <div className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-500 flex items-center justify-center shrink-0">
            <UserIcon className="w-3 h-3 text-amber-500" />
          </div>
          <span
            className="text-xs font-semibold text-ink truncate"
            title={primaryAssignee?.name || 'Unassigned'}
          >
            {primaryAssignee ? primaryAssignee.name : 'Unassigned'}
          </span>
          {assignees.length > 1 && (
            <span className="text-[10px] font-bold text-faint px-1 py-0.2 rounded bg-surface border border-edge shrink-0">
              +{assignees.length - 1}
            </span>
          )}
        </div>

        {/* Action Controls: Comment, Status Selector, Delete */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Comment Option */}
          <button
            type="button"
            onClick={handleCommentClick}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex items-center space-x-1 text-mute hover:text-ink px-1.5 py-1 rounded-md hover:bg-card-hover transition-colors cursor-pointer"
            title={`${task.commentCount ?? 0} Comments (Click to view)`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold">
              {task.commentCount ?? 0}
            </span>
          </button>

          {/* Status Dropdown / Selector */}
          <div
            className="relative inline-flex items-center"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <select
              value={activeCol?._id || task.columnId}
              onChange={handleStatusChange}
              disabled={isMoving}
              className="appearance-none cursor-pointer pl-2 pr-5 py-1 rounded-md text-[11px] font-bold tracking-wide border transition-all focus:outline-none focus:ring-1 focus:ring-accent hover:brightness-110"
              style={{
                backgroundColor: `color-mix(in srgb, ${colColor} 16%, transparent)`,
                borderColor: `color-mix(in srgb, ${colColor} 45%, transparent)`,
                color: colColor,
              }}
              title={`Status: ${colName}. Click to change.`}
            >
              {columns && columns.length > 0 ? (
                columns.map((c) => (
                  <option
                    key={c._id}
                    value={c._id}
                    className="bg-card text-ink font-medium"
                  >
                    {c.name}
                  </option>
                ))
              ) : (
                <option value={task.columnId} className="bg-card text-ink">
                  {colName}
                </option>
              )}
            </select>
            <ChevronDown
              className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-85"
              style={{ color: colColor }}
            />
          </div>

          {/* Delete Option */}
          <button
            type="button"
            onClick={handleDelete}
            onPointerDown={(e) => e.stopPropagation()}
            disabled={isDeleting}
            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-rose-200 border border-rose-500/30 hover:border-rose-500/60 transition-all cursor-pointer shrink-0 disabled:opacity-50"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
