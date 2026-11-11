// apps/frontend/src/components/ui/skeleton.jsx
import { forwardRef } from 'react';
import { cn } from '../../lib/utils.js';

const Skeleton = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('animate-pulse rounded-lg bg-gray-200', className)}
    {...props}
  />
));
Skeleton.displayName = 'Skeleton';

export default Skeleton;