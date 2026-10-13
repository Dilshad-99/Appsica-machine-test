import React from 'react';
import { Search, Filter, RotateCcw, User as UserIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  setSearchQuery,
  setPriorityFilter,
  setAssigneeFilter,
  resetFilters,
} from '../boardSlice';
import type { User } from '../../../types';
import { PRIORITY_LABELS } from '../../../utils/columnTheming';

interface FilterBarProps {
  members: User[];
}

export const FilterBar: React.FC<FilterBarProps> = ({ members }) => {
  const dispatch = useAppDispatch();
  const { searchQuery, priorityFilter, assigneeFilter } = useAppSelector((state) => state.board);

  const hasActiveFilters = searchQuery !== '' || priorityFilter !== 'all' || assigneeFilter !== 'all';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 glass-panel p-3 rounded-2xl border border-white/10">
      <div className="flex items-center space-x-3 flex-1 min-w-[240px]">
        <div className="relative flex-1 max-w-xs">
          <Search
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            placeholder="Search tasks..."
            style={{ paddingLeft: '40px' }}
            className="input pl-9 py-2 text-[13px] text-white placeholder:text-slate-300 font-medium bg-white/5 border-white/15 focus:border-purple-400"
          />
        </div>
      </div>

      <div className="flex items-center space-x-3 flex-wrap gap-y-2">
        <div className="flex items-center space-x-2 glass-panel rounded-xl px-3 py-2 border border-white/15 bg-white/5">
          <Filter className="w-3.5 h-3.5 text-purple-300" />
          <select
            value={priorityFilter}
            onChange={(e) => dispatch(setPriorityFilter(e.target.value as any))}
            className="bg-transparent text-xs font-semibold cursor-pointer text-white focus:outline-none"
          >
            <option value="all" className="bg-[#18181b] text-white">All Priorities</option>
            <option value="critical" className="bg-[#18181b] text-white">{PRIORITY_LABELS.critical} Priority</option>
            <option value="high" className="bg-[#18181b] text-white">{PRIORITY_LABELS.high} Priority</option>
            <option value="medium" className="bg-[#18181b] text-white">{PRIORITY_LABELS.medium} Priority</option>
            <option value="low" className="bg-[#18181b] text-white">{PRIORITY_LABELS.low} Priority</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 glass-panel rounded-xl px-3 py-2 border border-white/15 bg-white/5">
          <UserIcon className="w-3.5 h-3.5 text-purple-300" />
          <select
            value={assigneeFilter}
            onChange={(e) => dispatch(setAssigneeFilter(e.target.value))}
            className="bg-transparent text-xs font-semibold cursor-pointer text-white focus:outline-none"
          >
            <option value="all" className="bg-[#18181b] text-white">All Assignees</option>
            {members.map((m) => (
              <option key={m._id} value={m._id} className="bg-[#18181b] text-white">
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => dispatch(resetFilters())}
            className="flex items-center space-x-1 text-xs font-semibold btn-danger px-2.5 py-1.5 rounded-lg transition-colors text-white"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};