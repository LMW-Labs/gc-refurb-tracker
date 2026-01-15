import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export default function PageContainer({ children, className, maxWidth = '2xl' }: PageContainerProps) {
  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-7xl',
  };

  return (
    <main className={cn('min-h-screen bg-gray-100 py-6 px-4', className)}>
      <div className={cn('mx-auto', maxWidths[maxWidth])}>
        {children}
      </div>
    </main>
  );
}
