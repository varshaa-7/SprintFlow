import { Status, Priority } from '@/types';

export const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; dot: string }> = {
  OPEN:        { label: 'Open',        color: 'text-blue-400',   bg: 'bg-blue-400/10',   dot: 'bg-blue-400' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-amber-400',  bg: 'bg-amber-400/10',  dot: 'bg-amber-400' },
  IN_REVIEW:   { label: 'In Review',   color: 'text-purple-400', bg: 'bg-purple-400/10', dot: 'bg-purple-400' },
  DONE:        { label: 'Done',        color: 'text-green-400',  bg: 'bg-green-400/10',  dot: 'bg-green-400' },
  CANCELLED:   { label: 'Cancelled',   color: 'text-zinc-500',   bg: 'bg-zinc-500/10',   dot: 'bg-zinc-500' },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; icon: string }> = {
  URGENT: { label: 'Urgent', color: 'text-red-400',    icon: '🔴' },
  HIGH:   { label: 'High',   color: 'text-orange-400', icon: '🟠' },
  MEDIUM: { label: 'Medium', color: 'text-yellow-400', icon: '🟡' },
  LOW:    { label: 'Low',    color: 'text-zinc-400',   icon: '⚪' },
};

export function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}
