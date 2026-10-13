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
import { Bell, Mail, AtSign, Check, X, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const HeaderNotifications: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleRespond = async (
    e: React.MouseEvent,
    notification: AppNotification,
    action: 'accept' | 'decline'
  ) => {
    e.stopPropagation();
    const invitationId = notification.invitation?._id || notification.invitation;
    if (!invitationId) return;

    try {
      await respondInvitation({ invitationId: String(invitationId), action }).unwrap();
      await markAsRead(notification._id).unwrap();
    } catch (err: any) {
      alert(err.data?.message || 'Failed to respond to invitation');
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markAsRead(notif._id).unwrap();
    }

    if (notif.type === 'TASK_MENTION' && notif.board && notif.task) {
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
        className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-950 animate-pulse">
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
            className="absolute right-0 top-12 w-80 sm:w-96 glass-card rounded-2xl border border-slate-800 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Dropdown Header */}
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">Notifications</h4>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 divide-y divide-slate-800/40">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs italic">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      notif.isRead
                        ? 'bg-slate-900/30 hover:bg-slate-800/50'
                        : 'bg-indigo-950/40 border border-indigo-500/20 hover:bg-indigo-900/30'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon type */}
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                          notif.type === 'BOARD_INVITATION'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        }`}
                      >
                        {notif.type === 'BOARD_INVITATION' ? (
                          <Mail className="w-4 h-4" />
                        ) : (
                          <AtSign className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-white truncate">
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                            {new Date(notif.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>

                        {/* If Board Invitation, render direct Accept/Decline action buttons! */}
                        {notif.type === 'BOARD_INVITATION' && notif.invitation && (
                          <div className="flex items-center space-x-2 mt-2 pt-1">
                            <button
                              type="button"
                              onClick={(e) => handleRespond(e, notif, 'accept')}
                              disabled={isResponding}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center space-x-1 shadow transition-all disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" />
                              <span>Accept</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleRespond(e, notif, 'decline')}
                              disabled={isResponding}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 font-semibold text-[11px] flex items-center space-x-1 border border-slate-700 transition-all disabled:opacity-50"
                            >
                              <X className="w-3 h-3" />
                              <span>Decline</span>
                            </button>
                          </div>
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
    </div>
  );
};
