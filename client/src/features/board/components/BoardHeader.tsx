import React from 'react';
import type { Board, User } from '../../../types';
import { UserPlus, Activity, BarChart2, Radio, Share2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { toggleActivityDrawer, toggleAnalyticsModal } from '../boardSlice';

interface BoardHeaderProps {
  board: Board;
  onlineMemberIds: string[];
  onOpenInviteModal: () => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  board,
  onlineMemberIds,
  onOpenInviteModal,
}) => {
  const dispatch = useAppDispatch();
  const { isActivityOpen, isAnalyticsOpen } = useAppSelector((state) => state.board);

  const members = board.members || [];

  const ownerEntry =
    board.owner && typeof board.owner === 'object' && board.owner._id
      ? { _id: String(board.owner._id), name: board.owner.name || 'Owner' }
      : null;

  const memberEntries = members.map((member: User | any) => {
    const mId = typeof member === 'string' ? member : member._id;
    const mName = typeof member === 'string' ? 'Member' : member.name;
    return { _id: String(mId), name: mName || '', isOwner: false };
  });

  const allAvatars = ownerEntry ? [{ ...ownerEntry, isOwner: true }, ...memberEntries] : memberEntries;
  const shownAvatars = allAvatars.slice(0, 5);
  const overflow = allAvatars.length - shownAvatars.length;

  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-5 border-b divider mb-6">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-section text-ink font-extrabold truncate max-w-full">{board.name}</h1>
            <span className="badge badge-success font-semibold">
              <Radio className="w-3 h-3" />
              <span>Realtime</span>
            </span>
          </div>
          {board.description && (
            <p className="text-meta text-mute font-medium mt-1.5 line-clamp-1">{board.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3 flex-wrap gap-y-2">
        <div className="flex items-center -space-x-1.5 glass-panel rounded-full px-2.5 py-1.5 border border-edge bg-surface">
          {allAvatars.length === 0 && (
            <span className="text-xs text-mute font-medium px-1">No members</span>
          )}
          {shownAvatars.map(({ _id, name, isOwner }) => {
            const mId = _id;
            const mName = name;
            const isOnline = onlineMemberIds.includes(mId);

            return (
              <div
                key={mId}
                className="relative group"
                title={`${mName}${isOwner ? ' (Owner)' : ''} ${isOnline ? '· Online' : ''}`}
              >
                <div
                  className="avatar w-7 h-7 text-xs font-bold text-on-accent bg-accent"
                  style={{ boxShadow: '0 0 0 2.5px var(--surface)' }}
                >
                  {mName ? mName[0].toUpperCase() : 'U'}
                </div>
                {isOnline && <span className="presence-dot absolute -bottom-0.5 -right-0.5" />}
              </div>
            );
          })}

          {overflow > 0 && (
            <span
              className="w-7 h-7 rounded-full bg-surface text-mute border border-edge text-[10px] font-bold flex items-center justify-center ml-2"
              style={{ boxShadow: '0 0 0 2.5px var(--surface)' }}
              title={`${overflow} more member${overflow > 1 ? 's' : ''}`}
            >
              +{overflow}
            </span>
          )}

          <button
            onClick={onOpenInviteModal}
            className="w-7 h-7 rounded-full bg-surface hover:bg-card-hover text-mute hover:text-ink border border-edge flex items-center justify-center transition-colors ml-2"
            style={{ boxShadow: '0 0 0 2.5px var(--surface)' }}
            title="Members & Share Link"
          >
            <UserPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={onOpenInviteModal}
          className="chip hover:border-accent transition-all font-semibold text-ink"
          title="Share Board Invite Link"
        >
          <Share2 className="w-4 h-4 text-accent" />
          <span>Share</span>
        </button>

        <button
          onClick={() => dispatch(toggleAnalyticsModal())}
          className={isAnalyticsOpen ? 'chip chip-active font-semibold text-ink' : 'chip font-semibold text-ink'}
        >
          <BarChart2 className="w-4 h-4 text-accent" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => dispatch(toggleActivityDrawer())}
          className={isActivityOpen ? 'chip chip-active font-semibold text-ink' : 'chip font-semibold text-ink'}
        >
          <Activity className="w-4 h-4 text-accent" />
          <span>Activity</span>
        </button>
      </div>
    </div>
  );
};