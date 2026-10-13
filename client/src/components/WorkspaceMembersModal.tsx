import React, { useState } from 'react';
import {
  useGetBoardsQuery,
  useInviteMemberMutation,
  useGetBoardInviteCodeQuery,
} from '../api/boardApi';
import { useAppSelector } from '../app/hooks';
import {
  X,
  Users,
  Mail,
  UserPlus,
  Shield,
  Link as LinkIcon,
  Copy,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface WorkspaceMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceName?: string;
}

export const WorkspaceMembersModal: React.FC<WorkspaceMembersModalProps> = ({
  isOpen,
  onClose,
  workspaceName = 'Workspace',
}) => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const { data: boardsData } = useGetBoardsQuery();
  const [inviteMember, { isLoading: isInviting }] = useInviteMemberMutation();

  const [email, setEmail] = useState('');
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'invite' | 'link'>('members');

  const boards = boardsData?.data || [];
  const primaryBoardId = selectedBoardId || (boards.length > 0 ? boards[0]._id : '');
  const { data: inviteCodeData } = useGetBoardInviteCodeQuery(primaryBoardId, {
    skip: !isOpen || !primaryBoardId,
  });

  if (!isOpen) return null;

  // Consolidate unique members across all boards
  const memberMap = new Map<string, { id: string; name: string; email: string; avatar?: string; role: string; boards: string[] }>();

  // Check which users are owners of at least one board
  const isOwnerOfBoard = (userId?: string) => {
    if (!userId) return false;
    return boards.some((b) => {
      const oId = typeof b.owner === 'object' && b.owner !== null ? (b.owner as any)._id : b.owner;
      return String(oId) === String(userId);
    });
  };

  // Add current user first
  if (currentUser) {
    const isCurrentUserAdmin = isOwnerOfBoard(currentUser._id);
    memberMap.set(currentUser._id || 'me', {
      id: currentUser._id || 'me',
      name: currentUser.name || (isCurrentUserAdmin ? 'Admin' : 'Member'),
      email: currentUser.email || '',
      avatar: currentUser.avatar,
      role: isCurrentUserAdmin ? 'Admin' : 'Member',
      boards: ['All Projects'],
    });
  }

  // Add members from all boards
  boards.forEach((board) => {
    const boardTitle = board.name || board.title || 'Project';

    // Handle board owner
    if (board.owner) {
      const oObj: any = board.owner;
      const oId = String(oObj._id || oObj);
      if (oId !== currentUser?._id) {
        if (memberMap.has(oId)) {
          const existing = memberMap.get(oId)!;
          existing.role = 'Admin';
          if (!existing.boards.includes(boardTitle)) existing.boards.push(boardTitle);
        } else {
          memberMap.set(oId, {
            id: oId,
            name: oObj.name || 'Owner',
            email: oObj.email || '',
            avatar: oObj.avatar,
            role: 'Admin',
            boards: [boardTitle],
          });
        }
      }
    }

    if (board.members && Array.isArray(board.members)) {
      board.members.forEach((m: any) => {
        if (!m || !m._id) return;
        if (m._id === currentUser?._id) return;

        const isMemberAdmin = isOwnerOfBoard(m._id);

        if (memberMap.has(m._id)) {
          const existing = memberMap.get(m._id)!;
          if (isMemberAdmin) existing.role = 'Admin';
          if (!existing.boards.includes(boardTitle)) {
            existing.boards.push(boardTitle);
          }
        } else {
          memberMap.set(m._id, {
            id: m._id,
            name: m.name || 'Member',
            email: m.email || '',
            avatar: m.avatar,
            role: isMemberAdmin ? 'Admin' : 'Member',
            boards: [boardTitle],
          });
        }
      });
    }
  });

  const memberList = Array.from(memberMap.values());
  const inviteCode = inviteCodeData?.data?.inviteCode || (boards.find((b) => b._id === primaryBoardId)?.inviteCode) || '';
  const workspaceShareUrl = inviteCode
    ? `${window.location.origin}/boards/join/${inviteCode}`
    : `${window.location.origin}/join?workspace=${encodeURIComponent(workspaceName)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(workspaceShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) return;

    if (!primaryBoardId) {
      setErrorMsg('Please create at least one project first to invite team members.');
      return;
    }

    try {
      await inviteMember({ boardId: primaryBoardId, email: email.trim() }).unwrap();
      setSuccessMsg(`Invitation sent successfully to ${email}!`);
      setEmail('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.data?.message || 'Failed to send invite.');
    }
  };

  return (
    <div className="modal-scrim">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg modal-panel p-6 relative flex flex-col max-h-[85vh]"
      >
        <button
          onClick={onClose}
          className="icon-btn absolute top-4 right-4"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center justify-center text-accent">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-ink">Team Members</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-accent px-2 py-0.5 rounded-full border border-[color-mix(in_srgb,var(--accent)_30%,transparent)]">
                {workspaceName}
              </span>
            </div>
            <p className="text-xs text-mute">Manage members and collaborate across projects</p>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex border-b border-edge mb-4 gap-2">
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'members'
                ? 'border-accent text-accent'
                : 'border-transparent text-mute hover:text-ink'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members ({memberList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('invite')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'invite'
                ? 'border-accent text-accent'
                : 'border-transparent text-mute hover:text-ink'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite by Email</span>
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'link'
                ? 'border-accent text-accent'
                : 'border-transparent text-mute hover:text-ink'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Invite Link</span>
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'members' && (
            <div className="space-y-2.5">
              {memberList.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface/50 border border-edge hover:bg-surface transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="avatar w-9 h-9 text-xs font-bold text-white bg-accent shrink-0 shadow-sm flex items-center justify-center rounded-full">
                      {m.name ? m.name[0].toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-ink truncate">{m.name}</span>
                        {m.role === 'Admin' && (
                          <span className="text-[10px] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-accent px-2 py-0.5 rounded-full border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center space-x-1 font-bold">
                            <Shield className="w-2.5 h-2.5" />
                            <span>Admin</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-mute block truncate">{m.email}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <span className="text-xs text-mute capitalize">{m.role}</span>
                    <span className="block text-[10px] text-faint">
                      {m.boards.length} {m.boards.length === 1 ? 'project' : 'projects'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'invite' && (
            <form onSubmit={handleSendInvite} className="space-y-4 pt-1">
              <p className="text-xs text-mute">
                Send an invitation to a colleague's email address to collaborate in workspace{' '}
                <strong className="text-ink">{workspaceName}</strong>.
              </p>

              {errorMsg && (
                <div className="notice notice-danger text-xs">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="notice notice-success text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div>
                <label className="label">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-mute absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    className="input pl-9"
                  />
                </div>
              </div>

              {boards.length > 1 && (
                <div>
                  <label className="label">
                    Select Project to Invite To
                  </label>
                  <select
                    value={primaryBoardId}
                    onChange={(e) => setSelectedBoardId(e.target.value)}
                    className="input"
                  >
                    {boards.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name || b.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={isInviting}
                  className="btn btn-primary"
                >
                  {isInviting ? (
                    <span>Sending Invitation...</span>
                  ) : (
                    <>
                      <span>Send Invitation</span>
                      <UserPlus className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'link' && (
            <div className="space-y-4 pt-1">
              <p className="text-xs text-mute">
                Share this link with your teammates. Anyone with this link can register and join this workspace.
              </p>

              <div>
                <label className="label">
                  Workspace Join Link
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 input font-mono text-xs truncate select-all">
                    {workspaceShareUrl}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="btn btn-primary shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
