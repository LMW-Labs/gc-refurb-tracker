import { Clock, Truck, PackageCheck, Wrench, CheckCircle, Archive } from 'lucide-react';
import type { RequestStatus } from '../../types';
import { STATUS_CONFIG } from '../../lib/constants';
import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: RequestStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const iconMap = {
  clock: Clock,
  truck: Truck,
  'package-check': PackageCheck,
  wrench: Wrench,
  'check-circle': CheckCircle,
  archive: Archive,
};

export default function StatusBadge({ status, size = 'md', showIcon = true, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = iconMap[config.icon as keyof typeof iconMap];

  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        config.bg,
        config.text,
        config.border,
        sizes[size],
        className
      )}
    >
      {showIcon && Icon && <Icon className={iconSizes[size]} />}
      {status}
    </span>
  );
}
