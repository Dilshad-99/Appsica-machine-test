import React from "react";
import { useGetBoardActivityQuery } from "../../../api/activityApi";
import { useAppDispatch } from "../../../app/hooks";
import { toggleActivityDrawer } from "../boardSlice";
import { X, Activity as ActivityIcon, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface ActivityTimelineProps {
  boardId: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  boardId,
}) => {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetBoardActivityQuery(boardId);

  const activities = data?.data || [];

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed top-16 right-0 w-full sm:w-96 max-w-full h-[calc(100vh-4rem)] bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl z-40 flex flex-col"
    >
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ActivityIcon className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">Board Activity</h3>
        </div>
        <button
          onClick={() => dispatch(toggleActivityDrawer(false))}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-slate-800/50 animate-pulse"
              />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No activity recorded yet for this board.
          </div>
        ) : (
          activities.map((item) => (
            <div
              key={item._id}
              className="glass-card rounded-xl p-3 border border-slate-800/60 text-xs"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-indigo-300">
                  {item.user?.name || "User"}
                </span>
                <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
              </div>
              <p className="text-slate-300">{item.message || item.details}</p>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};
