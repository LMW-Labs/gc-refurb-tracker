import type { Status } from '../../types';
import { STATUS_COLORS } from '../../lib/constants';
import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        colors.bg,
        colors.text,
        colors.border,
        status === 'Pending' && 'animate-pulse-pending',
        className
      )}
    >
      {status}
    </span>
  );
}
