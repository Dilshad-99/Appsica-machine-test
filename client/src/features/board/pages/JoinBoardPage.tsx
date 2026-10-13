import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useGetBoardPreviewQuery,
  useJoinBoardByInviteCodeMutation,
} from '../../../api/boardApi';
import { useAppSelector } from '../../../app/hooks';
import { LayoutGrid, Users, Shield, ArrowRight, CheckCircle2, UserPlus, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

export const JoinBoardPage: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [successMsg, setSuccessMsg] = useState('');

  const { data, isLoading, error } = useGetBoardPreviewQuery(inviteCode!);
  const [joinBoard, { isLoading: isJoining }] = useJoinBoardByInviteCodeMutation();

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 glass-card rounded-2xl animate-pulse space-y-4">
        <div className="h-10 skeleton rounded-xl" />
        <div className="h-20 skeleton rounded-xl" />
        <div className="h-12 skeleton rounded-xl" />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="max-w-md mx-auto my-20 text-center glass-card p-8 rounded-2xl border border-edge">
        <h3 className="text-xl font-bold text-danger mb-2">Invalid or Expired Share Link</h3>
        <p className="text-xs text-mute mb-6">
          This board invite link may have been revoked by the owner or no longer exists.
        </p>
        <Link
          to="/boards"
          className="btn btn-primary"
        >
          <span>Back to Workspace</span>
        </Link>
      </div>
    );
  }

  const preview = data.data;

  const handleJoin = async () => {
    try {
      const res = await joinBoard(inviteCode!).unwrap();
      setSuccessMsg('Successfully joined workspace!');
      setTimeout(() => {
        navigate(`/boards/${res.data.boardId}`);
      }, 1000);
    } catch (err: any) {
      alert(err.data?.message || 'Failed to join board');
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-6 select-none">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card rounded-3xl p-8 border border-edge shadow-2xl text-center relative overflow-hidden"
      >
        <div className="brand-mark w-14 h-14 mx-auto mb-5 shadow-lg flex items-center justify-center">
          <LayoutGrid className="w-7 h-7" />
        </div>

        <h2 className="text-2xl font-black text-ink mb-2">{preview.title}</h2>
        <p className="text-xs text-mute mb-6 leading-relaxed">
          {preview.description || 'You have been invited to collaborate on this workspace board.'}
        </p>

        {/* Board Meta Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-3.5 rounded-2xl glass-panel border border-edge text-left text-xs">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-accent shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-faint block">Owner</span>
              <span className="font-semibold text-ink truncate block">
                {preview.owner?.name || 'Workspace Owner'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-accent shrink-0" />
            <div>
              <span className="text-[10px] text-faint block">Team Size</span>
              <span className="font-semibold text-ink block">
                {preview.membersCount} members
              </span>
            </div>
          </div>
        </div>

        {successMsg && (
          <div className="notice notice-success mb-4 text-xs flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {isAuthenticated ? (
          <button
            onClick={handleJoin}
            disabled={isJoining || Boolean(successMsg)}
            className="btn btn-primary w-full py-3.5 text-sm flex items-center justify-center space-x-2 shadow-xl cursor-pointer"
          >
            {isJoining ? (
              <span>Joining Workspace...</span>
            ) : (
              <>
                <span>Join Workspace Board</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        ) : (
          <div className="space-y-3">
            <Link
              to={`/register?inviteCode=${inviteCode}&workspace=${encodeURIComponent(preview.title)}`}
              className="btn btn-primary w-full py-3.5 text-sm flex items-center justify-center space-x-2 shadow-xl"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account to Join</span>
            </Link>

            <Link
              to={`/login?redirect=/boards/join/${inviteCode}&workspace=${encodeURIComponent(preview.title)}`}
              className="btn btn-ghost w-full py-2.5 text-xs flex items-center justify-center space-x-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Already have an account? Sign In</span>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};
