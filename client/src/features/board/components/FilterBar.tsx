import React from 'react';
import { Search, Filter, RotateCcw, User as UserIcon, CalendarDays } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  setSearchQuery,
  setPriorityFilter,
  setAssigneeFilter,
  setDueDateFilter,
  resetFilters,
} from '../boardSlice';
import type { User } from '../../../types';
import { PRIORITY_LABELS } from '../../../utils/columnTheming';

interface FilterBarProps {
  members: User[];
}

export const FilterBar: React.FC<FilterBarProps> = ({ members }) => {
  const dispatch = useAppDispatch();
  const { searchQuery, priorityFilter, assigneeFilter, dueDateFilter } = useAppSelector((state) => state.board);

  const hasActiveFilters =
    searchQuery !== '' ||
    priorityFilter !== 'all' ||
    assigneeFilter !== 'all' ||
    dueDateFilter !== 'all';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 glass-card p-3 rounded-2xl border border-edge bg-card shadow-xs">
      <div className="flex items-center space-x-3 flex-1 min-w-[240px]">
        <div className="relative flex-1 max-w-xs">
          <Search
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-mute pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            placeholder="Search tasks..."
            style={{ paddingLeft: '40px' }}
            className="input pl-9 py-2 text-[13px] text-ink placeholder:text-faint font-medium bg-surface border-edge focus:border-accent"
          />
        </div>
      </div>

      <div className="flex items-center space-x-3 flex-wrap gap-y-2">
        <div className="flex items-center space-x-2 glass-panel rounded-xl px-3 py-2 border border-edge bg-surface">
          <Filter className="w-3.5 h-3.5 text-accent" />
          <select
            value={priorityFilter}
            onChange={(e) =>
              dispatch(
                setPriorityFilter(e.target.value as 'all' | 'low' | 'medium' | 'high' | 'critical')
              )
            }
            className="bg-transparent text-xs font-semibold cursor-pointer text-ink focus:outline-none"
          >
            <option value="all" className="bg-card text-ink">All Priorities</option>
            <option value="critical" className="bg-card text-ink">{PRIORITY_LABELS.critical} Priority</option>
            <option value="high" className="bg-card text-ink">{PRIORITY_LABELS.high} Priority</option>
            <option value="medium" className="bg-card text-ink">{PRIORITY_LABELS.medium} Priority</option>
            <option value="low" className="bg-card text-ink">{PRIORITY_LABELS.low} Priority</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 glass-panel rounded-xl px-3 py-2 border border-edge bg-surface">
          <UserIcon className="w-3.5 h-3.5 text-accent" />
          <select
            value={assigneeFilter}
            onChange={(e) => dispatch(setAssigneeFilter(e.target.value))}
            className="bg-transparent text-xs font-semibold cursor-pointer text-ink focus:outline-none"
          >
            <option value="all" className="bg-card text-ink">All Assignees</option>
            {members.map((m) => (
              <option key={m._id} value={m._id} className="bg-card text-ink">
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2 glass-panel rounded-xl px-3 py-2 border border-edge bg-surface">
          <CalendarDays className="w-3.5 h-3.5 text-accent" />
          <select
            value={dueDateFilter}
            onChange={(e) =>
              dispatch(setDueDateFilter(e.target.value as 'all' | 'overdue' | 'today' | 'week'))
            }
            className="bg-transparent text-xs font-semibold cursor-pointer text-ink focus:outline-none"
          >
            <option value="all" className="bg-card text-ink">All Dates</option>
            <option value="overdue" className="bg-card text-ink">Overdue</option>
            <option value="today" className="bg-card text-ink">Due Today</option>
            <option value="week" className="bg-card text-ink">Due This Week</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => dispatch(resetFilters())}
            className="flex items-center space-x-1 text-xs font-semibold btn-danger px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};