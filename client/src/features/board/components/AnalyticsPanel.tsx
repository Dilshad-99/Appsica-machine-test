import React from "react";
import type { Task, Column } from "../../../types";
import { useAppDispatch } from "../../../app/hooks";
import { toggleAnalyticsModal } from "../boardSlice";
import {
  X,
  BarChart2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Layers,
  Flame,
} from "lucide-react";
import { motion } from "framer-motion";
import { PRIORITY_COLORS } from "../../../utils/columnTheming";

interface AnalyticsPanelProps {
  tasks: Task[];
  columns: Column[];
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  tasks,
  columns,
}) => {
  const dispatch = useAppDispatch();

  const totalTasks = tasks.length;
  const criticalPriority = tasks.filter(
    (t) => t.priority === "critical",
  ).length;
  const highPriority = tasks.filter((t) => t.priority === "high").length;
  const mediumPriority = tasks.filter((t) => t.priority === "medium").length;
  const lowPriority = tasks.filter((t) => t.priority === "low").length;

  const doneColumn = columns.find(
    (c) =>
      c.name.toLowerCase().includes("done") ||
      c.name.toLowerCase().includes("completed"),
  );
  const doneTasksCount = doneColumn
    ? tasks.filter((t) => t.columnId === doneColumn._id).length
    : 0;

  const completionRate =
    totalTasks > 0 ? Math.round((doneTasksCount / totalTasks) * 100) : 0;

  const statCard = (
    icon: React.ReactNode,
    color: string,
    label: string,
    value: number,
  ) => (
    <div className="glass-card p-4 rounded-xl flex items-center space-x-3">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{
          background: `color-mix(in srgb, ${color} 12%, transparent)`,
          color,
        }}
      >
        {icon}
      </div>
      <div>
        <p className="text-meta text-xs text-mute">{label}</p>
        <p className="text-xl font-bold text-ink">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="modal-scrim">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 14 }}
        transition={{ duration: 0.28, ease: [0.22, 0.8, 0.32, 1] }}
        className="w-full max-w-lg modal-panel rounded-2xl p-6 relative"
      >
        <button
          onClick={() => dispatch(toggleAnalyticsModal(false))}
          className="icon-btn absolute top-4 right-4"
          aria-label="Close analytics"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "color-mix(in srgb, var(--accent) 18%, transparent)",
              color: "var(--accent)",
            }}
          >
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-card-title text-ink">Board Analytics</h3>
            <p className="text-meta text-xs text-mute">
              Overview of task metrics and column distribution
            </p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-2 text-xs font-semibold">
            <span className="text-mute">Completion Progress</span>
            <span className="font-bold" style={{ color: "var(--accent)" }}>
              {completionRate}%
            </span>
          </div>
          <div
            className="w-full h-3 rounded-full overflow-hidden"
            style={{ background: "var(--input-bg)" }}
          >
            <div
              className="grad-accent h-full rounded-full transition-all duration-500"
              style={{
                width: `${completionRate}%`,
                boxShadow: "0 0 12px var(--glow)",
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {statCard(
            <Layers className="w-5 h-5" />,
            "var(--accent)",
            "Total Tasks",
            totalTasks,
          )}
          {statCard(
            <CheckCircle className="w-5 h-5" />,
            "var(--success)",
            "Completed",
            doneTasksCount,
          )}
        </div>

        <div className="glass-card rounded-xl p-4">
          <h4 className="label mb-3">Priority Breakdown</h4>
          <div className="space-y-2.5 text-meta">
            <div className="flex items-center justify-between">
              <span
                className="flex items-center space-x-2"
                style={{ color: PRIORITY_COLORS.critical }}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Critical Priority</span>
              </span>
              <span className="font-bold text-ink">{criticalPriority}</span>
            </div>
            <div
              className="flex items-center justify-between"
              style={{ color: PRIORITY_COLORS.high }}
            >
              <span className="flex items-center space-x-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>High Priority</span>
              </span>
              <span className="font-bold text-ink">{highPriority}</span>
            </div>
            <div
              className="flex items-center justify-between"
              style={{ color: PRIORITY_COLORS.medium }}
            >
              <span className="flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Medium Priority</span>
              </span>
              <span className="font-bold text-ink">{mediumPriority}</span>
            </div>
            <div
              className="flex items-center justify-between"
              style={{ color: PRIORITY_COLORS.low }}
            >
              <span className="flex items-center space-x-2">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Low Priority</span>
              </span>
              <span className="font-bold text-ink">{lowPriority}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
