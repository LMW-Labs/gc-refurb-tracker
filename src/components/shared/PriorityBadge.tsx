import type { Priority } from '../../types';
import { PRIORITY_COLORS } from '../../lib/constants';
import { cn } from '../../lib/utils';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export default function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const colors = PRIORITY_COLORS[priority];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      {priority}
    </span>
  );
}
