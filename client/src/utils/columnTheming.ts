export type Priority = 'low' | 'medium' | 'high' | 'critical';

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: '#64748b',
  medium: '#3b82f6',
  high: '#f59e0b',
  critical: '#ef4444',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

const COLUMN_COLORS: Record<string, string> = {
  backlog: '#94a3b8',
  'back log': '#94a3b8',
  todo: '#3b82f6',
  'to do': '#3b82f6',
  'in progress': '#8b5cf6',
  'in-progress': '#8b5cf6',
  doing: '#8b5cf6',
  review: '#f59e0b',
  'in review': '#f59e0b',
  done: '#22c55e',
  completed: '#22c55e',
  archived: '#6b7280',
};

const DEFAULT_COLUMN_COLORS = ['#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#a855f7', '#eab308'];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function columnColor(name: string): string {
  const normalized = name.trim().toLowerCase();
  if (COLUMN_COLORS[normalized]) return COLUMN_COLORS[normalized];
  return DEFAULT_COLUMN_COLORS[hashString(normalized) % DEFAULT_COLUMN_COLORS.length];
}

export function priorityColor(priority: Priority | string | undefined): string {
  if (priority && priority in PRIORITY_COLORS) return PRIORITY_COLORS[priority as Priority];
  return PRIORITY_COLORS.medium;
}

export function priorityLabel(priority: Priority | string | undefined): string {
  if (priority && priority in PRIORITY_LABELS) return PRIORITY_LABELS[priority as Priority];
  return 'Medium';
}