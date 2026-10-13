import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logout } from '../features/auth/authSlice';
import { setSelectedProjectId } from '../features/board/boardSlice';
import { useGetBoardsQuery } from '../api/boardApi';
import {
  Kanban,
  LogOut,
  Building2,
  ChevronDown,
  Check,
  Plus,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeSwitcher from '../theme/ThemeSwitcher';
import { HeaderNotifications } from './HeaderNotifications';

export const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const selectedProjectId = useAppSelector((state) => state.board.selectedProjectId);
  const { data: boardsData } = useGetBoardsQuery();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const boards = boardsData?.data || [];
  const currentBoard = boards.find((b) => b._id === selectedProjectId) || (boards.length > 0 ? boards[0] : null);
  const currentProjectName = currentBoard?.name || currentBoard?.title || (boards.length > 0 ? (boards[0].name || boards[0].title) : 'Workspace');

  const isUserAdmin = boards.some((b) => {
    const oId = typeof b.owner === 'object' && b.owner !== null ? (b.owner as any)._id : b.owner;
    return String(oId) === String(user?._id);
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleSelectProject = (boardId: string | null) => {
    dispatch(setSelectedProjectId(boardId));
    setIsDropdownOpen(false);
  };

  return (
    <nav className="h-16 glass-panel border-x-0 border-t-0 border-b border-edge sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between text-ink select-none">
      {/* Left: Brand + Dynamic Project Selector */}
      <div className="flex items-center space-x-3 sm:space-x-5">
        <Link to="/dashboard" className="flex items-center space-x-2.5 group">
          <div className="brand-mark w-9 h-9">
            <Kanban className="w-5 h-5 text-current" />
          </div>
          <span className="font-black text-xl tracking-tight text-ink">
            TeamlyFy
          </span>
        </Link>

        {isAuthenticated && (
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center space-x-2">
              {/* Project Dropdown Button */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-edge bg-surface/70 hover:bg-card text-xs font-semibold text-ink transition-colors cursor-pointer"
                title="Select Project"
              >
                <Building2 className="w-3.5 h-3.5 text-faint" />
                <span className="max-w-[140px] truncate">{currentProjectName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-faint" />
              </button>

              {/* Role Badge */}
              {isUserAdmin ? (
                <div className="px-2.5 py-0.5 rounded-full bg-accent/20 text-ink border border-accent/40 text-[10px] font-bold uppercase tracking-wider">
                  ADMIN
                </div>
              ) : (
                <div className="px-2.5 py-0.5 rounded-full bg-blue-600/15 text-blue-700 dark:text-blue-300 border border-blue-500/35 text-[10px] font-bold uppercase tracking-wider">
                  MEMBER
                </div>
              )}
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="glass-panel absolute left-0 top-11 z-50 w-60 rounded-2xl p-1.5 shadow-2xl border border-edge bg-card text-ink">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-faint border-b border-edge">
                  Your Projects ({boards.length})
                </div>

                <div className="max-h-60 overflow-y-auto py-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => handleSelectProject(null)}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                      !selectedProjectId
                        ? 'bg-accent/20 text-ink font-semibold'
                        : 'text-ink hover:bg-[color-mix(in_srgb,var(--text-1)_6%,transparent)]'
                    }`}
                  >
                    <span className="truncate">All Projects Overview</span>
                    {!selectedProjectId && <Check className="w-3.5 h-3.5 text-accent" />}
                  </button>

                  {boards.map((b) => {
                    const isSelected = selectedProjectId === b._id;
                    const bName = b.name || b.title || 'Untitled';
                    return (
                      <button
                        key={b._id}
                        type="button"
                        onClick={() => handleSelectProject(b._id)}
                        className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                          isSelected
                            ? 'bg-accent/20 text-ink font-semibold'
                            : 'text-ink hover:bg-[color-mix(in_srgb,var(--text-1)_6%,transparent)]'
                        }`}
                      >
                        <span className="truncate">{bName}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-accent" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1 mt-1 border-t border-edge">
                  <Link
                    to="/boards"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold text-accent hover:text-ink hover:bg-[color-mix(in_srgb,var(--text-1)_6%,transparent)] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Manage All Projects</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Controls & User Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Dynamic Theme Switcher */}
        <ThemeSwitcher />

        {isAuthenticated && user ? (
          <div className="flex items-center space-x-2 sm:space-x-3 ml-1 sm:ml-2">
            {/* Header Notifications */}
            <HeaderNotifications />

            {/* User Profile Chip */}
            <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-full glass-panel border border-edge bg-card text-ink">
              <div className="avatar w-7 h-7 text-xs font-bold text-on-accent bg-accent shadow-sm flex items-center justify-center rounded-full">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <span className="text-xs sm:text-sm font-semibold text-ink max-w-[120px] truncate hidden sm:inline">
                {user.name}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="icon-btn text-danger hover:bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] hover:text-danger cursor-pointer"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Link to="/login" className="btn btn-ghost text-ink">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>
          </div>
        )}
      </div>

      {/* ─── Logout Confirmation Dialog (Rendered in Body Portal) ─── */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isLogoutModalOpen && (
              <div
                className="modal-scrim"
                style={{ zIndex: 9999 }}
                onClick={() => setIsLogoutModalOpen(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.18 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-sm modal-panel p-6 relative shadow-2xl bg-card border border-edge text-ink rounded-2xl"
                >
                  <button
                    type="button"
                    onClick={() => setIsLogoutModalOpen(false)}
                    className="icon-btn absolute top-3.5 right-3.5 text-mute hover:text-ink cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex flex-col items-center text-center space-y-3 pt-1">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center">
                      <LogOut className="w-6 h-6" />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-ink">
                        Log out of TeamlyFy?
                      </h3>
                      <p className="text-xs text-mute mt-1 leading-relaxed">
                        Are you sure you want to log out? You will need to sign back in to access your projects and tasks.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 w-full pt-3">
                      <button
                        type="button"
                        onClick={() => setIsLogoutModalOpen(false)}
                        className="btn btn-ghost flex-1 py-2 text-xs font-semibold cursor-pointer border border-edge hover:border-edge-strong"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogoutModalOpen(false);
                          handleLogout();
                        }}
                        className="btn btn-danger flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </nav>
  );
};