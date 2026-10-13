import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from '../api/notificationApi';
import { useRespondInvitationMutation } from '../api/boardApi';
import { useAppDispatch } from '../app/hooks';
import { setActiveTaskId } from '../features/board/boardSlice';
import { getSocket } from '../sockets/socket';
import type { AppNotification } from '../types';
import { Bell, Mail, AtSign, UserPlus, Check, X, CheckCheck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RespondModalState {
  notification: AppNotification;
  action: 'accept' | 'decline';
  mode: 'confirm' | 'done' | 'error';
  error?: string;
}

export const HeaderNotifications: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [respondModal, setRespondModal] = useState<RespondModalState | null>(null);

  const { data, refetch } = useGetNotificationsQuery();
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [respondInvitation, { isLoading: isResponding }] = useRespondInvitationMutation();

  const notifications = data?.data?.notifications || [];
  const unreadCount = data?.data?.unreadCount || 0;

  // Real-time socket listener for new notifications
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewNotification = () => {
      refetch();
    };

    socket.on('notification:new', handleNewNotification);
    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [refetch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openRespondModal = (notif: AppNotification, action: 'accept' | 'decline') => {
    setRespondModal({ notification: notif, action, mode: 'confirm' });
  };

  const closeRespondModal = () => {
    if (!isResponding) setRespondModal(null);
  };

  const confirmRespond = async () => {
    if (!respondModal) return;
    const { notification, action } = respondModal;
    const invitationId = notification.invitation?._id || notification.invitation;
    if (!invitationId) return;

    try {
      await respondInvitation({ invitationId: String(invitationId), action }).unwrap();
      try {
        await markAsRead(notification._id).unwrap();
      } catch {
        // already handled by server
      }
      refetch();
      setRespondModal({ notification, action, mode: 'done' });
    } catch (err: any) {
      setRespondModal((prev) =>
        prev
          ? {
              ...prev,
              mode: 'error',
              error: err.data?.message || `Failed to ${action} invitation`,
            }
          : prev
      );
    }
  };

  const openJoinedBoard = () => {
    const boardId =
      respondModal && respondModal.notification.board
        ? typeof respondModal.notification.board === 'string'
          ? respondModal.notification.board
          : respondModal.notification.board._id
        : undefined;
    setRespondModal(null);
    setIsOpen(false);
    if (boardId) navigate(`/boards/${boardId}`);
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      try {
        await markAsRead(notif._id).unwrap();
      } catch {
        // ignore
      }
    }

    if (
      (notif.type === 'TASK_MENTION' || notif.type === 'TASK_ASSIGNED') &&
      notif.board &&
      notif.task
    ) {
      const boardId = typeof notif.board === 'string' ? notif.board : notif.board._id;
      const taskId = typeof notif.task === 'string' ? notif.task : notif.task._id;
      navigate(`/boards/${boardId}`);
      dispatch(setActiveTaskId(taskId));
      setIsOpen(false);
    } else if (notif.type === 'BOARD_INVITATION' && notif.board) {
      const boardId = typeof notif.board === 'string' ? notif.board : notif.board._id;
      navigate(`/boards/${boardId}`);
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-mute hover:text-ink hover:bg-[color-mix(in_srgb,var(--text-1)_8%,transparent)] transition-all focus:outline-none cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[var(--card)] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="absolute right-0 top-12 w-80 sm:w-96 glass-card rounded-2xl border border-edge bg-card shadow-2xl z-50 overflow-hidden flex flex-col max-h-[80vh] text-ink"
          >
            {/* Dropdown Header */}
            <div className="p-3 border-b border-edge flex items-center justify-between bg-[color-mix(in_srgb,var(--surface)_90%,transparent)]">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-accent" />
                <h4 className="text-sm font-bold text-ink">Notifications</h4>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-accent/20 text-ink text-[10px] font-semibold border border-accent/40">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="text-[11px] font-semibold text-accent hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 divide-y divide-edge/40">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-faint text-xs italic">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      notif.isRead
                        ? 'bg-[color-mix(in_srgb,var(--surface)_50%,transparent)] hover:bg-[color-mix(in_srgb,var(--card-hover)_80%,transparent)]'
                        : 'bg-[color-mix(in_srgb,var(--accent)_12%,var(--card))] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] hover:bg-[color-mix(in_srgb,var(--accent)_18%,var(--card))]'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon type */}
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                          notif.type === 'BOARD_INVITATION'
                            ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                            : notif.type === 'TASK_ASSIGNED'
                              ? 'bg-sky-500/20 text-sky-500 border border-sky-500/30'
                              : 'bg-accent/20 text-accent border border-accent/30'
                        }`}
                      >
                        {notif.type === 'BOARD_INVITATION' ? (
                          <Mail className="w-4 h-4" />
                        ) : notif.type === 'TASK_ASSIGNED' ? (
                          <UserPlus className="w-4 h-4" />
                        ) : (
                          <AtSign className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-ink truncate">
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-faint shrink-0 ml-2">
                            {new Date(notif.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <p className="text-xs text-mute mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>

                        {/* If Board Invitation, render Accept/Decline while pending, or status once resolved */}
                        {notif.type === 'BOARD_INVITATION' && notif.invitation && (
                          notif.invitation.status === 'pending' ? (
                            <div className="flex items-center space-x-2 mt-2 pt-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openRespondModal(notif, 'accept');
                                }}
                                disabled={isResponding}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center space-x-1 shadow transition-all disabled:opacity-50 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Accept</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openRespondModal(notif, 'decline');
                                }}
                                disabled={isResponding}
                                className="px-2.5 py-1 rounded-lg border border-edge bg-surface hover:bg-rose-500/10 text-mute hover:text-rose-500 font-semibold text-[11px] flex items-center space-x-1 transition-all disabled:opacity-50 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                                <span>Decline</span>
                              </button>
                            </div>
                          ) : notif.invitation.status === 'accepted' ? (
                            <span className="inline-flex items-center space-x-1 mt-2 pt-1 text-[11px] font-semibold text-success px-2 py-1 rounded-lg bg-[color-mix(in_srgb,var(--success)_12%,transparent)] border border-[color-mix(in_srgb,var(--success)_30%,transparent)]">
                              <Check className="w-3 h-3" />
                              <span>Accepted — you're a member now</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 mt-2 pt-1 text-[11px] font-medium text-mute px-2 py-1 rounded-lg border border-edge bg-surface">
                              <X className="w-3 h-3" />
                              <span>Declined</span>
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Respond to Invitation Dialogue */}
      <AnimatePresence>
        {respondModal && (
          <div className="modal-scrim" onClick={closeRespondModal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm modal-panel p-6 relative"
            >
              {respondModal.mode === 'done' ? (
                <>
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3 bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-success border border-[color-mix(in_srgb,var(--success)_35%,transparent)]">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-ink">
                      {respondModal.action === 'accept'
                        ? 'Invitation Accepted!'
                        : 'Invitation Declined'}
                    </h3>
                    <p className="text-xs text-mute mt-1.5">
                      {respondModal.action === 'accept'
                        ? "You're now a member of the board and can collaborate in real time."
                        : 'You have declined this board invitation.'}
                    </p>
                  </div>
                  <div className="flex justify-center space-x-3">
                    {respondModal.action === 'accept' && (
                      <button
                        type="button"
                        onClick={openJoinedBoard}
                        className="btn btn-primary text-xs cursor-pointer"
                      >
                        Open Board
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={closeRespondModal}
                      className="btn btn-ghost text-xs cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={closeRespondModal}
                    className="icon-btn absolute top-4 right-4 cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-accent border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center justify-center">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-ink">
                        {respondModal.action === 'accept'
                          ? 'Accept Board Invitation'
                          : 'Decline Board Invitation'}
                      </h3>
                      <p className="text-xs text-mute">
                        {(respondModal.notification.invitation?.board as any)?.name ||
                          (respondModal.notification.invitation?.board as any)?.title ||
                          'Board'}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-mute mb-5">
                    {respondModal.action === 'accept'
                      ? 'Accepting will add you to this board as a collaborator and give you instant access.'
                      : 'Are you sure you want to decline this board invitation?'}
                  </p>

                  {respondModal.mode === 'error' && respondModal.error && (
                    <div className="notice notice-danger text-xs mb-3">{respondModal.error}</div>
                  )}

                  <div className="flex justify-end space-x-3 pt-3 border-t border-edge">
                    <button
                      type="button"
                      onClick={closeRespondModal}
                      className="btn btn-ghost text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmRespond}
                      disabled={isResponding}
                      className={
                        respondModal.action === 'accept'
                          ? 'btn btn-primary text-xs cursor-pointer'
                          : 'btn btn-danger text-xs cursor-pointer'
                      }
                    >
                      {isResponding ? (
                        'Please wait...'
                      ) : (
                        <>
                          {respondModal.action === 'accept' ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {respondModal.action === 'accept' ? 'Confirm Accept' : 'Confirm Decline'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
